# Refactor integral del Home: Widgets atómicos + Notificaciones pila iOS + Calendario clínico

## 1. Widgets de acción rápida — patrón atómico universal

Reescribo `src/components/home/QuickToolWidget.tsx` para que **todos** los QuickTools (Sueño, Hábitos, Diario, Mindfulness, Pensamientos, Pack, Psico) usen la misma anatomía:

```
┌─────────────────┐
│                 │   ← Cápsula cuadrada glass tinted 8%
│      ○ icon     │     backdrop-blur(20px), stroke-width 1.5
│                 │     aspect-square, w-full
└─────────────────┘
     Sueño            ← Label fuera, mt-2, text-[11px] slate-600
```

**Estados visuales (leídos de la DB, sin persistencia extra):**
- **Idle**: fondo glass tinted al 8% del color clínico del recurso, ícono lineal en color clínico.
- **Completado hoy**: fondo sólido vibrante del color clínico, ícono blanco + check fino overlay, label en `slate-900 font-semibold`. Se determina consultando la fuente de verdad de cada recurso para `todayStr`:
  - Sueño → `daily_checkins` con `mode=morning` y `sleep_score`
  - Hábitos → al menos 1 fila en `habit_completions` hoy
  - Diario → 1 fila en `journal_entries` hoy
  - Mindfulness → 1 fila en `exercise_sessions` (kind mindfulness/breathing) hoy
  - Pensamientos → 1 fila en `thought_records` hoy
  - Pack → 1 fila en `ba_day_logs` hoy
  - Psico → 1 fila en `content_progress` hoy

**Interacción:** un solo tap **siempre navega al recurso** (enlace directo puro). El estado completado es solo reflejo visual — no se toggle-a manualmente. Micro-animación elástica al tap (`active:scale-92`, cubic-bezier(0.175, 0.885, 0.32, 1.275)) **solo sobre la caja glass**, no sobre el label.

**Colores clínicos por widget** (tokens ya existentes en el sistema):
- Sueño → índigo (`#6366f1`)
- Hábitos → verde salvia (`#7d9b76`)
- Diario → ámbar (`#f59e0b`)
- Mindfulness → teal (`#7cc2c8`)
- Pensamientos → violeta (`#9b72cf`)
- Pack → coral (`#e88aab`)
- Psico → navy (`#3b6fa0`)

Hook nuevo: `useTodayCompletion.ts` — hace **una** query batch al montar el Dashboard y devuelve `Record<WidgetId, boolean>`.

## 2. Sistema de notificaciones fijas en pila (iOS Notification Stack)

Nuevo componente `src/components/home/NotificationStack.tsx` ubicado **entre el header y el PriorityStack**, desvinculado completamente del avatar "R".

**Fuente de las notificaciones** (derivadas de las notificaciones que el usuario ya activó en sus preferencias de recursos, tabla `notification_preferences`):
- Solo se muestran las notificaciones cuyos toggles el usuario tiene activos.
- Para cada preferencia activa, se genera una card si la acción del día está pendiente (usando el mismo hook `useTodayCompletion`):
  - `journal_enabled` + diario no hecho hoy → "Registrá tu diario"
  - `habits_enabled` + hábitos pendientes → "Recordatorio: Hábitos diarios"
  - `mindfulness_enabled` + mindfulness no hecho → "Momento de respirar"
  - `session_reminder_enabled` + hay sesión en <24h (via `useNextSession`) → "Sesión con tu psicólogo mañana"
  - `medication_enabled` + toma pendiente hoy → "Tomá tu medicación"
- Al montarse, se filtran las que el usuario ya descartó hoy (localStorage key `home_notif_dismissed_v1:{YYYY-MM-DD}` — array de ids).

**Comportamiento visual:**
- Solo la primera notificación es totalmente visible. Detrás, dos "sombras apiladas" (cards de la misma altura pero escaladas a `scale(0.96)` y `scale(0.92)`, desplazadas 6px y 12px hacia abajo, opacity 0.6 y 0.35) sugieren la pila.
- Cruz ✕ micro-lineal al extremo derecho (`stroke-width 1.5`, tap area 32px).
- Al descartar: la card activa hace `translateX(-105%) + opacity 0` con spring (0.4s), la siguiente asciende a la posición principal (spring), las sombras se recalculan.
- Cuando la pila queda vacía → `max-height: 0` con transición de 400ms y desmontaje.
- Persistente absoluta: no auto-dismiss por tiempo. Se resetea al día siguiente (nueva key de fecha).

