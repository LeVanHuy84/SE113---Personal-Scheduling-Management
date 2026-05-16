# API Contract: Appointment Series

## Feature

- Name: appointment-series
- Primary module: AppointmentSeries
- Related entities: AppointmentSeries, Appointment, Tag

## Related Use-cases

- UC-11: Manage recurring appointments
- UC-7: Update appointment (recurring scope)
- UC-8: Delete appointment (recurring scope)

## Endpoint 1: Create Appointment Series

### Endpoint

- Method: POST
- URL: /series
- Description: Create an appointment series and schedule its recurrence metadata.

### Request DTO

#### CreateAppointmentSeriesRequestDto

| Field          | Type                | Required | Validation                                                    |
| -------------- | ------------------- | -------- | ------------------------------------------------------------- |
| title          | string              | Yes      | min length 1; max length 255                                  |
| description    | string              | No       | max length 5000                                               |
| startAt        | ISO datetime string | Yes      | parsed to Date; validated by appointment time-range decorator |
| endAt          | ISO datetime string | Yes      | parsed to Date; must be after startAt                         |
| offsetMinutes  | number              | No       | optional offset used by recurrence generation                 |
| recurrenceType | enum string         | Yes      | RecurrenceType enum from Prisma                               |
| weeklyDay      | enum array          | No       | required for WEEKLY; unique weekday values                    |
| monthlyDay     | number              | No       | required for MONTHLY; integer 1..31                           |
| yearlyDay      | number              | No       | required for YEARLY; integer 1..31                            |
| yearlyMonth    | number              | No       | required for YEARLY; integer 1..12                            |
| seriesTimezone | string              | No       | max length 64; defaults to UTC if omitted                     |
| tagIds         | uuid string[]       | Yes      | unique UUIDs; every tag id must exist                         |

### Response DTO

#### CreateAppointmentSeriesResponseDto

| Field | Type        | Description               |
| ----- | ----------- | ------------------------- |
| id    | uuid string | Created series identifier |

### Business Rules Mapping

- BR-6: startAt must be earlier than endAt.
- BR-7: base appointment time cannot be in the past.
- BR-8: overlap detection is applied before creating the series.
- BR-9: recurrence type and recurrence pattern must be valid.
- BR-10: generated instances inherit the base appointment data.
- Tag ids must exist before the series is created.

### Error Cases

- 400 Bad Request: invalid recurrence configuration or missing tag ids.
- 401 Unauthorized: missing or invalid JWT.
- 409 Conflict: overlapping appointment series.

## Endpoint 2: List Appointment Series

### Endpoint

- Method: GET
- URL: /series
- Description: Retrieve paginated appointment series records.

### Request DTO

#### AppointmentSeriesQueryDto

| Field  | Type        | Required | Validation                               |
| ------ | ----------- | -------- | ---------------------------------------- |
| page   | number      | No       | integer >= 1; default 1                  |
| limit  | number      | No       | integer between 1 and 100; default 10    |
| userId | uuid string | No       | optional filter used by the current code |

### Response DTO

#### PaginationResponseDto<AppointmentSeriesResponseDto[]>

| Field | Type                           | Description           |
| ----- | ------------------------------ | --------------------- |
| items | AppointmentSeriesResponseDto[] | Page data             |
| page  | number                         | Current page          |
| limit | number                         | Page size             |
| total | number                         | Total rows for filter |

#### AppointmentSeriesResponseDto

| Field          | Type                         | Description             |
| -------------- | ---------------------------- | ----------------------- |
| id             | uuid string                  | Series identifier       |
| userId         | uuid string                  | Owner identifier        |
| title          | string                       | Series title            |
| startAt        | ISO datetime string          | Base start timestamp    |
| endAt          | ISO datetime string          | Base end timestamp      |
| description    | string nullable              | Series description      |
| recurrenceType | enum                         | RecurrenceType enum     |
| weeklyDay      | string[]                     | Stored weekday values   |
| monthlyDay     | number nullable              | Monthly recurrence day  |
| yearlyDay      | number nullable              | Yearly recurrence day   |
| yearlyMonth    | number nullable              | Yearly recurrence month |
| seriesTimezone | string                       | Series timezone         |
| cancelledAt    | ISO datetime string nullable | Cancellation timestamp  |
| tags           | TagResponseDto[]             | Associated tags         |

