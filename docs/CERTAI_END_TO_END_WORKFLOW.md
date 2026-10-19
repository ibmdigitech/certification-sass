# CERTAI — Complete End-to-End Workflow Specification

**Version:** 1.0  
**Date:** 2026-10-18  
**Status:** Authoritative reference for implementation

---

## Overview

This document defines the complete business workflow for the CertAI Inspection & Training Certification SaaS, from initial sales inquiry through job closure. Every module, screen, API, and database operation maps to this workflow.

---

## Stage 1 — Sales Inquiry & Customer Management

### 1.1 Customer Management
**Entity:** `Customer`, `CustomerSite`, `CustomerContact`, `CustomerAsset`

**Operations:**
- Create customer with company name, type (Corporate/Government/Individual), contacts, billing details
- Add multiple sites per customer (address, emirate, GPS, site contact)
- Add multiple assets per site (type, make, model, serial, capacity, location)
- Duplicate detection (name, TRN, email) with merge capability
- Customer-specific commercial terms (payment terms, discounts, tax config)

**API:** `GET/POST /api/customers`, `GET/PUT/DELETE /api/customers/[id]`, `POST /api/customers/merge`
**UI:** `/customers`, `/customers/[id]`, `/customers/[id]/sites`, `/customers/[id]/assets`

### 1.2 Sales Inquiry
**Entity:** `SalesInquiry`

**Fields:**
- Inquiry number (auto), date, source (Web/Phone/Email/Referral)
- Salesperson, assigned sales team
- Customer + Site selection
- Service type: Inspection / Training / Combined
- Equipment/assets, requested scope, courses, trainee quantities
- Requested date, site requirements, documents, special conditions
- Status: `NEW → CONTACTED → QUALIFICATION → QUOTATION_REQUIRED → QUOTED → WON/LOST/ON_HOLD`

**Workflow:** Every quotation must trace to an inquiry or approved exception.

---

## Stage 2 — Quotation & Commercial Approval

### 2.1 Quotation Management
**Entity:** `SalesQuotation`, `SalesQuotationLine`, `SalesQuotationRevision`

**Quotation Structure:**
- Unique number + revision (e.g., `QUO-2024-001234-R1`)
- Customer, site, inquiry reference, salesperson
- Service type + scope
- **Inspection lines:** equipment, quantities, locations
- **Training lines:** courses, trainee quantities, sessions, delivery mode
- **Charges:** labour, travel, equipment, discounts, taxes
- Currency, payment terms, validity dates, commercial conditions
- Attachments, terms, customer-specific requirements
- Calculated totals (subtotal, discount, tax, grand total) — **server-side only**

**States:** `DRAFT → INTERNAL_REVIEW → APPROVED → SENT → ACCEPTED/REJECTED/EXPIRED → REVISED`

**Features:**
- Configurable approval thresholds & authority matrix
- PDF generation with company branding
- Delivery tracking (email/portal) with acceptance evidence
- Revision history preserving previous versions
- Convert accepted quotation → Job Order (one-to-many by service group)
- Duplicate conversion prevention

---

## Stage 3 — Job Order Management

### 3.1 Job Order Structure
**Entity:** `Job`, `JobService`

**Job Header:**
- Parent job number (e.g., `TSC-25678`)
- Customer, site, emirate
- Source inquiry, accepted quotation + revision
- Salesperson, responsible coordinator
- Service lines, quantities, agreed prices, contractual conditions
- Planned dates, priority, job instructions
- Required approvals, payment terms, delivery requirements
- Job owner, status, document history, audit history

**Job Service Lines (one per service activity):**
- Service type: `INSPECTION` | `TRAINING` | `COMBINED`
- Scope: equipment asset / training course
- Quantity, unit price, total price
- Assigned personnel (inspector/trainer)
- Schedule (date, time, location)
- Status: `PLANNED → SCHEDULED → IN_PROGRESS → COMPLETED → APPROVED`
- Linked inspection report / training session / certificate

