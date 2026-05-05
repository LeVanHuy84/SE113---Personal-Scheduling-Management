# Implementation Overview

## Purpose

This document summarizes the current backend implementation in `src/` against `docs/srs/SRS.md` and highlights the next feature area to implement.

## What Is Already Implemented

### Authentication and User Access

- JWT-based authentication is in place for register, login, verify email, resend verification, forgot password, reset password, refresh, and logout.
- Auth attempts are logged, and the login flow rejects invalid credentials and unverified users.
- Protected user profile endpoints exist for reading and updating the current user's profile.
- User device registration and device listing are implemented for push notification support.

### Personal Scheduling

- Personal appointment listing and status updates are implemented behind JWT protection.
- Appointment lifecycle work already includes recurring-series handling, queue-based generation, and conflict checks for personal series creation and updates.

### Tags and Search Support

- Tag CRUD exists for the authenticated user.
- Tag name uniqueness per user is enforced.
- Appointment-series creation supports tag association.

### Reminders and Notifications

- Notification creation and delivery flow exists through Firebase and persisted notification records.
- Users can fetch notifications and mark them as read.
- Reminder and queue infrastructure is already present and wired into the appointment flow.

### Recurring Scheduling

- Recurrence types and series generation exist for daily, weekly, monthly, and yearly patterns.
- Series updates and deletes include cleanup logic for future occurrences.

## SRS Coverage Summary

### Covered or Largely Covered

- FR-01 to FR-05: authentication and profile management.
- FR-06 to FR-09: personal appointment lifecycle and status handling.
- FR-11: tag management.
- FR-15 to FR-17: reminders and notifications.
- Recurring-series support related to FR-06 and FR-07.

### Partial or Still Open

- FR-10: appointment filtering/search is present in the codebase, but export and end-to-end coverage should be checked against the latest contract.
- FR-18: statistics is still incomplete; the module exists, but implementation is not finished.

### Not Started Yet

- FR-19 to FR-29: team management and collaboration.
- There is currently no dedicated `src/team/` module and no team models in `prisma/schema.prisma`.

## Recommended Next Step

Build the team foundation first:

- add the team-related Prisma models;
- create a `src/team/` module with repository, service, controller, and DTOs;
- implement team creation and membership baseline flows;
- keep role-based access and shared-calendar logic for the next iteration.

## Notes

- The current backend already provides reusable patterns for JWT auth, DTO validation, service-repository structure, queue jobs, and notification delivery.
- Team feature work should reuse those patterns instead of introducing a separate architecture.
