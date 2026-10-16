# Sidebar Menu Audit

## 🔴 Problem: Live sidebar ≠ Code sidebar

The **live screenshot** shows the **old sidebar** (from a different layout file or cached build), while [Sidebar.tsx](file:///c:/Users/lenovo/Desktop/certificate%20pro%20gemini/src/components/layout/Sidebar.tsx) has a **newer structure** that doesn't match what's running.

---

## Current Live Sidebar (from screenshot)

| Menu Item | Present |
|-----------|---------|
| Home | ✅ |
| Setup | ✅ |
| **Sales** (expandable) | ✅ |
| ↳ General Setup | ✅ |
| ↳ Sales Person | ✅ |
| ↳ Inspectors | ✅ |
| ↳ Sales Inquiry | ✅ |
| ↳ Sales Quotation | ✅ |
| ↳ Job Order | ✅ |
| ↳ Job Order Assignments | ✅ |
| Inspector Calendar | ✅ |
| Job Performing | ✅ |
| Delivery Confirmation | ✅ |
| Certificate | ✅ |
| Training & Assessment | ✅ |
| Monitoring | ✅ |
| Survey | ✅ |
| Administration | ✅ |

## Code Sidebar (`Sidebar.tsx`)

| Group / Item | Href |
|-------------|------|
| **Workspace** | |
| ↳ Dashboard | `/dashboard` |
| ↳ Global Schedule | `/schedule` |
| ↳ All Certificates | `/certificates` |
| ↳ Bulk ID Upload | `/documents/bulk-upload` |
| ↳ Print Center | `/print-center` |
| ↳ Public Verification | `/verify` |
| **Commercial & Operations** | |
| ↳ Sales / Job Orders | `/jobs` |
| ↳ Schedule & Timeline | `/schedule` |
| ↳ Accounts & Invoicing | `/accounts` |
| ↳ Certificate Delivery | `/delivery` |
| **Training Certification** | |
| ↳ Overview | `/training/overview` |
| ↳ Courses | `/training` |
| ↳ Trainees | `/trainees` |
| ↳ Competencies | `/training/competencies` |
| ↳ Certificates | `/training/certificates` |
| **Inspection Certification** | |
| ↳ Overview | `/inspections/overview` |
| ↳ Inspections | `/inspections` |
| ↳ Findings | `/inspections/findings` |
| ↳ Certificates | `/inspections/certificates` |

## Required per `agent.md` Spec (MISSING from code sidebar)

| Missing Item | Required Route | Priority |
|-------------|---------------|----------|
| **Inspection Schedule** | `/inspections/schedule` | 🔴 High |
| **Inspection Checklists** | `/inspections/checklists` | 🔴 High |
| **Inspection Review** | `/inspections/review` | 🔴 High |
| **Inspection Reschedule** | `/inspections/reschedule` | 🟡 Medium |
| **Training Sessions** | `/training/sessions` | 🔴 High |
| **Training Assessments** | `/training/assessments` | 🔴 High |
| **Training Enrollments** | `/training/enrollments` | 🟡 Medium |
| **Training Reports** | `/training/reports` | 🟡 Medium |
| **Field Training** | `/field` | 🟡 Medium |
| **Admin / Settings** | `/settings/users`, `/settings/roles`, etc. | 🟡 Medium |
| **Customers** | (not in sidebar) | 🟡 Medium |
| **Quotations** | (not in sidebar) | 🟡 Medium |
| **Payments** | (not in sidebar, under Accounts?) | 🟡 Medium |

## ⚠️ Key Issues

1. **The live app is showing an OLD sidebar** that doesn't match `Sidebar.tsx` code — the layout rendering is likely from a different component or cached `.next` build
2. **Many required menu items are missing** from the code sidebar compared to the `agent.md` spec
3. **Duplicate route**: Both "Global Schedule" (Workspace) and "Schedule & Timeline" (Commercial) point to `/schedule`
4. **No Admin/Settings section** in the sidebar at all
5. **No Field Training section** in the sidebar
6. **No Checklists menu item** under Inspections — critical given the user's checklist requirement
