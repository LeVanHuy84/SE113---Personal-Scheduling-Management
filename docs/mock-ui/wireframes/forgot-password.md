# Forgot Password Screen

## Purpose

This screen allows users who have forgotten their password to request a reset link sent to their registered email address, and then set a new password after clicking the link.

---

## Layout (ASCII Wireframe)

### Step 1 — Request Reset Link

```
+----------------------------------------------------------+
|          PSMS — Personal Scheduling Manager              |
+----------------------------------------------------------+
|                                                          |
|          +------------------------------------+          |
|          |         Forgot Password            |          |
|          |------------------------------------|          |
|          |                                    |          |
|          |  Enter your registered email and   |          |
|          |  we will send a reset link.         |          |
|          |                                    |          |
|          |  Email Address                     |          |
|          |  [__________________________________]         |
|          |                                    |          |
|          |     [ Send Reset Link ]            |          |
|          |                                    |          |
|          |  < Back to Login                   |          |
|          +------------------------------------+          |
|                                                          |
+----------------------------------------------------------+
```

### Step 2 — Check Email (Confirmation Page)

```
+----------------------------------------------------------+
|          PSMS — Personal Scheduling Manager              |
+----------------------------------------------------------+
|                                                          |
|          +------------------------------------+          |
|          |         Check Your Email           |          |
|          |------------------------------------|          |
|          |                                    |          |
|          |  A password reset link has been    |          |
|          |  sent to: user@example.com         |          |
|          |                                    |          |
|          |  The link expires in 30 minutes.   |          |
|          |                                    |          |
|          |     [ Resend Email ]               |          |
|          |                                    |          |
|          |  < Back to Login                   |          |
|          +------------------------------------+          |
|                                                          |
+----------------------------------------------------------+
```

### Step 3 — Set New Password (via reset link)

```
+----------------------------------------------------------+
|          PSMS — Personal Scheduling Manager              |
+----------------------------------------------------------+
|                                                          |
|          +------------------------------------+          |
|          |         Set New Password           |          |
|          |------------------------------------|          |
|          |                                    |          |
|          |  New Password                      |          |
|          |  [__________________________________]         |
|          |                                    |          |
|          |  Confirm New Password              |          |
|          |  [__________________________________]         |
|          |                                    |          |
|          |     [ Reset Password ]             |          |
|          |                                    |          |
|          |  Password requirements:            |          |
|          |  - Minimum 8 characters            |          |
|          |  - At least one number             |          |
|          +------------------------------------+          |
|                                                          |
+----------------------------------------------------------+
```

---

## Components

- **Email input**: Text field for entering registered email
- **Primary button**: "Send Reset Link" / "Resend Email" / "Reset Password"
- **Back link**: Returns to login screen
- **Info banner**: Confirmations and instructions for each step
- **Password inputs**: New Password and Confirm New Password (Step 3)
- **Password hint list**: Rules displayed below input fields
- **Error message**: Displayed if email is not found or token is expired

---

## User Actions

- Enter registered email and request a reset link
- See confirmation that email was sent, with option to resend
- Click the reset link in their email (external action)
- Enter and confirm new password
- Submit new password and get redirected to login screen
- See error if link is invalid or expired, with option to request a new one
