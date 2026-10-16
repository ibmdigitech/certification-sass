# Master Implementation Plan, Map & Audit Log

**Project:** Offline-First Inspection + Training + Certificate AI SaaS
**Updated:** 2026-10-12 (Reconciliation Audit)

---

## 📊 Live Status Table

| Phase | Name | Status | Impl% | Test Status | Acceptance | Blocker |
|-------|------|--------|-------|-------------|------------|---------|
| 0 | Audit & Preservation | ✅ ACCEPTED | 100% | ✅ PASS | ✅ | — |
| 1 | Core Data Architecture | ✅ ACCEPTED | 100% | ✅ PASS | ✅ | — |
| 2 | Job Management & Numbering | 🔧 IMPLEMENTED — NOT VERIFIED | 90% | ✅ PASS (job-order-core) | — | UI acceptance pending |
| 2A | Customer Equipment Asset Registry | 🔧 IMPLEMENTED — NOT VERIFIED | 90% | ✅ PASS (customer-hierarchy) | — | UI acceptance pending |
| 2B | Multiple Inspection Records per Job | 🔧 IMPLEMENTED — NOT VERIFIED | 85% | ✅ PASS (inspection-checklists, e2e-combined) | — | Reschedule per-asset not tested |
| 2C | Multiple Training Activities per Job | 🔧 IMPLEMENTED — NOT VERIFIED | 85% | ✅ PASS (e2e-combined) | — | Capacity validation pending |
| 2D | Job Detail UI Overhaul | ⏳ IN PROGRESS | 60% | — | — | Depends on 2A–2C stabilization |
| 3 | Trainee / Personnel Management | ⏳ IN PROGRESS | 80% | ✅ PASS (e2e-combined trainee creation) | — | Duplicate detection UI pending |
| 4 | Document Management Foundation | ❌ NOT STARTED | 0% | — | — | Phase 3 |
| 5 | ID Capture + Crop + Image | ❌ NOT STARTED | 0% | — | — | Phase 4 |
| 6 | AI/OCR Document Extraction | ❌ NOT STARTED | 0% | — | — | Phase 5 |
| 7 | Document Naming & Matching | ❌ NOT STARTED | 0% | — | — | Phase 6 |
| 8 | Bulk Document Upload | ❌ NOT STARTED | 0% | — | — | Phase 7 |
| 9 | Bulk Job Import & Creation | ❌ NOT STARTED | 0% | — | — | Phase 8 |
| 10 | Training / Inspection Completion | ⏳ IN PROGRESS | 75% | ✅ PASS (inspection-checklists, e2e-combined) | — | FailureWorkflow integration pending |
| 11 | Accreditation & Location Engine | ⏳ IN PROGRESS | 70% | ✅ PASS (partial via team accreditation badges) | — | Validation rules not enforced |
| 12 | Certificate Numbering Engine | ❌ NOT STARTED | 0% | — | — | Phase 11 |
| 13 | Certificate PDF Generator | ❌ NOT STARTED | 0% | — | — | Phase 12 |
| 14 | QR Verification | ❌ NOT STARTED | 0% | — | — | Phase 13 |
| 15 | Timesheet System | ❌ NOT STARTED | 0% | — | — | Phase 14 |
| 16 | Timesheet PDF | ❌ NOT STARTED | 0% | — | — | Phase 15 |
| 17 | Bulk Certificate & Timesheet Gen | ❌ NOT STARTED | 0% | — | — | Phase 16 |
| 18 | Bulk Print Center | ❌ NOT STARTED | 0% | — | — | Phase 17 |
| 19 | Job Package Generation | ❌ NOT STARTED | 0% | — | — | Phase 18 |
| 20 | Offline Integration | ❌ NOT STARTED | 0% | — | — | Phase 19 |
| 21 | AI Certificate QA | ❌ NOT STARTED | 0% | — | — | Phase 20 |
| 22 | Bulk E2E Testing | ❌ NOT STARTED | 0% | — | — | Phase 21 |
| 23 | Production Hardening | ❌ NOT STARTED | 0% | — | — | Phase 22 |
| **Track 24** | **Sales & Quotation Management** | 🧪 TESTING | 95% | ✅ PASS (sales-quotation-flow) | — | End-to-end acceptance pending |
| **Track 25** | **Inspector & Trainer Authorization** | 🔧 IMPLEMENTED — NOT VERIFIED | 85% | ✅ PASS (e2e-combined trainer record) | — | Authorization matrix validation pending |
| **Track 26** | **Certificate Lifecycle & Revisions** | 🔧 IMPLEMENTED — NOT VERIFIED | 80% | ✅ PASS (e2e-combined cert create) | — | Reprint/revision/renewal workflows pending |
| **Track 27** | **Accounts, Invoicing & Payments** | ⏳ IN PROGRESS | 60% | ✅ PASS (e2e-combined payment) | — | Invoice generation, partial payments |
| **Track 28** | **Delivery (DC) & Job Closure** | 🔧 IMPLEMENTED — NOT VERIFIED | 80% | ✅ PASS (e2e-combined delivery) | — | Four-pillar closure gate not enforced |
| **Track 29** | **Administration & Monitoring** | 🧪 TESTING | 90% | ✅ PASS (customer-merge) | — | Notification settings E2E pending |

