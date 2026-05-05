# Appointment Management

## Purpose

Allows users to view, create, edit, delete, and manage their appointments. Includes full detail forms with recurrence, tags, reminders, and status management. Also provides a list/table view with search and filter controls.

---

## Layout (ASCII Wireframe)

### Appointment List View

```
+------------------------------------------------------------------------+
|  PSMS  [🔔]  [Search...]                              [Avatar] John v  |
+------------------+-----------------------------------------------------+
|  NAVIGATION      |  APPOINTMENTS                                       |
|                  |                                                     |
|  Dashboard       |  [+ New Appointment]           [Filter v] [Export] |
|  Calendar        |                                                     |
|  Appointments <  |  Search: [_____________________] [🔍]               |
|  Tags            |  Filter by: [All Tags v] [All Status v] [Date v]   |
|  Reminders       |                                                     |
|  Notifications   |  +------+--------------------+--------+-------+----+|
|  Statistics      |  | Date | Title              | Tags   | Status| Act||
|  Export          |  +------+--------------------+--------+-------+----+|
|  Profile         |  |Mar14 | Team Standup        | Work   |Pending|✏ 🗑||
|                  |  |Mar14 | Doctor Appointment  | Health |Pending|✏ 🗑||
|                  |  |Mar15 | Study Session       | Study  |Done   |✏ 🗑||
|                  |  |Mar16 | Weekly Review       | Work   |Pending|✏ 🗑||
|                  |  |Mar17 | Gym Session         | Health |Done   |✏ 🗑||
|                  |  +------+--------------------+--------+-------+----+|
|                  |                                                     |
|                  |  Showing 5 of 24 appointments   [ < 1 2 3 > ]      |
+------------------+-----------------------------------------------------+
```

### Create / Edit Appointment Modal

```
+----------------------------------------------------------+
|  [ Create New Appointment ]                        [X]   |
+----------------------------------------------------------+
|                                                          |
|  Title *                                                 |
|  [__________________________________________________]    |
|                                                          |
|  Description                                             |
|  [__________________________________________________]    |
|  [__________________________________________________]    |
|                                                          |
|  Start Date & Time *         End Date & Time *           |
|  [2026-03-14]  [09:00]       [2026-03-14]  [10:00]      |
|                                                          |
|  Tags                                                    |
|  [ Work x ] [ Study x ] [+ Add Tag]                     |
|                                                          |
|  Status                                                  |
|  ( ) Pending   (•) Completed                            |
|                                                          |
|  Recurrence                                              |
|  [ ] Enable recurrence                                   |
|  (if enabled):                                           |
|    Pattern: [Daily v]                                    |
|    Ends:    [After 10 occurrences v]                     |
|                                                          |
|  Reminders                                               |
|  [10 minutes before v]  [+ Add reminder]                |
|  [1 hour before v]                                       |
|                                                          |
|  ⚠ Time conflict detected with "Doctor Appointment"     |
|                                                          |
|        [ Cancel ]          [ Save Appointment ]         |
+----------------------------------------------------------+
```

### Delete Confirmation Dialog

```
+------------------------------------------+
|  Confirm Delete                      [X]  |
+------------------------------------------+
|                                           |
|  Delete "Team Standup"?                   |
|                                           |
|  This is a recurring appointment.         |
|  ( ) Delete this occurrence only          |
|  (•) Delete entire series                 |
|                                           |
|  This action cannot be undone.            |
|                                           |
|   [ Cancel ]        [ Delete ]           |
+------------------------------------------+
```

---

## Components

- **Action bar**: "+ New Appointment" button, Filter dropdown, Export button
- **Search bar**: Keyword search across titles and descriptions
- **Filter controls**: Tag, status, and date range dropdown filters
- **Appointments table**: Columns — Date, Title, Tags (colored chips), Status badge, Actions (Edit / Delete icons)
- **Pagination**: Page navigation below table
- **Create/Edit modal**: Full form with title, description, date/time pickers, tag selector, status toggle, recurrence options, reminder configuration
- **Conflict warning**: Inline alert inside the form if time overlaps detected
- **Delete dialog**: Confirmation modal with option to delete single instance or full series for recurring appointments

---

## User Actions

- View a paginated list of all appointments
- Search by keyword and filter by tag, status, or date range
- Click "+ New Appointment" to open the creation form
- Fill in all required fields and save a new appointment
- Click the edit icon (✏) on any row to open the edit form
- Toggle recurrence and configure the recurrence pattern
- Add or remove reminders from an appointment
- Change appointment status between Pending and Completed
- Click delete icon (🗑) and confirm deletion of a single instance or full series
- See inline conflict warning if the time overlaps an existing appointment
