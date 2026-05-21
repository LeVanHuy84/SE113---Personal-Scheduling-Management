# API Contract: Appointment Series (Recurring & One-time)

## Feature

- Name: recurring / appointment-series
- Primary module: AppointmentSeries
- Related entities: AppointmentSeries, Appointment

## Related Use-cases

- UC-6: Create appointment (single via ONETIME series)
- UC-11: Manage recurring appointments
- UC-7: Update appointment (series scope)
- UC-8: Delete appointment (series scope)

## Overview

All appointment creation (both single and recurring) is now handled through the **Series API** (`/series`).
- Single appointments are created with `recurrenceType: ONETIME`
- Recurring appointments use `recurrenceType: DAILY|WEEKLY|MONTHLY|YEARLY`

The system automatically generates individual appointment instances from the series pattern using queue-based expansion.

## Endpoint 1: Create Appointment Series

### Endpoint

- Method: POST
- URL: /series
- Description: Create appointment series and generate linked instances. For single appointments, use `recurrenceType: ONETIME`.

### Request DTO

#### CreateAppointmentSeriesRequestDto

| Field           | Type                | Required | Validation                                                            |
| --------------- | ------------------- | -------- | --------------------------------------------------------------------- |
| title           | string              | Yes      | min length 1; max length 255                                          |
| description     | string              | No       | max length 5000                                                       |
| startAt         | ISO datetime string | Yes      | must be before endAt (BR-6); must not be in the past (BR-7)           |
| endAt           | ISO datetime string | Yes      | must be after startAt (BR-6)                                          |
| recurrenceType  | enum                | Yes      | ONETIME, DAILY, WEEKLY, MONTHLY, YEARLY (BR-9)                        |
| weeklyDay       | Weekday[]           | No       | required for WEEKLY recurrence                                        |
| monthlyDay      | number              | No       | required for MONTHLY (1-31)                                           |
| yearlyDay       | number              | No       | required for YEARLY (1-31)                                            |
| yearlyMonth     | number              | No       | required for YEARLY (1-12)                                            |
| seriesTimezone  | string              | No       | IANA timezone; default UTC                                            |
| tagIds          | uuid string[]       | No       | tags to assign to generated appointments                              |

### Response DTO

#### AppointmentSeriesResponseDto

| Field          | Type                | Description                     |
| -------------- | ------------------- | ------------------------------- |
| id             | uuid string         | Series identifier               |
| title          | string              | Series title                    |
| description    | string nullable     | Series description              |
| recurrenceType | enum                | ONETIME, DAILY, WEEKLY, etc.    |
| startAt        | ISO datetime string | Base start time                 |
| endAt          | ISO datetime string | Base end time                   |
| createdAt      | ISO datetime string | Series creation timestamp       |
| updatedAt      | ISO datetime string | Last update timestamp           |

### Business Rules Mapping

- BR-5: series belongs to authenticated user.
- BR-6: startAt must be earlier than endAt.
- BR-7: cannot create in the past.
- BR-8: overlap prevented with same-user existing appointments.
- BR-9: recurrence type must be valid.
- BR-10: generated instances inherit base appointment properties.
- Phase 4 rule: maximum 50 generated instances.

### Error Cases

- 400 Bad Request: invalid recurrence pattern, time range, or malformed payload.
- 401 Unauthorized: missing or invalid JWT.
- 409 Conflict: one or more generated instances overlap existing appointments.
- 422 Unprocessable Entity: instance generation exceeds max 50 or invalid recurrence config.

## Endpoint 2: Get Appointment Series List

### Endpoint

- Method: GET
- URL: /series?page={page}&limit={limit}
- Description: Retrieve paginated appointment series for authenticated user.

### Request DTO

#### GetAppointmentSeriesQueryDto

| Field | Type   | Required | Validation                            |
| ----- | ------ | -------- | ------------------------------------- |
| page  | number | No       | integer >= 1; default 1               |
| limit | number | No       | integer between 1 and 100; default 10 |

### Response DTO

#### AppointmentSeriesListResponseDto

| Field | Type                          | Description                |
| ----- | ----------------------------- | -------------------------- |
| items | AppointmentSeriesResponseDto[]| Page data                  |
| page  | number                        | Current page               |
| limit | number                        | Page size                  |
| total | number                        | Total series for user      |

### Business Rules Mapping

- BR-5: only series belonging to requesting user are returned.