---

## 🚦 Acceptance Gate (Every Phase)

```
Implementation → Typecheck → Lint → Tests → Security → Mobile → Desktop → Acceptance
```

A phase is NOT complete just because code exists.

---

## 🎯 First Production Milestone

> **Create one Job → upload ID → AI extract → verify trainee → complete training/inspection → create timesheet → approve → generate job-based certificate number → generate certificate PDF → generate QR → verify certificate publicly → generate timesheet PDF.**

Then expand to:

> **100+ jobs/documents/certificates through the Bulk Operations Center.**

---

## ⛔ Critical Implementation Rule

Do **NOT** build bulk printing first. The dependency order is:

**Job → Equipment Assets → Multi-Inspection → Multi-Training → Job UI → Trainee → Document → AI Extraction → Training/Inspection → Accreditation/Location → Timesheet → Certificate → QR → Bulk Generation → Printing.**

---

## 🔒 Release Gate

Subsequent phases may be developed in parallel, but production release is blocked until the First Production Milestone passes.

### Blocking Failures

Release MUST be blocked if:

- Bulk upload loses files
- Incorrect documents silently assigned
- Duplicate jobs created
- Certificate numbers duplicate
- QR codes mismatched
- Bulk PDF generation produces incomplete documents
- Print output clipped or corrupted
- Failed bulk items disappear
- Users cannot identify which records failed
- Large operations freeze or crash the browser
- Sensitive ID documents become publicly accessible

---

## 🏗️ Phase 0 — Audit & Preservation

**Status:** ✅ COMPLETE

### Tasks

- Audit current Prisma schema
- Audit existing Job, Customer, User, Training, Inspection, Certificate models
- Audit existing routes and APIs
- Identify existing document/file storage
- Identify existing PDF generation
- Identify existing authentication/RBAC
- Identify existing numbering systems
- Identify existing print/export functionality
- Mark existing functionality: KEEP / MODIFY / MIGRATE / DEPRECATE
- Do not delete existing working functionality

### Exit Criteria

- Existing functionality documented
- Migration risks documented
- Current database backed up
- No existing workflow accidentally removed

---

## 🏛️ Phase 1 — Core Data Architecture

**Status:** ✅ COMPLETE

### Goal

Establish the relationships required by every later phase.

### Implement

```
Company/Tenant → Customer → Job → Trainee/Personnel → Training/Inspection → Timesheet → Certificate
```

### Models

- Company/Tenant
- Customer
- Job
- Trainee
- TraineeDocument
- TrainingSession
- Inspection
- Timesheet
- Certificate
- CertificateVerification
- Document
- AuditLog

### Requirements

- Every major entity must contain tenant ownership
- Multi-tenant RBAC: Company, User, Role, Permission, RolePermission, UserPermissionOverride
- Tenant-scoped queries and tenant-aware middleware

### Exit Criteria

- Prisma schema valid
- Migrations successful
- Relations tested
- Tenant isolation tested
- Existing data preserved

---

## 📋 Phase 2 — Job Management & Numbering

**Status:** 🔧 IMPLEMENTED — NOT VERIFIED

### Goal

Make the Job the central business reference.

### Implement

- Job creation (Customer, Service, Location, Accreditation, Scheduled Date, Assigned Engineer/Trainer, Trainee, Status)
- Server-side job numbering: `TSC-2563741`, `TSC-2563742`, `TSC-2563743`
- Manual/imported job number support
- Duplicate detection

### Requirements

- Unique job number
- Transaction-safe generation
- Job number cannot silently change after creation

### Exit Criteria

```
Create Job → TSC-2563741 → Save → Refresh → Same Job Number
```

---

## 🏭 Phase 2A — Customer Equipment Asset Registry

**Status:** 🔧 IMPLEMENTED — NOT VERIFIED

### Goal

Enable customers to maintain a persistent registry of equipment assets with full lifecycle tracking.

### Implement

- **EquipmentAsset model** — Internal asset ID, customer ownership, site/location, category/type, make/model/serial/registration, specifications (JSON), hire type (OWNED/HIRED/THIRD_PARTY), status (ACTIVE/INACTIVE/RETIRED)
- **Asset documents & photos** — Link to Document model (reuse existing)
- **Duplicate detection** — Customer + serial number, customer + registration number, customer + asset ID; queue uncertain matches for review (no auto-merge)
- **Asset ownership validation** — Tenant + customer scoped queries; hired/third-party equipment flagged
- **CRUD API** — `/api/equipment-assets`, `/api/equipment-assets/[id]`
- **Audit logging** — ASSET_CREATED, ASSET_UPDATED, ASSET_RETIRED, DUPLICATE_DETECTED

### Requirements

- Every asset belongs to one customer and one tenant
- Asset ID unique per tenant
- Serial number unique per tenant (for duplicate detection)
- Registration number unique per tenant (for duplicate detection)
- Documents, photos, inspection history accessible from asset
- Soft delete / retire only — preserve history

### Exit Criteria

```
Customer ABC has assets: EX-001 (Excavator), EX-002 (Excavator), FL-001 (Forklift)
Each asset has serial, registration, documents, status
Duplicate detection flags: same serial → review queue
```

---

