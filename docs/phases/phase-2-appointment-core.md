# Phase 2 – Appointment Core

## Goal

Implement core appointment logic with conflict detection

---

## Scope

### In scope

- Create appointment
- Get appointments (offset pagination)
- Conflict detection
- Time validation

### Out of scope

- Reminder
- Recurring

---

## APIs

### POST /appointments

Request:
{
title: string
description?: string
startTime: string
endTime: string
}

Response:
{
id: string
}

---

### GET /appointments?page=1&limit=10

---

## Business Rules

- startTime < endTime
- Cannot create in the past
- No overlap:
  (startA < endB) AND (endA > startB)

---

## Flow

1. Validate input
2. Check conflict
3. Save appointment

---

## Edge Cases

- Overlap
- start == end
- Past time

---

## Done Criteria

- Create success
- Conflict rejected
- Pagination works
