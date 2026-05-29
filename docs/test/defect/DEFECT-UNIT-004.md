# DEFECT-UNIT-004

## Defect ID
DEFECT-UNIT-004

## Feature/Module
F3 Appointment Retrieval

## Related UTC IDs
RT-07

## Reproduction Steps
1. Inspect `AppointmentController.getAppointmentSeries(@Query() query)`.
2. Observe that query accepts `userId` from client input.
3. Service/repository retrieval is filtered directly by query `userId`.

## Expected Behavior
Retrieval should derive `userId` from authenticated token context, not client-supplied query input.

## Actual Behavior
Caller can provide arbitrary `userId` in query, risking cross-user data access.

## Severity
Critical

## Priority
High

## Root Cause Analysis
Controller does not bind query scope to authenticated principal; repository trusts input `userId`.

## Impacted Business Rule
BR-5 (user data isolation).

## Fix Status
Open

## Suggested Safe Fix
In controller, inject authenticated principal and overwrite query `userId` with token subject before calling service.
