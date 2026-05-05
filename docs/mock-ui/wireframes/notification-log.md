# Notification Log

## Purpose

Displays a chronological history of all in-app notifications received by the user, including appointment reminders, system alerts, and status updates. Users can mark notifications as read, dismiss individual notifications, or clear the entire log.

---

## Layout (ASCII Wireframe)

### Notification Log Page

```
+------------------------------------------------------------------------+
|  PSMS  [🔔 3]  [Search...]                            [Avatar] John v  |
+------------------+-----------------------------------------------------+
|  NAVIGATION      |  NOTIFICATIONS                                      |
|                  |                                                     |
|  Dashboard       |  [Filter: All v]  [Mark All as Read]  [Clear All]  |
|  Calendar        |                                                     |
|  Appointments    |  ── Today ──                                        |
|  Tags            |                                                     |
|  Reminders       |  +--------------------------------------------------+|
|  Notifications < |  | 🔔 [UNREAD]  Reminder                           ||
|  Statistics      |  |   Team Standup starts in 10 minutes              ||
|  Export          |  |   Today 08:50                          [Dismiss] ||
|  Profile         |  +--------------------------------------------------+|
|                  |  +--------------------------------------------------+|
|                  |  | 🔔 [UNREAD]  Reminder                           ||
|                  |  |   Doctor Appointment starts in 1 hour            ||
|                  |  |   Today 10:30                          [Dismiss] ||
|                  |  +--------------------------------------------------+|
|                  |  +--------------------------------------------------+|
|                  |  | 🔔 [READ]    Reminder                            ||
|                  |  |   Study Session — snoozed for 10 min             ||
|                  |  |   Today 07:20                          [Dismiss] ||
|                  |  +--------------------------------------------------+|
|                  |                                                     |
|                  |  ── Yesterday ──                                    |
|                  |                                                     |
|                  |  +--------------------------------------------------+|
|                  |  | 🔔 [READ]    Reminder                            ||
|                  |  |   Weekly Review starts in 15 minutes             ||
|                  |  |   Mar 13  16:45                        [Dismiss] ||
|                  |  +--------------------------------------------------+|
|                  |                                                     |
|                  |  Showing 4 notifications                            |
+------------------+-----------------------------------------------------+
```

### Notification Pop-up (triggered by Scheduler Service)

```
+-------------------------------------------+
|  🔔  Reminder                             |
|  Team Standup in 10 minutes               |
|  9:00 AM — 10:00 AM                       |
|                                           |
|  [ Snooze 10 min ]      [ Dismiss ]       |
+-------------------------------------------+
```

---

## Components

- **Filter dropdown**: All / Unread / Read
- **"Mark All as Read" button**: Marks all notifications as read in bulk
- **"Clear All" button**: Removes all notification history entries
- **Notification list**: Grouped by date (Today, Yesterday, earlier dates)
- **Notification card**: Contains — icon, read/unread badge, type label, message text, timestamp, Dismiss button
- **Unread indicator**: Bold text or highlighted background for unread notifications
- **Notification badge on bell icon**: Shows count of unread notifications in the top nav
- **Pop-up banner**: Floating notification triggered in real-time by the Scheduler Service with Snooze and Dismiss actions

---

## User Actions

- View the full notification history grouped by date
- Filter notifications by read/unread status
- Click "Mark All as Read" to clear the unread badge on the bell icon
- Dismiss individual notifications from the log
- Click "Clear All" to remove the entire notification history
- Interact with real-time pop-up notifications: choose to Snooze (reschedule reminder after 10 min) or Dismiss permanently
- Navigate to the related appointment from a notification card by clicking the message text
