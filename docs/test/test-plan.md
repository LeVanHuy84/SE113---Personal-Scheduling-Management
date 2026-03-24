# Test Plan: PSMS System

## 1. Test Plan Identifier

- **ID:** PSMS-TP-R1.0-BE-20260324
- **Date:** 2026-03-24
- **Author:** QA/Backend Verification Team

## 2. Introduction

This test plan defines verification for the Personal Scheduling Management System (PSMS) backend APIs and asynchronous processing pipeline. The plan is based on `docs/srs/SRS.md`, `docs/business-rules/business-rules.md`, `docs/domain/domain-model.md`, `docs/database/database-design.md`, feature notes, phase documents, and sequence diagrams.

- **Objective:**  
  Verify that appointment lifecycle, reminder scheduling/triggering, recurring generation logic, tag/search/filter behavior, and notification history operate correctly and safely under defined business rules (BR-5, BR-6, BR-7, BR-8, BR-9, BR-12, BR-21, BR-22, BR-23, BR-24, BR-25, BR-26, BR-27).

- **Scope:**  
  Backend-only testing at Unit, Integration, API Contract/E2E, and System levels for NestJS modules and data flow over PostgreSQL and Redis/BullMQ. UI rendering, browser compatibility, and frontend usability are out of scope.

## 3. Test Items

- **Application baseline:** `psms` backend package version `0.0.1`.
- **Runtime modules under test:** `AppointmentModule`, `ReminderModule`, `RecurringModule`, `NotificationModule`, `QueueModule`.
- **Supporting modules touched by scenarios:** `AuthModule` (ownership/JWT checks), `PrismaModule`, `CommonModule` (global filter/interceptor behavior).
- **Core API endpoints:**
  - `POST /appointments`
  - `GET /appointments`
  - `DELETE /appointments/{id}?scope=single|series`
  - `PATCH /appointments/{id}/status`
  - `POST /appointments/{id}/reminders`
  - `POST /reminders/{id}/snooze`
  - `POST /tags`
  - `GET /tags`
  - `POST /appointments/{id}/tags`
  - `GET /notifications`
  - `PATCH /notifications/{id}/read`
- **Persistence items (Prisma/PostgreSQL):** `appointments`, `appointment_series`, `reminders`, `reminder_events`, `tags`, `appointment_tags`, `notifications`, `users`.
- **Queue items (Redis/BullMQ):** reminder delayed jobs, job idempotency (`jobId = reminderId`), worker-trigger execution path.

## 4. Features to be Tested

- **F1 Appointment create/update/delete/status (SRS 3.2, UC-6/UC-7/UC-8/UC-12):**
  - Time validation and ownership checks.
  - Conflict detection formula: `(startA < endB) AND (endA > startB)`.
  - Single vs series delete scope behavior.
  - Status transition handling and invalid transition rejection.
- **F2 Reminder scheduling and trigger path (SRS 3.4, UC-15/UC-20):**
  - `remindAt < appointment.startTime` validation.
  - Multiple reminders per appointment.
  - Delayed queue job creation and worker execution.
  - Trigger persistence into notification history.
- **F3 Snooze behavior (SRS 3.4, UC-16):**
  - Snooze recomputes `nextTriggerAt` and reschedules queue job.
  - Re-trigger flow consistency and state updates.
- **F4 Recurring appointment logic (SRS 3.2, UC-11):**
  - Daily/weekly/monthly recurrence parsing.
  - Upfront generation with max 50 instances (Phase 4 rule).
  - Conflict validation across generated instances.
  - Correct `seriesId` linkage.
- **F5 Tagging and search/filter (SRS 3.2, UC-13/UC-14):**
  - Tag CRUD constraints (unique per user).
  - Appointment-tag many-to-many consistency.
  - Query filtering by date range, tag, status, keyword.
  - Empty-result and multi-filter combinations.
- **F6 Notification history (SRS 3.4, UC-17):**
  - Triggered reminders persisted to notifications.
  - Read/unread state transitions.
  - User ownership isolation for notification retrieval.
- **F7 Cross-cutting non-functional checks (SRS 6.2/6.3):**
  - Appointment operation latency target under normal load (`< 2s`, BR-30).
  - JWT-protected access and data isolation (BR-3, BR-5).

