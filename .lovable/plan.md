
## 1. Psicoeducación reemplaza a Resmita en el centro de la BottomNav

- En `BottomNav.tsx`: el FAB central deja de ir a `/resmita` y abre el `PsychoModal` (o navega a `/psicoeducacion`).
- Icono: cambiar `ChatCircle` → `BookOpen` (Phosphor) manteniendo el mismo círculo crema con borde ámbar y animación.
- Label aria: "Psicoeducación".
- `Resmita` queda accesible solo desde otra entrada secundaria (lo dejamos como ruta pero sin botón).

## 2. Tests reales en `SymptomsTestModal`

Cargar contenido en `algo_questions` + nuevas tablas mínimas para preguntas internas de cada test:

- **Síntomas**: BDI-II (21 ítems, 0-3), BAI (21 ítems, 0-3), PSWQ (16 ítems, 1-5 con reversos).
- **Personalidad**: Big Five (BFI-44 reducido a 20 ítems, 5 dimensiones).

Flujo:
- Grid inicial muestra 3 tarjetas en síntomas (BDI, BAI, PSWQ) y 1 en personalidad (Big Five).
- Al tocar un test → pantalla de ítems paginados con escala Likert táctil.
- Al terminar, guarda en `test_results` (ya existe) con `kind`, `score`, `subscale_scores jsonb`, `interpretation`.
- **Big Five**: ANTES de comenzar muestra un hexágono (5 ejes para OCEAN) vacío como preview de lo que verá al final; al finalizar el mismo hexágono se rellena con resultados.

Tablas nuevas:
- `test_definitions` (id, code, name, kind, scale_min, scale_max, instructions)
- `test_items` (id, test_id, sort, prompt, reverse boolean, subscale text)
- Seeds con BDI/BAI/PSWQ/BigFive.

## 3. Bento de Recursos: 2x2 + rack debajo

Reordenar `BentoGrid.tsx`:

```
[Mindfulness]      [Reg. Emocional]
[Tolerancia mal.]  [Efectividad pers.]
─────────────────────────────────────
[Gestión de Pensamientos — wide]
[Pack de Actividades — wide dark]
```

Las 4 superiores en grid 2×2 mismo tamaño. Se elimina la fila intermedia separada para Efectividad.

## 4. Estadística de impacto / Bienestar (Mi Proceso)

Agregar a `MiProceso.tsx` un **Índice de Bienestar (0-100)** semanal compuesto:

| Variable | Peso | Fuente |
|---|---|---|
| Calidad de sueño promedio | 25% | `sleep_log.quality` + `daily_checkins.sleep_score` |
| Estado al despertar (dawn) | 10% | `daily_checkins.dawn_score` |
| Balance del día (noche) | 15% | derivado de emociones positivas vs negativas en checkin nocturno |
| Recursos completados | 15% | `content_progress` + `exercise_sessions` |
| Actividades del Pack hechas | 10% | `exercise_sessions` (kind=activity) |
| Objetivos del día cumplidos | 15% | `daily_checkins.day_goal` marcado como cumplido |
| Adherencia (días con check-in) | 10% | `daily_checkins` count |

Vistas nuevas:
- Card **"¿Mejoraste esta semana?"**: compara índice de los últimos 7 días vs 7 anteriores → flecha ↑/↓ + delta + frase ("Tu sueño mejoró un 12%").
- Gráfico de área del índice semanal (8 semanas).
- Mini-cards: sueño promedio, mejor día, peor día, racha de check-ins.
- Sección "Cómo empezás vs cómo terminás el día": barras pareadas dawn vs balance nocturno.

Nada de tablas nuevas (todo derivado en cliente o vía RPC `get_wellbeing_index(_user_id, _from, _to)`).

## 5. Settings = pantalla inicial, sin icono extra; BottomNav fija sin scroll horizontal

- En `BottomNav.tsx`: cambiar `position` para usar `left: 0; right: 0` con `justify-content: center` y `max-width: 100vw`. Quitar `width: fit-content` que en pantallas chicas + 5 tabs produce overflow.
- Reducir `size` de iconos a 20, padding `px-2 py-1`, gap `gap-0.5`, botones `h-10 w-10`.
- El acceso a "Ajustes" deja de tener icono propio en la nav: queda solo el botón ⚙️ del header del Home y la entrada desde Profile.
- "Pantalla inicial = Ajustes": cuando el usuario toca el ⚙️ del header va directo a `/configuracion` (ya existe `Settings.tsx`).

(Confirmame si "que la inicial sea ajustes" significa: (a) que el botón ⚙️ del header reemplace al avatar/configuración separada — interpretación que tomo, o (b) que al abrir la app aparezca Settings primero. Asumo (a).)

## 6. Objetivos del día → check-in nocturno

- Morning Check-in step "Objetivo de hoy" guarda `daily_checkins.day_goal` (ya existe).
- Night Check-in: nuevo paso **"Valoración de objetivos"** que lee el `day_goal` del checkin matutino del mismo día y pregunta:
  - "¿Cumpliste con: {day_goal}?" → toggle Sí / Parcial / No.
  - Guarda en `daily_checkins.goal_completed` (nueva columna text: 'yes'|'partial'|'no').
- Si no hay `day_goal`, se omite el paso.

## 7. Luz ámbar/verde en `WeekStrip`

- Calcular progreso del día = nodos de Timeline completados / 4.
- Pasar a `WeekStrip` un map `{ [dateStr]: progress }`.
- Debajo del número del día (no solo hoy, todos los días con actividad):
  - 1–3 completados → punto ámbar `#F59E0B`.
  - 4/4 completados → punto verde `#34C759` y el círculo del día se tiñe verde tenue.
- Hoy mantiene fondo crema; el color del puntito refleja el progreso real.

## Detalles técnicos

- Migración nueva: `test_definitions`, `test_items` + GRANTs + RLS pública lectura para authenticated; columna `daily_checkins.goal_completed text`; RPC `get_wellbeing_index`.
- Seeds de tests vía `supabase--insert`.
- Componentes nuevos: `tests/BdiRunner.tsx`, `tests/BaiRunner.tsx`, `tests/PswqRunner.tsx`, `tests/BigFiveRunner.tsx`, `tests/HexagonPreview.tsx` (radar SVG OCEAN), `proceso/WellbeingCard.tsx`, `proceso/WeeklyDelta.tsx`.
- Hook `useDayProgress(date)` para alimentar Timeline + WeekStrip desde una sola fuente.

## Fuera de alcance (avisame si lo querés sumar)

- Notificaciones push para recordar objetivos.
- Export PDF de resultados de tests.
- Comparativa de Big Five con población general (necesitaría baremos).
