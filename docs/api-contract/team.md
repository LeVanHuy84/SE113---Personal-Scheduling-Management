# API Contract: Team

## Feature

- Name: team
- Primary module: Team
- Related entities: Team, TeamMember, TeamInvitation, User

## Related Use-cases

- UC-21: Create team
- UC-22: Invite member to team
- UC-23: Change member role
- UC-24: Leave team
- UC-31: View my invitations
- UC-31: Accept or decline team invitation
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
- BR-39: team has exactly one active owner.
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

| Field         | Type                | Required | Validation                                        |
| ------------- | ------------------- | -------- | ------------------------------------------------- |
| invitedUserId | uuid string         | Yes      | valid UUID; invited user must exist               |
| role          | enum string         | No       | ADMIN, MEMBER; default MEMBER; OWNER is forbidden |
| expiresAt     | ISO datetime string | No       | must be in the future when provided               |

### Response DTO

#### TeamInvitationResponseDto

| Field         | Type                         | Description                          |
| ------------- | ---------------------------- | ------------------------------------ |
| id            | uuid string                  | Invitation identifier                |
| teamId        | uuid string                  | Team identifier                      |
| invitedUserId | uuid string                  | Invited user identifier              |
| invitedById   | uuid string                  | Inviter user identifier              |
| role          | enum                         | ADMIN, MEMBER                        |
| status        | enum                         | PENDING, ACCEPTED, DECLINED, EXPIRED |
| createdAt     | ISO datetime string          | Invitation creation timestamp        |
| expiresAt     | ISO datetime string nullable | Expiration timestamp                 |

### Business Rules Mapping

- BR-40: only Team Owner or Team Admin can manage membership.
- BR-41: users may have memberships across multiple teams.
- BR-42: role assignment must follow RBAC values.
- BR-57: invitation target role is limited to ADMIN or MEMBER; OWNER cannot be assigned via invitation.

### Error Cases

- 400 Bad Request: invalid payload, invalid target role, or role OWNER is not allowed for invitation.
- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller role cannot invite.
- 404 Not Found: team or invited user not found.
- 409 Conflict: invitation already pending or user already active member.

## Endpoint 6: Change Member Role

### Endpoint

- Method: PATCH
- URL: /teams/:teamId/members/:userId/role
- Description: Change an active member role between ADMIN and MEMBER.

### Request DTO

#### ChangeMemberRoleParamsDto

| Field  | Type        | Required | Validation        |
| ------ | ----------- | -------- | ----------------- |
| teamId | uuid string | Yes      | valid UUID format |
| userId | uuid string | Yes      | valid UUID format |

#### ChangeMemberRoleRequestDto

| Field | Type        | Required | Validation                        |
| ----- | ----------- | -------- | --------------------------------- |
| role  | enum string | Yes      | ADMIN, MEMBER; OWNER is forbidden |

### Response DTO

#### TeamMemberRoleResponseDto

| Field       | Type                | Description                   |
| ----------- | ------------------- | ----------------------------- |
| teamId      | uuid string         | Team identifier               |
| userId      | uuid string         | Target member identifier      |
| role        | enum                | Updated role: ADMIN or MEMBER |
| updatedById | uuid string         | Actor user identifier         |
| updatedAt   | ISO datetime string | Role update timestamp         |

### Business Rules Mapping

- BR-40: only Team Owner or Team Admin can manage membership.
- BR-42: role values follow RBAC model.
- BR-58: member role changes only allow ADMIN and MEMBER transitions.
- BR-59: Team Owner role is immutable in change-role API.

### Error Cases

- 400 Bad Request: invalid payload or role OWNER is not allowed.
- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller role cannot change member role.
- 404 Not Found: team or member not found.
- 409 Conflict: target member is Team Owner or role is unchanged.

## Endpoint 7: Get My Invitations

### Endpoint

- Method: GET
- URL: /teams/invitations/me
- Description: Return all team invitations addressed to the current user.

### Request DTO

#### GetMyInvitationsQueryDto

| Field  | Type | Required | Validation                           |
| ------ | ---- | -------- | ------------------------------------ |
| status | enum | No       | PENDING, ACCEPTED, DECLINED, EXPIRED |

### Response DTO

#### TeamMyInvitationItemDto

| Field        | Type                         | Description                          |
| ------------ | ---------------------------- | ------------------------------------ |
| invitationId | uuid string                  | Invitation identifier                |
| teamId       | uuid string                  | Team identifier                      |
| teamName     | string                       | Team name                            |
| role         | enum                         | OWNER, ADMIN, MEMBER                 |
| status       | enum                         | PENDING, ACCEPTED, DECLINED, EXPIRED |
| invitedAt    | ISO datetime string          | Invitation creation timestamp        |
| expiresAt    | ISO datetime string nullable | Invitation expiration timestamp      |

### Business Rules Mapping

- BR-60: invitation lifecycle follows PENDING, ACCEPTED, DECLINED, EXPIRED.
- BR-61: only invited user can accept or decline a team invitation.
- BR-66: only the invited user can view their invitations.
- BR-67: invitation retrieval may be filtered by status and must not expose other users' invitations.

### Error Cases

- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: reserved; should not occur when the JWT identifies the current user.

## Endpoint 8: Accept Invitation

### Endpoint

- Method: POST
- URL: /teams/:teamId/invitations/:invitationId/accept
- Description: Accept a pending invitation by the invited user and create active TeamMember.

### Request DTO

#### TeamInvitationActionParamsDto

| Field        | Type        | Required | Validation        |
| ------------ | ----------- | -------- | ----------------- |
| teamId       | uuid string | Yes      | valid UUID format |
| invitationId | uuid string | Yes      | valid UUID format |

### Response DTO

#### InvitationActionResponseDto

| Field   | Type   | Description           |
| ------- | ------ | --------------------- |
| message | string | Action result message |
| data    | null   | No payload body       |

### Business Rules Mapping

- BR-60: invitation lifecycle follows PENDING, ACCEPTED, DECLINED, EXPIRED.
- BR-61: only invited user can accept or decline invitation.
- BR-62: accepting invitation creates active TeamMember with invited role.

### Error Cases

- 400 Bad Request: invalid params or invitation is not in PENDING state.
- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller is not the invited user.
- 404 Not Found: team or invitation not found.
- 409 Conflict: invitation already processed, expired, or membership already exists.

## Endpoint 9: Decline Invitation

### Endpoint

- Method: POST
- URL: /teams/:teamId/invitations/:invitationId/decline
- Description: Decline a pending invitation by the invited user.

### Request DTO

#### TeamInvitationActionParamsDto

| Field        | Type        | Required | Validation        |
| ------------ | ----------- | -------- | ----------------- |
| teamId       | uuid string | Yes      | valid UUID format |
| invitationId | uuid string | Yes      | valid UUID format |

### Response DTO

#### InvitationActionResponseDto

| Field   | Type   | Description           |
| ------- | ------ | --------------------- |
| message | string | Action result message |
| data    | null   | No payload body       |

### Business Rules Mapping

- BR-60: invitation lifecycle follows PENDING, ACCEPTED, DECLINED, EXPIRED.
- BR-61: only invited user can accept or decline invitation.

### Error Cases

- 400 Bad Request: invalid params or invitation is not in PENDING state.
- 401 Unauthorized: missing or invalid JWT.
- 403 Forbidden: caller is not the invited user.
- 404 Not Found: team or invitation not found.
- 409 Conflict: invitation already processed or expired.

## Endpoint 10: Leave Team

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

- BR-39: team must always have exactly one active owner.
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
