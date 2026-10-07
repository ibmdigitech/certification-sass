# Certificate Pro (Scaffold)

Minimal scaffold for the Inspection + Training Certificate SaaS.

Quick start:

1. Copy `.env.example` to `.env` and update `DATABASE_URL`.
2. Install dependencies: `npm install`.
3. Generate Prisma client: `npm run prisma:generate`.
4. Run migrations: `npm run prisma:migrate`.
5. Seed demo data: `npm run seed`.
6. Start dev server: `npm run dev`.

Files added:
- `prisma/schema.prisma` — Prisma schema (ERD).
- `prisma/seed.ts` — demo seed script.
- `src/lib/prisma.ts` — Prisma client helper.
- `src/pages/api/health.ts` — basic health endpoint.

Next steps:
- Implement authentication and role-based middleware.
- Implement core APIs for jobs, reschedules, inspections, certificates, payments, invoices, and delivery.
