# Skill: Module Structure & Coding Rules (NestJS)

## Purpose

Enforce clean architecture, strict layering, and consistent coding standards across all modules.

---

## 1. Module Structure (MANDATORY)

```
<module>/
├── <module>.controller.ts
├── <module>.service.ts
├── <module>.repository.ts
├── dto/
├── entities/ (optional)
```

---

## Rules

- MUST organize by feature
- MUST NOT organize by technical layer
- Each module is self-contained

---

## 2. Layer Responsibilities

### Controller

- Handle HTTP requests/responses only
- Extract data from request
- Use DTOs for validation
- Pass only primitive values to service

MUST NOT:

- Contain business logic
- Access database
- Use Prisma directly

---

### Service

- Contain all business logic
- Coordinate between layers

Rules:

- MUST NOT access database directly
- MUST use repository layer
- MUST NOT depend on framework objects

Forbidden:

```
req.user
JwtPayload
Request
```

Allowed:

```
userId: string
```

---

### Repository

- Handle ALL database operations
- Use Prisma ORM only here

Rules:

- MUST NOT contain business logic
- MUST NOT depend on HTTP or DTO

---

### Flow

```
Controller → Service → Repository → Database
```

---

## 3. DTO Validation (MANDATORY)

Use class-validator + class-transformer

Example:

```
export class ExampleDto {
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString()
  @Length(1, 100)
  name?: string;
}
```

---

## Rules

- Validate in DTO only
- Do NOT validate manually in service
- Always sanitize input

---

## 4. Current User Handling

```
@CurrentUser() user: { userId: string }
```

Rules:

- MUST use user.userId
- MUST NOT pass JWT payload to service
- MUST NOT decode JWT manually

---

## 5. Error Handling

Use NestJS exceptions:

- BadRequestException
- UnauthorizedException
- NotFoundException

---

### Prisma Exception Mapping

- P2025 → 404 Not Found
- Other errors → 500 Internal Server Error

---

## 6. Anti-Patterns (FORBIDDEN)

Direct DB access in Service:

```
this.prisma.user.findUnique()
```

Business logic in Controller:

```
if (...) { ... }
```

Passing Request into Service:

```
service.method(req)
```

Skipping DTO validation:

```
if (!dto.name)
```

---

## 7. Best Practices

- Keep functions small
- Use explicit types
- Keep naming consistent (userId)
- Prefer early returns
- Avoid side effects

---

## Summary

- Feature-based modules
- Strict separation of concerns
- Repository pattern enforced
- DTO validation mandatory
- JWT handled at controller boundary
