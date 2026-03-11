

## Plan: Reestructuración de navegación + nuevas funcionalidades para pacientes

### 1. Cambios de navegación

**BottomNav (4 tabs + Resmita central):**
```text
┌───────────────────────────────────────┐
│  Inicio  Herramientas  🟡  Tests  Perfil │
│    🏠       🧰       Resmita  📊    👤   │
└───────────────────────────────────────┘
```
- Quitar Resmita como tab normal, reemplazar por un **botón circular elevado** (accent color, más grande) en el centro del BottomNav
- El botón sobresale del nav como un FAB central que lleva a `/resmita`

**CrisisButton → mover a Profile.tsx:**
- Quitar `<CrisisButton />` de `AppLayout.tsx`
- Agregar el botón de crisis como un item dentro de la página de Perfil (al lado de "Solicitar tratamiento" o como sección propia con estilo destructive)
- Mantener el mismo sheet/modal con las líneas de emergencia

### 2. Nuevas funcionalidades para pacientes

**A. Historial de progreso (`/progreso` o sección en Dashboard)**
- Gráfico de mood semanal con Recharts (line chart) desde `daily_checkins`
- Historial de tests con puntajes en el tiempo
- Resumen: racha de check-ins, cantidad de ejercicios completados

**B. Favoritos / Contenido guardado**
- Permitir guardar contenido psicoeducativo como favorito
- Nueva tabla `content_favorites` (user_id, content_id)
- Sección "Guardados" en la biblioteca de contenido

**C. Notas de sesión**
- Espacio para que el paciente anote reflexiones post-sesión con su terapeuta
- Nueva tabla `session_notes` (user_id, date, note, mood_after)
- Accesible desde Herramientas

**D. Metas semanales**
- El paciente define 1-3 metas semanales simples (texto libre)
- Puede marcarlas como completadas
- Nueva tabla `weekly_goals` (user_id, week_start, goal_text, completed)
- Widget en Dashboard mostrando metas activas

### 3. Archivos a modificar/crear

| Acción | Archivo |
|--------|---------|
| Editar | `src/components/layout/BottomNav.tsx` — 4 tabs + botón Resmita central |
| Editar | `src/components/layout/AppLayout.tsx` — quitar CrisisButton |
| Editar | `src/pages/Profile.tsx` — agregar CrisisButton inline |
| Crear | `src/pages/Progress.tsx` — historial con gráficos Recharts |
| Crear | `src/pages/SessionNotes.tsx` — notas post-sesión |
| Editar | `src/pages/Dashboard.tsx` — widget de metas semanales |
| Editar | `src/pages/ContentLibrary.tsx` — botón favoritos |
| Editar | `src/App.tsx` — nuevas rutas |
| Migration | `content_favorites`, `session_notes`, `weekly_goals` tables + RLS |

### 4. Base de datos

```sql
-- Favoritos de contenido
CREATE TABLE content_favorites (user_id uuid, content_id uuid, created_at timestamptz);

-- Notas de sesión
CREATE TABLE session_notes (id uuid, user_id uuid, session_date date, note text, mood_after int, created_at timestamptz);

-- Metas semanales
CREATE TABLE weekly_goals (id uuid, user_id uuid, week_start date, goal_text text, completed boolean default false, created_at timestamptz);
```

Todas con RLS: usuarios solo ven/editan sus propios datos, admins pueden leer todo.

