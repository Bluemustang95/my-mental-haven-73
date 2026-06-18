## Pensamientos Automáticos — Reestructuración Cognitiva (CBT)

Construir el módulo clínico interactivo dentro de **Gestión de Pensamientos** (`/diario-inteligente/gestion-pensamientos`). Hoy esa categoría aparece vacía (no hay sub-recursos cargados). Vamos a:

1. Mostrar siempre las tarjetas "Pensamientos Automáticos" y "Árbol de la Preocupación" (estilo glass, como las capturas).
2. Crear el wizard de 5 pasos en `/diario-inteligente/gestion-pensamientos/pensamientos-automaticos`.
3. Persistir cada sesión en Lovable Cloud para que quede en el historial clínico del paciente.

### Estructura de archivos

```
src/pages/pensamientos/
  PensamientosHome.tsx        // grid de tarjetas glass (entrada al módulo)
  PensamientosAutomaticos.tsx // contenedor del wizard + scroll-reset + progress

src/components/pensamientos/
  shell/WizardShell.tsx       // header workspace, fondo orbes, glass surface, footer Atrás/Continuar
  steps/Step1FiltroMental.tsx
  steps/Step2Captura.tsx
  steps/Step3HechosVsPensamientos.tsx
  steps/Step4Balanza.tsx
  steps/Step5Tratamiento.tsx
  pieces/EmotionSelect.tsx
  pieces/IntensitySlider.tsx
  pieces/HechosTrainer.tsx     // mini-juego 4 ítems
  pieces/BalanzaFisica.tsx     // SVG/CSS con rotate dinámico
  pieces/EvidenceList.tsx
  pieces/DistortionCard.tsx
  pieces/PlanAccionGrid.tsx

src/lib/pensamientos/
  distortionDetector.ts        // 11 distorsiones Leahy, matching por keywords
  routing.ts                   // isRealProblem según contadores
  trainerData.ts               // 4 ítems hechos vs pensamientos
  emotions.ts                  // catálogo + fisiología sugerida
  state.ts                     // tipos del draft + hook useThoughtDraft (localStorage + Supabase)
```

### Diseño visual (RESMA Light Glassmorphism)

- Fondo base `linear-gradient(180deg,#f9f9fb,#f2f4f8)`.
- Dos orbes flotantes `position:absolute`, `blur-[100px]`, `opacity-20`, colores `#7cc2c8` y `#facb60`, animación `@keyframes float` lenta (definida en `index.css` como `--motion-orb-float`).
- Tarjetas: `bg-white/45 backdrop-blur-[28px] saturate-[180%] border border-white/60 shadow-[0_10px_30px_-10px_rgba(16,25,39,0.04)] rounded-[28px]`.
- Header workspace: chip "WORKSPACE" + "Gestión de Pensamientos", botón back redondo, botón reset (icono refresh) que limpia el draft con confirmación.
- Footer wizard sticky con botones "Atrás" (glass blanco) y "Guardar y Continuar" (dark `#101927`).
- Tipografía: serif display (la del proyecto) para títulos grandes, sans para labels.

### Scroll protegido

`PensamientosAutomaticos.tsx` mantiene un `ref` al contenedor scrolleable y un `useEffect([step])` que ejecuta `ref.current.scrollTo({top:0})`. Padding inferior `pb-40` y footer sticky con `safe-area-inset-bottom`.

### Paso 1 — Esquema de Filtro Mental (A-B-C-D interactivo)

- Nodo fijo "A. EVENTO ACTIVADOR": "Oigo que la ventana cruje por la noche 🪟".
- Dos botones-camino glass: Camino 1 catastrofista (rojo suave `#FCA5A5/30`), Camino 2 mente sabia (verde `#A7F3D0/30`). Al seleccionar, el otro queda con `opacity-50`.
- Se anima (framer-motion AnimatePresence) la tarjeta C-D con:
  - Select de emoción (opciones distintas por camino).
  - "Respuesta fisiológica" actualizada automáticamente desde un map `emotion → fisiología`.
  - "Comportamiento" texto fijo según camino.
- Sirve como onboarding educativo, no requiere input libre.

### Paso 2 — Captura personal

- Select premium de emoción (Ansiedad, Tristeza, Enojo, Culpa, Vergüenza, Frustración, Celos, Miedo, Otro). "Otro" abre input animado.
- Slider 1–100 (componente shadcn Slider, track gradient teal→ámbar). Muestra el % en grande.
- Textarea "Evento Disparador" + textarea "Pensamiento Automático" (autosize 4-6 filas).
- Validación: continuar deshabilitado hasta tener emoción, evento y pensamiento (≥10 chars).

### Paso 3 — Hechos vs Pensamientos + IA

