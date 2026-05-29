# Phase 1.4 – Secure Token Session (Hybrid: JWT + Redis)

## Goal

Implement secure session management using JWT with Redis-based revocation and token rotation.

---

## Scope

### In scope

- Refresh token (JWT)
- Token rotation
- Logout with token revocation (Redis)
- Blacklist mechanism

### Out of scope

- Full session storage in DB
- Multi-device session tracking (optional future)

---

## APIs

### POST /auth/refresh

Request:
{
"refreshToken": "string"
}

Response:
{
"accessToken": "string",
"tokenType": "Bearer",
"expiresIn": 900,
"refreshToken": "string"
}

---

### POST /auth/logout

Request:
{
"refreshToken": "string"
}

Response:
{
"success": true,
"message": "Logged out successfully"
}

---

## Business Rules

- Refresh token MUST be JWT
- MUST include:
  - sub (userId)
  - type = refresh
  - jti (unique token id)
- Redis MUST store revoked token identifiers (jti)
- Refresh token MUST be rotated on each refresh
- Old refresh token MUST be revoked after rotation
- Access token remains stateless

---

## Edge Cases

- Refresh token reused after rotation (replay attack)
- Token exists in blacklist
- Expired token
- Invalid signature
- Missing jti

---

## Done Criteria

- Refresh token works with rotation
- Old tokens cannot be reused
- Logout revokes refresh token via Redis
- Blacklist enforced on refresh
- API matches docs/api-contract/session.api.md

---

## Notes

- Redis is used as ephemeral store (TTL = token expiry)
- System remains mostly stateless
- Suitable for scalable production systems

## Reference

- docs\skills\auth\auth-session.md
- docs\test\test-session.md
