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
- Caller must be an active member of the target team.
- Required participants must be active members of the target team.
- The organizer is derived from the authenticated caller and is always stored as a REQUIRED participant.
- Team appointments are non-recurring.
- Team appointment startAt must be earlier than endAt.
- participantUserIds must not contain duplicates.
- Conflict checking uses overlap rule: (existingStart < requestedEnd) AND (existingEnd > requestedStart).
- Time overlap conflicts are returned in successful responses and do not use HTTP 409.
- Availability checks do not create or update appointments.
- On PATCH, participantUserIds replaces the participant set; missing participants are removed and new participants are added.
- Create defaults to ALL active team members; CUSTOM selection is used only when participantSelectionMode = CUSTOM.

## Endpoint 1: Create Team Appointment

### Endpoint

- Method: POST
- URL: /teams/:teamId/appointments
- Description: Create a team appointment and return detected participant conflicts, if any.

### Request JSON

```json
{
  "title": "Sprint planning",
  "description": "Backlog grooming and estimation",
  "location": "Meeting room A",
  "startAt": "2026-05-10T09:00:00.000Z",
  "endAt": "2026-05-10T10:00:00.000Z",
  "participantSelectionMode": "ALL"
}
```

### Custom Selection Request JSON

```json
{
  "title": "Sprint planning",
  "description": "Backlog grooming and estimation",
  "location": "Meeting room A",
  "startAt": "2026-05-10T09:00:00.000Z",
  "endAt": "2026-05-10T10:00:00.000Z",
  "participantSelectionMode": "CUSTOM",
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
      "userId": "3c84f8d8-a4bc-4e87-9f57-b8b5dc5d4f64",
      "participationType": "REQUIRED"
    },
    {
      "userId": "0f9f8b58-c595-4df8-99f6-df46e5f19f4b",
      "participationType": "REQUIRED"
    },
    {
      "userId": "5d46f6d3-9713-4793-9de0-0c46b32fc58a",
      "participationType": "REQUIRED"
    }
  ],
  "hasConflict": false,
  "conflicts": [],
  "createdAt": "2026-04-26T08:00:00.000Z",
  "updatedAt": "2026-04-26T08:00:00.000Z"
}
```

### Error Cases

- 400 Bad Request: invalid time range, duplicate participantUserIds, missing required payload fields, or CUSTOM selection without participantUserIds.
- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller is not an active member or lacks role permission.
- 404 Not Found: team not found.
- 409 Conflict: invalid appointment state or a rule violation that is not a time overlap conflict.

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
      "participantCount": 3
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

### Error Cases

