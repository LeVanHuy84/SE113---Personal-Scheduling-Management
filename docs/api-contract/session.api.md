# API Contract: Session Management (Optional)

## Feature

- Name: session
- Primary module: Auth
- Related entities: User, RefreshToken

## Related Use-cases

- UC-3: User Logout

## Endpoint 1: Logout

### Endpoint

- Method: POST
- URL: /auth/logout
- Description: Terminate current authenticated session.

### Request DTO

#### CreateAuthLogoutRequestDto

| Field        | Type   | Required | Constraints                         |
| ------------ | ------ | -------- | ----------------------------------- |
| refreshToken | string | No       | - If provided → must be valid token |

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

## Endpoint 2: Refresh Token (High-level)

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

## Self Review

- Session management use-case UC-3 is covered.
- No duplicated endpoints in this feature contract.
- Validation constraints map to business rules.
- Naming is consistent with CreateXRequestDto, XResponseDto pattern.
- No internal fields exposed.
