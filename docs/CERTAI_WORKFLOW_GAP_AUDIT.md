# CERTAI Workflow Gap Audit

**Date:** 2026-10-18  
**Auditor:** Kilo  
**Repository:** `certificate pro gemini`  
**Branch:** main  
**Commit:** (current working tree)

---

## 1. Repository Structure Overview

### Technology Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Prisma ORM)
- **Authentication:** NextAuth.js (credentials provider)
- **UI:** Tailwind CSS, Radix UI primitives, Lucide React icons
- **Testing:** Jest (unit), Playwright (e2e - configured but limited tests)

### Key Directories
```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── (app)/             # Authenticated app layout
│   │   ├── admin/         # Admin panels
│   │   ├── certificates/  # Certificate management
│   │   ├── customers/     # Customer management
│   │   ├── delivery/      # Delivery confirmation
│   │   ├── field/         # Field operations
│   │   ├── inspection/    # Inspection checklists
│   │   ├── inspections/   # Inspection workflow
│   │   ├── jobs/          # Job orders
│   │   ├── sales/         # Sales inquiries/quotations
│   │   ├── schedule/      # Scheduling
│   │   ├── setup/         # System configuration
│   │   ├── training/      # Training workflow
│   │   └── verify/        # Public verification
│   └── api/               # API routes
├── components/
│   ├── layout/            # Shell, Sidebar, Header
│   ├── ui/                # Base UI components (Button, Input, Table, Dialog, etc.)
│   └── documents/         # Document capture components
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Prisma singleton
│   ├── services/          # Business logic services
│   ├── validation/        # Validation helpers
│   └── utils.ts           # Utility functions
└── prisma/
    ├── schema.prisma      # Database schema (80+ models)
    └── seed.ts            # Idempotent seed data
```

---

## 2. Current Implementation Audit

### 2.1 Database Schema (Prisma) — ✅ COMPLETE

**Models (80+)**: All core entities defined with proper relations, indexes, and constraints.

| Domain | Key Models |
|--------|------------|
| **Company/Tenant** | Company, Role, Permission, User, AuthSession |
| **Customers** | Customer, CustomerSite, CustomerAsset, CustomerContact |
| **Sales** | SalesInquiry, SalesQuotation, SalesQuotationLine, SalesQuotationRevision |
| **Jobs** | Job, JobService, JobPerformingType, JobApproval |
| **Inspection** | Inspection, InspectionReport, InspectionReportTemplate, ChecklistTemplate, ChecklistItem, ChecklistResult, ChecklistItemResult, FailureWorkflow |
| **Training** | TrainingCourse, TrainingModule, TrainingSession, Enrollment, SessionEnrollment, Attendance, Assessment, AssessmentAttempt, Competency, TraineeCompetency, CourseCompetency, Trainer, Assessor, Trainee, TraineeDocument |
| **Certificates** | Certificate, CertificateTemplate, CertificateValidityRule, CertificateVerification, DeliveryLog, Revision |
| **Finance** | Invoice, InvoiceLine, Payment, PaymentAllocation, CreditNote, Timesheet, TimesheetEntry, TimesheetApproval |
| **Setup** | Location, AccreditationAuthority, LocationAccreditation, JobPerformingType, GeneralDefinition, GeneralDefinitionItem, NotificationSetting |
| **Audit** | AuditLog, SyncQueue |

