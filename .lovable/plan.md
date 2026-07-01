
## 1) Terapia — Gate de 24hs y nombre del profesional

**Estado actual:** apenas el estado pasa a `assigned`, aparece la tarjeta amarilla con el botón "¿Ya te contactó?". Al confirmar "Sí", el estado va a `coordinating` y debería renderizar `FullProfessionalCard`, pero solo aparece si `proName` viene del bridge — a veces llega `null` y se queda en el mini-tracker sin datos.

**Cambios en `src/components/proceso/TherapyMiniTracker.tsx`:**

- Leer `bridge_assigned_at` desde `patient_app_profiles` (ya se guarda) al montar.
- Calcular `hoursSinceAssigned = (now - bridge_assigned_at) / 3600000`.
- Nueva variable `canConfirmContact = assigned && hoursSinceAssigned >= 24`.
- El bloque amarillo con el botón "¿Ya te contactó?" solo se muestra si `canConfirmContact`. Si aún no pasaron 24hs, mostrar un bloque informativo suave (azul/gris) con:
  > "Tu profesional **{proName}** aceptó tu caso. Se contactará en las próximas **24 hs hábiles**. Te avisamos cuando puedas confirmar."
  Y un contador tipo "Faltan ~X h".
- Cuando el usuario confirme "Sí" (`state` → `coordinating`), asegurar que `FullProfessionalCard` se renderice aunque `pro?.name` venga vacío: hacer fallback en cadena `pro?.name ?? proName ?? profile.therapist_name ?? "Tu profesional"`. Persistir `therapist_name` en `patient_app_profiles` en el momento en que `state === "assigned"` (ya se hace) y volver a leerlo en el render para no depender exclusivamente del bridge en la siguiente carga.

**Cambios en `src/components/modals/ContactConfirmDialog.tsx`:** tras `handleYes`, además de `refetch()` optimista, forzar en local `state = "coordinating"` (via callback nuevo `onOptimisticConfirm`) para que aunque el bridge tarde en actualizar, la UI ya muestre la `FullProfessionalCard` con nombre y apellido.

## 2) BottomNav tapa modales / sheets

**Regla nueva:** cualquier bottom sheet full-width del app debe ocultar el `BottomNav` mientras esté abierto (ya existe `useHideBottomNav(active)` en `src/hooks/useUiChrome.tsx`).

**Aplicar en:**

- `src/components/proceso/NextSessionSheet.tsx` → `useHideBottomNav(open)`.
- `src/components/modals/ContactConfirmDialog.tsx` → `useHideBottomNav(open)`.
- Revisar y aplicar el mismo hook en los otros sheets tipo "bottom" del flujo Proceso: `CheckinModal`, `PsychoModal`, `SatisfactionSurveySheet`, `WellbeingAnalysisSheet`, `BigFiveProfileModal`, `TherapySyncModal`, `PaywallModal`, `ManageSubscriptionModal`, `BiometricSetupModal`, `AccessCodeModal`, `SymptomsTestModal`, `MonthCalendarSheet`, `HabitDetailSheet`, `NewHabitSheet`, `Ficha8AModal`. (Un pase corto: agregar la línea `useHideBottomNav(open)` a cada uno.)

## 3) Medicación — mejor uso vertical

En `src/pages/MedicationTracker.tsx`:

- Cambiar `pb-28` → `pb-36` para que el FAB `+` y la última tarjeta no queden pegados al `BottomNav`.
- Bajar el FAB de `bottom-6` a `bottom-24` (encima de la barra) y agregar `style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}` para respetar safe-area en iOS.
- Aumentar contraste del bloque "Progreso de hoy" (borde `border-[#e2e8f0]`) y bajar padding para pantallas chicas.

## 4) iOS — instalación como PWA

Chrome/Android instala solo con `beforeinstallprompt`. **iOS/Safari no soporta ese evento**: hay que guiar al usuario a "Compartir → Agregar a pantalla de inicio".

**Cambios:**

- `index.html`: agregar meta tags iOS faltantes:
  - `<meta name="apple-mobile-web-app-capable" content="yes">`
  - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
  - `<meta name="apple-mobile-web-app-title" content="RESMA">`
  - `<link rel="apple-touch-icon" href="/icon-192.png">`
- Nuevo componente `src/components/system/IosInstallHint.tsx`:
  - Detecta iOS (`/iP(hone|ad|od)/.test(navigator.userAgent)`) + no-standalone (`!window.matchMedia('(display-mode: standalone)').matches && !(window as any).navigator.standalone`).
  - Muestra un sheet inferior una única vez (`localStorage: resma:ios-install-hint`) con las 3 instrucciones ilustradas: (1) Tocar el ícono Compartir, (2) "Agregar a pantalla de inicio", (3) "Agregar". Botón "Ya lo hice / Más tarde".
- Montar `<IosInstallHint />` en `src/App.tsx` junto al `NotificationForegroundListener`.

## 5) Widgets — drag más responsivo en iOS

En `src/components/home/WidgetsBoard.tsx` → `useDnDSensors`:

- `PointerSensor`: `activationConstraint: { distance: 4 }` (más ligero).
- `TouchSensor`: bajar `delay: 250` → `delay: 120`, `tolerance: 8`.
- Añadir `-webkit-user-select: none` y `-webkit-touch-callout: none` al `SortableGroupCell`/`SortableRow` para que iOS no dispare el menú contextual al mantener.
- Aumentar el área de agarre: envolver el contenido con `padding` extra y `touch-action: none` explícito en el hijo drag.
- Reducir el `animate-jiggle` en modo edición (menor amplitud) para que no vibre "tanto".

## Detalles técnicos

- Sin nuevas tablas ni migraciones.
- No se toca `bridge-proxy` (edge function).
- No se instalan dependencias nuevas.
- Solo cambios de UI + un componente nuevo (`IosInstallHint`) + hook `useHideBottomNav` en sheets existentes.

## Archivos a tocar

- `src/components/proceso/TherapyMiniTracker.tsx`
- `src/components/modals/ContactConfirmDialog.tsx`
- `src/components/proceso/NextSessionSheet.tsx`
- ~15 sheets/modales del punto 2 (línea única cada uno)
- `src/pages/MedicationTracker.tsx`
- `src/components/home/WidgetsBoard.tsx`
- `index.html`
- `src/components/system/IosInstallHint.tsx` (nuevo)
- `src/App.tsx`
