# CERTI AI — SYSTEM ARCHITECTURE
**Document ID:** CERTI-AI-ARCH-002
**Date:** 2026-10-20
**Status:** ARCHITECT MODE — Documentation only

---

## 1. ARCHITECTURAL OVERVIEW

CERTI AI is a Next.js 14 full-stack application following the App Router pattern with server components, server actions, and API route handlers. The application is a single-tenant-first system with multi-tenant scaffold built into the schema via companyId isolation.

```
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER / PWA CLIENT                          │
│   Next.js 14 App Router + Radix UI + Tailwind v4 + Framer Motion│
│   Offline: Workbox Service Worker + IndexedDB (idb)             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                  NEXT.JS SERVER (Node.js)                        │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │  App Router      │  │  API Route        │  │  Middleware    │ │
│  │  (RSC + Client)  │  │  Handlers         │  │  (withAuth)   │ │
│  └─────────────────┘  └──────────────────┘  └────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   SERVICE LAYER                              ││
│  │  JobService  TimesheetService  CertificateService           ││
│  │  InspectionReportService  EnrollmentService  TrainingService ││
│  │  InvoiceService  DeliveryService  CompetencyService         ││
│  │  AccreditationService  QMSService (PLANNED)                 ││
│  │  PermissionService  AuditService  NotificationService       ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   AI ASSISTANT LAYER                         ││
│  │  Provider Interface → OpenRouter (current) / extensible     ││
│  │  AIService: Document Extraction, Scheduling, Competency     ││
│  │  Inspection Quality, Accounts, Delivery, Operations Copilot ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────────┬──────────────────────────────────────┘
                           │ Prisma ORM
┌──────────────────────────▼──────────────────────────────────────┐
│               POSTGRESQL DATABASE                                │
│  40+ models, companyId-scoped, transactional numbering          │
└─────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│               EXTERNAL SERVICES                                  │
│  OpenRouter AI API | File Storage (local/cloud) | Email/SMS     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. DOMAIN ARCHITECTURE (8 domains)

### Domain 1: Company Administration & Quality Management
**Boundary:** Company setup, QMS controls, accreditation management, user authorization

Models (existing): Company, User, Role, Permission, RolePermission, UserPermissionOverride, AuthSession, AuditLog
Models (NEEDED): QMSDocument, InternalAudit, AuditFinding, CorrectiveAction, ManagementReview, ComplaintAppeal, ImpartialityRisk, AccreditationApplication, AccreditationScope, AccreditationAssessment, AccreditationNonconformity

Services (existing): AdminRoleService, AdminUserService, AdminPermissionService, AuditService
Services (NEEDED): QMSService, AccreditationLifecycleService

API Routes (existing): /api/admin/, /api/users/
API Routes (NEEDED): /api/qms/, /api/accreditation/lifecycle/

UI Routes (existing): /admin (users, roles, permissions, audit-logs)
UI Routes (NEEDED): /qms/, /accreditation/

---

### Domain 2: Sales & Customer Management
**Boundary:** Customer relationships, inquiries, quotations, job order creation by Sales

Models (existing): Customer, CustomerSite, CustomerAsset, SalesInquiry, SalesQuotation, QuotationItem, Equipment
Services (existing): Partial — no dedicated SalesService
API Routes (existing): /api/sales/, /api/customers/
UI Routes (existing): /sales/inquiries, /sales/quotations, /customers

GAPS: No customer-specific pricing, no discount approval workflow, no quotation PDF versioning linked to revision number

---

### Domain 3: Scheduling & Site Access
**Boundary:** Job assignment to engineers/trainers, site access pass management, calendar

Models (existing): Job, JobService, Reschedule, Location
Models (NEEDED): SiteAccessPass, PassDocument, EngineerAvailability
Services (existing): Partial
UI Routes (existing): /schedule, /inspections/schedule

CRITICAL GAP: Scheduling does NOT verify engineer scope authorization before assignment. This must be enforced server-side.

---

### Domain 4: Inspection Management
**Boundary:** Equipment inspection execution, checklists, findings, reports, technical review

Models (existing): Inspection, InspectionReport, InspectionReportTemplate, InspectionReportSignature, ChecklistTemplate, ChecklistItem, ChecklistResult, ChecklistItemResult, Equipment, FailureWorkflow, FailureWorkflowStep
Services (existing): InspectionReportService, InspectionReportPDFService
API Routes (existing): /api/inspection/, /api/inspections/, /api/checklists/
UI Routes (existing): /inspections (with schedule, review, checklists, findings, certificates)

GAPS: Inspection.checklist is raw Json instead of using ChecklistResult properly. Two separate route directories (/inspection/ vs /inspections/).

---

### Domain 5: Training Management
**Boundary:** Course delivery, trainee management, attendance, assessment, training certificates

Models (existing): TrainingCourse, TrainingModule, TrainingLesson, Assessment, Question, Training, TrainingSession, Trainee, TraineeDocument, Enrollment, SessionEnrollment, Attendance, LessonProgress, AssessmentAttempt, Trainer, Assessor
Services (existing): TrainingService, SessionService, EnrollmentService, TraineeService, TrainingCertificateGenerator
API Routes (existing): /api/training/, /api/trainees/
UI Routes (existing): /training (assessments, certificates, competencies, enrollments, overview, reports, sessions), /trainees

GAPS: CertificateTemplate not used by PDF generator. Company name hardcoded.

---

### Domain 6: Engineer Competency & Authorization (DOMAIN TO BE BUILT)
**Boundary:** Engineer scope training, witnessed assessments, formal authorization, monitoring

Models (NEEDED):
- EngineerProfile: userId, qualifications, education, previousExperience, technicalExperience, documents
- InspectionScopeTraining: engineerId, scope, trainer, programmeId, theoreticalHours, practicalHours, supervisedInspections, completionStatus
- WitnessedCompetencyAssessment: engineerId, assessorId, jobId, scope, equipment, inspectionDate, criteria(Json), outcome, evidence
- InspectorScopeAuthorization: engineerId, scope, authorizationRef, limitations, authorizingManagerId, effectiveDate, expiryDate, status, approvalHistory(Json)
- InspectorMonitoring: engineerId, monitoredBy, monitorType, outcome, scheduledDate, completedDate, evidence

Services (NEEDED): EngineerAuthorizationService, InspectorMonitoringService, AuthorizationMatrixService

API Routes (NEEDED): /api/engineers/profile, /api/engineers/training, /api/engineers/assessment, /api/engineers/authorization, /api/engineers/monitoring, /api/engineers/matrix

UI Routes (NEEDED): /engineers/, /engineers/authorization, /engineers/matrix

---

### Domain 7: Accounts & Collections
**Boundary:** LPO registration, invoice building, payment collection, reconciliation

Models (existing): Payment, Invoice, InvoiceItem, CreditNote, PaymentCollection
Models (NEEDED): LPO (Letter of Purchase Order)
Services (existing): InvoicePDFService
API Routes (existing): /api/payments/
UI Routes (existing): /accounts

GAPS: LPO not modeled. Payment model near-empty.

---

### Domain 8: Delivery & Dispatch
**Boundary:** Certificate dispatch, delivery confirmation, proof of delivery

Models (existing): DeliveryLog (single cert per log), DeliveryNote
Models (NEEDED): Restructure DeliveryLog to support multiple certificates per dispatch
Services (existing): DeliveryNotePDFService
API Routes (existing): /api/delivery/, /api/certificates/delivery-logs/
UI Routes (existing): /delivery, /delivery-logs

GAPS: Single certificate per delivery log. No AWB tracking. No proof of delivery upload.

---

## 3. COMPLETE BUSINESS FLOW WITH MODULE MAPPING

```
[SALES DOMAIN]
Customer Registration (/customers)
  → Sales Inquiry creation (/sales/inquiries)
  → Sales Quotation with line items (/sales/quotations)
  → Customer Acceptance (quotation status: ACCEPTED)
  → Job Order Creation by Sales (/jobs)

