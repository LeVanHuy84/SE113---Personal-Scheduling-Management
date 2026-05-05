Software Requirements Specification

for

Scheduling Management System

Release 1.0

**Version 1.0 approved**

# Introduction

## Purpose

This SRS describes the functional and nonfunctional requirements for release 1.0 of the Scheduling Management System. The specification is aligned to the approved Vision & Scope, Business Rules, and Use Case documents and covers both personal scheduling and collaborative team scheduling.

## Document Conventions

No special typographical conventions are used in this SRS.

## Project Scope and Product Features

The Scheduling Management System is a web application for personal appointment management and small-team collaboration. It supports account management, appointment lifecycle operations, recurring appointments, conflict detection, reminders, analytics, CSV export, team creation, shared calendars, team appointments, multi-user coordination, and availability checks with suggested common free slots.

## References

- Team 6. Vision & Scope Document for the Scheduling Management System, Version 1.0.
- Team 6. Business Rules for Scheduling & Collaborative Team Management System, Version 1.0.
- Team 6. Use Cases for the Scheduling Management System, Version 1.0.

# Overall Description

## Product Perspective

The Scheduling Management System is a new web-based application that provides a centralized scheduling environment for individuals and small teams. It replaces manual notes and fragmented tools with a shared calendar experience, conflict checking, and coordinated planning. The system is built with NextJS for the frontend and NestJS for the backend.

## User Classes and Characteristics

| User Class           | Characteristics                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| End User             | An End User manages personal appointments and may also act as a Team Owner, Team Admin, Organizer, or Team Member in collaborative workflows. |
| Scheduler Service    | An automated background service that triggers reminder notifications and related time-based events.                                           |
| System Administrator | A technical user responsible for deployment, monitoring, and maintenance of the system.                                                       |

## Operating Environment

OE-1: The system shall operate correctly with modern web browsers including the latest versions of Google Chrome, Mozilla Firefox, Microsoft Edge, and Apple Safari.

OE-2: The backend shall be deployed in a Docker container.

OE-3: The frontend shall be built with NextJS.

OE-4: The backend API shall be built with NestJS.

OE-5: The database shall be PostgreSQL.

## Design and Implementation Constraints

CO-1: User sessions must be authenticated using JSON Web Tokens (JWT).

CO-2: All sensitive data, including user passwords, must be protected before storage and during transmission.

CO-3: The system must be designed with a responsive UI to support desktop and mobile devices.

CO-4: Core appointment operations must respond within 2 seconds under normal load conditions.

CO-5: Team appointment create, update, delete, and availability checks must enforce role-based access control.

## Assumptions and Dependencies

AS-1: Users have stable Internet access to use the web application.

AS-2: The backend RESTful API built with NestJS will support a scalable architecture.

AS-3: The PostgreSQL database will handle concurrent scheduling operations efficiently.

AS-4: The JWT authentication mechanism will securely manage user sessions.

AS-5: Team members maintain current availability information so the system can produce accurate conflict checks and suggested free slots.

DE-1: The system depends on a reliable server hosting and deployment environment.

# System Features

## User Account Management

### Description

Users can register, authenticate, sign out, and manage their profile securely. Priority = High.

### Functional Requirements

| ID    | Requirement                                                                                                                                | Use Cases | Business Rules    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ----------------- |
| FR-01 | The system shall allow a user to register an account using a unique email address and shall store the password only after secure hashing.  | UC-1      | BR-1, BR-32       |
| FR-02 | The system shall allow a registered user to log in with email and password, issue a JWT session token, and log the authentication attempt. | UC-2      | BR-2, BR-3, BR-33 |
| FR-03 | The system shall allow an authenticated user to log out and invalidate the active session token.                                           | UC-3      | BR-4              |
| FR-04 | The system shall allow a user to request a password reset and set a new password through a verified reset flow.                            | UC-4      | BR-32             |
| FR-05 | The system shall allow a logged-in user to view and update non-sensitive profile information.                                              | UC-5      | BR-5              |

## Appointment Management

### Description

Users can create, modify, delete, organize, and export personal appointments. Priority = High.

### Functional Requirements

