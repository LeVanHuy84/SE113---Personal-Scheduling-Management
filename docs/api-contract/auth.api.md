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

| Field       | Type   | Required | Constraints                                                                                                                       |
| ----------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| email       | string | Yes      | - Must be valid email format<br>- Max length: 255<br>- Must be unique (BR-1)<br>- Case-insensitive                                |
| password    | string | Yes      | - Min length: 8<br>- Max length: 255<br>- Should include at least 1 letter and 1 number (recommended)<br>- Stored as hash (BR-32) |
| displayName | string | Yes      | - Min length: 1<br>- Max length: 100<br>- Must not be blank or whitespace-only                                                    |

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

| Field    | Type   | Required | Constraints                               |
| -------- | ------ | -------- | ----------------------------------------- |
| email    | string | Yes      | - Valid email format<br>- Max length: 255 |
| password | string | Yes      | - Required<br>- Max length: 255           |

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

| Field | Type   | Required | Constraints                                                                                        |
| ----- | ------ | -------- | -------------------------------------------------------------------------------------------------- |
| token | string | Yes      | - Must not be empty<br>- Must be valid token format (JWT/UUID tùy design)<br>- Must not be expired |

### Response DTO

#### VerifyEmailResponseDto

| Field   | Type   | Description                       |
| ------- | ------ | --------------------------------- |
| message | string | Top-level verification status     |
| data    | null   | No payload body for this endpoint |

### Business Rules Mapping

- BR-1: verification token must be valid and non-expired.
- BR-2: user account marked as verified on success.
- BR-3: verification token invalidated after use.

### Error Cases

- 400 Bad Request: invalid or expired token.
- 404 Not Found: token does not correspond to user.
- 500 Internal Server Error: verification update failure.

## Endpoint 4: Resend Verification Email

### Endpoint

- Method: POST
- URL: /auth/resend-verification-email
- Description: Resend email verification link for unverified accounts.

### Request DTO

#### CreateResendVerificationEmailRequestDto

| Field | Type   | Required | Constraints                               |
| ----- | ------ | -------- | ----------------------------------------- |
| email | string | Yes      | - Valid email format<br>- Max length: 255 |

### Response DTO

#### ResendVerificationEmailResponseDto

| Field   | Type   | Description                                                                                               |
| ------- | ------ | --------------------------------------------------------------------------------------------------------- |
| message | string | Generic top-level status: "If the account exists and is not verified, a verification email has been sent" |
| data    | null   | No payload body for this endpoint                                                                         |

### Business Rules Mapping

- BR-1: resend check uses unique user email lookup.
- BR-31: resend workflow communicated securely.

### Error Cases

- 400 Bad Request: invalid email format.
- 500 Internal Server Error: token generation failure.

## Endpoint 5: Request Password Reset

### Endpoint

- Method: POST
- URL: /auth/forgot-password
- Description: Request password reset using registered email.

### Request DTO

#### CreatePasswordResetRequestDto

| Field | Type   | Required | Constraints                               |
| ----- | ------ | -------- | ----------------------------------------- |
| email | string | Yes      | - Valid email format<br>- Max length: 255 |

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

## Endpoint 6: Reset Password

### Endpoint

- Method: POST
- URL: /auth/reset-password
- Description: Reset password using issued reset token.

### Request DTO

#### CreateConfirmPasswordResetRequestDto

| Field       | Type   | Required | Constraints                                                                                          |
| ----------- | ------ | -------- | ---------------------------------------------------------------------------------------------------- |
| token       | string | Yes      | - Must not be empty<br>- Must map to valid reset token<br>- Must not be expired                      |
| newPassword | string | Yes      | - Min length: 8<br>- Max length: 255<br>- Should include complexity rule<br>- Stored as hash (BR-32) |

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

## Endpoint 7: Refresh Access Token

### Endpoint

- Method: POST
- URL: /auth/refresh
- Description: Refresh access token using valid refresh token.

### Request DTO

#### CreateAuthRefreshRequestDto

| Field        | Type   | Required | Constraints                                                                                  |
| ------------ | ------ | -------- | -------------------------------------------------------------------------------------------- |
| refreshToken | string | Yes      | - Must be valid token<br>- Must not be expired<br>- Must match stored token (rotation check) |

### Response DTO

#### AuthRefreshResponseDto

| Field        | Type   | Description          |
| ------------ | ------ | -------------------- |
| accessToken  | string | New JWT access token |
| tokenType    | string | Bearer               |
| expiresIn    | number | Token TTL in seconds |
| refreshToken | string | New refresh token    |

### Business Rules Mapping

- BR-3: refresh token used for new access token.
- BR-4: token rotation applied.

### Error Cases

- 400 Bad Request: invalid refresh token.
- 401 Unauthorized: expired or invalid refresh token.
- 500 Internal Server Error: token generation failure.

## Endpoint 8: Logout

### Endpoint

- Method: POST
- URL: /auth/logout
- Description: Terminate current authenticated session.

### Request DTO

#### CreateAuthLogoutRequestDto

| Field        | Type   | Required | Constraints                         |
| ------------ | ------ | -------- | ----------------------------------- |
| refreshToken | string | Yes      | - Must be valid token               |

### Response DTO

#### AuthLogoutResponseDto

| Field   | Type    | Description                  |
| ------- | ------- | ---------------------------- |
| success | boolean | Logout operation result      |
| message | string  | Human-readable logout status |

### Business Rules Mapping

- BR-3: logout endpoint requires JWT authentication.
- BR-4: token invalidation/expiry policy applied on session close.

### Error Cases

- 401 Unauthorized: missing or invalid access token.
- 500 Internal Server Error: session invalidation failure.

## Self Review

- All auth use-cases UC-1, UC-2, UC-2.1, UC-4 are covered.
- No duplicated endpoints in this feature contract.
- Validation constraints map to business rules and database lengths.
- Naming is consistent with CreateXRequestDto, UpdateXRequestDto, XResponseDto pattern.
- No internal fields exposed (no passwordHash, reset internals, auth log internals).
