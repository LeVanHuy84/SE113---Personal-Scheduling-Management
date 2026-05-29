# Domain Model – PSMS

## 1. Overview

Core domain of Personal Scheduling Management System.

Main concern:

- Manage appointments
- Avoid time conflict
- Handle reminders & notifications

---

## 2. Entities

### User

- id: UUID
- email: string (unique)
- passwordHash: string
- name: string
- createdAt: timestamp

---

### Appointment

- id: UUID
- userId: UUID
- title: string
- description: string
- startTime: timestamp
- endTime: timestamp
- status: AppointmentStatus
- isRecurring: boolean
- recurrenceRule: string (RRULE)
- seriesId: UUID | null
- createdAt: timestamp
- updatedAt: timestamp

---

### Reminder

- id: UUID
- appointmentId: UUID
- remindAt: timestamp
- isTriggered: boolean

---

### Tag

- id: UUID
- userId: UUID
- name: string (unique per user)

---

### AppointmentTag

- appointmentId: UUID
- tagId: UUID

---

### Notification

- id: UUID
- userId: UUID
- appointmentId: UUID
- type: NotificationType
- message: string
- scheduledAt: timestamp
- triggeredAt: timestamp | null
- isRead: boolean

---

## 3. Relationships

- User 1 - N Appointment
- Appointment 1 - N Reminder
- Appointment N - N Tag (via AppointmentTag)
- Appointment 1 - N Notification

---

## 4. Enums

### AppointmentStatus

- SCHEDULED
- COMPLETED
- CANCELLED
- MISSED

---

### NotificationType

- REMINDER
- SYSTEM

---

## 5. Core Business Rules

### Time Validation

- startTime < endTime
- Cannot create appointment in the past

---

### Conflict Detection

(startA < endB) AND (endA > startB)

---

### Reminder

- remindAt < startTime
- Must be scheduled via Redis queue

---

### Recurring

- Store RRULE
- Generate instances upfront
- Link by seriesId

---

## 6. Invariants (VERY IMPORTANT)

- Appointment must belong to a User
- Reminder must belong to an Appointment
- Tag must belong to User
- Notification must belong to User

---

## 7. Index Suggestion (for DB)

- Appointment(userId, startTime)
- Appointment(seriesId)
- Reminder(appointmentId)
- Tag(userId, name)

---

## 8. Notes for Implementation

- Use transaction when:
  - Create appointment + reminder
- Avoid N+1 queries
- Always check ownership (userId)
