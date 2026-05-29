# Prisma Guidelines (PSMS)

## 1. General Principles

- Prisma is NOT the source of truth → PostgreSQL is
- Critical constraints MUST be enforced at DB level (not only application)
- Keep alignment with DDD aggregates
- Avoid anemic models caused by ORM-driven design

---

## 2. Naming Conventions

- Model: PascalCase (User, Appointment)
- Field: camelCase (startsAt, userId)
- Enum: PascalCase
- Enum values: UPPER_CASE

---

## 3. ID Strategy

- Use UUID for all primary keys
- Example:
  id String @id @default(uuid())

---

## 4. Timestamps

- createdAt → @default(now())
- updatedAt → @updatedAt
- deletedAt → optional (soft delete)

---

## 5. Enums (MANDATORY)

- Do NOT use string for status/type fields
- Always use Prisma enum

Example:
enum AppointmentStatus {
SCHEDULED
COMPLETED
CANCELLED
MISSED
}

---

## 6. Relations

- Always define explicit relations
- Avoid implicit many-to-many if additional fields are needed

Example:
model AppointmentTag {
appointmentId String
tagId String

appointment Appointment @relation(fields: [appointmentId], references: [id])
tag Tag @relation(fields: [tagId], references: [id])

@@id([appointmentId, tagId])
}

---

## 7. Index Strategy

- Always index based on query patterns

Common:
@@index([userId, startsAt])
@@index([userId, status, startsAt])

---

## 8. Prisma Limitations (CRITICAL)

### 8.1 Exclusion Constraint

- Prisma does NOT support it
- Must use raw SQL

### 8.2 Partial Index

- Prisma does NOT support `WHERE` condition
- Use raw SQL migration

### 8.3 Full-text Search

- Prisma does NOT manage GIN index
- Must create manually

### 8.4 Range Types (tstzrange)

- Not supported
- Use `startsAt` and `endsAt`

---

## 9. Raw SQL Policy

Use raw SQL for:

- Exclusion constraint (prevent overlap)
- Partial unique index (soft delete cases)
- Full-text search index
- Complex CHECK constraints

---

## 10. Soft Delete Strategy

- Use `deletedAt`
- Always filter `deletedAt IS NULL` in queries
- Unique constraints must consider soft delete

---

## 11. Performance Notes

- Avoid N+1 queries → use `include` / `select`
- Use pagination with cursor, not offset
- Avoid heavy joins in hot paths

---

## 12. Anti-patterns

❌ Using string instead of enum  
❌ Relying only on service-level validation  
❌ Ignoring DB constraints  
❌ Overusing optional fields  
❌ Letting Prisma shape domain model

---

## 13. NestJS Integration Notes

- Use PrismaService (singleton)
- Handle DB errors explicitly

Example:

- unique violation
- constraint violation

---

## 14. Migration Strategy

- Prisma migration for base schema
- Raw SQL migration for advanced constraints
- Never mix both blindly