[SCHEDULING DOMAIN]
Job Order received by Scheduling
  → Engineer scope verification (PLANNED: /engineers/authorization)
  → Availability check
  → Assignment to equipment/session
  → Site Access Pass processing (/schedule) [NEEDED]
  → Timesheet auto-generation on Job save

[OPERATIONS DOMAIN]
Inspection: Engineer → Site → Checklist → Findings → Photos → Submit
  (/inspections)
Training: Trainer → Session → Attendance → Assessment → Results
  (/training/sessions)
Timesheets: (/timesheets)

[TECHNICAL REVIEW DOMAIN]
Inspection: Engineer Submit → Evidence Validate → Technical Review → Approved Decision → Certificate Issue
Training: Attendance + Assessment → Training Review → Approved → Certificate Issue
  (/inspections/review, /training/certificates)

[ACCOUNTS DOMAIN]
LPO Registration → Invoice Build → Invoice Approve → Email Dispatch
  (/accounts)
Collections: Engineer Cash → Executive Cheque → Accounts Verify → Bank Deposit
  (/accounts)

[DELIVERY DOMAIN]
Certificate Selection → Delivery Note → Dispatch → Proof of Delivery → Job Closure
  (/delivery, /delivery-logs)

[QMS DOMAIN — NEEDED]
Document Control → Internal Audits → Management Review → Corrective Actions
  (/qms)

[COMPANY ACCREDITATION — NEEDED]
Application → Document Assessment → On-Site Assessment → Granted Scope → Surveillance
  (/accreditation)
```

---

## 4. AUTHENTICATION & AUTHORIZATION ARCHITECTURE

### Current State:
- NextAuth JWT with { id, role(string), companyId }
- withAuth middleware protects all routes
- Role-based checks in API handlers (inconsistent)
- PermissionService checks against database Role/Permission system

### Required State:
- Consolidate User.role (string) and User.roleId (FK) into single FK system
- Middleware: add role-based route guards
- All API handlers must call PermissionService with exact permission names
- Engineer scope authorization checked BEFORE inspection assignment (separate from general RBAC)
- Certificate approval requires Technical Manager role with scope authority over that certificate type

### Permission Naming Convention (to be standardized):
```
{resource}:{action}
Examples:
  certificates:approve
  certificates:issue
  inspections:review
  timesheets:approve
  invoices:approve
  engineers:authorize
  engineers:monitor
  qms:manage
  accreditation:manage
