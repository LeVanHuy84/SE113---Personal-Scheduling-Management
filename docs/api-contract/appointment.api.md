# API Contract: Appointment

## Feature

- Name: appointment
- Primary module: Appointment
- Related entities: Appointment, AppointmentSeries, Tag

## Related Use-cases

- UC-12: Manage appointment status

## Endpoint 1: List Appointments

### Endpoint

- Method: GET
- URL: /appointments
- Description: Retrieve paginated appointments for the authenticated request.

### Request DTO

#### GetAppointmentsQueryDto

| Field  | Type        | Required | Validation                               |
| ------ | ----------- | -------- | ---------------------------------------- |
| page   | number      | No       | integer >= 1; default 1                  |
| limit  | number      | No       | integer between 1 and 100; default 10    |
| userId | uuid string | No       | optional filter used by the current code |

### Response DTO

#### PaginationResponseDto<AppointmentResponseDto[]>

| Field | Type                     | Description               |
| ----- | ------------------------ | ------------------------- |
| items | AppointmentResponseDto[] | Page data                 |
| page  | number                   | Current page              |
| limit | number                   | Page size                 |
| total | number                   | Total rows for the filter |

#### AppointmentResponseDto

| Field               | Type                | Description                               |
| ------------------- | ------------------- | ----------------------------------------- |
| id                  | uuid string         | Appointment identifier                    |
| userId              | uuid string         | Owner identifier                          |
| seriesId            | uuid string         | Parent appointment series identifier      |
| title               | string              | Title inherited from the series           |
| description         | string nullable     | Description inherited from the series     |
| startAt             | ISO datetime string | Start timestamp                           |
| endAt               | ISO datetime string | End timestamp                             |
| isRecurringInstance | boolean             | Whether the row is a generated occurrence |
| status              | enum                | SCHEDULED, COMPLETED, CANCELLED, MISSED   |
| jobId               | string nullable     | Reminder job id, if any                   |
| tags                | TagResponseDto[]    | Tags inherited from the related series    |

#### TagResponseDto

| Field | Type        | Description    |
| ----- | ----------- | -------------- |
| id    | uuid string | Tag identifier |
| name  | string      | Tag name       |
| color | string      | Tag color      |

### Business Rules Mapping

- BR-5: the list should be scoped to the intended user context.
- BR-11: users can access their own appointments.
- BR-12: recurring instances are surfaced through the appointment list.

### Error Cases

- 400 Bad Request: invalid pagination or UUID format.
- 401 Unauthorized: missing or invalid JWT.

## Endpoint 2: Update Appointment Status

### Endpoint

- Method: PATCH
- URL: /appointments/:id/status
- Description: Update the status of an appointment.

### Request DTO

#### UpdateAppointmentStatusRequestDto

| Field  | Type        | Required | Validation                                |
| ------ | ----------- | -------- | ----------------------------------------- |
| id     | uuid string | Yes      | valid UUID format                         |
| status | enum string | Yes      | AppointmentStatus values from Prisma enum |

### Response DTO

- No response body is returned by the current controller implementation.

### Business Rules Mapping

- Final statuses cannot be changed again once set.
- Reminder jobs are removed when an appointment is cancelled.

### Error Cases

- 400 Bad Request: invalid transition from COMPLETED, CANCELLED, or MISSED.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: appointment not found.

## Self Review

- This contract reflects the current controller surface.
- Response shapes follow the repository DTOs instead of the older appointment CRUD contract.
- No create, update, or delete appointment HTTP endpoints are exposed in the current backend.
