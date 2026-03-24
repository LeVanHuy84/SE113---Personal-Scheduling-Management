# Software Requirements Specification

for
Personal Scheduling Management System, Release 1.0

Version 1.0 approved

Prepared by Team 6

Process Impact

March 2026

## Table of Contents

- [Revision History](#revision-history)
- [1. Introduction](#1-introduction)
  - [1.1 Purpose](#11-purpose)
  - [1.2 Document Conventions](#12-document-conventions)
  - [1.3 Project Scope and Product Features](#13-project-scope-and-product-features)
  - [1.4 References](#14-references)
- [2. Overall Description](#2-overall-description)
  - [2.1 Product Perspective](#21-product-perspective)
  - [2.2 User Classes and Characteristics](#22-user-classes-and-characteristics)
  - [2.3 Operating Environment](#23-operating-environment)
  - [2.4 Design and Implementation Constraints](#24-design-and-implementation-constraints)
  - [2.5 Assumptions and Dependencies](#25-assumptions-and-dependencies)
- [3. System Features](#3-system-features)
  - [3.1 User Account Management](#31-user-account-management)
  - [3.2 Appointment Management](#32-appointment-management)
  - [3.3 Calendar and Views](#33-calendar-and-views)
  - [3.4 Reminders and Notifications](#34-reminders-and-notifications)
  - [3.5 Productivity Statistics](#35-productivity-statistics)
- [4. Data Requirements](#4-data-requirements)
  - [4.1 Logical Data Model](#41-logical-data-model)
  - [4.2 Data Dictionary](#42-data-dictionary)
  - [4.3 Reports](#43-reports)
  - [4.4 Data Integrity, Retention, and Disposal](#44-data-integrity-retention-and-disposal)
- [5. External Interface Requirements](#5-external-interface-requirements)
  - [5.1 User Interfaces](#51-user-interfaces)
  - [5.2 Software Interfaces](#52-software-interfaces)
  - [5.3 Hardware Interfaces](#53-hardware-interfaces)
  - [5.4 Communications Interfaces](#54-communications-interfaces)
- [6. Quality Attributes](#6-quality-attributes)
  - [6.1 Usability Requirements](#61-usability-requirements)
  - [6.2 Performance Requirements](#62-performance-requirements)
  - [6.3 Security Requirements](#63-security-requirements)
  - [6.4 Safety Requirements](#64-safety-requirements)
  - [6.5 Availability Requirements](#65-availability-requirements)
  - [6.6 Robustness Requirements](#66-robustness-requirements)
- [Appendix A: Analysis Models](#appendix-a-analysis-models)

## Revision History

| Name       | Date     | Reason For Changes                                  | Version      |
| :--------- | :------- | :-------------------------------------------------- | :----------- |
| Lê Văn Huy | 09/03/26 | initial draft based on Vision, Rules, and Use Cases | 1.0 draft 1  |
| Lê Văn Huy | 09/03/26 | baseline following changes after inspection         | 1.0 approved |

## 1. Introduction

### 1.1 Purpose

This SRS describes the functional and nonfunctional requirements for software release 1.0 of the **Personal Scheduling Management System (PSMS)**. This document is intended to be used by the members of the project team who will implement and verify the correct functioning of the system. Unless otherwise noted, all requirements specified here are committed for release 1.0.

### 1.2 Document Conventions

No special typographical conventions are used in this SRS.

### 1.3 Project Scope and Product Features

The PSMS will permit users to create, manage, and analyze appointments and personal schedules efficiently. It helps users manage appointments and tasks, detects and prevents time conflicts, improves personal productivity, provides statistical insights into time usage, and offers automated reminders.

A detailed description is available in the _Personal Scheduling Management System Vision and Scope Document_ [1], along with the features that are scheduled for full or partial implementation in this release.

The major features are:

- User Registration and Authentication (JWT-based).
- Create, edit, delete, and view appointments.
- Support recurring appointments (daily, weekly, monthly).
- Automatic time conflict detection.
- Day, Week, Month, and Agenda calendar views.
- Reminder and notification system.
- Productivity statistics and reports.
- Export appointment data.
- Responsive and user-friendly Web UI.

### 1.4 References

1.  Team 6. _Personal Scheduling Management System Vision and Scope Document_, Version 1.0.
2.  Team 6. _Business Rules for Personal Scheduling Management System_, Version 1.0.
3.  Team 6. _Use Cases for Personal Scheduling Management System_, Version 1.0.

## 2. Overall Description

### 2.1 Product Perspective

The Personal Scheduling Management System is a new web-based application that provides a centralized, intelligent scheduling system to help users efficiently manage their time and appointments. It replaces manual notes or fragmented applications that lack synchronization, conflict detection, and productivity tracking features. The system is built with ReactJS for the frontend and NestJS for the backend.

The system is expected to evolve, with future releases potentially including integration with external calendar systems (e.g., Google Calendar) and support for enterprise-level collaboration.

### 2.2 User Classes and Characteristics

| User Class               | Characteristics                                                                                                                                                                                                                                                                                                     |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **End User**             | An End User is any individual (student, employee, freelancer) who needs to manage personal appointments and tasks. They require a simple, reliable interface to organize their schedule, prevent conflicts, and track their productivity. Users are expected to have basic web literacy and stable internet access. |
| **Scheduler Service**    | An automated background service that is responsible for triggering time-based events, primarily sending reminder notifications for upcoming appointments. It operates without direct user interaction.                                                                                                              |
| **System Administrator** | A technical user responsible for deploying, monitoring, and maintaining the system. They ensure the application is stable, secure, and performing optimally. Their focus is on server health, database management, and minimal downtime.                                                                            |

### 2.3 Operating Environment

OE-1: The PSMS shall operate correctly with modern web browsers, including the latest versions of Google Chrome, Mozilla Firefox, Microsoft Edge, and Apple Safari.
OE-2: The backend shall be deployed in a Docker container.
OE-3: The frontend will be a single-page application built with ReactJS.
OE-4: The backend API will be built with NestJS.
OE-5: The database will be PostgreSQL.

### 2.4 Design and Implementation Constraints

CO-1: User sessions must be authenticated using JSON Web Tokens (JWT).
CO-2: All sensitive data, including user passwords, must be encrypted before storage and during transmission.
CO-3: The system must be designed with a responsive UI to support various screen sizes, from desktops to mobile devices.
CO-4: The system response time for core appointment operations must be under 2 seconds under normal load conditions.

### 2.5 Assumptions and Dependencies

AS-1: Users have stable Internet access to use the web application.
AS-2: The backend RESTful API built with NestJS will support a scalable architecture.
AS-3: The PostgreSQL database will handle concurrent scheduling operations efficiently.
AS-4: The JWT authentication mechanism will securely manage user sessions.
DE-1: The system depends on a reliable server hosting and deployment environment.

## 3. System Features

### 3.1 User Account Management

**Description:**
Users can create and manage a personal account to access the system. This includes registration, login, logout, and password management. Priority = High.

**Functional Requirements:**

|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Account.Register: User Registration**<br><br>.Form: The system shall display a registration form for the user to enter their name, email, and password. (UC-1)<br><br>.Validation: The system shall validate that the provided email is unique and not already registered in the system. (UC-1, BR-1)<br><br>.Create: Upon successful validation, the system shall create a new user account. (UC-1)<br><br>.Encrypt: The system shall encrypt the user's password before storing it in the database. (UC-1, BR-32) |
| **Account.Login: User Authentication**<br><br>.Credentials: The system shall allow a registered user to log in using their email and password. (UC-2)<br><br>.Authenticate: The system shall verify the user's credentials against the stored records. (UC-2, BR-2)<br><br>.Token: Upon successful authentication, the system shall generate a JWT access token to manage the user session. (UC-2, BR-3)<br><br>.Audit: The system shall log the authentication attempt for security auditing. (UC-2, BR-33)          |
| **Account.Logout: User Logout**<br><br>.Terminate: The system shall allow a logged-in user to log out. (UC-3)<br><br>.Invalidate: Upon logout, the system shall invalidate the user's session token. (UC-3, BR-4)                                                                                                                                                                                                                                                                                                     |
| **Account.Reset: Password Reset**<br><br>.Request: The system shall allow a user who has forgotten their password to request a reset link by providing their registered email address. (UC-4)<br><br>.SendLink: The system shall send a password reset link to the user's email. (UC-4)<br><br>.Update: The system shall allow the user to set a new password via the reset link, which will be encrypted and updated in the database. (UC-4, BR-32)                                                                  |
| **Account.Profile: Manage Profile**<br><br>.View: The system shall allow a logged-in user to view their profile information. (UC-5)<br><br>.Update: The system shall allow the user to update their non-critical profile information, such as their name and avatar. (UC-5)                                                                                                                                                                                                                                           |

### 3.2 Appointment Management

**Description:**
A logged-in user can create, view, update, and delete their personal appointments. The system will prevent scheduling conflicts. Priority = High.

**Functional Requirements:**

|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Appt.Create: Create a new appointment**<br><br>.Form: The system shall provide a form for the user to enter appointment details, including title, start time, end time, description, and tags. (UC-6)<br><br>.TimeValidation: The system shall validate that the start time is before the end time and that the appointment is not in the past. (UC-6, BR-6, BR-7)<br><br>.ConflictCheck: The system shall automatically check for and prevent the creation of an appointment that overlaps with an existing appointment for that user. (UC-6, BR-8)<br><br>.Save: Upon successful validation, the system shall save the new appointment. (UC-6) |
| **Appt.Update: Update an existing appointment**<br><br>.Edit: The system shall allow a user to modify the details of an appointment they created. (UC-7, BR-5)<br><br>.Recurring: If the appointment is part of a recurring series, the system shall prompt the user to update either the single instance or the entire series. (UC-7, BR-12)                                                                                                                                                                                                                                                                                                      |
| **Appt.Delete: Delete an appointment**<br><br>.Remove: The system shall allow a user to delete an appointment they created. (UC-8, BR-5)<br><br>.Recurring: If deleting an appointment from a recurring series, the system shall prompt the user to delete the single instance or the entire series. (UC-8, BR-12)                                                                                                                                                                                                                                                                                                                                 |
| **Appt.Recurrence: Manage recurring appointments**<br><br>.Pattern: The system shall allow a user to define a recurrence pattern (daily, weekly, monthly) when creating or editing an appointment. (UC-11, BR-9)<br><br>.Generate: The system shall generate and save all instances of the recurring appointment based on the defined pattern. (UC-11, BR-10)                                                                                                                                                                                                                                                                                      |

| **Appt.Status: Manage appointment status**<br><br>
.Complete: The system shall allow a user to mark an appointment's status as "COMPLETED". (UC-12, BR-14)<br><br>
.Cancel: The system shall allow a user to cancel an appointment, changing its status to "CANCELLED". (UC-12)<br><br>
.Reopen: The system shall allow a user to change a "COMPLETED" appointment back to "SCHEDULED" if needed. (UC-12)<br><br>
.AutoMissed: The system shall automatically update an appointment's status to "MISSED" if the current time is past the appointment's end time and the status is still "SCHEDULED". (UC-20, BR-XX) |
| **Appt.Organize: Search, Filter, and Tag**<br><br>.Search: The system shall allow a user to search for appointments by keywords in the title or description. (UC-13, BR-27)<br><br>.Filter: The system shall allow filtering of appointments by date range, tag, and status. (UC-13, BR-27)<br><br>.Tags: The system shall allow users to create, assign, and manage tags for organizing their appointments. (UC-14, BR-19) |
| **Appt.Export: Export appointment data**<br><br>.Generate: The system shall allow a user to export their appointment data to a CSV file. (UC-19)<br><br>.Format: The exported file format must be CSV. (BR-29)<br><br>.Filter: The exported data must reflect any currently applied filters. (BR-28) |

### 3.3 Calendar and Views

**Description:**
The user can view their appointments in various calendar formats. Priority = High.

**Functional Requirements:**

|                                                                                                                                                                                                                               |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **View.Calendar: Display calendar views**<br><br>.Display: The system shall display a user's appointments on a calendar interface. (UC-9)<br><br>.Modes: The calendar shall support Day, Week, and Month views. (UC-9, BR-13) |
| **View.Agenda: Display agenda list**<br><br>.List: The system shall provide an Agenda view that lists upcoming appointments in chronological order. (UC-10, BR-13)                                                            |

### 3.4 Reminders and Notifications

**Description:**
The system sends automated reminders to users for their upcoming appointments. Priority = High.

**Functional Requirements:**

|                                                                                                                                                                                                                                                                                                                   |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reminder.Set: Set an appointment reminder**<br><br>.Add: The system shall allow a user to set one or more reminders for an appointment. (UC-15, BR-22)<br><br>.Time: The reminder time must be configured to occur before the appointment's start time. (UC-15, BR-21)                                          |
| **Reminder.Trigger: Automated reminder triggering**<br><br>.Automate: The Scheduler Service shall automatically trigger a notification at the scheduled reminder time. (UC-20, BR-23)<br><br>.Log: The system shall log the triggered notification in the user's notification history. (UC-17, BR-25)             |
| **Reminder.Action: User actions on reminders**<br><br>.Snooze: The system shall allow a user to "snooze" a received reminder notification, which will re-trigger it after a configured interval. (UC-16, BR-24)<br><br>.History: The system shall allow a user to view their notification history. (UC-17, BR-26) |

### 3.5 Productivity Statistics

**Description:**
Users can view analytics about their scheduled activities to gain insights into their time management. Priority = Medium.

**Functional Requirements:**

|                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stats.View: View statistics dashboard**<br><br>.Access: The system shall provide a statistics dashboard accessible only to authenticated users. (UC-18, BR-34)<br><br>.Calculate: The system shall calculate statistics based on appointments within a user-selected time frame. (UC-18, BR-15, BR-16)<br><br>.Metrics: The dashboard shall display metrics including the appointment completion rate and the most productive time slots. (UC-18, BR-17, BR-18) |

## 4. Data Requirements

### 4.1 Logical Data Model

A logical data model will be developed to represent the relationships between key data entities, including Users, Appointments, Tags, and Reminders. An `Appointment` will have a many-to-one relationship with a `User`. `Appointments` and `Tags` will have a many-to-many relationship.

### 4.2 Data Dictionary

| Data Element    | Description                                             | Data Type    | Constraints                             |
| :-------------- | :------------------------------------------------------ | :----------- | :-------------------------------------- |
| User ID         | Unique identifier for a user account.                   | UUID         | Primary Key                             |
| Email           | User's unique email address for login.                  | Varchar(255) | Unique, Not Null                        |
| Password        | Hashed password for the user account.                   | Varchar(255) | Not Null                                |
| Name            | Display name of the user.                               | Varchar(100) |                                         |
| Appointment ID  | Unique identifier for an appointment.                   | UUID         | Primary Key                             |
| Title           | The title or name of the appointment.                   | Varchar(255) | Not Null                                |
| Start Time      | The date and time the appointment begins.               | Timestamp    | Not Null                                |
| End Time        | The date and time the appointment ends.                 | Timestamp    | Must be after Start Time                |
| Status          | The current status of the appointment.                  | Enum         | SCHEDULED, COMPLETED, CANCELLED, MISSED |
| Recurrence Rule | A string defining the recurrence pattern (e.g., RRULE). | Varchar(255) |                                         |
| Tag ID          | Unique identifier for a tag.                            | UUID         | Primary Key                             |
| Tag Name        | The name of the tag (e.g., "Work", "Personal").         | Varchar(50)  | Unique per user                         |
| Reminder ID     | Unique identifier for a reminder.                       | UUID         | Primary Key                             |
| Reminder Time   | The date and time the reminder should be triggered.     | Timestamp    | Must be before appointment start time   |

### 4.3 Reports

The primary report in this system is the data export functionality.

**Exported Appointment Data**

- **Report ID:** PSMS-RPT-1
- **Report Title:** Appointment Data Export
- **Purpose:** Allows a user to export their appointment data for backup or use in other applications.
- **Users:** End User
- **Data Sources:** User's appointment records.
- **Format:** CSV
- **Selection Criteria:** The export will reflect any active filters applied by the user (date range, tag, status).
- **Data Fields:** Title, Start Time, End Time, Status, Tags, Description.

### 4.4 Data Integrity, Retention, and Disposal

DI-1: A user can only view and manage appointments that they created. (BR-5)
DI-2: When a user account is deleted, all associated data, including appointments, tags, and reminders, must be permanently removed.
DI-3: The system does not have a specific data retention policy beyond the life of the user's account. Data is retained as long as the account is active.

## 5. External Interface Requirements

### 5.1 User Interfaces

UI-1: The system shall provide a responsive and user-friendly web interface that is intuitive for non-technical users. (FE-9)
UI-2: The system shall provide clear feedback to the user after any action, such as creating or updating an appointment.
UI-3: The user interface shall be designed to be accessible, allowing for navigation and interaction via keyboard in addition to a mouse.

### 5.2 Software Interfaces

SI-1: The frontend (ReactJS) shall communicate with the backend (NestJS) via a RESTful API over HTTPS.
SI-2: The system does not have any external software interfaces in the initial release.

### 5.3 Hardware Interfaces

No hardware interfaces have been identified.

### 5.4 Communications Interfaces

CI-1: The system shall provide in-app notifications for appointment reminders.
CI-2: Future releases may include email notification integration for reminders and other system alerts.

## 6. Quality Attributes

### 6.1 Usability Requirements

USE-1: At least 70% of registered users should actively use the system on a weekly basis within 3 months of release. (SM-1)
USE-2: A new user should be able to create their first appointment within 2 minutes of their first login.

### 6.2 Performance Requirements

PER-1: The average system response time for creating, updating, or deleting an appointment shall be under 2 seconds under normal load. (SM-3)
PER-2: The statistics dashboard shall load within 5 seconds for a user with up to one year of appointment data.
PER-3: The system should support at least 100 concurrent users with no significant degradation in performance.

### 6.3 Security Requirements

SEC-1: All user passwords must be securely hashed before being stored in the database. (BR-32)
SEC-2: All network communication between the client and server must be encrypted using TLS/SSL. (BR-31)
SEC-3: The system shall use JWT for authenticating API requests, and tokens must have a defined expiration time. (BR-3, BR-4)
SEC-4: A user must only be able to access and manipulate their own data. (BR-5)
SEC-5: The system shall log all authentication attempts for security auditing purposes. (BR-33)

### 6.4 Safety Requirements

No safety requirements have been identified as the system does not control any physical hardware or pose a risk to human life.

### 6.5 Availability Requirements

AVL-1: The system is intended for individual use and does not have a strict availability requirement, but it should strive for 99% uptime, excluding planned maintenance.

### 6.6 Robustness Requirements

ROB-1: If the user loses internet connectivity while creating or editing an appointment, the system should attempt to save the draft locally and allow the user to resume when connectivity is restored.
ROB-2: In case of an error during a database transaction (e.g., creating a recurring appointment series), the transaction should be rolled back to prevent partial data from being saved.

## Appendix A: Analysis Models

Analysis models, such as state-transition diagrams for appointment status or sequence diagrams for key interactions, will be created during the design phase to further clarify the system's behavior.
