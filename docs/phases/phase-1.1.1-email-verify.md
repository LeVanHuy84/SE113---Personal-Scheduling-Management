# Phase 1.1.1 – Email Verification Delivery (Extension)

## Goal

Extend Phase 1.1 to send real email verification links to users after registration.

This phase MUST NOT change any existing authentication logic or database design.

---

## Scope

### In scope

- Send verification email after successful registration
- Create EmailService (infrastructure layer)
- Generate verification URL containing JWT token
- Use environment-based email configuration

### Out of scope

- Storing verification tokens in database
- Email templates management system
- Queue system (BullMQ, etc.)
- Resend verification endpoint (future phase)

---

## Key Constraints (CRITICAL)

- MUST keep verification token stateless (JWT)
- MUST NOT store verification token in DB
- MUST NOT modify verifyEmail logic
- MUST NOT break existing tests
- MUST follow module structure rules

---

## Implementation Requirements

### 1. Create Email Module

Structure:

email/
├── email.module.ts
├── email.service.ts

Rules:

- MUST be a separate module
- MUST be injectable
- MUST NOT contain business logic

---

### 2. EmailService

Responsibilities:

- Send verification email

Method:

sendVerificationEmail(input: {
to: string;
token: string;
displayName: string;
})

Implementation:

- Use Nodemailer
- Use SMTP config from environment variables

---

### 3. Environment Variables

Add:

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
FRONTEND_BASE_URL=http://localhost:3000

---

### 4. Verification Link

Format:

{FRONTEND_BASE_URL}/verify-email?token=<token>

---

### 5. Update AuthService (IMPORTANT)

Modify ONLY register method:

BEFORE:
await this.generateVerificationToken(user.id);

AFTER:

const token = await this.generateVerificationToken(user.id);

await this.emailService.sendVerificationEmail({
to: user.email,
token,
displayName: user.displayName,
});

Rules:

- MUST inject EmailService
- MUST NOT change other methods

---

### 6. Email Content

Simple HTML is sufficient:

- Greeting with displayName
- Verification link
- Expiration notice

---

### 7. Error Handling

- Email sending failure MUST NOT break registration
- Log error but still return success

---

### 8. Testing

- MUST NOT break existing tests
- EmailService can be mocked in tests

---

## Definition of Done

- User receives email after registration
- Email contains valid verification link
- Clicking link allows successful verification
- Existing Phase 1.1 tests still pass

---

## Notes

- This is an infrastructure extension, not a business logic change
- Designed for MVP (no queue, no retry)
- Can be extended later (Phase 2.x)

---

## References

- docs/phases/phase-1.1-core-auth.md
- docs/skills/auth/auth-jwt.md
- docs/skills/infrastructure/email-service.md
