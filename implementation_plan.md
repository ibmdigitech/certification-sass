# CERTAI — UNIFIED IMPLEMENTATION PLAN

## Project Overview
A comprehensive SaaS platform for **Inspection & Training Certificate Management** with UAE-specific compliance (EIAC/ENAS). The system manages the full lifecycle: **Sales Inquiry → Customer → Quotation → Job Order → Scheduling → Inspection/Training → Findings → Technical Review → Certificate Generation → Timesheet → Invoice → Payment → Delivery → Job Closure**.

---

## Current State Audit (as of 2026-10-18)

### ✅ COMPLETE Modules
| Module | Status | Notes |
|--------|--------|-------|
| **Database Schema (Prisma)** | ✅ Complete | 80+ models covering all domains |
| **Authentication (NextAuth)** | ✅ Complete | Session-based, tenant-isolated |
| **Company/Location/Accreditation** | ✅ Complete | EIAC/ENAS mappings seeded |
| **Training Courses (19 initial)** | ✅ Complete | Idempotent seeding, course master |
| **Training Enrollments** | ✅ Complete | With ID docs, photo, location, job# |
| **Certificate Templates** | ✅ Complete | Training + Inspection templates seeded |
| **Certificate Validity Rules** | ✅ Complete | Equipment-category based (6M/12M/36M) |
| **Inspection Checklist Templates** | ✅ Complete | 5 equipment types (Forklift, Crane, Excavator, Scaffold, Lifting Accessories) |
| **Certificate Renewal API/UI** | ✅ Complete | Search, duplicate, auto-link |
| **Equipment Checklist System** | ✅ Complete | Normal/Full per equipment type, editor |
| **PDF Generation Service** | ✅ Complete | Dynamic template-based, QR codes |
| **Sidebar Navigation** | ✅ Complete | Icons fixed, all routes accessible |

### 🔄 IN PROGRESS / PARTIAL
| Module | Status | Remaining |
|--------|--------|-----------|
| **Job Order Management** | Partial | Service lines, approval workflow |
| **Scheduling & Calendar** | Partial | Inspector/trainer assignment |
| **Inspection Execution** | Partial | Checklist rendering, findings, CF handling |
| **Certificate Auto-generation** | Partial | Trigger on enrollment completion / report approval |
| **Timesheet Generation** | Not Started | From actual work records |
| **Invoice & Payment** | Not Started | From quotation lines |
| **Delivery Confirmation** | Not Started | Document tracking, evidence |
| **Job Closure Checklist** | Not Started | Validation rules |

### ❌ NOT STARTED
| Module | Priority |
|--------|----------|
| Sales Inquiry → Quotation workflow | High |
| Customer/Site management UI | High |
| Inspector/Trainer authorization matrix | High |
| QR verification public page | Medium |
| Bulk certificate generation | Medium |
| Offline-first sync | Medium |
| Dashboard with real data | Medium |

---

## PHASE IMPLEMENTATION PLAN

### PHASE 0 — REPOSITORY AUDIT ✅ COMPLETE
**Duration:** Week 1  
**Deliverables:**
- ✅ `docs/CERTAI_WORKFLOW_GAP_AUDIT.md` — Gap analysis with evidence
- ✅ `docs/CERTAI_END_TO_END_WORKFLOW.md` — Complete workflow specification
- ✅ Repository structure documented
- ✅ Existing models, APIs, services mapped
- ✅ Risks and migration requirements identified

---

### PHASE 1 — CUSTOMER SITES & EQUIPMENT ASSETS 🟡 IN PROGRESS
**Duration:** Week 2  
**Dependencies:** Phase 0

**Scope:** Implement customer-specific site and asset management as the foundation for all downstream workflows.

**Tasks:**
- [ ] **Customer Sites CRUD** (`/customers/[id]/sites`)
  - Create, view, edit, search, filter, archive
  - Store: address, emirate, GPS, site contacts, operational details
  - Link to parent customer with tenant isolation
- [ ] **Customer Equipment Assets CRUD** (`/customers/[id]/assets`)
  - Create, view, edit, search, filter, archive
  - Store: type, make, model, serial/asset number, capacity, location
  - Link assets to customer AND site
- [ ] **Site-Asset Linking**
  - Prevent cross-customer/cross-tenant relationships
  - Validation on create/edit
- [ ] **Reuse Existing Models:** `CustomerSite`, `CustomerAsset` (already in Prisma)

