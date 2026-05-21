# API Contract: Tag

## Feature

- Name: tag
- Primary module: Tag
- Related entities: Tag, AppointmentSeries, SeriesTag

## Related Use-cases

- UC-14: Create and manage tags
- UC-13: Search and filter appointments through series tags

## Endpoint 1: Create Tag

### Endpoint

- Method: POST
- URL: /tags
- Description: Create a new tag for the current user.

### Request DTO

#### CreateTagRequestDto

| Field | Type   | Required | Validation                                   |
| ----- | ------ | -------- | -------------------------------------------- |
| name  | string | Yes      | min length 1; max length 50; unique per user |
| color | string | No       | hex color; max length 16                     |

### Response DTO

#### TagResponseDto

| Field | Type            | Description    |
| ----- | --------------- | -------------- |
| id    | uuid string     | Tag identifier |
| name  | string          | Tag name       |
| color | string nullable | Tag color      |

### Business Rules Mapping

- BR-19: tag names must be unique per user.
- BR-5: users can manage only their own tags.

### Error Cases

- 400 Bad Request: invalid name or color.
- 401 Unauthorized: missing or invalid JWT.
- 409 Conflict: duplicate tag name for the user.

## Endpoint 2: List Tags

### Endpoint

- Method: GET
- URL: /tags
- Description: List all tags for the current user.

### Request DTO

- None.

### Response DTO

#### TagResponseDto[]

| Field | Type             | Description |
| ----- | ---------------- | ----------- |
| items | TagResponseDto[] | User tags   |

### Business Rules Mapping

- BR-5: only the requesting user's tags are returned.

### Error Cases

- 401 Unauthorized: missing or invalid JWT.

## Endpoint 3: Get Tag By Id

### Endpoint

- Method: GET
- URL: /tags/:id
- Description: Retrieve a single tag by id.

### Request DTO

#### TagIdParamsDto

| Field | Type        | Required | Validation    |
| ----- | ----------- | -------- | ------------- |
| id    | uuid string | Yes      | valid UUID v4 |

### Response DTO

#### TagResponseDto

| Field | Type            | Description    |
| ----- | --------------- | -------------- |
| id    | uuid string     | Tag identifier |
| name  | string          | Tag name       |
| color | string nullable | Tag color      |

### Business Rules Mapping

- BR-5: ownership is enforced by user id.

### Error Cases

- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: tag not found for the user.

## Endpoint 4: Update Tag

### Endpoint

- Method: PATCH
- URL: /tags/:id
- Description: Update a tag name or color.

### Request DTO

#### TagIdParamsDto

| Field | Type        | Required | Validation    |
| ----- | ----------- | -------- | ------------- |
| id    | uuid string | Yes      | valid UUID v4 |

#### UpdateTagRequestDto

| Field | Type   | Required | Validation                                   |
| ----- | ------ | -------- | -------------------------------------------- |
| name  | string | No       | min length 1; max length 50; unique per user |
| color | string | No       | hex color; max length 16                     |

### Response DTO

#### TagResponseDto

| Field | Type            | Description    |
| ----- | --------------- | -------------- |
| id    | uuid string     | Tag identifier |
| name  | string          | Updated name   |
| color | string nullable | Updated color  |

### Business Rules Mapping

- BR-19: uniqueness per user is preserved after update.
- BR-5: only the owner can update the tag.

### Error Cases

- 400 Bad Request: invalid payload.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: tag not found for the user.
- 409 Conflict: duplicate tag name after update.

## Endpoint 5: Delete Tag

### Endpoint

- Method: DELETE
- URL: /tags/:id
- Description: Delete a tag.

### Request DTO

#### TagIdParamsDto

| Field | Type        | Required | Validation    |
| ----- | ----------- | -------- | ------------- |
| id    | uuid string | Yes      | valid UUID v4 |

### Response DTO

#### DeleteTagResponseDto

| Field   | Type   | Description             |
| ------- | ------ | ----------------------- |
| message | string | Deletion status message |

### Business Rules Mapping

- BR-19: tag management is owner-scoped.
- BR-20: deleting a tag removes its series-tag links through cascade.
- BR-5: only the owner can delete the tag.

### Error Cases

- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: tag not found for the user.

## Self Review

- This contract matches the current TagController surface.
- No appointment-tag assignment endpoint is documented because the backend does not expose one.
- Response shapes follow the repository DTOs.