| ID    | Requirement                                                                                                                                                               | Use Cases | Business Rules                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------- |
| FR-06 | The system shall allow a user to create a personal appointment with title, start time, end time, description, location, tags, and optional recurrence.                    | UC-6      | BR-5, BR-6, BR-7, BR-8, BR-9, BR-10 |
| FR-07 | The system shall allow a user to update an appointment they own and, for recurring appointments, choose whether to apply the change to one instance or the entire series. | UC-7      | BR-5, BR-12                         |
| FR-08 | The system shall allow a user to delete an appointment they own and, for recurring appointments, choose whether to delete one instance or the entire series.              | UC-8      | BR-5, BR-12                         |
| FR-09 | The system shall allow a user to mark an appointment as completed or cancelled and to reopen a completed appointment when permitted.                                      | UC-12     | BR-14                               |
| FR-10 | The system shall allow a user to search and filter appointments by keyword, date range, tag, and status.                                                                  | UC-13     | BR-27                               |
| FR-11 | The system shall allow a user to create, assign, and manage appointment tags.                                                                                             | UC-14     | BR-19                               |
| FR-12 | The system shall allow a user to export appointment data in CSV format and preserve the active filters in the exported result.                                            | UC-19     | BR-28, BR-29                        |

## Calendar and Views

### Description

Users can review appointments through multiple calendar presentations. Priority = High.

### Functional Requirements

| ID    | Requirement                                                                                      | Use Cases | Business Rules |
| ----- | ------------------------------------------------------------------------------------------------ | --------- | -------------- |
| FR-13 | The system shall display personal appointments in Day, Week, and Month calendar views.           | UC-9      | BR-13          |
| FR-14 | The system shall provide an Agenda view that lists upcoming appointments in chronological order. | UC-10     | BR-13          |

## Reminders and Notifications

### Description

The system sends appointment reminders and tracks reminder activity. Priority = High.

### Functional Requirements

| ID    | Requirement                                                                                                                                          | Use Cases    | Business Rules |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------- |
| FR-15 | The system shall allow a user to configure one or more reminders for an appointment, with each reminder scheduled before the appointment start time. | UC-15        | BR-21, BR-22   |
| FR-16 | The Scheduler Service shall trigger reminder notifications at the scheduled time and record the delivered notification.                              | UC-20        | BR-23, BR-25   |
| FR-17 | The system shall allow a user to snooze a reminder and to view notification history.                                                                 | UC-16, UC-17 | BR-24, BR-26   |

## Productivity Statistics

### Description

Users can view analytics about their scheduling habits. Priority = Medium.

### Functional Requirements

| ID         | Requirement                                                                                                                                                           | Use Cases | Business Rules                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------- |
| FR-18      | The system shall provide an authenticated statistics dashboard that calculates results for a selected time range and shows completion rate and productive time slots. | UC-18     | BR-15, BR-16, BR-17, BR-18, BR-34 |
| FR-STAT-02 | The system shall return time-series trend data for selected time range, grouped by day or week, showing total and completed appointments per bucket.                  | UC-18     | BR-15, BR-16, BR-17               |

## Team Management and Collaboration

### Description

Users can create teams, manage membership, share calendars, coordinate team appointments, and resolve multi-user availability conflicts. Priority = High.

### Functional Requirements

