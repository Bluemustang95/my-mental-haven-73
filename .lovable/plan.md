## Cambios a realizar

### 1) Admin → General → Voces: agregar voces personalizadas
- El selector actual solo muestra las voces que ElevenLabs devuelve del catálogo de tu cuenta. Para traer nuevas voces reales hay que agregarlas en la biblioteca de ElevenLabs (Voice Library o clonar); una vez agregadas aparecen automáticamente.
- Además, para casos en que ya se tiene un `voice_id` a mano (voz compartida, voz pública, voz privada aún no sincronizada), agregar en la UI un botón **"+ Agregar voz manual"** que abre un mini formulario con `voice_id`, `label` y `género`. Esa entrada se guarda en una nueva tabla `voice_library_custom` (o se inserta ad-hoc en `voice_settings`) y se fusiona con el listado de ElevenLabs en el `<select>`.
- Mostrar además un botón "Recargar catálogo" y un enlace/tooltip explicando "Para sumar más voces, agregalas primero a tu cuenta de ElevenLabs (Voice Library)".

### 2) Admin → Mindfulness: guiones por país + estado por nacionalidad
- Agregar columna `country_code TEXT NOT NULL DEFAULT 'default'` a `mindfulness_scripts_v2` y a la unique key (`exercise_id, minutes, version, country_code`).
- En `MindfulnessAdmin.tsx` agregar un cuarto filtro **"País"** (Default / Argentina / Uruguay / Chile / México / Colombia / Perú / España / EEUU). La lista de versiones y el editor pasan a filtrar también por país.
- Junto a cada versión mostrar chips con estado del audio por país (✓ verde si `mindfulness_audio_cache` tiene fila para esa `(script_id, voice_id_del_país)`).
- Botón **"Generar audio para todos los países"**: itera países configurados en `voice_settings` (femenino/masculino) e invoca `mindfulness-precache` por cada uno. Alternativamente, el botón "Generar audio" actual queda país-por-país usando la voz configurada del país activo.
- Respuesta a "¿se hace de una?": **no**, ElevenLabs cobra por síntesis y cada país usa distinta voz/acento, así que hay que generar por país. La UI lo hace en batch para no tener que hacer clic uno por uno.

### 3) Reproductor de Mindfulness: honrar voz + ambiente elegidos
- Bug: `useUserVoice` cae al fallback legacy cuando `voice_settings` no tiene fila para Argentina/género. Además, el reproductor no consulta el guion pre-cacheado por país, solo sintetiza cues (`Inhalá`/`Exhalá`) con la voz global.
- Cambios:
  - Al entrar al ejercicio, hacer lookup del guion pre-cacheado por `(exercise_id, minutes, country_code)` + voz del usuario en `mindfulness_audio_cache`; si existe, reproducirlo como pista guía en vez de sintetizar por cue.
  - Si no hay precache, seguir con cues sintetizados **pero** usando el `voiceId` de `useUserVoice` de forma consistente (hoy hay un `getGlobalVoice()` fallback dentro de `elevenLabsTTS` que puede pisarlo).
  - Ambiente: leer de localStorage la última selección global al montar el reproductor (hoy usa el estado inicial del padre, que puede quedar desincronizado tras cambiar en Ajustes globales).

### 4) UI del reproductor: timer arriba, chico
- Mover el chip del timer de `flex-1 justify-center` a un pequeño pill centrado justo **debajo del título** ("DORMIR MEJOR"), tipografía chica (`text-[15px]` tabular), como estaba antes.
- El centro de la pantalla queda libre para el visualizador (esfera). La fase (`INHALÁ`) y los tres botones (Reanudar / Ajustes / Detener) quedan igual, abajo.

### Archivos afectados
- `supabase/migrations/*` → nueva migración: `country_code` en `mindfulness_scripts_v2` + unique, tabla `voice_library_custom` (id, voice_id, label, gender, created_at) con RLS admin-only.
- `src/pages/admin/modules/GeneralAdmin.tsx` → botón "+ Agregar voz manual" + merge del catálogo.
- `src/pages/admin/modules/MindfulnessAdmin.tsx` → filtro país + botón batch multi-país + estado audio por país.
- `supabase/functions/mindfulness-precache/index.ts` → aceptar `country_code` en la ruta de storage y resolver voz automáticamente si se pasa `country_code` sin `voiceId`.
- `src/pages/mindfulness/BreathingHome.tsx` → mover timer al header, cargar audio precacheado por país, re-hidratar ambiente desde localStorage al entrar.
- `src/hooks/useUserVoice.tsx` → asegurar que nunca cae al `getGlobalVoice` cuando hay perfil + voz por país configurada.

### Nota técnica sobre el costo/tiempo
Generar 4 ejercicios × 4 duraciones × ~5 versiones × 8 países × 2 géneros = **~1.280 audios**. Cada guion ronda 500-1500 caracteres → costo ElevenLabs multilingüe ~$0.15-0.45 por audio. Se recomienda generar solo la voz por defecto (femenina) para cada país al principio, y masculinas on-demand. La UI del batch va a mostrar un progreso claro.
