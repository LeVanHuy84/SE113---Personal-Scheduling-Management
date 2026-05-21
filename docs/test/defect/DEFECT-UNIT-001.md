# DEFECT-UNIT-001

## Defect ID
DEFECT-UNIT-001

## Feature/Module
F3 Appointment Retrieval & Status Transition

## Related UTC IDs
ST-08

## Reproduction Steps
1. Call `AppointmentService.updateAppointmentStatus('app-1', 'INVALID_VALUE' as AppointmentStatus)`.
2. Repository returns an existing appointment with `status = SCHEDULED`.
3. Observe service behavior.

## Expected Behavior
Service must reject invalid status values with `400 Bad Request` before repository update.

## Actual Behavior
Service accepted invalid status values and forwarded them to repository update.

## Severity
Major

## Priority
High

## Root Cause Analysis
`updateAppointmentStatus` lacked runtime enum validation for `AppointmentStatus`.

## Impacted Business Rule
BR-14 (status values must be constrained to valid enum values).

## Fix Status
Fixed

## Applied Fix
Added explicit runtime guard:
- `if (!Object.values(AppointmentStatus).includes(status)) throw BadRequestException(...)`

## Verification
Covered by test:
- `src/appointment/appointment.service.spec.ts` test `ST-08 should reject invalid target status value`.
