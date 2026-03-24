# PSMS Database Design (DDD-First, Pre-Prisma)

## 1. Scope and Principles

This document defines the logical database design for PSMS before Prisma implementation.

Design goals:

- Preserve aggregate invariants from domain and business rules
- Keep aggregate boundaries explicit to avoid anemic domain behavior
- Support real query patterns (calendar, conflict check, search/filter/export, reminders, stats)
- Balance normalization and performance for PostgreSQL

Primary references used:

- `docs/srs/SRS.md` (Section 4 Data Requirements)
- `docs/domain/domain-model.md`
- `docs/business-rules/business-rules.md`
- `docs/features/appointment.md`
- Sequence diagrams in `docs/diagrams/sequence/`

---

## 2. Aggregate Identification

### 2.1 Account Aggregate

Aggregate name: Account

Root entity:

- User

Internal entities / value objects:

- UserProfile (VO: display name, avatar URL)
- Credential (VO: password hash metadata)

Invariants:

- Email is unique globally (BR-1)
- Password is stored hashed only (BR-32)
- Profile updates are scoped to owner only (BR-5)

---

### 2.2 Scheduling Aggregate

Aggregate name: Scheduling

Root entity:

- Appointment

Internal entities / value objects:

- TimeRange (VO: start_at, end_at)
- RecurrenceRule (VO: frequency, interval, by_day, end condition)
- AppointmentStatus (VO/enum)

Invariants:

- `start_at < end_at` (BR-6)
- Appointment cannot be created in the past (BR-7)
- No overlapping active appointments for the same user (BR-8)
- If recurring, recurrence pattern must be valid daily/weekly/monthly (BR-9)
- Series update/delete supports `single` and `series` scope (BR-12)

Notes on boundary:

- Reminders are not internal entities of Scheduling in persistence, even though they are created in the same user flow.
- Reason: reminder lifecycle (trigger/snooze/retrigger) evolves independently and is handled by scheduler/notification flow.

---

### 2.3 Tag Catalog Aggregate

Aggregate name: Tag Catalog

Root entity:

- Tag

Internal entities / value objects:

- TagName (VO)
- TagColor (VO)

Invariants:

- Tag name is unique per user (BR-19)
- Tag belongs to exactly one user

Notes on association:

- Appointment-Tag relation is modeled as a linking table owned operationally by Scheduling write use cases.

---

### 2.4 Reminder Aggregate

Aggregate name: Reminder

Root entity:

- Reminder

Internal entities / value objects:

- ReminderOffsetOrAt (VO: either offset minutes or explicit remind_at)
- ReminderState (VO: pending, triggered, snoozed, cancelled)

Invariants:

- Reminder belongs to one appointment
- Reminder trigger time must be before appointment start (BR-21)
- Multiple reminders per appointment are allowed (BR-22)
- Snooze produces a next trigger time in future (BR-24)

---

### 2.5 Notification Log Aggregate

Aggregate name: Notification Log

Root entity:

- Notification

Internal entities / value objects:

- NotificationType (REMINDER, SYSTEM)
- DeliveryState (scheduled, triggered, read)

Invariants:

- Notification belongs to one user (domain invariant)
- Triggered reminders are persisted to history log (BR-25)

---

### 2.6 Auth Audit Aggregate

Aggregate name: Auth Audit

Root entity:

- AuthAttempt

Internal entities / value objects:

- AuthResult (success, failure)
- ClientContext (ip, user agent)

Invariants:

- Every login attempt is logged (BR-33)

---

## 3. Logical Database Design

### 3.1 Account Aggregate Tables

#### Table: users

Purpose:

- Root table for account and ownership boundary

Fields:

- `id uuid pk`: user identifier
- `email varchar(255) not null unique`: login identity
- `password_hash varchar(255) not null`: hashed credential
- `display_name varchar(100) null`: profile name
- `avatar_url varchar(1024) null`: profile avatar
- `created_at timestamptz not null default now()`: creation time
- `updated_at timestamptz not null default now()`: last update
- `deleted_at timestamptz null`: soft-delete marker (optional); physical delete can still be used for DI-2

Relationships:

- 1:N to appointments
- 1:N to tags
- 1:N to notifications
- 1:N to auth_attempts

