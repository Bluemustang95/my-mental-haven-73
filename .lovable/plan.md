# Ajustes solicitados

## 1. Onboarding — quitar selección de membresía
- Localizar el paso "Elegí tu membresía" (probablemente en `src/components/onboarding/` o `src/pages/Onboarding.tsx`) y **eliminarlo** del flujo.
- Ajustar el conteo de pasos y la navegación (siguiente/anterior) para saltar directo al paso posterior.
- Asegurar que `usePlan` siga devolviendo premium por defecto (ya está hardcoded).
- Remover cualquier import/asset del PaywallStep que quede huérfano.

## 2. Plan de Seguridad (`src/pages/SafetyPlan.tsx`)
- **Padding inferior**: agregar `pb-32` (o safe-area) al contenedor scroll del wizard y del ViewMode para que el bottom nav no tape el botón "Siguiente/Finalizar".
- **Reducir a 4 pasos** (quitar el paso 5 "Líneas de emergencia" — las líneas ya se muestran arriba en ViewMode). Actualizar barra de progreso y textos "Paso X de 4".
- **Paso 3 "Red de apoyo"**:
  - Layout vertical: `Nombre` arriba, `Teléfono` abajo (no en fila que se corta).
  - Etiquetar cada bloque como "Contacto 1", "Contacto 2", etc.
  - Botón "+ Agregar contacto" visible debajo.
- **Post-completado**: 
  - Detectar plan completo (al menos una señal + estrategia + 1 contacto).
  - En `/herramientas` (o donde esté la card), mostrar botón **"Ver plan de seguridad"** que abre el ViewMode como modal/sheet.
  - Si el plan está vacío/incompleto, el botón dice **"Armar mi plan"** y abre el wizard de edición (comportamiento actual).

## 3. Admin General — Audios (`src/pages/admin/modules/GeneralAdmin.tsx`)
- **Listado completo**: hoy solo lista `mindfulness_audio_cache`. Ampliar para incluir también audios del Diario (Modo Zen) y cualquier otro bucket/tabla de audio del sistema. Unificar en una sola vista con filtro por origen.
- **Upload**: agregar botón "Subir audio" que sube archivos MP3/WAV al bucket de Supabase Storage correspondiente y crea el registro en la tabla.
- **Editar**: permitir renombrar el archivo, cambiar metadata (título, categoría, país/voz) y reemplazar el archivo. Botón eliminar ya debería existir; verificar.

## Detalles técnicos
- Onboarding: revisar `IntroScreens.tsx` y `OnboardingShell.tsx` para eliminar el step de paywall del array de pasos.
- SafetyPlan: usar `env-safe` class con `pb-[calc(env(safe-area-inset-bottom)+96px)]`.
- Persistencia del plan: ya usa tabla `safety_plans`; agregar campo derivado `is_complete` en cliente.
- Audios: crear (si no existe) bucket público `audios-diario`; extender query a `diary_audios` u origen equivalente y agregar componente `<AudioUploadDialog>` con `<input type="file" accept="audio/*">`.
