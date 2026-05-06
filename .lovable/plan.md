## Plan: Reestructuración de Recursos (Respiración, Regulación, Sueño, Recuperación)

### 1. Eliminar "Respiración" del menú principal
- Quitar la card de Respiración de `src/pages/Tools.tsx` (y/o `ResourceTools.tsx` si aplica).
- Eliminar la ruta `/respiracion` del router en `src/App.tsx`.
- Conservar el archivo `src/pages/Breathing.tsx` por si se reutiliza internamente, pero sin acceso desde menú. (Si preferís borrarlo, decímelo.)

### 2. Regulación Emocional (Celeste, ola)
Refactor `src/pages/EmotionalRegulation.tsx`:
- **Nueva pantalla inicial**: "Termómetro de malestar" 1–10 (slider vertical estilo termómetro con gradiente celeste→rojo).
- Según el valor:
  - ≥7 → Resmita recomienda **TIP** con CTA destacado.
  - <7 → Resmita recomienda **STOP** con CTA destacado.
  - El usuario puede igual elegir la otra.
- **TIP – Temperatura interactivo**:
  - Ilustración de cubitos de hielo (icono `Snowflake` grande con animación).
  - Al tocar: cronómetro circular de 30s con animación de "agua fría" (ondas pulsando) y un pequeño audio loop opcional (si no es viable sin asset, omitir sonido y dejar solo vibración visual).
- **TIP – Respiración pausada**:
  - Círculo que se expande 5s (inhalar) y contrae 7s (exhalar) en bucle, con label dinámico.
- **STOP interactivo (swipe)**:
  - 4 pasos S→T→O→P en horizontal; el usuario desliza (drag con framer-motion) para avanzar al siguiente. Indicador de progreso.

### 3. Sueño (Azul, luna)
Refactor `src/pages/Sleep.tsx`:
- **Checklist nocturno** con ítems (ej: "Dejé el celular", "Bajé la temperatura", "Hice registro de rumiación", "Sin pantallas 30 min antes", "Respiración pausada", "Cuarto a oscuras"). 
- Medidor circular animado **"Probabilidad de buen sueño" 0–100%** que sube según ítems marcados.
- **Diario de sueño**: mini calendario mensual donde se marca con iconos (😴 bien / 😣 mal / 😐 regular). 
  - Crear tabla `sleep_log` en Supabase Cloud: `user_id, date, quality (good|ok|bad), notes`.
  - RLS por user_id. Persistir selección.
  - Reutilizar patrón del calendario de Recuperación.

### 4. Recuperación (Violeta, botella de vino)
Editar `src/pages/Recovery.tsx`:
- Cambiar icono principal a **botella de vino** (`Wine` de lucide-react).
- Botón destacado **"Tengo ganas de consumir"** → abre Sheet/Dialog con 3 accesos directos:
  - "Hacer un STOP" → `/regulacion-emocional?tool=stop`
  - "Usar hielo (TIP)" → `/regulacion-emocional?tool=tip&step=temperatura` (auto-arranca cronómetro de hielo)
  - "Escribir en la Nube" → `/rumiacion` (recurso amarillo)

### 5. Estética global
- Aplicar `font-mindful` (la usada en Mindfulness) a todos los títulos de los 3 recursos editados.
- Voseo argentino en todas las copies ("Sumergí", "Frená", "Anotá", "Inhalá", "Soltá").
- Avatar Resmita solo en intro y cierre motivador (ya está así en Regulación; replicar en Sueño y en cierres de Recuperación).

### Detalles técnicos
- Migración SQL para `sleep_log` con RLS (insert/select/update/delete por `auth.uid() = user_id`).
- Query params soportados en EmotionalRegulation: `?tool=tip&step=temperatura` para auto-iniciar cronómetro.
- Slider termómetro: input range custom estilizado verticalmente con gradiente.
- Swipe STOP: `motion.div drag="x"` con `onDragEnd` validando umbral.
- Cronómetro hielo: 30s con `setInterval`, anillo SVG animado.
- Sin assets de audio nuevos a menos que confirmes (omitiría el sonido de agua fría).

### Archivos a modificar/crear
- `src/App.tsx` (quitar ruta respiración)
- `src/pages/Tools.tsx` (quitar tarjeta)
- `src/pages/EmotionalRegulation.tsx` (rewrite mayor)
- `src/pages/Sleep.tsx` (rewrite mayor)
- `src/pages/Recovery.tsx` (icono + botón emergencia)
- Migración Supabase: tabla `sleep_log`

¿Apruebo y avanzo? Si querés que también borre `Breathing.tsx` o que incluya audio para el hielo, decímelo antes de empezar.
