# API Contract: Recurring

## Feature

- Name: recurring
- Primary module: Recurring
- Related entities: AppointmentSeries, Appointment

## Related Use-cases

- UC-11: Manage recurring appointments
- UC-7: Update appointment (recurring scope)
- UC-8: Delete appointment (recurring scope)

## Endpoint 1: Create Recurring Appointment Series

### Endpoint

- Method: POST
- URL: /appointments
- Description: Create appointment with recurrence rule and generate linked instances.

### Request DTO

#### CreateRecurringAppointmentRequestDto

| Field           | Type                | Required | Validation                                                            |
| --------------- | ------------------- | -------- | --------------------------------------------------------------------- |
| title           | string              | Yes      | min length 1; max length 255                                          |
| description     | string              | No       | max length 5000                                                       |
| startTime       | ISO datetime string | Yes      | must be before endTime (BR-6); must not be in the past (BR-7)         |
| endTime         | ISO datetime string | Yes      | must be after startTime (BR-6)                                        |
| recurrenceRule  | string              | Yes      | valid daily/weekly/monthly pattern only (BR-9)                        |
| seriesTimezone  | string              | Yes      | valid IANA timezone; max length 64                                    |
| recurrenceCount | number              | No       | integer > 0; if provided, generated instances must be <= 50 (Phase 4) |
| recurrenceUntil | ISO datetime string | No       | must be after startTime; mutually exclusive with recurrenceCount      |

### Response DTO

#### RecurringAppointmentSeriesResponseDto

| Field          | Type                              | Description                     |
| -------------- | --------------------------------- | ------------------------------- |
| seriesId       | uuid string                       | Recurring series identifier     |
| recurrenceRule | string                            | Persisted recurrence rule       |
| generatedCount | number                            | Number of generated instances   |
| items          | RecurringAppointmentInstanceDto[] | Generated appointment instances |

#### RecurringAppointmentInstanceDto

| Field     | Type                | Description                             |
| --------- | ------------------- | --------------------------------------- |
| id        | uuid string         | Appointment instance id                 |
| seriesId  | uuid string         | Parent series id                        |
| title     | string              | Inherited title                         |
| startTime | ISO datetime string | Instance start time                     |
| endTime   | ISO datetime string | Instance end time                       |
| status    | enum                | SCHEDULED, COMPLETED, CANCELLED, MISSED |

### Business Rules Mapping

- BR-6, BR-7: base appointment time validation.
- BR-8: conflict check applied to all generated instances.
- BR-9: recurrence pattern must be valid (daily, weekly, monthly).
- BR-10: generated instances inherit base appointment properties.
- Phase 4 rule: maximum 50 generated instances.

### Error Cases

- 400 Bad Request: invalid recurrence rule or invalid end condition.
- 401 Unauthorized: missing or invalid JWT.
- 409 Conflict: one or more generated instances overlap existing appointments.
- 422 Unprocessable Entity: instance generation exceeds max 50.

## Endpoint 2: Configure or Replace Recurrence for Existing Appointment

### Endpoint

- Method: POST
- URL: /appointments/:id/recurrence
- Description: Attach or replace recurrence rule for an existing appointment and generate series instances.

### Request DTO

#### ConfigureRecurrenceParamsDto

| Field | Type        | Required | Validation             |
| ----- | ----------- | -------- | ---------------------- |
| id    | uuid string | Yes      | valid appointment UUID |

#### ConfigureRecurrenceRequestDto

| Field           | Type                | Required | Validation                                |
| --------------- | ------------------- | -------- | ----------------------------------------- |
| recurrenceRule  | string              | Yes      | valid daily/weekly/monthly pattern (BR-9) |
| seriesTimezone  | string              | Yes      | valid IANA timezone                       |
| recurrenceCount | number              | No       | integer > 0 and <= 50 generated instances |
| recurrenceUntil | ISO datetime string | No       | after base appointment startTime          |

### Response DTO

#### ConfigureRecurrenceResponseDto

| Field          | Type                | Description                   |
| -------------- | ------------------- | ----------------------------- |
| seriesId       | uuid string         | Recurrence series id          |
| generatedCount | number              | Number of generated instances |
| updatedAt      | ISO datetime string | Configuration timestamp       |

### Business Rules Mapping

- BR-5: only owner can configure recurrence.
- BR-9: recurrence rule validity enforced.
- BR-10: generated instances inherit base fields.
- BR-8: conflict detection across generated instances.

### Error Cases

- 400 Bad Request: invalid recurrence configuration.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: base appointment not found for user.
- 409 Conflict: generated instances overlap existing schedule.

## Endpoint 3: Update Recurring Appointment Scope

### Endpoint

- Method: PUT
- URL: /appointments/:id?scope=single|series
- Description: Update a recurring appointment instance only or whole series.

### Request DTO

#### UpdateRecurringAppointmentParamsDto

| Field | Type        | Required | Validation             |
| ----- | ----------- | -------- | ---------------------- |
| id    | uuid string | Yes      | valid appointment UUID |

#### UpdateRecurringAppointmentQueryDto

| Field | Type        | Required | Validation               |
| ----- | ----------- | -------- | ------------------------ |
| scope | enum string | Yes      | single or series (BR-12) |

#### UpdateRecurringAppointmentRequestDto

| Field       | Type                | Required | Validation                     |
| ----------- | ------------------- | -------- | ------------------------------ |
| title       | string              | No       | max length 255                 |
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

#### DeleteRecurringAppointmentQueryDto

| Field | Type        | Required | Validation               |
| ----- | ----------- | -------- | ------------------------ |
| scope | enum string | Yes      | single or series (BR-12) |

### Response DTO

#### DeleteRecurringAppointmentResponseDto

| Field        | Type    | Description            |
| ------------ | ------- | ---------------------- |
| scope        | string  | single or series       |
| deletedCount | number  | Number of deleted rows |
| success      | boolean | Deletion result        |

### Business Rules Mapping

- BR-12: delete supports single instance or full series.
- BR-5: owner-only delete.

### Error Cases

- 400 Bad Request: invalid id or scope.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: appointment/series not found for user.

## Self Review

- Recurring-related use-cases UC-11 plus recurring scope in UC-7 and UC-8 are covered.
- No duplicated endpoint definitions inside this feature beyond explicit scope variants.
- Validation includes rule validity, max instance limits, conflict checks, and scope constraints.
- DTO naming is consistent.
- Internal persistence fields (occurrenceIndex, deletedAt, sourceKind) are not exposed.
