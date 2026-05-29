# DEFECT-UNIT-003

## Defect ID
DEFECT-UNIT-003

## Feature/Module
F3 Appointment Status Transition

## Related UTC IDs
ST-05

## Reproduction Steps
1. Inspect `AppointmentService.updateAppointmentStatus(id, status)` signature.
2. Observe that method receives no `userId`/principal context.
3. Method updates by `id` only after status checks.

## Expected Behavior
Status transition must enforce owner-only access and reject non-owner with `403 Forbidden`.

## Actual Behavior
Service cannot enforce ownership because it has no caller identity input.

## Severity
Critical

## Priority
High

## Root Cause Analysis
Ownership check logic is missing in service layer and no user context is passed into status update flow.

## Impacted Business Rule
BR-5 (user can only view/manage own appointments).

## Fix Status
Open

## Suggested Safe Fix
Pass authenticated `userId` into service and update repository query to scope by `{ id, userId }`; throw `ForbiddenException` when owner mismatch.