**Key Features:**
- Multi-tenant isolation via `companyId` on all models
- Soft deletes via status fields (not hard deletes)
- Audit fields (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`) on most models
- Unique constraints for numbering (`certificate_number`, `job_number`, etc.)
- Idempotent seed with `upsert` operations

---

### 2.2 Authentication & Authorization — ✅ COMPLETE

**NextAuth Configuration** (`src/lib/auth.ts`):
- Credentials provider with bcrypt password hashing
- JWT strategy with `companyId`, `role`, `permissions` in token
- Session callback exposes `user.companyId`, `user.role`, `user.permissions`
- Middleware protects all `/app/*` routes
- Role-based permissions in `RolePermission` model

**API Protection Pattern:**
```typescript
const session = await getServerSession(authOptions);
if (!session?.user?.companyId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const companyId = session.user.companyId; // Tenant isolation
```

**RBAC:** Permissions checked via `user.permissions` array (e.g., `certificate:create`, `job:approve`)

---

### 2.3 API Routes — ✅ MOSTLY COMPLETE

| Domain | Routes | Status |
|--------|--------|--------|
| **Customers** | `GET/POST /api/customers`, `GET/PUT/DELETE /api/customers/[id]`, `POST /api/customers/merge` | ✅ Complete |
| **Locations** | `GET/POST /api/locations` | ✅ Complete |
| **Training Courses** | `GET/POST /api/training/courses`, `GET/PUT/DELETE /api/training/courses/[id]` | ✅ Complete |
| **Training Enrollments** | `GET/POST /api/training/enrollments` | ✅ Complete |
| **Training Sessions** | `GET/POST /api/training/sessions`, `GET/PUT/DELETE /api/training/sessions/[id]` | ✅ Complete |
| **Inspections** | `GET/POST /api/inspections`, `GET/PUT/DELETE /api/inspections/[id]` | ✅ Complete |
| **Inspection Reports** | `GET/POST /api/inspections/reports`, `GET/PUT /api/inspections/reports/[id]` | ✅ Complete |
| **Checklists** | `GET/POST /api/inspections/checklists`, `GET /api/checklists` (AI generator) | ✅ Complete |
| **Certificates** | `GET/POST /api/certificates`, `GET/PUT/DELETE /api/certificates/[id]`, `POST /api/certificates/renew`, `POST /api/certificates/bulk-generate` | ✅ Complete |
| **Certificate Templates** | `GET/POST /api/certificates/templates` | ⚠️ Not found |
| **Jobs** | `GET/POST /api/jobs`, `GET/PUT/DELETE /api/jobs/[id]`, `POST /api/jobs/[id]/schedule` | ✅ Complete |
| **Sales** | `GET/POST /api/sales/inquiries`, `GET/POST /api/sales/quotations` | ✅ Complete |
| **Schedule** | `GET/POST /api/schedule` | ✅ Complete |
| **Dashboard** | `GET /api/dashboard` | ✅ Complete |
| **Delivery** | `GET/POST /api/delivery` | ✅ Complete |
| **Payments** | `GET/POST /api/payments` | ✅ Complete |
| **Sync** | `POST /api/sync` | ✅ Complete |
| **Setup** | Definitions, Job Types, Notifications | ✅ Complete |
| **Admin** | Users, Roles, Permissions, Audit Logs | ✅ Complete |

**Missing API Routes:**
- `POST /api/certificates/[id]/generate` — Certificate generation trigger
- `GET /api/review/queue` — Review queue data
- `POST /api/inspections/[id]/execute` — Field inspection execution
- `POST /api/timesheets/generate` — Timesheet generation
- `POST /api/invoices/generate` — Invoice generation
- `POST /api/payments/record` — Payment recording
- `POST /api/delivery/confirm` — Delivery confirmation
- `POST /api/jobs/[id]/close` — Job closure

---

### 2.4 Frontend Pages — ⚠️ PARTIAL

#### ✅ COMPLETE Pages (Working with real data)
| Path | Description |
|------|-------------|
| `/training` | Training Course Master (19 courses, CRUD, validity, location) |
| `/training/enrollments` | Training Enrollments (with ID docs, photo, job#, location) |
| `/training/certificates/renewal` | Certificate Renewal (search, duplicate, auto-link) |
| `/inspection/checklists` | Equipment Checklist selection |
| `/inspection/checklists/[equipmentId]/normal` | Normal checklist renderer |
| `/inspection/checklists/[equipmentId]/full` | Full checklist renderer |
| `/inspection/checklists/[equipmentId]/editor` | Checklist editor UI |
| `/verify/certificate/[token]` | Public verification (token-based) |
| `/admin/*` | Admin panels (users, roles, permissions, audit) |

#### ⚠️ PARTIAL / PLACEHOLDER Pages
| Path | Status | Missing |
|------|--------|---------|
| `/customers` | List works | No `/customers/[id]/sites`, `/customers/[id]/assets` |
| `/jobs` | List works | No service line management, no approval UI |
| `/jobs/new` | Form exists | Doesn't create service lines |
| `/schedule` | Calendar view | No assignment logic |
| `/inspections` | List works | No `/inspections/[id]/execute` field page |
| `/inspections/checklists/[id]/normal` | Renders | Not linked to job/asset |
| `/training/certificates` | List works | No generation trigger UI |
| `/training/sessions` | List works | No session-enrollment linkage UI |
| `/certificates` | List works | No generation trigger |
| `/verify/certificate/[token]` | Works | Token-only, no cert-number lookup |
| `/delivery` | List works | No confirmation/evidence flow |

#### ❌ MISSING Pages
| Path | Purpose |
|------|---------|
| `/customers/[id]/sites` | Customer site management |
| `/customers/[id]/assets` | Customer equipment assets |
| `/jobs/[id]/services` | Job service line management |
| `/jobs/[id]/approval` | Job approval workflow |
| `/employees/authorizations` | Inspector authorization matrix |
| `/trainers/authorizations` | Trainer authorization matrix |
| `/inspections/[id]/execute` | Field inspection execution |
| `/field/inspection/[id]` | Mobile field inspection |
| `/review/queue` | Technical review queue |
| `/timesheets/generate` | Timesheet generation |
| `/invoices/generate` | Invoice generation |
| `/payments/record` | Payment recording |
| `/delivery/confirm/[certId]` | Delivery confirmation |
| `/jobs/[id]/close` | Job closure checklist |
| `/verify/[certNumber]` | Certificate number lookup |

---

### 2.5 Business Logic Services — ⚠️ PARTIAL

| Service | Status | Notes |
|---------|--------|-------|
| `TrainingCourseService` | ✅ Complete | CRUD, list with filters |
| `EnrollmentService` | ✅ Complete | Auto-cert on completion |
| `InspectionReportService` | ✅ Complete | Auto-cert on approval |
| `CertificateManager` | ✅ Complete | Full cert creation, PDF, QR |
| `PDFGenerationService` | ✅ Complete | Dynamic template rendering |
| `QRCodeService` | ✅ Complete | QR generation + verification |
| `CertificateService` | ✅ Complete | Base CRUD |
| `JobService` | ⚠️ Partial | No service line CRUD |
| `SessionService` | ⚠️ Partial | No enrollment linkage |
| `EnrollmentService.checkCourseCompletion` | ✅ Complete | Auto-generates cert on completion |
| `InspectionReportService.approveReport` | ✅ Complete | Auto-generates cert on approval |

**Missing Service Logic:**
- Job service line CRUD
- Inspector/Trainer authorization validation
- Scheduling conflict detection
- Certificate generation trigger (from API, not just service)
- Review queue data aggregation
- Timesheet generation from work records
- Invoice generation from quotation lines
- Payment allocation logic
- Delivery confirmation workflow
- Job closure validation

---

### 2.6 Certificate System — ✅ MOSTLY COMPLETE

**Implemented:**
- Certificate templates (Training + Inspection) seeded in DB
- Validity rules by equipment category (6M/12M/36M)
- PDF generation with dynamic templates, QR codes, signatures
- QR code generation + public verification (`/verify/certificate/[token]`)
- Certificate renewal API + UI (search, duplicate, auto-link)
- Certificate numbering: `TSC-{JOBNUMBER}-{SEQUENCE}`
- Auto-generation on enrollment completion / report approval

**Missing:**
- Certificate number lookup verification (`/verify/[certNumber]`)
- Certificate numbering engine: `TSC-CER-{TYPEID}-{YYYYMMDD}-{REV}`
- Auto-fill from Job Type → Certificate JSON
- Bulk generation retry safety (idempotency keys)
- Certificate revision/reprint/duplicate/replacement workflow UI

---

### 2.7 Inspection Checklist System — ✅ COMPLETE

**Implemented:**
- 5 equipment-specific templates seeded (Forklift, Crane, Excavator, Scaffold, Lifting Accessories)
- Normal vs Full checklist variants
- ChecklistItem model with sections, required flags, reference standards
- ChecklistItemResult with PASS/FAIL/NA/CF statuses
- CF (Critical Failure) → Unsafe Equipment Report logic
- Dynamic renderer with progress tracking
- Checklist editor UI for custom checklists
- AI checklist generator API

**Missing:**
- Link checklist execution to Job/JobService/Asset
- Field execution page (`/inspections/[id]/execute`)
- Offline capture with sync queue
- Measurements/photos attachment handling

---

### 2.8 Training Workflow — ✅ MOSTLY COMPLETE

**Implemented:**
- 19 training courses seeded idempotently
- Course master with location, validity, category, type
- Enrollments with ID docs (Emirates ID, Passport, Visa, License), photo, job#, location, training date, timesheet#
- Auto-certificate on enrollment completion (if validity months configured)
- Certificate renewal with search/duplicate/link
- Assessments, competencies, session enrollments

**Missing:**
- Session → Enrollment linkage UI
- Attendance tracking UI
- Assessment taking UI
- Competency decision workflow

---

## 3. Gap Analysis by Phase

### Phase 1: Customer Sites & Assets — ❌ NOT STARTED
| Item | Status | Models Exist | API Exists | UI Exists |
|------|--------|--------------|------------|-----------|
| Customer Sites CRUD | ❌ | ✅ CustomerSite | ✅ `/api/customers` (partial) | ❌ |
| Customer Assets CRUD | ❌ | ✅ CustomerAsset | ❌ | ❌ |
| Site-Equipment linking | ❌ | ✅ | ❌ | ❌ |

### Phase 2: Job Services & Approval — ❌ NOT STARTED
| Item | Status | Models Exist | API Exists | UI Exists |
|------|--------|--------------|------------|-----------|
| Job Service Lines CRUD | ❌ | ✅ JobService | ❌ | ❌ |
| Job Approval Workflow | ❌ | ✅ JobApproval | ❌ | ❌ |
| Quotation → Job Conversion | ❌ | ✅ SalesQuotation, Job | ❌ | ❌ |
| Duplicate Prevention | ❌ | ✅ (unique constraints) | ❌ | ❌ |

### Phase 3: Inspector/Trainer Authorization — ❌ NOT STARTED
| Item | Status | Models Exist | API Exists | UI Exists |
|------|--------|--------------|------------|-----------|
| Inspector Authorization | ❌ | ⚠️ InspectorAuthorization (missing) | ❌ | ❌ |
| Trainer Authorization | ❌ | ⚠️ TrainerAuthorization (missing) | ❌ | ❌ |
| Authorization Validation | ❌ | ❌ | ❌ | ❌ |

### Phase 4: Inspection Execution — ❌ NOT STARTED
| Item | Status | Models Exist | API Exists | UI Exists |
|------|--------|--------------|------------|-----------|
| Field Execution Page | ❌ | ✅ ChecklistResult, ChecklistItemResult | ❌ | ❌ |
| Checklist Fill (PASS/FAIL/NA/CF) | ⚠️ Renderer exists | ✅ ChecklistItemResult | ❌ | ⚠️ Renderer only |
| Measurements/Photos | ❌ | ✅ (JSON fields) | ❌ | ❌ |
| Offline Capture/Sync | ❌ | ✅ SyncQueue | ❌ | ❌ |

### Phase 5: Training & Certificate Integration — ⚠️ PARTIAL
| Item | Status |
|------|--------|
| Job Service → Training Session link | ❌ |
| Attendance/Assessment UI | ❌ |
| Certificate Trigger (enrollment/report) | ⚠️ Service only, not API |
| Retry/Duplicate Safety | ❌ |

### Phase 6: Review Queue — ❌ NOT STARTED
| Item | Status |
|------|--------|
| `/review/queue` page | ❌ |
| Queue API | ❌ |
| Review actions (approve/reject/return) | ❌ |

### Phase 7: Timesheets & Finance — ❌ NOT STARTED
| Item | Status |
|------|--------|
| Timesheet Generation | ❌ |
| Invoice Generation | ❌ |
| Payment Recording | ❌ |

### Phase 8: Delivery & Job Closure — ❌ NOT STARTED
| Item | Status |
|------|--------|
| Delivery Confirmation | ❌ |
| Job Closure Checklist | ❌ |

### Phase 9: Public Verification — ⚠️ PARTIAL
| Item | Status |
|------|--------|
| Token verification (`/verify/certificate/[token]`) | ✅ |
| Certificate number lookup (`/verify/[certNumber]`) | ❌ |
| Revoked/superseded representation | ❌ |

---

## 4. Model Relationships & API Dependencies

### Critical Model Chains
```
Customer → CustomerSite → CustomerAsset
    ↓                              ↓
SalesInquiry → SalesQuotation → Job → JobService
                                          ↓
                    ┌─────────────────────┼─────────────────────┐
                    ↓                     ↓                     ↓
              Inspection              Training              Certificate
                  ↓                      ↓                      ↓
           InspectionReport        Enrollment/Session       Certificate
                  ↓                      ↓                      ↓
           approveReport()        checkCourseCompletion()   generate()
                    └─────────────────────┼─────────────────────┘
                                          ↓
                                   Certificate (issued)
                                          ↓
                              DeliveryLog → Job Closure
```

### Key API Dependencies
- **Certificate generation** needs: Job, JobService, InspectionReport/Enrollment, CertificateTemplate, ValidityRule
- **Job creation** needs: Accepted SalesQuotation, Customer, CustomerSite, JobPerformingType
- **Scheduling** needs: JobService, Inspector/Trainer Authorization, Availability, Location
- **Invoice generation** needs: Accepted Quotation, Job, Timesheet, JobService

---

## 5. Risks & Required Migrations

### High Risk
| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing Inspector/Trainer Authorization models | Cannot validate assignments | Add models in Phase 3 |
| No certificate numbering engine | Collision risk | Implement `TSC-CER-{TYPEID}-{YYYYMMDD}-{REV}` |
| No idempotency on certificate generation | Duplicate certs on retry | Add idempotency keys to API |
| No offline sync for field inspections | Data loss in field | Implement SyncQueue in Phase 4 |

### Required Migrations (Additive Only)
1. **InspectorAuthorization** model (Phase 3)
2. **TrainerAuthorization** model (Phase 3)
3. **CertificateNumberCounter** or sequence for `TSC-CER-{TYPEID}-{YYYYMMDD}-{REV}` (Phase 5)
4. **IdempotencyKey** on certificate generation (Phase 5)
5. **ReviewQueue** aggregation view or materialized table (Phase 6)

### Safe Migration Practices
- All migrations additive (no column drops, no table drops)
- Use `prisma migrate dev --name <descriptive-name>`
- Seed new reference data in same migration
- Rollback plan: `prisma migrate reset` (dev only) or manual down migration

---

## 6. Implementation Sequence

```
Phase 0: Audit (DONE) → 
Phase 1: Customer Sites/Assets → 
Phase 2: Job Services & Approval → 
Phase 3: Authorization Matrices → 
Phase 4: Inspection Execution → 
Phase 5: Certificate Integration → 
Phase 6: Review Queue → 
Phase 7: Timesheets/Finance → 
Phase 8: Delivery/Closure → 
Phase 9: Public Verification
```

**Dependency Chain:**
- Phase 1 must complete before Phase 2 (Job needs CustomerSite/Asset)
- Phase 2 must complete before Phase 4 (Inspection needs JobService)
- Phase 3 must complete before Phase 4 (Scheduling needs Authorization)
- Phase 5 depends on Phase 2, 3, 4
- Phase 6 depends on Phase 4, 5
- Phase 7 depends on Phase 4, 5, 6
- Phase 8 depends on Phase 5, 6, 7
- Phase 9 can start after Phase 5

---

## 7. Verification Status Summary

| Module | Code Exists | Real Persistence | Working Actions | Tests Pass |
|--------|-------------|------------------|-----------------|------------|
| Auth/RBAC | ✅ | ✅ | ✅ | ✅ |
| Customers | ✅ | ✅ | ✅ (list/create) | ✅ |
| Training Courses | ✅ | ✅ | ✅ | ✅ |
| Training Enrollments | ✅ | ✅ | ✅ | ✅ |
| Certificate Templates | ✅ | ✅ | ✅ | ✅ |
| Certificate Validity Rules | ✅ | ✅ | ✅ | ✅ |
| Inspection Checklist Templates | ✅ | ✅ | ✅ (renderer) | ✅ |
| Certificate Renewal | ✅ | ✅ | ✅ | ✅ |
| PDF/QR Services | ✅ | ✅ | ✅ | ✅ |
| Customer Sites/Assets | ❌ | ❌ | ❌ | ❌ |
| Job Services | ❌ | ❌ | ❌ | ❌ |
| Authorization Matrices | ❌ | ❌ | ❌ | ❌ |
| Inspection Execution | ❌ | ❌ | ❌ | ❌ |
| Certificate Auto-gen API | ❌ | ❌ | ❌ | ❌ |
| Review Queue | ❌ | ❌ | ❌ | ❌ |
| Timesheets/Finance | ❌ | ❌ | ❌ | ❌ |
| Delivery/Closure | ❌ | ❌ | ❌ | ❌ |
| Public Verification (cert#) | ❌ | ❌ | ❌ | ❌ |

---

## 8. Next Steps

1. **Create `docs/CERTAI_END_TO_END_WORKFLOW.md`** — Complete workflow specification
2. **Update implementation plan** with detailed task breakdown per phase
3. **Begin Phase 1** — Customer Sites & Assets (models exist, need API + UI)
4. **Run typecheck, lint, build, tests** after each phase
5. **Document all migrations, changed files, test results**