# Skill: Setup Testing Infrastructure

## Goal

Setup a consistent and isolated testing environment for PSMS.

---

## Scope

- Unit testing (Jest)
- E2E testing (NestJS default)
- Test database configuration

---

## Steps

### 1. Configure Jest

- Use default NestJS Jest setup
- Ensure commands work:
  - npm run test
  - npm run test:e2e
  - npm run test:cov

---

### 2. Setup test structure

- Unit test:
  - Use `*.spec.ts` colocated with source files

- E2E test:
  - Move to `/test/e2e`
  - Keep `jest-e2e.json`

---

### 3. Setup test database

- Use separate database via env:

DATABASE_URL=...
DATABASE_TEST_URL=...

- E2E must use TEST DB
- MUST NOT use production DB

---

### 4. Setup E2E app

- Use `Test.createTestingModule`
- Bootstrap app before running tests
- Use real modules (NOT mocks)

---

### 5. Mock dependencies (Unit test)

- Mock repositories/services
- Do NOT access DB in unit tests

---

## Rules

- Unit test MUST NOT access real DB
- E2E test MUST use test DB
- Tests MUST be isolated and repeatable
- Do NOT mix unit and E2E logic
- Do NOT depend on external services (Redis optional mock)

---

## Done Criteria

- npm run test works
- npm run test:e2e works
- npm run test:cov works
- Tests do not affect main DB
- At least 1 sample unit test + 1 e2e test pass

---

## Common Mistakes

❌ Use real DB in unit test  
❌ Forget test DB → phá data thật  
❌ Không reset state giữa test  
❌ Mock sai level (mock cả system)  
❌ Không có test coverage
