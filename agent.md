# MASTER IMPLEMENTATION PLAN UPDATE
# OFFLINE-FIRST INSPECTION + TRAINING + CERTIFICATE AI SAAS

## 1. OBJECTIVE

Update the existing implementation plan and application architecture to support a complete enterprise-grade:

**Training + On-Site Training + Online Training + Identity Document Collection + Assessment + Competency + Certificate + QR Verification + Offline/Online Synchronization + Inspection Authorization platform.**

The application must NOT be treated as a basic LMS.

The core business workflow is:

```text
Trainee
  ↓
Identity / Document Collection
  ↓
Trainee Photo
  ↓
Training Session
  ↓
On-Site / Online / Hybrid
  ↓
Attendance
  ↓
Course / Modules / Lessons
  ↓
Quiz / Assessment
  ↓
Trainer Evaluation
  ↓
Pass / Fail
  ↓
Competency
  ↓
Certificate
  ↓
QR Verification
  ↓
Offline Sync / Cloud Sync
  ↓
Inspection Authorization
  ↓
Inspection Workflow
```

The system must work both:

- ONLINE
- OFFLINE

It must be designed as an offline-first PWA for field trainers and engineers.

---

# 2. FIRST ACTION — AUDIT THE EXISTING PROJECT

Before changing code:

1. Inspect the entire repository.
2. Identify the existing Next.js version.
3. Inspect existing Prisma schema.
4. Inspect existing authentication.
5. Inspect existing User model.
6. Inspect existing Company/Tenant model.
7. Inspect existing RBAC.
8. Inspect existing inspection models.
9. Inspect existing certificate models.
10. Inspect existing storage implementation.
11. Inspect existing API routes.
12. Inspect existing UI/component system.
13. Inspect existing Tailwind/shadcn configuration.
14. Inspect existing PWA/offline functionality.
15. Inspect existing tests.
16. Inspect existing environment variables.

DO NOT delete working functionality.

DO NOT replace existing architecture blindly.

DO NOT create duplicate User, Company, Role, Permission, Certificate, or Inspection models if equivalent models already exist.

Extend existing models where appropriate.

Create an architecture compatibility report before making destructive schema changes.

---

# 3. ARCHITECTURE PRINCIPLE

The platform must be organized into these major domains:

```text
PLATFORM
│
├── Authentication
├── RBAC
├── Multi-Tenant / Companies
├── Users
├── Audit
│
├── TRAINING
│   ├── Programs
│   ├── Courses
│   ├── Modules
│   ├── Lessons
│   ├── Sessions
│   ├── Trainees
│   ├── Documents
│   ├── Attendance
│   ├── Quizzes
│   ├── Assessments
│   ├── Competencies
│   └── Certificates
│
├── INSPECTION
│   ├── Inspection Types
│   ├── Equipment
│   ├── Jobs
│   ├── Scheduling
│   ├── Checklists
│   ├── Evidence
│   ├── Findings
│   ├── Measurements
│   ├── Reviews
│   └── Certificates
│
├── COMMERCIAL
│   ├── Customers
│   ├── Quotations
│   ├── Jobs
│   ├── Payments
│   ├── Invoices
│   └── Delivery
│
└── PLATFORM SERVICES
    ├── Notifications
    ├── File Storage
    ├── QR Verification
    ├── Offline Sync
    ├── AI Services
    └── Audit Logs
```

---

# 4. DESIGN SYSTEM

Use:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/Radix primitives
- Backlight-style design-system architecture
- Modern 21st.dev-inspired UI patterns
- Framer Motion

Do NOT create a collection of unrelated visual components.

Create one central reusable design system.

Suggested structure:

```text
components/
├── ui/
├── layout/
├── navigation/
├── dashboard/
├── training/
├── trainee/
├── assessment/
├── competency/
├── certificate/
├── inspection/
├── offline/
└── shared/
```

Use 21st.dev-style components where they provide real UX value.

Use Framer Motion selectively.

Avoid excessive animations in:

- forms
- inspection checklists
- data-heavy tables
- field workflows
- offline workflows

---

# 5. COMPLETE APPLICATION MAP

