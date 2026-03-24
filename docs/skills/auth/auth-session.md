# Skill: Implement Session Management (Phase 1.4, Optional)

## Purpose

Provide guidelines for implementing advanced session management with refresh tokens in NestJS.

---

## Tech Stack

- NestJS
- Prisma ORM
- JWT (Access + Refresh Tokens)
- Bcrypt (token hashing)

---

## Core Concepts

### 1. Token Strategy

- Access Token: short-lived (15m - 1h)
- Refresh Token: long-lived (7d - 30d)
- Token rotation for security

### 2. Session Flow

1. Login returns access + refresh tokens
2. Access token used for API calls
3. Refresh token used to get new access token
4. Logout invalidates refresh token

---

## Implementation Steps

### 1. Database Schema

Add refresh token storage:

```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@map("refresh_tokens")
}
```

### 2. Generate Tokens

```typescript
async generateTokens(user: User) {
  const payload = { sub: user.id, email: user.email };

  const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
  const refreshToken = this.jwtService.sign(
    { sub: user.id, type: 'refresh' },
    { expiresIn: '7d' }
  );

  // Store hashed refresh token
  const hashedRefresh = await bcrypt.hash(refreshToken, 10);
  await this.prisma.refreshToken.create({
    data: {
      token: hashedRefresh,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: 900,
    refreshToken, // Send plain token to client
  };
}
```

### 3. Refresh Token

```typescript
async refreshToken(refreshToken: string) {
  try {
    const payload = this.jwtService.verify(refreshToken);
    if (payload.type !== 'refresh') throw new BadRequestException();

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub },
    });

    if (!storedToken) throw new UnauthorizedException();

    const isValid = await bcrypt.compare(refreshToken, storedToken.token);
    const isExpired = storedToken.expiresAt < new Date();

    if (!isValid || isExpired) throw new UnauthorizedException();

    // Token rotation: invalidate old, create new
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    return this.generateTokens(user);
  } catch (error) {
    throw new UnauthorizedException('Invalid refresh token');
  }
}
```

### 4. Logout

```typescript
async logout(userId: string, refreshToken?: string) {
  if (refreshToken) {
    // Invalidate specific token
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.refreshToken.deleteMany({
      where: { userId, token: hashedToken },
    });
  } else {
    // Invalidate all user's tokens
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  return { success: true, message: 'Logged out successfully' };
}
```

### 5. Controller Endpoints

```typescript
@Post('refresh')
async refresh(@Body() dto: RefreshTokenDto) {
  return this.authService.refreshToken(dto.refreshToken);
}

@Post('logout')
@UseGuards(JwtAuthGuard)
async logout(
  @CurrentUser() user: { id: string },
  @Body() dto: LogoutDto
) {
  return this.authService.logout(user.id, dto.refreshToken);
}
```

#### Security Best Practices

- Hash refresh tokens in database
- Token rotation on refresh
- Short-lived access tokens
- Secure token storage on client
- Logout invalidates tokens

#### Common Pitfalls

- Storing plain refresh tokens ❌
- No token rotation ❌
- Long-lived access tokens ❌
- No logout invalidation ❌

#### References

- docs/api-contract/session.api.md
- docs/phases/phase-1.4-session.md
