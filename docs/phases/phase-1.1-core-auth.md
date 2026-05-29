# Phase 1.1 – Core Authentication (MVP)

## Goal

Implement JWT-based authentication for user registration, email verification, and login.

---

## Scope

### In scope

- Register
- Email verification
- Login
- JWT access token generation
- Auth Guard
- CurrentUser decorator

### Out of scope

- OAuth
- Refresh token
- Logout
- Password reset
- User profile management

---

## Authentication Flow

1. User registers → account created with `isVerified = false`
2. System generates verification JWT token (stateless, NOT stored in DB)
3. User verifies email → account marked as `isVerified = true`
4. User can login → receives JWT token

---

## APIs

### POST /auth/register

Request:
{
"email": "string",
"password": "string",
"displayName": "string"
}

Response:
{
"id": "uuid",
"email": "string",
"displayName": "string",
"createdAt": "ISO datetime"
}

---

### POST /auth/verify-email

Request:
{
"token": "string"
}

Response:
{
"success": true,
"message": "Email verified successfully"
}

---

### POST /auth/login

Request:
{
"email": "string",
"password": "string"
}

Response:
{
"accessToken": "string",
"tokenType": "Bearer",
"expiresIn": 3600
}

---

## Business Rules

- Email must be unique
- Password must be hashed (bcrypt)
- User account created with `isVerified = false`
- Email verification required before login
- JWT required for protected routes
- Token expiry enforced
- Verification token MUST be stateless (JWT) and MUST NOT be stored in database

---

## Edge Cases

- Duplicate email registration
- Invalid login credentials
- Login with unverified email
- Invalid verification token
- Missing or invalid JWT on protected routes

---

## Done Criteria

- User can register with unique email
- User account created as unverified
- Email verification endpoint works
- User cannot login if email not verified
- Verified user can login and receive JWT
- JWT guard protects routes
- CurrentUser decorator extracts user from token
- API matches docs/api-contract/auth.api.md (endpoints 1-3)

---

## Testing Requirements

The implementation MUST include automated tests.

### Scope

- Unit tests for AuthService
- Integration tests for AuthController

### Test Coverage Requirements

Tests MUST cover:

- Successful registration
- Duplicate email registration
- Successful email verification
- Invalid / expired verification token
- Login success (verified user)
- Login failure (wrong password)
- Login failure (unverified email)
- JWT guard protects endpoints
- CurrentUser decorator extracts user

### Test Source of Truth

- docs/test/test-auth.md

### Constraints

- MUST use testing setup defined in docs/skills/system/setup-testing.md
- MUST NOT mock critical business logic incorrectly
- MUST assert response shape matches API contract

---

## References

The implementation MUST follow the documents below:

### API Contract

- docs/api-contract/auth.api.md (Endpoints 1–3)

### Implementation Guidelines

- docs/skills/auth/auth-jwt.md
- docs/skills/system/module-structure-skill.md

### Database Design

- docs/database/database-design.md

### Test Specification

- docs/test/test-auth.md

### Related Phase

- docs/phases/phase-1.2-recovery.md (out of scope for this phase)
