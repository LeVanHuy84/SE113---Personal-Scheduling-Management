# AGENTS.md

This file provides guidance to AI coding agents (ChatGPT, Claude, Copilot, etc.) when working with this repository.

---

## 1. Project Overview

**Project Name:** Personal Scheduling Management System (PSMS)  
**Tech Stack:**

- Backend: NestJS
- Frontend: ReactJS (SPA)
- Database: PostgreSQL
- Deployment: Docker

The system allows users to manage personal schedules, appointments, reminders, and productivity statistics.

---

## 2. Source of Truth (IMPORTANT)

Before making any code or design decisions, ALWAYS refer to the following documents:

1. **SRS (Main Requirement Document)**
   - `docs/srs/SRS.md`
   - Contains all functional + non-functional requirements

2. **Domain Model**
   - `docs/domain/domain-model.md`
   - Defines core entities and relationships

3. **Business Rules**
   - `docs/business-rules/business-rules.md`
   - Contains constraints (e.g., time conflict, recurrence logic)

4. **Use Cases**
   - `docs/use-cases/`
   - Describes system behaviors from user perspective

5. **Sequence Diagrams**
   - `docs/diagrams/sequence/`
   - Shows real execution flow for each feature

👉 If there is any conflict:

- SRS > Business Rules > Diagrams > Code

---

## 3. Development Approach

The project is developed in **phases**:

- `phase-0-foundation.md`
- `phase-1-auth.md`
- `phase-2-appointment-core.md`
- `phase-3-reminder.md`
- `phase-4-recurring.md`
- `phase-5-tag-search.md`
- `phase-6-notification.md`
- `phase-7-statistics.md`

👉 Always check the current phase before implementing features.

---

## 4. Coding Guidelines (Backend - NestJS)

### Architecture

- Follow **modular architecture** (per feature)
- Use:
  - Controller → Handle request
  - Service → Business logic
  - Repository/Model → Data access

### Principles

- Follow **Clean Code** and **Separation of Concerns**
- Business logic MUST NOT be inside controller
- Validate input using DTO + class-validator
- Use async/await properly

### Authentication

- Use JWT-based authentication
- Protect routes using Guards

---

## 5. Core Business Rules (CRITICAL)

Some important rules to ALWAYS enforce:

- No overlapping appointments (time conflict detection)
- Support recurring appointments (daily, weekly, monthly)
- Reminders must trigger before event time
- Users can only access their own data
- Soft constraints must follow Business Rules document

👉 DO NOT implement logic that violates `business-rules.md`

---

## 6. Working with Features

When implementing a feature:

1. Read SRS section
2. Read related Use Case
3. Check Sequence Diagram
4. Check Business Rules
5. THEN write code

---

## 7. Naming Conventions

- Files: kebab-case
- Classes: PascalCase
- Variables: camelCase
- DTO: `CreateSomethingDto`, `UpdateSomethingDto`

---

## 8. Things to Avoid

❌ Do NOT:

- Skip reading docs
- Hardcode business logic without validation
- Mix multiple responsibilities in one service
- Ignore time conflict rules
- Bypass authentication

---

## 9. Expected Behavior from AI Agents

AI agents should:

- Understand system before coding
- Follow documentation strictly
- Generate consistent, maintainable code
- Ask for clarification if requirement is unclear

---

## 10. Future Extensions

Planned improvements:

- Google Calendar integration
- Real-time notifications
- Mobile support

---

## TL;DR

- Docs are the **source of truth**
- Business rules are **strict**
- Code must follow **NestJS best practices**
- Always implement features based on **Use Case + Sequence Diagram**