**API Endpoints Needed:**
- `GET/POST /api/customers/[id]/sites`
- `GET/PUT/DELETE /api/customers/[id]/sites/[siteId]`
- `GET/POST /api/customers/[id]/assets`
- `GET/PUT/DELETE /api/customers/[id]/assets/[assetId]`

**Acceptance Tests:**
1. Create customer → add site → add multiple assets to site
2. Verify tenant isolation (no cross-company data leakage)
3. Search/filter sites and assets by emirate, type, status

---

### PHASE 2 — JOB SERVICES & APPROVAL WORKFLOW
**Duration:** Week 3  
**Dependencies:** Phase 1

**Scope:** Make Job Order the central operational record with service lines and approval workflow.

**Tasks:**
- [ ] **Job Service Lines CRUD** (`/jobs/[id]/services`)
  - Support: `INSPECTION`, `TRAINING`, `COMBINED` service types
  - Each line: scope, quantity, schedule, assigned personnel, status
  - Link to specific equipment assets / training courses
- [ ] **Job Approval Workflow** (`/jobs/[id]/approval`)
  - Blocker validation: accreditation, authorization, docs, commercial
  - Approval history with timestamps, actors, reasons
  - Rejection with mandatory reason
- [ ] **Quotation → Job Order Conversion**
  - From accepted `SalesQuotation` (prevent duplicates)
  - One-to-many Job creation by service group
  - Preserve quotation line → JobService traceability
- [ ] **Duplicate Prevention**
  - Idempotency keys on Job creation
  - Unique constraints on quotation-job linkage
- [ ] **Job Detail Page** — Progress + outstanding requirements display

**Models (Exist):** `Job`, `JobService`, `JobApproval`, `SalesQuotation`

**Acceptance Tests:**
1. Create combined job (inspection + training) with multiple service lines
2. Submit for approval → verify blocker validation works
3. Convert quotation → verify no duplicate job on re-submit

---

### PHASE 3 — INSPECTOR & TRAINER AUTHORIZATION MATRICES
**Duration:** Week 4  
**Dependencies:** Phase 2

**Scope:** Build separate authorization matrices for inspectors and trainers with scheduling integration.

**Tasks:**
- [ ] **Inspector Authorization Model** (NEW — needs migration)
  - Employee → equipment category, inspection scope, method/standard, location, validity
  - Approval evidence, status, restrictions
- [ ] **Trainer Authorization Model** (NEW — needs migration)
  - Employee → approved courses, qualifications, delivery method, language, location, capacity, validity
- [ ] **Authorization UI** (`/employees/authorizations`, `/trainers/authorizations`)
  - Create, view, edit, expiry tracking
  - Approval workflow for new authorizations
- [ ] **Scheduling Integration**
  - Validate authorization + availability on service date
  - Block/flag if missing, expired, suspended, out-of-scope
  - Display WHY eligible or blocked on schedule view
- [ ] **Never Fabricate Accreditation** — Only use verified records

**New Models Required (Migration):**
```prisma
model InspectorAuthorization { ... }
model TrainerAuthorization { ... }
```

**Acceptance Tests:**
1. Assign unauthorized inspector → blocked with reason
2. Assign expired authorization → flagged
3. Schedule view shows eligibility reason per person

---

### PHASE 4 — INSPECTION EXECUTION & FIELD OPERATION
**Duration:** Week 5  
**Dependencies:** Phase 2, Phase 3

**Scope:** Connect inspection scheduling to actual field execution with offline support.

**Tasks:**
- [ ] **Field Execution Page** (`/inspections/[id]/execute`, `/field/inspection/[id]`)
  - Load: Job, JobService, Customer, Site, Equipment, Approved Checklist
  - Mobile-responsive for tablet/phone use
- [ ] **Checklist Fill Interface**
  - Per item: PASS / FAIL / NA / **CF (Critical Failure)**
  - Measurements (numeric + units), photos (multiple), attachments
  - Findings: severity, disposition, corrective actions, due dates
  - Inspector notes, signatures, timestamp
- [ ] **Critical Failure (CF) Handling**
  - CF = "Unsafe to use" → Immediate Unsafe Equipment Report
  - Auto-creates `FailureWorkflow` with corrective action
  - Blocks certificate issuance until resolved
- [ ] **Draft Save & Resume**
  - Local storage (IndexedDB) for offline drafts
  - Queued sync via `SyncQueue` table
  - Conflict detection (last-write-wins + manual resolution)
  - Retry with exponential backoff