**Job Numbering:**
- Parent: `TSC-{7-digit}` (e.g., `TSC-25678`)
- Inspection cert: `TSC-25678-01`
- Training cert: `TSC-25678-02`
- Timesheet: `TSC-25678-TS-01`

### 3.2 Job Lifecycle Statuses
```
DRAFT → PENDING_APPROVAL → APPROVED → READY_TO_SCHEDULE 
  → SCHEDULED → IN_PROGRESS → PENDING_REVIEW → PENDING_CERTIFICATION
  → PENDING_COMMERCIAL_CLEARANCE → READY_FOR_DELIVERY 
  → DELIVERED → CLOSED
```
**Exception states:** `ON_HOLD`, `CANCELLED`, `REJECTED`, `REOPENED` (require recorded reasons)

---

## Stage 4 — Job Approval & Readiness Checks

### 4.1 Pre-Scheduling Validation
Before `READY_TO_SCHEDULE`, verify:
- ✅ Accepted quotation or approved non-commercial exception
- ✅ Customer, site, service scope confirmed
- ✅ Required job approvals obtained
- ✅ Required documents & purchase order (if applicable)
- ✅ Site/emirate requirements met
- ✅ Applicable accreditation & personnel authorization
- ✅ Commercial/payment prerequisites per customer contract

**Output:** Blocker list with owner, resolution action, due date — displayed on Job detail page.

---

## Stage 5 — Scheduling & Assignment

### 5.1 Scheduling Engine
**Shared calendar** for inspection & training with:
- Day/week/month views
- Employee availability, leave, working hours, conflicts
- Multi-person, multi-role per service activity
- Inspector assignment by **exact scope + valid authorization**
- Trainer assignment by **exact course + valid qualification**
- Location, travel feasibility, equipment, facility capacity
- Customer preferred dates with rescheduling support

### 5.2 Assignment Rules
| Role | Validated Against |
|------|-------------------|
| Inspector | Equipment category, inspection scope, method/standard, location, validity |
| Trainer | Approved course, delivery method, language, location, capacity, validity |

**Block/Flag if:** Missing, expired, suspended, out-of-scope, unverified
**Display:** Why eligible or blocked on schedule view

---

## Stage 6 — Inspection Execution

### 6.1 Field Execution (`/inspections/[id]/execute`, `/field/inspection/[id]`)
**Context loaded:** Job, JobService, Customer, Site, Equipment, Approved Checklist

**Checklist Answers:**
- Per `ChecklistItem`: PASS / FAIL / NA / **CF (Critical Failure)**
- Measurements (numeric + units)
- Photographs (multiple per item)
- Attachments (PDF, docs)
- Findings: severity (Critical/Major/Minor/Observation), disposition
- Non-conformities: corrective action, responsible party, due date
- Inspector notes, signatures, timestamp

### 6.2 Critical Failure (CF) Handling
- **CF = Unsafe to use** → Immediate Unsafe Equipment Report
- Auto-creates `FailureWorkflow` with corrective action
- Blocks certificate issuance until resolved

### 6.3 Offline Support
- Draft save to local storage (IndexedDB)
- Queued sync via `SyncQueue` table
- Conflict detection (last-write-wins + manual resolution)
- Retry with exponential backoff
- **Never** overwrite newer server records

### 6.4 Results & Submission
- Result: `PASSED` | `FAILED` | `CONDITIONAL` | `FURTHER_INSPECTION`
- Inspector signature + submission timestamp
- Auto-create `InspectionReport` in `SUBMITTED_FOR_REVIEW` status

---

## Stage 7 — Training Execution

### 7.1 Training Session & Enrollment
**Entities:** `TrainingSession`, `Enrollment`, `SessionEnrollment`, `Attendance`, `Assessment`, `AssessmentAttempt`, `CompetencyResult`, `TraineeCompetency`

