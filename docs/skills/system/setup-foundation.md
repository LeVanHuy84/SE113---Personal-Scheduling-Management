# Skill: Setup Foundation (Phase 0)

## Goal

Initialize project infrastructure for PSMS.

---

## Scope

- Prisma + PostgreSQL
- Redis + BullMQ
- ConfigModule
- Global Exception Filter
- Response Interceptor
- Base module structure

---

## Steps

### 1. Install dependencies

- @nestjs/config
- prisma
- @prisma/client
- ioredis
- bullmq
- @nestjs/bullmq

---

### 2. Setup ConfigModule

- Must be global
- Load from .env

---

### 3. Setup Prisma

- Create PrismaService
- Must be global module
- Connect DB on app start

---

### 4. Setup Redis + BullMQ

- Configure connection in QueueModule
- Do NOT hardcode values (use env)

---

### 5. Setup Global Exception Filter

- Catch all errors
- Return standard response:

{
success: false,
message: string,
data: null
}

---

### 6. Setup Response Interceptor

- Wrap all responses:

{
success: true,
message: "OK",
data: any
}

---

### 7. Register global providers

- app.useGlobalFilters()
- app.useGlobalInterceptors()

---

### 8. Create base folder structure

Must follow feature-based architecture:

src/
├── common/
├── prisma/
├── queue/
├── auth/
├── appointment/
├── reminder/
├── recurring/
├── notification/
├── statistics/

---

## Rules

- NO business logic
- NO feature implementation
- MUST follow architecture.md
- MUST use env variables
- MUST NOT duplicate services

---

## Done Criteria

- App runs
- DB connected
- Redis connected
- Global response format works
- Error handling works

---

## Common Mistakes

❌ Hardcode config  
❌ Not using global modules  
❌ Wrong folder structure  
❌ Missing interceptor/filter  
❌ Mixing business logic
