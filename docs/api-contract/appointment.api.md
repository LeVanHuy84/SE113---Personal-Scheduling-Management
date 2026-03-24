# API Contract: Appointment

## Feature

- Name: appointment
- Primary module: Appointment
- Related entities: Appointment

## Related Use-cases

- UC-6: Create appointment
- UC-7: Update appointment
- UC-8: Delete appointment
- UC-12: Manage appointment status

## Endpoint 1: Create Appointment

### Endpoint

- Method: POST
- URL: /appointments
- Description: Create a non-recurring appointment for authenticated user.

### Request DTO

#### CreateAppointmentRequestDto

| Field       | Type                | Required | Validation                                                    |
| ----------- | ------------------- | -------- | ------------------------------------------------------------- |
| title       | string              | Yes      | min length 1; max length 255                                  |
| description | string              | No       | max length 5000                                               |
| startTime   | ISO datetime string | Yes      | must be before endTime (BR-6); must not be in the past (BR-7) |
| endTime     | ISO datetime string | Yes      | must be after startTime (BR-6)                                |
| isAllDay    | boolean             | No       | default false                                                 |

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
| createdAt   | ISO datetime string | Creation timestamp                      |
| updatedAt   | ISO datetime string | Last update timestamp                   |

### Business Rules Mapping

- BR-5: appointment belongs to requesting user.
- BR-6: startTime must be earlier than endTime.
- BR-7: appointment cannot be created in the past.
- BR-8: overlap prevented with same-user existing appointments.
- BR-11: user can create own appointment.

### Error Cases

- 400 Bad Request: invalid time range or malformed payload.
- 401 Unauthorized: missing or invalid JWT.
- 409 Conflict: overlapping appointment.
- 422 Unprocessable Entity: semantic validation failure.

## Endpoint 2: Get Appointment List (Core)

### Endpoint

- Method: GET
- URL: /appointments?page={page}&limit={limit}
- Description: Retrieve paginated appointments for authenticated user.

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

## Endpoint 3: Get Appointment by Id

### Endpoint

- Method: GET
- URL: /appointments/:id
- Description: Retrieve a single appointment by id for authenticated user.

### Request DTO

#### GetAppointmentByIdParamsDto

| Field | Type        | Required | Validation        |
| ----- | ----------- | -------- | ----------------- |
| id    | uuid string | Yes      | valid UUID format |

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
| createdAt   | ISO datetime string | Creation timestamp                      |
| updatedAt   | ISO datetime string | Last update timestamp                   |

### Business Rules Mapping

- BR-5: only owner can read appointment.

### Error Cases

- 400 Bad Request: invalid id format.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: appointment not found for user.

## Endpoint 4: Update Appointment

### Endpoint

- Method: PUT
- URL: /appointments/:id
- Description: Update appointment details; for recurring instances, optional scope may apply.

### Request DTO

#### UpdateAppointmentRequestDto

| Field       | Type                | Required | Validation                                                                                                |
| ----------- | ------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| title       | string              | No       | min length 1; max length 255                                                                              |
| description | string              | No       | max length 5000                                                                                           |
| startTime   | ISO datetime string | No       | if provided, must satisfy startTime < endTime (BR-6) and not in past for future scheduling changes (BR-7) |
| endTime     | ISO datetime string | No       | if provided, must be after startTime (BR-6)                                                               |
| isAllDay    | boolean             | No       | boolean                                                                                                   |
| scope       | enum string         | No       | single or series when appointment belongs to recurring set (BR-12)                                        |

### Response DTO

#### AppointmentResponseDto

| Field       | Type                | Description             |
| ----------- | ------------------- | ----------------------- |
| id          | uuid string         | Appointment identifier  |
| title       | string              | Updated title           |
| description | string nullable     | Updated description     |
| startTime   | ISO datetime string | Updated start timestamp |
| endTime     | ISO datetime string | Updated end timestamp   |
| status      | enum                | Current status          |
| updatedAt   | ISO datetime string | Update timestamp        |

### Business Rules Mapping

- BR-5: only owner can update appointment.
- BR-6, BR-7: time validation remains enforced on update.
- BR-8: overlap checked against other appointments.
- BR-12: recurring updates may target single instance or series.
- BR-11: users can edit their appointments.

### Error Cases

- 400 Bad Request: invalid payload, invalid scope, invalid time.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: appointment not found for user.
- 409 Conflict: overlap after update.

## Endpoint 5: Delete Appointment

### Endpoint

- Method: DELETE
- URL: /appointments/:id?scope=single|series
- Description: Delete appointment; if recurring, delete one instance or whole series.

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
