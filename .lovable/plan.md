
## Contexto

Hoy los sonidos ambientales (lluvia, olas, viento, grillos, fogata, ruidos, 528Hz, etc.) **no son archivos**: se generan en tiempo real con Web Audio API en el navegador (`ambientLibrary.ts`, `diarioAudio.ts`, `sleepAudio.ts`). Por eso la pestaña Audios del admin aparece vacía de ambientes — sólo lista lo que existe en el bucket `mindfulness-audio` (voces de guiones).

## Objetivo

Unificar todos los audios del sistema en un único panel donde el admin vea:
- **Todos los ambientes sintetizados** (los 18 preexistentes + los del Diario Zen y Sueño).
- **Todos los audios de voz** (guiones Mindfulness cacheados).
- **Botón "Subir MP3"** por cada ambiente para reemplazarlo con un archivo real. Si existe MP3, el player lo usa; si no, cae al sintetizado.

## Cambios

### 1. Backend

**Nueva tabla `ambient_audio_overrides`** (schema-level, vía migration):
- `id uuid pk`
- `sound_id text unique` (ej. `rain_soft`, `waves_strong`, `campfire`)
- `label text` (nombre visible, ej. "Lluvia suave")
- `category text` (lluvia/viento/agua/naturaleza/abstractos/zen/sueño)
- `storage_path text` (ruta dentro del bucket)
- `duration_seconds int null`
- `active bool default true`
- `updated_at timestamptz`
- GRANTs a `authenticated` (SELECT) y `service_role` (ALL); RLS: lectura pública para users autenticados, escritura sólo admin (vía `has_role`).

**Nuevo bucket `ambient-audio`** (privado; se sirven URLs firmadas o públicas según necesidad — arrancamos privado y usamos `createSignedUrl`).

### 2. Catálogo unificado (frontend)

**Nuevo archivo `src/lib/ambientCatalog.ts`**: exporta un array único con los 18 ambientes de `ambientLibrary.ts` + los 4 extra del Diario Zen (solfeggio 528Hz, click, ocean, wind únicos) + los de sueño (waves, rain de sleep). Cada entry:
```ts
{ id, label, category, source: "synth", builder }  // sintético
```
Este catálogo es la **fuente de verdad** para el admin (para renderizar la lista) y para los players.

### 3. Player con fallback

Nuevo helper `resolveAmbientAudio(id)`:
1. Busca en `ambient_audio_overrides` (con cache de 5 min en memoria).
2. Si hay override activo → devuelve URL firmada del MP3 → el player usa `<audio loop>` con esa URL.
3. Si no → devuelve el `builder` sintetizado original.

Se integra en `useAmbientPlayer.ts`, `diarioAudio.ts` (Diario Zen) y `sleepAudio.ts` (Santuario del Sueño) — todos comparten el mismo resolver.

### 4. Admin — pestaña Audios rediseñada

En `src/pages/admin/modules/GeneralAdmin.tsx` reemplazo el `AudiosTab` actual por dos sub-secciones:

**A. "Ambientes"** (nueva, arriba)
- Lista los 22 ambientes del catálogo agrupados por categoría (Lluvia, Viento, Agua, Naturaleza, Abstractos, Zen, Sueño).
- Cada fila:
  - Nombre + badge de categoría.
  - Badge de origen: `Sintetizado` (gris) o `MP3 personalizado` (teal) si hay override.
  - Botón ▶️ que reproduce en preview (10s).
  - Botón **"Subir MP3"** → input file (mp3/ogg/wav, máx 10 MB) → sube al bucket como `ambient/{sound_id}.mp3` → upsert en `ambient_audio_overrides`.
  - Botón "Restaurar sintetizado" si hay override (soft delete: `active=false`).

**B. "Voces de guiones"** (la lista actual)
- Sigue tal cual: archivos de `mindfulness-audio` + huérfanos + subida a `custom/`.

### 5. Refresh de player

Cuando el admin sube/restaura un override, invalida la cache local (via evento `window.dispatchEvent('ambient-overrides-changed')`) para que la próxima reproducción refetche.

## Notas técnicas

- No borro `ambientLibrary.ts` ni sus sintetizadores — quedan como fallback siempre disponible offline.
- El bucket `ambient-audio` queda **privado** con URLs firmadas de larga duración (1h) cacheadas en memoria — evita fugas y CORS público.
- El player HTML `<audio>` usa `loop=true` + `crossfade` corto al iniciar/detener para igualar la transición suave de los sintetizados.
- Sin cambios en la UI del usuario final — sólo mejora la calidad del sonido si el admin sube MP3.

## Archivos afectados

- `supabase/migrations/*_ambient_audio_overrides.sql` (nuevo)
- Bucket `ambient-audio` (nuevo)
- `src/lib/ambientCatalog.ts` (nuevo)
- `src/lib/ambientResolver.ts` (nuevo)
- `src/hooks/useAmbientPlayer.ts` (integrar resolver)
- `src/lib/diarioAudio.ts`, `src/lib/sleepAudio.ts` (usar resolver)
- `src/pages/admin/modules/GeneralAdmin.tsx` (nueva sub-pestaña "Ambientes")
