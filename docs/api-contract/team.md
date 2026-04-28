# API Contract: Team

## Feature

- Name: team
- Primary module: Team
- Related entities: Team, TeamMember, TeamInvitation, User

## Related Use-cases

- UC-21: Create team
- UC-22: Invite member to team
- UC-24: Leave team
- UC-29: View team members and roles

## Endpoint 1: Create Team

### Endpoint

- Method: POST
- URL: /teams
- Description: Create a new team and assign current user as Team Owner.

### Request DTO

#### CreateTeamRequestDto

| Field       | Type   | Required | Validation                                                                              |
| ----------- | ------ | -------- | --------------------------------------------------------------------------------------- |
| name        | string | Yes      | min length 1; max length 120; must not be blank; unique in owner scope (ownerId + name) |
| description | string | No       | max length 1000                                                                         |

### Response DTO

#### TeamResponseDto

| Field       | Type                | Description           |
| ----------- | ------------------- | --------------------- |
| id          | uuid string         | Team identifier       |
| ownerId     | uuid string         | Team owner user id    |
| name        | string              | Team name             |
| description | string nullable     | Team description      |
| createdAt   | ISO datetime string | Creation timestamp    |
| updatedAt   | ISO datetime string | Last update timestamp |

### Business Rules Mapping

- BR-37: authenticated user can create team and becomes Team Owner.
- BR-38: team name uniqueness enforced in owner scope.
- BR-39: team has at least one owner.
- BR-42: owner role is part of RBAC model.

### Error Cases

- 400 Bad Request: invalid payload.
- 401 Unauthorized: missing or invalid JWT.
- 409 Conflict: duplicate team name in owner scope.

## Endpoint 2: List User Teams

### Endpoint

- Method: GET
- URL: /teams
- Description: List teams where current user is active member.

### Request DTO

#### GetTeamsQueryDto

| Field      | Type   | Required | Validation                            |
| ---------- | ------ | -------- | ------------------------------------- |
| page       | number | No       | integer >= 1; default 1               |
| limit      | number | No       | integer between 1 and 100; default 10 |
| searchText | string | No       | max length 120; optional name filter  |

### Response DTO

#### TeamListResponseDto

| Field | Type              | Description          |
| ----- | ----------------- | -------------------- |
| items | TeamListItemDto[] | Team list items      |
| page  | number            | Current page         |
| limit | number            | Page size            |
| total | number            | Total matching teams |

#### TeamListItemDto

| Field       | Type        | Description          |
| ----------- | ----------- | -------------------- |
| id          | uuid string | Team identifier      |
| name        | string      | Team name            |
| role        | enum        | OWNER, ADMIN, MEMBER |
| memberCount | number      | Active member count  |

### Business Rules Mapping

- BR-41: user can belong to multiple teams.
- BR-44: inactive/removed members are excluded from active team visibility.

### Error Cases

- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: access denied by membership state.

## Endpoint 3: Get Team Details

### Endpoint

- Method: GET
- URL: /teams/:teamId
- Description: Return team details for active members.

### Request DTO

#### TeamIdParamsDto

| Field  | Type        | Required | Validation        |
| ------ | ----------- | -------- | ----------------- |
| teamId | uuid string | Yes      | valid UUID format |

### Response DTO

#### TeamDetailResponseDto

| Field       | Type                | Description           |
| ----------- | ------------------- | --------------------- |
| id          | uuid string         | Team identifier       |
| ownerId     | uuid string         | Team owner user id    |
| name        | string              | Team name             |
| description | string nullable     | Team description      |
| myRole      | enum                | OWNER, ADMIN, MEMBER  |
| memberCount | number              | Active member count   |
| createdAt   | ISO datetime string | Creation timestamp    |
| updatedAt   | ISO datetime string | Last update timestamp |

### Business Rules Mapping

- BR-42: role labels follow RBAC model.
- BR-44: removed/non-member users cannot access details.

### Error Cases

- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller is not active member.
- 404 Not Found: team not found.

## Endpoint 4: List Team Members

### Endpoint

- Method: GET
- URL: /teams/:teamId/members
- Description: List active members and visible role labels.

### Request DTO

#### TeamIdParamsDto

| Field  | Type        | Required | Validation        |
| ------ | ----------- | -------- | ----------------- |
| teamId | uuid string | Yes      | valid UUID format |

