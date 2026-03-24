# Architecture Overview

## 1. Architectural Style

The system follows a **modular monolith architecture** using NestJS.

Key characteristics:

- Feature-based modular structure
- Layered architecture (Controller → Service → Repository)
- Event-driven communication for decoupling
- Single responsibility per service

---

## 2. Module Organization (CRITICAL)

The system MUST be organized by **feature modules**, not technical layers.

### Structure

src/
├── auth/
├── appointment/
├── reminder/
├── recurring/
├── notification/
├── statistics/
├── shared/
└── app.module.ts

Each module contains:

- controller
- service
- repository
- dto
- entity

### Rule

❌ DO NOT organize like:

- controllers/
- services/
- entities/

✅ ALWAYS group by feature

---

## 3. Dependency Rules (CRITICAL)

### 3.1 Avoid Circular Dependencies

Circular dependencies are strictly forbidden.

❌ Example:

- AppointmentModule ↔ ReminderModule

### Solutions:

- Extract shared logic into a separate module
- Use event-driven communication

---

### 3.2 Module Communication

Modules interact using:

1. Direct import (only when necessary)
2. Event-driven communication (preferred)

---

## 4. Module Sharing Pattern (CRITICAL)

### Rule:

- Services MUST belong to exactly ONE module
- Services MUST NOT be provided in multiple modules

### Correct Pattern:

- Define service in its module
- Export service
- Import module where needed

---

### Shared Modules

Use shared modules for:

- Guards
- Interceptors
- Utilities

Example:

shared/
├── guards/
├── interceptors/
├── filters/
└── shared.module.ts

---

### Global Modules (LIMITED USE)

Use `@Global()` ONLY for:

- ConfigService
- Logger
- Database connection

❌ DO NOT make feature modules global

---

## 5. Service Design (CRITICAL)

Each service MUST follow **Single Responsibility Principle**

### Rules:

- One service = one domain responsibility
- No "God service"

❌ Example:

- AppointmentAndReminderService

✅ Correct:

- AppointmentService
- ReminderService
- RecurringService

---

## 6. Data Access Layer (Repository Pattern)

All database access MUST go through repositories.

### Rules:

- Services MUST NOT contain complex queries
- Repositories handle query logic

### Example:

AppointmentService → AppointmentRepository → Database

---

## 7. Request Flow

Standard request lifecycle:

Client → Controller → Service → Repository → Database

### Responsibilities:

- Controller:
  - Handle HTTP
  - Validate DTO
- Service:
  - Business logic
- Repository:
  - Data access

---

## 8. Event-Driven Architecture

The system uses events to reduce coupling.

### When to use events:

- Reminder triggered after appointment created
- Notification sent after event occurs
- Statistics updated after actions

---

### Example Flow:

1. Appointment created
2. Emit event: `appointment.created`
3. Listeners:
   - ReminderService schedules reminder
   - NotificationService sends notification
   - StatisticsService updates data

---

## 9. Core Business Logic Placement

| Logic Type           | Location            |
| -------------------- | ------------------- |
| Time conflict        | AppointmentService  |
| Recurring logic      | RecurringService    |
| Reminder scheduling  | ReminderService     |
| Notification sending | NotificationService |

---

## 10. Scalability Strategy

Current:

- Modular monolith

Future:

- Split into microservices:
  - Auth Service
  - Appointment Service
  - Notification Service

Use events to ease migration.

---

## 11. Anti-Patterns (STRICTLY FORBIDDEN)

❌ Circular dependencies  
❌ God services  
❌ Business logic in controllers  
❌ Duplicate service instances  
❌ Direct DB queries in services  
❌ Tight coupling between modules

---

## 12. Summary

- Feature-based modules
- Clean separation of concerns
- Event-driven where possible
- Repository pattern enforced
- Strict dependency rules
