# API Contract: Personal Statistics

## Feature

- Name: statistics (personal)
- Primary module: Statistics
- Related entities: Appointment, UserMonthlyStat
- Scope: **PERSONAL ONLY** — no team statistics in this release

## Related Use-cases

- UC-18: View productivity statistics
- UC-19: Export appointment data

## Endpoint 1: Get Personal Productivity Statistics

### Endpoint

- Method: GET
- URL: /statistics/me
- Description: Return personal productivity metrics for authenticated user in selected time range.

### Request DTO

#### GetStatisticsQueryDto

| Field     | Type                | Required | Validation                           |
| --------- | ------------------- | -------- | ------------------------------------ |
| startDate | ISO datetime string | Yes      | valid datetime; must be <= endDate   |
| endDate   | ISO datetime string | Yes      | valid datetime; must be >= startDate |
| groupBy   | enum string         | No       | day or week; default day             |
| timezone  | string              | No       | valid IANA timezone; default UTC     |

### Response DTO

#### StatisticsSummaryResponseDto

| Field                 | Type                      | Description                                 |
| --------------------- | ------------------------- | ------------------------------------------- |
| periodStart           | ISO datetime string       | Start of analyzed period                    |
| periodEnd             | ISO datetime string       | End of analyzed period                      |
| totalAppointments     | number                    | Total appointments in period                |
| completedAppointments | number                    | Completed count                             |
| completionRate        | number                    | Completed divided by total                  |
| mostProductiveSlot    | string nullable           | Time slot with highest completion frequency |
| trend                 | StatisticsTrendPointDto[] | Time-series aggregate points                |

#### StatisticsTrendPointDto

| Field     | Type   | Description                      |
| --------- | ------ | -------------------------------- |
| bucket    | string | Date/week label                  |
| total     | number | Total appointments in bucket     |
| completed | number | Completed appointments in bucket |

### Business Rules Mapping

- BR-34: authenticated access required.
- BR-15: calculations based on scheduled and completed appointments.
- BR-16: monthly/period logic constrained by selected range.
- BR-17: completionRate formula is completed divided by total.
- BR-18: most productive slot derived from completion frequency.
- BR-5: metrics only from requesting user data.

### Error Cases

- 400 Bad Request: invalid date range or groupBy value.
- 401 Unauthorized: missing or invalid JWT.
- 422 Unprocessable Entity: unsupported time window.

## Endpoint 2: Export Appointment Data

### Endpoint

- Method: GET
- URL: /export
- Description: Export user appointment data as CSV with applied filters.

### Request DTO

#### ExportAppointmentsQueryDto

| Field     | Type                | Required | Validation                              |
| --------- | ------------------- | -------- | --------------------------------------- |
| startDate | ISO datetime string | No       | must be <= endDate if provided          |
| endDate   | ISO datetime string | No       | must be >= startDate if provided        |
| tagId     | uuid string         | No       | tag must belong to user                 |
| status    | enum string         | No       | SCHEDULED, COMPLETED, CANCELLED, MISSED |
| query     | string              | No       | max length 255                          |

### Response DTO

#### ExportCsvResponseDto

| Field       | Type   | Description                                      |
| ----------- | ------ | ------------------------------------------------ |
| fileName    | string | Download file name, for example appointments.csv |
| contentType | string | text/csv                                         |
| content     | string | CSV payload stream or serialized content         |

### Business Rules Mapping

- BR-28: exported dataset must reflect selected filters.
- BR-29: output format is CSV in current release.
- BR-5: export includes only current user appointments.

### Error Cases

- 400 Bad Request: invalid filter values.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: no records available for provided filters.
- 500 Internal Server Error: CSV generation failure.

## Self Review

- UC-18 and UC-19 are covered without adding unrelated behavior.
- No duplicated endpoint definitions in this feature contract.
- Validation constraints map to BR-5/15/16/17/18/28/29/34.
- DTO naming follows global convention.
- Internal persistence fields are not exposed.