Index strategy:

- Unique: `(email)`
- Optional: `(deleted_at)` partial for active users if soft delete is used

---

### 3.2 Scheduling Aggregate Tables

#### Table: appointment_series

Purpose:

- Root metadata for recurring configuration
- Non-recurring appointments may have `series_id = null` in `appointments`

Fields:

- `id uuid pk`
- `user_id uuid not null fk -> users(id)`
- `title varchar(255) not null`
- `description text null`
- `recurrence_freq varchar(16) not null`: DAILY | WEEKLY | MONTHLY
- `recurrence_interval int not null default 1`
- `recurrence_by_day varchar(32)[] null`: e.g. [MO,WE,FR]
- `recurrence_day_of_month smallint null`: for monthly mode
- `recurrence_count int null`: end after N occurrences
- `recurrence_until timestamptz null`: end date
- `series_timezone varchar(64) not null`: timezone for recurrence expansion
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `cancelled_at timestamptz null`

Relationships:

- 1:N to appointments

Index strategy:

- `(user_id, created_at desc)`
- `(user_id, cancelled_at)`

Constraints:

- Exactly one end condition allowed: `recurrence_count` xor `recurrence_until` or none

#### Table: appointments

Purpose:

- Core scheduling entity for single and generated recurring instances

Fields:

- `id uuid pk`
- `user_id uuid not null fk -> users(id)`
- `series_id uuid null fk -> appointment_series(id)`
- `title varchar(255) not null`
- `description text null`
- `starts_at timestamptz not null`
- `ends_at timestamptz not null`
- `time_range tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored`
- `status varchar(16) not null`: SCHEDULED | COMPLETED | CANCELLED | MISSED
- `is_all_day boolean not null default false`
- `is_recurring_instance boolean not null default false`
- `occurrence_index int null`: position in series
- `source_kind varchar(16) not null default 'USER'`: USER | SYSTEM
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Relationships:

- N:1 to users
- N:1 to appointment_series (optional)
- 1:N to reminders
- N:M to tags via appointment_tags

Index strategy:

- B-tree: `(user_id, starts_at)` for day/week/month/calendar queries
- B-tree: `(user_id, status, starts_at)` for status+date filters
- B-tree: `(series_id, occurrence_index)` for recurring scope operations
- B-tree partial: `(user_id, starts_at)` where `deleted_at is null`
- GIN full text: `to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,''))` for keyword search
- GiST exclusion constraint for conflict prevention:
  - `exclude using gist (user_id with =, time_range with &&)`
  - Condition: apply only when `status in ('SCHEDULED')` and `deleted_at is null`

Constraints:

- Check: `starts_at < ends_at`
- Check: `status in ('SCHEDULED','COMPLETED','CANCELLED','MISSED')`

Trade-off note:

- Exclusion constraint gives strongest integrity for overlap rule (BR-8) but adds write overhead.

#### Table: appointment_tags

Purpose:

- Association between appointment and user-defined tags

Fields:

- `appointment_id uuid not null fk -> appointments(id)`
- `tag_id uuid not null fk -> tags(id)`
- `assigned_at timestamptz not null default now()`

Primary key:

- `(appointment_id, tag_id)`

Index strategy:

- `(tag_id, appointment_id)` for tag filter search
- Optional covering index `(appointment_id, tag_id)` already via PK

Constraints:

- Enforce same-owner relation in application/domain service
- Optional DB-level enforcement via trigger: appointment.user_id must equal tag.user_id

---

### 3.3 Tag Catalog Aggregate Tables

#### Table: tags

Purpose:

- Per-user taxonomy for appointment organization

Fields:

- `id uuid pk`
- `user_id uuid not null fk -> users(id)`
- `name varchar(50) not null`
- `color varchar(16) null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Relationships:

- N:1 to users
- N:M to appointments via appointment_tags

Index strategy:

- Unique: `(user_id, lower(name))` where `deleted_at is null`
- `(user_id, created_at desc)`

---

### 3.4 Reminder Aggregate Tables

#### Table: reminders

Purpose:

- Reminder schedule and state for each appointment

Fields:

- `id uuid pk`
- `appointment_id uuid not null fk -> appointments(id)`
- `user_id uuid not null fk -> users(id)`: denormalized ownership for fast scheduler/security filters
- `remind_at timestamptz not null`
- `next_trigger_at timestamptz not null`
- `state varchar(16) not null`: PENDING | TRIGGERED | SNOOZED | CANCELLED
- `triggered_at timestamptz null`
- `snooze_count int not null default 0`
- `last_snooze_minutes int null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Relationships:

