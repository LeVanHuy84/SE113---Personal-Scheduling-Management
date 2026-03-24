# API Contract: Auth

## Feature

- Name: auth
- Primary module: Auth
- Related entities: User, AuthAttempt

## Related Use-cases

- UC-1: User Registration
- UC-2: User Authentication (Login)
- UC-2.1: Email Verification
- UC-4: Reset Password

## Endpoint 1: Register User

### Endpoint

- Method: POST
- URL: /auth/register
- Description: Register a new account with unique email and hashed password.

### Request DTO

#### CreateAuthRegisterRequestDto

| Field       | Type   | Required | Validation                                                             |
| ----------- | ------ | -------- | ---------------------------------------------------------------------- |
| email       | string | Yes      | must be valid email format; max length 255; unique across users (BR-1) |
| password    | string | Yes      | min length 8; max length 255; stored hashed only (BR-32)               |
| displayName | string | Yes      | min length 1; max length 100                                           |

### Response DTO

#### AuthRegisterResponseDto

| Field       | Type                | Description                |
| ----------- | ------------------- | -------------------------- |
| id          | uuid string         | User identifier            |
| email       | string              | Registered email           |
| displayName | string              | Profile display name       |
| createdAt   | ISO datetime string | Account creation timestamp |

### Business Rules Mapping

- BR-1: email uniqueness enforced before insert.
- BR-32: password hashed before persistence.
- BR-31: endpoint served over HTTPS transport.

### Error Cases

- 400 Bad Request: invalid email/password/displayName format.
- 409 Conflict: email already registered.
- 500 Internal Server Error: persistence failure.

## Endpoint 2: Login

### Endpoint

- Method: POST
- URL: /auth/login
- Description: Authenticate user and issue JWT access token.

### Request DTO

#### CreateAuthLoginRequestDto

| Field    | Type   | Required | Validation                                 |
| -------- | ------ | -------- | ------------------------------------------ |
| email    | string | Yes      | must be valid email format; max length 255 |
| password | string | Yes      | required; max length 255                   |

### Response DTO

#### AuthLoginResponseDto

| Field       | Type   | Description          |
| ----------- | ------ | -------------------- |
| accessToken | string | JWT access token     |
| tokenType   | string | Bearer               |
| expiresIn   | number | Token TTL in seconds |

### Business Rules Mapping

- BR-2: credentials must be valid.
- BR-3: JWT used for authenticated sessions.
- BR-4: token expiry enforced.
- BR-33: authentication attempt logged.

### Error Cases

- 400 Bad Request: malformed credentials payload.
- 401 Unauthorized: invalid credentials.
- 403 Forbidden: account state disallows login (e.g., email not verified).
- 500 Internal Server Error: token generation or logging failure.

## Endpoint 3: Verify Email

### Endpoint

- Method: POST
- URL: /auth/verify-email
- Description: Verify user email using verification token.

### Request DTO

#### CreateVerifyEmailRequestDto

| Field | Type   | Required | Validation                          |
| ----- | ------ | -------- | ----------------------------------- |
| token | string | Yes      | non-empty; valid verification token |

### Response DTO

#### VerifyEmailResponseDto

| Field   | Type    | Description         |
| ------- | ------- | ------------------- |
| success | boolean | Verification result |
| message | string  | Verification status |

### Business Rules Mapping

- BR-1: verification token must be valid and non-expired.
- BR-2: user account marked as verified on success.
- BR-3: verification token invalidated after use.

### Error Cases

- 400 Bad Request: invalid or expired token.
- 404 Not Found: token does not correspond to user.
- 500 Internal Server Error: verification update failure.

## Endpoint 4: Request Password Reset

### Endpoint

- Method: POST
- URL: /auth/forgot-password
- Description: Request password reset using registered email.

### Request DTO

#### CreatePasswordResetRequestDto

| Field | Type   | Required | Validation                         |
| ----- | ------ | -------- | ---------------------------------- |
| email | string | Yes      | valid email format; max length 255 |

### Response DTO

#### PasswordResetRequestResponseDto

| Field   | Type    | Description              |
| ------- | ------- | ------------------------ |
| success | boolean | Request accepted result  |
| message | string  | Reset instruction status |

### Business Rules Mapping

- UC-4 flow: reset link/token generated only for existing user.
- BR-31: reset workflow communicated securely.

### Error Cases

- 400 Bad Request: invalid email format.
- 404 Not Found: email not registered.
- 500 Internal Server Error: reset token persistence or notification dispatch failure.

## Endpoint 5: Reset Password

### Endpoint

- Method: POST
- URL: /auth/reset-password
- Description: Reset password using issued reset token.

### Request DTO

#### CreateConfirmPasswordResetRequestDto

| Field       | Type   | Required | Validation                                               |
| ----------- | ------ | -------- | -------------------------------------------------------- |
| token       | string | Yes      | non-empty; must map to valid non-expired reset token     |
| newPassword | string | Yes      | min length 8; max length 255; stored hashed only (BR-32) |

### Response DTO

#### PasswordResetResponseDto

| Field   | Type    | Description            |
| ------- | ------- | ---------------------- |
| success | boolean | Reset operation result |
| message | string  | Password reset status  |

### Business Rules Mapping

- BR-32: new password hashed before update.
- UC-4: token validity and expiry checked before password update.

### Error Cases

- 400 Bad Request: invalid or expired token, weak password.
- 404 Not Found: token does not map to user.
- 500 Internal Server Error: password update failure.

## Self Review

- All auth use-cases UC-1, UC-2, UC-2.1, UC-4 are covered.
- No duplicated endpoints in this feature contract.
- Validation constraints map to business rules and database lengths.
- Naming is consistent with CreateXRequestDto, UpdateXRequestDto, XResponseDto pattern.
- No internal fields exposed (no passwordHash, reset internals, auth log internals).
