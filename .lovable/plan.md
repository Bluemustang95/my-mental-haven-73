
## Problema
Hoy el JSON de la animación se inserta en el editor como base64 dentro del texto (`[[lottie:BASE64:align]]`). Al ser un string enorme, el editor se estira horizontalmente y no llegás al botón "Guardar".

## Solución
Subir el archivo `.json` a un bucket de Storage y dejar en el HTML solo un token corto con la URL: `[[lottie:https://.../abc.json:center]]`.

## Cambios

1. **Storage** — crear bucket público `lottie-animations` (via `supabase--storage_create_bucket`) + política RLS de INSERT solo para admins.

2. **Editor (`RichTextEditor.tsx`)** — al elegir el archivo:
   - `supabase.storage.from("lottie-animations").upload(...)` con nombre único.
   - obtener `getPublicUrl`.
   - insertar `<p>[[lottie:URL:align]]</p>` (token corto, no rompe el layout).
   - toast de progreso ("Subiendo…" → "Animación insertada").

3. **Renderer (`RichContent.tsx`)** — actualizar el regex para aceptar URLs (`https://...\.json`) además del formato base64 anterior (backwards-compat). Cuando el token es URL, `fetch(url)` una sola vez, cachear en un `Map` en memoria y renderizar con `<Lottie animationData=... />`. Loader sutil mientras carga.

4. **UI del modal admin** — sin cambios; el problema del scroll horizontal se resuelve solo al no tener strings gigantes.

## Notas técnicas
- Los tokens antiguos con base64 siguen funcionando (compat).
- Bucket público para que la app cliente pueda hacer `fetch` sin auth.
- Naming: `lottie-{timestamp}-{random}.json`.
