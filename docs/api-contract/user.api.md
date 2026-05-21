# API Contract: User Profile & Notifications

## Feature

- Name: user
- Primary module: User
- Related entities: User, Notification, UserDevice

## Related Use-cases

- UC-5: Manage Profile
- UC-17: View notification history
- UC-17.1: Mark notification as read

## Endpoint 1: Get Current Profile

### Endpoint

- Method: GET
- URL: /users/me
- Description: Retrieve profile of currently authenticated user.

### Request DTO

- None (JWT principal required).

### Response DTO

#### UserProfileResponseDto

| Field       | Type                | Description                |
| ----------- | ------------------- | -------------------------- |
| id          | uuid string         | User identifier            |
| email       | string              | Account email              |
| displayName | string              | Profile display name       |
| timezone    | string              | User timezone (IANA)       |
| createdAt   | ISO datetime string | Account creation timestamp |

### Business Rules Mapping

- BR-3: JWT required.
- BR-5: users can only access their own profile context.

### Error Cases

- 401 Unauthorized: invalid or missing JWT.
- 404 Not Found: user profile not found.

## Endpoint 2: Update Current Profile

### Endpoint

- Method: PUT
- URL: /users/me
- Description: Update non-critical profile fields for authenticated user.

### Request DTO

#### UpdateProfileRequestDto

- The `id` field is derived from JWT payload `sub` via CurrentUser context

| Field       | Type   | Required | Validation                                                         |
| ----------- | ------ | -------- | ------------------------------------------------------------------ |
| displayName | string | No       | min length 1; max length 100, Must not be empty or whitespace-only |
| timezone    | string | No       | valid IANA timezone format; max length 64                          |

### Response DTO

#### UserProfileResponseDto

| Field       | Type                | Description              |
| ----------- | ------------------- | ------------------------ |
| id          | uuid string         | User identifier          |
| email       | string              | Account email            |
| displayName | string              | Updated profile name     |
| timezone    | string              | Updated user timezone    |
| updatedAt   | ISO datetime string | Profile update timestamp |

### Business Rules Mapping

- BR-3: JWT required.
- BR-5: users can only update their own profile.

### Error Cases

- 400 Bad Request: invalid displayName or timezone.
- 401 Unauthorized: invalid or missing JWT.
- 404 Not Found: user profile not found.

## Endpoint 3: Get User Notifications

### Endpoint

- Method: GET
- URL: /users/me/notifications
- Description: Retrieve notification history for current user.

### Request DTO

- None (JWT principal required).

### Response DTO

#### NotificationResponseDto[]

| Field         | Type                | Description             |
| ------------- | ------------------- | ----------------------- |
| id            | uuid string         | Notification identifier |
| type          | enum                | REMINDER, SYSTEM        |
| message       | string              | Notification content    |
| isRead        | boolean             | Read status             |
| createdAt     | ISO datetime string | Creation timestamp      |
| readAt        | ISO datetime string | Read timestamp          |

### Business Rules Mapping

- BR-25: in-app notifications are persisted in notification log.
- BR-26: users can view notification history.
- BR-5: notification access is owner-scoped.

### Error Cases

- 401 Unauthorized: missing or invalid JWT.

## Endpoint 4: Mark All Notifications as Read

### Endpoint

- Method: PATCH
- URL: /users/me/notifications/all
- Description: Mark all notifications as read for current user.

### Request DTO

- None.

### Response DTO

#### MarkAllNotificationsReadResponseDto

| Field   | Type   | Description                 |
| ------- | ------ | --------------------------- |
| success | boolean | Operation status           |
| count   | number | Number of marked read      |

### Business Rules Mapping

- BR-26: notification history is user-manageable (read state).
- BR-5: only owner can mark read.

### Error Cases

- 401 Unauthorized: missing or invalid JWT.

## Endpoint 5: Mark Single Notification as Read

### Endpoint

- Method: PATCH
- URL: /users/me/notifications/:id
- Description: Mark one notification as read for current user.

### Request DTO

#### MarkNotificationReadParamsDto

| Field | Type        | Required | Validation                   |
| ----- | ----------- | -------- | ---------------------------- |
| id    | uuid string | Yes      | valid notification UUID      |

### Response DTO

#### MarkNotificationReadResponseDto

| Field   | Type                | Description             |
| ------- | ------------------- | ----------------------- |
| id      | uuid string         | Notification identifier |
| readAt  | ISO datetime string | Read timestamp          |
| success | boolean             | Operation status        |

### Business Rules Mapping

- BR-26: notification history is user-manageable (read state).
- BR-5: only owner can mark read.

### Error Cases

- 400 Bad Request: invalid id format.
- 401 Unauthorized: missing or invalid JWT.
- 404 Not Found: notification not found for user.

## Endpoint 6: Register Device

### Endpoint

- Method: POST
- URL: /users/devices
- Description: Register device for push notifications.

### Request DTO

#### UserDeviceRequestDto

| Field   | Type   | Required | Constraints                        |
| ------- | ------ | -------- | ---------------------------------- |
| fcmToken| string | Yes      | valid Firebase Cloud Messaging token |

### Response DTO

#### UserDeviceResponseDto

| Field     | Type                | Description          |
| --------- | ------------------- | -------------------- |
| id        | uuid string         | Device identifier    |
| fcmToken  | string              | FCM token            |
| createdAt | ISO datetime string | Registration time    |

### Error Cases

- 400 Bad Request: invalid FCM token.
- 401 Unauthorized: missing or invalid JWT.
- 409 Conflict: device already registered.

## Endpoint 7: Get User Devices

### Endpoint

- Method: GET
- URL: /users/devices
- Description: Get registered devices for current user.

### Response DTO

#### UserDeviceListResponseDto

| Field | Type                    | Description        |
| ----- | ----------------------- | ------------------ |
| items | UserDeviceResponseDto[] | Registered devices |

### Error Cases

- 401 Unauthorized: missing or invalid JWT.

## Endpoint 8: Remove Device

### Endpoint

- Method: DELETE
- URL: /users/devices
- Description: Unregister device from push notifications.

### Request DTO

#### RemoveDeviceRequestDto

| Field   | Type   | Required | Constraints              |
| ------- | ------ | -------- | ------------------------ |
| fcmToken| string | Yes      | valid FCM token to remove |

### Response DTO

#### RemoveDeviceResponseDto

| Field   | Type    | Description                |
| ------- | ------- | -------------------------- |
| success | boolean | Device removal status      |
| message | string  | Status message             |

### Error Cases

- 400 Bad Request: invalid FCM token.
- 401 Unauthorized: missing or invalid JWT.

## Self Review

- User profile management use-case UC-5 is covered.
- Notification management use-cases UC-17, UC-17.1 are covered.
- Device management endpoints are documented.
- No duplicated endpoints in this feature contract.
- Validation constraints map to business rules and database lengths.
- Naming is consistent with UpdateXRequestDto, XResponseDto pattern.
- No internal fields exposed.
