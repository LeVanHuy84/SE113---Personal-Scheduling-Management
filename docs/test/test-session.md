# Test Specification: Session Management (Phase 1.4, Optional)

## Overview

Test cases for advanced session management with refresh tokens.

## Test Cases

### SESSION-01: Refresh Token Success

**Given** a valid refresh token
**When** POST /auth/refresh is called
**Then** returns 200 with new tokens

**Test Data:**

- refreshToken: valid refresh token

**Assertions:**

- Response status 200
- Response contains new accessToken, refreshToken
- Old refresh token invalidated
- New tokens are valid

### SESSION-02: Refresh Token Invalid

**Given** an invalid refresh token
**When** POST /auth/refresh is called
**Then** returns 401 Unauthorized

**Test Data:**

- refreshToken: "invalid-token"

**Assertions:**

- Response status 401
- No new tokens returned

### SESSION-03: Logout Success

**Given** authenticated user
**When** POST /auth/logout is called
**Then** returns 200 with success message

**Test Data:**

- Authorization: "Bearer <valid-token>"

**Assertions:**

- Response status 200
- Refresh tokens invalidated
- Success message returned

### SESSION-04: Logout with Specific Token

**Given** authenticated user and specific refresh token
**When** POST /auth/logout is called with refreshToken
**Then** returns 200

**Test Data:**

- Authorization: "Bearer <valid-token>"
- Body: { "refreshToken": "specific-token" }

**Assertions:**

- Response status 200
- Specified refresh token invalidated
- Other tokens remain valid

### SESSION-05: Access with Expired Token

**Given** an expired access token
**When** accessing protected route
**Then** returns 401 Unauthorized

**Test Data:**

- Authorization: "Bearer <expired-token>"

**Assertions:**

- Response status 401
- Route not accessible

### SESSION-06: Refresh with Expired Token

**Given** an expired refresh token
**When** POST /auth/refresh is called
**Then** returns 401 Unauthorized

**Test Data:**

- refreshToken: expired refresh token

**Assertions:**

- Response status 401
- No new tokens generated

## Test Setup

- Use test database
- Mock token expiry for testing
- Clean up tokens after tests

## References

- docs/api-contract/session.api.md
- docs/phases/phase-1.4-session.md
