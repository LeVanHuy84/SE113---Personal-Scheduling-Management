# Test Plan: PSMS Backend Verification (Focused)

## 1. Test Plan Identifier

- **ID:** PSMS-TP-R1.1-BE-20260517
- **Date:** 2026-05-17
- **Author:** QA/Backend Verification Team

References:

- **SRS:** docs\srs\SRS.md
- **Business Rules:** docs\business-rules\business-rules.md

## 2. Introduction

This document narrows backend verification to a focused set of five core backend functions derived from the latest SRS, Business Rules, and API contracts. The intent is to keep the QA scope realistic for a phase-based backend project while concentrating on security, async consistency, and transaction integrity.

- **Objective:** Validate the highest-risk backend functions that affect data correctness, access control, and time-based processing.
- **Scope:** Backend-only testing at unit, integration, API contract/E2E, and async system levels. The plan is intentionally function-oriented and excludes broad module inventory, frontend behavior, and low-value surface area.

## 3. Test Items

- **Application baseline:** psms backend (current branch/commit under test).
- **Primary functional surfaces under test:** authentication endpoints, appointment lifecycle management, recurring-series management, and reminder processing pipeline.
- **Supporting services:** PrismaModule (persistence), CommonModule (guards/interceptors), NotificationService (internal support path), EmailService (worker side-effect checks only).
- **Core HTTP endpoints aligned to current contracts:**
  - **F1 User Registration:** `POST /auth/register`
  - **F2 User Authentication / Login:** `POST /auth/login`, `POST /auth/forgot-password`
  - **F3 Appointment Management:** `GET /appointments`, `PATCH /appointments/:id/status`
  - **F4 Appointment Series Management:** `POST /series`, `GET /series`, `PATCH /series/:id`, `DELETE /series/:id?scope=single|series`
  - **F5 Reminder & Notification Scheduling:** no public HTTP controller; verified through internal service/worker execution and persisted notification history

  Note: The test-plan aligns to the API contract surface. If a given deployment lacks public endpoints for create/update (e.g., POST/PUT), perform equivalent service-level integration tests (internal controller/service calls) and record implementation gaps in the defect log.

- **Supporting auth endpoint:** `POST /auth/reset-password` (regression coverage only; not a primary function in this plan).

- **Async/data surfaces:** reminder delayed jobs, worker processing, notification log persistence, and idempotent job handling through Redis/BullMQ.
- **Persistence items (Prisma/PostgreSQL):** users, appointments, appointment_series, reminders, notifications.

## 4. Features to be Tested (Core backend functions)

We retain five core backend functions. The first two are required auth-related functions; F3 covers appointment lifecycle management; F4 isolates recurring-series behavior; and F5 covers the async reminder/notification pipeline. Password reset remains in the auth regression matrix as supporting coverage, but it is no longer a primary function in this business-focused scope. Search/filtering, tag CRUD, team flows, statistics, CSV export, and notification HTTP endpoints are downgraded to supporting or out-of-scope checks.

- **F1 User Registration (SRS FR-01, UC-1):**
  - Validate unique email, password hashing, and required profile fields.
  - Verify ownership boundaries start at account creation; no duplicate account creation for the same email.
  - BR focus: BR-1, BR-31, BR-32.

- **F2 User Authentication / Login (SRS FR-02, FR-03, UC-2):**
  - Validate valid credentials, JWT issuance, token expiry, and authentication logging.
  - Enforce protected access on downstream endpoints.
  - BR focus: BR-2, BR-3, BR-4, BR-33.

  - **F3 Appointment Management (SRS FR-06, FR-07, FR-08, FR-09, FR-10, FR-11, FR-12, UC-6, UC-7, UC-8, UC-12, UC-13, UC-14):**
  - Focused test coverage (decision-table targets):
    - `detectOverlap`: conflict detection using `(startA < endB) AND (endA > startB)` — internal logic validation, used when updating appointment start/end times.
    - `transitionStatus`: validate allowed lifecycle/status transitions and rejection of invalid transitions via PATCH `/appointments/:id/status` endpoint.
    - `retrieveAppointments`: GET `/appointments` (paginated list) — light smoke coverage only.

  - **Note:** Appointment creation is now exclusively through F4 (`POST /series` with `recurrenceType: ONETIME`), not through direct `/appointments` endpoint. Appointment updates are limited to status transitions.
  - BR focus: BR-5, BR-6, BR-7, BR-8, BR-14, BR-19, BR-20, BR-27.

