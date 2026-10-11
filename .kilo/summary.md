# CERTAI - Structured Project Summary

## Objective
Transform the existing CertAI application into a fully functional offline-first Training, Inspection, Competency and Certificate Management System.

## Important Details
- **Business rule**: Dubai (DXB) → EIAC; Abu Dhabi (AUH) → ENAS. Cross-mapping (DXB+ENAS, AUH+EIAC) is NEVER allowed.
- **Business modules**: "Training Certification" and "Inspection Certification" top-level sidebar groups.
- **Database**: PostgreSQL on Docker port 5434, `certuser:certpass` @ `localhost:5434/certapp`.

## Completed Phases

### PHASE 1 (DB Schema) ✅
Full rewrite of `prisma/schema.prisma` with models: Location, AccreditationAuthority, LocationAccreditation, CourseLocation, CourseAccreditation, SessionEnrollment, Attendance, Competency, TraineeCompetency, CourseCompetency, Trainer, Assessor, Notification, SyncQueue, AuditLog (updated). Updated TrainingCourse (location/accreditation/courseType/trainingHours/status/version), TrainingSession (course/location/accreditation/trainer/assessor/capacity), Trainee (companyName/jobTitle/emiratesId/nationality/dateOfBirth/photoUrl/locationId).

### PHASE 1.5 (Sidebar + TypeScript) ✅
Rewrote `src/components/layout/Sidebar.tsx` with collapsible Training Certification + Inspection Certification groups. Fixed TS errors across `trainee.service.ts`, `training.service.ts`, `enrollment.service.ts`, `inspections/page.tsx`, `login/page.tsx`.

### PHASE 2 (Seed) ✅
Rewrote `prisma/seed.ts` — fully idempotent. Seeds DXB/AUH locations, EIAC/ENAS accreditation with correct mappings, 7 competencies, 4 operator courses (DXB+EIAC, AUH+ENAS), 8 roles, 3 users (admin/trainer/assessor), 1 job, 1 certificate. Verified idempotency and DB counts.

### PHASE 3 (Validation) ✅
Created `src/lib/validation/location-accreditation.ts` with `validateLocationAccreditation()`, `getRequiredAccreditationForLocation()`.

### PHASE 4 (API Validation) ✅
Added location-accreditation validation to:
- `src/app/api/training/courses/route.ts` (POST)
- `src/app/api/training/courses/[id]/route.ts` (PUT)
- `src/app/api/training/sessions/route.ts` (POST — also validates against course location)
- `src/app/api/training/sessions/[id]/route.ts` (PUT)

### PHASE 5 (Training Course Service) ✅
Updated `TrainingCourseService` in `training.service.ts`: extended `CreateCourseInput` with all new schema fields, updated `createCourse` and `updateCourse`.

### PHASE 7 (Training Sessions API) ✅
- Created `src/lib/services/session.service.ts` — full session CRUD, enroll/unenroll trainees, record attendance
- Created `src/app/api/training/sessions/route.ts` — GET (list/filter) + POST (create with validation)
- Created `src/app/api/training/sessions/[id]/route.ts` — GET (detail) + PUT (update with validation) + DELETE

### PHASE 8 (Competency API) ✅
- Created `src/lib/services/competency.service.ts` — CompetencyService (CRUD), TraineeCompetencyService (assign/revoke/list), CourseCompetencyService (link/unlink/list)
- Created `src/app/api/training/competencies/route.ts` — GET (list/filter) + POST
- Created `src/app/api/training/competencies/[id]/route.ts` — GET + PUT + DELETE
- Exported all from `src/lib/services/index.ts`

### PHASE 14 (RBAC fixes) ✅
- Fixed `src/app/api/jobs/[id]/services/route.ts` — added `session?.user` null check
- Fixed `src/lib/services/job.service.ts` — fixed `approvalStatus` → `status` field, fixed `inspection` → `inspections` array

### PHASE 16 (Dashboard) ✅
- Created `src/app/api/dashboard/route.ts` — aggregates trainee counts, course stats (draft/published/pending), session counts (upcoming/completed), competency counts, certificate counts, job stats, recent training activity (enrollments + assessment attempts), and expiring certificates (90-day window)
- Rewrote `src/app/dashboard/page.tsx` — replaces hardcoded data with real API fetch, includes loading Skeleton states, formatted dates via `date-fns`, color-coded status badges

## Remaining TS Errors
Only in `src/components/documents/DocumentCapture.test.tsx` (13 errors) — missing `@testinglibrary/react` and `@types/jest`. Non-blocking for production build.

## Environment Commands
```powershell
# Set DB connection (port 5434)
$env:DATABASE_URL="postgresql://certuser:certpass@localhost:5434/certapp?schema=public"

# Seed
npx ts-node --transpile-only prisma/seed.ts

# Push schema
npx prisma db push

# Dev
npm run dev
# or: $env:DATABASE_URL=...; npm run dev

# Build
npm run build
# or: $env:DATABASE_URL=...; npm run build
```

## Next Priority Phases
- PHASE 9: Trainee competency linking APIs
- PHASE 10: Apply validation to Inspection Certification APIs (jobs, inspections, reports)
- PHASE 11: Certificate generation with location/accreditation validation
- PHASE 12-13: Offline-first infrastructure (already partially exists in `src/lib/offline/`)
- PHASE 18: RBAC enforcement across all routes