- [ ] **Result Submission**
  - Result: `PASSED` | `FAILED` | `CONDITIONAL` | `FURTHER_INSPECTION`
  - Inspector signature + timestamp
  - Auto-create `InspectionReport` in `SUBMITTED_FOR_REVIEW`

**Models (Exist):** `Inspection`, `InspectionReport`, `ChecklistTemplate`, `ChecklistItem`, `ChecklistResult`, `ChecklistItemResult`, `FailureWorkflow`

**Acceptance Tests:**
1. Execute inspection offline → sync when online
2. Mark CF item → verify Unsafe Report auto-created
3. Submit report → verify status = SUBMITTED_FOR_REVIEW

---

### PHASE 5 — CERTIFICATE NUMBERING ENGINE & INTEGRATION ⚠️ CRITICAL
**Duration:** Week 6  
**Dependencies:** Phase 2, Phase 4

**Scope:** Implement the complete certificate numbering system and connect all generation triggers.

**Tasks:**
- [ ] **Certificate Numbering Format:** `TSC-CER-{TYPEID}-{YYYYMMDD}-{REV}`
  - TYPEID: 3-digit job type code from `JobPerformingType`
  - YYYYMMDD: Issue date
  - REV: Revision counter (0 = original, 1+ = revisions)
- [ ] **Transaction-Safe Number Generation**
  - DB advisory lock or sequence to prevent collisions
  - DB unique constraint on `certificate_number`
- [ ] **Idempotency Keys**
  - Every generation request requires idempotency key
  - Prevents duplicates on retry/network issues
- [ ] **Never Reuse Numbers** — Issued/revoked/cancelled never reassigned
- [ ] **Auto-fill from Job Type**
  - `JobPerformingType` → Certificate JSON:
    - `procedure_no`, `accredited_standard`, `other_standard`
    - `safe_control_no`, `safe_rev_no`, `safe_rev_date`
    - `unsafe_control_no`, `unsafe_rev_no`, `unsafe_rev_date`
    - `checklist_control_no`, `checklist_rev_no`, `checklist_rev_date`
    - `expiry_date_type`, `validity_period`
- [ ] **Certificate Generation Triggers** (API endpoints)
  - `POST /api/certificates/generate` — from enrollment completion
  - `POST /api/inspections/certificates/generate` — from report approval
  - Both use idempotency keys, return existing cert if already generated
- [ ] **Certificate Verification URL:** `/verify/{certNumber}` with QR encoding
- [ ] **Public Verification Page** — Supports both token and certificate number lookup
- [ ] **Certificate Lifecycle Operations**
  - Reprint, Duplicate, Revision, Renewal, Re-inspection, Replacement, Revocation
  - Each with proper audit trail and numbering rules

**Migration Needed:** Certificate numbering sequence/constraint

**Acceptance Tests:**
1. Generate cert → retry with same idempotency key → returns SAME cert
2. Generate cert for same enrollment twice → returns existing (no duplicate)
3. Verify numbering format: `TSC-CER-001-20261018-0`
4. Verify `/verify/TSC-CER-001-20261018-0` works

---

### PHASE 5A — CERTIFICATE VALIDITY RULES & AUTO-GENERATION
**Duration:** Week 6.5 (Parallel with Phase 5)

**Tasks:**
- [ ] **Validity Rules by Equipment Category** (seeded)
  - Forklift, Crane, MEWP, Rigging → 6 months (INSPECTION)
  - Excavator, Loader, Dozer, Roller → 12 months (INSPECTION)
  - Scaffold, Shackle, Falsework → 6 months (INSPECTION)
  - Operator Training → 36 months (TRAINING)
  - Safety Training → 24 months (TRAINING)
- [ ] **Auto-generation Triggers**
  - Training: Enrollment `COMPLETED` + assessment passed + trainer approved
  - Inspection: Report `APPROVED` + inspection `PASSED` + no open CF
- [ ] **Certificate Template System**
  - JSON-driven templates in DB (`CertificateTemplate`)
  - Versioned, preview, PDF generation
- [ ] **QR Code on Certificate** → `/verify/{certNumber}`

---

### PHASE 6 — TECHNICAL REVIEW & CERTIFICATION
**Duration:** Week 7  
**Dependencies:** Phase 4, Phase 5

**Scope:** Implement the unified review queue and certificate approval workflow.

