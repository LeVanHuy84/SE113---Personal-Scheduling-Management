# API Contract: Notification

## Feature

- Name: notification
- Primary module: NotificationService
- Related entities: Notification, UserDevice, Appointment, TeamInvitation, TeamAppointment
- Scope: internal service contract only; no public HTTP controller exists in the current backend

## Related Use-cases

- UC-17: View notification history
- UC-20: Reminder-triggered notification logging

## Contract 1: Persist and Dispatch Notification

### Operation

- Name: sendAndCreateNotification
- Description: Send a push notification to the user's registered devices and persist a notification log row.

### Input DTO

#### SendAndCreateNotificationInput

| Field             | Type                   | Required | Validation / Notes                                                 |
| ----------------- | ---------------------- | -------- | ------------------------------------------------------------------ |
| userId            | uuid string            | Yes      | notification owner                                                 |
| actorUserId       | uuid string            | No       | optional actor reference                                           |
| appointmentId     | uuid string            | No       | linked appointment                                                 |
| teamInvitationId  | uuid string            | No       | linked team invitation                                             |
| teamAppointmentId | uuid string            | No       | linked team appointment                                            |
| type              | enum string            | Yes      | NotificationType: REMINDER, TEAM_INVITATION, TEAM_ACTIVITY, SYSTEM |
| eventType         | enum string            | No       | NotificationEventType values from Prisma enum                      |
| title             | string                 | No       | push title; defaults to Notification                               |
| body              | string                 | Yes      | notification message                                               |
| payload           | object                 | No       | persisted JSON payload                                             |
| pushData          | record<string, string> | No       | extra push payload fields                                          |

### Output DTO

- Promise<void>

### Side Effects

- Sends FCM push only when the user has registered device tokens.
- Persists a row in the notifications table.

### Business Rules Mapping

- BR-23: scheduler-triggered reminder notifications are produced by the system.
- BR-25: in-app notifications are persisted in the notification log.

## Contract 2: Read Notification History

### Operation

- Name: getMyNotifications
- Signature: getMyNotifications(userId: string)
- Description: Return the notification history for a user.

### Response DTO

#### NotificationRecordDto

| Field             | Type                         | Description                 |
| ----------------- | ---------------------------- | --------------------------- |
| id                | uuid string                  | Notification identifier     |
| userId            | uuid string                  | Recipient user id           |
| actorUserId       | uuid string nullable         | Actor user id               |
| appointmentId     | uuid string nullable         | Related appointment id      |
| teamInvitationId  | uuid string nullable         | Related team invitation id  |
| teamAppointmentId | uuid string nullable         | Related team appointment id |
| type              | enum                         | Notification type           |
| eventType         | enum nullable                | Notification event type     |
| title             | string nullable              | Notification title          |
| message           | string                       | Notification content        |
| payload           | json nullable                | Additional payload          |
| readAt            | ISO datetime string nullable | Read timestamp              |
| createdAt         | ISO datetime string          | Creation timestamp          |

### Business Rules Mapping

- BR-26: users can view their notification history.
- Ownership is expected at the caller boundary.

## Contract 3: Mark Notification As Read

### Operation

- Name: markAsRead
- Signature: markAsRead(id: string, userId: string)
- Description: Mark a notification as read.

### Response DTO

#### NotificationRecordDto

| Field     | Type                | Description             |
| --------- | ------------------- | ----------------------- |
| id        | uuid string         | Notification identifier |
| readAt    | ISO datetime string | Read timestamp          |
| createdAt | ISO datetime string | Creation timestamp      |

### Business Rules Mapping

- BR-26: notification read state can be updated by the user.

### Notes

- The current implementation updates by notification id directly and returns the updated row.
- The userId argument is part of the service signature, but ownership enforcement is not performed inside the service body.

## Contract 4: Mark All Notifications As Read

### Operation

- Name: markAllAsRead
- Signature: markAllAsRead(userId: string)
- Description: Mark all unread notifications for a user as read.

### Output DTO

#### UpdateManyResultDto

| Field | Type   | Description            |
| ----- | ------ | ---------------------- |
| count | number | Number of updated rows |

### Business Rules Mapping

- BR-26: bulk read-state updates are allowed.

## Self Review

- This file documents the actual NotificationService surface because the backend currently does not expose a notification controller.
- The notification record shape follows the Prisma model.
- No HTTP endpoints are invented here.