### Response DTO

#### TeamMemberListResponseDto

| Field | Type                | Description  |
| ----- | ------------------- | ------------ |
| items | TeamMemberItemDto[] | Team members |

#### TeamMemberItemDto

| Field       | Type                | Description                         |
| ----------- | ------------------- | ----------------------------------- |
| userId      | uuid string         | User identifier                     |
| displayName | string nullable     | Profile display name                |
| email       | string              | User email                          |
| role        | enum                | OWNER, ADMIN, MEMBER                |
| status      | enum                | ACTIVE, INACTIVE, INVITED, DECLINED |
| joinedAt    | ISO datetime string | Membership start timestamp          |

### Business Rules Mapping

- BR-41: members belong to teams independently.
- BR-42: role labels must be visible and valid.
- BR-44: removed users are no longer active members.

### Error Cases

- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller is not active member.
- 404 Not Found: team not found.

## Endpoint 5: Invite User

### Endpoint

- Method: POST
- URL: /teams/:teamId/invitations
- Description: Invite a user to join team with a target role.

### Request DTO

#### TeamIdParamsDto

| Field  | Type        | Required | Validation        |
| ------ | ----------- | -------- | ----------------- |
| teamId | uuid string | Yes      | valid UUID format |

#### CreateTeamInvitationRequestDto

| Field         | Type                | Required | Validation                           |
| ------------- | ------------------- | -------- | ------------------------------------ |
| invitedUserId | uuid string         | Yes      | valid UUID; invited user must exist  |
| role          | enum string         | No       | OWNER, ADMIN, MEMBER; default MEMBER |
| expiresAt     | ISO datetime string | No       | must be in the future when provided  |

### Response DTO

#### TeamInvitationResponseDto

| Field         | Type                         | Description                          |
| ------------- | ---------------------------- | ------------------------------------ |
| id            | uuid string                  | Invitation identifier                |
| teamId        | uuid string                  | Team identifier                      |
| invitedUserId | uuid string                  | Invited user identifier              |
| invitedById   | uuid string                  | Inviter user identifier              |
| role          | enum                         | OWNER, ADMIN, MEMBER                 |
| status        | enum                         | PENDING, ACCEPTED, DECLINED, EXPIRED |
| createdAt     | ISO datetime string          | Invitation creation timestamp        |
| expiresAt     | ISO datetime string nullable | Expiration timestamp                 |

### Business Rules Mapping

- BR-40: only Team Owner or Team Admin can manage membership.
- BR-41: users may have memberships across multiple teams.
- BR-42: role assignment must follow RBAC values.

### Error Cases

- 400 Bad Request: invalid payload or invalid target role.
- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller role cannot invite.
- 404 Not Found: team or invited user not found.
- 409 Conflict: invitation already pending or user already active member.

## Endpoint 6: Leave Team

### Endpoint

- Method: POST
- URL: /teams/:teamId/leave
- Description: Allow current member to leave team while preserving owner constraints.

### Request DTO

#### TeamIdParamsDto

| Field  | Type        | Required | Validation        |
| ------ | ----------- | -------- | ----------------- |
| teamId | uuid string | Yes      | valid UUID format |

### Response DTO

#### LeaveTeamResponseDto

| Field   | Type   | Description         |
| ------- | ------ | ------------------- |
| message | string | Leave action result |
| data    | null   | No payload body     |

### Business Rules Mapping

- BR-39: team must always have at least one active owner.
- BR-43: owner must transfer ownership before leaving.
- BR-44: leaving user immediately loses team access.

### Error Cases

- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: owner cannot leave before ownership transfer.
- 404 Not Found: team not found or membership not found.
- 409 Conflict: leave action violates ownership constraints.

## Response Envelope Notes

- Endpoints that return entities may return object payloads directly in the style used by appointment and tag modules.
- Action endpoints may use message-oriented responses (`message`, `data`) as seen in auth flows.
- Final implementation should keep one consistent shape per endpoint and align with DTO names in `src/team/dto`.

## Self Review

- Covers all endpoints required for Team Foundation phase.
- Includes request and response DTO contracts for each endpoint.
- Includes Unauthorized, Forbidden, Not Found, and Conflict error cases across endpoints.
- Uses camelCase field naming and existing DTO naming style.