| ID    | Requirement                                                                                                                                                                                             | Use Cases | Business Rules                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------ |
| FR-19 | The system shall allow an authenticated user to create a team and become the Team Owner by default.                                                                                                     | UC-21     | BR-37, BR-38, BR-39, BR-42                             |
| FR-20 | The system shall allow a Team Owner or Team Admin to invite members to a team with target role limited to Team Admin or Team Member.                                                                    | UC-22     | BR-40, BR-41, BR-42, BR-57                             |
| FR-21 | The system shall allow an active team member to leave a team, while enforcing ownership-transfer constraints when the member is the Team Owner.                                                         | UC-24     | BR-39, BR-43, BR-44                                    |
| FR-22 | The system shall allow an authorized team role to create a non-recurring team appointment linked to a team, organizer, and required participants.                                                       | UC-25     | BR-45, BR-46, BR-47, BR-48, BR-49, BR-53, BR-52        |
| FR-23 | The system shall allow an authorized team role to update a team appointment, including the participant list, and shall recheck permissions and conflicts after every edit.                              | UC-26     | BR-45, BR-46, BR-47, BR-48, BR-50, BR-52, BR-53, BR-56 |
| FR-24 | The system shall allow an authorized team role to delete a team appointment.                                                                                                                            | UC-27     | BR-51, BR-56                                           |
| FR-25 | The system shall display a shared team calendar only to active members of the selected team.                                                                                                            | UC-28     | BR-52, BR-55                                           |
| FR-26 | The system shall display team appointment details with participants only to active members of the selected team.                                                                                        | UC-28     | BR-45, BR-52                                           |
| FR-27 | The system shall validate participant availability against personal and team schedules before saving a team appointment.                                                                                | UC-30     | BR-53, BR-54, BR-64, BR-65                             |
| FR-28 | The system shall return participant conflict details when one or more required participants overlap with another appointment.                                                                           | UC-30     | BR-52, BR-53                                           |
| FR-29 | The system shall suggest common free time slots only in dedicated availability checks.                                                                                                                  | UC-30     | BR-54, BR-64                                           |
| FR-30 | The system shall allow Team Owner or Team Admin to change member role only between Team Admin and Team Member and shall reject Team Owner assignment through role-change operations.                    | UC-23     | BR-40, BR-58, BR-59, BR-63                             |
| FR-31 | The system shall allow only the invited user to accept or decline a pending team invitation.                                                                                                            | UC-31     | BR-60, BR-61                                           |
| FR-32 | The system shall create an active Team Member record when a pending invitation is accepted and shall update invitation status by the defined lifecycle.                                                 | UC-31     | BR-60, BR-62                                           |
| FR-33 | The system shall allow an authorized user to check team availability for a proposed time range and return available participants, busy participants, conflict details, and suggested common free slots. | UC-30     | BR-53, BR-54, BR-64, BR-65                             |
| FR-34 | The system shall allow an authenticated user to retrieve all team invitations addressed to them, including invitation status and optional status filtering.                                             | UC-31     | BR-60, BR-61, BR-66, BR-67                             |

# Data Requirements

## Logical Data Model

The logical data model shall include the following core entities and relationships:

- User, with account, profile, authentication, and audit-related attributes.
- Appointment, owned by one User and optionally linked to reminders, tags, recurrence, and participants.
- Tag, with a many-to-many relationship to Appointment.
- Reminder and Notification, representing scheduled reminder events and delivery history.
- StatisticsReport, representing summary analytics for a selected time range.
- Team, representing a collaborative scheduling group owned by one user.
- TeamMember, representing membership and role assignment within a team.
- TeamAppointment, representing a non-recurring calendar item shared within a team.
- AppointmentParticipant, representing required and optional participants for a team appointment.
- TeamInvitation, representing pending invitations to join a team.

## Data Dictionary

| Data Element            | Description               | Data Type / Composition                                                                                         | Constraints                                                                                            |
| ----------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| user                    | Registered system account | user id, full name, email, password hash, avatar, status, created date                                          | Email unique; password hashed                                                                          |
| appointment             | Personal appointment      | appointment id, owner id, title, description, start datetime, end datetime, location, status, recurrence fields | Owner required; time range valid                                                                       |
| tag                     | Appointment label         | tag id, tag name, tag color, owner id                                                                           | Tag name unique per owner                                                                              |
| reminder                | Scheduled reminder        | reminder id, appointment id, user id, reminder time, delivery status                                            | Reminder time before start time                                                                        |
| notification            | Reminder history item     | notification id, user id, appointment id, message, sent datetime, read status                                   | System generated                                                                                       |
| statistics report       | Analytics summary         | report id, user id, time range, completion rate, productive time slots                                          | Calculated from user data                                                                              |
| team                    | Collaborative group       | team id, team name, description, owner id, status, created date                                                 | Team name unique within owner scope                                                                    |
| team member             | Team membership record    | team id, user id, role, membership status, joined date                                                          | Exactly one Team Owner per team; role changes only between Team Admin and Team Member                  |
| team appointment        | Shared team calendar item | appointment id, team id, organizer id, title, start datetime, end datetime, participants, status                | Non-recurring; organizer required; requires active team membership                                     |
| appointment participant | Team participant link     | team appointment id, user id, participation type                                                                | participation type is REQUIRED or OPTIONAL; duplicate rows not allowed                                 |
| team invitation         | Pending invite record     | invitation id, team id, invited user id, invited by, role, status, created date                                 | Role limited to Team Admin or Team Member; status lifecycle: PENDING to ACCEPTED, DECLINED, or EXPIRED |