Create and maintain this application map:

```text
PUBLIC
│
├── /
├── /login
├── /register
├── /forgot-password
├── /verify-email
├── /verify/certificate/[token]
│
AUTHENTICATED
│
├── /dashboard
│
├── TRAINING
│   ├── /training
│   ├── /training/programs
│   ├── /training/programs/[id]
│   ├── /training/courses
│   ├── /training/courses/[id]
│   ├── /training/courses/[id]/builder
│   ├── /training/modules
│   ├── /training/lessons
│   ├── /training/sessions
│   ├── /training/sessions/[id]
│   ├── /training/sessions/[id]/attendance
│   ├── /training/enrollments
│   ├── /training/assessments
│   ├── /training/competencies
│   ├── /training/certificates
│   └── /training/reports
│
├── TRAINEES
│   ├── /trainees
│   ├── /trainees/new
│   ├── /trainees/[id]
│   ├── /trainees/[id]/documents
│   ├── /trainees/[id]/training
│   ├── /trainees/[id]/assessments
│   └── /trainees/[id]/certificates
│
├── FIELD TRAINING
│   ├── /field
│   ├── /field/today
│   ├── /field/session/[id]
│   ├── /field/trainee/new
│   ├── /field/document-capture
│   ├── /field/photo-capture
│   ├── /field/attendance
│   ├── /field/assessment
│   └── /field/sync
│
├── INSPECTION
│   ├── /inspections
│   ├── /inspections/new
│   ├── /inspections/[id]
│   ├── /inspections/schedule
│   ├── /inspections/checklists
│   ├── /inspections/review
│   ├── /inspections/reschedule
│   └── /inspections/certificates
│
├── CERTIFICATES
│   ├── /certificates
│   ├── /certificates/[id]
│   ├── /certificates/generate
│   ├── /certificates/bulk
│   └── /certificates/verification
│
├── ADMIN
│   ├── /settings/users
│   ├── /settings/roles
│   ├── /settings/permissions
│   ├── /settings/training
│   ├── /settings/certificates
│   └── /settings/system
│
└── OFFLINE
    ├── /offline
    ├── /offline/queue
    ├── /offline/conflicts
    └── /offline/sync
```

---

# 6. TRAINING DOMAIN

Training must support:

- Training programs
- Courses
- Modules
- Lessons
- Videos
- PDFs
- Documents
- Images
- Live sessions
- Practical training
- On-site training
- Online training
- Hybrid training
- Attendance
- Assessments
- Competency
- Certificates

---

# 7. TRAINING PROGRAM

Relationship:

```text
TrainingProgram
    ↓
Course
    ↓
Module
    ↓
Lesson
```

Statuses:

```text
DRAFT
ACTIVE
ARCHIVED
```

---

# 8. COURSE

A course belongs to a TrainingProgram.

A course can have:

- modules
- lessons
- quizzes
- assessments
- competencies
- enrollments

Statuses:

```text
DRAFT
PUBLISHED
ARCHIVED
```

---

# 9. MODULE

Each module belongs to a Course.

Fields:

```text
title
description
order
status
```

---

# 10. LESSON

Support:

```text
VIDEO
DOCUMENT
ARTICLE
LIVE
PRACTICAL
MIXED
```

Each lesson supports:

- content
- video
- PDF
- image
- document
- duration
- completion tracking

---

# 11. TRAINEE DOMAIN

Create a dedicated Trainee entity.

IMPORTANT:

Do NOT assume every trainee must have a system login.

A trainee may simply be a client employee attending training.

Relationship:

```text
Company / Client
       ↓
Trainee
       ↓
Enrollment
       ↓
Training
```

Trainee fields:

```text
id
fullName
dateOfBirth
nationality
photo
company/client
createdAt
updatedAt
```

---

# 12. IDENTITY DOCUMENT COLLECTION

Support:

```text
EMIRATES_ID
PASSPORT
VISA
LICENSE
OTHER
```

Each document may contain:

```text
documentType
documentNumber
issueDate
expiryDate
frontImage
backImage
status
verifiedAt
verifiedBy
```

Statuses:

