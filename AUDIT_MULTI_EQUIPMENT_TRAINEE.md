# CertAI — Multi-Equipment & Multi-Trainee Audit
**Project:** Offline-First Inspection + Training + Certificate AI SaaS  
**Date:** 2026-10-11  
**Scope:** Audit existing schema, APIs, and UI for multiple equipment assets and multiple trainees per Job Order

---

## 1. Current Schema Analysis

### 1.1 Equipment / Asset Models
| Model | Status | Notes |
|-------|--------|-------|
| **EquipmentAsset** | ❌ **MISSING** | No dedicated equipment asset model exists |
| `Inspection.equipmentAsset` | String (optional) | Free-text field only — no referential integrity, no history, no documents |
| `Job.assets` | Json? | Ad-hoc JSON blob — not queryable, no lifecycle |

**Finding:** No persistent Equipment Asset registry exists. Each inspection stores equipment as a free-text string. Cannot support multiple assets per job, asset history, documents, or duplicate detection.

### 1.2 Trainee / Personnel Models
| Model | Status | Notes |
|-------|--------|-------|
| **Trainee** | ✅ Exists | Full profile with documents, enrollments, competencies, sessions |
| **Enrollment** | ✅ Exists | Course-level enrollment (Trainee ↔ TrainingCourse) |
| **SessionEnrollment** | ✅ Exists | Session-level enrollment (Trainee ↔ TrainingSession) |
| **Attendance** | ✅ Exists | Session-level attendance tracking |
| **AssessmentAttempt** | ✅ Exists | Per-trainee assessment tracking |
| **TraineeCompetency** | ✅ Exists | Per-trainee competency with expiry |

**Finding:** Trainee model is robust and supports multi-trainee per course/session. Enrollment is at course level, SessionEnrollment at session level. Good foundation.

### 1.3 Job / Service Models
| Model | Status | Notes |
|-------|--------|-------|
| **Job** | ✅ Exists | Core entity with jobNumber, customerId, status, etc. |
| **JobService** | ✅ Exists | Links Job → TRAINING or INSPECTION (max 1 of each per job due to `@@unique([jobId, serviceType])`) |
| **Training** | ✅ Exists | Job-level training record (can have multiple TrainingSessions) |
| **TrainingSession** | ✅ Exists | Session with trainer, location, capacity, enrollments |
| **Inspection** | ✅ Exists | Job-level inspection (linked to JobService), has single `equipmentAsset` string |

**Finding:** JobService enforces **one TRAINING and one INSPECTION per job**. This blocks multiple equipment inspections and multiple training courses per job.

### 1.4 Certificate Model
| Model | Status | Notes |
|-------|--------|-------|
| **Certificate** | ✅ Exists | Links to jobId, jobServiceId, courseId, inspectionId. Supports TRAINING/INSPECTION types. |

---

## 2. Current API Analysis

### 2.1 Job APIs
- `POST /api/jobs` — Creates job + optional services array. Each service type allowed once.
- `GET /api/jobs/[id]` — Returns job with jobServices (first inspection, first trainingSession only).
- `POST /api/jobs/[id]/services` — Adds a JobService (TRAINING or INSPECTION).

**Limitation:** Cannot add multiple INSPECTION services to one job.

### 2.2 Inspection APIs
- `POST /api/inspections` — Creates inspection linked to jobServiceId.
- Inspection has single `equipmentAsset` string field.
- No API for listing inspections by equipment asset.

### 2.3 Training APIs
- `POST /api/training/sessions` — Creates session linked to jobId/jobServiceId.
- `POST /api/training/sessions/[id]/enroll` — Enrolls trainees in session.
- Enrollment supports multiple trainees per session.

---

## 3. Current UI Analysis

### 3.1 Job Detail Page (`/jobs/[id]/page.tsx`)
Tabs: Overview, Services, Schedule, Training, Inspection, Documents, Timesheets, Certificates, Payments, Delivery, History

**ServicesTab** — Shows each JobService with first inspection or first trainingSession only.

**TrainingTab** — Shows training sessions for TRAINING services.

**InspectionTab** — Shows inspections for INSPECTION services.

**Limitation:** UI assumes one inspection per inspection service, one training session per training service.

---

## 4. Gap Analysis vs Requirements