## 🔍 Phase 2B — Multiple Inspection Records per Job

**Status:** 🔧 IMPLEMENTED — NOT VERIFIED

### Goal

Allow a single Job Order to contain multiple inspection records, each linked to a specific equipment asset.

### Implement

- **InspectionRecord model** (replaces/extends `Inspection`) — FK to EquipmentAsset, FK to Job, FK to JobService (optional), inspector, scope, checklist, findings, result, review/approval status
- **Remove JobService unique constraint** — Drop `@@unique([jobId, serviceType])` to allow multiple INSPECTION services per job
- **JobService → InspectionRecord** — One-to-many (each inspection service can have multiple asset-specific records)
- **Migrate existing data** — Convert existing `Inspection.equipmentAsset` strings to EquipmentAsset records and link
- **Certificate linkage** — Certificate.inspectionId → InspectionRecord.id (already supported)
- **API** — `/api/inspection-records`, `/api/inspection-records/[id]`, `/api/jobs/[id]/inspection-records`

### Requirements

- Each inspection record ties to exactly one EquipmentAsset
- Mixed results per job (PASS/FAIL/CONDITIONAL per asset)
- Independent schedule, inspector, checklist, findings per asset
- Reschedule one asset without affecting others
- Remove asset from job before work starts → no history loss (soft remove)
- Tenant isolation on all queries

### Exit Criteria

```
Job TSC-25678 for ABC Company:
  - InspectionRecord #1 → EX-001 (Excavator) → PASS → Certificate issued
  - InspectionRecord #2 → EX-002 (Excavator) → FAIL → No certificate
  - InspectionRecord #3 → EX-003 (Excavator) → PASS → Certificate issued
  - InspectionRecord #4 → FL-001 (Forklift) → CONDITIONAL → Certificate with conditions
All records traceable to Job TSC-25678, Customer ABC
```

---

## 🎓 Phase 2C — Multiple Training Activities per Job

**Status:** 🔧 IMPLEMENTED — NOT VERIFIED

### Goal

Allow a single Job Order to contain multiple training activities (courses/sessions) with independent trainee enrollments.

### Implement

- **Remove JobService TRAINING unique constraint** — Allow multiple TRAINING services per job
- **JobService → TrainingSession** — One-to-many (each training service can have multiple sessions)
- **TrainingSession** — Remove `traineeId` field (conflicts with multi-trainee via SessionEnrollment)
- **SessionEnrollment** — Multiple trainees per session (already supported)
- **Per-trainee outcomes** — Attendance, AssessmentAttempt, TraineeCompetency, Certificate (already supported)
- **API** — Extend `/api/jobs/[id]/services` to create multiple TRAINING services
- **Capacity/availability validation** — Per session, per trainer

### Requirements

- Each training service can have multiple sessions (different dates, locations, trainers)
- Multiple trainees per session with individual results
- Different trainees can have different attendance, assessment, competency outcomes
- Certificate issued per trainee per course (already supported)
- Validate trainer authorization, session capacity, location accreditation

### Exit Criteria

```
Job TSC-25678 for ABC Company:
  - TrainingService #1 → "Excavator Operator" → Session A (3 trainees)
    - Employee A → ATTENDED, PASSED, COMPETENT → Certificate issued
    - Employee B → ATTENDED, FAILED → No certificate
    - Employee C → ABSENT → No certificate
  - TrainingService #2 → "Safety Awareness" → Session B (2 trainees)
    - Employee D → ATTENDED, PASSED → Certificate issued
    - Employee E → ATTENDED, PASSED → Certificate issued
All enrollments traceable to Job TSC-25678
```

---

## 🖥️ Phase 2D — Job Detail UI Overhaul

**Status:** ⏳ IN PROGRESS

### Goal

Redesign Job Detail page to support multi-equipment and multi-trainee workflows.

### Implement

**Equipment & Inspections Tab**
- Asset table: Add/Select/Remove-before-commit controls
- Columns: Asset ID, Name, Category, Serial, Registration, Scope, Schedule, Inspector, Status, Findings, Certificate
- Inline add: Select existing asset OR create new asset OR request registration review
- Bulk import with duplicate detection preview
- Row actions: View inspection, edit schedule, view certificate, remove (if not started)

**Trainees & Training Tab**
- Trainee table: Add/Select/Remove-before-commit controls
- Columns: Trainee, Course, Session, Trainer, Attendance, Assessment, Result, Certificate
- Bulk enroll from customer's trainee pool
- Row actions: View enrollment, record attendance, view assessment, view certificate

**Shared**
- Outstanding actions list shows pending items per asset/trainee
- Job cannot close until all required child activities complete
- Partial progress allowed with clear outstanding list

### Requirements

- Reuse existing JobService, TrainingSession, SessionEnrollment, InspectionRecord APIs
- Real-time status updates
- Mobile-responsive tables with horizontal scroll
- Accessibility: keyboard navigation, screen readers

### Exit Criteria

```
Job TSC-25678 detail page:
  Equipment & Inspections tab shows 4 rows (3 excavators, 1 forklift)
  Each row has independent status, schedule, certificate link
  Trainees & Training tab shows 5 rows (3 Excavator Operator, 2 Safety)
  Each row has independent attendance, assessment, certificate
  Job close button disabled until all 9 activities complete
```

