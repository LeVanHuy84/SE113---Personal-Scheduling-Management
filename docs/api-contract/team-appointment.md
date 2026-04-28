# API Contract: Team Appointment

## Feature

- Name: team-appointment
- Primary module: Team Appointment
- Related entities: TeamAppointment, AppointmentParticipant, Team, TeamMember, User

## Related Use-cases

- UC-25: Create team appointment
- UC-26: Update team appointment
- UC-27: Delete team appointment
- UC-28: View shared team calendar
- UC-30: Validate multi-user availability

## Common Rules

- All endpoints require valid JWT.
- Caller must be active member of the target team.
- Required participants must be active members of the target team.
- Conflict checking uses overlap rule: (existingStart < requestedEnd) AND (existingEnd > requestedStart).

## Endpoint 1: Create Team Appointment

### Endpoint

- Method: POST
- URL: /teams/:teamId/appointments
- Description: Create a team appointment with required participants.

### Request JSON

```json
{
  "title": "Sprint planning",
  "description": "Backlog grooming and estimation",
  "location": "Meeting room A",
  "startAt": "2026-05-10T09:00:00.000Z",
  "endAt": "2026-05-10T10:00:00.000Z",
  "participantUserIds": [
    "0f9f8b58-c595-4df8-99f6-df46e5f19f4b",
    "5d46f6d3-9713-4793-9de0-0c46b32fc58a"
  ]
}
```

### Response JSON (201)

```json
{
  "id": "e4e2fc72-a55a-4ca8-b4ce-f3f4d4fe01c6",
  "teamId": "f9f4a8ef-0e97-4fda-9f47-53f7587346e8",
  "organizerId": "3c84f8d8-a4bc-4e87-9f57-b8b5dc5d4f64",
  "title": "Sprint planning",
  "description": "Backlog grooming and estimation",
  "location": "Meeting room A",
  "startAt": "2026-05-10T09:00:00.000Z",
  "endAt": "2026-05-10T10:00:00.000Z",
  "status": "SCHEDULED",
  "participants": [
    {
      "userId": "0f9f8b58-c595-4df8-99f6-df46e5f19f4b"
    },
    {
      "userId": "5d46f6d3-9713-4793-9de0-0c46b32fc58a"
    }
  ],
  "createdAt": "2026-04-26T08:00:00.000Z",
  "updatedAt": "2026-04-26T08:00:00.000Z"
}
```

### Error Cases

- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller is not active member or lacks role permission.
- 404 Not Found: team not found.
- 409 Conflict: one or more required participants has time conflicts.

## Endpoint 2: List Team Appointments

### Endpoint

- Method: GET
- URL: /teams/:teamId/appointments?from=2026-05-01T00:00:00.000Z&to=2026-05-31T23:59:59.999Z&page=1&limit=20
- Description: List team appointments visible to active team members.

### Request JSON

```json
{
  "query": {
    "from": "2026-05-01T00:00:00.000Z",
    "to": "2026-05-31T23:59:59.999Z",
    "page": 1,
    "limit": 20
  }
}
```

### Response JSON (200)