| Requirement | Current State | Gap |
|-------------|---------------|-----|
| **Customer Equipment Registry** | ❌ Missing | No EquipmentAsset model, no asset documents, no history |
| **Multiple Equipment per Job** | ❌ Blocked | JobService unique constraint allows only 1 INSPECTION per job |
| **Asset-specific Inspection Records** | ❌ Partial | Inspection has free-text `equipmentAsset`, no FK to asset |
| **Multiple Trainees per Job** | ✅ Supported | Via SessionEnrollment (multiple trainees per session) |
| **Multiple Training Courses per Job** | ❌ Blocked | JobService unique constraint allows only 1 TRAINING per job |
| **Per-trainee Enrollment/Results** | ✅ Supported | SessionEnrollment, Attendance, AssessmentAttempt, TraineeCompetency |
| **Mixed Outcomes per Job** | ❌ Partial | Certificate model supports it but Job/Service structure blocks multiple activities |
| **Parent Job → Child Activities** | ⚠️ Partial | Job → JobService (1:1 per type) → Inspection/TrainingSession (1:N) |

---

## 5. Migration Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **JobService unique constraint** | HIGH | Must drop `@@unique([jobId, serviceType])` and migrate existing data |
| **Inspection.equipmentAsset string** | HIGH | Need new EquipmentAsset model, migrate existing strings to FK |
| **Certificate links** | MEDIUM | Certificate already links to inspectionId and jobServiceId — compatible |
| **TrainingSession.traineeId** | MEDIUM | Single traineeId field on session conflicts with multi-trainee — must ignore/remove |
| **Existing job data** | HIGH | All existing jobs have max 1 inspection service — need migration script |
| **API contracts** | MEDIUM | Frontend expects single inspection/training per service type |
| **UI tabs** | MEDIUM | Must redesign to show multiple assets/trainees per service |

---

## 6. Recommended Schema Changes

### 6.1 New Model: EquipmentAsset
```prisma
model EquipmentAsset {
  id                Int       @id @default(autoincrement())
  companyId         Int
  company           Company   @relation(fields: [companyId], references: [id])
  customerId        Int
  customer          Customer  @relation(fields: [customerId], references: [id])
  assetId           String    // Internal asset ID (e.g., EX-001)
  name              String?   // e.g., "Excavator"
  category          String?   // e.g., "EXCAVATOR", "FORKLIFT", "CRANE"
  type              String?   // Sub-type
  make              String?
  model             String?
  serialNumber      String?
  registrationNumber String? // Fleet/registration number
  specifications    Json?     // Equipment specs relevant to inspection
  site              String?   // Site/location
  locationId        Int?
  location          Location? @relation(fields: [locationId], references: [id])
  status            String    @default("ACTIVE") // ACTIVE, INACTIVE, RETIRED
  hireType          String?   // OWNED, HIRED, THIRD_PARTY
  hireDetails       Json?     // Hire company, contract dates, etc.
  documents         Document[] // Asset documents, photos
  inspections       InspectionRecord[] // Inspection history
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([companyId, assetId])
  @@unique([companyId, serialNumber])
  @@unique([companyId, registrationNumber])
  @@index([companyId, customerId])
  @@index([companyId, status])
  @@index([companyId, category])
}
```

### 6.2 New Model: InspectionRecord (renames/extends Inspection)
```prisma
model InspectionRecord {
  id              Int       @id @default(autoincrement())
  companyId       Int
  company         Company   @relation(fields: [companyId], references: [id])
  jobId           Int
  job             Job       @relation(fields: [jobId], references: [id])
  jobServiceId    Int?
  jobService      JobService? @relation(fields: [jobServiceId], references: [id])
  equipmentAssetId Int
  equipmentAsset  EquipmentAsset @relation(fields: [equipmentAssetId], references: [id])
  inspectorId     Int?
  inspector       User?     @relation(fields: [inspectorId], references: [id])
  inspectionType  String?
  scope           String?   // Inspection scope/checklist reference
  date            DateTime?
  status          String?   // PLANNED, IN_PROGRESS, COMPLETED, etc.
  checklist       Json?
  findings        Json?
  attachments     String[]
  result          String?   // PASS, FAIL, CONDITIONAL
  reviewStatus    String?
  approvalStatus  String?
  certificates    Certificate[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([companyId, jobId])
  @@index([companyId, equipmentAssetId])
  @@index([jobServiceId])
}
```

