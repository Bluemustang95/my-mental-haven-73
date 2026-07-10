
## Cómo se conectan hoy los rituales con el calendario

Ambos rituales escriben en la misma tabla `daily_checkins` usando `checkin_date = hoy` y `mode = 'morning' | 'night'` (upsert por `user_id + checkin_date + mode`). Eso permite:

- **Mañana → Noche (mismo día)**: Balance Nocturno lee el registro `mode='morning'` de hoy y trae los `valores` (parseados de `thought_note`) y `day_goal` (intenciones) para el paso "Constelación".
- **Noche → Mañana (día siguiente)**: Sintonía Mañana lee el `mode='night'` de ayer y muestra `balance_improve` como banner en el paso 3.
- **Calendario**: el `WeekStrip` y `MonthCalendarSheet` cuentan filas de `daily_checkins` por fecha (`weekProgress`) — cada modo suma un punto en el día. La `DayHistorySheet` renderiza ambos.

Faltante actual: las **emociones de la noche no se comparan con las de la mañana**, y no queda registrada la razón del cambio.

---

## Lo que vamos a construir

### 1) Puente emocional Mañana ↔ Noche

**Balance Nocturno · Paso 2 (Nebulosa)**
- Al entrar, cargar `emotions` del `mode='morning'` de hoy (`morningEmotions`).
- Debajo de las orbes, panel **"¿Coincide con cómo despertaste?"**:
  - Chips comparativos: 🌅 emociones matinales vs 🌙 emociones actuales.
  - Detección: `sumadas` = solo de noche, `sostenidas` = en ambas, `disueltas` = solo de mañana.
  - Si hay diferencia (sumadas o disueltas > 0), aparece un textarea suave: **"¿Qué generó este cambio a lo largo del día?"** (opcional, guardado en un campo nuevo `emotion_shift_note`).
- Persistencia: `emotion_shift_note` (texto) y `emotion_shift_summary` (jsonb con `{sostenidas, sumadas, disueltas}`) en `daily_checkins`.

**Sintonía Mañana · Paso 1 (Cuerpo)**
- Si la noche anterior guardó `emotion_shift_note`, mostrar un mini card contextual "Ayer notaste este cambio: …" para dar continuidad.

**Migración**: agregar dos columnas nullables a `daily_checkins`:
```
emotion_shift_note text
emotion_shift_summary jsonb
```
(sin CHECK constraints; RLS y GRANTs existentes ya cubren la tabla).

---

### 2) Estilo único por widget (igual que Psicoeducación / Leo)

Cada tarjeta tendrá **color**, **nombre**, **forma abstracta** e **ícono/glifo** propio. Se crea un registro central `WIDGET_IDENTITY` con:

```ts
{ id, label, palette:{from,to,ink,glowRgb}, glyph:'orb'|'wave'|'leaf'|'spark'|'moon'|'flame'|'grid', accent, tagline }
```

Nueva estética por widget (paleta ya alineada al brand):

| Widget | Color base | Glifo abstracto | Sensación |
|---|---|---|---|
| `sleep_zone` | Índigo/violeta nocturno | Luna con partículas orbitales | Descanso |
| `pending` | Naranja arena | Circuito de checks apilados | Acción |
| `mini_habits` | Verde salvia | Anillos de progreso concéntricos | Constancia |
| `gratitude` | Rosa cálido | Corazón "líquido" con blur | Ternura |
| `contention_notes` | Terracota | Post-it con líneas onduladas | Refugio |
| `daily_quote` | Crema/dorado | Comillas grandes en serif | Inspiración |
| `psy_news` | Azul agua | Ondas de radio | Actualidad |

**Enfoque prioritario (PriorityStack)** también recibe identidad diferenciada por tarjeta:
- `morning` → amanecer (gradiente ámbar→crema, glifo sol emergente).
- `recommended` → agua turquesa, glifo espiral.
- `night` → índigo profundo, glifo luna con estrellas.

Se crea `src/components/home/WidgetVisual.tsx` con los SVG abstractos y un helper `useWidgetIdentity(id)`. Todos los widgets pasan a consumirlo (sin emojis, ilustración vectorial contenida).

---

### 3) Modo edición del Home

Ajustes en `Dashboard.tsx` + `WidgetsBoard.tsx`:

- **Enfoque prioritario fijo arriba**: el `PriorityStack` sigue renderizándose en edit mode, con un chip "Fijo · no se mueve" y sin handles. Se aplica `pointer-events: none` a las cards del stack pero se mantienen visualmente.
- **3 slots fijos punteados** debajo del stack, correspondientes a los 3 tools máximos:
  - Layout: 1 slot horizontal grande arriba + 2 slots cuadrados abajo (respeta el mismo grid que en vista normal).
  - Cada slot muestra:
    - Si tiene widget asignado → tarjeta con handle de drag, botón "×" para quitar, botón para intercambiar tamaño solo en el slot horizontal.
    - Si está vacío → borde `dashed` + botón "+ Agregar herramienta" que abre el sheet de gestión.
  - Drag & drop **solo entre estos 3 slots** (reemplazo/permutación, no reordenamiento libre).
- El sheet de gestión sigue limitando a `MAX_TOOLS = 3`.

Componentes nuevos:
- `src/components/home/EditSlots.tsx` — 3 slots (1 full + 2 half) con drag-swap.
- Actualización de `ReorderableGroupStack` para modo "swap-in-fixed-slots".

---

## Detalle técnico (resumen)

- **DB**: migración `add_emotion_shift_to_daily_checkins` con las 2 columnas + comentarios; no toca policies (ya scoped a `auth.uid()`).
- **Balance Nocturno**: cargar `morning` checkin junto al `improve` actual; nuevo componente `EmotionCompare` en el paso 2; guardar `emotion_shift_note` y `emotion_shift_summary` en el `upsert`.
- **Sintonía Mañana**: leer `emotion_shift_note` del `night` de ayer y mostrarlo como micro-card en paso 1.
- **Identidad widgets**: `WidgetVisual.tsx` con SVG abstractos + tokens de gradiente en `index.css` (`--widget-sleep-from`, etc.). Refactor de `PendingBento`, `MiniHabitsWidget`, `GratitudeWidget`, `ContentionNotesWidget`, `DailyQuoteWidget`, `PsyNewsWidget`, `SleepZoneCard` y `PriorityStack` para pintar con esos tokens.
- **Edición**: `EditSlots` reemplaza la grilla en `widgets.editMode`; `PriorityStack` se muestra pero con overlay "Fijo". El drag-swap usa `@dnd-kit` (ya disponible).

## Archivos afectados
- `supabase/migrations/*` (nuevo)
- `src/pages/ritual/BalanceNocturno.tsx`
- `src/pages/ritual/SintoniaManana.tsx`
- `src/pages/Dashboard.tsx`
- `src/components/home/WidgetsBoard.tsx`
- `src/components/home/PriorityStack.tsx`
- `src/components/home/WidgetVisual.tsx` (nuevo)
- `src/components/home/EditSlots.tsx` (nuevo)
- `src/components/home/OptionalWidgets.tsx`, `PendingBento.tsx`, `DailyQuoteWidget.tsx`, `PsyNewsWidget.tsx`, `SleepZoneCard` (dentro de Dashboard)
- `src/index.css` (tokens de widget)
