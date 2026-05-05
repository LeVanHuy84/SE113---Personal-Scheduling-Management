# Export Data Screen

## Purpose

Allows users to export their appointment data to a CSV file for external use, backup, or analysis. Users can apply filters (date range, tags, status) before exporting to control which records are included in the output file.

---

## Layout (ASCII Wireframe)

```
+------------------------------------------------------------------------+
|  PSMS  [🔔]  [Search...]                              [Avatar] John v  |
+------------------+-----------------------------------------------------+
|  NAVIGATION      |  EXPORT APPOINTMENT DATA                            |
|                  |                                                     |
|  Dashboard       |  ── Export Filters ──                              |
|  Calendar        |                                                     |
|  Appointments    |  Date Range                                         |
|  Tags            |  From: [2026-01-01]          To: [2026-03-31]      |
|  Reminders       |                                                     |
|  Notifications   |  Tags                                               |
|  Statistics      |  [ ] Work   [ ] Personal   [ ] Study   [ ] Health  |
|  Export      <   |  [ ] All Tags (select all)                          |
|  Profile         |                                                     |
|                  |  Status                                             |
|                  |  (•) All   ( ) Pending only   ( ) Completed only    |
|                  |                                                     |
|                  |  ── Preview ──                                      |
|                  |                                                     |
|                  |  Records matching filters: 18 appointments          |
|                  |                                                     |
|                  |  +------+--------------------+--------+--------+   |
|                  |  | Date | Title              | Tags   | Status |   |
|                  |  +------+--------------------+--------+--------+   |
|                  |  |Mar 5 | Team Standup        | Work   |Done    |   |
|                  |  |Mar 7 | Doctor Appointment  | Health |Pending |   |
|                  |  |Mar 10| Study Session       | Study  |Done    |   |
|                  |  |Mar 11| Gym                 | Health |Done    |   |
|                  |  |Mar 14| Weekly Review       | Work   |Pending |   |
|                  |  | ...  | ...                 | ...    | ...    |   |
|                  |  +------+--------------------+--------+--------+   |
|                  |                                                     |
|                  |  Exported columns:                                  |
|                  |  Title | Start Time | End Time | Status | Tags     |
|                  |                                                     |
|                  |          [ Export to CSV ]                          |
+------------------+-----------------------------------------------------+
```

---

## Components

- **Date range pickers**: "From" and "To" date inputs to define the export window
- **Tag checkboxes**: Individual tag filters plus a "Select All" option
- **Status radio buttons**: All / Pending only / Completed only
- **Preview table**: Shows the first few matching records based on current filter selection
- **Record count label**: Displays how many appointments match the current filter settings
- **Column list**: Informs the user which columns will appear in the CSV output
- **"Export to CSV" button**: Triggers file generation and browser download

---

## User Actions

- Select a date range for the export window
- Check/uncheck specific tags to include or exclude appointment categories
- Choose whether to export all, only pending, or only completed appointments
- See a live preview table of the matching records before exporting
- View the count of records that will be exported
- Click "Export to CSV" to download the file
- The downloaded CSV file will contain: Title, Start Time, End Time, Status, Tags
