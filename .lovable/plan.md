## 1. Temporizador y layout del ejercicio

**`TimeSetupScreen.tsx`**: reemplazar `OPTIONS = [1, 3, 5, 10]` por `[1, 5, 10, 15, 20]` (grid 3 columnas para que entren las 5 opciones sin permitir valores intermedios).

**Reproductor inmersivo (`BreathingHome.tsx` → pantalla de sesión)**:
- Centrar verticalmente el contador de tiempo (mm:ss) — hoy queda desplazado por el header/píldora.
- Mover el botón "Ajustes" a la fila inferior, al lado de "Pausar" (mismo tamaño y estilo glass). Quitarlo del header.
- Precargar el guion completo en ElevenLabs **antes** de iniciar (spinner "Preparando tu sesión…" en la transición TimeSetup → Player, para que la voz arranque en cuanto la persona toca Comenzar).

## 2. Guiones precargados vía ElevenLabs (cero espera para el usuario final)

Estrategia: **pre-síntesis server-side + cache compartido en Supabase Storage**, en vez de sintetizar por-usuario en el cliente (que es lo que hoy hace `elevenLabsTTS.ts` con IndexedDB).

- Nuevo bucket público `mindfulness-audio/` con estructura `{voice_id}/{exercise_id}/{minutes}/{version}.mp3`.
- Nueva edge function `mindfulness-precache`: recibe `{ scriptId, minutes, version, voiceId }`, sintetiza vía ElevenLabs y sube el MP3 al bucket. La usa el admin al guardar un guion (botón "Generar audio"). Idempotente.
- Nueva tabla `mindfulness_audio_cache` (script_id, minutes, version, voice_id, storage_path, duration_sec, generated_at).
- En el cliente, `synthesize()` primero consulta la tabla; si existe, reproduce el MP3 público directo (0 latencia, sin costo de IA por reproducción). Solo cae al flujo actual como fallback.

## 3. Admin — Guiones por minuto y múltiples versiones

Refactor de `MindfulnessAdmin.tsx`:
- Modelo nuevo: cada ejercicio (478, sigh, box, coh, etc.) tiene guiones agrupados por **duración** (5, 10, 15, 20 min) y, dentro de cada duración, **N versiones** (mínimo 5, ideal 10).
- Navegación en 3 niveles: Ejercicio → Duración (tabs 5/10/15/20) → Versión (lista + "Nueva versión").
- Cada versión: título corto, texto del guion, autor, `audio_status` (sin generar / generado / desactualizado), botón "Generar audio" (llama `mindfulness-precache`).
- Selección en runtime: cuando el usuario elige minutos, el player toma una versión al azar (o rotativa) de esa duración para variar la experiencia.
- Persistencia: migrar de `admin_settings` (JSON monolítico) a tabla `mindfulness_scripts_v2` (id, exercise_id, minutes, version, title, script_text, active, created_at). GRANTs + RLS admin-only escritura, lectura autenticada.

## 4. Admin — Nueva sección "General" en Principal

Bajo "Dashboard principal" agregar item de menú **"General"** con dos subpestañas:

### 4.1 Voces (por país, masculino + femenino)
- Tabla `voice_settings` con `country_code`, `gender` ('male'|'female'), `voice_id`, `label`.
- UI: lista de países (AR, UY, ES, MX, CO, CL, PE, US, "default"), cada uno con dos selects (M / F) que traen las voces de ElevenLabs (endpoint `/v1/voices` vía nueva edge function `list-elevenlabs-voices`).
- Perfil del usuario: nuevo campo `voice_gender_preference` en `patient_app_profiles` + control en `Ajustes` ("Preferencia de voz: Femenina / Masculina").
- `useUserVoice.tsx` resuelve: `profile.voice_id` (override) → `voice_settings[country][gender]` → default. Se aplica en todos los módulos de voz (mindfulness, respiración, sueño).

### 4.2 Gasto de IA
- Tabla `ai_usage_log` (provider, model, feature, tokens_in, tokens_out, chars, cost_usd, user_id, created_at).
- Instrumentar edge functions existentes (`mindfulness-tts`, `pensamientos-companion`, `resmita-chat`, `transcribe-voice`, `mindfulness-precache`) para escribir un log por llamada con costo estimado (según tarifas de cada modelo).
- Dashboard: total mes actual, breakdown por feature (Mindfulness TTS, Pensamientos IA, Resmita, Transcripción), gráfico línea últimos 30 días, top 10 usuarios por consumo. Filtro de rango de fechas.

## Detalles técnicos

- Migraciones nuevas: `mindfulness_scripts_v2`, `mindfulness_audio_cache`, `voice_settings`, `ai_usage_log` (todas con GRANTs a `authenticated`/`service_role` + RLS: lectura autenticada donde aplica, escritura admin-only vía `has_role`).
- Bucket público `mindfulness-audio` (audio pregenerado, sin datos personales).
- Nuevas edge functions: `mindfulness-precache`, `list-elevenlabs-voices`.
- Config: costos por modelo en `admin_settings.ai_pricing` (editable) para calcular `cost_usd` sin hardcodear tarifas.
- `patient_app_profiles.voice_gender_preference` + UI en `Ajustes`.

## Fuera de alcance

- No se generan aún las 5-10 versiones de guion (queda como tarea de contenido en admin, con la UI lista para cargarlas).
- No se rehace el motor visual de los ejercicios (Lottie/SVG existentes se mantienen).
