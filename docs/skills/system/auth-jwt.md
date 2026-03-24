# Skill: Implement JWT Authentication

## Purpose

Provide guidelines for implementing authentication using JWT in NestJS.

---

## Tech Stack

- NestJS
- Prisma ORM
- JWT (Access + Refresh Token)
- Bcrypt (password hashing)

---

## Core Concepts

### 1. Token Strategy

- Access Token: short-lived (15m - 1h)
- Refresh Token: long-lived (7d - 30d)

### 2. Authentication Flow

1. User registers
2. Password is hashed
3. User logs in
4. Server validates credentials
5. Server returns:
   - accessToken
   - refreshToken

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
├── dto/

### 3. Password Hashing

Use bcrypt
Never store plain text password

```typescript
const hashed = await bcrypt.hash(password, 10);
```

### 4. Validate User

```typescript
async validateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new UnauthorizedException();

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) throw new UnauthorizedException();

  return user;
}
```

### 5. Generate Tokens

```typescript
const payload = { sub: user.id, email: user.email };

return {
  accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
  refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
};
```

### 6. JWT Strategy

Extract token from Authorization header
Validate payload

```typescript
ExtractJwt.fromAuthHeaderAsBearerToken();
```

### 7. Guard

Protect routes using JWT

```typescript
@UseGuards(JwtAuthGuard)
```

#### Security Best Practices

- Hash passwords with bcrypt
- Store refresh token hashed (optional but recommended)
- Use HTTPS
- Use environment variables for secrets
- Rotate refresh tokens

#### Common Pitfalls

- Storing plain password ❌
- Long-lived access token ❌
- Not validating token payload ❌
- Not handling token expiration ❌

#### References

- docs/api-contract/auth.api.md
- docs/database/database-design.md
- docs/phases/phase-1-auth.md