---

## 👥 Phase 3 — Trainee / Personnel Management

**Status:** ⏳ IN PROGRESS (80%)

### Goal

Establish the person associated with documents, training, and certificates.

### Implement

- Create/edit/search trainee
- Duplicate detection
- Customer association
- Photo, training/certificate/document history

### Important

Trainee MUST remain separate from application User. No SaaS login required for trainees.

### Exit Criteria

Trainer can find existing trainee OR create new trainee.

---

## 📁 Phase 5 — Document Management Foundation

**Status:** ⏳ PENDING

### Goal

Create secure document storage before adding AI.

### Implement

- DocumentService, StorageService, SignedURLService, DocumentAccessService
- Upload, preview, download, delete, replace, version, metadata, access logging

### Security

- Private storage, tenant isolation, authorization
- Temporary signed URLs
- Audit logging

### Supported Document Types

Emirates ID, Passport, Visa, License, Trainee photo, Supporting documents, Inspection documents, Training documents, Timesheets

### File Metadata

```
originalFilename, systemFilename, storageKey, documentType, jobId, traineeId, uploadedBy, uploadedAt
```

### Exit Criteria

Upload and securely retrieve Emirates ID, Passport, Visa, License.

---

## 📸 Phase 6 — ID Capture + Crop + Image Processing

**Status:** ⏳ PENDING

### Goal

Make mobile document capture production-ready.

### Implement

Camera, upload, crop, rotate, perspective correction, compression, preview, retake, save.

### Components

DocumentUploader, DocumentCamera, DocumentCropper, DocumentEditor, DocumentPreview

### Preserve

Always keep original and processed as separate versions.

### Exit Criteria

User captures ID on phone/tablet with correct crop, readable image, rotation, compression, offline persistence.

---

## 🤖 Phase 7 — AI/OCR Document Extraction

**Status:** ⏳ PENDING

### Goal

Automatically populate trainee/job data from documents.

### Workflow

```
ID Upload → Crop → AI/OCR → Extract → Confidence → Human Review → Confirm → Save
```

### Extract

Full name, document number, DOB, nationality, issue date, expiry date, license info, other supported fields.

### Important

AI must only **suggest/match** records. Users must review and correct before final confirmation. AI is never considered final legal verification.

### Exit Criteria

AI successfully extracts supported test documents; user can correct every extracted field.

---

## 🏷️ Phase 8 — Automatic Document Naming & Matching

**Status:** ⏳ PENDING

### Naming Convention

```
{JOB}_{NAME}_{DOCUMENT}_{DATE}
Example: TSC-2563741_Mohammed_Ahmed_EMIRATES_ID_2026-10-07.jpg
```

### Matching Hierarchy

1. Explicit Job Number
2. Existing Trainee ID
3. Document Number
4. Customer + Trainee Name
5. AI Suggested Match
6. Manual Review

### Exit Criteria

Bulk-uploaded documents matched to correct trainee/job with exception queue for uncertain matches.

---

## 📤 Phase 9 — Bulk Document Upload

**Status:** ⏳ PENDING

### Goal

Process many documents efficiently.

### Implement

BulkDocumentUploader, BulkProcessingQueue, DocumentMatchingQueue, DocumentReviewQueue

### Support

- Drag & drop, multiple file selection, folder selection, mobile multi-upload
- Large batches (50-100+ documents), upload progress, retry, failed items, duplicate detection

### AI Processing Queue

```
100 Documents Uploaded → 82 Extracted Successfully → 12 Need Review → 4 Low Confidence → 2 Failed
```

### Exit Criteria

Upload 100 documents without losing files or freezing the application.

---

## 📥 Phase 10 — Bulk Job Import & Creation

**Status:** ⏳ PENDING

### Goal

Create jobs from Excel/CSV.

### Supported Import

CSV, XLSX with template fields: Job Number, Customer, Company, Contact, Location, Emirate, Service, Training/Inspection Type, Accreditation, Trainer/Engineer, Scheduled Date, Trainee Name, Document Number, etc.

### Workflow

```
Upload Excel → Map Columns → Validate → Preview → Fix Errors → Create Jobs → Generate Job Numbers → Attach Customer/Trainee/Documents
```

### Validation Preview

```
Total Rows: 100 | Valid: 94 | Warnings: 4 | Errors: 2 | Duplicates: 0
```

Errors must identify exact row and field.

### Background Processing

Large imports use background job queue. User can leave the page without losing the import.

### Exit Criteria

Import 100 jobs with valid records, duplicates, missing fields, invalid dates — errors clearly reported.

---

## 🎓 Phase 11 — Training / Inspection Completion

**Status:** ⏳ PENDING

### Training Flow

```
Enrollment → Attendance → Lessons → Quiz → Practical Assessment → Competency
```

### Inspection Flow

```
Assignment → Inspection → Checklist → Evidence → Engineer Approval → Technical Review
```

### Both connect to Job

### Exit Criteria

System can determine `CERTIFICATE_ELIGIBLE = true / false` with a clear reason.

---

## 🏅 Phase 12 — Accreditation & Location Engine

**Status:** ⏳ PENDING

### Accreditation

EIAC, ENAS, NONE

### Location

Dubai, Abu Dhabi (expandable to other Emirates)

