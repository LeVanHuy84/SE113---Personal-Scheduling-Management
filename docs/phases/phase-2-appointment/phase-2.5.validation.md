Implement conflict detection logic for appointments.

Condition:
(startA < endB) AND (endA > startB)

Requirements:

- Check only same user appointments
- Ignore deletedAt != null
- Exclude current appointment when updating (optional)

Use Prisma query.

Return:

- true if conflict exists
- false otherwise

Optimize query with indexes.

Do not include explanation.

Improve validation for Appointment:

- Custom validator:
  - startTime must be before endTime
  - startTime must not be in the past

- Convert ISO string to Date safely

- Handle timezone issues

Use:

- class-validator custom decorators
- class-transformer

Ensure production-ready validation.
