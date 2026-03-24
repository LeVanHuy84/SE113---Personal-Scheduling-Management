# API Contract: Reminder

## Feature

- Name: reminder
- Primary module: Reminder
- Related entities: Reminder, ReminderEvent

## Related Use-cases

- UC-15: Set appointment reminder(s)
- UC-16: Snooze reminder
- UC-20: Automated reminder triggering (scheduler service path)

## Endpoint 1: Set Reminder(s) for Appointment

### Endpoint

- Method: POST
- URL: /appointments/:id/reminders
- Description: Create one or more reminders for an appointment owned by current user.

### Request DTO

#### SetAppointmentRemindersParamsDto

| Field | Type        | Required | Validation             |
| ----- | ----------- | -------- | ---------------------- |
| id    | uuid string | Yes      | valid appointment UUID |

#### CreateAppointmentRemindersRequestDto

| Field     | Type                    | Required | Validation |
| --------- | ----------------------- | -------- | ---------- |
| reminders | CreateReminderItemDto[] | Yes      | min size 1 |

#### CreateReminderItemDto

| Field    | Type                | Required | Validation                                         |
| -------- | ------------------- | -------- | -------------------------------------------------- |
| remindAt | ISO datetime string | Yes      | must be earlier than appointment startTime (BR-21) |

### Response DTO

#### ReminderResponseDto

| Field         | Type                | Description                            |
| ------------- | ------------------- | -------------------------------------- |
| id            | uuid string         | Reminder identifier                    |
| appointmentId | uuid string         | Linked appointment id                  |
| remindAt      | ISO datetime string | Configured reminder time               |
| nextTriggerAt | ISO datetime string | Next scheduled trigger timestamp       |
| state         | enum                | PENDING, TRIGGERED, SNOOZED, CANCELLED |
| createdAt     | ISO datetime string | Creation timestamp                     |

#### ReminderListResponseDto

| Field | Type                  | Description                |
| ----- | --------------------- | -------------------------- |
| items | ReminderResponseDto[] | Persisted reminder records |

### Business Rules Mapping

- BR-5: reminders can be configured only for appointments owned by user.
- BR-21: remindAt must be before appointment startTime.
- BR-22: multiple reminders are allowed for one appointment.
- BR-23: each reminder schedules asynchronous trigger job.
- Phase 3 rule: one queue job per reminder; jobId uses reminder id for idempotency.

### Error Cases

- 400 Bad Request: invalid reminders payload or remindAt not before startTime.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: appointment not found for user.
- 409 Conflict: duplicate/idempotency scheduling collision.
- 422 Unprocessable Entity: semantically invalid reminder set.

## Endpoint 2: Snooze Reminder

### Endpoint

- Method: POST
- URL: /reminders/:id/snooze
- Description: Snooze a reminder and reschedule next trigger.

### Request DTO

#### SnoozeReminderParamsDto

| Field | Type        | Required | Validation          |
| ----- | ----------- | -------- | ------------------- |
| id    | uuid string | Yes      | valid reminder UUID |

#### SnoozeReminderRequestDto

| Field           | Type   | Required | Validation                 |
| --------------- | ------ | -------- | -------------------------- |
| durationMinutes | number | Yes      | integer between 1 and 1440 |

### Response DTO

#### SnoozeReminderResponseDto

| Field         | Type                | Description                     |
| ------------- | ------------------- | ------------------------------- |
| id            | uuid string         | Reminder identifier             |
| state         | enum                | Updated state, expected SNOOZED |
| nextTriggerAt | ISO datetime string | Rescheduled trigger time        |
| snoozeCount   | number              | Snooze counter after update     |
| updatedAt     | ISO datetime string | Update timestamp                |

### Business Rules Mapping

- BR-24: snoozed reminders must re-trigger after configured duration.
- BR-23: reminder trigger lifecycle remains scheduler-driven.
- Ownership invariant from domain and BR-5 applied before update.

### Error Cases

- 400 Bad Request: invalid duration or invalid reminder state for snooze.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: reminder not found for user.
- 409 Conflict: reminder already cancelled/terminal state.

## Internal Scheduler Contract (Non-public API)

### Operation

- Name: TriggerDueReminders
- Trigger: Queue worker consumes delayed reminder jobs.
- Description: Transition reminder to triggered state and create notification log record.

### Input Payload (Queue Job)

#### ReminderJobPayloadDto

| Field         | Type                | Description                     |
| ------------- | ------------------- | ------------------------------- |
| reminderId    | uuid string         | Reminder identifier             |
| userId        | uuid string         | User scope for security checks  |
| appointmentId | uuid string         | Appointment linkage             |
| scheduledAt   | ISO datetime string | Original scheduled trigger time |

### Result DTO

#### ReminderTriggerResultDto

| Field          | Type                | Description                 |
| -------------- | ------------------- | --------------------------- |
| reminderId     | uuid string         | Processed reminder id       |
| triggeredAt    | ISO datetime string | Actual trigger timestamp    |
| notificationId | uuid string         | Created notification log id |
| state          | enum                | TRIGGERED                   |

### Business Rules Mapping

- BR-23: notifications are triggered by scheduler service.
- BR-25: triggered notification persisted in log.
- Domain rule: reminder must belong to appointment and user.

### Error Cases

- RETRYABLE: transient Redis or database failure.
- NON_RETRYABLE: reminder no longer active or ownership mismatch.

## Self Review

- Use-cases UC-15, UC-16, UC-20 are covered without merging unrelated behavior.
- Endpoints are unique within this feature contract.
- Validation rules map to BR-21/22/23/24 and ownership constraints.
- Naming conventions are consistent.
- Internal fields not exposed (no raw queue metadata, no internal DB flags beyond domain-visible state).
