# Phase 1.2 – Credential Recovery

## Goal

Implement secure password reset functionality using email-based token verification.

---

## Dependencies

- Phase 1.1 – Core Authentication
- Phase 1.1.1 – Email Service & Verification

---

## Scope

### In scope

- Forgot password (request reset)
- Reset password (confirm with token)
- Reset token generation and validation
- Token expiry rules (e.g., 15 minutes)
- Email dispatch using existing Mail Service

### Out of scope

- SMS notification dispatch

---

## APIs

### POST /auth/forgot-password

Request:
{
"email": "string"
}

Response (ALWAYS):
{
"success": true,
"message": "If the account exists, reset instructions sent",
"data": null
}

Notes:

- Must NOT reveal whether email exists (prevent user enumeration)

---

### POST /auth/reset-password

Request:
{
"token": "string",
"newPassword": "string"
}

Response:
{
"success": true,
"message": "Password reset successful",
"data": null
}

- Since the response goes through globalInterceptor, pay attention to the return value in the controller.

---

## Business Rules

- Reset token generated only for existing users
- Forgot password response must NOT reveal user existence
- Reset token must be valid and non-expired
- Reset token must be invalidated after successful use
- Only the latest reset token is valid (MVP simplification)
- New password must be hashed before update
- Reset email must be sent via Mail Service
- Secure communication (HTTPS) required

---

## Edge Cases

- Invalid email format
- Non-existing email (should still return success)
- Expired or invalid reset token
- Reused token after successful reset
- Weak new password

---

## Done Criteria

- User can request password reset
- Reset email is sent via Mail Service
- User can reset password with valid token
- Token expires after defined period (e.g., 15 minutes)
- Token becomes unusable after successful reset
- Forgot password does not expose user existence
- API matches docs/api-contract/auth.api.md (endpoints 5-6)

---

## Implementation Guidelines

- docs/skills/auth/auth-recovery.md
- docs/skills/infrastructure/email-service.md
- docs/skills/auth/auth-token-strategy.md
- docs/skills/system/module-structure-skill.md

---

## Notes

- Use separate JWT secret for reset tokens (not access token secret)
- Hash reset token before storing in database
- Do NOT return reset token in API response
- Reset flow must integrate with existing Mail Service (Phase 1.1.1)

---
