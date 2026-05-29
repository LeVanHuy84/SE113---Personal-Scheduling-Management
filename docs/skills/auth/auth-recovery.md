# Skill: Implement Password Recovery (Phase 1.2)

## Purpose

Provide guidelines for implementing password reset functionality in NestJS.

---

## Tech Stack

- NestJS
- Prisma ORM
- JWT (for reset tokens)
- Bcrypt (password hashing)
- Nodemailer (for email, optional)

---

## Core Concepts

### 1. Reset Flow

1. User requests password reset with email
2. Server generates reset token
3. Server sends reset link/token to user
4. User submits new password with token
5. Server validates token and updates password

### 2. Token Strategy

- Reset Token: short-lived (15m - 1h)
- One-time use (invalidate after use)

---

## Implementation Steps

### 1. Database Schema

Add reset token fields to User model:

```prisma
model User {
  // ... existing fields
  resetToken     String?
  resetTokenExpiry DateTime?
}
```

### 2. Generate Reset Token

```typescript
async generateResetToken(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new NotFoundException();

  const resetToken = this.jwtService.sign(
    { sub: user.id, type: 'reset' },
    { expiresIn: '15m' }
  );

  // Store hashed token
  const hashedToken = await bcrypt.hash(resetToken, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashedToken,
      resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 min
    },
  });

  return resetToken; // Send this to user (email/SMS)
}
```

### 3. Validate Reset Token

```typescript
async validateResetToken(token: string) {
  try {
    const payload = this.jwtService.verify(token);
    if (payload.type !== 'reset') throw new BadRequestException();

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      throw new BadRequestException();
    }

    const isTokenValid = await bcrypt.compare(token, user.resetToken);
    const isNotExpired = user.resetTokenExpiry > new Date();

    if (!isTokenValid || !isNotExpired) {
      throw new BadRequestException();
    }

    return user;
  } catch (error) {
    throw new BadRequestException('Invalid or expired reset token');
  }
}
```

### 4. Reset Password

```typescript
async resetPassword(token: string, newPassword: string) {
  const user = await this.validateResetToken(token);

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return { success: true, message: 'Password reset successful' };
}
```

### 5. Controller Endpoints

```typescript
@Post('forgot-password')
async forgotPassword(@Body() dto: ForgotPasswordDto) {
  await this.authService.generateResetToken(dto.email);
  return { success: true, message: 'Reset instructions sent' };
}

@Post('reset-password')
async resetPassword(@Body() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto.token, dto.newPassword);
}
```

#### Security Best Practices

- Hash reset tokens before storing
- Short token expiry
- One-time use tokens
- Secure token transmission
- Rate limiting on reset requests

#### Common Pitfalls

- Storing plain reset tokens ❌
- No token expiry ❌
- Reusable tokens ❌
- No rate limiting ❌

#### References

- docs/api-contract/auth.api.md
- docs/phases/phase-1.2-recovery.md
