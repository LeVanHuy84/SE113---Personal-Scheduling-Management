# Phase 1.3 – User Profile

## Goal

Implement user profile management for authenticated users.

---

## Scope

### In scope

- GET /profile (retrieve current user profile)
- PUT /profile (update profile fields)
- JWT authentication required
- Ownership rules (user can only access/modify self)

### Out of scope

- Admin profile management
- Profile search/filter

---

## APIs

### GET /profile

Request: None (JWT required)

Response:
{
"id": "uuid",
"email": "string",
"displayName": "string",
"timezone": "string",
"createdAt": "ISO datetime"
}

---

### PUT /profile

Request:
{
"displayName": "string (optional)",
"timezone": "string (optional, IANA timezone)"
}

Response:
{
"id": "uuid",
"email": "string",
"displayName": "string",
"timezone": "string",
"updatedAt": "ISO datetime"
}

---

## Business Rules

- JWT required for all endpoints
- Users can only access/modify their own profile
- Email cannot be changed via profile update
- Validation on displayName and timezone

---

### Current User Context

- JWT payload contains: sub (userId), email
- After validation, request.user is mapped to:

{
userId: string;
email: string;
}

- All profile operations MUST use userId from CurrentUser context
- MUST NOT read userId from request params or body

## Edge Cases

- Missing JWT
- Invalid JWT
- User not found
- Invalid profile data

---

## Done Criteria

- Authenticated user can retrieve profile
- Authenticated user can update profile fields
- Ownership enforced (cannot access other users' profiles)
- API matches docs/api-contract/user.api.md

## Reference

- docs\skills\system\module-structure-skill.md
- docs\skills\system\user-profile.md
- Database: prisma\schema.prisma
- docs\ARCHITECTURE.md