- 400 Bad Request: invalid time range or query parameters.
- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller is not an active member.
- 404 Not Found: team not found.

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
      "userId": "3c84f8d8-a4bc-4e87-9f57-b8b5dc5d4f64",
      "participationType": "REQUIRED"
    },
    {
      "userId": "0f9f8b58-c595-4df8-99f6-df46e5f19f4b",
      "participationType": "REQUIRED"
    },
    {
      "userId": "5d46f6d3-9713-4793-9de0-0c46b32fc58a",
      "participationType": "REQUIRED"
    }
  ],
  "createdAt": "2026-04-26T08:00:00.000Z",
  "updatedAt": "2026-04-26T08:00:00.000Z"
}
```

### Error Cases

- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller is not an active member.
- 404 Not Found: team or appointment not found.
- 409 Conflict: appointment state is inconsistent with participant constraints.

## Endpoint 4: Update Team Appointment

### Endpoint

- Method: PATCH
- URL: /teams/:teamId/appointments/:id
- Description: Update mutable appointment fields, replace the participant list, and return detected participant conflicts, if any.

### Request JSON

```json
{
  "title": "Sprint planning - revised",
  "description": "Backlog grooming and estimation (updated)",
  "location": "Meeting room B",
  "startAt": "2026-05-10T09:30:00.000Z",
  "endAt": "2026-05-10T10:30:00.000Z",
  "status": "SCHEDULED",
  "participantUserIds": [
    "0f9f8b58-c595-4df8-99f6-df46e5f19f4b",
    "5d46f6d3-9713-4793-9de0-0c46b32fc58a"
  ]
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
  "participants": [
    {
      "userId": "3c84f8d8-a4bc-4e87-9f57-b8b5dc5d4f64",
      "participationType": "REQUIRED"
    },
    {
      "userId": "0f9f8b58-c595-4df8-99f6-df46e5f19f4b",
      "participationType": "REQUIRED"
    },
    {
      "userId": "5d46f6d3-9713-4793-9de0-0c46b32fc58a",
      "participationType": "REQUIRED"
    }
  ],
  "hasConflict": true,
  "conflicts": [
    {
      "userId": "0f9f8b58-c595-4df8-99f6-df46e5f19f4b",
      "displayName": "Avery Chen",
      "conflictWith": "PERSONAL_APPOINTMENT",
      "startAt": "2026-05-10T09:15:00.000Z",
      "endAt": "2026-05-10T10:15:00.000Z"
    }
  ],
  "updatedAt": "2026-04-26T08:15:00.000Z"
}
```

### Error Cases

- 400 Bad Request: invalid time range, duplicate participantUserIds, or missing required payload fields.
- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller lacks OWNER/ADMIN/organizer permissions.
- 404 Not Found: team or appointment not found.
- 409 Conflict: invalid appointment state or rule violation that is not a time overlap conflict.

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
- 409 Conflict: invalid appointment state or rule violation that is not a time overlap conflict.

## Endpoint 6: Check Team Availability

### Endpoint

- Method: POST
- URL: /teams/:teamId/appointments/check-conflicts
- Description: Check participant availability for a proposed time range without creating or updating a team appointment.

### Request JSON

```json
{
  "startAt": "2026-05-10T09:00:00.000Z",
  "endAt": "2026-05-10T10:00:00.000Z",
  "participantUserIds": [
    "0f9f8b58-c595-4df8-99f6-df46e5f19f4b",
    "5d46f6d3-9713-4793-9de0-0c46b32fc58a",
    "2cd0eb47-87f1-4af9-a87c-1e5a608f53d8"
  ]
}
```

### Response JSON (200)

```json
{
  "teamId": "f9f4a8ef-0e97-4fda-9f47-53f7587346e8",
  "startAt": "2026-05-10T09:00:00.000Z",
  "endAt": "2026-05-10T10:00:00.000Z",
  "hasConflict": true,
  "availableParticipants": [
    {
      "userId": "5d46f6d3-9713-4793-9de0-0c46b32fc58a",
      "displayName": "Jordan Lee"
    }
  ],
  "busyParticipants": [
    {
      "userId": "0f9f8b58-c595-4df8-99f6-df46e5f19f4b",
      "displayName": "Avery Chen"
    },
    {
      "userId": "2cd0eb47-87f1-4af9-a87c-1e5a608f53d8",
      "displayName": "Morgan Patel"
    }
  ],
  "conflicts": [
    {
      "userId": "0f9f8b58-c595-4df8-99f6-df46e5f19f4b",
      "displayName": "Avery Chen",
      "conflictWith": "PERSONAL_APPOINTMENT",
      "startAt": "2026-05-10T09:15:00.000Z",
      "endAt": "2026-05-10T10:15:00.000Z",
      "summary": "Personal appointment overlaps the requested team time."
    }
  ],
  "suggestedSlots": [
    {
      "startAt": "2026-05-10T11:00:00.000Z",
      "endAt": "2026-05-10T12:00:00.000Z"
    },
    {
      "startAt": "2026-05-10T13:30:00.000Z",
      "endAt": "2026-05-10T14:30:00.000Z"
    }
  ]
}
```

### Error Cases

- 400 Bad Request: missing or invalid start time, end time, or participant list.
- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller is not an active member or lacks role permission.
- 404 Not Found: team not found.

## Architecture Notes

### Difference: Appointment vs TeamAppointment

- Appointment is user-owned personal scheduling data.
- TeamAppointment is team-scoped collaborative scheduling data with explicit organizer and participant links.
- TeamAppointment requires role and active-membership checks in addition to authentication.

### Dedicated Availability Check

- Availability checks use the same overlap predicate and participant scope as team appointment scheduling.
- Availability checks return participant availability, participant conflicts, and suggested common free slots without persisting changes.

### High-level Conflict Detection Strategy

- Validate the requested time range.
- Check each required participant against personal appointments and other team appointments.
- Return detected conflicts with participant and overlap details.
- Suggest common free slots only from the dedicated availability check endpoint.

### Reuse of Existing Appointment Logic

- Reuse overlap predicate and time-window validation approach.
- Reuse pagination and date-range query conventions for list endpoints.
- Reuse existing auth guard and current-user context patterns.
- Extend with team role and active-membership authorization.

## Self Review

- Covers the required six endpoints only: create, list, detail, update, delete, and availability check.
- Create and update return conflict data only; suggested slots are limited to availability checks.
- Aligns with the simplified participant model, organizer-as-required-participant rule, and successful-response conflict handling.
