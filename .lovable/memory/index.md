# Memory: index.md
Updated: now

RESMA Patient App — design system, architecture, and key decisions

## Design System
- Font display: Montserrat | Font body: Lora (Google Fonts)
- Primary: #101927 | Accent: #FACB60 | Secondary: #E8F4F8
- Background light: #F4F4F0 | Dark bg: #0F1419 | Dark card: #1A2332
- No emojis in mood, no streaks/gamification
- Generous rounded corners (2xl/3xl), architectural separators

## Architecture
- Mobile-first, 4 bottom tabs + Resmita FAB center: Inicio, Herramientas, 🟡Resmita, Tests, Perfil
- Auth: email/password + Google OAuth (Lovable Cloud managed)
- Protected routes with AuthProvider context
- Resmita chat via Lovable AI Gateway (google/gemini-3-flash-preview)
- Crisis button moved to Profile page

## Database Tables
- patient_app_profiles, daily_checkins, exercise_sessions, patients_intake
- journal_entries, thought_records, dream_log, test_results
- psychoeducation_content (public read), content_progress, content_favorites
- session_notes, weekly_goals, user_roles
- body_map_entries, day_timeline_entries, relationship_logs
- unsent_letters, therapy_prep_notes, micro_achievements, internal_dialogues
- Storage: voice-notes bucket (private per user)

## Journal Hub (multimodal introspection)
- Hub at /herramientas/journal with sub-routes:
  checkin, escribir, dia, vinculos, cartas, terapia, logros, dialogo, linea-temporal
- Components in src/components/journal/
- Body map SVG interactive, voice recording via MediaRecorder API
- "Cartas que no voy a enviar" with release animation (framer-motion blur effect)

## Key Decisions
- Crisis button in Profile (not floating)
- Onboarding + check-ins + tests save to Supabase with user auth
- Content library uses DB data fetched from psychoeducation_content
- All language in Argentine Spanish (voseo)
