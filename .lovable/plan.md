# Prompts editables para cada feature de IA + rewrite de Resmita

## Estado actual

Consulté `ai_feature_configs`. De 10 features, **6 tienen `system_prompt` vacío** y una necesita reescritura:

| Feature | Prompt actual | Acción |
|---|---|---|
| `resmita_chat` | Terapéutico (1114 chars) | **Reescribir** — no terapéutico, solo dudas |
| `analyze_thought` | Vacío | Crear (persona base + guardrails) |
| `describe_neutral` | Vacío | Crear |
| `suggest_behavior_plan` | Vacío | Crear |
| `suggest_evidence` | Vacío | Crear |
| `mindfulness_tts` | Vacío | N/A — ElevenLabs TTS, no usa system prompt |
| `transcribe_voice` | Vacío | N/A — Whisper, no usa system prompt |
| `onboarding_algo` | Vacío | N/A — motor determinista, no LLM |

## 1. Reescribir `resmita_chat` (rol reducido)

Nueva persona: **asistente de dudas de la app RESMA, no terapéutica**. Reglas:
- Solo responde dudas sobre **cómo usar la app** (navegación, funciones, ajustes, notificaciones, plan/premium, privacidad, backup).
- **No** da consejo terapéutico, no interpreta emociones, no valida "cómo te sentís", no sugiere ejercicios propios.
- **No** habla de RESMA como institución (equipo, sedes, precios, terapeutas humanos, política).
- **No** diagnostica ni recomienda tratamientos.
- Si el usuario pide ayuda emocional o clínica → mensaje breve derivando: "Para eso, dentro de la app tenés [Diario / Herramientas / Mi proceso]. Si necesitás hablar con alguien ya, tocá el botón rojo de crisis."
- Si pregunta sobre RESMA institucional → "No puedo darte info institucional. Escribinos a contacto@resma.com.ar."
- Tono argentino (voseo), breve, directo, sin emojis excesivos, sin markdown pesado.
- Máx 4 oraciones por respuesta salvo tutoriales paso a paso.

## 2. Prompts nuevos para features con LLM

**`analyze_thought`** — Persona base + guardrails compartidos por los 4 modos (holistic/identify/alternatives/refine). El código seguirá agregando instrucciones específicas por modo.

**`describe_neutral`** — Ya existe en código como `SYSTEM`. Migrar ese texto tal cual al DB para que sea editable desde admin.

**`suggest_behavior_plan`** — Persona CBT + activación conductual, salida JSON estructurada.

**`suggest_evidence`** — Persona CBT + reglas para evidencias a favor/en contra.

Cada prompt: 300–800 chars, en español rioplatense, con guardrails de no-diagnóstico y no reemplazo de terapia.

## 3. Cambio de código: usar `cfg.system_prompt` como persona layer

Hoy `analyze-thought`, `suggest-behavior-plan` y `suggest-evidence` **ignoran** `cfg.system_prompt` (solo leen `model` + `temperature`). Editar cada edge function para que el system message enviado al modelo sea:

```
{cfg.system_prompt || fallback_persona}

{instrucciones_específicas_del_modo}
```

Así los cambios en admin toman efecto sin redeploy.

`describe_neutral` ya usa `cfg.system_prompt ?? SYSTEM` → no requiere cambio de código, solo seed.

`resmita_chat` ya usa el prompt del DB → solo update.

## 4. Admin UI: marcar features sin prompt como N/A

En `src/pages/admin/AiFeaturesManager.tsx` / `AiFeatureEditor.tsx`:
- Agregar flag `promptEditable` deducido del `feature_key`. Para `mindfulness_tts`, `transcribe_voice`, `onboarding_algo` → mostrar badge "Sin prompt (motor no-LLM)" y ocultar el textarea (o dejarlo como campo de notas internas).
- Así el admin ve claro por qué esos 3 están vacíos.

## 5. ¿Falta algo? (recomendaciones opcionales)

- **Botón "Probar prompt"** en el editor de admin: envía un input de prueba al modelo con el prompt actual y muestra la respuesta. Útil para iterar sin salir de admin.
- **Historial de versiones** de cada prompt (`ai_prompt_versions` con user_id del editor, timestamp, diff) para rollback y auditoría clínica.
- **Alinear modelos**: `analyze_thought`, `suggest_behavior_plan`, `suggest_evidence` usan `gemini-2.5-flash`; el resto `gemini-3-flash-preview`. Unificar a `gemini-3-flash-preview` (más nuevo, mismo costo) salvo que haya razón clínica para lo contrario.
- **Placeholder de variables**: documentar en cada prompt qué placeholders acepta (ej: `{screenTitle}`, `{userSummary}`) para que quien edita sepa qué no romper.

Estos 3 no los ejecuto salvo que los pidas.

## Archivos afectados

- **Migración**: `supabase/migrations/[timestamp]_seed_ai_prompts.sql` — UPDATE de `ai_feature_configs` con los prompts nuevos.
- **Editar**: `supabase/functions/analyze-thought/index.ts`, `supabase/functions/suggest-behavior-plan/index.ts`, `supabase/functions/suggest-evidence/index.ts` — usar `cfg.system_prompt` como preamble.
- **Editar**: `src/pages/admin/AiFeaturesManager.tsx` y/o `src/components/admin/AiFeatureEditor.tsx` — badge N/A para los 3 no-LLM.
