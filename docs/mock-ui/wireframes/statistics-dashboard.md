# Statistics Dashboard

## Purpose

Provides users with visual analytics and productivity insights about their appointment history. Displays completion rates, appointment distribution by tag, most productive time slots, and weekly/monthly trends to help improve time management.

---

## Layout (ASCII Wireframe)

```
+------------------------------------------------------------------------+
|  PSMS  [🔔]  [Search...]                              [Avatar] John v  |
+------------------+-----------------------------------------------------+
|  NAVIGATION      |  STATISTICS DASHBOARD                               |
|                  |                                                     |
|  Dashboard       |  Period: [ This Week v ]   [ This Month ]           |
|  Calendar        |          Mar 8 — Mar 14, 2026                       |
|  Appointments    |                                                     |
|  Tags            |  ── Summary Cards ──                                |
|  Reminders       |                                                     |
|  Notifications   |  +----------+  +----------+  +----------+          |
|  Statistics  <   |  | TOTAL    |  |COMPLETED |  |COMPLETION|          |
|  Export          |  |          |  |          |  |   RATE   |          |
|  Profile         |  |    24    |  |    18    |  |   75%    |          |
|                  |  | appts    |  | appts    |  |          |          |
|                  |  +----------+  +----------+  +----------+          |
|                  |                                                     |
|                  |  ── Appointments by Tag ──                         |
|                  |  +----------------------------------------+        |
|                  |  | Work    ████████████████ 10 (42%)      |        |
|                  |  | Personal██████████  7 (29%)            |        |
|                  |  | Study   ██████  4 (17%)                |        |
|                  |  | Health  ███  3 (12%)                   |        |
|                  |  +----------------------------------------+        |
|                  |                                                     |
|                  |  ── Daily Completion Trend (This Week) ──          |
|                  |  +----------------------------------------+        |
|                  |  |  ▲                                      |        |
|                  |  |  |     █                               |        |
|                  |  |  |  █  █  █                            |        |
|                  |  |  |  █  █  █  █  █                      |        |
|                  |  |  +--Mon-Tue-Wed-Thu-Fri-Sat-Sun-→      |        |
|                  |  +----------------------------------------+        |
|                  |                                                     |
|                  |  ── Most Productive Time Slots ──                   |
|                  |  +-------+--------------------+                    |
|                  |  | Slot  | Completed / Total  |                    |
|                  |  +-------+--------------------+                    |
|                  |  | 09:00 | 5 completed / 6    |  ████████▓         |
|                  |  | 14:00 | 4 completed / 5    |  ███████▓          |
|                  |  | 11:00 | 3 completed / 4    |  ██████            |
|                  |  | 16:00 | 2 completed / 3    |  ████              |
|                  |  +-------+--------------------+                    |
+------------------+-----------------------------------------------------+
```

---

## Components

- **Period selector**: Dropdown or toggle buttons — "This Week", "This Month", custom date range
- **Summary cards**: Three highlighted metric cards — Total Appointments, Completed Appointments, Completion Rate (%)
- **Tag distribution bar chart**: Horizontal bar chart showing appointment count and percentage per tag
- **Daily trend chart**: Bar chart/line chart showing completed appointments per day for the selected period
- **Productive time slots table**: Shows time-of-day slots ranked by completion rate
- **Empty state message**: Encourages user to schedule and complete appointments when data is insufficient
- **Period label**: Shows the exact date range currently being analyzed

---

## User Actions

- Select a time period to analyze (this week, this month)
- View total and completed appointment counts for the period
- View completion rate as a percentage
- Analyze which tags dominate the user's schedule
- See which days of the week are most active
- Identify the most productive time slots based on completed appointment frequency
- See an encouraging empty state message if not enough data exists to show meaningful stats
