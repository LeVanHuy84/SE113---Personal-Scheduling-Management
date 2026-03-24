# Business Rules for Personal Scheduling Management System (partial)

|     |     |     |     |     |
| --- | --- | --- | --- | --- |
| **ID** | **Rule Definition** | **Type of Rule** | **Static or Dynamic** | **Source** |
| BR-1 | Each user must register an account with a unique email address. | Constraint | Static | System Policy |
| BR-2 | A registered user must authenticate using valid credentials to access the system. | Constraint | Dynamic | Security Policy |
| BR-3 | User sessions must be authenticated using JWT tokens. | Constraint | Static | Security Architecture |
| BR-4 | JWT tokens must expire after a configured time period. | Constraint | Dynamic | Security Policy |
| BR-5 | A user can only view and manage appointments that they created. | Constraint | Static | Access Control Policy |
| BR-6 | Appointment start time must be earlier than appointment end time. | Constraint | Dynamic | Scheduling Policy |
| BR-7 | Appointments cannot be created in the past. | Constraint | Dynamic | Scheduling Policy |
| BR-8 | The system must automatically prevent overlapping appointments for the same user. | Constraint | Dynamic | Scheduling Policy |
| BR-9 | Recurring appointments must follow a valid recurrence pattern (daily, weekly, monthly). | Constraint | Dynamic | Scheduling Policy |
| BR-10 | If an appointment is recurring, all generated instances must inherit the base appointment properties. | Fact | Dynamic | System Design |
| BR-11 | Users can create, edit, or delete their appointments. | Fact | Dynamic | Functional Requirement |
| BR-12 | Deleting a recurring appointment allows deleting a single instance or the entire series. | Constraint | Dynamic | Scheduling Policy |
| BR-13 | Calendar must support Day, Week, Month, and Agenda views. | Fact | Static | Product Scope |
| BR-14 | Appointment status can be marked as Completed or Pending. | Fact | Dynamic | Functional Requirement |
| BR-15 | Productivity statistics are calculated from completed and scheduled appointments. | Computation | Dynamic | Analytics Requirement |
| BR-16 | Monthly statistics are calculated based on appointments within the selected month. | Computation | Dynamic | Analytics Requirement |
| BR-17 | Completion rate is calculated as: completed appointments ÷ total appointments. | Computation | Dynamic | Analytics Requirement |
| BR-18 | Most productive time slot is determined by the highest frequency of completed appointments within a time range. | Computation | Dynamic | Analytics Requirement |
| BR-19 | Users may assign tags or categories to appointments. | Fact | Dynamic | Functional Requirement |
| BR-20 | An appointment can belong to multiple tags. | Fact | Static | Data Model |
| BR-21 | Reminder time must be earlier than appointment start time. | Constraint | Dynamic | Reminder Policy |
| BR-22 | Users can configure multiple reminders for one appointment. | Fact | Dynamic | Functional Requirement |
| BR-23 | Reminder notifications must be triggered automatically by the scheduler service. | Constraint | Dynamic | System Design |
| BR-24 | Snoozed reminders must re-trigger after the configured snooze duration. | Constraint | Dynamic | Reminder Policy |
| BR-25 | In-app notifications must be stored in the notification log. | Constraint | Dynamic | Notification Policy |
| BR-26 | Users can view notification history. | Fact | Dynamic | Functional Requirement |
| BR-27 | Appointment search must support filtering by date range, tag, and status. | Constraint | Dynamic | Functional Requirement |
| BR-28 | Exported appointment data must reflect the selected filter conditions. | Constraint | Dynamic | Reporting Policy |
| BR-29 | Appointment data export format must be CSV in the initial release. | Constraint | Static | Product Scope |
| BR-30 | System response time for appointment operations must be under 2 seconds under normal load. | Constraint | Dynamic | Performance Requirement |
| BR-31 | All sensitive data transmissions must be encrypted. | Constraint | Static | Security Policy |
| BR-32 | User passwords must be encrypted before storage. | Constraint | Static | Security Policy |
| BR-33 | The system must log authentication attempts for security auditing. | Constraint | Dynamic | Security Policy |
| BR-34 | Only authenticated users can access statistics dashboards. | Constraint | Static | Access Control Policy |
| BR-35 | The system must support responsive UI for different screen sizes. | Constraint | Static | UI/UX Standard |
| BR-36 | System functions must pass defined test cases before release. | Constraint | Static | Quality Assurance Policy |