```text
PENDING
VERIFIED
EXPIRED
REJECTED
```

The application must support:

```text
Camera
Gallery/File upload
Image crop
Image rotation
Compression
OCR
Manual correction
Trainer verification
```

OCR is an assistance mechanism.

Never treat OCR output as automatically verified identity data.

---

# 13. TRAINEE PHOTO

Provide a dedicated live camera capture workflow.

```text
Capture Photo
     ↓
Preview
     ↓
Retake / Accept
     ↓
Compress
     ↓
Store locally/cloud
```

The trainer must be able to capture a trainee photo during on-site training.

The certificate should be able to use the approved trainee photo.

---

# 14. TRAINING SESSION

TrainingSession represents the actual training event.

Modes:

```text
ONSITE
ONLINE
HYBRID
```

Statuses:

```text
DRAFT
SCHEDULED
IN_PROGRESS
COMPLETED
CANCELLED
```

Fields include:

```text
course
trainer
date/time
location
meeting URL
mode
status
```

---

# 15. ATTENDANCE

Attendance must be captured per training session.

Statuses:

```text
PRESENT
ABSENT
LATE
PARTIAL
```

Support:

- check-in
- check-out
- trainer confirmation
- signature
- remarks

For onsite training, attendance must work offline.

---

# 16. TRAINING DELIVERY

## On-Site

```text
Trainer
 ↓
Session
 ↓
Trainee registration
 ↓
ID document
 ↓
Photo
 ↓
Attendance
 ↓
Training
 ↓
Assessment
 ↓
Certificate
```

## Online

```text
Trainer
 ↓
Online session
 ↓
Trainee
 ↓
Attendance
 ↓
Course
 ↓
Assessment
 ↓
Certificate
```

## Hybrid

Support both simultaneously.

---

# 17. QUIZ / ASSESSMENT

Support:

- theory assessment
- practical assessment
- final assessment
- competency assessment

Statuses:

```text
PENDING
IN_PROGRESS
PASSED
FAILED
REQUIRES_RETRAINING
CANCELLED
```

Minimum assessment data:

```text
trainee
course
score
passingScore
assessor
remarks
startedAt
completedAt
status
```

Later support:

- question bank
- randomized questions
- multiple attempts
- answer history
- automatic scoring
- practical scoring
- evidence/photos
- assessor signature

---

# 18. FAILED TRAINING

If trainee fails:

```text
FAILED
   ↓
Trainer explanation
   ↓
REQUIRES_RETRAINING
   ↓
New training session
   ↓
New assessment
```

Do not overwrite the previous assessment.

Maintain complete assessment history.

---

# 19. COMPETENCY

Competency is the bridge between Training and Inspection.

Example:

```text
Course:
Lifting Equipment Inspection Training

        ↓

Competency:
LIFTING_EQUIPMENT_INSPECTION

        ↓

Engineer:
ACTIVE

        ↓

Engineer can be assigned:
Lifting Equipment Inspection
```

UserCompetency must track:

```text
issuedAt
expiresAt
approvedBy
status
```

Statuses:

```text
PENDING
ACTIVE
EXPIRED
SUSPENDED
REVOKED
```

---

# 20. CERTIFICATE

Certificate must contain:

```text
Certificate Number
Trainee Name
Trainee Photo
Course / Training Name
Training Date
Training Mode
Trainer
Issue Date
Expiry Date
Company
Certificate Status
QR Code
Verification Token
PDF
```

Certificate statuses:

```text
DRAFT
PENDING_APPROVAL
ISSUED
EXPIRED
REVOKED
CANCELLED
```

---

# 21. CERTIFICATE GENERATION

Workflow:

```text
Assessment PASSED
       ↓
Trainer approval
       ↓
Technical approval if required
       ↓
Generate certificate number
       ↓
Generate QR token
       ↓
Generate PDF
       ↓
Store certificate
       ↓
Certificate issued
```

QR must point to:

```text
/verify/certificate/[token]
```

The public verification page should show only appropriate certificate information.

Do not expose sensitive identity documents through QR verification.

---

# 22. OFFLINE-FIRST ARCHITECTURE

