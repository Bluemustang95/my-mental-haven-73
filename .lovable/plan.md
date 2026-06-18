# Ajustes finales Pensamientos Automáticos

## 1. Footer arriba de la tab bar global

El footer fijo del wizard se está pisando con la `BottomNav` flotante (cápsula oscura en `bottom: max(1rem, safe-area)` ≈ 80–96 px de alto).

- Mover el footer del wizard a `bottom: calc(env(safe-area-inset-bottom) + 5.5rem)` (mismo patrón que ya usa `src/components/dbt/shared.tsx`), con `z-30` y fondo sólido más sombra superior suave.
- Aumentar el `pb` del scroll interno a `pb-56` para que el último contenido se vea por encima del footer + tab bar.
- Quitar el padding extra que estaba compensando.

## 2. Sizing tipo onboarding

Adoptar los mismos tokens de `src/pages/Onboarding.tsx`:

- Header del wizard: título `text-[20px]` font-display semibold (no font-serif bold) + caption `text-[11px]`.
- Cards: `rounded-3xl`, `p-4`, sombra `shadow-glass`, border `border-white/60`, `bg-white/75 backdrop-blur-xl`.
- Tipografías internas: títulos de card `text-[14px] font-semibold`, ayudas `text-[11.5px]`, inputs/textareas `text-[13.5px]`, botones `text-[13px]`.
- Reducir ancho a `max-w-[420px]` (más cercano al rendering real de onboarding).
- Progress bar más fina (`h-[3px]`).

## 3. Paso 4 — Planificador de acciones

La grilla `2 cols + botón` no entra en 390 px. Se reescribe el row:

```text
[ Acción (full width)                            ✕ ]
[ 📅 Día / hora (full width)                       ]
```

Cada acción queda como una mini-card vertical de dos inputs apilados + botón X en la esquina. Más legible y nunca se desborda.

## 4. IA que no responde

Los logs de `analyze-thought` muestran solo "booted", lo que indica que las invocaciones fallaron antes de loguearse o que el modelo devolvió contenido vacío al pedir `response_format: json_object` (Gemini en el gateway no siempre acepta ese flag y devuelve `content: ""`).

Cambios:

- Quitar `response_format` de `analyze-thought` y `suggest-evidence`.
- Pedir JSON en el system prompt y parsear con tolerancia (extraer el primer bloque `{...}` con regex como fallback).
- Si el parseo falla, devolver `factual: contenidoCrudo, questions: []` para que al menos se vea algo en pantalla.
- Subir `temperature: 0.4` y `max_tokens` explícito.
- Agregar `console.log` mínimo del status + primeros 200 chars del body para diagnosticar desde logs.
- En el cliente, si la respuesta llega vacía, mostrar un toast claro ("La IA no devolvió respuesta, probá de nuevo") en lugar de quedar en silencio.

## Archivos a editar

- `src/components/pensamientos/shell/WizardShell.tsx` (sizing + footer arriba del tab bar)
- `src/components/pensamientos/steps/Step2Captura.tsx`, `Step3Evidencias.tsx`, `Step4Tratamiento.tsx`, `Step1FiltroMental.tsx` (tokens onboarding)
- `src/components/pensamientos/pieces/GlassCard.tsx` (rounded-3xl + shadow-glass)
- `src/components/pensamientos/pieces/EvidenceList.tsx`, `TermometroEvidencia.tsx` (tokens onboarding)
- `src/components/pensamientos/steps/Step4Tratamiento.tsx` (planificador vertical)
- `supabase/functions/analyze-thought/index.ts` y `suggest-evidence/index.ts` (parseo tolerante + sin response_format)

Sin cambios de schema.
