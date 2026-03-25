# API Contract: User Profile

## Feature

- Name: user
- Primary module: User
- Related entities: User

## Related Use-cases

- UC-5: Manage Profile

## Endpoint 1: Get Current Profile

### Endpoint

- Method: GET
- URL: /profile
- Description: Retrieve profile of currently authenticated user.

### Request DTO

- None (JWT principal required).

### Response DTO

#### UserProfileResponseDto

| Field       | Type                | Description                |
| ----------- | ------------------- | -------------------------- |
| id          | uuid string         | User identifier            |
| email       | string              | Account email              |
| displayName | string              | Profile display name       |
| timezone    | string              | User timezone (IANA)       |
| createdAt   | ISO datetime string | Account creation timestamp |

### Business Rules Mapping

- BR-3: JWT required.
- BR-5: users can only access their own profile context.

### Error Cases

- 401 Unauthorized: invalid or missing JWT.
- 404 Not Found: user profile not found.

## Endpoint 2: Update Current Profile

### Endpoint

- Method: PUT
- URL: /profile
- Description: Update non-critical profile fields for authenticated user.

### Request DTO

#### UpdateProfileRequestDto

- The `id` field is derived from JWT payload `sub` via CurrentUser context

| Field       | Type   | Required | Validation                                                         |
| ----------- | ------ | -------- | ------------------------------------------------------------------ |
| displayName | string | No       | min length 1; max length 100, Must not be empty or whitespace-only |
| timezone    | string | No       | valid IANA timezone format; max length 64                          |

### Response DTO

#### UserProfileResponseDto

| Field       | Type                | Description              |
| ----------- | ------------------- | ------------------------ |
| id          | uuid string         | User identifier          |
| email       | string              | Account email            |
| displayName | string              | Updated profile name     |
| timezone    | string              | Updated user timezone    |
| updatedAt   | ISO datetime string | Profile update timestamp |

### Business Rules Mapping

- BR-3: JWT required.
- BR-5: users can only update their own profile.

### Error Cases

- 400 Bad Request: invalid displayName or timezone.
- 401 Unauthorized: invalid or missing JWT.
- 404 Not Found: user profile not found.

## Self Review

- User profile management use-case UC-5 is covered.
- No duplicated endpoints in this feature contract.
- Validation constraints map to business rules and database lengths.
- Naming is consistent with UpdateXRequestDto, XResponseDto pattern.
- No internal fields exposed.