### 6.3 Modify JobService
```prisma
model JobService {
  // ... existing fields
  // REMOVE: @@unique([jobId, serviceType])
  // ADD: Multiple INSPECTION and TRAINING services per job allowed
  inspectionRecords  InspectionRecord[]
  trainingSessions   TrainingSession[]
}
```

### 6.4 Modify Inspection (deprecate/rename)
- Rename `Inspection` → `InspectionRecord` (or create new, migrate data)
- Add `equipmentAssetId` FK
- Remove free-text `equipmentAsset` string

### 6.5 Modify TrainingSession
- Remove `traineeId` field (conflicts with multi-trainee via SessionEnrollment)

---

## 7. Files Requiring Changes

### Schema & Migrations
1. `prisma/schema.prisma` — Add EquipmentAsset, InspectionRecord, modify JobService, Inspection, TrainingSession
2. New migration file

### Services
3. `src/lib/services/job.service.ts` — Support multiple services per type, link to EquipmentAsset
4. `src/lib/services/equipment-asset.service.ts` — **NEW** Equipment asset CRUD, duplicate detection
5. `src/lib/services/inspection-record.service.ts` — **NEW** InspectionRecord CRUD (replace Inspection service)

### APIs
6. `src/app/api/jobs/route.ts` — Allow multiple services per type
7. `src/app/api/jobs/[id]/services/route.ts` — Allow multiple INSPECTION/TRAINING services
8. `src/app/api/equipment-assets/route.ts` — **NEW** Equipment asset CRUD
9. `src/app/api/equipment-assets/[id]/route.ts` — **NEW** Single asset operations
10. `src/app/api/inspection-records/route.ts` — **NEW** InspectionRecord CRUD
11. `src/app/api/inspection-records/[id]/route.ts` — **NEW** Single inspection record

### UI
12. `src/app/(app)/jobs/[id]/page.tsx` — Redesign Equipment & Inspections tab, Trainees & Training tab
13. `src/components/jobs/EquipmentInspectionTable.tsx` — **NEW** Asset table with add/select/remove
14. `src/components/jobs/TraineeTrainingTable.tsx` — **NEW** Trainee table with course, session, results

---

## 8. Acceptance Test Mapping

| Test | Current Support | Required Changes |
|------|-----------------|------------------|
| 1. ABC Company has 4 assets, 3 trainees | ❌ | EquipmentAsset model + Customer relation |
| 2. Job has 3 excavator + 1 forklift inspections | ❌ | Multiple InspectionRecord per JobService |
| 3. Job has 3 Excavator Operator enrollments | ✅ | Already supported via SessionEnrollment |
| 4. Each inspection links to correct asset | ❌ | InspectionRecord.equipmentAssetId FK |
| 5. Each enrollment links to correct trainee/course | ✅ | Already supported |
| 6. Different asset results/certificates | ❌ | Separate InspectionRecord → Certificate |
| 7. Different trainee outcomes | ✅ | Already supported |
| 8. Reschedule one asset without affecting others | ❌ | Separate InspectionRecord dates |
| 9. Remove item before work = no history loss | ❌ | Soft delete / status-based removal |
| 10. Traceability to parent job/customer/quote/invoice | ✅ | Job → JobService → InspectionRecord chain |
| 11. Tenant isolation | ✅ | All models have companyId |
| 12. Existing data valid after migration | ⚠️ | Migration script required |
| 13. Full UI/API scenario | ❌ | New UI components + API endpoints |

---

## 9. Phase Plan Additions

Add these phases to Master Implementation Plan:

**Phase 2A — Equipment Asset Registry** (after Phase 2 Job Management)
- EquipmentAsset model, CRUD API, duplicate detection, asset documents

**Phase 2B — Multiple Inspection Records per Job** (after Phase 2A)
- InspectionRecord model, remove JobService unique constraint, multiple inspections per job

**Phase 2C — Multi-Training per Job** (after Phase 2B)
- Remove JobService TRAINING unique constraint, multiple training sessions per job

**Phase 2D — Job Detail UI Overhaul** (after Phase 2C)
- Equipment & Inspections tab with asset table
- Trainees & Training tab with trainee table

These insert between Phase 2 (Job Management) and Phase 3 (Trainee/Personnel).