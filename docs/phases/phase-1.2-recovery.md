# Phase 1.2 – Credential Recovery

## Goal

Implement password reset functionality for users who forgot their password.

---

## Scope

### In scope

- Forgot password (request reset)
- Reset password (confirm with token)
- Reset token generation and validation
- Token expiry rules (e.g., 15 minutes)

### Out of scope

- Email/SMS notification dispatch
- Advanced token security (e.g., one-time use)

---

## APIs

### POST /auth/forgot-password

Request:
{
"email": "string"
}

Response:
{
"success": true,
"message": "Reset instructions sent"
}

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
"message": "Password reset successful"
}

---

## Business Rules

- Reset token generated only for existing users
- Token must be valid and non-expired
- New password hashed before update
- Secure communication for reset workflow

---

## Edge Cases

- Invalid email for forgot password
- Expired or invalid reset token
- Weak new password

---

## Done Criteria

- User can request password reset
- User can reset password with valid token
- Token expires after defined period
- API matches docs/api-contract/auth.api.md (endpoints 3-4)
