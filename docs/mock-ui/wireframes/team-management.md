# Team Management

## Purpose

Team hub mockup for Phase 8. Keep the existing card-first layout, but align it to the real team APIs: create team, invite member, change role, remove member, leave team, and invitation lifecycle states.

---

## Screen: Team Hub

### Layout

```
+--------------------------------------------------------------------------------+
| PSMS    Teams (7)                               [Search team]   [John Doe v]   |
+-------------------+------------------------------------------------------------+
| NAVIGATION        | TEAM HUB                                                   |
|                   |                                                            |
| Calendar          | [+ New Team] [My Teams] [Invitations]                      |
| Appointments      |                                                            |
| Team          <   | +-----------------------+ +-----------------------+        |
| Team Appointments | | Product Squad         | | Mobile Core           |        |
| Notifications     | | OWNER / 12 members    | | ADMIN / 8 members     |        |
| Statistics        | | Next: Sprint Planning | | Next: API Review      |        |
| Profile           | | [Open] [Invite] [Sch] | | [Open] [Invite] [Sch] |        |
|                   | +-----------------------+ +-----------------------+        |
|                   | +-----------------------+ +-----------------------+        |
|                   | | Design Guild          | | Growth Ops            |        |
|                   | | MEMBER / 15 members   | | MEMBER / 6 members    |        |
|                   | | Next: Design Critique | | Next: Q2 Planning     |        |
|                   | | [Open] [Invite disabled] [Sch disabled]          |
|                   | +-----------------------+ +-----------------------+        |
|                   |                                                            |
|                   | Selected team summary                                      |
|                   | Role: OWNER   Active members: 12   Pending invites: 2      |
|                   | [View Members] [Invite] [Leave Team]                       |
|                   |                                                            |
|                   | Members                                                    |
|                   | - John Doe         OWNER   role immutable, remove disabled|
|                   | - Avery Chen       ADMIN   change role/remove enabled     |
|                   | - Jordan Lee       MEMBER  change role/remove enabled     |
|                   |                                                            |
|                   | Invitations                                                |
|                   | - Mia Foster       PENDING                                 |
|                   | - Noah Park        ACCEPTED                                |
|                   | - Sara Kim         DECLINED                                |
|                   | - Old Invite       EXPIRED                                 |
+-------------------+------------------------------------------------------------+
```

### Create Team Modal

```
+---------------------------------------------------------------+
| Create Team                                             [X]   |
+---------------------------------------------------------------+
| Team Name *                                                   |
| [___________________________________________________________] |
|                                                               |
| Description                                                   |
| [___________________________________________________________] |
|                                                               |
| Note: team name must be unique in owner scope.               |
|                                                               |
|                     [Cancel]   [Create Team]                  |
+---------------------------------------------------------------+
```

### Invite Member Modal

```
+----------------------------------------------------------------+
| Invite to Product Squad                                    [X] |
+----------------------------------------------------------------+
| Search by email/name                                            |
| [___________________________________________________________]  |
|                                                                |
| Role   [ADMIN v]                                                |
|        [MEMBER]                                                |
|                                                                |
| Expiration (optional) [2026-06-30 23:59]                      |
|                                                                |
| Note: OWNER is not allowed as invitation target role.          |
| Invitation status lifecycle: PENDING -> ACCEPTED / DECLINED / EXPIRED |
|                                                                |
|                     [Cancel]   [Send Invite]                   |
+----------------------------------------------------------------+
```

### Leave Team Modal

```
+---------------------------------------------------------------+
| Leave Team                                               [X]   |
+---------------------------------------------------------------+
| Warning: owner must transfer ownership before leaving.       |
| Removed members lose access immediately.                     |
|                                                               |
| [Cancel]                            [Leave Team]              |
+---------------------------------------------------------------+
```

---

## User Flows

- Create team -> new team becomes OWNER by default.
- Invite member -> choose ADMIN or MEMBER only.
- Manage members -> change role between ADMIN and MEMBER, or remove member.
- Leave team -> allowed for active members, but owner must transfer ownership first.

---

## State Variations

- Empty state: no teams in the list, show a create-team prompt.
- Loading state: team list and member list show skeleton rows while data is fetched.
- Invitation states: PENDING, ACCEPTED, DECLINED, EXPIRED badges.
- Permission state: hide or disable invite / change role / remove controls when the user lacks access.
