# Phase 0 – Foundation

## Goal

Setup project infrastructure, core dependencies, and testing foundation

---

## Scope

### In scope

- NestJS project setup
- Prisma + PostgreSQL
- Redis + BullMQ
- Config module (env)
- Global Exception Filter
- Response Interceptor
- Testing setup (Jest + E2E + test DB)

---

## APIs

None

---

## Business Rules

- All responses follow standard format
- Error handling must be centralized
- Environment variables MUST be used (no hardcode)
- Test environment MUST be isolated from development

---

## Done Criteria

- App runs successfully
- DB connected
- Redis connected
- ConfigModule works with env
- Global response format works
- Global error handling works
- npm run test passes
- npm run test:e2e passes
- Test DB works independently
- Base module structure ready
