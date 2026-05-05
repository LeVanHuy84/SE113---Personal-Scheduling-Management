# Reminder Settings

## Purpose

A dedicated screen for users to configure default reminder preferences, and to review or manage reminders set on individual appointments. Users can set default lead times and view all upcoming scheduled reminders.

---

## Layout (ASCII Wireframe)

### Reminder Settings Page

```
+------------------------------------------------------------------------+
|  PSMS  [🔔]  [Search...]                              [Avatar] John v  |
+------------------+-----------------------------------------------------+
|  NAVIGATION      |  REMINDER SETTINGS                                  |
|                  |                                                     |
|  Dashboard       |  ── Default Reminder Preferences ──                |
|  Calendar        |                                                     |
|  Appointments    |  Default reminder time for new appointments         |
|  Tags            |  [15 minutes before v]                              |
|  Reminders   <   |                                                     |
|  Notifications   |  Snooze duration                                    |
|  Statistics      |  [10 minutes v]                                     |
|  Export          |                                                     |
|  Profile         |  Enable email notifications                         |
|                  |  [ ] Send reminder to email as well                 |
|                  |                                                     |
|                  |  [ Save Preferences ]                               |
|                  |                                                     |
|                  |  ── Upcoming Reminders ──                           |
|                  |                                                     |
|                  |  +---------------------------+--------+--------+----+|
|                  |  | Appointment               | Remind | Status | Act||
|                  |  +---------------------------+--------+--------+----+|
|                  |  | Team Standup (Mar 14)     | -15min | Due    | [X]||
|                  |  | Doctor Appt  (Mar 14)     | -1hr   | Due    | [X]||
|                  |  | Study Session(Mar 15)     | -30min | Sched  | [X]||
|                  |  | Weekly Review(Mar 16)     | -1day  | Sched  | [X]||
|                  |  +---------------------------+--------+--------+----+|
+------------------+-----------------------------------------------------+
```

### Add / Edit Reminder for an Appointment (accessed from Appointment form)

```
+---------------------------------------------------+
|  Reminders for: Team Standup              [X]     |
+---------------------------------------------------+
|                                                   |
|  [+ Add Reminder]                                 |
|                                                   |
|  #1  [10 minutes before v]       [Remove]         |
|  #2  [1 day before      v]       [Remove]         |
|                                                   |
|  Available options:                               |
|   5 minutes | 10 minutes | 15 minutes | 30 minutes|
|   1 hour | 2 hours | 1 day | Custom               |
|                                                   |
|  Custom time: [____] [minutes v] before           |
|                                                   |
|        [ Cancel ]       [ Save Reminders ]        |
+---------------------------------------------------+
```

---

## Components

- **Default reminder dropdown**: "X minutes/hours/days before" selector
- **Snooze duration dropdown**: Configures how long snoozed reminders wait before re-triggering
- **Email notification checkbox**: Opt-in to also receive reminders via email (future feature indicator)
- **Save Preferences button**: Persists default settings
- **Upcoming reminders table**: Columns — Appointment name & date, Lead time, Status (Due / Scheduled), Remove action
- **Remove button (X)**: Cancel a specific reminder
- **Add Reminder panel**: Accessed from the appointment form; lists all reminders for one appointment with option to add or remove
- **Time option list**: Preset options plus a custom numeric input
- **Status badges**: "Due" (reminder time has passed, triggered) vs "Scheduled" (future)

---

## User Actions

- Set a default reminder lead time that will be pre-filled when creating new appointments
- Set the default snooze duration
- Enable or disable email reminders
- Save updated preferences
- View all upcoming scheduled reminders in a list
- Remove any scheduled reminder from the list
- (From appointment form) add multiple reminders to a single appointment
- (From appointment form) remove individual reminders from an appointment
- Enter a custom reminder lead time in minutes, hours, or days
