# DEFECT-UNIT-002

## Defect ID
DEFECT-UNIT-002

## Feature/Module
F4 Create Series

## Related UTC IDs
UTCID04

## Reproduction Steps
1. Call `AppointmentSeriesService.createAppointmentSeries(...)` with `seriesTimezone = 'Mars/Phobos'`.
2. Ensure conflict check returns false and tag existence check returns true.
3. Observe service behavior.

## Expected Behavior
Service must reject invalid timezone with `400 Bad Request`.

## Actual Behavior
Service accepted invalid timezone and proceeded with series creation.

## Severity
Major

## Priority
High

## Root Cause Analysis
No timezone validation existed in `createAppointmentSeries` and `updateAppointmentSeries`.

## Impacted Business Rule
BR-9 / validation consistency for recurrence payload quality (invalid recurrence metadata should be rejected).

## Fix Status
Fixed

## Applied Fix
Added `isValidTimezone` helper using `Intl.DateTimeFormat(..., { timeZone })` and guard clauses in both create/update methods.

## Verification
Covered by test:
- `src/appointment-series/series.service.spec.ts` test `UTCID04 should reject invalid timezone value`.