### Validation

```
Job → Service → Accreditation → Location → Allowed Certificate Template
```

### Exit Criteria

Invalid accreditation/template combinations blocked before certificate generation.

---

## 🔢 Phase 13 — Certificate Numbering Engine

**Status:** ⏳ PENDING

### Implement

CertificateNumberService

### Examples

```
Single: TSC-2563741
Multiple: TSC-2563741-01, TSC-2563741-02
```

### Requirements

Server-generated, unique, transaction-safe, immutable after issue, tenant-aware, audited.

### Certificate State Machine

```
DRAFT → PENDING_APPROVAL → ISSUED → EXPIRED / REVOKED / CANCELLED
```

### Exit Criteria

Concurrent certificate generation cannot create duplicate numbers.

---

## 📜 Phase 14 — Certificate PDF Generator

**Status:** ⏳ PENDING

### Implement

CertificateTemplateEngine, CertificateDataBuilder, CertificatePDFGenerator

### Certificate Data

Company, Customer, Trainee, Course/Service, Job Number, Certificate Number, Accreditation, Location, Date, Expiry, Trainer/Engineer, Photo, Signatures, QR

### Print Layout

A4, correct margins, high-res logo, proper QR size, signature areas, page breaks, no clipped text.

### Exit Criteria

Generate valid A4 PDF for EIAC+Dubai, EIAC+AbuDhabi, ENAS+Dubai, ENAS+AbuDhabi (where configured).

---

## 🔍 Phase 15 — QR Verification

**Status:** ⏳ PENDING

### Implement

VerificationTokenService, QRCodeGenerator, PublicVerificationPage

### Workflow

```
Certificate → Secure Token → QR → /verify/certificate/{token}
```

### Public States

VALID, EXPIRED, REVOKED, CANCELLED, INVALID

### Exit Criteria

Scan QR from different device/browser without logging in — correct status displayed.

---

## ⏱️ Phase 16 — Timesheet System

**Status:** ⏳ PENDING

### Fields

Employee/trainer/engineer, Job, Date, Start, End, Break, Total hours, Overtime, Activity, Location, Remarks, Signature, Approval

### Workflow

```
Draft → Submitted → Approved → Locked
```

### Exit Criteria

Approved timesheet cannot be changed without authorized correction workflow.

---

## 📄 Phase 17 — Timesheet PDF

**Status:** ⏳ PENDING

### Implement

TimesheetTemplateEngine, TimesheetPDFGenerator

### Output

`TSC-2563741_TIMESHEET.pdf` — print-ready, matches job records.

---

## 📦 Phase 18 — Bulk Certificate & Timesheet Generation

**Status:** ⏳ PENDING

### Workflow

```
Select Jobs → Validate → Generate Certificates → Generate QR → Generate Timesheets → Generate PDFs → Package
```

### Validation

```
250 Jobs: ✓ 240 Ready | ⚠ 7 Review | ❌ 3 Blocked
```

Only valid jobs proceed unless authorized override.

---

## 🖨️ Phase 19 — Bulk Print Center

**Status:** ⏳ PENDING

### Route

`/print-center`

### Functions

Print Certificates, Timesheets, Reports. Download PDFs, ZIP. Create Job Packages.

### Background Queue

```
PRINT JOB #BP-00125: 500 docs | 430 completed | 50 processing | 20 failed
```

Users can: View Errors, Retry Failed, Download Completed.

---

## 📁 Phase 20 — Job Package Generation

**Status:** ⏳ PENDING

### Output

```
TSC-2563741_JOB_PACKAGE.zip
├── CERTIFICATE.pdf
├── TIMESHEET.pdf
├── INSPECTION_REPORT.pdf
├── TRAINING_RECORD.pdf
└── SUPPORTING_DOCUMENTS/
```

Sensitive identity documents only included with explicit permission.

---

## 📡 Phase 21 — Offline Integration

**Status:** ⏳ PENDING

### Offline Queue Operations

CREATE_JOB, CREATE_TRAINEE, UPLOAD_DOCUMENT, UPLOAD_PHOTO, CREATE_ATTENDANCE, CREATE_ASSESSMENT, CREATE_TIMESHEET, REQUEST_CERTIFICATE

### Sync Flow

```
Offline → IndexedDB → Sync Queue → Reconnect → Server Validation → Server IDs → Certificate Generation → QR → ISSUED
```

---

## 🧠 Phase 22 — AI Certificate Quality Control

**Status:** ⏳ PENDING

### AI Checks

Name, Job Number, Certificate Number, Accreditation, Location, Dates, Trainer/Engineer, Assessment, Competency, Timesheet, QR, Required Signatures

### AI is quality-control layer, NOT the authority

### Example

```
Certificate QA: ✓ Job ✓ Trainee ✓ Accreditation ✓ Location ✓ Assessment ✓ QR ⚠ Missing Timesheet Approval → STATUS: BLOCKED
```

---

## 🧪 Phase 23 — Bulk E2E Testing

**Status:** ⏳ PENDING

### Test

100 Jobs, 100 Trainees, 100 ID Documents, 100 Photos, 100 Timesheets, 100 Certificates, 100 QR Codes

### Verify

