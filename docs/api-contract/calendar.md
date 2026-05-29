# API Contract: Calendar

## Feature

- Name: calendar
- Primary module: Calendar
- Related entities: Appointment, TeamAppointment, TeamMember, AppointmentParticipant

## Related Use-cases

- UC-35: View unified calendar

## Common Rules

- All endpoints require a valid JWT.
- The calendar is read-only and never mutates appointment data.
- Results must only include data visible to the authenticated user.
- Time range filtering uses the overlap rule: (startAt < to) AND (endAt > from).
- Personal and team sources are normalized into a unified response DTO.

## Endpoint 1: Get Unified Calendar

### Endpoint

- Method: GET
- URL: /calendar?from=2026-05-01T00:00:00.000Z&to=2026-05-31T23:59:59.999Z&teamIds=team-a&teamIds=team-b&includePersonal=true
- Description: Return a unified calendar view for the authenticated user.

### Request Query

#### GetCalendarQueryDto

| Field           | Type                | Required | Validation                                                   |
| --------------- | ------------------- | -------- | ------------------------------------------------------------ |
| from            | ISO datetime string | Yes      | valid datetime                                               |
| to              | ISO datetime string | Yes      | valid datetime                                               |
| teamIds         | uuid string array   | No       | optional filter for selected teams                           |
| includePersonal | boolean             | No       | default true; when false, personal appointments are excluded |

### Response DTO

#### CalendarResponseDto

| Field | Type              | Description                           |
| ----- | ----------------- | ------------------------------------- |
| items | CalendarItemDto[] | Unified calendar items sorted by time |

#### CalendarItemDto

| Field   | Type                 | Description                                |
| ------- | -------------------- | ------------------------------------------ |
| id      | uuid string          | Source appointment identifier              |
| type    | enum string          | PERSONAL or TEAM                           |
| title   | string               | Unified display title                      |
| startAt | ISO datetime string  | Start timestamp                            |
| endAt   | ISO datetime string  | End timestamp                              |
| teamId  | uuid string nullable | Team identifier for team appointments only |

### Business Rules Mapping

- BR-68: include personal appointments owned by the user.
- BR-69: include team appointments where the user is an active team member.
- BR-70: respect the requested time range.
- BR-71: read-only access only.
- BR-72: only authenticated users can access the calendar.

### Error Cases

- 400 Bad Request: invalid date range or malformed query parameters.
- 401 Unauthorized: missing or invalid JWT.
