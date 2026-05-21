# Decision Table — BullMQ Reminder Worker

## Metadata

| Item | Value |
|---|---|
| Function | ReminderProcessor.process |
| Feature | F5 Reminder & Notification Scheduling |
| Related SRS | FR-15, FR-16, FR-17 |
| Related Use Cases | UC-15, UC-16, UC-17, UC-20 |
| Business Rules | BR-23, BR-24, BR-25, BR-26 |
| Test Technique | Decision Table Testing |
| Test Style | Black-box |

---

# Related FR / UC / BR References

| Reference Type | Details |
|---|---|
| FR | FR-15, FR-16, FR-17 |
| UC | UC-15, UC-16, UC-17, UC-20 |
| BR | BR-23, BR-24, BR-25, BR-26 |

---

# Scope

This file validates BullMQ `reminder-queue` worker execution behavior.

The worker must:

- resolve appointment data from `appointmentId`
- skip cancelled or missing appointments
- send email + persist notification in parallel
- tolerate downstream failures using `Promise.allSettled`
- avoid crashing the worker process

---

# Condition Variables

| Variable | Concrete Values Used In Test |
|---|---|
| BullMQ job.id | `j-1`, `j-2`, `j-3`, `j-4`, `j-5`, `j-6` |
| appointmentId | `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa` |
| appointment.startAt | `2026-05-20T09:00:00Z` |
| appointment.endAt | `2026-05-20T10:00:00Z` |
| appointment.title | `Weekly Planning Meeting` |
| appointment.status | `SCHEDULED`, missing |
| appointment.series.cancelledAt | `null`, `2026-05-18T08:00:00Z` |
| emailRecipient | `alice@example.com` |
| emailServiceResult | success, failure |
| notificationServiceResult | success, failure |
| expectedNotificationCount | `0`, `1` |
| expectedEmailSentCount | `0`, `1` |
| workerOutcome | `DONE`, `SKIPPED` |
| expectedErrorLog | written, not-written |

---

# Shared Test Data

| Item | Value |
|---|---|
| Existing appointment ID | `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa` |
| Existing appointment owner | `alice@example.com` |
| Existing appointment slot | `2026-05-20T09:00:00Z → 2026-05-20T10:00:00Z` |
| Existing appointment title | `Weekly Planning Meeting` |
| Reminder trigger time | `2026-05-20T08:45:00Z` |
| Notification type | `REMINDER` |
| Queue name | `reminder-queue` |

---

# Decision Table

| Conditions / Actions | UTCID01 | UTCID02 | UTCID03 | UTCID04 | UTCID05 | UTCID06 |
|---|---|---|---|---|---|---|
| BullMQ job.id = `j-1..j-6` | O | O | O | O | O | O |
| appointmentId = `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa` | O | O | O | O | O | O |
| appointment exists | O | | O | O | O | O |
| appointment.status = `SCHEDULED` | O | | O | O | O | O |
| appointment.series.cancelledAt = `null` | O | | | O | O | O |
| appointment.series.cancelledAt = `2026-05-18T08:00:00Z` | | | O | | | |
| email recipient = `alice@example.com` | O | | | O | O | O |
| Email service returns success | O | | | | O | |
| Notification service returns success | O | | | O | | |
| Email service returns failure (`SMTP timeout`) | | | | O | | O |
| Notification service returns failure (`DB write failure`) | | | | | O | O |
| Expected notification persisted count = `1` | O | | | O | | |
| Expected notification persisted count = `0` | | O | O | | O | O |
| Expected email sent count = `1` | O | | | | O | |
| Expected email sent count = `0` | | O | O | O | | O |
| Expected processing outcome = `DONE` | O | | | O | O | O |
| Expected processing outcome = `SKIPPED` | | O | O | | | |
| Expected error log written | | | | O | O | O |
| Expected worker crash | | | | | | |
| Type (`N`, `B`, `A`) | N | A | A | B | B | A |

---

# UTC Mapping

| UTC ID | Scenario |
|---|---|
| UTCID01 | Valid reminder job `j-1` processes successfully; worker sends one email to `alice@example.com` and persists one `REMINDER` notification. |
| UTCID02 | Job `j-2` references a missing appointment; worker skips processing and persists no notification. |
| UTCID03 | Appointment belongs to a cancelled recurring series (`cancelledAt=2026-05-18T08:00:00Z`); worker skips processing. |
| UTCID04 | Email delivery fails with `SMTP timeout`, but notification persistence succeeds; worker logs the error and completes processing. |
| UTCID05 | Notification persistence fails with `DB write failure`, but email delivery succeeds; worker logs the downstream error and completes processing. |
| UTCID06 | Both email delivery and notification persistence fail simultaneously; worker still completes because downstream branches use `Promise.allSettled`. |

---

# Notes / Assumptions

| Item | Detail |
|---|---|
| Queue scope | Validates `reminder-queue` worker behavior only. |
| Reminder source | Reminder content is derived from appointment + recurring series metadata. |
| Cancellation rule | Worker skips processing when `appointment.series.cancelledAt IS NOT NULL`. |
| Failure handling | Email and notification failures are isolated and logged individually. |
| Persistence rule | Successful notification creation persists exactly one `Notification` row. |
| Notification fields | Persisted notification uses `type = REMINDER` and `triggeredAt = appointment.startAt`. |
| Reliability rule | Worker failures must not crash the BullMQ processor thread. |
| Retry behavior | Current phase assumes BullMQ retry policy is managed outside processor logic. |