### Error Cases

- 400 Bad Request: invalid pagination params.
- 401 Unauthorized: missing or invalid JWT.

## Endpoint 3: Update Appointment Series

### Endpoint

- Method: PATCH
- URL: /series/:id
- Description: Update series configuration and regenerate instances.

### Request DTO

#### UpdateAppointmentSeriesRequestDto

| Field           | Type                | Required | Validation                          |
| --------------- | ------------------- | -------- | ----------------------------------- |
| title           | string              | No       | min length 1; max length 255        |
| description     | string              | No       | max length 5000                     |
| startAt         | ISO datetime string | No       | if provided, must be before endAt   |
| endAt           | ISO datetime string | No       | if provided, must be after startAt  |
| recurrenceType  | enum                | No       | if changing recurrence pattern      |
| weeklyDay       | Weekday[]           | No       | for WEEKLY updates                  |
| monthlyDay      | number              | No       | for MONTHLY updates                 |
| yearlyDay       | number              | No       | for YEARLY updates                  |
| yearlyMonth     | number              | No       | for YEARLY updates                  |

### Response DTO

#### AppointmentSeriesResponseDto

| Field          | Type                | Description             |
| -------------- | ------------------- | ----------------------- |
| id             | uuid string         | Series identifier       |
| title          | string              | Updated title           |
| description    | string nullable     | Updated description     |
| recurrenceType | enum                | Updated recurrence type |
| startAt        | ISO datetime string | Updated start time      |
| endAt          | ISO datetime string | Updated end time        |
| updatedAt      | ISO datetime string | Update timestamp        |

### Business Rules Mapping

- BR-5: only series owner can update.
- BR-6, BR-7: time validation enforced.
- BR-8: overlap checked against other appointments.
- BR-9: recurrence validity enforced.

### Error Cases

- 400 Bad Request: invalid payload or recurrence config.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: series not found for user.
- 409 Conflict: update results in overlapping appointments.

## Endpoint 4: Delete Appointment Series

### Endpoint

- Method: DELETE
- URL: /series/:id
- Description: Delete appointment series and all associated instances.
| description | string              | No       | max length 5000                |
| startTime   | ISO datetime string | No       | if changed, start < end (BR-6) |
| endTime     | ISO datetime string | No       | if changed, end > start (BR-6) |

### Response DTO

#### RecurringAppointmentUpdateResponseDto

| Field         | Type                | Description            |
| ------------- | ------------------- | ---------------------- |
| scope         | string              | single or series       |
| affectedCount | number              | Number of updated rows |
| updatedAt     | ISO datetime string | Update timestamp       |

### Business Rules Mapping

- BR-12: update supports single or series scope.
- BR-5: owner-only update.
- BR-8: updated instances must remain conflict-free.

### Error Cases

- 400 Bad Request: invalid scope or payload.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: appointment/series not found for user.
- 409 Conflict: overlap after update.

## Endpoint 4: Delete Recurring Appointment Scope

### Endpoint

- Method: DELETE
- URL: /appointments/:id?scope=single|series
- Description: Delete recurring appointment instance or full series.

### Request DTO

#### DeleteRecurringAppointmentParamsDto

| Field | Type        | Required | Validation             |
| ----- | ----------- | -------- | ---------------------- |
| id    | uuid string | Yes      | valid appointment UUID |

### Request DTO

#### DeleteAppointmentSeriesParamsDto

| Field | Type        | Required | Validation             |
| ----- | ----------- | -------- | ---------------------- |
| id    | uuid string | Yes      | valid series UUID      |

### Response DTO

#### DeleteAppointmentSeriesResponseDto

| Field   | Type   | Description        |
| ------- | ------ | ------------------- |
| message | string | Deletion status     |
| success | boolean | Deletion result    |

### Business Rules Mapping

- BR-5: owner-only delete.
- BR-12: series deletion removes all generated instances.

### Error Cases

- 400 Bad Request: invalid id.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: series not found for user.

## Self Review

- Recurring-related use-cases UC-6 (single via ONETIME), UC-11 (recurring), UC-7 and UC-8 (with series scope) are covered.
- All series CRUD operations (Create, Read, Update, Delete) are documented.
- Validation includes recurrence pattern validity, max instance limits, conflict checks.
- DTO naming is consistent with CreateXRequestDto, UpdateXRequestDto, XResponseDto pattern.
- Internal persistence fields are not exposed.