**Flow:**
1. JobService (TRAINING) → TrainingSession (schedule, trainer, location, capacity)
2. Enroll trainees (from Customer, CustomerSite, or new Trainee)
3. Record attendance per session (check-in/out, breaks)
4. Conduct assessments (written + practical)
5. Evaluate competency (PASS/FAIL/CONDITIONAL)
6. Handle absence, reassessment, appeals

### 7.2 Trainee Identity
- Linked to existing `Employee` if internal
- External trainees: Emirates ID / Passport / Visa / License + photo
- Document capture with crop/compress/preview
- Verified by trainer/assessor

### 7.3 Certificate Eligibility
**Auto-evaluated on:**
- Enrollment status = `COMPLETED`
- All required modules/lessons complete
- Assessment attempts ≥ passing threshold
- Attendance ≥ minimum required
- Trainer/assessor approval recorded

---

## Stage 8 — Findings, Assessments & Corrective Actions

### 8.1 Unified Review Queue (`/review/queue`)
**Item Types:**
- Inspection reports + findings
- Corrective action verifications
- Training attendance + assessments
- Competency decisions
- Missing evidence
- Technical corrections + resubmissions

**Item Structure:**
- Assigned reviewer, status, due date
- Comments, decision history
- Links to underlying records

**Status Flow:**
```
SUBMITTED → UNDER_REVIEW → APPROVED
                ↓
         RETURNED_FOR_CORRECTION / REJECTED
```
**Return preserves** original submission + comments.

---

## Stage 9 — Certificate Generation & Approval

### 9.1 Certificate Generation Trigger
**Only from approved, completed, eligible records:**
- Training: Enrollment `COMPLETED` + assessment passed + trainer approved
- Inspection: Report `APPROVED` + inspection `PASSED` + no open CF

### 9.2 Certificate Types & References

| Type | References |
|------|------------|
| **Inspection** | Customer, site, asset/serial, scope, date, result, standards, inspector, reviewer, issue date, validity, status |
| **Training** | Trainee + employer, course + competency, dates, completion status, trainer/assessor, reviewer, signatory, issue date, validity, status |

### 9.3 Certificate Numbering
**Format:** `TSC-CER-{TYPEID}-{YYYYMMDD}-{REV}`
- TYPEID: 3-digit job type code
- REV: Revision counter (0 = original)

**Uniqueness:** Transaction-safe, DB unique constraint, never reuse issued/revoked/cancelled numbers.

### 9.4 Certificate Template System
**Stored in DB:** `CertificateTemplate` with JSON content
- Configurable branded templates (versioned)
- Placeholders: `{{holderName}}`, `{{courseTitle}}`, `{{issueDate}}`, `{{expiryDate}}`, `{{qrUrl}}`, etc.
- PDF preview, generation, print, authorized download
- QR code → `/verify/[certNumber]`

### 9.5 Certificate Validity Rules
**Per Equipment Category (from `CertificateValidityRule`):**
| Category | Validity | Certificate Type |
|----------|----------|------------------|
| Forklift, Crane, MEWP, Rigging | 6 months | INSPECTION |
| Excavator, Loader, Dozer, Roller | 12 months | INSPECTION |
| Scaffold, Shackle, Falsework | 6 months | INSPECTION |
| Operator Training | 36 months | TRAINING |
| Safety Training | 24 months | TRAINING |

**Rules:**
- Not all courses have same validity
- No auto-expiry if rule unknown
- Support courses with no expiry
- Preserve issued cert data when rules change

---

## Stage 10 — Certificate Lifecycle

### 10.1 Operations & Definitions

| Operation | Description | Creates New Cert? | New Number? |
|-----------|-------------|-------------------|-------------|
| **Reprint** | Existing cert, no new event | No | No |
| **Duplicate** | Controlled copy of existing | No | No (same number, marked DUPLICATE) |
| **Revision** | Controlled correction + reason | No | No (version++) |
| **Renewal** | New certification event + eligibility | Yes | Yes (new sequence) |
| **Re-inspection** | New inspection event linked to previous | Yes | Yes |
| **Replacement** | Lost/damaged, controlled | No | No (marked REPLACEMENT) |

