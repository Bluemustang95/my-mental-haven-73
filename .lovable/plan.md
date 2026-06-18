# Mejoras Pensamientos Automáticos

Reestructuro el flujo para que sea más corto, más funcional y consistente con el resto de la app.

## 1. Layout y tamaños

- Bajar el contenedor de `max-w-[480px]` a la medida estándar de la app (`max-w-md` ≈ 448px) y reducir tipografías de títulos (`text-3xl` → `text-2xl`, `text-2xl` → `text-xl`) y paddings de las `GlassCard` (`p-5` → `p-4`).
- Arreglar el solape de la barra inferior con el botón "Continuar":
  - Aumentar el `pb` del scroll interno de `pb-40` a `pb-44`.
  - Quitar el `min-h-screen` rígido y usar `h-[100dvh]` para evitar el corte en móviles con barra dinámica.
  - El footer pasa a tener fondo sólido con borde superior (no gradiente translúcido) para que se lea siempre el botón.

## 2. Nueva estructura: 4 pasos (antes 5)

```text
Paso 1  Filtro Mental (igual, más compacto)
Paso 2  Captura + Análisis IA (fusiona el actual 2 y 3)
Paso 3  Evidencias + IA (nuevo gráfico, sin balanza)
Paso 4  Tratamiento (igual, con routing A/B)
```

Se elimina el "mini-juego Hechos vs Pensamientos" como paso independiente (queda como tooltip educativo opcional dentro del Paso 2). El usuario llega antes a lo accionable.

## 3. Paso 2 — Captura con Análisis IA en línea

El paso conserva las 3 cards (Emoción + intensidad / Evento / Pensamiento) y agrega debajo de "Pensamiento automático":

- Botón **"Analizar con IA"** (mismo edge function `analyze-thought`, ya existente).
- El resultado se renderiza inmediatamente **debajo del textarea del pensamiento**, en un bloque de feedback en línea (no en card separada) con:
  - Reformulación fáctica sugerida del pensamiento.
  - 1–2 preguntas socráticas para profundizar.
  - Botón "Usar esta versión" que reemplaza el contenido del textarea por la versión fáctica.
- El edge function `analyze-thought` se ajusta para devolver `{ factual, questions[] }` en lugar de un solo bloque de texto (estructurado vía Output del SDK).

Se desactiva el avance al Paso 3 hasta que (a) los 3 campos estén completos o (b) el usuario explícitamente toque "Saltar análisis".

## 4. Paso 3 — Evidencias con nuevo gráfico e IA

Se reemplaza la balanza SVG por un **Termómetro de Evidencia Fáctica**: una barra horizontal segmentada tipo "medidor de credibilidad" que va de 0 a 100 %.

```text
[ ▓▓▓▓▓▓░░░░░░░░░░░░░░ ]  38 % factual
 a favor (rojo cálido)   |   en contra (verde menta)
```

- Cálculo: `score = en_contra / (a_favor + en_contra) * 100`, con etiqueta dinámica ("Pensamiento poco sostenido por hechos", "Sostenido parcialmente", etc.).
- Debajo del medidor: chip con la **distorsión cognitiva** detectada (ya existe `distortionDetector`), tappable para abrir descripción.

Razones para preferir el termómetro sobre la balanza:
- Comunica un porcentaje concreto, no una metáfora visual ambigua.
- Funciona bien en mobile angosto (la balanza necesita altura y se siente "infantil").
- Permite mostrar progreso a medida que se agregan evidencias.

Alternativas consideradas (puedo cambiar a otra si preferís): tablero "Pro / Contra" tipo Kanban con conteo, gauge semicircular, o pirámide invertida de credibilidad.

**Asistencia IA nueva en el paso**: dos botones contextuales sobre cada lista:
- **"Sugerirme evidencias a favor"** y **"Sugerirme evidencias en contra"** → nuevo edge function `suggest-evidence` que, dado `triggerEvent + automaticThought + lado`, devuelve 3 sugerencias clicables que el usuario puede aceptar/editar/descartar antes de agregarlas. Esto destraba al usuario cuando no se le ocurren pruebas.
- Las sugerencias aceptadas se marcan internamente con `source: "ai"` para futuro analytics, sin mostrarlo en UI.

## 5. Paso 4 — Tratamiento

Queda igual funcionalmente, pero:
- Se usa el `score` del termómetro (no el conteo crudo) para decidir Path A (Reestructuración) si `score ≥ 60` o Path B (Plan conductual) si `score < 60`.
- Se muestra al inicio del paso un resumen de 3 líneas: emoción + intensidad, pensamiento original, % factual del termómetro.

## 6. Persistencia

- Se mantiene la tabla `thought_records` tal cual.
- El estado local (`useThoughtDraft`) reduce `step` de 5 a 4 y agrega `aiAnalysisStructured: { factual, questions }` y `evidenceSources: { for: string[], against: string[] }`.
- Migración no requerida (el JSONB ya acepta los nuevos campos).

## Requisitos técnicos

- Archivos a editar:
  - `src/components/pensamientos/shell/WizardShell.tsx` (layout/sizes/footer).
  - `src/components/pensamientos/steps/Step2Captura.tsx` (integrar IA inline).
  - `src/pages/pensamientos/PensamientosAutomaticos.tsx` (4 pasos, routing renumerado).
  - `src/lib/pensamientos/state.ts` (nuevos campos).
  - `supabase/functions/analyze-thought/index.ts` (output estructurado).
- Archivos a crear:
  - `src/components/pensamientos/pieces/TermometroEvidencia.tsx` (nuevo gráfico).
  - `src/components/pensamientos/steps/Step3Evidencias.tsx` (reemplaza `Step4Balanza`).
  - `supabase/functions/suggest-evidence/index.ts`.
- Archivos a eliminar:
  - `src/components/pensamientos/steps/Step3HechosVsPensamientos.tsx`
  - `src/components/pensamientos/steps/Step4Balanza.tsx`
  - `src/components/pensamientos/pieces/BalanzaFisica.tsx`
  - `src/components/pensamientos/pieces/HechosTrainer.tsx`
  - `src/lib/pensamientos/trainerData.ts`
- Renumeración: `Step5Tratamiento` pasa a ser `Step4Tratamiento` (rename archivo + import).
- Voseo rioplatense clínico mantenido en todos los textos nuevos y prompts IA.

## Pregunta abierta

¿Vamos con el **Termómetro de Evidencia** como gráfico nuevo, o preferís ver primero un mock con otra opción (gauge semicircular o Pro/Contra Kanban)?
