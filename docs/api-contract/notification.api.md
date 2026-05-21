# API Contract: Notification

## Feature

- Name: notification
- Primary module: Notification
- Related entities: Notification

## Related Use-cases

- UC-17: View notification history
- UC-20: Reminder-triggered notification logging (producer side)

## Endpoint 1: Get Notification History

### Endpoint

- Method: GET
- URL: /users/me/notifications
- Description: Retrieve notification history for current user.

### Request DTO

#### GetNotificationsQueryDto

| Field  | Type        | Required | Validation                 |
| ------ | ----------- | -------- | -------------------------- |
| page   | number      | No       | integer >= 1; default 1    |
| limit  | number      | No       | integer 1..100; default 20 |
| isRead | boolean     | No       | optional read-state filter |
| type   | enum string | No       | REMINDER or SYSTEM         |

### Response DTO

#### NotificationResponseDto

| Field         | Type                         | Description             |
| ------------- | ---------------------------- | ----------------------- |
| id            | uuid string                  | Notification identifier |
| appointmentId | uuid string nullable         | Related appointment id  |
| reminderId    | uuid string nullable         | Related reminder id     |
| type          | enum                         | REMINDER, SYSTEM        |
| message       | string                       | Notification content    |
| scheduledAt   | ISO datetime string          | Scheduled trigger time  |
| triggeredAt   | ISO datetime string nullable | Actual trigger time     |
| readAt        | ISO datetime string nullable | Read timestamp          |
| createdAt     | ISO datetime string          | Creation timestamp      |

#### NotificationListResponseDto

| Field       | Type                      | Description                |
| ----------- | ------------------------- | -------------------------- |
| items       | NotificationResponseDto[] | Paged notification records |
| page        | number                    | Current page               |
| limit       | number                    | Page size                  |
| total       | number                    | Total notification count   |
| unreadCount | number                    | Unread notifications count |

### Business Rules Mapping

- BR-25: in-app notifications are persisted in notification log.
- BR-26: users can view notification history.
- BR-5 and domain invariant: notification access is owner-scoped.

### Error Cases

- 400 Bad Request: invalid query parameters.
- 401 Unauthorized: missing or invalid JWT.

## Endpoint 2: Mark Single Notification as Read

### Endpoint

- Method: PATCH
- URL: /users/me/notifications/:id
- Description: Mark one notification as read for current user.

### Request DTO

#### MarkNotificationReadParamsDto

| Field | Type        | Required | Validation              |
| ----- | ----------- | -------- | ----------------------- |
| id    | uuid string | Yes      | valid notification UUID |

### Response DTO

#### MarkNotificationReadResponseDto

| Field   | Type                | Description             |
| ------- | ------------------- | ----------------------- |
| id      | uuid string         | Notification identifier |
| readAt  | ISO datetime string | Read timestamp          |
| success | boolean             | Operation status        |

### Business Rules Mapping

- BR-26: notification history is user-manageable (read state).
- BR-5/domain ownership invariant: only owner can mark read.

### Error Cases

- 400 Bad Request: invalid id format.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: notification not found for user.

## Endpoint 3: Mark All Notifications as Read

### Endpoint

- Method: PATCH
- URL: /users/me/notifications/all
- Description: Mark all notifications as read for current user.

### Request DTO

- None.

### Response DTO

#### MarkAllNotificationsReadResponseDto

| Field   | Type   | Description            |
| ------- | ------ | ---------------------- |
| success | boolean | Operation status      |
| count   | number | Number of marked read |

### Business Rules Mapping

- BR-26: notification history is user-manageable (read state).
- BR-5: only owner can mark read.

### Error Cases

- 401 Unauthorized: missing or invalid JWT.

## Endpoint 4: Internal Producer Contract (Non-public API)

### Operation

- Name: CreateReminderNotificationLog
- Trigger: reminder scheduler/worker after due reminder firing.
- Description: Create notification history record from reminder event.

### Input DTO

#### CreateReminderNotificationInputDto

| Field         | Type                | Description          |
| ------------- | ------------------- | -------------------- |
| userId        | uuid string         | Notification owner   |
| appointmentId | uuid string         | Linked appointment   |
| reminderId    | uuid string         | Linked reminder      |
| message       | string              | Notification message |
| scheduledAt   | ISO datetime string | Planned trigger time |
| triggeredAt   | ISO datetime string | Actual trigger time  |

### Output DTO

#### CreateReminderNotificationResultDto

| Field     | Type                | Description             |
| --------- | ------------------- | ----------------------- |
| id        | uuid string         | Created notification id |
| type      | enum                | REMINDER                |
| createdAt | ISO datetime string | Persistence timestamp   |

### Business Rules Mapping

- BR-23: scheduler triggers reminder notifications.
- BR-25: notification persisted to log.

### Error Cases

- RETRYABLE: transient database write failure.
- NON_RETRYABLE: invalid foreign-key linkage to user/reminder.

## Endpoint 5: Internal Producer Contract (Non-public API)

## Self Review

- UC-17 and the notification aspect of UC-20 are covered.
- Endpoints are not duplicated in this feature contract.
- Validation and ownership checks are explicitly defined.
- Naming convention is consistent.
- No internal-only database fields are exposed.
