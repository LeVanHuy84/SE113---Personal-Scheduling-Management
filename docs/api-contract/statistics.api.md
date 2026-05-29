# API Contract: Personal Statistics

## Feature

- Name: statistics (personal)
- Primary module: Statistics
- Related entities: Appointment, UserMonthlyStat
- Scope: personal only

## Related Use-cases

- UC-18: View productivity statistics
- UC-19: Export appointment data

## Endpoint 1: Get Personal Productivity Statistics

### Endpoint

- Method: GET
- URL: /statistics/me
- Description: Return personal productivity metrics for the authenticated user in a selected time range.

### Request DTO

#### GetStatisticsQueryDto

| Field     | Type                | Required | Validation                              |
| --------- | ------------------- | -------- | --------------------------------------- |
| startDate | ISO datetime string | Yes      | valid datetime; must be before endDate  |
| endDate   | ISO datetime string | Yes      | valid datetime; must be after startDate |
| groupBy   | enum string         | No       | day or week; default day                |
| timezone  | string              | No       | IANA timezone; default UTC              |

### Response DTO

#### StatisticsSummaryResponseDto

| Field                 | Type                      | Description                               |
| --------------------- | ------------------------- | ----------------------------------------- |
| periodStart           | ISO datetime string       | Start of analyzed period                  |
| periodEnd             | ISO datetime string       | End of analyzed period                    |
| totalAppointments     | number                    | Total appointments in period              |
| completedAppointments | number                    | Completed appointments in period          |
| completionRate        | number                    | completedAppointments / totalAppointments |
| mostProductiveSlot    | string nullable           | Hour with highest completion frequency    |
| trend                 | StatisticsTrendPointDto[] | Day/week aggregate trend points           |

#### StatisticsTrendPointDto

| Field     | Type   | Description                      |
| --------- | ------ | -------------------------------- |
| bucket    | string | Date or week bucket label        |
| total     | number | Total appointments in bucket     |
| completed | number | Completed appointments in bucket |

### Business Rules Mapping

- BR-34: authenticated access is required.
- BR-15: calculations are based on appointments in the selected range.
- BR-16: range and grouping are constrained by the selected time window.
- BR-17: completion rate uses completed divided by total.
- BR-18: most productive slot is derived from completion frequency.
- BR-5: metrics are scoped to the requesting user.

### Error Cases

- 400 Bad Request: invalid date range or groupBy value.
- 401 Unauthorized: missing or invalid JWT.
- 422 Unprocessable Entity: unsupported time window.

## Endpoint 2: Export Appointment Data

### Endpoint

- Method: GET
- URL: /statistics/export
- Description: Export user appointment data as CSV with applied filters.

### Request DTO

#### ExportAppointmentsQueryDto

| Field     | Type                | Required | Validation                              |
| --------- | ------------------- | -------- | --------------------------------------- |
| startDate | ISO datetime string | No       | must be before endDate if provided      |
| endDate   | ISO datetime string | No       | must be after startDate if provided     |
| tagId     | uuid string         | No       | tag must belong to the user             |
| status    | enum string         | No       | SCHEDULED, COMPLETED, CANCELLED, MISSED |
| query     | string              | No       | max length 255                          |

### Response DTO

#### ExportCsvResponseDto

| Field       | Type   | Description                                                          |
| ----------- | ------ | -------------------------------------------------------------------- |
| fileName    | string | Download file name, for example appointments_YYYY-MM-DD_HH-mm-ss.csv |
| contentType | string | text/csv                                                             |
| content     | string | CSV payload content                                                  |

### Business Rules Mapping

- BR-28: exported dataset must reflect the selected filters.
- BR-29: output format is CSV.
- BR-5: export includes only the current user's appointments.

### Error Cases

- 400 Bad Request: invalid filter values or no records found.
- 401 Unauthorized: missing or invalid JWT.
- 500 Internal Server Error: CSV generation failure.

## Self Review

- The endpoint paths match the controller implementation.
- The response DTO names match the current statistics DTOs.
- No team statistics are introduced.