- N:1 to appointments
- N:1 to users

Index strategy:

- `(next_trigger_at)` partial where `state in ('PENDING','SNOOZED')` for scheduler polling
- `(appointment_id)` for appointment details view
- `(user_id, state, next_trigger_at)` for user reminder timeline

Constraints:

- Check state domain values
- Reminder time validation against appointment start is domain/service enforced; optional trigger can enforce at DB level

#### Table: reminder_events

Purpose:

- Event log for reminder lifecycle (triggered, snoozed, cancelled)

Fields:

- `id bigserial pk`
- `reminder_id uuid not null fk -> reminders(id)`
- `event_type varchar(16) not null`: TRIGGERED | SNOOZED | CANCELLED
- `event_at timestamptz not null default now()`
- `payload jsonb null`: duration, reason, metadata

Index strategy:

- `(reminder_id, event_at desc)`

---

### 3.5 Notification Log Aggregate Tables

#### Table: notifications

Purpose:

- In-app notification history and read tracking

Fields:

- `id uuid pk`
- `user_id uuid not null fk -> users(id)`
- `appointment_id uuid null fk -> appointments(id)`
- `reminder_id uuid null fk -> reminders(id)`
- `type varchar(16) not null`: REMINDER | SYSTEM
- `message text not null`
- `scheduled_at timestamptz not null`
- `triggered_at timestamptz null`
- `read_at timestamptz null`
- `created_at timestamptz not null default now()`

Index strategy:

- `(user_id, created_at desc)` for history list
- `(user_id, read_at)` for unread count
- `(reminder_id)` for traceability

---

### 3.6 Auth Audit Aggregate Tables

#### Table: auth_attempts

Purpose:

- Security audit trail for login attempts

Fields:

- `id bigserial pk`
- `email varchar(255) not null`
- `user_id uuid null fk -> users(id)`
- `result varchar(16) not null`: SUCCESS | FAILURE
- `reason varchar(64) null`
- `ip inet null`
- `user_agent text null`
- `attempted_at timestamptz not null default now()`

Index strategy:

- `(attempted_at desc)`
- `(email, attempted_at desc)`
- `(user_id, attempted_at desc)`

---

### 3.7 Optional Read Models (Performance-Oriented)

These are projections, not aggregate roots.

#### Table: user_monthly_stats

Purpose:

- Precomputed monthly metrics for fast dashboard load

Fields:

- `user_id uuid not null`
- `month date not null`: first day of month
- `total_count int not null`
- `completed_count int not null`
- `completion_rate numeric(5,4) not null`
- `top_slot varchar(32) null`
- `updated_at timestamptz not null`

Primary key:

- `(user_id, month)`

Index strategy:

- `(user_id, month desc)`

Update model:

- Recompute asynchronously on appointment status/time changes

Trade-off note:

- Adds write complexity/eventual consistency but keeps dashboard under performance target (PER-2).

---

## 4. Why This Structure and Trade-offs

### 4.1 Why aggregate split is this way

- Scheduling is isolated because overlap and recurrence invariants are complex and high-risk.
- Reminder is separated from Scheduling to allow independent trigger/snooze lifecycle and scheduler scaling.
- Notification Log is separated from Reminder to preserve immutable history and support future channels (email/push).
- Tag Catalog is separate to prevent tag rename/delete logic from bloating appointment root logic.

### 4.2 Normalization vs performance decisions

Normalized choices:

- `appointments`, `tags`, `appointment_tags` keep many-to-many clean and avoid duplicated tag strings.
- `appointment_series` avoids repeating recurrence metadata on every instance.

Intentional denormalization:

- `reminders.user_id` duplicates ownership from appointment for fast polling and authorization checks.
- Optional `user_monthly_stats` duplicates derived metrics to reduce heavy aggregation latency.

