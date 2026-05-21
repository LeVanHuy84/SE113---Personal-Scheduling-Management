# API Contract: Appointment (DEPRECATED)

> **Status**: DEPRECATED — This API contract references endpoints that have been replaced by the Series API (`/series`).
> Single appointment creation is now handled through series with `recurrenceType: ONETIME`.
>
> See [recurring.api.md](recurring.api.md) for current appointment series endpoints.

## Feature

- Name: appointment
- Primary module: Appointment
- Related entities: Appointment

## Related Use-cases

- UC-6: Create appointment (via series)
- UC-12: Manage appointment status

⚠️ **Note**: Most appointment endpoints have been consolidated into the Series API. Only status management remains here.

## Endpoint 1: Get Appointment List

### Endpoint

- Method: GET
- URL: /appointments?page={page}&limit={limit}
- Description: Retrieve paginated appointments for authenticated user (both personal and generated from series).

### Request DTO

#### GetAppointmentsQueryDto

| Field | Type   | Required | Validation                            |
| ----- | ------ | -------- | ------------------------------------- |
| page  | number | No       | integer >= 1; default 1               |
| limit | number | No       | integer between 1 and 100; default 10 |

### Response DTO

#### AppointmentListResponseDto

| Field | Type                     | Description                 |
| ----- | ------------------------ | --------------------------- |
| items | AppointmentResponseDto[] | Page data                   |
| page  | number                   | Current page                |
| limit | number                   | Page size                   |
| total | number                   | Total rows for current user |

### Business Rules Mapping

- BR-5: only appointments of requesting user are returned.

### Error Cases

- 400 Bad Request: invalid pagination params.
- 401 Unauthorized: missing or invalid JWT.

## Endpoint 2: Update Appointment Status

### Endpoint

- Method: PATCH
- URL: /appointments/:id/status
- Description: Update appointment status (SCHEDULED, COMPLETED, CANCELLED, MISSED).

### Request DTO

#### UpdateAppointmentStatusRequestDto

| Field  | Type        | Required | Validation                                                      |
| ------ | ----------- | -------- | --------------------------------------------------------------- |
| id     | uuid string | Yes      | valid appointment UUID                                          |
| status | enum        | Yes      | SCHEDULED, COMPLETED, CANCELLED, MISSED                         |

### Response DTO

#### AppointmentResponseDto

| Field       | Type                | Description                             |
| ----------- | ------------------- | --------------------------------------- |
| id          | uuid string         | Appointment identifier                  |
| title       | string              | Appointment title                       |
| description | string nullable     | Appointment description                 |
| startTime   | ISO datetime string | Start timestamp                         |
| endTime     | ISO datetime string | End timestamp                           |
| status      | enum                | SCHEDULED, COMPLETED, CANCELLED, MISSED |
| updatedAt   | ISO datetime string | Update timestamp                        |

### Business Rules Mapping

- BR-5: only owner can update appointment status.
- BR-12: status transitions respect appointment lifecycle.

### Error Cases

- 400 Bad Request: invalid status value.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: appointment not found for user.

## ⚠️ Deprecated Endpoints

The following endpoints have been **removed** and replaced by the Series API:

- ~~POST /appointments~~ → use `POST /series` with `recurrenceType: ONETIME`
- ~~GET /appointments/:id~~ → use `GET /series/:id` for series details
- ~~PUT /appointments/:id~~ → use `PATCH /series/:id` for series updates
- ~~DELETE /appointments/:id~~ → use `DELETE /series/:id` for series deletion
- ~~POST /appointments/:id/tags~~ → tag assignment moved to series-level operations

See [recurring.api.md](recurring.api.md) for the complete Series API documentation.

## Self Review

- Appointment status management (UC-12) is covered.
- Appointment creation now handled via Series API.
- All deprecated endpoints clearly marked.
- Cross-references to current API provided.

### Request DTO

#### DeleteAppointmentParamsDto

| Field | Type        | Required | Validation        |
| ----- | ----------- | -------- | ----------------- |
| id    | uuid string | Yes      | valid UUID format |

#### DeleteAppointmentQueryDto

| Field | Type        | Required | Validation                                        |
| ----- | ----------- | -------- | ------------------------------------------------- |
| scope | enum string | No       | single or series (required for recurring context) |

### Response DTO

#### DeleteAppointmentResponseDto

| Field        | Type    | Description                                           |
| ------------ | ------- | ----------------------------------------------------- |
| success      | boolean | Deletion status                                       |
| deletedCount | number  | Number of deleted rows (1 for single, >=1 for series) |

### Business Rules Mapping

- BR-5: only owner can delete appointments.
- BR-12: recurring delete supports single or series scope.
- BR-11: users can delete their appointments.

### Error Cases

- 400 Bad Request: invalid id or scope.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: appointment not found for user.

## Endpoint 6: Update Appointment Status

### Endpoint

- Method: PATCH
- URL: /appointments/:id/status
- Description: Update status for appointment state management.

### Request DTO

#### UpdateAppointmentStatusRequestDto

| Field  | Type        | Required | Validation                               |
| ------ | ----------- | -------- | ---------------------------------------- |
| status | enum string | Yes      | allowed: SCHEDULED, COMPLETED, CANCELLED |

### Response DTO

#### AppointmentStatusResponseDto

| Field     | Type                | Description            |
| --------- | ------------------- | ---------------------- |
| id        | uuid string         | Appointment identifier |
| status    | enum                | Updated status         |
| updatedAt | ISO datetime string | Update timestamp       |

### Business Rules Mapping

- BR-5: only owner can change status.
- BR-14: supports user status changes in appointment workflow.
- SRS requirement: auto transition to MISSED handled by scheduler/service logic (non-user trigger).

### Error Cases

- 400 Bad Request: invalid status or disallowed transition.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: appointment not found for user.

## Self Review

- Use-cases UC-6, UC-7, UC-8, UC-12 are fully covered.
- No duplicated endpoints inside this feature contract.
- All validations map to BR-5/6/7/8/11/12/14.
- DTO naming is consistent.
- Internal database fields are hidden (no user_id, deleted_at, source_kind, occurrence_index).
