## 1. Onboarding

**Layout general (todas las pantallas)**
- En `OnboardingShell`, centrar verticalmente el contenido (`justify-center` en el contenedor de pasos) manteniendo el header de progreso arriba y el `StickyFooter` abajo.
- Subir un escalón el tamaño de los subtítulos (13px → 14.5px) en las pantallas de pasos ("Desde dónde nos acompañas", "Qué brújula", "Plan de descanso", etc.).

**Pantalla 1 (Splash)**
- Subir el isótopo RESMA como asset CDN y recolorearlo a teal `#7cc2c8`; reemplaza a Resmita en el splash.
- Frase: "Tu rincón para cuidar tu salud mental, a tu propio ritmo y con apoyo clínico", sin itálica, con la tipografía oficial (`font-display`).
- Animación de entrada: fade + slide escalonado (logo → frase → botón).
- Debajo del disclaimer: enlaces clickeables "Políticas de Privacidad" y "Términos y Condiciones" (abren en pestaña nueva), leídos de `admin_settings`.
- Íconos de la app: generar `icon-192.png`, `icon-512.png` y `apple-touch-icon.png` a partir del isótopo teal (fondo crema) y reemplazarlos en `public/`.

**Pantalla 3 (Pilares)**
- Centrar verticalmente los 4 ítems, bajar el bloque, aumentar el tamaño del título de cada ítem ("Ciencia, no magia" y hermanos) y mantener/reforzar la animación escalonada de entrada.

**Pantalla "Procesando información"**
- Reemplazar el spinner circular por el isótopo RESMA girando sobre su eje (rotación continua con leve pulso del aura).
- Extender la duración total de ~2.1s a ~5s, con los mensajes repartidos en ese lapso.

**Admin**
- Nueva sección "Legales" en Ajustes generales del admin con dos campos de URL (`legal_privacy_url`, `legal_terms_url`) guardados en `admin_settings` vía `saveSetting`/`loadSetting`. Sin migración de base de datos.

## 2. Home y navegación

- **Tipografía**: unificar a la fuente oficial (`font-display`) los títulos de Sintonía de la mañana/noche en `PriorityStack` (hoy usan `font-serifElegant`) y revisar el resto de la Home por fuentes sueltas.
- **Sintonía**: eliminar las etiquetas "Prioridad Mañana"/"Prioridad Noche" y poner en su lugar un botón circular con flecha que dispara la misma acción de la tarjeta.
- **Notificaciones**: en `NotificationStack` filtrar todo lo que no provenga de un evento real del usuario (p. ej. no mostrar recordatorio de medicación si no hay medicaciones creadas ni logs). Regla: cada tarjeta requiere un dato existente que la respalde.
- **Navbar**: al estar activo un tab, mostrar el nombre debajo del ícono ("Inicio", "Proceso", "Diario", "Recursos"), con la píldora activa expandiéndose suavemente.
- **Calendario "Actividades de hoy"**: estado completado visible (círculo relleno, check, título atenuado). Para Diario, el ítem además muestra lo que la persona marcó en el registro diario del día (ánimo/emociones/chips registrados) en lugar de un simple "completado".

## 3. Recursos

- Rediseño de las tarjetas de `BentoGrid`: quitar todos los subtítulos, dejar solo el título.
- Nuevo estilo: caja con fondo sólido (color de cada recurso, ya sincronizado con los colores de Home), ícono centrado en el medio y el nombre dentro de la caja, tipografía limpia (`font-display`), esquinas redondeadas y sombra sutil, más finas que las actuales.

## Notas técnicas

Archivos principales: `src/components/onboarding/OnboardingShell.tsx`, `IntroScreens.tsx`, `AlgorithmTransition.tsx`, `src/pages/Onboarding.tsx`, nuevo `src/components/brand/ResmaIsotipoMark.tsx`, `src/lib/admin/settings.ts` (consumo), módulo de ajustes del admin, `src/components/home/PriorityStack.tsx`, `NotificationStack.tsx`, `MonthCalendarSheet.tsx`/`Timeline.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/recursos/BentoGrid.tsx`, `public/manifest.webmanifest` + íconos, `index.html`.

No requiere cambios de base de datos: las URLs legales usan la tabla `admin_settings` existente.