```json
{
  "items": [
    {
      "id": "e4e2fc72-a55a-4ca8-b4ce-f3f4d4fe01c6",
      "teamId": "f9f4a8ef-0e97-4fda-9f47-53f7587346e8",
      "organizerId": "3c84f8d8-a4bc-4e87-9f57-b8b5dc5d4f64",
      "title": "Sprint planning",
      "startAt": "2026-05-10T09:00:00.000Z",
      "endAt": "2026-05-10T10:00:00.000Z",
      "status": "SCHEDULED",
      "participantCount": 2
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

### Error Cases

- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller is not active member.
- 404 Not Found: team not found.
- 409 Conflict: requested range conflicts with query constraints or invalid time-window policy.

## Endpoint 3: Get Team Appointment Detail

### Endpoint

- Method: GET
- URL: /teams/:teamId/appointments/:id
- Description: Get one team appointment with participants.

### Request JSON

```json
{
  "params": {
    "teamId": "f9f4a8ef-0e97-4fda-9f47-53f7587346e8",
    "id": "e4e2fc72-a55a-4ca8-b4ce-f3f4d4fe01c6"
  }
}
```

### Response JSON (200)

```json
{
  "id": "e4e2fc72-a55a-4ca8-b4ce-f3f4d4fe01c6",
  "teamId": "f9f4a8ef-0e97-4fda-9f47-53f7587346e8",
  "organizerId": "3c84f8d8-a4bc-4e87-9f57-b8b5dc5d4f64",
  "title": "Sprint planning",
  "description": "Backlog grooming and estimation",
  "location": "Meeting room A",
  "startAt": "2026-05-10T09:00:00.000Z",
  "endAt": "2026-05-10T10:00:00.000Z",
  "status": "SCHEDULED",
  "participants": [
    {
      "userId": "0f9f8b58-c595-4df8-99f6-df46e5f19f4b"
    },
    {
      "userId": "5d46f6d3-9713-4793-9de0-0c46b32fc58a"
    }
  ],
  "createdAt": "2026-04-26T08:00:00.000Z",
  "updatedAt": "2026-04-26T08:00:00.000Z"
}
```

### Error Cases

- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller is not active member.
- 404 Not Found: team or appointment not found.
- 409 Conflict: appointment state is inconsistent with participant constraints.

## Endpoint 4: Update Team Appointment

### Endpoint

- Method: PATCH
- URL: /teams/:teamId/appointments/:id
- Description: Update mutable appointment fields and rerun permission/conflict checks.

### Request JSON

```json
{
  "title": "Sprint planning - revised",
  "description": "Backlog grooming and estimation (updated)",
  "location": "Meeting room B",
  "startAt": "2026-05-10T09:30:00.000Z",
  "endAt": "2026-05-10T10:30:00.000Z",
  "status": "SCHEDULED"
}
```

### Response JSON (200)

```json
{
  "id": "e4e2fc72-a55a-4ca8-b4ce-f3f4d4fe01c6",
  "teamId": "f9f4a8ef-0e97-4fda-9f47-53f7587346e8",
  "organizerId": "3c84f8d8-a4bc-4e87-9f57-b8b5dc5d4f64",
  "title": "Sprint planning - revised",
  "description": "Backlog grooming and estimation (updated)",
  "location": "Meeting room B",
  "startAt": "2026-05-10T09:30:00.000Z",
  "endAt": "2026-05-10T10:30:00.000Z",
  "status": "SCHEDULED",
  "updatedAt": "2026-04-26T08:15:00.000Z"
}
```

### Error Cases

- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller lacks OWNER/ADMIN/organizer permissions.
- 404 Not Found: team or appointment not found.
- 409 Conflict: updated time conflicts with required participant availability.

## Endpoint 5: Delete Team Appointment

### Endpoint

- Method: DELETE
- URL: /teams/:teamId/appointments/:id
- Description: Delete one team appointment and its participant links.

### Request JSON

```json
{
  "params": {
    "teamId": "f9f4a8ef-0e97-4fda-9f47-53f7587346e8",
    "id": "e4e2fc72-a55a-4ca8-b4ce-f3f4d4fe01c6"
  }
}
```

### Response JSON (200)

```json
{
  "success": true,
  "deletedId": "e4e2fc72-a55a-4ca8-b4ce-f3f4d4fe01c6"
}
```

### Error Cases

- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller lacks OWNER/ADMIN/organizer permissions.
- 404 Not Found: team or appointment not found.
- 409 Conflict: deletion violates appointment state or scope constraints.

## Endpoint 6: Add Participants

### Endpoint

- Method: POST
- URL: /teams/:teamId/appointments/:id/participants
- Description: Add required participants to an existing team appointment.

### Request JSON

```json
{
  "participantUserIds": [
    "2cd0eb47-87f1-4af9-a87c-1e5a608f53d8",
    "75dfe1ba-9550-4e96-8199-ea2a3cc38f2f"
  ]
}
```

### Response JSON (200)

```json
{
  "appointmentId": "e4e2fc72-a55a-4ca8-b4ce-f3f4d4fe01c6",
  "participants": [
    {
      "userId": "0f9f8b58-c595-4df8-99f6-df46e5f19f4b"
    },
    {
      "userId": "5d46f6d3-9713-4793-9de0-0c46b32fc58a"
    },
    {
      "userId": "2cd0eb47-87f1-4af9-a87c-1e5a608f53d8"
    },
    {
      "userId": "75dfe1ba-9550-4e96-8199-ea2a3cc38f2f"
    }
  ]
}
```

### Error Cases

- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller lacks OWNER/ADMIN/organizer permissions.
- 404 Not Found: team, appointment, or participant user not found.
- 409 Conflict: one or more added participants has scheduling conflicts.

## Endpoint 7: Remove Participant

### Endpoint

- Method: DELETE
- URL: /teams/:teamId/appointments/:id/participants/:userId
- Description: Remove one participant from a team appointment.

### Request JSON

```json
{
  "params": {
    "teamId": "f9f4a8ef-0e97-4fda-9f47-53f7587346e8",
    "id": "e4e2fc72-a55a-4ca8-b4ce-f3f4d4fe01c6",
    "userId": "2cd0eb47-87f1-4af9-a87c-1e5a608f53d8"
  }
}
```

### Response JSON (200)

```json
{
  "appointmentId": "e4e2fc72-a55a-4ca8-b4ce-f3f4d4fe01c6",
  "removedUserId": "2cd0eb47-87f1-4af9-a87c-1e5a608f53d8",
  "remainingParticipantCount": 3
}
```

### Error Cases

- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller lacks OWNER/ADMIN/organizer permissions.
- 404 Not Found: team, appointment, or participant link not found.
- 409 Conflict: removal violates appointment participant constraints.

## Architecture Notes

### Difference: Appointment vs TeamAppointment

- Appointment is user-owned personal scheduling data.
- TeamAppointment is team-scoped collaborative scheduling data with explicit organizer and participant links.
- TeamAppointment requires role and active-membership checks in addition to authentication.

### High-level Conflict Detection Strategy

- Validate time range first.
- Expand required participant set.
- For each required participant, check overlap against:
  - personal appointments;
  - other team appointments via AppointmentParticipant join.
- Reject write operation when any required participant conflicts.
- Return participant-focused conflict details so clients can adjust time or participants.

### Reuse of Existing Appointment Logic

- Reuse overlap predicate and time-window validation approach.
- Reuse pagination and date-range query conventions for list endpoints.
- Reuse existing auth guard and current-user context patterns.
- Extend with team role and active-membership authorization.

## Self Review

- Covers all required endpoints in scope.
- Each endpoint includes request JSON, response JSON, and Unauthorized/Forbidden/Not Found/Conflict errors.
- Aligns with FR-22 to FR-29 and BR-45 to BR-56 preparation intent.
