Implement AppointmentService using Prisma.

Requirements:

Methods:

- create(userId, dto)
- findAll(userId, query)
- findOne(userId, id)
- update 
- delete
Business Rules:

BR-5: Appointment must belong to requesting user
BR-6: startTime < endTime
BR-7: Cannot create appointment in the past
BR-8: Prevent overlap

Overlap condition:
(startA < endB) AND (endA > startB)

Flow:

1. Validate time range
2. Validate not in past
3. Check conflict using Prisma query
4. Save appointment

Conflict query:

- Only check appointments of same user
- Ignore soft deleted records

Pagination:

- offset = (page - 1) * limit
- return items, page, limit, total

Error handling:

- 400: invalid input
- 409: overlap conflict
- 404: not found

Use clean and scalable code.
Do not include explanation.
