# Phase 8 Prompt – Team Foundation

## Goal

Implement the first production-ready slice of collaborative team scheduling.

## Context

The current backend already covers authentication, personal appointments, recurring series, tags, reminders, notifications, and profile management. The next missing SRS block is team management and collaboration.

## SRS Coverage Target

Focus on these requirements first:

- FR-19: create a team and assign the creator as Team Owner.
- FR-20: invite members to a team.
- FR-21: allow a member to leave a team with owner-transfer constraints.
- FR-26: show team member lists and visible role labels.

## Business Rules to Enforce

- BR-37: authenticated user can create a team and becomes Team Owner.
- BR-38: team names are unique within the same owner scope.
- BR-39: a team must always keep at least one active Team Owner.
- BR-40: only Team Owner or Team Admin can manage membership.
- BR-41: a user can belong to multiple teams.
- BR-42: role model must include Team Owner, Team Admin, and Team Member.
- BR-43: ownership transfer must happen before an owner leaves the team.
- BR-44: removed members lose access immediately.

## Scope For This Step

### In scope

- add Prisma models for Team, TeamMember, and TeamInvitation;
- create `src/team/` with controller, service, repository, module, and DTOs;
- implement team creation;
- implement team member listing;
- implement invite flow at a basic level;
- implement member leave flow with owner protection;
- enforce authenticated access and basic team-role checks.

### Out of scope for now

- shared team calendar endpoints;
- team appointment create/update/delete;
- multi-user conflict detection;
- optimal time-slot suggestions;
- audit trail for team appointment actions.

## Suggested API Surface

### POST /teams

Create a team and assign the caller as owner.

### GET /teams

Return teams visible to the current user.

### GET /teams/:teamId

Return team details with membership summary.

### GET /teams/:teamId/members

Return the active team member list and role labels.

### POST /teams/:teamId/invitations

Invite a user to the team.

### POST /teams/:teamId/leave

Allow a member to leave the team when ownership constraints are satisfied.

## Implementation Notes

- Reuse the existing NestJS service/repository pattern already used by auth, user, appointment, and tag modules.
- Reuse `JwtAuthGuard` and `@CurrentUser()` for ownership and membership checks.
- Keep Prisma schema changes minimal and aligned with the SRS domain model.
- Add validation DTOs before wiring the controller endpoints.

## Done Criteria

- a user can create a team and is stored as the owner;
- team names are protected against duplicate ownership-scope conflicts;
- team members can be listed;
- invitations can be created;
- a member can leave safely without violating ownership rules;
- the new module compiles and is wired into `AppModule`.

## Reference Files

- `docs/srs/SRS.md`
- `docs/business-rules/business-rules.md`
- `docs/domain/domain-model.md`
- `docs/use-cases/`
- `prisma/schema.prisma`
- `docs/api-contract/team.md`
- `src/auth/`
- `src/user/`
- `src/appointment/`