## Reports

### Exported Appointment Data

| Report ID          | COS-RPT-1                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Report Title       | Appointment Data Export                                                                        |
| Report Purpose     | Allows a user to export appointment data for backup or use in other applications.              |
| Priority           | Medium                                                                                         |
| Report Users       | End User                                                                                       |
| Data Sources       | User appointment records                                                                       |
| Format             | CSV                                                                                            |
| Selection Criteria | Export reflects the active filters applied by the user, including date range, tag, and status. |
| Data Fields        | Title, Start Time, End Time, Status, Tags, Description, Location                               |

## Data Integrity, Retention, and Disposal

DI-1: A user can only view and manage appointments, teams, and calendars that the current access rules permit.

DI-2: When a user account is deleted, all associated personal records shall be removed, subject to legal or administrative retention rules for audit logs.

DI-3: Team appointments shall preserve audit history for create, update, and delete actions.

DI-4: The system shall maintain referential integrity between users, teams, memberships, appointments, reminders, and notifications.

DI-5: Team ownership shall remain unique per team; Team Owner cannot be assigned via invitation or member role-change operations; team appointment participant links shall remain unique per appointment.

# External Interface Requirements

## User Interfaces

UI-1: The system shall provide a responsive web interface that supports both individual scheduling and team collaboration workflows.

UI-2: The interface shall provide clear success, validation, and conflict messages for appointment and team actions.

UI-3: The interface shall support keyboard navigation and accessible form controls.

## Software Interfaces

SI-1: The NextJS frontend shall communicate with the NestJS backend through a RESTful API over HTTPS.

SI-2: The system shall persist data in PostgreSQL.

SI-3: The system shall use JWT-based authentication for protected API requests.

## Hardware Interfaces

No dedicated hardware interfaces are required for release 1.0.

## Communications Interfaces

CI-1: The system shall deliver in-app reminder notifications and collaboration notifications.

CI-2: Future releases may include email-based notification delivery.

# Quality Attributes

## Usability Requirements

USE-1: At least 70% of registered users should actively use the system weekly within 3 months of release.

USE-2: A new user should be able to create a first personal appointment within 2 minutes of first login.

USE-3: A team owner should be able to create a team and send the first invitation within 3 minutes of starting the workflow.

## Performance Requirements

PER-1: Core personal appointment operations shall respond within 2 seconds under normal load.

PER-2: Team appointment save operations and dedicated availability checks, including multi-user conflict checks, shall respond within 3 seconds under normal load.

PER-3: The statistics dashboard shall load within 5 seconds for up to one year of user data.

PER-4: The system should support at least 100 concurrent users without significant degradation.

## Security Requirements

SEC-1: User passwords shall be securely hashed before storage.

SEC-2: All network communication between client and server shall use TLS/SSL.

SEC-3: The system shall use JWT for authenticating API requests and shall enforce token expiration.

SEC-4: A user shall only be able to access records allowed by ownership, membership, or role-based access rules.

SEC-5: The system shall log authentication attempts and team appointment changes for security auditing.

## Safety Requirements

No safety requirements have been identified because the system does not control physical equipment.

## Availability Requirements

AVL-1: The system should strive for 99% uptime, excluding planned maintenance windows.

AVL-2: Team calendar access shall remain available to active members whenever the service is operational.

## Robustness Requirements

ROB-1: If connectivity is lost during appointment or team appointment editing, the system should prevent silent data loss and preserve the user’s in-progress changes where feasible.

ROB-2: Database transaction failures shall roll back partial writes to prevent inconsistent scheduling data.

# Appendix A: Analysis Models

Analysis models, such as state-transition diagrams for appointment status and sequence diagrams for team appointment coordination, will be produced during design and implementation.
