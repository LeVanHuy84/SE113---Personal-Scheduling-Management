# 🚀 APPOINTMENT SYSTEM – FULL CODE GENERATION PROMPT

## 🎯 ROLE

You are a Senior Backend Engineer specializing in NestJS, Prisma, BullMQ, and scalable system design.

---

## 🎯 GOAL

Generate a production-ready backend module for an Appointment Scheduling System based on the following architecture:

- Framework: NestJS
- ORM: Prisma (PostgreSQL)
- Queue: BullMQ (Redis)
- Scheduler: Cron (NestJS Schedule)
- Mail: Mock Mail Service (console log instead of real email)
- Architecture: Clean Architecture (Controller → Service → Repository)

---

## 🧱 CORE ARCHITECTURE

### Business Logic

- Appointment is NOT created directly
- Only AppointmentSeries is created
- Cron job generates appointments for next 30 days
- Each appointment has reminders
- Reminder is handled by BullMQ delay queue
- Worker sends email (mock)

---

## 📦 DATABASE (PRISMA MODELS)

### AppointmentSeries

- id (uuid)
- userId
- title
- description
- startTime
- endTime
- recurrenceFreq (DAILY | WEEKLY | MONTHLY)
- recurrenceInterval (default 1)
- recurrenceByDay (enum array: MON...SUN)
- recurrenceDayOfMonth (1–31)
- recurrenceUntil (nullable)
- timezone
- cancelledAt
- createdAt
- updatedAt

---

### Appointment

- id
- userId
- seriesId
- startsAt
- endsAt
- status
- createdAt

---

### Reminder

- id
- appointmentId
- userId
- offsetMinutes
- occurrenceTime
- jobId (BullMQ job id)
- state (PENDING | TRIGGERED)
- createdAt

---

### Notification

- id
- userId
- appointmentId
- reminderId
- message
- triggeredAt
- readAt
- createdAt

---

## ⚙️ FEATURES TO IMPLEMENT

---

### 1. CREATE APPOINTMENT

**Endpoint:**
POST /appointments
**Logic:**

- Validate time (start < end)
- Validate not in past
- Validate recurrence
- Check conflict (only first occurrence)
- Create AppointmentSeries
- DO NOT create Appointment yet

**Return:**

---

### 2. CRON JOB (IMPORTANT)

- Runs every 5 minutes
- Generate appointments for next 30 days
- Avoid duplicates

**For each occurrence:**

- Create Appointment
- Create Reminder(s)
- Push delay job to BullMQ

---

### 3. REMINDER WORKER (BullMQ)

- Process delayed job
- Load reminder + appointment
- Skip if deleted
- Send email (mock: console.log)
- Update reminder state
- Create notification

---

### 4. UPDATE APPOINTMENT

**Endpoint:**
PATCH /appointments/:seriesId
**Logic:**

- Validate ownership
- Validate input
- Update series
- Delete future appointments
- Delete future reminders
- Cancel all BullMQ jobs
- Cron will regenerate

---

### 5. DELETE APPOINTMENT

**Endpoint:**

**Logic:**

- Soft delete series (cancelledAt)
- Delete future appointments
- Delete future reminders
- Cancel BullMQ jobs

---

## 🧠 TECH REQUIREMENTS

### NestJS Modules

- AppointmentModule
- ReminderModule
- QueueModule
- CronModule

---

### Layers

- Controller
- Service
- Repository (Prisma)

---

## 🔁 BULLMQ CONFIG

- Queue name: `reminder-queue`
- Use delay job for reminder
- Store jobId in Reminder table

**Required function:**
Use proper HTTP errors:

400: INVALID_TIME, INVALID_RECURRENCE
401: UNAUTHORIZED (skip implementation)
403: FORBIDDEN
404: NOT_FOUND
409: CONFLICT

OUTPUT STRUCTURE
src/
    appointment/
      appointment.controller.ts
      appointment.service.ts
      appointment.repository.ts
    reminder/
    queue/
    cron/

🧪 BONUS (OPTIONAL)
DTO validation (class-validator)
🚨 IMPORTANT RULES
Do NOT skip any layer
Code must be complete and runnable
Use async/await properly
Follow NestJS best practices
Avoid pseudo-code
🎯 OUTPUT FORMAT
Generate full code files
Clearly separate each file
No explanation unless necessary
