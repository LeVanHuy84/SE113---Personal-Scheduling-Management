# Skill: Implement JWT Authentication (Phase 1.1)

## Purpose

Provide guidelines for implementing **stateless JWT-based authentication** in NestJS, including user registration, email verification, and login.

---

## Tech Stack

- NestJS
- Prisma ORM
- JWT (Access Token + Verification Token)
- Bcrypt (password hashing)

---

## Core Concepts

### 1. Token Strategy

- Access Token: short-lived (15m – 1h)
- Verification Token: short-lived (e.g. 24h), **stateless (NOT stored in DB)**

### 2. Authentication Flow

1. User registers
2. Password is hashed
3. System generates verification JWT (NOT stored)
4. User verifies email via token
5. User logs in
6. Server validates credentials and returns accessToken

---

## Implementation Steps

### 1. Install Dependencies

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
```

### 2. Auth Module Structure

auth/
├── auth.controller.ts
├── auth.service.ts
├── jwt.strategy.ts
├── jwt.guard.ts
├── decorators/current-user.decorator.ts
├── dto/

### 3. Password Hashing

Use bcrypt. Never store plain text password.

```typescript
const hashed = await bcrypt.hash(password, 10);
```

###4. Validate User

```typescript
async validateUser(email: string, password: string) {
  const user = await this.prisma.user.findUnique({ where: { email } });

  if (!user) throw new UnauthorizedException();

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) throw new UnauthorizedException();

  if (!user.isVerified) {
    throw new ForbiddenException('Email not verified');
  }

  return user;
}
```

### 5. Generate Access Token

```typescript
const payload = { sub: user.id, email: user.email };

return {
  accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
  tokenType: 'Bearer',
  expiresIn: 900,
};
```

### 6. JWT Strategy

Extract token from Authorization header and validate payload.

```typescript
ExtractJwt.fromAuthHeaderAsBearerToken();
async validate(payload: any) {
  return { userId: payload.sub, email: payload.email };
}
```

### 7. Auth Guard

```typescript
@UseGuards(JwtAuthGuard)
```

### 8. CurrentUser Decorator

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### 9. Email Verification (Stateless JWT)

Database Schema

```prisma
model User {
  // ... existing fields
  isVerified Boolean @default(false)
}
```

## Generate Verification Token (NO DB STORAGE)

```typescript
async generateVerificationToken(userId: string) {
  return this.jwtService.sign(
    { sub: userId, type: 'verification' },
    { expiresIn: '24h' }
  );
}
```

## Verify Email

```typescript
async verifyEmail(token: string) {
  try {
    const payload = this.jwtService.verify(token);

    if (payload.type !== 'verification') {
      throw new BadRequestException();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new NotFoundException();
    }

    // Idempotent: allow repeated verification safely
    if (user.isVerified) {
      return { success: true, message: 'Email already verified' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    return {
      success: true,
      message: 'Email verified successfully',
    };
  } catch {
    throw new BadRequestException(
      'Invalid or expired verification token',
    );
  }
}
```

## Security Best Practices

- Hash passwords with bcrypt
- Use HTTPS
- Store JWT secret in environment variables
- Use short-lived tokens
- Do NOT store verification token in DB
- Ensure email must be verified before login
- Keep JWT payload minimal (sub, email)
- Common Pitfalls
- Storing plain password ❌
- Storing verification token in DB ❌
- Long-lived access token ❌
- Not checking isVerified before login ❌
- Not validating token type (type: verification) ❌
- Exposing sensitive fields in response ❌

## Notes

- Email verification is stateless and idempotent
- Token reuse is acceptable (safe due to isVerified check)
- This approach is suitable for MVP and scalable later

## References

- docs/api-contract/auth.api.md
- docs/database/database-design.md
- docs/phases/phase-1.1-core-auth.md

---