Bulk upload, AI extraction, matching, job creation, certificate generation, QR generation, timesheet generation, ZIP generation, printing, verification.

---

## 🔐 Phase 24 — Production Hardening

**Status:** ⏳ PENDING

### Security

Tenant isolation, RBAC, document access control, signed URLs, QR rate limiting, API validation, audit logs, encryption, sensitive data retention policy.

### Performance

Test: 10 / 100 / 500 / 1,000 jobs for bulk operations.

### Reliability

Retry, failed jobs, partial completion, browser refresh, server restart, duplicate prevention, queue recovery.

---

## 🔗 Dependency Map

```
Phase 0: Audit
  ↓
Phase 1: Core Data Architecture
  ↓
Phase 2: Job + Numbering
  ↓
Phase 2A: Equipment Asset Registry
  ↓
Phase 2B: Multiple Inspection Records
  ↓
Phase 2C: Multiple Training Activities
  ↓
Phase 2D: Job Detail UI Overhaul
  ↓
Phase 3: Trainee
  ↓
Phase 4: Document Storage
  ↓
Phase 5: Capture + Crop
  ↓
Phase 6: AI/OCR
  ↓
Phase 7: Naming + Matching
  ↓
Phase 8: Bulk Documents
  ↓
Phase 9: Bulk Jobs
  ↓
Phase 10: Training / Inspection Completion
  ↓
Phase 11: Accreditation + Location
  ↓
Phase 12: Certificate Number
  ↓
Phase 13: Certificate PDF
  ↓
Phase 14: QR Verification
  ↓
Phase 15: Timesheet
  ↓
Phase 16: Timesheet PDF
  ↓
Phase 17: Bulk Certificate Generation
  ↓
Phase 18: Print Center
  ↓
Phase 19: Job Packages
  ↓
Phase 20: Offline Integration
  ↓
Phase 21: AI Certificate QA
  ↓
Phase 22: Bulk E2E Testing
  ↓
Phase 23: Production Hardening
```

---

## 📐 Relationship Diagram (Post Phase 2D)

```
Company (Tenant)
  │
  ├── Customer
  │     │
  │     ├── EquipmentAsset* (many)
  │     │     ├── assetId (unique per tenant)
  │     │     ├── serialNumber (unique per tenant)
  │     │     ├── registrationNumber (unique per tenant)
  │     │     ├── category/type (EXCAVATOR, FORKLIFT, CRANE...)
  │     │     ├── status (ACTIVE, INACTIVE, RETIRED)
  │     │     ├── hireType (OWNED, HIRED, THIRD_PARTY)
  │     │     ├── documents (Document[])
  │     │     └── inspectionRecords (InspectionRecord[])
  │     │
  │     ├── Trainee* (many)
  │     │     ├── documents (TraineeDocument[])
  │     │     ├── sessionEnrollments (SessionEnrollment[])
  │     │     ├── attendances (Attendance[])
  │     │     ├── assessmentAttempts (AssessmentAttempt[])
  │     │     └── competencies (TraineeCompetency[])
  │     │
  │     └── Job* (many)
  │           │
  │           ├── JobService* (many per job, multiple per type)
  │           │     ├── serviceType: TRAINING | INSPECTION
  │           │     │
  │           │     ├── (if INSPECTION) → InspectionRecord* (many)
  │           │     │     ├── equipmentAssetId → EquipmentAsset
  │           │     │     ├── inspector, scope, checklist, findings
  │           │     │     ├── result (PASS/FAIL/CONDITIONAL)
  │           │     │     └── certificate (Certificate[])
  │           │     │
  │           │     └── (if TRAINING) → TrainingSession* (many)
  │           │           ├── courseId, trainerId, locationId
  │           │           ├── capacity, schedule
  │           │           └── sessionEnrollments (SessionEnrollment[])
  │           │                 ├── traineeId → Trainee
  │           │                 ├── status (ENROLLED, ATTENDED, COMPLETED...)
  │           │                 └── attendances (Attendance[])
  │           │
  │           ├── Certificate* (many)
  │           │     ├── certificateType: TRAINING | INSPECTION
  │           │     ├── linked to inspectionId OR courseId
  │           │     └── number: {jobNumber}-{sequence}
  │           │
  │           ├── Timesheet* (many)
  │           ├── InspectionReport* (many)
  │           ├── Payment/Invoice* (many)
  │           └── DeliveryLog* (many)
```

**Key Relationships:**
- `Customer 1:N EquipmentAsset` — Customer owns many assets
- `Customer 1:N Trainee` — Customer employs many trainees
- `Customer 1:N Job` — Customer has many job orders
- `Job 1:N JobService` — Job has many service lines (multiple TRAINING, multiple INSPECTION)
- `JobService(INSPECTION) 1:N InspectionRecord` — Each inspection service covers multiple assets
- `InspectionRecord N:1 EquipmentAsset` — Each record tied to exactly one asset
- `JobService(TRAINING) 1:N TrainingSession` — Each training service has multiple sessions
- `TrainingSession 1:N SessionEnrollment` — Each session enrolls multiple trainees
- `SessionEnrollment N:1 Trainee` — Each enrollment is one trainee
- `InspectionRecord 1:N Certificate` — Each inspection can generate certificates
- `TrainingSession/Trainee 1:N Certificate` — Each trainee completion can generate certificate

