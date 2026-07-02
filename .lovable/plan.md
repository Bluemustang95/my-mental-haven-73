## Objetivo
1. Permitir subir MP3 de ambientes de **hasta 50 MB** (hoy hay un límite implícito ~12 MB).
2. Confirmar/garantizar que un audio más corto que el ejercicio (ej. 9 min en una práctica de 20 min) **se repita en loop automáticamente** sin cortes.

## 1. Ampliar límite de subida a 50 MB

**Dónde vive el límite hoy:**
- Bucket `ambient-audio` en Storage: cada bucket tiene un `file_size_limit`. El default suele ser ~10-12 MB, por eso te rechaza archivos más grandes.
- Además, el input de admin (`GeneralAdmin.tsx`, pestaña Audios → "Nuevo ambiente" y overrides) no valida ni informa el máximo.

**Cambios:**
- **Migration**: actualizar el bucket `ambient-audio` para `file_size_limit = 52428800` (50 MB) y `allowed_mime_types = ['audio/mpeg','audio/mp4','audio/wav','audio/ogg']`. Hacer lo mismo con `mindfulness-audio` por consistencia.
- **`src/pages/admin/modules/GeneralAdmin.tsx`**:
  - Validación client-side: si `file.size > 50 MB`, toast con mensaje claro ("Máximo 50 MB").
  - Mostrar el peso del archivo elegido y el máximo en el diálogo de "Nuevo ambiente" y en el override de sonidos built-in.
  - Manejar el error del bucket (`Payload too large`) con un toast entendible en lugar del error crudo.

Nota: 50 MB alcanza para ~50 min en MP3 128 kbps o ~35 min en 192 kbps. Si más adelante necesitás archivos más largos, conviene bajar el bitrate del MP3 antes de subir (a 96–128 kbps la calidad de un ambiente es indistinguible).

## 2. Loop automático cuando el audio dura menos que el ejercicio

**Estado actual (`src/lib/ambientResolver.ts` → `playOverride`):**
- Los MP3 override se reproducen con un `AudioBufferSourceNode` (o `<audio>`) y **ya deberían** setear `loop = true`. Hay que verificar los 2 caminos:
  - `playOverride(ctx, url, volume)` para overrides de built-in.
  - El nuevo camino para "custom" agregado recientemente en `useAmbientPlayer.setSound` (usa la misma función `playOverride`).

**Cambios (solo si falta alguno):**
- Asegurar `source.loop = true` en el `AudioBufferSourceNode`, o `audio.loop = true` si usa `<audio>`.
- Fade-in muy corto (~150 ms) al arrancar y crossfade suave en el punto de loop si el archivo no está preparado para loopear sin "click". Implementación mínima: al detectar `ended` (no debería dispararse con loop=true, pero como safety) rearrancar.
- Un `console.log` de diagnóstico en dev cuando se carga el buffer, indicando duración + `loop=true`, para poder verificar.

**Comportamiento resultante:**
- MP3 de 9 min en ejercicio de 20 min → se reproduce continuo, reiniciando internamente cada 9 min.
- El usuario no percibe corte siempre que el archivo termine con silencio o fade-out (recomendación en el tooltip de "Nuevo ambiente": "para loop perfecto, subí audios con fade-in/out o extremos silenciosos").

## Archivos a tocar
- Migration (schema del bucket).
- `src/pages/admin/modules/GeneralAdmin.tsx` — validación y UX del uploader.
- `src/lib/ambientResolver.ts` — confirmar/garantizar loop.

## Fuera de alcance
- No cambia el catálogo dinámico ni el resolver de overrides ya construidos.
- No se tocan Mindfulness ni Diario: el loop es transparente para ambos consumidores.
