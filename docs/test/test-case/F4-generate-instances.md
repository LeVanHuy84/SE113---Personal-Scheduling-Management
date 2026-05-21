# Decision Table — F4 Generate Instances

## Metadata

| Item              | Value                            |
| ----------------- | -------------------------------- |
| Function          | generateInstances                |
| Feature           | F4 Appointment Series Management |
| Related SRS       | FR-06, FR-07, FR-08, FR-09       |
| Related Use Cases | UC-6, UC-7, UC-8, UC-12          |
| Business Rules    | BR-6, BR-7, BR-8, BR-9, BR-10    |
| Test Technique    | Decision Table Testing           |
| Test Style        | Black-box                        |

## Related FR / UC / BR References

| Reference Type | Details                       |
| -------------- | ----------------------------- |
| FR             | FR-06, FR-07, FR-08, FR-09    |
| UC             | UC-6, UC-7, UC-8, UC-12       |
| BR             | BR-6, BR-7, BR-8, BR-9, BR-10 |

## Decision Table

| Conditions / Actions                                                   | UTCID01 | UTCID02 | UTCID03 | UTCID04 | UTCID05 | UTCID06 |
| ---------------------------------------------------------------------- | ------- | ------- | ------- | ------- | ------- | ------- |
| Base title `Weekly Planning`                                           | O       | O       | O       | O       | O       | O       |
| Base title `Monthly Review`                                            |         | O       |         |         |         |         |
| Base startTime `2026-05-20T09:00:00Z`                                  | O       | O       | O       | O       | O       | O       |
| Base endTime `2026-05-20T10:00:00Z`                                    | O       | O       | O       | O       | O       | O       |
| recurrenceRule `FREQ=WEEKLY;COUNT=3`                                   | O       |         |         |         |         |         |
| recurrenceRule `FREQ=MONTHLY;COUNT=2`                                  |         | O       |         |         |         |         |
| recurrenceRule `FREQ=DAILY;COUNT=50`                                   |         |         | O       |         |         |         |
| recurrenceRule `FREQ=DAILY;COUNT=0`                                    |         |         |         | O       |         |         |
| recurrenceRule `FREQ=MONTHLY;COUNT=51`                                 |         |         |         |         | O       |         |
| Existing Alice appointment `2026-05-27T09:00:00Z-2026-05-27T10:00:00Z` |         |         |         |         |         | O       |
| Expected first instance `2026-05-20T09:00:00Z-2026-05-20T10:00:00Z`    | O       | O       | O       |         |         |         |
| Expected next instance `2026-05-27T09:00:00Z-2026-05-27T10:00:00Z`     | O       |         |         |         |         |         |
| Expected monthly instance `2026-06-20T09:00:00Z-2026-06-20T10:00:00Z`  |         | O       |         |         |         |         |
| Expected generatedCount `3`                                            | O       |         |         |         |         |         |
| Expected generatedCount `2`                                            |         | O       |         |         |         |         |
| Expected generatedCount `50`                                           |         |         | O       |         |         |         |
| Expected HTTP 200 OK                                                   | O       | O       | O       |         |         |         |
| Expected HTTP 400 Bad Request                                          |         |         |         | O       |         |         |
| Expected HTTP 422 Unprocessable Entity                                 |         |         |         |         | O       |         |
| Expected HTTP 409 Conflict                                             |         |         |         |         |         | O       |
| Inherited title preserved                                              | O       | O       | O       |         |         |         |
| Inherited duration preserved                                           | O       | O       | O       |         |         |         |
| Same seriesId on all items                                             | O       | O       | O       |         |         |         |
| Type (`N`, `A`, `B`)                                                   | N       | N       | B       | A       | A       | A       |

## UTC Mapping

| UTC ID  | Scenario                                                                                                                               |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| UTCID01 | Weekly rule `FREQ=WEEKLY;COUNT=3` produces instances on `2026-05-20`, `2026-05-27`, and `2026-06-03` with the same 60-minute duration. |
| UTCID02 | Monthly rule `FREQ=MONTHLY;COUNT=2` produces instances on `2026-05-20` and `2026-06-20`.                                               |
| UTCID03 | Daily rule `FREQ=DAILY;COUNT=50` produces exactly 50 instances and returns `200 OK`.                                                   |
| UTCID04 | Rule `FREQ=DAILY;COUNT=0` is rejected with `400 Bad Request`.                                                                          |
| UTCID05 | Rule `FREQ=MONTHLY;COUNT=51` is rejected with `422 Unprocessable Entity`.                                                              |
| UTCID06 | Generated weekly instance would overlap `2026-05-27T09:00:00Z-2026-05-27T10:00:00Z`; backend returns `409 Conflict`.                   |

## Notes / Assumptions

| Item              | Detail                                                                            |
| ----------------- | --------------------------------------------------------------------------------- |
| Scope             | This file focuses on observable instance output from recurring-series generation. |
| Inheritance       | Every generated item must keep the base appointment title and duration.           |
| Conflict behavior | Any overlapping generated item causes the full request to fail.                   |
