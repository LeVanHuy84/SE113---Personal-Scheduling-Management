# PSMS - Personal Scheduling Management System

PSMS is a backend system for personal scheduling, reminders, and productivity tracking.

## What this project covers

- Authentication and account management (JWT, email verification, password recovery, refresh token)
- Personal appointments and recurring scheduling
- Reminders and notifications
- Tags, search, and statistics
- Team and team-appointment foundation (in progress)

## Tech Stack

- NestJS 11
- Prisma ORM
- PostgreSQL
- Redis (BullMQ queue)
- Jest (unit tests + e2e tests)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Create env files

```powershell
Copy-Item .env.example .env
Copy-Item .env.test.example .env.test
Copy-Item .env.test.example .env.test.local
```

### 3. Start PostgreSQL and Redis

```bash
docker compose up -d postgres redis
```

This starts:

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

### 4. Run Prisma migrations

```bash
npx prisma migrate dev
npx prisma generate
```

If you already used the old migration history before, reset once first:

```bash
npx prisma migrate reset
```

### 5. Start the app

```bash
npm run start:dev
```

App URL:

- `http://localhost:<PORT>/api/v1`

## Environment

The default env files already match the Docker setup:

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/psms_dev?schema=public`
- `DATABASE_TEST_URL=postgresql://postgres:postgres@localhost:5432/psms_test?schema=public`
- `REDIS_HOST=localhost`
- `REDIS_PORT=6379`

## Useful scripts

- `npm run start:dev`: run in watch mode
- `npm run build`: build for production
- `npm run start:prod`: run compiled build
- `npm run lint`: lint and auto-fix
- `npm run test`: unit tests
- `npm run test:cov`: tests with coverage
- `npm run test:e2e`: e2e tests

## Notes

- First run only: if migration history is old, use `npx prisma migrate reset` once.
- For the test database, `.env.test.local` must contain `DATABASE_TEST_URL`.
- The test DB is created by `docker/postgres/init/01-create-test-db.sql` when Postgres starts the first time.