- **F4 Appointment Series Management (SRS FR-06, FR-07, FR-08, FR-09, UC-6, UC-7, UC-8, UC-12):**
  - Focused test coverage (decision-table targets):
    - `createSeries`: recurrence rule validation (RRULE params, boundaries, invalid recurrence rejection).
    - `generateInstances`: instance generation logic and boundary handling for series expansion.
    - `partialSeriesRollback`: transactional rollback behavior when a partial-series update/creation fails.

  - Skip extensive CRUD/list verification for `appointment_series` (smoke-only if needed).
  - BR focus: BR-9, BR-10, BR-12.

  - **F5 Reminder & Notification Scheduling (SRS FR-15, FR-16, FR-17, UC-15, UC-16, UC-17, UC-20):**
  - **Scope:** No public HTTP endpoints. Verified through internal service/worker execution and persisted notification history in database.
  - Focused test coverage (decision-table & async targets):
    - `scheduleReminderJob`: correct delay calculation, job creation for reminders via ReminderService internal API.
    - `processReminderJob` / `persistNotification`: BullMQ worker execution path that writes notification history and updates reminder status.
    - `retryAndIdempotency`: retry semantics, deduplication/idempotency on worker retries via queue idempotency keys.

  - Integration tests: verify via internal service calls and database state assertions; exclude HTTP endpoint testing.
  - BR focus: BR-21, BR-22, BR-23, BR-24, BR-25, BR-26.

Supporting verification only: password reset remains covered in the auth regression matrix, and tag/search/filter checks are supporting smoke coverage only.

## 5. Features Not to be Tested (out-of-scope)

- Frontend UI, calendar rendering, and client-side behaviors.
- Tag CRUD and appointment search/filter may be covered only as supporting smoke coverage if needed by appointment data setup.
- Team management, team appointment workflows, and availability checks.
- Statistics dashboards, trend endpoints, CSV export, and reporting flows.
- Notification HTTP endpoints, because the current backend exposes NotificationService as an internal service rather than a public controller.
- External notification delivery channels (email/SMS/push) as independent validation targets.
- Kafka or any other event bus not present in the current architecture or API contracts.

## 6. Test Approach

- **Unit testing:** auth validation, password reset rules, appointment lifecycle logic, recurrence generation, status transitions, and reminder timing calculations.
- **Integration testing:** service + repository + Prisma/PostgreSQL assertions for ownership, uniqueness, transaction integrity, and persisted side effects.
- **API contract / E2E testing:** `supertest` for the exposed auth, appointment, and series endpoints currently defined in the API contracts.
- **Async system testing:** Redis + BullMQ worker execution, delayed reminder delivery, snooze/reschedule handling, and notification log persistence.
- **Validation focus:** authorization isolation, overlap detection, series propagation correctness, state-transition correctness, idempotent job handling, and rollback integrity.

## 7. Traceability

- **F1 User Registration:** FR-01; UC-1; BR-1, BR-31, BR-32.
- **F2 User Authentication / Login:** FR-02, FR-03; UC-2; BR-2, BR-3, BR-4, BR-33.
- **F3 Appointment Management:** FR-06, FR-07, FR-08, FR-09, FR-10, FR-11, FR-12; UC-6, UC-7, UC-8, UC-12, UC-13, UC-14; BR-5, BR-6, BR-7, BR-8, BR-14, BR-19, BR-20, BR-27.
- **F4 Appointment Series Management:** FR-06, FR-07, FR-08, FR-09; UC-6, UC-7, UC-8, UC-12; BR-9, BR-10, BR-12.
- **F5 Reminder & Notification Scheduling:** FR-15, FR-16, FR-17; UC-15, UC-16, UC-17, UC-20; BR-21, BR-22, BR-23, BR-24, BR-25, BR-26.

- **Traceability note:** BR-30 is retained only as a secondary performance consideration and is not a primary scope driver in this reduced plan.

## 8. Item Pass/Fail Criteria

- **Pass:**
  - All Critical and High-severity test cases for the selected domains pass.
  - No unresolved Severity-1 defects in registration/login, appointment management, appointment series management, or reminder processing flows.
  - Ownership/isolation assertions (no cross-user access) validated across endpoints and services.
  - Async delivery correctness: scheduled reminders produce persisted notification records once; job idempotency enforced.

- **Fail:**
  - Any reproducible data integrity failure (transaction partial-writes, orphaned series instances, or inconsistent reminder/notification state).
  - Ownership/security breach exposing other users' data.
  - Lost or duplicated reminders due to queue idempotency or worker retry semantics.
  - Performance regressions that violate BR-30 for core appointment operations under normal load.

## 9. Suspension Criteria and Resumption Requirements

