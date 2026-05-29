# Decision Table — F3 Appointment Retrieval & Status Transition

## Metadata

| Item              | Value                                           |
| ----------------- | ----------------------------------------------- |
| Function          | getAppointments, updateAppointmentStatus        |
| Feature           | F3 Appointment Management                       |
| Related SRS       | FR-06, FR-07, FR-08, FR-09, FR-10              |
| Related Use Cases | UC-6, UC-7, UC-8, UC-12, UC-13                  |
| Business Rules    | BR-5, BR-14, BR-27                              |
| Test Technique    | Decision Table / Boundary Value Testing         |
| Test Style        | Black-box                                       |
| Status Values     | SCHEDULED, COMPLETED, CANCELLED, MISSED         |

## Related FR / UC / BR References

| Reference Type | Details                                         |
| -------------- | ----------------------------------------------- |
| FR             | FR-06, FR-07, FR-08, FR-09, FR-10              |
| UC             | UC-6, UC-7, UC-8, UC-12, UC-13                  |
| BR             | BR-5, BR-14, BR-27                              |

**Note:** Status values are based on Prisma schema (AppointmentStatus enum): SCHEDULED, COMPLETED, CANCELLED, MISSED. There are NO DRAFT or ONGOING statuses.

---

# Decision Table — Retrieval (GET /appointments)

## Decision Table

| Conditions / Actions                       | RT-01 | RT-02 | RT-03 | RT-04 | RT-05 | RT-06 | RT-07 |
| ------------------------------------------ | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| Valid token                                | O     | O     | O     | O     |       |       | O     |
| Missing token                              |       |       |       |       | O     |       |       |
| Expired token                              |       |       |       |       |       | O     |       |
| Filter `none`                              | O     |       |       |       | O     | O     | O     |
| Filter `status=SCHEDULED`                  |       | O     |       |       |       |       |       |
| Filter `page=2,limit=5`                    |       |       | O     |       |       |       |       |
| Filter `status=INVALID`                    |       |       |       | O     |       |       |       |
| User owns 10 appointments                  | O     |       | O     |       |       |       |       |
| User owns 5 scheduled appointments         |       | O     |       |       |       |       |       |
| Other users' appointments exist            |       |       |       |       |       |       | O     |
| Expected response contains only owned data | O     | O     | O     |       |       |       | O     |
| Expected HTTP `200 OK`                     | O     | O     | O     | O     |       |       | O     |
| Expected HTTP `400 Bad Request`            |       |       |       | O     |       |       |       |
| Expected HTTP `401 Unauthorized`           |       |       |       |       | O     | O     |       |
| Pagination applied                         | O     |       | O     |       |       |       |       |
| Status filter applied                      |       | O     |       |       |       |       |       |
| Data isolation enforced                    |       |       |       |       |       |       | O     |
| Type (`N`, `A`, `B`)                       | B     | B     | B     | A     | N     | N     | A     |

---

## UTC Mapping

| UTC ID | Scenario                                                                             |
| ------ | ------------------------------------------------------------------------------------ |
| RT-01  | Retrieve all appointments for authenticated user with default pagination.            |
| RT-02  | Retrieve only appointments with `status=SCHEDULED`.                                  |
| RT-03  | Retrieve appointments using `page=2&limit=5`.                                        |
| RT-04  | Invalid status filter is rejected or returns empty result according to API contract. |
| RT-05  | Retrieval request without token returns `401 Unauthorized`.                          |
| RT-06  | Retrieval request with expired token returns `401 Unauthorized`.                     |
| RT-07  | Retrieval excludes appointments belonging to other users.                            |

---

# Decision Table — Status Transition (PATCH /appointments/:id/status)

## Decision Table