### 10.2 Renewal Management
- Expiry monitoring + configurable reminders
- Renewal requests → follow-up jobs
- Training refresher/reassessment workflow
- Prevent duplicate renewal tasks per cert+event
- Renewal register with owner, status, next action

### 10.3 Data Preservation
- **Never** silently overwrite issued certificates
- Retain original PDFs, revision history, approval evidence, delivery history
- Revoked/superseded certs remain queryable with full history

---

## Stage 11 — Timesheets & Service Evidence

### 11.1 Timesheet Generation
**Source:** Scheduled + performed work (not assumed equal)
- Inspection work hours
- Training delivery hours
- Employee + activity level
- Check-in/out, breaks, travel
- Approved overtime

### 11.2 Timesheet Approval
- Supervisor review → approval
- Configurable company policies for duration calc
- Prevent overlapping entries, duplicate billing
- Lock approved timesheets

### 11.3 Linkage
- Job Order, Quotation, Service Activity, Employee, Invoice

---

## Stage 12 — Invoice & Payment Management

### 12.1 Invoice Generation
**Source:** Accepted quotation lines + performed work + contractual conditions
- Draft & pro-forma support
- Partial & final invoices
- Billing: fixed-price, hourly, daily, travel, additional work
- Time-based billing from **approved timesheets**
- Configurable tax & discount calc

### 12.2 Payment Processing
- Payment terms, due dates, outstanding balances
- Methods: Cash, bank transfer, card, configured online
- Receipts, allocation, partial payments, refunds
- Credit notes, controlled adjustments
- Payment reminders, accounts approval

### 12.3 Certificate Delivery Holds
- **Per customer contract & company policy** (not hardcoded)
- Configurable: full payment / partial / milestone / none

---

## Stage 13 — Delivery Confirmation

### 13.1 Delivery Record
**Entity:** `DeliveryLog`

**Fields:**
- Document(s): cert, report, timesheet, other
- Customer contact + authorized recipient
- Method: Portal download, email, WhatsApp, manual record
- Single + bulk delivery
- Status, date, recipient, method, reference
- Generated files + document versions
- Failure, retry, redelivery tracking
- Customer acknowledgement/signature (where required)

### 13.2 Delivery Rules
- **Not** delivered just because PDF generated
- Requires: successful integration response OR authorized manual confirmation with evidence
- Track per document
- Job closes only when **all required deliverables** delivered or authorized exception

---

## Stage 14 — Job Closure

### 14.1 Closure Validation Checklist
Before `CLOSED`, verify:
- ✅ All inspection/training activities complete
- ✅ Findings + required corrective actions resolved/dispositioned
- ✅ Required technical approvals complete
- ✅ Certificates/reports approved & issued
- ✅ Required timesheets approved
- ✅ Invoice/payment conditions satisfied per contract
- ✅ All required documents have recorded delivery outcome
- ✅ Outstanding actions resolved or authorized exception

### 14.2 Closure UI
- Checklist with passed checks, blockers, exceptions, responsible users
- Only authorized roles can close/reopen
- Full audit history preserved

---

## Data Models Quick Reference

### Core Entity Relationships
```
Company (1) ──< Customer (N)
Customer (1) ──< CustomerSite (N)
CustomerSite (1) ──< CustomerAsset (N)

SalesInquiry (1) ──< SalesQuotation (N)
SalesQuotation (1) ──< SalesQuotationLine (N)
SalesQuotation (1) ──< SalesQuotationRevision (N)

SalesQuotation (accepted) ──> Job (1)
Job (1) ──< JobService (N)  [type: INSPECTION | TRAINING | COMBINED]

JobService (INSPECTION) ──> Inspection (1)
JobService (TRAINING) ──> TrainingSession (N)

Inspection ──> InspectionReport ──> approveReport() ──> Certificate (INSPECTION)
TrainingSession ──> Enrollment ──> checkCourseCompletion() ──> Certificate (TRAINING)

Certificate ──> DeliveryLog ──> Job Closure
```