- **Suspension:**
  - PostgreSQL or Redis/BullMQ test infrastructure unavailable for longer than 30 minutes.
  - Critical auth or ownership regression that invalidates isolation tests.
  - Persistent worker/process failures preventing async scenario execution.

- **Resumption:**
  - Environment restored and core smoke checks pass (DB connectivity, Redis connectivity, auth token issuance, basic list/status endpoints).
  - Targeted retest of affected domain(s) passes.

## 10. Test Deliverables

- Updated Test Plan (this document).
- Requirement-to-test traceability matrix for the five retained functions.
- Automated test suites (Jest): unit, integration, and E2E/async tests.
- Test datasets and seed/reset scripts for deterministic fixtures.
- Execution logs, CI results, and defect reports with BR/UC mappings.

## 11. Testing Tasks (focused)

- **T0 Foundation:** environment and harness readiness — DB migrations applied, Redis/BullMQ available, `.env.test` configured, seed/reset scripts verified.
- **T1 User Registration / Login:** auth flow unit and integration tests, including token and ownership negative cases.
- **T2 Appointment Management:** contract and integration checks for appointment retrieval, scheduling, conflict detection, lifecycle rules, and status transitions.
- **T3 Appointment Series Management:** recurrence parsing, series linkage, instance generation, and propagation/update consistency tests.
- **T4 Async Reminder Processing:** delayed queue job tests, worker execution, snooze/reschedule, notification log persistence, and idempotency checks.
- **T5 Regression Smoke:** minimal end-to-end flow across auth, appointment management, series management, and reminder processing before release gating.

## 12. Environmental Needs

- Node.js LTS compatible with NestJS used in repo; NestJS app runnable via `npm run start:test` (or CI harness).
- PostgreSQL instance (isolated test DB) with Prisma migrations applied; seed/reset scripts available.
- Redis instance and BullMQ worker harness for async tests.
- Jest, ts-jest, supertest, Prisma Client, and local test harness scripts. Clock/time mocking library (e.g., `lolex`/`@sinonjs/fake-timers`) recommended for timing-sensitive tests.

## 13. Responsibilities

- **QA Lead:** strategy, entry/exit criteria, and sign-off.
- **Backend QA Engineer(s):** author and maintain tests for the 6 retained functions.
- **SDET/Automation Engineer:** CI integration, environment automation, flaky-test remediation.
- **Backend Module Owners:** support triage and fix verification.
- **Platform/DevOps:** provide and maintain test DB and Redis/BullMQ test infrastructure.

## 14. Staffing and Training Needs

- 1 QA Lead, 2 QA engineers, 1 SDET, with backend engineering support on-demand.
- Training: NestJS testing, Prisma transactions/tests, BullMQ/Redis testing patterns, deterministic time mocking.

## 15. Schedule (focused)

- Week 0: Environment and harness readiness (T0).
- Week 1: Registration and login tests (T1).
- Week 2: Appointment management tests (T2).
- Week 3: Appointment series management and async reminder processing tests (T3, T4).
- Week 4: Regression smoke and release review (T5).

- Milestones: scope freeze after Week 1; primary automation pass after Week 3; release gating after Week 4.

## 16. Risk Assessment

- **Worker/queue drift:** reminder jobs may be scheduled but not executed on time; mitigate with replay tests, queue health checks, and deterministic worker harnesses.
- **Duplicate or lost reminders:** Redis/BullMQ retry behavior can produce inconsistent state; mitigate with idempotent job IDs, cleanup hooks, and notification log assertions.
- **Series propagation failures:** recurring-series persistence may partially commit on errors or lose linkage; mitigate with rollback tests and post-failure data integrity checks.
- **Authorization regressions:** ownership checks may leak data across users; mitigate with negative tests on all protected endpoints and service-level isolation checks.
- **API contract drift:** current endpoint surface is narrower than older documentation; mitigate by keeping contract tests tied to the current docs/api-contract files.

## 17. Summary

- **Short summary:** the plan now centers on five core backend functions rather than large modules. It keeps auth, appointment management, appointment series management, and async reminder processing as the primary verification targets.
- **Removed or downgraded areas:** Password reset was downgraded from a primary function to supporting auth regression coverage. Appointment Search & Filtering was removed as a standalone primary function and folded into Appointment Management. Tag CRUD, Team Management, Statistics, CSV Export, and Notification HTTP endpoints are no longer primary scope items.
- **Inconsistencies found:** current appointment API contracts expose a smaller HTTP surface than the broader SRS wording suggested; Notification is internal-service only and does not have a public controller.

## 18. Approvals

- **QA Lead** - Approval pending
- **Backend Technical Lead** - Approval pending
- **Project Manager** - Approval pending
