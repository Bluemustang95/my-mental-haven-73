RESMA Patient App — design system, architecture, and key decisions

## Design System
- Font display: Montserrat | Font body: Lora (Google Fonts)
- Primary: #101927 | Accent: #FACB60 | Secondary: #E8F4F8
- Background light: #F4F4F0 | Dark bg: #0F1419 | Dark card: #1A2332
- No emojis in mood, no streaks/gamification
- Generous rounded corners (2xl/3xl), architectural separators

## Architecture
- Mobile-first, 5 bottom tabs: Inicio, Herramientas, Tests, Resmita, Perfil
- Auth: email/password + Google OAuth (Lovable Cloud managed)
- Protected routes with AuthProvider context
- Resmita chat via Lovable AI Gateway (google/gemini-3-flash-preview)
- Admin panel at /admin with role-based access (user_roles table)

## Database Tables
- patient_app_profiles, daily_checkins, exercise_sessions, patients_intake
- journal_entries, thought_records, dream_log, test_results
- psychoeducation_content (public read), content_progress
- user_roles (admin/user enum, has_role() security definer)

## Pages
- Auth (login/signup/forgot) + ResetPassword
- Onboarding (4 steps, saves to DB)
- Dashboard (check-in saves to DB)
- Tools: Journal, ThoughtRecord, DreamLog, Breathing, Grounding, Mindfulness, ContentLibrary (DB)
- Tests: PHQ-9, GAD-7, PSS-10, ISI, Rosenberg (saves to DB)
- TreatmentRequest (form → patients_intake)
- LinkProfessional (code-based linking)
- Resmita (AI chat streaming), Profile (dark mode, logout)
- Admin: Dashboard, ContentManager, TreatmentRequests, PatientList, PatientDetail

## Key Decisions
- Crisis button always visible (135, 137)
- Onboarding + check-ins + tests save to Supabase with user auth
- Content library fetches from psychoeducation_content table
- Admin: redsaludmentalarg@gmail.com / RESMA2026
