# Decision Table — F4 Create Series

## Metadata

| Item              | Value                               |
| ----------------- | ----------------------------------- |
| Function          | createSeries                        |
| Feature           | F4 Appointment Series Management    |
| Related SRS       | FR-06, FR-07, FR-08, FR-09          |
| Related Use Cases | UC-6, UC-7, UC-8, UC-12             |
| Business Rules    | BR-5, BR-6, BR-7, BR-8, BR-9, BR-10 |
| Test Technique    | Decision Table Testing              |
| Test Style        | Black-box                           |

---

## Related FR / UC / BR References

| Reference Type | Details                             |
| -------------- | ----------------------------------- |
| FR             | FR-06, FR-07, FR-08, FR-09          |
| UC             | UC-6, UC-7, UC-8, UC-12             |
| BR             | BR-5, BR-6, BR-7, BR-8, BR-9, BR-10 |

---

# Decision Table

| Conditions / Actions                                           | UTCID01 | UTCID02 | UTCID03 | UTCID04 | UTCID05 | UTCID06 | UTCID07 | UTCID08 | UTCID09 | UTCID10 | UTCID11 | UTCID12 | UTCID13 | UTCID14 | UTCID15 | UTCID16 | UTCID17 | UTCID18 |
| -------------------------------------------------------------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- |
| Auth header `Bearer jwt-alice-2026-05-17-001`                  | O       | O       | O       | O       | O       | O       |         | O       | O       | O       | O       | O       | O       | O       | O       | O       | O       | O       |
| startTime `2026-05-20T09:00:00Z`                               | O       | O       | O       | O       | O       | O       |         |         |         |         |         | O       |         |         |         |         |         |         |
| endTime `2026-05-20T10:00:00Z`                                 | O       | O       | O       | O       | O       | O       |         |         |         |         |         | O       |         |         |         |         |         |         |
| recurrenceRule `FREQ=WEEKLY;COUNT=5`                           | O       |         |         |         |         | O       |         | O       | O       | O       | O       |         | O       | O       | O       | O       | O       | O       |
| recurrenceRule `FREQ=DAILY;COUNT=50`                           |         | O       |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |
| recurrenceRule `FREQ=DAILY;COUNT=51`                           |         |         |         |         | O       |         |         |         |         |         |         |         |         |         |         |         |         |         |
| recurrenceType `WEEKLY`                                        | O       |         |         |         |         | O       |         | O       | O       | O       | O       |         | O       | O       | O       | O       | O       | O       |
| recurrenceType `DAILY`                                         |         | O       |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |
| weeklyDays `[MON, WED, FRI]`                                   | O       |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |
| recurrenceType `INVALID_TYPE`                                  |         |         | O       |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |
| seriesTimezone `Mars/Phobos`                                   |         |         |         | O       |         |         |         |         |         |         |         |         |         |         |         |         |         |         |
| Missing JWT                                                    |         |         |         |         |         |         | O       |         |         |         |         |         |         |         |         |         |         |         |
| Existing appointment `09:00-10:00` same user                   |         |         |         |         |         | O       |         | O       | O       | O       | O       |         |         | O       |         |         |         |         |
| Existing appointment `09:00-10:00` different user              |         |         |         |         |         |         |         |         |         |         |         | O       |         |         |         |         |         |         |
| Candidate instance `10:00-11:00`                               |         |         |         |         |         |         |         | O       |         |         |         |         |         |         |         |         |         |         |
| Candidate instance `09:30-10:30`                               |         |         |         |         |         |         |         |         | O       |         |         |         |         |         |         |         |         |         |
| Candidate instance `09:15-09:45`                               |         |         |         |         |         |         |         |         |         | O       |         |         |         |         |         |         |         |         |
| Candidate instance `08:00-11:00`                               |         |         |         |         |         |         |         |         |         |         | O       |         |         |         |         |         |         |         |
| Candidate instance `08:00-08:59`                               |         |         |         |         |         |         |         |         |         |         |         |         | O       |         |         |         |         |         |
| Candidate instance `09:00-10:00` exact duplicate               |         |         |         |         |         |         |         |         |         |         |         |         |         |         | O       |         |         |         |
| startTime equals endTime (`09:00-09:00`)                       |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         | O       |         |         |
| endTime before startTime (`10:00-09:00`)                       |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         | O       |         |
| Invalid ISO datetime format                                    |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         | O       |
| Cross-day instance `23:00-01:00(+1)`                           |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         |         | O       |
| Expected HTTP `201 Created`                                    | O       | O       |         |         |         |         |         | O       |         |         |         | O       | O       |         |         |         |         | O       |
| Expected HTTP `400 Bad Request`                                |         |         | O       | O       |         |         |         |         |         |         |         |         |         |         |         | O       | O       | O       |
| Expected HTTP `401 Unauthorized`                               |         |         |         |         |         |         | O       |         |         |         |         |         |         |         |         |         |         |         |
| Expected HTTP `409 Conflict`                                   |         |         |         |         |         | O       |         |         | O       | O       | O       |         |         | O       | O       |         |         |         |
| Expected HTTP `422 Unprocessable Entity`                       |         |         |         |         | O       |         |         |         |         |         |         |         |         |         |         |         |         |         |
| generatedCount examples                                        | 5       | 50      |         |         |         |         |         | 5       |         |         |         | 5       | 5       |         |         |         |         | 2       |
| Async queue job created                                        | O       | O       |         |         |         |         |         | O       |         |         |         | O       | O       |         |         |         |         | O       |
| Conflict detection triggered                                   |         |         |         |         |         | O       |         |         | O       | O       | O       |         |         | O       | O       |         |         |         |
| Duration inheritance preserved                                 | O       | O       |         |         |         |         |         | O       |         |         |         | O       | O       |         |         |         |         | O       |
| Same `seriesId` for generated items                            | O       | O       |         |         |         |         |         | O       |         |         |         | O       | O       |         |         |         |         | O       |