## 5. Features Not to be Tested

- **Frontend/UI behavior:** calendar rendering, responsive layout, browser-specific UX (covered by frontend scope, not this backend plan).
- **OAuth and refresh-token flows:** explicitly out of scope in Phase 1.
- **Full RFC RRULE compatibility:** Phase 4 defines limited recurrence support only (daily/weekly/monthly).
- **External notification channels (email/SMS/push):** current release scope is in-app notifications.
- **Kafka event bus flows:** Kafka is not defined in architecture, dependencies, or phase docs for current release.

## 6. Approach

- **Techniques:**
  - Unit tests for domain/business-rule logic (validation, conflict math, recurrence bounds, status transitions).
  - Integration tests for service + repository + PostgreSQL behavior.
  - API contract/E2E tests with `supertest` against NestJS app.
  - Async system tests for Redis/BullMQ scheduling, worker trigger, snooze reschedule, and idempotent job handling.
  - Regression suite on every phase increment.
- **Levels and tools (actual stack):**
  - Unit/Integration/E2E runner: Jest + Nest testing utilities.
  - API testing: `supertest` and JSON schema/assertion checks.
  - DB verification: Prisma Client against isolated PostgreSQL test database.
  - Queue verification: Redis + BullMQ queue/worker inspection.
  - CI command gates: `npm run test`, `npm run test:e2e`, `npm run test:cov`.
- **Traceability mapping basis:**
  - SRS feature clauses (3.2 and 3.4).
  - BR mapping (BR-5/6/7/8/9/12/21/22/23/24/25/26/27/30).
  - Sequence flow references: create appointment, delete appointment, set reminders, snooze reminder, manage recurring appointment, manage tags, search/filter appointments, mark appointment completed.

## 7. Item Pass/Fail Criteria

- **Pass:**
  - 100% pass for Critical and High severity test cases in focused domains.
  - No open Severity-1 defects in appointment, reminder, recurring, tag/search, notification flows.
  - All BR-mapped assertions for focused modules pass.
  - E2E scenarios for all targeted endpoints pass in isolated test environment.
- **Fail:**
  - Any unresolved blocker in conflict detection, reminder trigger/snooze, recurring generation integrity, or user data isolation.
  - Any data corruption or inconsistency between queue events and persisted reminders/notifications.
  - Reproducible performance breach of BR-30 on core appointment APIs under normal test load.

## 8. Suspension Criteria and Resumption Requirements

- **Suspension:**
  - PostgreSQL or Redis test infrastructure unavailable for more than 30 minutes.
  - Global auth/ownership break causing invalid cross-user data access.
  - Queue worker failures causing reminder trigger tests to be non-executable.
  - Build instability where more than 20% of executed cases fail due to environment or shared blocker.
- **Resumption:**
  - Environment restored and smoke suite green for health checks.
  - Blocking defects patched and verified via targeted retest.
  - Queue + DB consistency checks pass for at least one end-to-end reminder scenario.

## 9. Test Deliverables

- IEEE Test Plan document (`docs/test/test-plan.md`).
- Requirement-to-test traceability matrix (SRS/BR/UC to test cases).
- Test case specifications and datasets (appointment, reminder, recurring, tagging/filtering, notification).
- Automated test code and execution logs (Jest unit/integration/e2e).
- Defect reports with severity, reproduction data, and impacted rule references.
- Final test summary report with release recommendation.

## 10. Testing Tasks

- **T0 Phase 0 Foundation validation:** verify env isolation, DB/Redis connectivity, global exception and response wrappers.
- **T1 Phase 1 prerequisites:** verify JWT/ownership guard preconditions for all protected target endpoints.
- **T2 Phase 2 Appointment Core:** design and execute conflict/time-validation and CRUD/status transition tests.
- **T3 Phase 3 Reminder System:** validate reminder persistence, queue scheduling, worker trigger, and idempotent job behavior.
- **T4 Phase 4 Recurring:** validate recurrence parsing, max-instance rule, series linkage, and conflict checks for generated instances.
- **T5 Phase 5 Tag & Search:** validate tag uniqueness, assignment integrity, and multi-criteria appointment filtering/search.
- **T6 Phase 6 Notification:** validate notification logging, read-status mutation, and ownership constraints.
- **T7 Cross-phase regression:** rerun critical flows after each phase completion.
- **T8 System-level integration run:** execute end-to-end scenarios across appointment → reminder → notification lifecycle.
- **T9 Reporting:** collect metrics, defects, residual risks, and sign-off evidence.

