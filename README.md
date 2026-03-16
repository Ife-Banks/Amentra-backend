# A-Mentra Backend

Multi-tenant SIWES (Student Industrial Work Experience Scheme) activity logging and monitoring API for Nigerian universities.

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (access + refresh) + bcryptjs
- **Queue:** Bull + Redis
- **File storage:** Cloudinary
- **Email:** SendGrid / Nodemailer
- **SMS:** Termii
- **Validation:** Zod
- **Docs:** Swagger (OpenAPI)

## Prerequisites

- Node.js 18+
- MongoDB
- Redis

## Setup

1. Clone and install:
   ```bash
   cd amentra-backend
   npm install
   ```

2. Copy environment file and set values:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI, Redis URL, JWT secrets, Cloudinary, SendGrid, etc.
   ```

3. Run:
   ```bash
   npm run dev
   ```

Server runs at `http://localhost:5000`. API base: `http://localhost:5000/api`. Swagger UI: `http://localhost:5000/api-docs`.

## Multi-tenancy

All data is scoped by `institutionId`. Every document (users, students, logs, etc.) includes `institutionId`. Middleware sets `req.institutionId` from the JWT. All queries must filter by `institutionId` to avoid cross-tenant leakage.

## Folder structure

- `src/config` – DB, Redis, Cloudinary, email, SMS, Swagger
- `src/models` – Mongoose models
- `src/middleware` – auth, tenant, validation, rate limit, upload, error handler, audit
- `src/routes` – route definitions
- `src/controllers` – request handlers
- `src/services` – business logic
- `src/queues` – Bull queues and workers (bulk import, report, email)
- `src/schemas` – Zod schemas
- `src/utils` – JWT, password, pagination, API response, CSV, PDF

## Adding a new endpoint

1. Add Zod schema in `src/schemas/` if needed.
2. Add service method in the right `src/services/*.js`.
3. Add controller in the right `src/controllers/*.js`.
4. Register route in the right `src/routes/*.js` with middleware (verifyToken, requireRole, attachTenant, validate).
5. Use `success()` / `error()` from `src/utils/apiResponse.js`.

## Bulk import CSV format

- **Admins:** name, email, departmentId
- **Supervisors:** name, email, departmentId, company
- **Students:** name, email, matricNumber, departmentId, company, sessionId

## Async jobs (Bull + Redis)

- **Bulk import:** CSV upload creates a job; worker creates users and role docs, sends welcome emails; errors written to a CSV and uploaded to Cloudinary.
- **Reports:** Report job queued; worker builds PDF/Excel and uploads to Cloudinary; job updated with file URL.
- **Email:** Jobs for transactional email (welcome, reset, etc.) processed by the email worker.

## Scripts

- `npm run dev` – start with nodemon
- `npm start` – start production server
- `npm test` – run Jest tests
- `npm run lint` – run ESLint
# Amentra-backend
