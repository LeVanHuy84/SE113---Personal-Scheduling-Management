# Team Management

## Purpose

Team Foundation mockup (Phase 8) theo hướng modern SaaS: xem nhanh team theo card, chuyển team nhanh, và thao tác Invite/Schedule/Open ngay trên card thay vì layout bảng CRUD.

---

## Layout (ASCII Wireframe)

### Team Hub (Card-based)

```
+--------------------------------------------------------------------------------+
| PSMS    Teams (7)                               [Search team]   [John Doe v]   |
+-------------------+------------------------------------------------------------+
| NAVIGATION        | TEAM HUB                                                   |
|                   |                                                            |
| Calendar          | [+ New Team] [My Teams] [Invitations] [Archived]          |
| Appointments      |                                                            |
| Team          <   | +-----------------------+ +-----------------------+        |
| Team Appointments | | Product Squad         | | Mobile Core           |        |
| Notifications     | | 12 members            | | 8 members             |        |
| Statistics        | | Next: Sprint Plan     | | Next: API Review      |        |
| Profile           | | Tue 10:00             | | Tue 16:00             |        |
|                   | | [Open] [Invite] [Sch] | | [Open] [Invite] [Sch] |        |
|                   | +-----------------------+ +-----------------------+        |
|                   | +-----------------------+ +-----------------------+        |
|                   | | Design Guild          | | Growth Ops            |        |
|                   | | 15 members            | | 6 members             |        |
|                   | | Next: Critique        | | Next: Q2 Planning     |        |
|                   | | Wed 14:00             | | Thu 09:30             |        |
|                   | | [Open] [Invite] [Sch] | | [Open] [Invite] [Sch] |        |
|                   | +-----------------------+ +-----------------------+        |
|                   |                                                            |
|                   | Selected Team: Product Squad                                |
|                   | Role: OWNER    Active: 12    Pending invites: 2             |
|                   | [View Members] [Leave Team]                                 |
+-------------------+------------------------------------------------------------+
```

### Create Team Modal

```
+---------------------------------------------------------------+
| [Create Team]                                            [X]  |
+---------------------------------------------------------------+
| Team Name *                                                   |
| [___________________________________________________________] |
|                                                               |
| Description                                                    |
| [___________________________________________________________] |
|                                                               |
| Cover Color                                                    |
| [Blue] [Green] [Orange] [Gray]                                |
|                                                               |
| Rule: Team name must be unique in owner scope (BR-38).        |
|                                                               |
|                     [Cancel]   [Create Team]                  |
+---------------------------------------------------------------+
```

### Invite Member Drawer

```
+----------------------------------------------------------------+
| Invite to Product Squad                                    [X] |
+----------------------------------------------------------------+
| Search by email/name                                            |
| [___________________________________________________________]  |
|                                                                |
| Role   [MEMBER v]                                               |
| Expiration (optional) [2026-06-30 23:59]                       |
|                                                                |
| Permission note: only OWNER/ADMIN can invite (BR-40, BR-42).   |
|                                                                |
|                     [Cancel]   [Send Invite]                   |
+----------------------------------------------------------------+
```

---

## Components

- Team cards with key metadata: team name, member count, upcoming appointment
- Per-card quick actions: Open, Invite, Schedule
- Top segmented filters: My Teams, Invitations, Archived
- Selected team summary strip with role and invite count
- Create Team modal with name/description and branding color
- Invite drawer/modal with role and expiration controls
- Leave Team confirmation with ownership transfer warning (BR-43)

---

## User Actions

- Tạo team mới (FR-19, BR-37, BR-38)
- Quét nhanh danh sách team qua card, không cần mở chi tiết dạng bảng
- Mở team hoặc mở thẳng flow mời thành viên/lên lịch từ card
- Mời thành viên với role hợp lệ (FR-20, BR-40)
- Xem thông tin team đã chọn và chuyển team nhanh
- Rời team theo ràng buộc owner transfer (FR-21, BR-39, BR-43, BR-44)
