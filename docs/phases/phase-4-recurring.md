# Phase 4 – Recurring Appointment

## Goal

Support recurring appointments (limited)

---

## Scope

### In scope

- RRULE (daily/weekly/monthly)
- Generate instances upfront (max 50)
- seriesId linking

### Out of scope

- Full RFC RRULE

---

## APIs

### POST /appointments (with recurrence)

Request:
{
title: string
startTime: string
endTime: string
recurrenceRule: string
}

---

## Business Rules

- Max 50 instances
- All instances must pass conflict check

---

## Flow

1. Parse RRULE
2. Generate instances
3. Validate conflict
4. Save all

---

## Edge Cases

- Partial conflict
- Too many instances

---

## Done Criteria

- Recurring created
- Instances linked by seriesId
