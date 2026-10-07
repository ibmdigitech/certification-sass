# Master Implementation Plan, Map & Audit Log

**Project:** Offline-First Inspection + Training + Certificate AI SaaS
**Updated:** 2026-10-07

---

## 📊 Live Status Table

| Phase | Name | Status | Impl% | Tests | Acceptance | Blocker |
|-------|------|--------|-------|-------|------------|---------|
| 0 | Audit & Preservation | ✅ Complete | 100% | ✅ | ✅ | — |
| 1 | Core Data Architecture | ⏳ Pending | 0% | — | — | Phase 0 |
| 2 | Job Management & Numbering | ⏳ Pending | 0% | — | — | Phase 1 |
| 3 | Trainee / Personnel | ⏳ Pending | 0% | — | — | Phase 2 |
| 4 | Document Management Foundation | ⏳ Pending | 0% | — | — | Phase 3 |
| 5 | ID Capture + Crop + Image | ⏳ Pending | 0% | — | — | Phase 4 |
| 6 | AI/OCR Document Extraction | ⏳ Pending | 0% | — | — | Phase 5 |
| 7 | Document Naming & Matching | ⏳ Pending | 0% | — | — | Phase 6 |
| 8 | Bulk Document Upload | ⏳ Pending | 0% | — | — | Phase 7 |
| 9 | Bulk Job Import & Creation | ⏳ Pending | 0% | — | — | Phase 8 |
| 10 | Training / Inspection Completion | ⏳ Pending | 0% | — | — | Phase 9 |
| 11 | Accreditation & Location Engine | ⏳ Pending | 0% | — | — | Phase 10 |
| 12 | Certificate Numbering Engine | ⏳ Pending | 0% | — | — | Phase 11 |
| 13 | Certificate PDF Generator | ⏳ Pending | 0% | — | — | Phase 12 |
| 14 | QR Verification | ⏳ Pending | 0% | — | — | Phase 13 |
| 15 | Timesheet System | ⏳ Pending | 0% | — | — | Phase 14 |
| 16 | Timesheet PDF | ⏳ Pending | 0% | — | — | Phase 15 |
| 17 | Bulk Certificate & Timesheet Gen | ⏳ Pending | 0% | — | — | Phase 16 |
| 18 | Bulk Print Center | ⏳ Pending | 0% | — | — | Phase 17 |
| 19 | Job Package Generation | ⏳ Pending | 0% | — | — | Phase 18 |
| 20 | Offline Integration | ⏳ Pending | 0% | — | — | Phase 19 |
| 21 | AI Certificate QA | ⏳ Pending | 0% | — | — | Phase 20 |
| 22 | Bulk E2E Testing | ⏳ Pending | 0% | — | — | Phase 21 |
| 23 | Production Hardening | ⏳ Pending | 0% | — | — | Phase 22 |

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

**Job → Trainee → Document → AI Extraction → Training/Inspection → Accreditation/Location → Timesheet → Certificate → QR → Bulk Generation → Printing.**

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

**Status:** ⏳ PENDING

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

**Status:** ⏳ PENDING

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

## 👥 Phase 3 — Trainee / Personnel Management

**Status:** ⏳ PENDING

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

## 📁 Phase 4 — Document Management Foundation

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

## 📸 Phase 5 — ID Capture + Crop + Image Processing

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

## 🤖 Phase 6 — AI/OCR Document Extraction

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

## 🏷️ Phase 7 — Automatic Document Naming & Matching

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

## 📤 Phase 8 — Bulk Document Upload

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

## 📥 Phase 9 — Bulk Job Import & Creation

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

## 🎓 Phase 10 — Training / Inspection Completion

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

## 🏅 Phase 11 — Accreditation & Location Engine

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

## 🔢 Phase 12 — Certificate Numbering Engine

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

## 📜 Phase 13 — Certificate PDF Generator

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

## 🔍 Phase 14 — QR Verification

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

## ⏱️ Phase 15 — Timesheet System

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

## 📄 Phase 16 — Timesheet PDF

**Status:** ⏳ PENDING

### Implement

TimesheetTemplateEngine, TimesheetPDFGenerator

### Output

`TSC-2563741_TIMESHEET.pdf` — print-ready, matches job records.

---

## 📦 Phase 17 — Bulk Certificate & Timesheet Generation

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

## 🖨️ Phase 18 — Bulk Print Center

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

## 📁 Phase 19 — Job Package Generation

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

## 📡 Phase 20 — Offline Integration

**Status:** ⏳ PENDING

### Offline Queue Operations

CREATE_JOB, CREATE_TRAINEE, UPLOAD_DOCUMENT, UPLOAD_PHOTO, CREATE_ATTENDANCE, CREATE_ASSESSMENT, CREATE_TIMESHEET, REQUEST_CERTIFICATE

### Sync Flow

```
Offline → IndexedDB → Sync Queue → Reconnect → Server Validation → Server IDs → Certificate Generation → QR → ISSUED
```

---

## 🧠 Phase 21 — AI Certificate Quality Control

**Status:** ⏳ PENDING

### AI Checks

Name, Job Number, Certificate Number, Accreditation, Location, Dates, Trainer/Engineer, Assessment, Competency, Timesheet, QR, Required Signatures

### AI is quality-control layer, NOT the authority

### Example

```
Certificate QA: ✓ Job ✓ Trainee ✓ Accreditation ✓ Location ✓ Assessment ✓ QR ⚠ Missing Timesheet Approval → STATUS: BLOCKED
```

---

## 🧪 Phase 22 — Bulk E2E Testing

**Status:** ⏳ PENDING

### Test

100 Jobs, 100 Trainees, 100 ID Documents, 100 Photos, 100 Timesheets, 100 Certificates, 100 QR Codes

### Verify

Bulk upload, AI extraction, matching, job creation, certificate generation, QR generation, timesheet generation, ZIP generation, printing, verification.

---

## 🔐 Phase 23 — Production Hardening

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
