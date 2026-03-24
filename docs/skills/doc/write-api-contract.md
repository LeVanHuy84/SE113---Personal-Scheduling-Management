# API Contract Writing Skill

## 1. Purpose

This document defines how an AI agent should generate API contracts from existing system documentation.

The goal is to ensure:

- Consistent API design
- Alignment with business rules
- Clean mapping between domain, database, and application layer
- Ready-to-implement contracts for NestJS backend

---

## 2. Input Sources

The agent MUST use the following sources (in priority order):

1. `docs/business-rules/`
2. `docs/use-cases/`
3. `docs/srs/SRS.md`
4. `docs/database/database-design.md`
5. `docs/domain/domain-model.md`
6. `docs/diagrams/sequence/`

### Rules

- Business rules override everything
- Use-cases define API behavior
- Database defines field types (NOT behavior)
- Domain defines structure and naming consistency
- Sequence diagrams clarify flow when ambiguous

---

## 3. Output Location

Generated API contracts MUST be stored at:

```
docs/api-contract/
```

### File Naming Convention

Each feature should have its own file:

```
docs/api-contract/appointment.api.md
docs/api-contract/reminder.api.md
docs/api-contract/recurring.api.md
```

---

## 4. API Design Principles

### 4.1 RESTful Convention

- Use nouns, not verbs
- Use plural resources

Examples:

- `POST /appointments`
- `GET /appointments`
- `GET /appointments/:id`
- `PATCH /appointments/:id`
- `DELETE /appointments/:id`

---

### 4.2 Layer Responsibility

| Layer      | Responsibility     |
| ---------- | ------------------ |
| Controller | HTTP mapping       |
| DTO        | Validation + shape |
| Service    | Business logic     |
| Entity     | Domain model       |

---

## 5. API Contract Structure

Each endpoint MUST include the following sections:

### 5.1 Endpoint

- Method
- URL
- Description

### 5.2 Request DTO

- Field name
- Type
- Required/Optional
- Validation rules

### 5.3 Response DTO

- Field name
- Type
- Description

### 5.4 Business Rules Mapping

- Link to business rules
- Explain how rules are enforced

### 5.5 Error Cases

- Validation errors
- Business errors
- Authorization errors

---

## 6. Naming Conventions

### DTO Naming

- Request:
  - `CreateXRequestDto`
  - `UpdateXRequestDto`

- Response:
  - `XResponseDto`

### Example

- `CreateAppointmentRequestDto`
- `AppointmentResponseDto`

---

## 7. Field Mapping Rules

| Source         | Mapping         |
| -------------- | --------------- |
| Database       | Data type       |
| Business rules | Validation      |
| Domain         | Naming          |
| Use-case       | Required fields |

---

## 8. Validation Rules

The agent MUST include validation based on business rules:

Examples:

- Required fields
- Enum constraints
- Time constraints (start < end)
- Length limits

---

## 9. Example API Contract

### Create Appointment

#### Endpoint

```
POST /appointments
```

#### Request DTO

```ts
export class CreateAppointmentRequestDto {
  title: string; // required
  description?: string;
  startTime: Date; // must be < endTime
  endTime: Date;
}
```

#### Response DTO

```ts
export class AppointmentResponseDto {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
}
```

#### Business Rules Mapping

- Title is required
- startTime must be before endTime
- Default status = SCHEDULED

#### Error Cases

- 400: Invalid input
- 401: Unauthorized
- 404: Not found

---

## 10. NestJS Implementation Reference

### Controller Example

```ts
@Post()
create(
  @Body() dto: CreateAppointmentRequestDto,
): Promise<AppointmentResponseDto> {
  return this.appointmentService.create(dto);
}
```

---

## 11. Constraints

The agent MUST NOT:

- Invent business rules
- Expose database internal fields (e.g. internal flags)
- Skip validation rules
- Mix multiple use-cases into one endpoint

---

## 12. Best Practices

- Keep DTOs minimal
- Avoid over-fetching data
- Keep naming consistent across modules
- Ensure backward compatibility if updating API

---

## 13. Output Quality Checklist

Before finishing, ensure:

- All endpoints map to a use-case
- All fields map to database or domain
- All validations map to business rules
- Naming is consistent
- No missing error cases

---

## 14. Future Extensions

The agent can be extended to generate:

- Swagger decorators
- OpenAPI YAML
- Controller + Service skeleton

---

## 15. Summary

This skill ensures that API contracts:

- Reflect business logic
- Are consistent and scalable
- Can be directly implemented in NestJS

It acts as the bridge between documentation and backend implementation.
