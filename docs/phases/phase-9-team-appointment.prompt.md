# Phase 9 – Team Appointment

## Goal

Prepare Team Appointment feature delivery for implementation in a later phase by finalizing planning, data model, and API contract.

## Context

- Phase 8 Team Foundation is planned but not yet implemented.
- This phase is preparation-only and intentionally excludes backend implementation code.
- Team appointment behavior must align with SRS Team Management and Collaboration requirements.

## SRS Mapping (FR-22 to FR-29)

- FR-22: Create team appointment with team, organizer, and required participants.
- FR-23: Update team appointment with permission and conflict recheck.
- FR-24: Delete team appointment with recurring delete scope behavior.
- FR-25: Shared team calendar visibility for active members.
- FR-26: Team member list and role visibility.
- FR-27: Validate availability across required participants.
- FR-28: Block save when required participant conflicts are found.
- FR-29: Suggest optimal slots when requested time is unavailable.

## Business Rules Mapping

- BR-45: Team appointment belongs to exactly one team and one organizer.
- BR-46: Team appointment creation allowed to OWNER, ADMIN, or designated organizer role.
- BR-47: Update allowed to OWNER, ADMIN, or organizer.
- BR-48: Delete allowed to OWNER, ADMIN, or organizer.
- BR-49: Active members can view team appointments.
- BR-50: Recurring team delete supports single or series scope.
- BR-51: Detect/prevent conflicts across required participants before save.
- BR-52: Conflict check includes both personal and team appointments.
- BR-53: Reject create/update if any required participant conflicts.
- BR-54: Suggest common free slots for required participants.
- BR-55: Shared calendar visibility only for active team memberships.
- BR-56: Team appointment create/update/delete must be logged.

## Scope

### In scope

- Define Team Appointment and Appointment Participant data model.
- Define API contract for team appointment CRUD and participant operations.
- Define high-level authorization and conflict-check strategy.
- Define implementation sequence for Phase 9 execution.

### Out of scope

- NestJS module/controller/service/repository implementation.
- Background scheduling algorithms and final optimization heuristics.
- UI implementation for shared team calendar screens.
- Full recurring team series schema extension and instance generation logic.

## API Overview (High Level)

- POST /teams/:teamId/appointments: create team appointment and required participants.
- GET /teams/:teamId/appointments: list team appointments with time-range filtering.
- GET /teams/:teamId/appointments/:id: get one team appointment detail.
- PATCH /teams/:teamId/appointments/:id: update mutable fields and revalidate conflicts.
- DELETE /teams/:teamId/appointments/:id: delete appointment (single scope in this preparation contract).
- POST /teams/:teamId/appointments/:id/participants: add participants and re-check conflicts.
- DELETE /teams/:teamId/appointments/:id/participants/:userId: remove participant.

## Data Model Overview

- TeamAppointment
  - Owned by one Team.
  - Organized by one User.
  - Stores title, optional description/location, starts_at, ends_at, status, timestamps.
- AppointmentParticipant
  - Join table between TeamAppointment and User.
  - Represents required participants used for collaborative conflict checking.
  - Composite key prevents duplicate participant rows for one appointment.
- Index design
  - Team/time indexes optimize team calendar listing and date-range queries.
  - Organizer/time index supports organizer conflict checks.
  - Participant indexes support participant-based conflict detection joins.

## Architecture Notes

### Appointment vs TeamAppointment

- Appointment
  - Personal schedule entity; ownership is direct via userId.
  - Access scope is user-centric.
- TeamAppointment
  - Collaborative schedule entity; membership and team roles define access.
  - Organizer is explicit and participants are modeled via join table.
  - Designed for multi-user conflict evaluation before write operations.

### High-level Conflict Detection Strategy

For required participants of the requested TeamAppointment window [startAt, endAt), run overlap checks:

- Personal appointment conflicts per participant.
- Existing team appointment conflicts per participant via AppointmentParticipant.
- Overlap rule: (existingStart < requestedEnd) AND (existingEnd > requestedStart).

If any required participant conflicts, block create/update and return structured conflict details.

### Reuse of Existing Appointment Logic

- Reuse time-range validation and overlap predicate from personal appointment flow.
- Reuse authentication and current-user extraction patterns.
- Reuse pagination/filter conventions for listing endpoints.
- Extend authorization checks with team membership and role constraints.

## Step-by-step Implementation Plan (No Code)

1. Apply Prisma migration for TeamAppointment and AppointmentParticipant models.
2. Add repository query design for team-scoped listing and participant conflict checks.
3. Implement role authorization policy for OWNER, ADMIN, organizer, and active member views.
4. Implement create flow: validate team access, validate payload, validate participant membership, conflict check, persist appointment and participants.
5. Implement read flows: list and detail with team membership visibility checks.
6. Implement update flow: permission check, patch fields, rerun participant conflict checks, persist changes.
7. Implement delete flow: permission check and delete appointment with cascade participant cleanup.
8. Implement participant add/remove flows with membership checks and conflict revalidation on add.
9. Add audit logging hooks for create/update/delete actions per BR-56.
10. Add tests for authorization, conflict prevention, and participant management scenarios.

## Done Criteria

- Planning document is complete for FR-22 through FR-29.
- Prisma data model is prepared for team appointments and participants.
- API contract is complete for CRUD and participant endpoints.
- No source implementation code is added in src/.
