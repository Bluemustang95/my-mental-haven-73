# Limpieza estética global

Objetivo: reducir ruido visual. Todos los bentos quedan con **ícono + nombre** (y máximo un dato clave cuando aporta). Sin descripciones largas, sin CTAs redundantes, sin banners explicativos.

## 1) Home — Enfoque prioritario (carrusel)
Archivo: `src/components/home/PriorityFocusCarousel.tsx` (y card interna).
- Quitar descripción larga ("Arrancá tu día regulando…").
- Quitar chip "Paso obligatorio".
- Quitar botón "CULTIVAR MI DÍA →" — toda la card es tappable.
- Mantener: chip de categoría ("PRIORIDAD MAÑANA"), título grande ("Sintonía de la mañana"), ilustración/glow de fondo.
- Altura de card se reduce proporcionalmente.

## 2) Home — Tus herramientas / Pendientes / Widgets
Archivos: `src/components/home/PendingForYouGrid.tsx`, `WidgetsActiveGrid.tsx` (o similares en `src/components/home/`).
- Quitar los headers "PENDIENTES PARA VOS" y "TUS WIDGETS · GESTIONAR · ACTIVOS".
- Todas las tiles del bento pasan a formato uniforme: **ícono arriba + nombre debajo**. Sin subtítulos ("Día 2 en curso", "Respiración 4-7-8 · 3 min", "Ruidos protocolo…", etc.).
- Mantener color/gradiente de fondo por tile (identidad visual).
- Header único de sección: "TUS HERRAMIENTAS" con el "+" ya existente.

## 3) Mi Proceso — Índice de bienestar
Archivo: `src/components/proceso/WellbeingCardV2.tsx`.
- Quitar mensaje ("Días difíciles. Bajá la exigencia…").
- Quitar sparkline.
- Quitar chevron "Ver mi análisis" (la card entera sigue abriendo el sheet).
- Mantener: label "ÍNDICE DE BIENESTAR", número grande "56/100", chip de delta en verde/rojo ("-12%" / "+X%").
- Resultado: card compacta, sólo número + porcentaje.

## 4) Mi Proceso — Terapia y sincronización
Archivo: `src/components/proceso/TherapyMiniTracker.tsx` (stepper Buscando/Asignado).
- Quitar la línea explicativa "Estamos buscando un profesional ideal para vos. Te avisamos apenas se asigne."
- Agregar botón "?" pequeño junto al título "TERAPIA Y SINCRONIZACIÓN" que abre popover con la leyenda de estados (Buscando → Asignando → Asignado → En espera → …). Reutilizar patrón de `WellbeingHelpPopover.tsx`.

## 5) Mi Proceso — Bentos Próxima Sesión / Resumen Psico / Notas / Medicación
Archivos: `src/pages/MiProceso.tsx` y componentes de cada card.
- Formato uniforme cuadrado: **ícono + nombre**. Sin subtítulos ("Tocá para agendar tu encuentro.", "Reportes y hábitos.", "Temas y dudas.", "Próxima toma: Al día") ni acciones inline ("Agendar / Editar").
- La acción principal se dispara al tocar la card.

## 6) Tests e inventarios — recuperar estilo previo
Archivo: `src/pages/InventariosHub.tsx`.
- Reemplazar tiles cuadradas grandes con gradiente por el **estilo carrusel/lista horizontal** que usaba `PsychometryCarousel` (cards angostas con nombre + subtítulo corto + fecha "Último: …", diseño limpio sobre fondo claro).
- Mantener el header sticky y `TestRunner` al tocar.
- Referencia visual: `src/components/proceso/PsychometryCarousel.tsx` (recuperar su look & feel).

---

### Notas
- Sin cambios de lógica ni de datos — sólo presentación.
- Se mantienen colores/tokens actuales (Cream, Dark Blue, Teal).
- Cada card sigue siendo tappable con la misma navegación que hoy.