| Conditions / Actions                    | ST-01 | ST-02 | ST-03 | ST-04 | ST-05 | ST-06 | ST-07 | ST-08 |
| --------------------------------------- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| Valid authentication token             | O     | O     | O     | O     | O     |       | O     | O     |
| Missing authentication token           |       |       |       |       |       | O     |       |       |
| Appointment exists                      | O     | O     | O     | O     | O     | O     |       | O     |
| User is appointment owner               | O     | O     | O     | O     |       | O     | O     | O     |
| User is NOT appointment owner           |       |       |       |       | O     |       |       |       |
| Current status `SCHEDULED`              | O     | O     |       |       | O     | O     | O     |       |
| Current status `COMPLETED` (terminal)   |       |       | O     |       |       |       |       |       |
| Current status `CANCELLED` (terminal)   |       |       |       | O     |       |       |       |       |
| Current status `MISSED` (terminal)      |       |       |       |       |       |       |       |       |
| Target status `COMPLETED`               | O     |       |       |       | O     | O     | O     |       |
| Target status `CANCELLED`               |       | O     |       |       |       |       |       |       |
| Target status `MISSED`                  |       |       |       |       |       |       |       |       |
| Target status `INVALID_VALUE`           |       |       |       |       |       |       |       | O     |
| Current = Terminal state                |       |       | O     | O     |       |       |       |       |
| Update allowed (not from terminal)      | O     | O     |       |       |       |       |       |       |
| Update rejected (from terminal state)   |       |       | O     | O     |       |       |       |       |
| Expected HTTP `200 OK`                  | O     | O     |       |       |       |       |       |       |
| Expected HTTP `400 Bad Request`         |       |       | O     | O     |       |       |       | O     |
| Expected HTTP `401 Unauthorized`        |       |       |       |       |       | O     |       |       |
| Expected HTTP `403 Forbidden`           |       |       |       |       | O     |       |       |       |
| Expected HTTP `404 Not Found`           |       |       |       |       |       |       | O     |       |
| Type (`N`, `A`, `B`)                    | B     | B     | A     | A     | A     | N     | N     | A     |

---

## UTC Mapping

| UTC ID | Scenario                                                                                                       |
| ------ | -------------------------------------------------------------------------------------------------------------- |
| ST-01  | Authenticated owner transitions appointment from `SCHEDULED → COMPLETED` (allowed).                            |
| ST-02  | Authenticated owner transitions appointment from `SCHEDULED → CANCELLED` (allowed).                            |
| ST-03  | Attempt to transition from terminal state `COMPLETED → SCHEDULED` is rejected with `400 Bad Request`.        |
| ST-04  | Attempt to transition from terminal state `CANCELLED → SCHEDULED` is rejected with `400 Bad Request`.        |
| ST-05  | Non-owner attempts status transition and receives `403 Forbidden` (ownership check).                          |
| ST-06  | Request without authentication token returns `401 Unauthorized`.                                              |
| ST-07  | Status transition on non-existent appointment returns `404 Not Found`.                                        |
| ST-08  | Invalid target status value (e.g., `INVALID_VALUE`) returns `400 Bad Request`.                               |

---

# State Transition Rules (Based on BR-14 & FR-09)

**Terminal States (Cannot transition FROM these states):**
- `COMPLETED` - Appointment marked as done
- `CANCELLED` - Appointment was cancelled
- `MISSED` - Appointment was missed

**Allowed Transitions:**

| From         | To          | Rule                                  |
| ------------ | ----------- | ------------------------------------- |
| SCHEDULED    | COMPLETED   | ✓ Allowed (mark as complete)          |
| SCHEDULED    | CANCELLED   | ✓ Allowed (mark as cancelled)         |
| SCHEDULED    | MISSED      | ✓ Allowed (mark as missed)            |
| SCHEDULED    | SCHEDULED   | ✓ Allowed (no-op, same status)        |
| COMPLETED    | *           | ✗ Blocked (terminal state)            |
| CANCELLED    | *           | ✗ Blocked (terminal state)            |
| MISSED       | *           | ✗ Blocked (terminal state)            |

**Note:** The current implementation in `appointment.service.ts` blocks transitions FROM terminal states but allows transitions TO any non-terminal status value. No complex state machine validation is implemented.

## Notes / Assumptions

| Item              | Detail                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| Retrieval scope   | Retrieval APIs must only expose appointments belonging to the authenticated user (BR-5).                            |
| Status values     | Valid status enum values: `SCHEDULED`, `COMPLETED`, `CANCELLED`, `MISSED` (per Prisma schema).                     |
| Terminal states   | Terminal states (`COMPLETED`, `CANCELLED`, `MISSED`) block further transitions (BR-14, FR-09).                     |
| Ownership check   | Only the appointment owner can perform status transitions (BR-5).                                                    |
| No complex rules  | Current implementation has simple rule: block transitions FROM terminal states. No state machine validation.        |
| Validation        | Invalid status values or invalid filters return `400 Bad Request` per API contract.                                 |
| Defect logging    | Defects should reference TC ID and related BR/FR identifiers in `docs/test/defect/`.                               |
| Source of truth   | Prisma schema (`AppointmentStatus` enum) and `AppointmentService.updateAppointmentStatus()` method determine rules. |