---

# UTC Mapping

| UTC ID  | Scenario |
| ------- | -------- |
| UTCID01 | Alice creates weekly recurring series `FREQ=WEEKLY;COUNT=5`; backend creates 5 linked instances successfully. |
| UTCID02 | Alice creates daily series `FREQ=DAILY;COUNT=50`; backend accepts boundary value and generates 50 instances. |
| UTCID03 | Alice submits invalid recurrence type; backend returns `400 Bad Request`. |
| UTCID04 | Alice submits invalid timezone `Mars/Phobos`; backend returns `400 Bad Request`. |
| UTCID05 | Alice submits `FREQ=DAILY;COUNT=51`; backend returns `422 Unprocessable Entity`. |
| UTCID06 | Generated series overlaps existing Alice appointment; backend returns `409 Conflict`. |
| UTCID07 | Missing JWT when creating recurring series; backend returns `401 Unauthorized`. |
| UTCID08 | Generated instance starts exactly when existing appointment ends (`10:00`); backend accepts edge-touch case. |
| UTCID09 | Generated instance partially overlaps existing appointment (`09:30-10:30`); backend returns `409 Conflict`. |
| UTCID10 | Generated instance fully contained inside existing appointment (`09:15-09:45`); backend returns `409 Conflict`. |
| UTCID11 | Generated instance fully covers existing appointment (`08:00-11:00`); backend returns `409 Conflict`. |
| UTCID12 | Generated instance ends one minute before existing appointment starts (`08:00-08:59`); backend accepts request. |
| UTCID13 | Different user owns overlapping appointment; backend accepts request because overlap rule is user-scoped. |
| UTCID14 | Generated instance exactly duplicates existing appointment; backend returns `409 Conflict`. |
| UTCID15 | `startTime == endTime`; backend rejects zero-duration appointment with `400 Bad Request`. |
| UTCID16 | `endTime < startTime`; backend rejects invalid time range with `400 Bad Request`. |
| UTCID17 | Invalid datetime format submitted in request body; backend returns `400 Bad Request`. |
| UTCID18 | Cross-day recurring appointment (`23:00-01:00 next day`) is accepted and generated correctly. |

---

# Notes / Assumptions

| Item | Detail |
| ---- | ------ |
| Scope | This file validates `POST /appointments` when recurrence fields are provided. |
| Instance generation | Generated appointments must inherit base title, duration, owner, and recurrence metadata. |
| Queue processing | Successful requests enqueue async jobs for recurring instance expansion. |
| Limit rule | `COUNT` value inside recurrenceRule must not exceed `50`. |
| Overlap rule | Overlap exists only when `startA < endB AND endA > startB`. |
| Edge-touching | `endA == startB` is valid and NOT considered overlap. |
| Ownership rule | Overlap detection is user-scoped and does not apply across different users. |
| Validation rule | `startTime` must be earlier than `endTime`. |
| Datetime rule | Datetime fields must use valid ISO-8601 UTC format. |
| Transaction rule | Any overlap or validation failure rejects the entire series creation request. |