# Skill: Hybrid Session (JWT + Redis)

## Purpose

Implement secure refresh token flow with revocation using Redis.

---

## Core Concepts

### Token Strategy

- Access Token: 15m
- Refresh Token: 7d
- Each refresh token has unique jti

---

## 🔥 IMPORTANT RULES

- MUST use jti (UUID) per refresh token
- MUST store revoked jti in Redis
- MUST rotate refresh token
- MUST revoke old token after refresh

---

## Redis Key Design

refresh:blacklist:{jti} → TTL = remaining lifetime

---

## Implementation

### Generate Tokens

```typescript
import { v4 as uuidv4 } from 'uuid';

async generateTokens(user: User) {
  const jti = uuidv4();

  const accessToken = this.jwtService.sign(
    { sub: user.id, email: user.email },
    {
      expiresIn: '15m',
      secret: process.env.JWT_ACCESS_SECRET,
    }
  );

  const refreshToken = this.jwtService.sign(
    { sub: user.id, type: 'refresh', jti },
    {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET,
    }
  );

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: 900,
    refreshToken,
  };
}
```

### Refresh Token (Rotation + Blacklist)

```typescript
async refreshToken(oldToken: string) {
  try {
    const payload = this.jwtService.verify(oldToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    if (payload.type !== 'refresh' || !payload.jti) {
      throw new UnauthorizedException();
    }

    // 🔥 Check blacklist
    const isBlacklisted = await this.redis.get(
      `refresh:blacklist:${payload.jti}`
    );

    if (isBlacklisted) {
      throw new UnauthorizedException('Token reuse detected');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) throw new UnauthorizedException();

    // 🔥 Revoke old token
    const ttl = payload.exp - Math.floor(Date.now() / 1000);
    await this.redis.set(
      `refresh:blacklist:${payload.jti}`,
      'revoked',
      'EX',
      ttl
    );

    // 🔥 Issue new tokens
    return this.generateTokens(user);
  } catch {
    throw new UnauthorizedException('Invalid refresh token');
  }
}
```

### Logout

```typescript
async logout(refreshToken: string) {
  try {
    const payload = this.jwtService.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    const ttl = payload.exp - Math.floor(Date.now() / 1000);

    await this.redis.set(
      `refresh:blacklist:${payload.jti}`,
      'revoked',
      'EX',
      ttl
    );

    return {
      success: true,
      message: 'Logged out successfully',
    };
  } catch {
    return {
      success: true, // avoid leaking info
      message: 'Logged out successfully',
    };
  }
}
```

### Security Advantages

- Prevent replay attack (rotation + blacklist)
- Immediate logout effect
- No DB dependency
- Scales horizontally

### Common Pitfalls

Do not use JTI
Do not set TTL in Redis
Do not rotate tokens
Use the same secret for access and refresh
