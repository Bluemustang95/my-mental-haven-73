## Cambios en `/diario` y Admin

### 1) Admin: nueva sección "Diario" en Recursos Clínicos
- Nueva tabla `diary_inspire_prompts` (campos: `text`, `tag`, `active`, `sort_order`) + RLS: lectura pública autenticada, escritura solo admin.
- Nueva página `src/pages/admin/modules/DiarioAdmin.tsx` con una pestaña "Inspirarme" que permite listar, agregar, editar, activar/pausar y eliminar prompts (misma estética que `ContenidoDiarioAdmin`).
- Ruta `/admin/diario` en `App.tsx` + entrada "Diario" con icono `BookOpen` en el grupo "Recursos Clínicos" de `AdminLayout.tsx`.

### 2) Inspirarme (frontend `Diario.tsx`)
- Cargar prompts desde `diary_inspire_prompts` (fallback al array local si no hay datos).
- Elegir uno al azar; guardar en localStorage el historial `{prompt_id → última fecha usada}`.
- Si el prompt ya fue usado antes: mostrar aviso "El {fecha} escribiste con este mismo Inspirame — releé y compará" con un botón "Ver aquella entrada" que abra el historial filtrando por ese prompt.
- Sacar el `tag` (título en mayúsculas arriba de la frase) del banner del prompt: mostrar solo el texto.

### 3) Grabación de voz → texto
- Reemplazar el flujo actual (que sube archivo `.webm`) por transcripción vía la Lovable AI Gateway (`openai/gpt-4o-mini-transcribe`).
- Nueva edge function `transcribe-voice`: recibe audio multipart, llama al gateway, devuelve texto.
- Al detener la grabación, insertar el texto transcripto al final del editor (sin adjuntar archivo, sin `voice_note_path`).
- Mostrar estado "Transcribiendo…" en la barra de grabación.

### 4) Iconos "Siento" y "Etiqueta" más aesthetic + multi-selección de emoción
- Cambiar `Smile` y `Tag` por iconos Phosphor duotone (`SmileyWink`, `Tag` de `@phosphor-icons/react`, weight `duotone`) al estilo de `HabitCard`.
- Convertir `emo: string | null` a `emos: Set<string>` (permitir múltiples emociones).
- Guardar `emotion_tags` como concat de emociones + causas (formato ya usado).
- Actualizar chips del popover al mismo estilo redondeado de Hábitos.

### 5) Historial: navegación, bottom nav y adjuntos
- Ocultar `BottomNav` global cuando se abre el detalle de una entrada: agregar clase `body.entry-open` (mismo patrón que `zen-mode`) y regla CSS en `index.css` para esconder `nav`.
- Agregar botón "← Volver a Diario" en el header del `HistoryView` (además del actual icono).
- En el detalle: cargar y renderizar los `attachments` de la entrada (imágenes en grid + audios/archivos como chips), reutilizando el signed URL de Storage.

### 6) Sacar Privacidad y cifrado
- Eliminar botón candado del header y el `PrivacyDialog`.
- Eliminar botón candado del `HistoryView`.
- Quitar dependencias de `e2e.*` en `Diario.tsx` (mantener el módulo por si otras vistas lo usan; solo dejar de invocarlo aquí — nuevas entradas siempre se guardan sin cifrar `is_encrypted:false`).

### 7) Zen — sonidos con iconos + "Ver más"
- Reemplazar emojis por iconos Phosphor duotone (`CloudRain`, `MusicNote`, `Waveform`, `Keyboard`, etc.) en `SoundscapePopover`.
- Mostrar 4 principales y agregar botón "Ver más" que expanda una lista completa desde `src/lib/ambientLibrary.ts` (ya existe una biblioteca ampliada; mapear cada entrada a `audio.Track` y a un icono).

### Detalles técnicos

**Migración SQL:**
```sql
CREATE TABLE public.diary_inspire_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  tag text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.diary_inspire_prompts TO authenticated;
GRANT ALL ON public.diary_inspire_prompts TO service_role;
ALTER TABLE public.diary_inspire_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read prompts" ON public.diary_inspire_prompts FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage" ON public.diary_inspire_prompts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
```

**Edge function `transcribe-voice`:** `POST` multipart `file` + `model=openai/gpt-4o-mini-transcribe` a `https://ai.gateway.lovable.dev/v1/audio/transcriptions` con `Authorization: Bearer ${LOVABLE_API_KEY}`. Devuelve `{ text }`.

**Historial "usado antes":** `usedPrompts = JSON.parse(localStorage.getItem('diary:inspire:history')||'{}')`. Al elegir prompt, si existe → banner con fecha guardada; luego actualizar la fecha al guardar la entrada.

**Archivos afectados:**
- Nuevo: `supabase/migrations/*.sql`, `src/pages/admin/modules/DiarioAdmin.tsx`, `supabase/functions/transcribe-voice/index.ts`.
- Editar: `src/App.tsx`, `src/components/admin/AdminLayout.tsx`, `src/pages/Diario.tsx`, `src/index.css`.
