# Skill: Module Structure & Coding Rules (NestJS)

## Purpose

Enforce clean architecture, module structure, and validation rules.

---

## 1. Module Structure (MANDATORY)

<module>/
├── <module>.controller.ts
├── <module>.service.ts
├── <module>.repository.ts
├── dto/
├── entities/ (optional)

Rules:

- MUST organize by feature
- MUST NOT organize by technical layers

---

## 2. Layer Responsibilities

Controller:

- Handle HTTP only
- Use DTO for validation
- NO business logic

Service:

- Business logic only
- MUST NOT access DB directly

Repository:

- Handle ALL DB queries
- Use Prisma only here

Flow:
Controller → Service → Repository → DB

---

## 3. DTO Validation (MANDATORY)

Use class-validator:

- @IsEmail()
- @IsString()
- @MinLength(6)
- @IsOptional()

Rules:

- Validate in DTO only
- NO manual validation in service

---

## 4. Anti-Patterns (FORBIDDEN)

- Direct DB access in Service
- Business logic in Controller
- Custom Prisma type casting
- Skipping DTO validation

---

## Summary

- Feature-based modules
- Clean layering enforced
- Repository pattern required
- Prisma only in Repository
- DTO validation mandatory