- Acordeón "🧠 ¿Te cuesta separar Hechos de Pensamientos?" colapsado por defecto.
- Al abrir: 4 ítems del manual con dos botones "Es Hecho" / "Es Pensamiento". Feedback inmediato (✓/✗ + justificación clínica) y puntuación X/4.
- Botón "Analizar mi pensamiento con la IA" (gradiente teal→ámbar). Llama edge function `analyze-thought` que usa Lovable AI Gateway (`google/gemini-2.5-flash`) con prompt en voseo. Devuelve: (a) por qué es interpretación, (b) cómo redactarlo como hecho. Muestra respuesta dentro de tarjeta glass con shimmer mientras carga.

### Paso 4 — Balanza + Detector de Distorsiones

- **Balanza física**: SVG con soporte central, viga horizontal y dos platillos circulares con contador. Rotación: `angle = clamp((contra - favor) * 6, -25, 25)` aplicado como `transform: rotate(Xdeg)` con `transition: transform 600ms cubic-bezier(.22,.61,.36,1)`. Platillos se desplazan vertical en función del ángulo.
- Dos listas (EvidenceList) con input + botón "+", chips eliminables con "×". A favor en rojo suave, en contra en verde suave.
- **Detector de distorsiones**: `distortionDetector.ts` con tabla de 11 categorías Leahy y keywords/regex en español rioplatense (ej: "siempre|nunca|nadie" → Sobregeneralización; "debería|tendría que|tengo que" → Debo/Tengo que; "seguro que piensa|sé que cree" → Leer la mente; etc.). Devuelve top-1 con descripción clínica. Se muestra como tarjeta dorada (`bg-gradient-to-br from-[#facb60]/25 to-white/40`) titulada "ANÁLISIS DE PATRÓN COGNITIVO".
- Al continuar: `isRealProblem = favor >= contra` (igualdad cuenta como problema real, como pidió el brief).

### Paso 5 — Tratamiento (A o B)

- **Camino A (Pensamiento Alternativo)**: textarea para nueva creencia racional + slider "¿Y ahora cuánto creés en tu pensamiento negativo inicial?" (0-100). Muestra delta vs intensidad inicial con micro-celebración si bajó >20.
- **Camino B (Modificación Conductual - Form 3.12)**:
  - Textarea de lluvia de ideas + botón "Sugerir resoluciones con RESMA IA" → edge function `suggest-behavior-plan` que devuelve 3 acciones medibles (también voseo).
  - Planificador: grilla dinámica de filas con dos columnas ("¿Qué conducta haré?" / "¿Cuándo lo haré?"). Add/remove filas. Mínimo 1 fila para finalizar.
- Botón final "Finalizar sesión" que guarda en DB y navega al home del módulo con toast.

### Persistencia (Lovable Cloud)

Migración nueva (con GRANT + RLS):

```sql
create table public.thought_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  emotion text, emotion_other text, intensity_initial int,
  trigger_event text, automatic_thought text,
  evidence_for jsonb default '[]'::jsonb,
  evidence_against jsonb default '[]'::jsonb,
  distortion_key text, distortion_label text,
  is_real_problem boolean,
  alternative_thought text, intensity_final int,
  brainstorm text, action_plan jsonb default '[]'::jsonb,
  trainer_score int
);
-- GRANT select,insert,update,delete on public.thought_records to authenticated;
-- GRANT all on public.thought_records to service_role;
-- ALTER ... ENABLE RLS; policies user_id = auth.uid()
```

Borrador en `localStorage` (`resma:thought-draft:v1`) para no perder progreso si cierra la app. Al finalizar, se sube a Supabase y se limpia el draft.

### Edge functions

- `supabase/functions/analyze-thought/index.ts`
- `supabase/functions/suggest-behavior-plan/index.ts`

Ambas usan `LOVABLE_API_KEY` con `google/gemini-2.5-flash`. System prompt: psicólogo CBT rioplatense, voseo, tono empático, sin diagnóstico, máx 120 palabras. Manejo de 429/402 con mensaje al usuario.

### Detalles técnicos clave

- Todos los textos de UI en **voseo rioplatense**.
- Sin colores hardcodeados fuera de los acentos visuales del brief; clases utilitarias para el resto vía tokens del proyecto.
- `framer-motion` para transiciones entre pasos (`x: 20→0`, fade).
- Accesibilidad: labels en cada input, `aria-current` en stepper, foco al cambiar de paso.
- Mobile-first (el módulo se ve en 390px), todo responsive hasta desktop centrado a `max-w-[440px]`.

### Fuera de scope esta iteración

- Vista de historial / detalle de sesiones pasadas (se guarda en DB lista para futura pantalla).
- Panel admin de pensamientos.
- Sincronización con RESMA Band.
