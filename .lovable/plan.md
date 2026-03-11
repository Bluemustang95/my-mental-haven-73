

## Admin Panel — Plan de implementación

### 1. Database: Roles y políticas admin

**Migration SQL:**
- Create `app_role` enum (`admin`, `user`)
- Create `user_roles` table (user_id, role) with RLS
- Create `has_role()` security definer function
- Add admin RLS policies on all tables:
  - `psychoeducation_content`: full CRUD for admins
  - `patients_intake`: SELECT + UPDATE for admins
  - `patient_app_profiles`, `daily_checkins`, `test_results`, `exercise_sessions`, `journal_entries`, `thought_records`, `dream_log`: SELECT for admins

**Seed admin user:**
- Sign up `redsaludmentalarg@gmail.com` with password `RESMA2026` via edge function or direct insert
- Insert role `admin` into `user_roles`
- Enable auto-confirm temporarily or use service role to confirm the user

### 2. Admin route protection

- `src/components/admin/AdminRoute.tsx` — checks `user_roles` table for admin role, redirects to `/` if not admin
- `src/components/admin/AdminLayout.tsx` — desktop sidebar layout (Sidebar from shadcn) with sections: Dashboard, Contenido, Solicitudes, Pacientes

### 3. Admin pages

**`/admin` — Dashboard**
- Metric cards: total users, check-ins hoy, solicitudes pendientes, tests completados
- Queries con count against each table

**`/admin/contenido` — Content Manager**
- Table listing `psychoeducation_content` (all, including unpublished)
- Create/Edit dialog: title, description, type, URL, category, tags, duration, premium, published toggles
- Delete with confirmation
- Update `ContentLibrary.tsx` to fetch from DB instead of hardcoded array

**`/admin/solicitudes` — Treatment Requests**
- Table of `patients_intake` with status badges
- Click to expand details
- Status dropdown (pending → contacted → completed → rejected)

**`/admin/pacientes` — Patient List + Detail**
- Searchable table of `patient_app_profiles`
- Click into patient → tabs showing: profile info, check-in history, test results, exercise sessions
- Read-only

### 4. Routing updates (App.tsx)

```text
/admin          → AdminDashboard
/admin/contenido → ContentManager
/admin/solicitudes → TreatmentRequests
/admin/pacientes → PatientList
/admin/pacientes/:id → PatientDetail
```

All wrapped in `AdminRoute` + `AdminLayout`.

### 5. Files to create/edit

| Action | File |
|--------|------|
| Create | `src/components/admin/AdminRoute.tsx` |
| Create | `src/components/admin/AdminLayout.tsx` |
| Create | `src/pages/admin/AdminDashboard.tsx` |
| Create | `src/pages/admin/ContentManager.tsx` |
| Create | `src/pages/admin/TreatmentRequests.tsx` |
| Create | `src/pages/admin/PatientList.tsx` |
| Create | `src/pages/admin/PatientDetail.tsx` |
| Edit   | `src/App.tsx` (add admin routes) |
| Edit   | `src/pages/ContentLibrary.tsx` (fetch from DB) |
| Migration | roles, policies, admin user seed |

### Security note
- Admin credentials will be created via a backend function using the service role key — never exposed client-side
- Role check always server-side via `has_role()` in RLS + client-side guard for UX