## 11. Environmental Needs

- **Runtime/Application:**
  - Node.js LTS compatible with NestJS 11 runtime.
  - NestJS backend service with modules loaded via `AppModule`.
- **Database:**
  - PostgreSQL instance for isolated test schema/database.
  - Prisma migrations/schema applied before execution.
- **Async/Queue:**
  - Redis instance.
  - BullMQ queue + worker processes enabled for reminder jobs.
- **Messaging:**
  - Kafka not required for this release test scope (no active Kafka integration in docs/dependencies).
- **Test tooling:**
  - Jest, ts-jest, supertest, Nest testing module.
  - Seed/reset scripts for deterministic fixtures.
- **Execution profile:**
  - Dedicated `.env.test` and `NODE_ENV=test` isolation.
  - Clock/timezone control strategy for reminder and recurrence timing assertions.

## 12. Responsibilities

- **QA Lead:** Owns strategy, risk decisions, entry/exit criteria, and final recommendation.
- **Backend QA Engineer(s):** Create/maintain automated tests for appointment/reminder/recurring/tag/notification APIs.
- **SDET/Automation Engineer:** Maintain CI pipelines, test data lifecycle, and flaky-test remediation.
- **Backend Developer (Module Owner):** Support defect triage/fixes and provide technical clarifications.
- **DevOps/Platform Engineer:** Maintain PostgreSQL/Redis test infrastructure and service availability.

## 13. Staffing and Training Needs

- **Required staffing:**
  - 1 QA Lead.
  - 2 QA engineers (API + integration focus).
  - 1 SDET (automation/CI support).
  - Shared backend engineer support per phase.
- **Required skills/training:**
  - NestJS testing patterns (`TestingModule`, dependency overrides).
  - Prisma transaction and relational assertion patterns.
  - Redis/BullMQ delayed job and worker observability.
  - Time-based test design (timezone, clock skew, deterministic scheduling).

## 14. Schedule

- **Baseline timeline (aligned to phases):**
  - Phase 0 gates and harness readiness: completed before feature test execution.
  - Phase 2 test design and automation: Week 1.
  - Phase 3 reminder async tests: Week 2.
  - Phase 4 recurring logic tests: Week 3.
  - Phase 5 tag/search tests: Week 4.
  - Phase 6 notification tests: Week 5.
  - Cross-phase regression and system test: Week 6.
  - Final defect burn-down and summary report: Week 7.
- **Milestones:**
  - Test design freeze: end of Week 2.
  - Full automation pass for focused scope: end of Week 5.
  - Release readiness decision: end of Week 7.

## 15. Risks and Contingencies

- **Risk:** Reminder jobs scheduled but not triggered due to worker/queue drift.
  - **Contingency:** Add health probes, queue depth monitoring, and replay tests for delayed jobs.
- **Risk:** Redis state inconsistency or stale queue entries after retries/redeploys.
  - **Contingency:** Enforce idempotent job IDs, cleanup hooks, and queue state reset per test run.
- **Risk:** Recurring series partial-write or conflict gaps under transaction failures.
  - **Contingency:** Validate transactional rollback scenarios and post-failure data integrity checks.
- **Risk:** Timezone/clock issues causing incorrect remindAt or recurrence generation.
  - **Contingency:** Standardize timezone in tests and use fixed clock injection for deterministic assertions.
- **Risk:** Ownership/security regression exposing cross-user appointments or notifications.
  - **Contingency:** Mandatory negative authorization tests on all protected endpoints in regression suite.
- **Risk:** Performance degradation on filtered queries and conflict checks.
  - **Contingency:** Run targeted performance baselines and query-plan review for indexed paths.

## 16. Approvals

- **QA Lead** — Approval pending
- **Backend Technical Lead** — Approval pending
- **Project Manager** — Approval pending
