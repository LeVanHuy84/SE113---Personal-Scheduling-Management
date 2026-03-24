# API Contract: Tag

## Feature

- Name: tag
- Primary module: Tag
- Related entities: Tag, AppointmentTag, Appointment

## Related Use-cases

- UC-14: Create/assign/manage tags
- UC-13: Search and filter appointments

## Endpoint 1: Create Tag

### Endpoint

- Method: POST
- URL: /tags
- Description: Create a new tag for current user.

### Request DTO

#### CreateTagRequestDto

| Field | Type   | Required | Validation                                           |
| ----- | ------ | -------- | ---------------------------------------------------- |
| name  | string | Yes      | min length 1; max length 50; unique per user (BR-19) |
| color | string | No       | max length 16                                        |

### Response DTO

#### TagResponseDto

| Field     | Type                | Description        |
| --------- | ------------------- | ------------------ |
| id        | uuid string         | Tag identifier     |
| name      | string              | Tag name           |
| color     | string nullable     | Tag color          |
| createdAt | ISO datetime string | Creation timestamp |

### Business Rules Mapping

- BR-19: user can define tags; uniqueness per user.
- BR-5: user can manage only own tags.

### Error Cases

- 400 Bad Request: invalid name/color.
- 401 Unauthorized: missing or invalid JWT.
- 409 Conflict: duplicate tag name for user.

## Endpoint 2: List Tags

### Endpoint

- Method: GET
- URL: /tags
- Description: List all tags for current user.

### Request DTO

- None.

### Response DTO

#### TagListResponseDto

| Field | Type             | Description |
| ----- | ---------------- | ----------- |
| items | TagResponseDto[] | User tags   |

### Business Rules Mapping

- BR-5: only requesting user tags returned.

### Error Cases

- 401 Unauthorized: missing or invalid JWT.

## Endpoint 3: Rename/Update Tag

### Endpoint

- Method: PUT
- URL: /tags/:id
- Description: Update tag name or color.

### Request DTO

#### UpdateTagParamsDto

| Field | Type        | Required | Validation     |
| ----- | ----------- | -------- | -------------- |
| id    | uuid string | Yes      | valid tag UUID |

#### UpdateTagRequestDto

| Field | Type   | Required | Validation                                   |
| ----- | ------ | -------- | -------------------------------------------- |
| name  | string | No       | min length 1; max length 50; unique per user |
| color | string | No       | max length 16                                |

### Response DTO

#### TagResponseDto

| Field     | Type                | Description      |
| --------- | ------------------- | ---------------- |
| id        | uuid string         | Tag identifier   |
| name      | string              | Updated name     |
| color     | string nullable     | Updated color    |
| updatedAt | ISO datetime string | Update timestamp |

### Business Rules Mapping

- BR-19: uniqueness per user preserved after rename.
- BR-5: owner-only mutation.

### Error Cases

- 400 Bad Request: invalid payload.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: tag not found for user.
- 409 Conflict: duplicate tag name after update.

## Endpoint 4: Delete Tag

### Endpoint

- Method: DELETE
- URL: /tags/:id
- Description: Delete tag and remove tag links from appointments.

### Request DTO

#### DeleteTagParamsDto

| Field | Type        | Required | Validation     |
| ----- | ----------- | -------- | -------------- |
| id    | uuid string | Yes      | valid tag UUID |

### Response DTO

#### DeleteTagResponseDto

| Field     | Type        | Description     |
| --------- | ----------- | --------------- |
| success   | boolean     | Deletion result |
| deletedId | uuid string | Deleted tag id  |

### Business Rules Mapping

- BR-19: tag management by owner.
- BR-20: many-to-many links removed from appointment_tags.
- BR-5: owner-only deletion.

### Error Cases

- 400 Bad Request: invalid id.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: tag not found for user.

## Endpoint 5: Assign Tag to Appointment

### Endpoint

- Method: POST
- URL: /appointments/:id/tags
- Description: Assign one or more existing user tags to an appointment.

### Request DTO

#### AssignTagToAppointmentParamsDto

| Field | Type        | Required | Validation             |
| ----- | ----------- | -------- | ---------------------- |
| id    | uuid string | Yes      | valid appointment UUID |

#### AssignTagToAppointmentRequestDto

| Field  | Type          | Required | Validation                                       |
| ------ | ------------- | -------- | ------------------------------------------------ |
| tagIds | uuid string[] | Yes      | min size 1; each tag must belong to current user |

### Response DTO

#### AppointmentTagAssignmentResponseDto

| Field         | Type          | Description                   |
| ------------- | ------------- | ----------------------------- |
| appointmentId | uuid string   | Appointment identifier        |
| tagIds        | uuid string[] | Assigned tag ids              |
| assignedCount | number        | Number of assignments applied |

### Business Rules Mapping

- BR-19: user-defined tag assignment.
- BR-20: appointment supports multiple tags.
- BR-5: user can assign only to own appointments and own tags.

### Error Cases

- 400 Bad Request: invalid appointment id or tagIds.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: appointment or tags not found for user.
- 409 Conflict: duplicate appointment-tag pair.

## Endpoint 6: Search and Filter Appointments

### Endpoint

- Method: GET
- URL: /appointments
- Description: Search and filter appointments by keyword/date/tag/status.

### Request DTO

#### SearchAppointmentsQueryDto

| Field     | Type                | Required | Validation                                       |
| --------- | ------------------- | -------- | ------------------------------------------------ |
| query     | string              | No       | max length 255; applied to title and description |
| startDate | ISO datetime string | No       | must be <= endDate if both provided              |
| endDate   | ISO datetime string | No       | must be >= startDate if both provided            |
| tagId     | uuid string         | No       | must belong to current user                      |
| status    | enum string         | No       | SCHEDULED, COMPLETED, CANCELLED, MISSED          |
| page      | number              | No       | integer >= 1; default 1                          |
| limit     | number              | No       | integer 1..100; default 10                       |

### Response DTO

#### SearchAppointmentsResponseDto

| Field | Type                       | Description            |
| ----- | -------------------------- | ---------------------- |
| items | AppointmentSearchItemDto[] | Filtered appointments  |
| page  | number                     | Current page           |
| limit | number                     | Page size              |
| total | number                     | Total filtered records |

#### AppointmentSearchItemDto

| Field       | Type                | Description             |
| ----------- | ------------------- | ----------------------- |
| id          | uuid string         | Appointment identifier  |
| title       | string              | Appointment title       |
| description | string nullable     | Appointment description |
| startTime   | ISO datetime string | Start time              |
| endTime     | ISO datetime string | End time                |
| status      | enum                | Appointment status      |
| tags        | TagResponseDto[]    | Assigned tags           |

### Business Rules Mapping

- BR-27: supports filtering by date range, tag, and status.
- SRS requirement: search includes title/description keyword matching.
- BR-5: query constrained to current user data.

### Error Cases

- 400 Bad Request: invalid filter values or date range.
- 401 Unauthorized: missing or invalid JWT.

## Self Review

- UC-14 and UC-13 are fully covered.
- No endpoint duplication inside this feature file.
- Validation constraints map to BR-5/19/20/27.
- Naming is consistent with global DTO convention.
- Internal DB fields are not exposed.
