# Team Appointment

## Purpose

Phase 9 mockup theo hướng calendar-first cho lịch nhóm: phối hợp đa người dùng, quan sát conflict trực quan, và chọn khung giờ tối ưu nhanh.

---

## Layout (ASCII Wireframe)

### 3-Column Team Scheduling Workspace

```
+--------------------------------------------------------------------------------------------------+
| PSMS  Product Squad - Team Calendar   Week 19  [Prev] [Today] [Next]   [Search] [John Doe v]   |
+----------------------+---------------------------------------------+-----------------------------+
| LEFT SIDEBAR         | CENTER: WEEK CALENDAR                       | RIGHT PANEL                 |
| Teams                |                                             | Participants (8)            |
| + Product Squad      |      Mon      Tue      Wed      Thu   Fri  | [JD] John      FREE         |
|   Mobile Core        | 08:00|        |        |        |      |    | [AN] Alice     BUSY         |
|   Design Guild       | 09:00| [Sprint Plan]        [API Review]   | [BT] Bob       CONFLICT     |
|   Growth Ops         | 10:00| [Conflict block - red]              | [CL] Carol     FREE         |
|                      | 11:00|        |        |        |      |    | [DP] David     BUSY         |
| [Create Team]        | 12:00|        |        |        |      |    | [EH] Emma      FREE         |
|                      | 13:00| [Retro] |        | [Design Sync]    | [LN] Linh      FREE         |
| Quick switch         | 14:00|        |        |        |      |    | [MT] Minh      BUSY         |
| [My teams]           | 15:00|        |        |        |      |    |                             |
| [Invitations]        | 16:00|        |        |        |      |    | Availability summary        |
|                      | 17:00|        |        |        |      |    | 3 participants unavailable  |
+----------------------+---------------------------------------------+-----------------------------+
| Suggested time slots: [15:00-16:00 Best] [16:30-17:30] [Thu 09:00-10:00] [Apply custom]        |
+--------------------------------------------------------------------------------------------------+
```

### Create / Edit Appointment (Calendar-triggered)

```
+--------------------------------------------------------------------------------+
| Create Team Appointment                                                    [X] |
+--------------------------------------------------------------------------------+
| Team: Product Squad                    Organizer: John Doe                    |
|                                                                                |
| Title * [_______________________________________________________________]     |
|                                                                                |
| Time  [2026-05-10 09:00] -> [2026-05-10 10:00]                               |
|                                                                                |
| Required participants  [Alice x] [Bob x] [Carol x] [+ Add]                   |
|                                                                                |
| Conflict map:  Bob (personal)  Alice (team)                                   |
| Suggested:   [11:00-12:00 Best] [14:00-15:00] [Thu 09:00-10:00]               |
|                                                                                |
|                                      [Cancel] [Save Appointment]              |
+--------------------------------------------------------------------------------+
```

### Participant Availability Drawer

```
+----------------------------------------------------------------+
| Participant Availability                                  [X]  |
+----------------------------------------------------------------+
| [BT] Bob Tran       CONFLICT   Busy: 09:30-10:30              |
| [AN] Alice Nguyen   BUSY       Busy: 09:00-10:00              |
| [CL] Carol Le       FREE       No overlap                     |
|                                                                |
| Timeline mini-map                                              |
| 09:00 [BT:red][AN:orange][CL:green]                           |
| 10:00 [BT:red][AN:free]  [CL:green]                           |
|                                                                |
| [Remove participant] [Suggest alternatives]                    |
+----------------------------------------------------------------+
```

---

## Components

- 3-column workspace: Team switcher, week calendar grid, participant availability
- Week view timeline with visual appointment blocks (not table-first)
- Conflict blocks using red emphasis to signal overlap immediately
- Participant status pills: FREE, BUSY, CONFLICT
- Suggested slot chips with Best recommendation
- Create/Edit modal opened from slot click or drag-create gesture
- Availability drawer for per-user busy windows

---

## User Actions

- Click hoặc drag trong calendar để tạo lịch nhóm mới (FR-22)
- Quan sát conflict trực tiếp qua màu block trên timeline (BR-51, BR-53)
- Xem trạng thái từng participant theo thời gian (FR-27, BR-52)
- Chọn suggested slot để tự điền thời gian nhanh (FR-29, BR-54)
- Cập nhật lịch và re-check conflict sau mỗi chỉnh sửa (FR-23, BR-47)
- Xóa lịch theo quyền OWNER/ADMIN/organizer (FR-24, BR-48)
- Thêm/xóa participant từ panel chuyên dụng (participant endpoints)