```

---

## 5. AI INTELLIGENCE LAYER ARCHITECTURE

### Current Implementation:
- Provider: OpenRouter only
- Client: src/lib/ai/openrouter.ts
- Service Facade: src/lib/ai/service.ts (11,911 bytes)
- Database: AIConfiguration model per company
- Status: Non-functional (API key empty)

### Target Implementation:
```
AI Provider Interface
  ├── OpenRouterProvider (current)
  ├── GoogleAIProvider (future)
  └── AzureOpenAIProvider (future)

AI Assistants:
  ├── DocumentExtractor — reads LPOs, timesheets, inspection reports
  ├── SchedulingAssistant — ranks eligible engineers (eligibility enforced by rules)
  ├── InspectionQualityChecker — identifies checklist gaps
  ├── CompetencyAssistant — summarizes evidence, flags gaps
  ├── AccreditationAssistant — maps evidence to requirements
  ├── AccountsAssistant — reads LPOs, flags duplicate billing
  ├── DeliveryAssistant — checks dispatch completeness
  └── OperationsCopilot — answers operational questions using live data
```

All AI outputs require human review before updating authoritative records.

---

## 6. DATA INTEGRITY RULES

| Record Type | Identifier Pattern | Uniqueness | Immutability |
|---|---|---|---|
| Job Number | PREFIX-NNNNNN (e.g. TSC-000001) | @unique on jobNumber | Generated at creation |
| Certificate Number | JOBNUMBER-NN (e.g. TSC-000001-01) | @unique on number | Generated at issuance |
| Inspection Report Number | IR-NNNNNN | @unique on reportNumber | Generated at creation |
| Timesheet Number | TS-NNNNNNNN | @unique on timesheetNumber | Generated at creation |
| Invoice Number | INV-NNNNNN | @unique on invoiceNumber | Generated at approval |
| Delivery Note Number | DN-NNNNNN | @unique on noteNumber | Generated at creation |
| Credit Note Number | CN-NNNNNN | @unique on creditNoteNumber | Generated at creation |
| Inquiry Number | INQ-NNNNNN | @unique on inquiryNumber | Generated at creation |
| Quotation Number | QUO-NNNNNN | @unique on quotationNumber | Generated at creation |

All numbering uses transactional generation with uniqueness constraint double-check.

---

## 7. MULTI-TENANCY SCAFFOLD (current state)

Every model has `companyId Int` referencing `Company.id`. This provides:
- Data isolation: all queries must filter by companyId
- No shared data between companies
- Foundation for future SaaS tenant separation

The system currently operates as single-company. The SaaS conversion phase (Phase 10) will add:
- Tenant provisioning
- Subdomain routing
- Per-tenant AI usage billing
- Subscription management

---

## 8. OFFLINE-FIRST ARCHITECTURE

Present in codebase:
- Workbox service worker
- IndexedDB via idb
- SyncQueue model with idempotency keys
- Attendance.isOffline flag
- offline-sync.service.ts

Offline-supported operations: attendance recording, inspection checklist completion
Online-required operations: certificate issuance, invoice approval, all financial decisions

---

## 9. PDF GENERATION ARCHITECTURE

All PDFs generated server-side using PDFKit. Services:
- training-certificate-generator.service.ts — ISSUE: hardcoded company name
- inspection-report-pdf.service.ts
- invoice-pdf.service.ts
- delivery-note-pdf.service.ts
- timesheet-pdf.service.ts
- quotation-pdf.service.ts

Target: PDFs should read from CertificateTemplate.content (Json) for dynamic layouts. Company logo, name, stamp from Company model, not hardcoded constants.

---

## 10. ARCHITECTURE GAPS SUMMARY

| Gap | Priority | Phase |
|---|---|---|
| Engineer scope authorization domain | CRITICAL | Phase 3 |
| Company accreditation lifecycle domain | CRITICAL | Phase 4 |
| QMS document and audit domain | CRITICAL | Phase 3 |
| Fix JobService unique constraint | CRITICAL | Phase 1 |
| Fix hardcoded company name in PDF | CRITICAL | Phase 1 |
| Fix dual role system | HIGH | Phase 1 |
| Fix job number race condition | HIGH | Phase 1 |
| Fix DeliveryLog single-certificate limit | HIGH | Phase 7 |
| Fix Revision model completeness | HIGH | Phase 1 |
| Add LPO model | HIGH | Phase 6 |
| Add Site Access Pass model | HIGH | Phase 5 |
| Provider-independent AI abstraction | MEDIUM | Phase 8 |
| Scheduling scope verification | HIGH | Phase 5 |

---

*End of CERTI AI System Architecture — CERTI-AI-ARCH-002*
