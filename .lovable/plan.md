# Plan de cambios

## 1. Admin › General › nueva subpestaña "Audios"
- Nueva tab en `src/pages/admin/modules/GeneralAdmin.tsx` llamada **Audios**.
- Lista unificada de todos los audios usados por la app:
  - **Mindfulness**: filas desde `mindfulness_scripts_v2` + su MP3 cacheado en Storage (ejercicio · minutos · país · versión · género · voz · estado).
  - **Diario / Zen**: soundscapes registrados (Lluvia, 528Hz, etc. desde `src/lib/diarioAudio.ts` y bucket correspondiente).
- Por fila: play inline, tamaño, fecha, botón "Regenerar" (mindfulness) o "Reemplazar" (diario) y "Copiar URL".
- Filtros por módulo, país y estado (activo / pendiente / huérfano).

## 2. Hábitos
- **FAB tapado por bottom nav** en `src/pages/pensamientos/HabitosHome.tsx` / `NewHabitSheet.tsx`: subir el FAB a `bottom-24` y añadir `pb-32` al scroll para que el sheet "Nuevo hábito" no quede bajo la navbar.
- **Grid tipo GitHub con día del mes**: en `HabitCard.tsx` / grid heat-map, renderizar el número de día (1–31) dentro de cada celda con tipografía tabular pequeña, manteniendo el color de intensidad.

## 3. Pack de Actividades junto a Hábitos (Bento 2x2)
- En la home de Hábitos, reorganizar el header para exponer un bento 2x2:
  - `[ Hábitos ]  [ Pack de Actividades ]`
  - `[ Stats ]   [ Logros / Racha ]`
- La card de Pack navega a `/pack` (ya existe `src/pages/pack/PackHome.tsx`). Mismo estilo glass que las cards vecinas.

## 4. Plan de Seguridad — rediseño "Dos Tiempos"
Reescribir `src/pages/SafetyPlan.tsx` con arquitectura `mode: 'view' | 'edit'`.

### Modo Lectura (SOS, default)
- Header: escudo grande centrado, título serif "Tu red de contención", botón flotante "Editar Plan" (lápiz) arriba-derecha.
- Cards glass:
  - **Líneas de emergencia** con gradiente cuarzo rosa (`from-rose-50/80 to-white/80 backdrop-blur-xl border-rose-200/60`), números `font-mono text-rose-600`, `<a href="tel:">`.
  - **Estrategias de calma** (acento teal) con viñetas numeradas.
  - **Red de apoyo** (acento índigo) con botón de llamada rápida.
- Bottom nav visible.

### Modo Edición (Wizard 5 pasos)
Pasos: (1) Señales, (2) Estrategias, (3) Red de apoyo (nombre + tel), (4) Entorno, (5) Emergencias (nombre + tel).
- Header: "Atrás" a la izquierda, "Cancelar" a la derecha, "Paso X de 5".
- Card blanca central: input + botón oscuro `bg-[#101927]` con `+`, chips de sugerencias turquesa (pasos 1/2/4), lista con ✕.
- Botón inferior ancho turquesa `bg-[#7cc2c8] text-[#101927]`: "Siguiente paso" / en paso 5 "Finalizar Plan de Seguridad" → vuelve a `view`.
- Autosave a `safety_plans` como hoy.

### Integración en Resumen Psico
- En `src/pages/ResumenPsico.tsx` agregar sección/acción "Plan de Seguridad" que abre el mismo wizard (modo edit) para completar/actualizar desde ahí.

### Bugs de Crisis Button
- Al abrir el modal, "Plan de seguridad" no navega y la `X` no cierra: revisar `src/components/CrisisButton.tsx` / `CrisisModal.tsx`, arreglar handler de navegación a `/plan-seguridad` y `onOpenChange(false)` en el botón de cierre; también corregir posición para que no quede desplazado hacia abajo.

## 5. App 100% gratis (remover paywalls)
- En `src/hooks/usePlan.tsx`: forzar `isPremium = true` y `plan = "premium"` para todos (dejando el hook por compatibilidad, sin llamadas de cambio de plan).
- Ocultar UI de suscripción/paywall:
  - Quitar `PremiumLock`, `PaywallModal`, `ManageSubscriptionModal` de los flows visibles.
  - En `Settings.tsx` remover sección "Plan / Suscripción / Gestionar suscripción".
  - Quitar badges "Premium" y CTAs "Hazte premium" de cards.
- Eliminar gating en rutas que hoy chequean `isPremium` (Hábitos, Sueño, Diario, etc.) — todos accesibles.
- No se borran tablas ni edge functions de billing; solo se desconecta la UI para poder reactivar en el futuro.

## Detalles técnicos
- Archivos principales a tocar:
  - `src/pages/admin/modules/GeneralAdmin.tsx` (+ nuevo componente `AudiosPanel.tsx`)
  - `src/pages/pensamientos/HabitosHome.tsx`, `src/components/habitos/NewHabitSheet.tsx`, `src/components/habitos/HabitCard.tsx`
  - `src/pages/SafetyPlan.tsx` (reescritura), `src/components/CrisisButton.tsx`, `src/components/CrisisModal.tsx`
  - `src/pages/ResumenPsico.tsx` (entrada al wizard)
  - `src/hooks/usePlan.tsx`, `src/pages/Settings.tsx`, componentes con `PremiumLock`
- Sin migraciones nuevas. Se reutiliza `safety_plans`, `mindfulness_scripts_v2`, bucket de audios y `voice_settings`.
- Se preservan tokens del design system (glass, teal `#7cc2c8`, dark `#101927`, cream `#FDFCFB`).