**Estética:** pill glass premium — `bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_24px_-8px_rgba(16,25,39,0.12)] rounded-2xl px-4 py-3`. Ícono lineal + chip pequeño de categoría + título en `text-[13px] font-semibold` + subtítulo tenue.

Como consecuencia: **elimino `PendingBento` y `MorningCallback`** del render (su función queda absorbida por la pila).

## 3. Botón + Bottom Sheet calendario clínico

**Botón:** ya existe en la esquina superior izquierda del Dashboard. Refuerzo estilo — cápsula glass 44×44 con ícono `CalendarDays` stroke 1.5, sin fondo saturado.

**Bottom Sheet `MonthCalendarSheet`:** ajustes al componente existente:
- Altura fija al **82%** del viewport (`h-[82vh]`).
- Backdrop con difuminado denso (`backdrop-blur-2xl bg-black/40`).
- Header: "Viernes, 17 de Julio" en serif elegante (font-serifElegant), subtítulo "Julio 2026" en slate-400.
- Grid mensual (ya existe) — día actual con círculo negro sólido.

**Sección "Actividades de hoy" — sincronización en tiempo real:**
Nuevo hook `useTodayActivities.ts` que se suscribe (vía props) al mismo estado que Dashboard mantiene:
- **Prioridades cicladas** del `PriorityStack`: se levanta el estado `phaseIdx` a Dashboard y se pasa a la sheet, listando cada fase visitada (mañana/mediodía/noche) como hito.
- **Widgets completados hoy**: reusa `useTodayCompletion` y lista cada uno completado con su ícono lineal fino + label.
- Formato de item: fila con ícono 20px + texto + hora (si disponible desde el timestamp de la DB).
- Empty state: "Todavía no hay actividades registradas" (solo si ambas listas están vacías).

Para que el ciclo del PriorityStack sea observable: se mueve `phaseIdx` de estado interno a estado en Dashboard (via prop controlada) y se persiste en localStorage `home_priority_phases_visited:{date}` como array de fases visitadas. La sheet lee eso.

## Archivos a modificar / crear

**Crear:**
- `src/hooks/useTodayCompletion.ts` — query batch de completados hoy por recurso.
- `src/hooks/useTodayActivities.ts` — combina completados + fases visitadas para la sheet.
- `src/components/home/NotificationStack.tsx` — pila iOS.

**Modificar:**
- `src/components/home/QuickToolWidget.tsx` — nueva anatomía atómica universal.
- `src/components/home/PriorityStack.tsx` — levantar `phaseIdx` a props controlado + persistir fases visitadas.
- `src/components/home/MonthCalendarSheet.tsx` — altura 82%, blur denso, sección actividades sincronizada.
- `src/pages/Dashboard.tsx` — integrar NotificationStack, remover PendingBento/MorningCallback, pasar estado del PriorityStack a la sheet.

**Sin cambios de DB.** Todo se resuelve con queries a tablas existentes + localStorage para descartes/fases del día.

## Detalles técnicos

- La query batch de `useTodayCompletion` usa `Promise.all` con 7 `supabase.from(...).select("id").eq("user_id", ...).gte("created_at", todayStartISO).limit(1)` en paralelo. Latencia esperada: ~200ms.
- Los descartes de notificaciones se limpian automáticamente cambiando la key por fecha (no requiere cleanup manual).
- Todos los íconos migran a `strokeWidth={1.5}` (lucide) — coherencia visual.
- El check overlay del estado completado es un mini badge circular en la esquina superior derecha de la cápsula (`w-4 h-4`, fondo del color clínico, check blanco 10px), no reemplaza al ícono central.

## Fuera de alcance

- No se toca el `BottomNav`, el header con avatar "R", el saludo, ni el PriorityStack visual (solo se levanta su estado).
- No se agregan nuevas notificaciones fuera de las que ya existen en `notification_preferences`.
- No se cambia el color/estilo de la tarjeta central de prioridad (solo la ubicación relativa a la pila).