Performance-first indexing choices:

- GiST exclusion for strict conflict prevention
- Composite date/status/user indexes for calendar and filter endpoints
- Full-text index for keyword search

### 4.3 Potential scaling issues

1. Conflict detection write contention:

- Exclusion constraints can slow write throughput under high concurrent inserts per same user.
- Mitigation: keep transactions short; optionally shard by user hash or move heavy accounts to isolated partitions.

2. Large appointment volume per user:

- Calendar range scans may degrade with multi-year history.
- Mitigation: range partition `appointments` by month or quarter on `starts_at` once data grows.

3. Scheduler hot scans:

- Reminder polling can become expensive if full-table scans occur.
- Mitigation: partial index on `next_trigger_at` + `state`, process in small batches.

4. Statistics aggregation cost:

- On-demand full scans for each dashboard request are expensive.
- Mitigation: projection table (`user_monthly_stats`) and background updates.

---

## 5. Query Patterns and Schema Support

### Q1. Create appointment with conflict prevention

Pattern:

- Insert appointment only if no overlapping scheduled appointment exists for same user.

Support:

- `appointments` exclusion constraint on `(user_id, time_range &&)`
- Check `starts_at < ends_at`

### Q2. Update appointment (single or series)

Pattern:

- For recurring entries, apply updates by scope: one instance or whole series.

Support:

- `appointments.series_id`
- `appointments(series_id, occurrence_index)` index
- `appointment_series` metadata table

### Q3. Calendar Day/Week/Month view

Pattern:

- Get user appointments in date range, ordered by start time.

Support:

- `appointments(user_id, starts_at)`
- Optional partition pruning on `starts_at`

### Q4. Search/filter by keyword, range, tag, status

Pattern:

- Combined filters from query endpoint and export endpoint.

Support:

- FTS GIN index on title+description
- `appointments(user_id, status, starts_at)`
- `appointment_tags(tag_id, appointment_id)`

### Q5. Configure and trigger reminders

Pattern:

- Save multiple reminders per appointment; scheduler pulls due reminders.

Support:

- `reminders(appointment_id)`
- Partial index on `reminders(next_trigger_at)` where state is pending/snoozed
- `reminder_events` for lifecycle traceability

### Q6. Snooze reminder

Pattern:

- Update next trigger time and record snooze event.

Support:

- `reminders(id)` PK update
- `reminder_events(reminder_id, event_at desc)`

### Q7. Notification history and unread count

Pattern:

- List user notifications newest first and compute unread badge.

Support:

- `notifications(user_id, created_at desc)`
- `notifications(user_id, read_at)`

### Q8. Monthly statistics dashboard

Pattern:

- Completion rate + productive slot for selected month.

Support:

- Base query from `appointments` filtered by user/month/status
- Optional fast path via `user_monthly_stats`

### Q9. Export CSV with active filters

Pattern:

- Same filter logic as search, but returns complete result set for export.

Support:

- Reuse Q4 indexes and query plan
- Stream rows ordered by `starts_at` to reduce memory spikes

---

## 6. Anti-pattern Warnings

1. Do not embed reminder and notification mutable state directly inside `appointments` row.

- This creates a god aggregate and harms independent scheduling throughput.

2. Do not rely only on application-level overlap checks.

- Race conditions under concurrency can violate BR-8 without DB-level exclusion.

3. Do not use string tags inline on appointments.

- Causes duplication, weak consistency, and poor filtering/indexing behavior.

4. Do not compute statistics with unbounded scans on every request.

- Dashboard latency will degrade as history grows.

5. Do not skip ownership columns/filters in child tables.

- Access-control rule BR-5 must be enforceable and query-efficient.

6. Avoid cross-aggregate transactions for long workflows.

- Prefer short transaction in aggregate + events for downstream updates (reminder scheduling, stats projections).

---

## 7. Implementation Notes for Prisma Phase (Deferred)

This section is intentionally non-Prisma and serves only as guardrails for the next phase:

- Preserve aggregate boundaries as separate repositories/modules
- Map critical DB constraints (checks, unique, exclusion) explicitly
- Keep read models/projections optional and behind clear update workflows
- Ensure all write paths are user-scoped and auditable
