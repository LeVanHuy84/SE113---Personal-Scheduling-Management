# Team Appointment

## Purpose

Team scheduling mockup for Phase 9. Keep the calendar-first workspace, but align the form and states to the supported team appointment API: create, update, delete, and separate availability check.

---

## Screen: Team Scheduling Workspace

### Layout

```
+--------------------------------------------------------------------------------------------------+
| PSMS  Product Squad - Team Calendar   Week 19  [Prev] [Today] [Next]   [Search] [John Doe v]   |
+----------------------+---------------------------------------------+-----------------------------+
| LEFT SIDEBAR         | CENTER: WEEK CALENDAR                       | RIGHT PANEL                 |
| Teams                |                                             | Actions & Availability      |
| + Product Squad      |      Mon      Tue      Wed      Thu   Fri  | Appointment actions         |
|   Mobile Core        | 08:00|        |        |        |      |    | Selected item: Sprint Plan  |
|   Design Guild       | 09:00| [Sprint Plan]        [API Review]   | Organizer: John Doe         |
|   Growth Ops         | 10:00| [Conflict block - yellow warning]    | [Edit] [Delete disabled]    |
|                      | 11:00|        |        |        |      |    |                             |
| [Create Appointment] | 12:00|        |        |        |      |    | Availability check          |
| [My Teams]           | 13:00| [Retro] |        | [Design Sync]    | Available participants      |
| [Invitations]        | 14:00|        |        |        |      |    | - John Doe  AVAILABLE       |
|                      | 15:00|        |        |        |      |    | - Carol Le  AVAILABLE       |
|                      | 16:00|        |        |        |      |    | Busy participants           |
|                      | 17:00|        |        |        |      |    | - Alice Nguyen BUSY         |
|                      |      |        |        |        |      |    | - David Tran BUSY           |
+----------------------+---------------------------------------------+-----------------------------+
| Availability check results: [11:00-12:00 Best] [13:30-14:30] [Thu 09:00-10:00]                     |
+--------------------------------------------------------------------------------------------------+
```

### Create / Edit Appointment Modal

```
+--------------------------------------------------------------------------------+
| Create / Edit Team Appointment                                             [X] |
+--------------------------------------------------------------------------------+
| Team: Product Squad                      Organizer: John Doe (implicit)      |
|                                                                                |
| Title * [_______________________________________________________________]     |
| Location [_____________________________________________________________]      |
| Start  [2026-05-10 09:00] -> [2026-05-10 10:00]                               |
| Description [___________________________________________________________]     |
|                                                                                |
| Required participants                                                          |
| [x] Alice Nguyen                                                               |
| [x] Bob Tran                                                                   |
| [ ] Carol Le                                                                   |
| Note: organizer is auto-included and submitted as participantUserIds.         |
|                                                                                |
| Warning panel (non-blocking)                                                   |
| - Bob Tran overlaps with a personal appointment                               |
| - Alice Nguyen overlaps with a team appointment                               |
|                                                                                |
| [Check Availability] [Cancel] [Save Appointment]                               |
+--------------------------------------------------------------------------------+
```

### Delete Flow

```
+---------------------------------------------------------------+
| Delete Appointment                                       [X]   |
+---------------------------------------------------------------+
| Only OWNER / ADMIN / organizer can delete.                   |
| Delete removes the appointment and its participant links.   |
|                                                             |
| [Cancel]                              [Delete Appointment]   |
+---------------------------------------------------------------+
```

---

## User Flows

- Create appointment -> choose title, location, startAt, endAt, description, and required participants.
- Update appointment -> open edit state, replace participantUserIds, and recheck conflicts.
- Delete appointment -> available only to OWNER, ADMIN, or organizer.
- Check availability -> separate action that returns available participants, busy participants, conflicts, and suggested slots.

---

## State Variations

- Loading state: calendar events and availability panel render skeleton rows.
- Empty state: no team appointments for selected team or date range.
- Conflict state: show warning styling and per-user conflict details, but do not block save.
- Availability state: show available participants, busy participants, conflict list, and suggested slots in a separate panel.
- Permission state: hide or disable edit/delete controls when caller lacks OWNER / ADMIN / organizer permission.