**Tasks:**
- [ ] **Review Queue Page** (`/review/queue`)
  - Item types: inspection reports, training results, findings, timesheets, cert approvals
  - Filters: date, customer, job, service, location, reviewer, status
- [ ] **Queue Item Actions**
  - Approve / Reject / Return for correction with comments
  - Record reviewer, timestamp, reason, decision history
- [ ] **Separation of Duties**
  - Inspector ≠ Reviewer ≠ Approver
  - Configurable per company
- [ ] **Certificate Approval Flow**
  - Review queue → Technical Review → Certificate Generation → Approval → Issuance
  - Each step with audit trail
- [ ] **Certificate Generation from Templates**
  - PDF with QR codes, digital signatures
  - QR → `/verify/{certNumber}`

**Acceptance Tests:**
1. Submit inspection report → appears in review queue
2. Reviewer approves → cert generated automatically
3. Verify audit trail: who reviewed, when, decision

---

### PHASE 7 — TIMESHEETS & FINANCE
**Duration:** Week 8  
**Dependencies:** Phase 4, Phase 5

**Scope:** Connect operational work to finance without duplicating records.

**Tasks:**

**Timesheets:**
- [ ] **Generate Drafts** from actual inspection/training work records
  - Personnel, job, service, work date, actual time, breaks, overtime
- [ ] **Timesheet Approval Workflow**
  - Supervisor review → approval
  - Validate durations, overlapping entries
  - Lock approved timesheets
- [ ] **Branded PDF Timesheets** with revision history

**Invoices:**
- [ ] **Generate Drafts** from accepted quotation lines + billable services
  - Fixed, hourly, daily, travel, additional work
  - Time-based from **approved timesheets**
- [ ] **Prevent Duplicate Invoicing** — preserve source references
- [ ] **Invoice Lifecycle:** Draft → Approve → Issue → Cancel → Outstanding balance

**Payments & Collections:**
- [ ] **Payment Recording** — cash, bank transfer, card, online
- [ ] **Receipt/Reference**, payer, amount, date, method, reconciliation
- [ ] **Partial Payments & Allocation** across invoices
- [ ] **Credit Notes & Adjustments** (controlled)
- [ ] **Certificate Delivery Holds** — per customer contract (configurable, not hardcoded)

**Models (Exist):** `Timesheet`, `TimesheetEntry`, `TimesheetApproval`, `Invoice`, `InvoiceLine`, `Payment`, `PaymentAllocation`, `CreditNote`

**Acceptance Tests:**
1. Generate timesheet from completed inspection → matches actual hours
2. Generate invoice from quotation + timesheet → correct totals
3. Record partial payment → allocate across invoices → balance correct

---

### PHASE 8 — DELIVERY & JOB CLOSURE
**Duration:** Week 9  
**Dependencies:** Phase 5, Phase 6, Phase 7

**Tasks:**
- [ ] **Delivery Confirmation** (`/delivery/confirm/[certId]`)
  - Methods: Portal, Email, WhatsApp, Manual record
  - Capture: recipient, method, timestamp, evidence, acknowledgment
  - Partial delivery, failed delivery, retry tracking
- [ ] **Delivery Evidence** — Integration response OR manual confirmation with evidence
- [ ] **Job Closure Checklist** (`/jobs/[id]/close`)
  - Validate: all services complete, findings resolved, approvals done
  - Certificates issued, timesheets approved, invoices paid, documents delivered
  - Show blockers with owner, resolution action
- [ ] **Authorized Closure Only** — Role-based, full audit trail
- [ ] **Authorized Reopening** — With recorded reason

**Acceptance Tests:**
1. Deliver cert via portal → verify delivery log with evidence
2. Close job with all conditions met → status = CLOSED
3. Attempt close with open blocker → blocked with reason

---

### PHASE 9 — PUBLIC CERTIFICATE VERIFICATION
**Duration:** Week 9.5 (Parallel with Phase 8)

**Tasks:**
- [ ] **Certificate Number Lookup** — `/verify/{certNumber}`
  - Supports both token and certificate number
- [ ] **Public Verification Page**
  - Show only approved fields (no Emirates ID, passport, private docs)
  - Validate status, revision, revocation
  - Show revoked/superseded accurately
- [ ] **QR Code on Certificate** → encodes verification URL
- [ ] **Security Policy** — Configurable public fields per company