The application MUST work without internet for field training.

Use:

```text
PWA
+
IndexedDB
+
Service Worker
+
Offline Queue
+
Sync Engine
```

Do NOT use localStorage for large images/documents.

---

# 23. OFFLINE DATA

Cache/synchronize:

```text
Today's sessions
Assigned courses
Trainee records
Training materials
Attendance
Assessment forms
Photos
Documents
Signatures
Pending certificates
Sync queue
```

The device must clearly display:

```text
ONLINE
OFFLINE
SYNCING
SYNC COMPLETE
SYNC FAILED
CONFLICT
```

---

# 24. OFFLINE SYNC QUEUE

Create:

```text
SyncQueue
```

Minimum fields:

```text
id
localId
entityType
operation
payload
createdAt
retryCount
status
serverId
lastError
```

Operations:

```text
CREATE
UPDATE
UPLOAD
DELETE
```

Statuses:

```text
PENDING
SYNCING
SYNCED
FAILED
CONFLICT
```

---

# 25. SYNC RULES

When internet returns:

```text
Local Queue
     ↓
Authenticate
     ↓
Upload records
     ↓
Upload images/documents
     ↓
Resolve dependencies
     ↓
Server validation
     ↓
Generate IDs
     ↓
Generate certificate
     ↓
Return server IDs
     ↓
Mark local records synced
```

Never silently discard offline data.

---

# 26. CONFLICT HANDLING

If the same record changed locally and remotely:

```text
CONFLICT
```

Show:

```text
Local version
Remote version
Changed by
Changed at
```

Allow authorized users to resolve the conflict.

---

# 27. CERTIFICATE OFFLINE RULE

Do NOT pretend a certificate is server-verified when the server has not received the data.

Offline:

```text
Certificate Request
        ↓
PENDING_SYNC
```

After synchronization:

```text
Server Validation
        ↓
Certificate Number
        ↓
QR Verification
        ↓
ISSUED
```

If true offline certificate issuance is a business requirement, implement a cryptographically signed offline certificate mechanism later.

---

# 28. FILE STORAGE

Documents and photos must not be stored directly as database blobs unless there is a specific reason.

Use object storage.

Separate:

```text
training-documents/
trainee-documents/
trainee-photos/
assessment-evidence/
certificates/
inspection-evidence/
```

Apply access control to every file.

Sensitive documents must never be publicly accessible.

---

# 29. SECURITY & PRIVACY

Identity documents are sensitive.

Implement:

- encryption in transit
- secure object storage
- authorization checks
- tenant isolation
- access logging
- download logging
- retention policies
- deletion policies
- least privilege
- secure signed URLs
- no public document URLs

Do not expose:

- Emirates ID images
- passport images
- visa images
- license images

through public certificate verification.

---

# 30. DASHBOARD MAP

Create dedicated dashboards.

## Admin

```text
Companies
Users
Roles
Permissions
Training
Certificates
Audit
System Health
```

## Training Manager

```text
Trainees
Courses
Programs
Sessions
Attendance
Assessments
Competencies
Certificates
Reports
```

## Trainer

```text
Today's Training
My Sessions
Trainees
Attendance
Training Materials
Assessments
Certificates
Offline Sync
```

## Trainee

```text
My Training
Progress
Assessments
Competencies
Certificates
```

## Technical Manager

```text
Pending Approvals
Competency Matrix
Engineer Authorization
Training Expiry
Inspection Eligibility
```

## Engineer

```text
My Competencies
Assigned Inspections
Training Requirements
Inspection History
```

---

# 31. FIELD TRAINER MOBILE WORKSPACE

This is one of the most important interfaces.

Optimize for tablet/mobile.

Main screen:

```text
TODAY

[ Training Session ]

09:00
Lifting Equipment Safety

Location:
Client Site

Trainees: 12

[ Start Session ]

Connectivity:
● Offline
```

During session:

```text
Session
 ├── Overview
 ├── Trainees
 ├── Attendance
 ├── Documents
 ├── Photos
 ├── Training
 ├── Assessment
 ├── Signatures
 └── Complete
```

Use large touch-friendly controls.

---

