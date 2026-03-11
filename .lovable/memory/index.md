RESMA Patient App — design system, architecture, and key decisions

## Design System
- Font display: Montserrat | Font body: Lora (Google Fonts)
- Primary: #101927 | Accent: #FACB60 | Secondary: #E8F4F8
- Background light: #F4F4F0 | Dark bg: #0F1419 | Dark card: #1A2332
- No emojis in mood, no streaks/gamification
- Generous rounded corners (2xl/3xl), architectural separators

## Architecture
- Mobile-first, 4 bottom tabs + central Resmita FAB: Inicio, Herramientas, [Resmita], Tests, Perfil
- Crisis button moved to Profile page (not floating)
- Auth: email/password + Google OAuth (Lovable Cloud managed)
- Protected routes with AuthProvider context
- Resmita chat via Lovable AI Gateway (google/gemini-3-flash-preview)

## Database Tables
- patient_app_profiles, daily_checkins, exercise_sessions, patients_intake
- journal_entries, thought_records, dream_log, test_results
- psychoeducation_content (public read), content_progress
- content_favorites, session_notes, weekly_goals
- user_roles (admin RBAC)

## Pages
- Auth (login/signup/forgot) + ResetPassword
- Onboarding (4 steps, saves to DB)
- Dashboard (check-in + weekly goals widget + progress link)
- Tools: Journal, ThoughtRecord, DreamLog, Breathing, Grounding, Mindfulness, ContentLibrary, SessionNotes
- Tests: PHQ-9, GAD-7, PSS-10, ISI, Rosenberg (saves to DB)
- Progress: mood chart (Recharts), test history, stats
- TreatmentRequest, LinkProfessional
- Resmita (AI chat streaming), Profile (dark mode, crisis, logout)
- Admin: Dashboard, ContentManager, TreatmentRequests, PatientList, PatientDetail

## Key Decisions
- Crisis button in Profile (not floating), lines 135 & 137
- Resmita is central FAB in BottomNav
- Weekly goals: max 3 per week
- Content favorites with heart toggle
- Session notes: post-therapy reflections tool
