# Business Rules for Scheduling & Collaborative Team Management System

| **ID** | **Rule Definition**                                                                                             | **Type of Rule** | **Static or Dynamic** | **Source**               |
| ------ | --------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------- | ------------------------ |
| BR-1   | Each user must register an account with a unique email address.                                                 | Constraint       | Static                | System Policy            |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-2   | A registered user must authenticate using valid credentials to access the system.                               | Constraint       | Dynamic               | Security Policy          |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-3   | User sessions must be authenticated using JWT tokens.                                                           | Constraint       | Static                | Security Architecture    |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-4   | JWT tokens must expire after a configured time period.                                                          | Constraint       | Dynamic               | Security Policy          |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-5   | A user can only view and manage appointments that they created.                                                 | Constraint       | Static                | Access Control Policy    |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-6   | Appointment start time must be earlier than appointment end time.                                               | Constraint       | Dynamic               | Scheduling Policy        |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-7   | Appointments cannot be created in the past.                                                                     | Constraint       | Dynamic               | Scheduling Policy        |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-8   | The system must automatically prevent overlapping appointments for the same user.                               | Constraint       | Dynamic               | Scheduling Policy        |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-9   | Recurring appointments must follow a valid recurrence pattern (daily, weekly, monthly).                         | Constraint       | Dynamic               | Scheduling Policy        |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-10  | If an appointment is recurring, all generated instances must inherit the base appointment properties.           | Fact             | Dynamic               | System Design            |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-11  | Users can create, edit, or delete their appointments.                                                           | Fact             | Dynamic               | Functional Requirement   |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-12  | Deleting a recurring appointment allows deleting a single instance or the entire series.                        | Constraint       | Dynamic               | Scheduling Policy        |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-13  | Calendar must support Day, Week, Month, and Agenda views.                                                       | Fact             | Static                | Product Scope            |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-14  | Appointment status can be marked as Completed or Pending.                                                       | Fact             | Dynamic               | Functional Requirement   |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-15  | Productivity statistics are calculated from completed and scheduled appointments.                               | Computation      | Dynamic               | Analytics Requirement    |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-16  | Monthly statistics are calculated based on appointments within the selected month.                              | Computation      | Dynamic               | Analytics Requirement    |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-17  | Completion rate is calculated as: completed appointments ÷ total appointments.                                  | Computation      | Dynamic               | Analytics Requirement    |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-18  | Most productive time slot is determined by the highest frequency of completed appointments within a time range. | Computation      | Dynamic               | Analytics Requirement    |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-19  | Users may assign tags or categories to appointments.                                                            | Fact             | Dynamic               | Functional Requirement   |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-20  | An appointment can belong to multiple tags.                                                                     | Fact             | Static                | Data Model               |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-21  | Reminder time must be earlier than appointment start time.                                                      | Constraint       | Dynamic               | Reminder Policy          |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-22  | Users can configure multiple reminders for one appointment.                                                     | Fact             | Dynamic               | Functional Requirement   |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-23  | Reminder notifications must be triggered automatically by the scheduler service.                                | Constraint       | Dynamic               | System Design            |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-24  | Snoozed reminders must re-trigger after the configured snooze duration.                                         | Constraint       | Dynamic               | Reminder Policy          |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-25  | In-app notifications must be stored in the notification log.                                                    | Constraint       | Dynamic               | Notification Policy      |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-26  | Users can view notification history.                                                                            | Fact             | Dynamic               | Functional Requirement   |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-27  | Appointment search must support filtering by date range, tag, and status.                                       | Constraint       | Dynamic               | Functional Requirement   |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-28  | Exported appointment data must reflect the selected filter conditions.                                          | Constraint       | Dynamic               | Reporting Policy         |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-29  | Appointment data export format must be CSV in the initial release.                                              | Constraint       | Static                | Product Scope            |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-30  | System response time for appointment operations must be under 2 seconds under normal load.                      | Constraint       | Dynamic               | Performance Requirement  |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-31  | All sensitive data transmissions must be encrypted.                                                             | Constraint       | Static                | Security Policy          |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-32  | User passwords must be encrypted before storage.                                                                | Constraint       | Static                | Security Policy          |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-33  | The system must log authentication attempts for security auditing.                                              | Constraint       | Dynamic               | Security Policy          |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-34  | Only authenticated users can access statistics dashboards.                                                      | Constraint       | Static                | Access Control Policy    |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-35  | The system must support responsive UI for different screen sizes.                                               | Constraint       | Static                | UI/UX Standard           |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-36  | System functions must pass defined test cases before release.                                                   | Constraint       | Static                | Quality Assurance Policy |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-37  | Any authenticated user can create a team and is assigned the Team Owner role by default.                        | Fact             | Dynamic               | Team Management Policy   |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-38  | Team names must be unique within the same owner scope.                                                          | Constraint       | Static                | Data Governance Policy   |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-39  | A team must have at least one active Team Owner at all times.                                                   | Constraint       | Dynamic               | Team Management Policy   |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-40  | Team membership can only be added or removed by Team Owner or Team Admin.                                       | Constraint       | Dynamic               | Access Control Policy    |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-41  | A user can belong to multiple teams simultaneously.                                                             | Fact             | Static                | Collaboration Model      |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-42  | Team roles must follow role-based access control with at least: Team Owner, Team Admin, and Team Member.        | Constraint       | Static                | Access Control Policy    |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-43  | Only Team Owner can transfer ownership; ownership transfer must occur before an owner can leave the team.       | Constraint       | Dynamic               | Team Governance Policy   |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-44  | Removed members immediately lose access to team calendars and team appointments.                                | Constraint       | Dynamic               | Access Control Policy    |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-45  | A team appointment must be associated with exactly one team and one organizer.                                  | Constraint       | Static                | Data Model               |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-46  | Team appointments can be created by Team Owner, Team Admin, or designated organizer roles.                      | Constraint       | Dynamic               | Team Scheduling Policy   |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-47  | Team appointment updates are permitted only to Team Owner, Team Admin, or the appointment organizer.            | Constraint       | Dynamic               | Team Scheduling Policy   |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-48  | Team appointment deletion is permitted only to Team Owner, Team Admin, or the appointment organizer.            | Constraint       | Dynamic               | Team Scheduling Policy   |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-49  | Team members can view team appointments for teams where they are active members.                                | Fact             | Dynamic               | Collaboration Model      |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-50  | Deleting a recurring team appointment allows deleting a single instance or the entire series.                   | Constraint       | Dynamic               | Scheduling Policy        |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-51  | The system must detect and prevent time conflicts across all required participants before saving team events.   | Constraint       | Dynamic               | Collaborative Scheduling |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-52  | Team conflict checking must include both personal appointments and team appointments of required participants.  | Constraint       | Dynamic               | Collaborative Scheduling |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-53  | If a conflict is detected for required participants, the team appointment cannot be created or updated.         | Constraint       | Dynamic               | Collaborative Scheduling |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-54  | The system must provide suggested time slots based on common free time of required participants.                | Computation      | Dynamic               | Collaboration Model      |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-55  | Shared team calendars must display only appointments belonging to teams where the user is an active member.     | Constraint       | Dynamic               | Access Control Policy    |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
| BR-56  | Changes to team appointments (create, update, delete) must be logged for traceability and coordination audit.   | Constraint       | Dynamic               | Audit Policy             |
| ---    | ---                                                                                                             | ---              | ---                   | ---                      |
