Create AppointmentController with the following endpoints:

POST /appointments
GET /appointments?page=&limit=
GET /appointments/:id

Requirements:

- Use DTO validation
- Extract userId from request (assume auth guard)
- Return correct HTTP status codes:
  - 201: create success
  - 200: get success
  - 400, 401, 404, 409 for errors

Response format:

Create:
{ id: string }

List:
{
  items: AppointmentResponseDto[],
  page: number,
  limit: number,
  total: number
}

Use best practices.
Do not include explanation.
