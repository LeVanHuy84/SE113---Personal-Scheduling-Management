# Profile Page

## Purpose

Allows the authenticated user to view and update their personal profile information such as name and avatar, change their password, and manage account-level preferences. Email address is read-only and cannot be changed after registration.

---

## Layout (ASCII Wireframe)

```
+------------------------------------------------------------------------+
|  PSMS  [🔔]  [Search...]                              [Avatar] John v  |
+------------------+-----------------------------------------------------+
|  NAVIGATION      |  PROFILE SETTINGS                                   |
|                  |                                                     |
|  Dashboard       |  ── Personal Information ──                        |
|  Calendar        |                                                     |
|  Appointments    |         +----------+                                |
|  Tags            |         | [Avatar] |  [ Change Photo ]             |
|  Reminders       |         +----------+                                |
|  Notifications   |                                                     |
|  Statistics      |  Full Name *                                        |
|  Export          |  [__________________________________]               |
|  Profile     <   |                                                     |
|                  |  Email  (read-only)                                 |
|                  |  [john.doe@example.com           ]  🔒              |
|                  |                                                     |
|                  |  Timezone                                           |
|                  |  [UTC+07:00 — Indochina Time   v ]                  |
|                  |                                                     |
|                  |  [ Save Changes ]                                   |
|                  |                                                     |
|                  |  ── Change Password ──                              |
|                  |                                                     |
|                  |  Current Password                                   |
|                  |  [__________________________________]               |
|                  |                                                     |
|                  |  New Password                                       |
|                  |  [__________________________________]               |
|                  |                                                     |
|                  |  Confirm New Password                               |
|                  |  [__________________________________]               |
|                  |                                                     |
|                  |  [ Update Password ]                                |
|                  |                                                     |
|                  |  ── Preferences ──                                  |
|                  |                                                     |
|                  |  Default Calendar View                              |
|                  |  ( ) Day  (•) Week  ( ) Month  ( ) Agenda          |
|                  |                                                     |
|                  |  [ Save Preferences ]                               |
|                  |                                                     |
|                  |  ── Danger Zone ──                                  |
|                  |                                                     |
|                  |  [ Delete Account ]  (destructive action)          |
+------------------+-----------------------------------------------------+
```

### Delete Account Confirmation Dialog

```
+------------------------------------------+
|  Delete Account                      [X]  |
+------------------------------------------+
|                                           |
|  Are you sure you want to permanently     |
|  delete your account?                     |
|                                           |
|  ⚠ This will delete all appointments,   |
|    tags, reminders, and notifications.    |
|  This action CANNOT be undone.            |
|                                           |
|  Type your email to confirm:             |
|  [____________________________________]   |
|                                           |
|   [ Cancel ]      [ Delete Account ]     |
+------------------------------------------+
```

---

## Components

- **Avatar display + "Change Photo" button**: Upload a profile picture
- **Full Name input**: Editable text field
- **Email field**: Read-only with a lock icon (cannot be changed post-registration)
- **Timezone dropdown**: Select user's local timezone
- **Save Changes button**: Persists personal information changes
- **Current/New/Confirm Password inputs**: For changing password
- **Update Password button**: Validates and updates the password
- **Default Calendar View radio group**: Stores the preferred view (Day/Week/Month/Agenda)
- **Save Preferences button**: Saves UI preferences
- **Delete Account button**: Opens the dangerous confirmation dialog
- **Confirmation dialog with email re-entry**: Prevents accidental account deletion

---

## User Actions

- Update full name
- Upload or change profile avatar photo
- View email (read-only — cannot edit)
- Select timezone preference
- Save personal profile changes and see success confirmation
- Enter current password and set a new password
- Update preferred default calendar view
- Initiate account deletion, confirm by typing email, and permanently delete the account
