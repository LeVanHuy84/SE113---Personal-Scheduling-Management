# Phase 3 – Reminder System

## Goal

Implement reminder scheduling using Redis (BullMQ)

---

## Scope

### In scope

- Create reminder
- Push delayed job
- Worker trigger

### Out of scope

- Retry strategy (full)
- Dead letter queue

---

## APIs

### POST /reminders

Request:
{
appointmentId: string
remindAt: string
}

---

## Business Rules

- remindAt < startTime
- Each reminder → 1 job
- jobId = reminderId (idempotent)

---

## Flow

1. Validate
2. Save reminder
3. Push job to queue

---

## Edge Cases

- remindAt after startTime
- duplicate job

---

## Done Criteria

- Job scheduled correctly
- Worker triggers notification