**Acceptance Tests:**
1. Verify issued cert → shows valid
2. Verify revoked cert → shows revoked with date
3. Verify superseded cert → shows current version
4. No private data exposed

---

### PHASE 10 — DASHBOARDS, UI & OFFLINE SYNC
**Duration:** Week 10  
**Dependencies:** All prior phases

**Tasks:**
- [ ] **Real-Data Dashboards**
  - Sales: inquiries, quotations, conversion, pipeline
  - Operations: jobs pending approval, unassigned, today's schedule, overdue
  - Inspection: pending, findings, corrective actions, certs pending
  - Training: upcoming sessions, attendance, assessments, expiring quals
  - Certification: pending approval, issued, renewals, revisions
  - Finance: invoices, payments, overdue, unbilled work
  - Delivery: pending, failed, jobs blocked
  - Each number links to filtered records
- [ ] **Responsive UI** — Loading, empty, error, permission states
- [ ] **Offline-First Sync**
  - Inspection checklists, attendance, timesheets
  - IndexedDB + `SyncQueue` with conflict detection
  - Retry handling, never overwrite newer server records
- [ ] **Cross-Navigation** — From every entity to related records

---

### PHASE 11 — END-TO-END VALIDATION & PRODUCTION PREP
**Duration:** Week 11  
**Dependencies:** All prior phases

**Tasks:**
- [ ] **Full E2E Test Scenario** (Inquiry → Job Closure)
- [ ] **Edge Case Tests:**
  - Rejection, expired auth, failed inspection, reschedule
  - Cert revision, renewal, failed delivery, partial payment, reopening
- [ ] **Security Tests:** Tenant isolation, RBAC, offline sync, duplicate submissions, failure recovery
- [ ] **TypeScript, Lint, Build Verification**
- [ ] **Production Deployment Prep**

---

## REQUIRED MIGRATIONS (Additive Only)

| Phase | Migration | Description |
|-------|-----------|-------------|
| 3 | `add_inspector_trainer_authorization` | InspectorAuthorization, TrainerAuthorization models |
| 5 | `add_certificate_numbering` | Certificate sequence, unique constraint, numbering engine |
| 5 | `add_idempotency_keys` | IdempotencyKey table or column on Certificate |

**Safe Migration Practices:**
- All migrations additive (no drops)
- `prisma migrate dev --name <descriptive-name>`
- Seed reference data in same migration
- Rollback: manual down migration or `prisma migrate reset` (dev only)

---

## SUCCESS CRITERIA (Definition of Done)

A phase is **complete** ONLY when:
1. ✅ Database relationships & migrations work
2. ✅ Real APIs persist & validate data
3. ✅ RBAC & tenant isolation tested
4. ✅ Screens display persisted records
5. ✅ Workflow transitions & audit history work
6. ✅ Automated tests pass
7. ✅ Existing functionality has not regressed

---

## ACCEPTANCE TESTS (Must Pass All)

1. **Customer → Site → Assets** flow
2. **Inquiry → Quotation → Job** (combined, multi-service)
3. **Authorized assignment only** (block unauthorized)
4. **Inspection execution** against correct asset, CF handling
5. **Training completion** → assessment → certificate
6. **Certificate generation** safe against retries/duplicates
7. **Review queue** with audit trail
8. **Timesheets** from actual work
9. **Invoice + partial payment** reconciliation
10. **Delivery evidence** + job closure checks
11. **Public verification** for issued/revised/revoked/invalid
12. **Tenant isolation**, RBAC, offline sync, duplicate handling, failure recovery

---

## KEY TECHNICAL DECISIONS

- **Server Components First** — Default to RSC, `"use client"` only where needed
- **Session-Based Auth** — `getServerSession` in all API routes, tenant isolation via `companyId`
- **Prisma Singleton** — Single client via `@/lib/prisma`
- **Certificate Templates** — JSON-driven, stored in DB, versioned
- **Auto-fill Engine** — Job Type → Certificate JSON
- **Idempotent Seeding** — All seed operations use `upsert`
- **Soft Deletes** — Status fields over hard deletes
- **Audit Logs** — On all critical mutations

---

## NEXT IMMEDIATE ACTIONS

1. **Phase 1:** Create Customer Sites & Assets UI (`/customers/[id]/sites`, `/customers/[id]/assets`)
2. **Phase 1:** API endpoints for site/asset CRUD
3. **Phase 1:** Verification tests
4. Then proceed to Phase 2