Create DTOs for Appointment module based on the following API contract.

Entities:
Appointment {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  isAllDay?: boolean
}

Generate:

1. CreateAppointmentRequestDto

- title: required, 1-255 chars
- description: optional, max 5000
- startTime: ISO string
- endTime: ISO string
- isAllDay: optional boolean

Validation rules:

- startTime < endTime
- startTime must not be in the past

1. GetAppointmentsQueryDto

- page: default 1, >=1
- limit: default 10, max 100

1. Params DTO for id (UUID validation)

Use:

- class-validator
- class-transformer

Do not include explanation.