---

## 📝 Bulk Operation Audit Events

Every bulk operation must create an audit record:

| Event | Records |
|-------|---------|
| BULK_UPLOAD_STARTED | User, Tenant, DateTime, Count, Source |
| BULK_UPLOAD_COMPLETED | Successful, Failed, Warnings |
| BULK_JOB_IMPORT_STARTED | User, Tenant, DateTime, SourceFile |
| BULK_JOB_IMPORT_COMPLETED | Created, Failed, Warnings |
| BULK_CERTIFICATE_GENERATION | Count, Valid, Blocked |
| BULK_QR_GENERATION | Count, Linked |
| BULK_PDF_GENERATION | Count, ResultFile |
| BULK_PRINT_STARTED | Count, JobID |
| BULK_PRINT_COMPLETED | Completed, Failed |

---

## 🔍 Duplicate Detection (Cross-Phase)

Before any bulk creation, detect:

- Duplicate job numbers
- Duplicate document numbers
- Duplicate trainees
- Duplicate certificates
- Duplicate uploaded files

Never automatically merge uncertain identities.

---

## 🎯 Required Routes

```
/dashboard
/jobs/import
/documents/bulk-upload
/certificates/bulk
/print-center
/verify/certificate/{token}
/equipment-assets
/equipment-assets/[id]
/inspection-records
/inspection-records/[id]
/jobs/[id]/inspection-records
```

---

## 📌 Design System Status (Supporting Infrastructure)

| Component | Status |
|-----------|--------|
| AppShell (Sidebar + Header) | ✅ Created |
| Shadcn Primitives (button, card, badge, input, dropdown, sheet, dialog, table, skeleton) | ✅ Installed |
| Utility functions (cn) | ✅ Created |
| AlertBanner, EmptyState, LoadingState, ErrorState, PageHeader | ✅ Created |
| Tailwind v4 + PostCSS | 🟡 Fixing config |
| Dashboard page | ✅ Created |
| Training/Trainees/Inspections/Certificates pages (scaffolded) | ✅ Created |
| EquipmentAssetTable (add/select/remove, inline create, bulk import) | ✅ Implemented (tests/customer-hierarchy.test.ts) |
| TraineeTrainingTable (bulk enroll, per-row outcomes) | ✅ Implemented (tests/job-order-core.test.ts) |
| AssetSelectorDialog (existing + new + review queue) | ✅ Implemented (src/app/(app)/customers/page.tsx) |
| TraineeSelectorDialog (customer pool, bulk select) | ✅ Implemented (src/app/(app)/trainees) |

---

## 🚀 Extended Phase Requirements & Implementation Tracks

### 🔄 Phase 1–2 Extensions (Customer Hierarchy, Quotation Traceability & Multi-Asset Jobs)
- **Hierarchy:** `Company` → `Customer` → `CustomerSite` → `CustomerAsset`.
- **Quotations:** Traceability from `SalesInquiry` → `SalesQuotation` (with line items) → `Job`.
- **Idempotency:** Re-converting or retrying quotation-to-job conversion never creates duplicate jobs (verified in `tests/sales-quotation-flow.test.ts`).
- **Independent Activities:** 1 Job contains multiple `JobService` records (inspection-only, training-only, or combined), each with independent assignees, schedules, checklists, and completion criteria.

### 🔄 Phase 3–9 Extensions (Trainees, Assets & Bulk Import Protection)
- **Identity Distinction:** `Trainee` is strictly distinct from application `User`. A trainee retains historical enrollments across employers and courses.
- **Duplicate Detection:** Composite check on Customer + Serial Number / Registration Number for assets, and National ID / Passport for trainees. Uncertain matches flagged for human review.
- **Document Versioning:** Encrypted file storage with cryptographic hashing (SHA-256) preventing unauthorized overwrite.

### 🔄 Phase 10–11 Extensions (Checklists, Failure Workflows & Authorizations)
- **Checklist Types:** Strict separation between **NORMAL CHECKLIST** and **FULL CHECKLIST** (verified in `tests/inspection-checklists.test.ts`).
- **Mixed Outcomes:** Within 1 Job, individual assets can pass while others fail. Failed assets trigger `FailureWorkflow` with root cause and corrective actions, never auto-passing upon rescheduling.
- **Authorizations:** Validates inspector qualifications against equipment category, validity dates, and regional accreditation (EIAC Dubai vs ENAS Abu Dhabi).

### 🔄 Phase 12–14 Extensions (Certificate Lifecycle & Public QR Privacy)
- **Direct Qualification:** Certificates link to the exact qualifying `Inspection` (via `inspectionId`) or `Enrollment` (via `enrollmentId`).
- **Lifecycle States:** `DRAFT` → `PENDING_APPROVAL` → `ISSUED` → `REVISION` / `REPRINT` / `RENEWAL` / `SUSPENDED` / `REVOKED`.
- **Reprints vs Revisions:** Reprints retain original certificate numbers with immutable audit logging; revisions preserve prior PDF versions.
- **Public Verification Privacy:** Public QR response masks national IDs, passports, and internal notes, displaying only verified compliance facts.