# 32. TRAINEE REGISTRATION SCREEN

Create a fast field workflow:

```text
New Trainee

[ Scan / Capture ID ]

ID Type:
○ Emirates ID
○ Passport
○ Visa
○ License
○ Other

[ Capture ]

Extracted Information

Name: __________
Document No: ______
Expiry: ___________

[ Confirm ]

[ Capture Trainee Photo ]

[ Continue to Training ]
```

The trainer should not need to navigate through multiple admin screens.

---

# 33. CERTIFICATE DESIGN

Certificate must be professional and printable.

Support:

- A4
- digital PDF
- mobile preview
- QR code
- trainee photo
- certificate number
- training information
- trainer
- company
- issue/expiry
- verification URL

Provide certificate templates configurable by company.

---

# 34. INSPECTION INTEGRATION

Training must eventually control inspection eligibility.

Example:

```text
Engineer
     ↓
Required Competency
     ↓
ACTIVE?
     ↓
Not expired?
     ↓
Authorized?
     ↓
Scheduler can assign inspection
```

If competency expires:

```text
Engineer
     ↓
Inspection assignment
     ↓
Competency expired
     ↓
BLOCK ASSIGNMENT
     ↓
Show reason
     ↓
Training renewal required
```

---

# 35. INSPECTION WORKFLOW

After training module is stable:

```text
Customer
 ↓
Quotation
 ↓
Job
 ↓
Equipment
 ↓
Inspection Type
 ↓
Find qualified engineer
 ↓
Check competency
 ↓
Schedule
 ↓
Inspection
 ↓
Checklist
 ↓
Evidence
 ↓
Findings
 ↓
Engineer submission
 ↓
Technical review
 ↓
Approval
 ↓
Inspection Certificate
```

---

# 36. RESCHEDULING

Support both training and inspection rescheduling.

Reasons:

```text
CLIENT_UNAVAILABLE
TRAINER_UNAVAILABLE
ENGINEER_UNAVAILABLE
EQUIPMENT_UNAVAILABLE
LOCATION_ISSUE
TECHNICAL_ISSUE
WEATHER
DOCUMENT_ISSUE
OTHER
```

Every reschedule must record:

```text
reason
createdBy
createdAt
previousDate
newDate
approvedBy
status
```

---

# 37. NOTIFICATIONS

Prepare notification events for:

```text
Training Scheduled
Training Reminder
Training Cancelled
Assessment Passed
Assessment Failed
Retraining Required
Certificate Issued
Certificate Expiring
Certificate Expired
Competency Approved
Competency Expiring
Inspection Assigned
Inspection Rescheduled
```

Support:

```text
In-app
Email
WhatsApp
```

Integrate external providers later through service adapters.

---

# 38. API MAP

Create APIs grouped by domain.

```text
/api/auth/*
/api/users/*
/api/companies/*

/api/training/programs/*
/api/training/courses/*
/api/training/modules/*
/api/training/lessons/*
/api/training/sessions/*
/api/training/enrollments/*
/api/training/attendance/*
/api/training/assessments/*
/api/training/competencies/*
/api/training/certificates/*

/api/trainees/*
/api/trainees/documents/*
/api/trainees/photos/*

/api/offline/sync/*
/api/offline/conflicts/*

/api/inspections/*
/api/inspections/checklists/*
/api/inspections/reviews/*
/api/inspections/reschedule/*

/api/certificates/verify/*
```

---

# 39. DATABASE IMPLEMENTATION ORDER

Do not create the entire schema in one uncontrolled migration.

Implement:

### Migration 1

```text
TrainingProgram
Course
Module
Lesson
```

### Migration 2

```text
Trainee
TraineeDocument
Enrollment
TrainingSession
TrainingAttendance
```

### Migration 3

```text
Quiz
Assessment
```

### Migration 4

```text
Competency
UserCompetency
```

### Migration 5

```text
TrainingCertificate
```

### Migration 6

```text
OfflineSync / SyncQueue
```

### Migration 7

Inspection extensions.

---

# 40. IMPLEMENTATION PHASES

## PHASE 0 — Existing Application Audit

Acceptance:

