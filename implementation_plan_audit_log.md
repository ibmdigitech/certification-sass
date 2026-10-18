# Implementation Plan, Map & Audit Log

**Project:** CertAI SaaS — Offline-First Inspection + Training + Certificate AI SaaS  
**Date:** 2026-10-15 (Admin Panel Completion)  
**Status:** Admin Panel (Track 29) — ✅ COMPLETE

---

## ✅ Completed: Administration & Monitoring (Track 29)

### What was fixed:

1. **AdminDashboard.tsx** — Removed corrupted `iframe` from Table import; rewrote to use self-contained panel components instead of broken inline implementations with scope issues.

2. **AdminUsersPanel.tsx** — Rewrote to be self-contained: manages own state (users, search, filters, dialogs), fetches from `/api/admin/users`, handles create/update/delete via REST API.

3. **AdminRolesPanel.tsx** — Created new: self-contained panel with search, create/edit/delete, permission display badges, integrated RoleCreateDialog and RoleEditDialog.

4. **AdminPermissionsPanel.tsx** — Created new: self-contained panel listing permissions in a table with search functionality.

5. **AdminAuditLogsPanel.tsx** — Created new: self-contained panel with pagination, level filtering, search, and export functionality.

6. **AdminSystemPanel.tsx** — Created new: displays system stats cards (users, jobs, certificates, inspections, response time) and configuration details.

7. **UserCreateDialog.tsx** — Added missing `Plus` icon import; removed DialogTrigger button to avoid double rendering when used as controlled dialog.

8. **UserEditDialog.tsx** — Removed DialogTrigger to avoid double rendering.

9. **RoleCreateDialog.tsx** — Rewrote to use native `<input type="checkbox">` instead of non-existent `@/components/ui/checkbox`; fetches permissions from API.

10. **RoleEditDialog.tsx** — Rewrote to use native checkboxes instead of invalid `multiple` prop on shadcn Select.

11. **Services fixed:**
    - `admin-user.service.ts` — Fixed `role` → `roleRef` in Prisma includes; removed non-existent User fields (phone, department, etc.); added required `passwordHash`.
    - `admin-role.service.ts` — Fixed permission ID types from `string[]` to `number[]`; guarded against empty permission arrays.
    - `audit.service.ts` — Removed non-existent `reason` field from AuditLog create; added proper AuditLogData interface.
    - `permission.service.ts` — Fixed `userPermission` → `userPermissionOverride`; fixed `role` → `roleRef`.
    - `admin-permission.service.ts` — Fixed `'insecure'` → `'insensitive'` typo.
    - `admin-audit.service.ts` — Fixed nested search filter syntax.

12. **API routes fixed:**
    - `/api/admin/users/route.ts` — `Number(session.user.id)` conversions for all user ID params.
    - `/api/admin/roles/route.ts` — Same fixes.
    - `/api/admin/permissions/route.ts` — Wrapped response as `{ permissions }`.
    - `/api/admin/roles/route.ts` — Wrapped response as `{ roles }`.

13. **services/index.ts** — Added missing `InspectionReportService` and `InspectionReportPDFGenerator` exports.

14. **training.service.ts** — Removed duplicate `CreateEnrollmentInput` export.

### Route Map

| Route | Component | API |
|-------|-----------|-----|
| `/admin` | AdminDashboard (tab-based) | N/A |
| `/admin/users` | AdminUsersPanel | `/api/admin/users` |
| `/admin/roles` | AdminRolesPanel | `/api/admin/roles` |
| `/admin/permissions` | AdminPermissionsPanel | `/api/admin/permissions` |
| `/admin/audit-logs` | AdminAuditLogsPanel | `/api/admin/audit-logs` |
| `/admin/system` | AdminSystemPanel | `/api/admin/system-stats` |

### Verification

- `npx tsc --noEmit` — ✅ 0 errors (down from 40+ errors)
- `npm run build` — ✅ Compiled successfully, all 113 static + dynamic pages generated

### Acceptance Criteria

- [x] All admin pages render without syntax/compilation errors
- [x] TypeScript compiles with zero errors
- [x] Production build completes successfully
- [x] Dev server starts cleanly
- [ ] UI acceptance pending (manual browser testing)

---

## ✅ Completed: Hydration Error Fixes (2026-10-18)

### Context
Dashboard showed 2 unhandled runtime errors:
1. `Warning: Prop className did not match` in `BottomConnectionBadge` (Sidebar)
2. `Warning: validateDOMNesting` + "mounting a new html component" from duplicate document structure

### What was fixed:

1. **`src/lib/offline/hooks.ts` (line 18)** — `useOfflineStatus()` initialized `isOnline` via `typeof navigator !== 'undefined' ? navigator.onLine : true`. In Node.js 24, `navigator` IS defined but `navigator.onLine` is `undefined`, causing SSR to render "Offline Mode" (rose-500) while client renders "Online" (emerald-500). Fixed to: `typeof navigator !== 'undefined' && navigator.onLine !== undefined ? navigator.onLine : true`

2. **`src/lib/offline/OfflineProvider.tsx` (line 65)** — Same `navigator.onLine` initialization pattern in the context provider. Same fix applied.

3. **`src/components/layout/Sidebar.tsx` (line 324)** — `BottomConnectionBadge` consumed `isOnline` from `useOfflineStatus()` without `mounted` gating. Added `useState`/`useEffect` mounted pattern (returns `null` until first client render) as defense-in-depth.

4. **`src/app/(app)/layout.tsx`** — Had duplicate `<html>`, `<head>`, `<body>` tags AND redundant `<Providers>` + `<OfflineProviderWrapper>` wrapping inside `AppShell`. Root layout (`src/app/layout.tsx`) already provides document structure + Providers + OfflineProviderWrapper + OfflineBanner + OfflineIndicator. Flattened to just `<AppShell>{children}</AppShell>`.

5. **`src/app/(auth)/login/layout.tsx`** — Same duplicate document structure issue. Had its own `<html>`, `<head>`, `<body>`, `<Providers>`, and `<OfflineProviderWrapper>`. Removed all in favor of root layout's wrappers. Now just wraps children in a styled div.

### Verification
- `npx tsc --noEmit` — ✅ 0 errors
- Dashboard loads with **0 console errors, 0 warnings** (verified via Playwright browser test)
- Login → Dashboard navigation works correctly

### Acceptance Criteria
- [x] Dashboard renders without hydration errors
- [x] TypeScript compiles with zero errors
- [x] Both error sources eliminated
- [x] Login page and dashboard functional