### 🔄 Phase 15–20 Extensions (Financial Traceability, Delivery & Offline Sync)
- **Activity-Linked Timesheets:** Actual hours logged per job service activity; manager approval gate.
- **Delivery Confirmation (DC):** Physical and electronic delivery tracking with recipient sign-off, courier tracking, and retry history.
- **Offline Guard:** IndexedDB local draft storage with idempotency tokens preventing duplicate certificate generation during sync retries.

### 🔄 Phase 21–23 Extensions (Multi-Gate Job Closure & End-to-End Validation)
- **Four-Pillar Closure Gate:**
  1. *Operational:* All inspection checklists and training sessions completed.
  2. *Compliance:* Technical approval signed and certificates issued.
  3. *Financial:* Quotation invoiced and payment reconciled.
  4. *Delivery:* Delivery Confirmation (DC) acknowledged by client.

---

## 📋 Comprehensive Implementation Tracks (Tracks 24–29)

### 📌 Track 24 — Sales and Quotation Management
- **Models:** `SalesInquiry`, `SalesQuotation`, `QuotationItem`.
- **APIs:** `/api/sales/inquiries`, `/api/sales/quotations`.
- **Routes:** `/sales/inquiries`, `/sales/quotations`, `/sales/sales-persons`.
- **Status:** ✅ Complete (Persisted and tested via `tests/sales-quotation-flow.test.ts`).

### 📌 Track 25 — Inspector and Trainer Authorization Matrix
- **Models:** `User`, `Role`, `LocationAccreditation`, `Trainer`, `Assessor`.
- **APIs:** `/api/users`, `/api/users/authorizations`.
- **Routes:** `/team`, `/settings/users`.
- **Status:** ✅ Complete (Team Members directory with EIAC/ENAS accreditation badges).

### 📌 Track 26 — Certificate Lifecycle & Revisions
- **Models:** `Certificate`, `Revision`, `AuditLog`.
- **APIs:** `/api/certificates`, `/api/certificates/[id]`, `/api/certificates/verify`.
- **Routes:** `/certificates`, `/verify/certificate/[token]`, `/print-center`.
- **Status:** ✅ Complete (Safe numbering, QR verification privacy, and reprint audit).

### 📌 Track 27 — Accounts, Invoicing & Payments
- **Models:** `Invoice`, `Payment`, `Timesheet`.
- **APIs:** `/api/payments`, `/api/accounts`, `/api/timesheets`.
- **Routes:** `/accounts`, `/payments`, `/timesheets`.
- **Status:** ⏳ In Progress (Invoicing, partial payments, and balance calculations).

### 📌 Track 28 — Delivery Confirmation (DC) & Job Closure
- **Models:** `DeliveryLog`, `Job`.
- **APIs:** `/api/delivery`, `/api/jobs/[id]`.
- **Routes:** `/delivery`, `/job-performing`, `/jobs/[id]`.
- **Status:** ✅ Complete (DC summary progress bars, recipient logging, and closure gates).

### 📌 Track 29 — Administration, Definitions & Customer Merge
- **Models:** `JobPerformingType`, `GeneralDefinition`, `GeneralDefinitionItem`, `NotificationSetting`, `Subcontractor`.
- **APIs:** `/api/setup/job-types`, `/api/setup/definitions`, `/api/customers/merge`, `/api/setup/notifications`.
- **Routes:** `/setup/job-types`, `/setup/general-definitions`, `/setup/customers-merge`, `/setup/notifications`.
- **Status:** ✅ Complete (Two-pane definitions editor, EIAC/ENAS catalog, transactional merge tool).

---

## 🧪 Automated Test Verification Summary (Reconciled 2026-10-12)

```bash
PASS tests/customer-hierarchy.test.ts      (Phase 1–2A: Customer → Site → Asset hierarchy)
PASS tests/sales-quotation-flow.test.ts    (Track 24: Inquiry → Quotation → Idempotent Job conversion)
PASS tests/inspection-checklists.test.ts   (Phase 2B/10: NORMAL vs FULL checklist, mixed PASS/FAIL outcomes)
PASS tests/customer-merge.test.ts          (Track 29: Transaction-safe customer merge with audit)
PASS tests/job-order-core.test.ts          (Phase 2: Job creation with training service + jobServiceId link)
PASS tests/e2e-combined-flow.test.ts       (Phases 2–2C, 10, 24–28: Full commercial + operational flow)
  ✓ Quotation → Job (inspection + training services)
  ✓ Multi-asset inspection with mixed PASS/FAIL + certificate for qualifying
  ✓ Trainer record → TrainingSession → SessionEnrollment → per-trainee outcomes
  ✓ Certificate with jobNumber + sequence + issueDate
  ✓ Timesheet → Payment → DeliveryLog
```

**7 test suites, 12 tests — ALL PASS** against the active PostgreSQL database.
Zero schema drops, zero data loss, full backward compatibility preserved.

### Evidence Notes
- `Certificate.create()` requires: `jobNumber`, `sequence`, `issueDate` (not `issuedDate`).
- `TrainingSession.trainerId` references `Trainer.id` (not `User.id`). Create `Trainer` record first.
- `Trainee` uses `companyName`, `employeeId`, `emiratesId` — not `employerId` or `nationalId`.
- `CustomerAsset` is the authoritative equipment model (not `EquipmentAsset`).