- Existing architecture documented
- Existing models identified
- Existing auth identified
- Existing inspection functionality preserved
- No duplicate core entities

---

## PHASE 1 — Design System

Implement:

- App shell
- Sidebar
- Header
- Responsive layout
- Design tokens
- shadcn primitives
- dashboard cards
- tables
- forms
- dialogs
- drawers
- status badges
- command palette
- notifications
- loading states
- empty states

Acceptance:

All major pages use the same design system.

---

## PHASE 2 — Authentication / RBAC / Tenant

Implement:

- login
- logout
- password reset
- email verification
- roles
- permissions
- company isolation
- protected routes
- API authorization
- audit

Acceptance:

A user can only access authorized company/module data.

---

## PHASE 3 — Training Foundation

Implement:

- programs
- courses
- modules
- lessons
- training materials
- course builder

Acceptance:

Admin/Training Manager can create a complete course.

---

## PHASE 4 — Trainee & Documents

Implement:

- trainee registration
- client/company association
- ID document capture
- OCR assistance
- photo capture
- document verification
- expiry tracking

Acceptance:

Trainer can register a trainee from a mobile device.

---

## PHASE 5 — Training Sessions

Implement:

- onsite
- online
- hybrid
- trainer assignment
- scheduling
- attendance

Acceptance:

Trainer can conduct a complete session.

---

## PHASE 6 — Assessment

Implement:

- quiz
- assessment
- scoring
- pass/fail
- practical assessment
- retraining

Acceptance:

Trainee can complete assessment and receive a definitive result.

---

## PHASE 7 — Competency

Implement:

- competency definitions
- user competency
- approval
- expiry
- renewal
- authorization

Acceptance:

A passed course can produce an approved competency.

---

## PHASE 8 — Certificate

Implement:

- certificate template
- numbering
- PDF
- QR
- verification
- expiry
- revocation

Acceptance:

A passed trainee can receive a verifiable certificate.

---

## PHASE 9 — Offline-First

Implement:

- PWA
- service worker
- IndexedDB
- local cache
- offline forms
- offline photos
- offline documents
- sync queue
- retry
- conflict management

Acceptance:

Trainer can complete a training session without internet.

---

## PHASE 10 — Inspection

Implement:

- inspection types
- equipment
- jobs
- assignment
- competency validation
- checklist
- evidence
- findings
- review
- approval
- certificate

---

## PHASE 11 — Commercial

Implement:

- customers
- quotations
- payments
- invoices
- delivery
- WhatsApp/email automation

---

## PHASE 12 — AI

Only after the deterministic workflow works.

AI capabilities:

```text
OCR assistance
Document classification
Training recommendations
Competency gap detection
Rescheduling suggestions
Inspection finding classification
Productivity analytics
Report assistance
```

AI must never silently override compliance decisions.

---

# 41. TESTING REQUIREMENTS

Create automated tests for:

## Trainee

```text
Create
Update
Find by document
Duplicate detection
Photo
Documents
Expiry
```

## Training

```text
Course creation
Enrollment
Session
Attendance
Progress
Quiz
Assessment
Fail
Retraining
```

## Certificate

```text
Generate
Number
PDF
QR
Verify
Expire
Revoke
```

## Offline

```text
Create offline trainee
Capture offline document
Capture offline photo
Attendance offline
Assessment offline
Queue
Reconnect
Sync
Retry
Conflict
```

## Security

```text
Unauthorized access
Tenant isolation
Role permissions
Document access
Certificate privacy
```

---

# 42. ACCEPTANCE CRITERIA FOR THE FIRST RELEASE

The first production milestone is NOT the full inspection system.

Release 1 is complete only when:

```text
✓ Trainer can log in
✓ Trainer can work offline
✓ Trainer can select a training course
✓ Trainer can create/find trainee
✓ Trainer can capture ID
✓ Trainer can capture trainee photo
✓ Trainer can conduct onsite training
✓ Trainer can conduct online training
✓ Trainer can record attendance
✓ Trainee can complete learning
✓ Trainee can complete assessment
✓ Trainer can pass/fail trainee
✓ Failed trainee can be scheduled for retraining
✓ Passed trainee receives competency
✓ Certificate can be generated
✓ Certificate contains QR
✓ QR verification works
✓ Offline records sync correctly
✓ No data is silently lost
✓ Audit trail exists
✓ Mobile/tablet UX works
✓ Desktop dashboard works
✓ Tenant isolation works
```

