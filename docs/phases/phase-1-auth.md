# Phase 1 – Authentication

## Goal

Implement JWT-based authentication

---

## Scope

### In scope

- Register
- Login
- JWT generation
- Auth Guard
- CurrentUser decorator

### Out of scope

- OAuth
- Refresh token

---

## APIs

### POST /auth/register

Request:
{
email: string
password: string
name: string
}

---

### POST /auth/login

Request:
{
email: string
password: string
}

Response:
{
accessToken: string
}

---

## Business Rules

- Email must be unique
- Password must be hashed
- JWT required for protected routes

---

## Edge Cases

- Duplicate email
- Invalid credentials

---

## Done Criteria

- Login/Register works
- JWT guard works