### Key Enums
```typescript
type JobStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'READY_TO_SCHEDULE' 
  | 'SCHEDULED' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'PENDING_CERTIFICATION' 
  | 'PENDING_COMMERCIAL_CLEARANCE' | 'READY_FOR_DELIVERY' | 'DELIVERED' | 'CLOSED'
  | 'ON_HOLD' | 'CANCELLED' | 'REJECTED' | 'REOPENED';

type JobServiceType = 'INSPECTION' | 'TRAINING' | 'COMBINED';
type JobServiceStatus = 'PLANNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';

type InspectionResult = 'PASSED' | 'FAILED' | 'CONDITIONAL' | 'FURTHER_INSPECTION';
type ChecklistItemStatus = 'PASS' | 'FAIL' | 'NA' | 'CF'; // CF = Critical Failure

type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'WITHDRAWN';
type AssessmentResult = 'PASS' | 'FAIL' | 'CONDITIONAL';

type CertificateStatus = 'DRAFT' | 'ISSUED' | 'REVOKED' | 'EXPIRED' | 'SUSPENDED' | 'RENEWED' | 'REPLACED';
type CertificateType = 'INSPECTION' | 'TRAINING';

type DeliveryMethod = 'PORTAL' | 'EMAIL' | 'WHATSAPP' | 'MANUAL';
type DeliveryStatus = 'PENDING' | 'DELIVERED' | 'FAILED' | 'ACKNOWLEDGED';
```

---

## Security & Compliance

### Tenant Isolation
- Every query/mutation filtered by `companyId` from session
- Middleware enforces on all routes
- Row-level security via Prisma `where: { companyId }`

### Audit Trail
- `AuditLog` on all critical mutations
- Fields: user, action, entity, entityId, previous/new values, timestamp, reason
- Certificate: issuance, revision, reprint, duplicate, renewal, revocation
- Invoice/Payment: creation, adjustment, allocation
- Delivery: confirmation, retry, evidence
- Job: status transitions, approvals, assignments

### Data Protection
- **Never expose:** Emirates ID, passport, visa, private documents, credentials, commercial pricing, payment details
- Public verification (`/verify`) shows only approved fields
- Soft deletes for business records
- Encrypted storage for sensitive documents

---

## Implementation Phases Reference

| Phase | Modules | Key Deliverables |
|-------|---------|------------------|
| 0 | Audit | Gap audit, workflow spec |
| 1 | Customer Sites/Assets | Site/Asset CRUD, linking |
| 2 | Job Services & Approval | JobService CRUD, approval workflow, Quotation→Job |
| 3 | Authorization Matrices | Inspector/Trainer auth, scheduling validation |
| 4 | Inspection Execution | Field page, checklist fill, CF handling, offline sync |
| 5 | Certificate Integration | Auto-gen triggers, numbering, retry safety, lifecycle |
| 6 | Review Queue | Queue UI, review actions, audit trail |
| 7 | Timesheets & Finance | Timesheet gen, invoice gen, payments |
| 8 | Delivery & Closure | Delivery confirmation, closure checklist |
| 9 | Public Verification | Cert# lookup, revoked representation |

---

## Acceptance Tests (Must Pass)

1. **Customer → Site → Assets** flow
2. **Inquiry → Quotation → Job** (combined, multi-service)
3. **Authorized assignment** only (block unauthorized)
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

## Final Notes

- This workflow is the **single source of truth** for implementation
- Every screen, API, and database operation must trace to a stage above
- No placeholder pages, mock data, or success-only messages
- Real persistence, validation, authorization, audit on every action
- Configuration over hardcoding (validity rules, approval thresholds, delivery holds)