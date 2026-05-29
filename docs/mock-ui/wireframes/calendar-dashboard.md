# Calendar Dashboard

## Purpose

The main hub of the application. Displays the user's appointments in calendar views (Day, Week, Month) and an Agenda list view. Users can navigate dates, switch views, and quickly create new appointments by clicking a time slot.

---

## Layout (ASCII Wireframe)

```
+------------------------------------------------------------------------+
|  PSMS  [🔔 3]  [Search appointments...]           [Avatar] John Doe v |
+------------------+-----------------------------------------------------+
|  NAVIGATION      |  CALENDAR — March 2026                              |
|                  |  [ Day ]  [ Week ]  [ Month ]  [ Agenda ]           |
|  [+ New]         |  < March 2026 >                                     |
|                  |                                                     |
|  Dashboard       |  Mon   Tue   Wed   Thu   Fri   Sat   Sun            |
|  Calendar   <    |  ----  ----  ----  ----  ----  ----  ----           |
|  Tags            |   2     3     4     5     6     7     8             |
|  Reminders       |   9    10    11    12    13    14    15             |
|  Notifications   |  16    17    18    19    20    21    22             |
|  Statistics      |  23    24    25  [ 26]   27    28    29             |
|  Export          |  30    31                                           |
|  Profile         |                                                     |
|                  |  +-------------------------------+                  |
|  ── TAGS ──      |  |  TODAY — Wed Mar 14, 2026     |                  |
|  ● Work          |  |  09:00  Team Standup           |  [Work]         |
|  ● Personal      |  |  11:30  Doctor Appointment     |  [Personal]     |
|  ● Study         |  |  14:00  Study Session          |  [Study]        |
|  ● Health        |  |  16:00  Gym                    |  [Health]       |
|                  |  +-------------------------------+                  |
+------------------+-----------------------------------------------------+
```

### Month View Detail

```
+-----------------------------------------------------------------+
|  < March 2026 >              [ Day ] [ Week ] [*Month*] [Agenda]|
|  Mon    Tue    Wed    Thu    Fri    Sat    Sun                   |
|  -----  -----  -----  -----  -----  -----  -----               |
|   2      3      4      5      6      7      8                   |
|                 ●Team                 ●Gym                      |
|   9     10     11     12     13    [14]    15                   |
|                                   ●Stan.                        |
|                                   ●Doctor                       |
|  16     17     18     19     20     21     22                   |
|  23     24     25     26     27     28     29                   |
|  30     31                                                      |
+-----------------------------------------------------------------+
```
*(● = appointment dot indicator, [14] = today's date highlighted)*

---

## Components

- **Top navigation bar**: App logo, notification bell with badge count, global search bar, user avatar with dropdown
- **Left sidebar**: Navigation links, "+ New Appointment" button, tag legend with color indicators
- **View switcher tabs**: Day / Week / Month / Agenda
- **Calendar navigation**: Previous / Next arrows and current period label
- **Month grid**: Dates with appointment dot indicators; click date to open day view or create appointment
- **Today's appointments panel**: Summary sidebar panel for the selected day
- **Appointment chips**: Colored by tag on the calendar grid
- **Conflict indicator**: Red border/badge on overlapping appointments

---

## User Actions

- Switch between Day, Week, Month, and Agenda calendar views
- Navigate to previous or future months/weeks/days
- Click on a date or empty time slot to create a new appointment
- Click on an existing appointment chip to open its detail/edit modal
- Filter calendar by tag using the sidebar tag list
- Use the global search bar to search appointments by keyword
- Click the notification bell to view the notification panel
- Click "+ New" to open the appointment creation form