#### TagResponseDto

| Field | Type        | Description    |
| ----- | ----------- | -------------- |
| id    | uuid string | Tag identifier |
| name  | string      | Tag name       |
| color | string      | Tag color      |

### Business Rules Mapping

- BR-5: series data is user-scoped.
- BR-11: users can manage their own recurring appointments.

### Error Cases

- 400 Bad Request: invalid pagination or UUID format.
- 401 Unauthorized: missing or invalid JWT.

## Endpoint 3: Update Appointment Series

### Endpoint

- Method: PATCH
- URL: /series/:id
- Description: Update appointment-series metadata.

### Request DTO

#### UpdateAppointmentSeriesParamsDto

| Field | Type        | Required | Validation        |
| ----- | ----------- | -------- | ----------------- |
| id    | uuid string | Yes      | valid UUID format |

#### UpdateAppointmentSeriesRequestDto

| Field          | Type                | Required | Validation                                                      |
| -------------- | ------------------- | -------- | --------------------------------------------------------------- |
| title          | string              | No       | inherited from create DTO; optional because PartialType is used |
| description    | string              | No       | inherited from create DTO                                       |
| startAt        | ISO datetime string | No       | inherited from create DTO                                       |
| endAt          | ISO datetime string | No       | inherited from create DTO                                       |
| offsetMinutes  | number              | No       | inherited from create DTO                                       |
| recurrenceType | enum string         | No       | inherited from create DTO                                       |
| weeklyDay      | enum array          | No       | inherited from create DTO                                       |
| monthlyDay     | number              | No       | inherited from create DTO                                       |
| yearlyDay      | number              | No       | inherited from create DTO                                       |
| yearlyMonth    | number              | No       | inherited from create DTO                                       |
| seriesTimezone | string              | No       | inherited from create DTO                                       |
| cancelledAt    | ISO datetime string | No       | declared in the DTO; persisted directly by the repository       |
| tagIds         | uuid string[]       | No       | optional; if sent, the current tag set is replaced              |

### Response DTO

#### UpdateAppointmentSeriesResponseDto

| Field | Type        | Description               |
| ----- | ----------- | ------------------------- |
| id    | uuid string | Updated series identifier |

### Business Rules Mapping

- BR-5: only the owner can update the series.
- BR-8: updates re-check for scheduling conflicts.
- BR-9 and BR-10: recurrence validation is preserved on update.

### Error Cases

- 400 Bad Request: invalid recurrence or payload.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: appointment series not found.
- 409 Conflict: overlap after update.

## Endpoint 4: Delete Appointment Series

### Endpoint

- Method: DELETE
- URL: /series/:id?scope=single|series
- Description: Delete an appointment series. The current implementation accepts a scope query parameter but always deletes the whole series.

### Request DTO

#### DeleteAppointmentQueryDto

| Field | Type        | Required | Validation       |
| ----- | ----------- | -------- | ---------------- |
| scope | enum string | No       | single or series |

### Response DTO

#### DeleteAppointmentSeriesResponseDto

| Field   | Type   | Description             |
| ------- | ------ | ----------------------- |
| message | string | Deletion status message |

### Business Rules Mapping

- BR-5: only the owner can delete the series.
- BR-12: recurring scope is intended by the contract, but the current implementation deletes the whole series.

### Error Cases

- 400 Bad Request: invalid query payload.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: appointment series not found.

## Self Review

- The file name now matches the actual backend module name.
- This contract mirrors the current controller surface instead of the older recurring API naming.
- No unsupported recurrence endpoints are introduced.
