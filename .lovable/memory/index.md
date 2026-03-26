RESMA Patient App — design system, architecture, and key decisions

## Design System
- Font display: Montserrat | Font body: Lora (Google Fonts)
- Primary: #101927 | Accent: #FACB60 | Secondary: #E8F4F8
- Background light: #F4F4F0 | Dark bg: #0F1419 | Dark card: #1A2332
- Mood colors: mood-1 red, mood-2 orange, mood-3 yellow, mood-4 green-light, mood-5 green
- No emojis in mood, no streaks/gamification
- Generous rounded corners (2xl/3xl), architectural separators

## Navigation Architecture
- 5 bottom tabs: Inicio, Diario, RESMITA (center FAB), Herramientas, Mi Proceso
- Profile: accessed via avatar icon (user initial) in Dashboard header top-right
- Diario (/diario): checkin, escribir, dia, vinculos, cartas, terapia, logros, dialogo, pensamientos, suenos, sesiones
- Herramientas (/herramientas): respiracion, grounding, mindfulness, contenido, autocuidado, favoritos
- Mi Proceso (/mi-proceso): tests, linea-temporal, progreso, medicacion, espejo

## Database Tables
- patient_app_profiles, daily_checkins, exercise_sessions, patients_intake
- journal_entries, thought_records, dream_log, test_results
- psychoeducation_content (public read), content_progress, content_favorites
- selfcare_tasks, medications, medication_logs, weekly_reflections

## Key Decisions
- Crisis button always visible (135, 137)
- Onboarding + check-ins + tests save to Supabase with user auth
- Resmita chat via Lovable AI Gateway (google/gemini-3-flash-preview)
- El Espejo uses resmita-chat edge function for weekly AI reflections
- SessionPrep widget shows 15min before session with weekly summary
- Selfcare completed tasks show sparkle badge on calendar
