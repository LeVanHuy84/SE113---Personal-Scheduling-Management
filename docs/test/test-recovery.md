# Test Specification: Password Recovery (Phase 1.2)

## Overview

Test cases for password reset functionality.

## Test Cases

### RECOVERY-01: Forgot Password Valid Email

**Given** a valid registered email
**When** POST /auth/forgot-password is called
**Then** returns 200 with success message

**Test Data:**

- email: "test@example.com" (existing user)

**Assertions:**

- Response status 200
- Response contains success: true
- Reset token generated and stored (hashed)

### RECOVERY-02: Forgot Password Invalid Email

**Given** a non-registered email
**When** POST /auth/forgot-password is called
**Then** returns 404 Not Found

**Test Data:**

- email: "nonexistent@example.com"

**Assertions:**

- Response status 404
- No reset token generated

### RECOVERY-03: Reset Password Valid Token

**Given** a valid reset token and new password
**When** POST /auth/reset-password is called
**Then** returns 200 with success message

**Test Data:**

- token: valid reset token
- newPassword: "NewValidPass123"

**Assertions:**

- Response status 200
- Password updated in database (hashed)
- Reset token invalidated

### RECOVERY-04: Reset Password Invalid Token

**Given** an invalid or expired reset token
**When** POST /auth/reset-password is called
**Then** returns 400 Bad Request

**Test Data:**

- token: "invalid-token"
- newPassword: "NewValidPass123"

**Assertions:**

- Response status 400
- Password not updated
- Error message indicates invalid token

### RECOVERY-05: Reset Password Expired Token

**Given** an expired reset token
**When** POST /auth/reset-password is called
**Then** returns 400 Bad Request

**Test Data:**

- token: expired reset token
- newPassword: "NewValidPass123"

**Assertions:**

- Response status 400
- Password not updated

### RECOVERY-06: Reset Password Weak Password

**Given** a valid token but weak password
**When** POST /auth/reset-password is called
**Then** returns 400 Bad Request

**Test Data:**

- token: valid reset token
- newPassword: "weak"

**Assertions:**

- Response status 400
- Password not updated
- Error message indicates password requirements

## Test Setup

- Use test database
- Mock email service if implemented
- Clean up reset tokens after tests

## References

- docs/api-contract/auth.api.md
- docs/phases/phase-1.2-recovery.md
