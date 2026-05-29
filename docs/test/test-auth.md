# Test Specification: Authentication (Phase 1.1)

## Overview

Test cases for core authentication functionality including registration and login.

## Test Cases

### AUTH-01: Register User Success

**Given** a valid registration request with unique email
**When** POST /auth/register is called
**Then** returns 201 with user data
**And** user is created in database with hashed password

**Test Data:**

- email: "test@example.com"
- password: "ValidPass123"
- displayName: "Test User"

**Assertions:**

- Response contains id, email, displayName, createdAt
- Password not returned in response
- User exists in database
- Password is hashed

### AUTH-02: Register User Duplicate Email

**Given** an email that already exists
**When** POST /auth/register is called
**Then** returns 409 Conflict

**Test Data:**

- email: existing user's email
- password: "ValidPass123"
- displayName: "Test User"

**Assertions:**

- Response status 409
- Error message indicates email already registered
- No new user created

### AUTH-03: Login Success

**Given** valid credentials for existing user
**When** POST /auth/login is called
**Then** returns 200 with JWT token

**Test Data:**

- email: registered user's email
- password: correct password

**Assertions:**

- Response contains accessToken, tokenType: "Bearer", expiresIn
- Token is valid JWT
- Token payload contains user id and email

### AUTH-04: Login Invalid Credentials

**Given** invalid email or password
**When** POST /auth/login is called
**Then** returns 401 Unauthorized

**Test Data:**

- email: "wrong@example.com"
- password: "wrongpassword"

**Assertions:**

- Response status 401
- Error message indicates invalid credentials

### AUTH-05: Protected Route with Valid Token

**Given** a valid JWT token
**When** accessing protected route with Authorization header
**Then** returns 200

**Test Data:**

- Authorization: "Bearer <valid-token>"

**Assertions:**

- Route accessible
- CurrentUser decorator returns correct user data

### AUTH-06: Protected Route with Invalid Token

**Given** an invalid or missing JWT token
**When** accessing protected route
**Then** returns 401 Unauthorized

**Test Data:**

- Authorization: "Bearer <invalid-token>" or missing

**Assertions:**

- Response status 401
- Route not accessible

### AUTH-07: Login with Unverified Email

**Given** valid credentials for user with unverified email
**When** POST /auth/login is called
**Then** returns 403 Forbidden

**Test Data:**

- email: unverified user's email
- password: correct password

**Assertions:**

- Response status 403
- Error message indicates email not verified

### AUTH-08: Verify Email Success

**Given** a valid verification token
**When** POST /auth/verify-email is called
**Then** returns 200 with success message

**Test Data:**

- token: valid verification token

**Assertions:**

- Response status 200
- Response contains success: true
- User marked as verified in database
- Verification token invalidated

### AUTH-09: Verify Email Invalid Token

**Given** an invalid verification token
**When** POST /auth/verify-email is called
**Then** returns 400 Bad Request

**Test Data:**

- token: "invalid-token"

**Assertions:**

- Response status 400
- Error message indicates invalid token
- User not marked as verified

### AUTH-10: Verify Email Already Used Token

**Given** a verification token that has already been used
**When** POST /auth/verify-email is called
**Then** returns 400 Bad Request

**Test Data:**

- token: previously used verification token

**Assertions:**

- Response status 400
- Error message indicates invalid token
- User remains unverified

## Test Setup

- Use test database
- Clean up after each test
- Clean up after each test
- Mock external dependencies if any

## References

- docs/api-contract/auth.api.md
- docs/phases/phase-1.1-core-auth.md
