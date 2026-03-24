# Test Specification: User Profile (Phase 1.3)

## Overview

Test cases for user profile management functionality.

## Test Cases

### USER-01: Get Profile Success

**Given** authenticated user
**When** GET /profile is called
**Then** returns 200 with user profile data

**Test Data:**

- Authorization: "Bearer <valid-token>"

**Assertions:**

- Response status 200
- Response contains id, email, displayName, avatarUrl, createdAt
- Data matches authenticated user

### USER-02: Get Profile Unauthorized

**Given** no or invalid JWT
**When** GET /profile is called
**Then** returns 401 Unauthorized

**Test Data:**

- Authorization: missing or invalid

**Assertions:**

- Response status 401
- No profile data returned

### USER-03: Update Profile Success

**Given** authenticated user and valid update data
**When** PUT /profile is called
**Then** returns 200 with updated profile

**Test Data:**

- Authorization: "Bearer <valid-token>"
- Body: { "displayName": "New Name" }

**Assertions:**

- Response status 200
- Profile updated in database
- Response contains updated data and updatedAt

### USER-04: Update Profile Partial

**Given** authenticated user and partial update data
**When** PUT /profile is called
**Then** returns 200 with partially updated profile

**Test Data:**

- Authorization: "Bearer <valid-token>"
- Body: { "avatarUrl": "http://example.com/avatar.jpg" }

**Assertions:**

- Response status 200
- Only specified fields updated
- Other fields unchanged

### USER-05: Update Profile Invalid Data

**Given** authenticated user and invalid update data
**When** PUT /profile is called
**Then** returns 400 Bad Request

**Test Data:**

- Authorization: "Bearer <valid-token>"
- Body: { "displayName": "" } (empty string)

**Assertions:**

- Response status 400
- Profile not updated
- Error message indicates validation failure

### USER-06: Update Profile Not Found

**Given** authenticated user that no longer exists
**When** PUT /profile is called
**Then** returns 404 Not Found

**Test Data:**

- Authorization: "Bearer <valid-token-for-deleted-user>"

**Assertions:**

- Response status 404
- Profile not updated

## Test Setup

- Use test database
- Create test users with JWT tokens
- Clean up after each test

## References

- docs/api-contract/user.api.md
- docs/phases/phase-1.3-user-profile.md
