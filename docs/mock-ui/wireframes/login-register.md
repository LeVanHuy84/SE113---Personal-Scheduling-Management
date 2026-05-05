# Login / Register Screen

## Purpose

This screen is the entry point of the Personal Scheduling Management System (PSMS). It allows existing users to log in with their credentials and new users to create an account. After successful login, the user is redirected to the Calendar Dashboard.

---

## Layout (ASCII Wireframe)

### Login Tab

```
+----------------------------------------------------------+
|          PSMS — Personal Scheduling Manager              |
+----------------------------------------------------------+
|                                                          |
|          +------------------------------------+          |
|          |   [ Login ]     [ Register ]       |  <tab    |
|          |------------------------------------|          |
|          |                                    |          |
|          |  Email                             |          |
|          |  [__________________________________]         |
|          |                                    |          |
|          |  Password                          |          |
|          |  [__________________________________]         |
|          |                                    |          |
|          |  [ ] Remember Me                   |          |
|          |                                    |          |
|          |        [ Login ]                   |          |
|          |                                    |          |
|          |  Forgot Password?                  |          |
|          +------------------------------------+          |
|                                                          |
+----------------------------------------------------------+
```

### Register Tab

```
+----------------------------------------------------------+
|          PSMS — Personal Scheduling Manager              |
+----------------------------------------------------------+
|                                                          |
|          +------------------------------------+          |
|          |   [ Login ]     [ Register ]       |  <tab    |
|          |------------------------------------|          |
|          |                                    |          |
|          |  Full Name                         |          |
|          |  [__________________________________]         |
|          |                                    |          |
|          |  Email                             |          |
|          |  [__________________________________]         |
|          |                                    |          |
|          |  Password                          |          |
|          |  [__________________________________]         |
|          |                                    |          |
|          |  Confirm Password                  |          |
|          |  [__________________________________]         |
|          |                                    |          |
|          |        [ Create Account ]          |          |
|          |                                    |          |
|          |  Already have an account? Login    |          |
|          +------------------------------------+          |
|                                                          |
+----------------------------------------------------------+
```

---

## Components

- **Tab bar**: Toggle between Login and Register forms
- **Text inputs**: Email, Password, Confirm Password, Full Name
- **Checkbox**: "Remember Me" (login form only)
- **Primary button**: Login / Create Account
- **Link**: "Forgot Password?" → navigates to Forgot Password screen
- **Link**: "Already have an account? Login" (register form)
- **Inline validation messages**: shown below invalid fields on submit
- **Success banner**: Shown after successful registration (ask user to verify email)

---

## User Actions

- Switch between Login and Register tabs
- Fill in credentials and submit login form
- Receive error if credentials are invalid or email is unverified
- Fill in registration form and submit
- Receive error if email already exists or passwords do not match
- Click "Forgot Password?" to go to the password reset screen
- After successful registration, see a message to check their email for verification