Only after these acceptance criteria pass should the team move into the complete inspection workflow.

---

# 43. FINAL PRODUCT ARCHITECTURE

The finished product should conceptually operate as:

```text
                    ┌───────────────────┐
                    │     COMPANY       │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │      TRAINEE      │
                    └─────────┬─────────┘
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
        ID DOCUMENT        PHOTO          TRAINING
             │                                 │
             │                         ┌───────┴───────┐
             │                         │               │
             │                       ONSITE          ONLINE
             │                         │               │
             └─────────────────────────┼───────────────┘
                                       ▼
                                  ATTENDANCE
                                       │
                                       ▼
                                   COURSE
                                       │
                                       ▼
                                  ASSESSMENT
                                       │
                              ┌────────┴────────┐
                              │                 │
                            FAIL               PASS
                              │                 │
                              ▼                 ▼
                         RETRAINING         COMPETENCY
                                                │
                                                ▼
                                           CERTIFICATE
                                                │
                                                ▼
                                             QR CODE
                                                │
                                                ▼
                                           VERIFICATION

                                                │
                                                ▼
                                      ENGINEER AUTHORIZATION
                                                │
                                                ▼
                                           INSPECTION
                                                │
                                                ▼
                                        TECHNICAL REVIEW
                                                │
                                                ▼
                                      INSPECTION CERTIFICATE
```

---

# 44. NON-NEGOTIABLE DEVELOPMENT RULES

1. Do not delete existing working features.
2. Do not create duplicate core models.
3. Inspect before modifying.
4. Use migrations for schema changes.
5. Never use mock data as a replacement for real workflows.
6. Never treat OCR as identity verification.
7. Never expose identity documents publicly.
8. Never silently discard offline data.
9. Every offline operation must enter a sync queue.
10. Every important business action must be auditable.
11. Training competency must control inspection eligibility.
12. Certificate verification must be server-authoritative.
13. Mobile field workflows must work offline.
14. Desktop and mobile must provide equivalent business functionality.
15. Use reusable design-system components.
16. Avoid excessive animations.
17. Do not mark a phase complete until its acceptance criteria pass.
18. Run type checking, linting, build and automated tests after each major phase.
19. Preserve backward compatibility with existing data.
20. Do not proceed to the next phase if the current phase has unresolved critical failures.

---

# 45. REQUIRED FINAL ARTIFACTS

After implementation, maintain these documents in the repository:

```text
docs/
├── ARCHITECTURE.md
├── IMPLEMENTATION_PLAN.md
├── DATABASE.md
├── TRAINING_WORKFLOW.md
├── INSPECTION_WORKFLOW.md
├── OFFLINE_SYNC.md
├── CERTIFICATE_SYSTEM.md
├── RBAC.md
├── SECURITY.md
├── API.md
├── DESIGN_SYSTEM.md
├── TEST_PLAN.md
├── DEPLOYMENT.md
└── CHANGELOG.md
```

Also create:

```text
docs/diagrams/
├── system-architecture
├── training-workflow
├── onsite-training
├── online-training
├── certificate-flow
├── offline-sync
├── competency-flow
└── inspection-workflow
```

The implementation agent must update these documents as the system evolves.

# FINAL INSTRUCTION

Do not implement everything in one pass.

Execute the phases sequentially.

For every phase:

1. Inspect.
2. Plan.
3. Implement.
4. Migrate safely.
5. Test.
6. Fix.
7. Update documentation.
8. Verify acceptance criteria.
9. Only then continue.

The first target is:

**OFFLINE-FIRST ON-SITE + ONLINE TRAINING → ASSESSMENT → COMPETENCY → CERTIFICATE → QR VERIFICATION**

The inspection system is the next major domain and must consume the competency/authorization system rather than creating a separate engineer qualification mechanism.