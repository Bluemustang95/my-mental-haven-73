
# Rediseño Home + Ritual Matutino y Nocturno

Trabajaremos en 3 fases. Cada fase queda funcional y verificable antes de pasar a la siguiente. Los dos rituales están conectados: lo que se escribe en el balance nocturno reaparece al día siguiente como puente sutil.

**Nombres propuestos** (uso estos por defecto):
- Mañana: **"Sintonía de la mañana"**
- Noche: **"Balance nocturno"**

En ambos: **se elimina el subtítulo** debajo del título en el Home y en el header del flujo.

---

## Fase 1 — Home refinado + renombres + stack de prioridades

Solo estética, textos y comportamiento de stack. Cero lógica clínica nueva.

**Archivos**
- `src/pages/Dashboard.tsx` — textos, spacing, stack de "Enfoque prioritario".
- `src/components/home/WidgetsBoard.tsx` — labels de `morning`/`night` sin subtítulo.
- Header del Home — píldora vertical del día activo.
- `src/index.css` / `tailwind.config.ts` — tokens `resmaNavy #101927`, `resmaTeal #7cc2c8`, `resmaGold #facb60`, `resmaLightBg #f9f9fb`, sombras `shadow-soft` orgánicas, fuentes (Inter, Montserrat, Playfair Display).
- `src/components/recursos/BentoGrid.tsx` (y cards de `TUS HERRAMIENTAS`) — estética diferenciada por tipo.

**Cambios visuales**
1. Fondo app `#f9f9fb`, sombras suaves difuminadas, más padding vertical entre secciones.
2. Fila semanal: día activo = **píldora vertical** navy con letra + número blancos y punto dorado abajo. Días inactivos con borde `dashed` en color de emoción y tipografía gris atenuada.
3. Sección `TUS HERRAMIENTAS` en mayúsculas + `tracking-widest` gris suave. Engranaje círculo blanco borde gris pluma fino.
4. **Cards por tipo de recurso** con estética abstracta moderna (sin emojis, sin ilustraciones figurativas):
   - Psicoeducación → glass cream + serif + halo teal sutil.
   - Mindfulness → glass con blob turquesa desenfocado de fondo.
   - Diario / Bienestar → acento dorado + blob cálido.
   - DBT / Regulación → glass navy tenue + línea acento coral.
   - Hábitos → glass con grid abstracto de puntos.
   - Todas comparten un mismo esqueleto (`ToolCard` con variantes) para consistencia.

**Enfoque prioritario — stack apilado**
- Las tarjetas de prioridad se renderizan como una **pila apilada** (una encima de otra, con las 2 siguientes asomando ~10 px por debajo con offset y escala 0.98/0.96 y sombra más suave). Esto es exactamente lo que ya se ve en el screenshot actual.
- Solo la de arriba es interactiva; las de abajo son "peek".
- Al completar la tarjeta de arriba (ej: terminar la Sintonía de la mañana → `morningDone = true`), esa tarjeta se anima hacia arriba con fade+slide y la siguiente sube al frente con un pequeño rebote (framer-motion `layout` + `AnimatePresence`).
- Botón `Siguiente prioridad →` a la derecha del título permite al usuario adelantar manualmente sin completar (cicla al fondo).
- Tarjeta activa siempre respeta la estructura:
  - Chip arriba: `PRIORIDAD MAÑANA` / `PRÁCTICA RECOMENDADA` / etc.
  - Título serif grande (**Sintonía de la mañana**, sin subtítulo debajo del nombre).
  - Descripción una línea (opcional).
  - Footer izquierda: `Paso obligatorio` (small, gris claro).
  - Footer derecha: `CULTIVAR MI DÍA →` en mayúsculas, negrita, dorado ámbar (`resmaGold`). Cambia por tarjeta (ej: `DESARMAR SESGOS →` en teal para la de práctica).
- Cuando el flujo matutino ya está completo, la tarjeta de mañana pasa al fondo del stack (o se colapsa a estado completado con check teal + línea *"Intención: Paciencia, Autocompasión"*).

---

## Fase 2 — Rediseño Sintonía de la Mañana

Reemplaza el modal actual (`CheckinModal` morning) por un flujo inmersivo full-screen de 4 pasos.

**Archivos nuevos**
- `src/pages/rituales/SintoniaManana.tsx` — orquestador ruta `/sintonia-manana`.
- `src/components/rituales/manana/`:
  - `OrbeSueno.tsx` (Paso 1: slider + orbe reactivo)
  - `OrbesEmocionales.tsx` (Paso 2: fila deslizante con animaciones por emoción)
  - `RamaValores.tsx` + `HerbarioSheet.tsx` (Paso 3: rama SVG + bottom sheet)
  - `CierreCiclo.tsx` (Paso 4: outro)
  - `RitualShell.tsx` (layout blindado, blobs, progress dots)

**Archivos editados**
- `src/App.tsx` — nueva ruta.
- `src/pages/Dashboard.tsx` — la tarjeta enlaza a `/sintonia-manana` en lugar del modal.
- `src/components/modals/CheckinModal.tsx` — desengancha rama morning (queda para night hasta Fase 3).

**Especificaciones**
- Shell: `flex flex-col h-full sm:h-[90vh] sm:max-h-[850px]`, contenedor scrolleable `flex-1 overflow-y-auto no-scrollbar pb-28`, dos glow blobs animados, glass premium (`rgba(255,255,255,0.45)` + `blur(28px)`).
- Paso 1: `<input type=range>` + orbe con 4 estados (gris/dorado/teal/esmeralda). Si <40% → tarjeta azul clara de autocompasión.
- Paso 2: 6 orbes en fila con `snap-x`, animaciones CSS (`breathe`, `radiate`, `vibrate`, `wave`, `flash`, `sink`). Fondo se tiñe pastel con la última emoción. Mini-orbes chips + tooltip. Sueño Sí/No, si Sí → textarea suave.
- Paso 3: SVG rama con 3 huecos punteados `+`. Tap → bottom sheet con 10 valores. Al elegir, hoja translúcida con `animate-grow-leaf`. Debajo, panel de **acciones personalizadas** (input + botón `+`). **Banner sutil arriba**: si existe `nightImprove` de anoche → *"Anoche quisiste mejorar: …"* antes de elegir valores.
- Paso 4: check verde gigante + tarjeta cálida *"Nos vemos a la noche…"*, botón *Ir al inicio*.
- Persistencia: tabla `daily_rituals` (ver detalles compartidos). Marca `morning_done = true` para el día → en el stack del Home la tarjeta pasa al fondo.

---

## Fase 3 — Rediseño Balance Nocturno + puente al día siguiente

**Archivos nuevos**
- `src/pages/rituales/BalanceNocturno.tsx` — ruta `/balance-nocturno`.
- `src/components/rituales/noche/`:
  - `CieloConstelacion.tsx` (Paso 1: 5 estrellas SVG + aurora boreal)
  - `NebulosaOrbes.tsx` (Paso 2: puente emocional + orbes flotantes)
  - `CierreCompromisos.tsx` (Paso 3: checklist de intenciones de la mañana)
  - `BalanceCierre.tsx` (Paso 4: 2 textareas glass oscuro)
  - `RitualNocheShell.tsx` (fondo `#0a0f1d`, glass oscuro `rgba(255,255,255,0.04)`)

**Archivos editados**
- `src/App.tsx` — ruta.
- `src/pages/Dashboard.tsx` — tarjeta noche enlaza al nuevo flujo.
- `src/components/modals/CheckinModal.tsx` — se puede eliminar al final si nada más lo usa.

**Especificaciones**
- Paso 1: 5 estrellas tocables, líneas SVG doradas conectando las elegidas; aurora boreal `blur` que crece con la cantidad; texto serif itálico bajo (*Día complejo → Excelente día pleno*).
- Paso 2: caja arriba *"Amaneciste hoy con:"* + mini-orbes del check matutino. Centro: 6 orbes flotando (`animate-float`), tap = expand 15% + check + tinte de fondo. Chips seleccionados con tooltip. Si emoción negativa nueva → 2 textareas de indagación.
- Paso 3: trae las **acciones personalizadas del ritual matutino de hoy**, checklist con tachado suave, textarea opcional.
- Paso 4: 2 textareas glass oscuro. *"¿Qué te gustaría mejorar mañana?"* se guarda como `night_payload.improve_tomorrow` y la Fase 2 (Paso 3) lo consume como banner sutil al día siguiente.
- Toast superior al guardar: *"✓ Tu balance nocturno se ha sincronizado correctamente"*, fade-out al Home.

---

## Detalles técnicos compartidos

- **Tokens y animaciones** en `src/index.css` + `tailwind.config.ts`:
  - Keyframes: `breathe`, `radiate`, `vibrate`, `wave`, `flash`, `sink`, `grow-leaf`, `float`, `aurora-pulse`.
  - Utilities: `.glass-light`, `.glass-dark`, `.shadow-soft`, `.no-scrollbar`, `.smooth-scroll`.
- **Persistencia** (Lovable Cloud): tabla `daily_rituals` (`user_id`, `date`, `morning_payload jsonb`, `night_payload jsonb`, `morning_done`, `night_done`) con RLS por `auth.uid()` y GRANTs a `authenticated` + `service_role`. Si ya existe algo equivalente, se reutiliza sin migración.
- **Puente noche→mañana**: query del último `night_payload.improve_tomorrow` cuya fecha < hoy y aún no consumida → banner en Paso 3 mañana.
- **Fuentes**: `Inter` (UI), `Montserrat` (labels uppercase), `Playfair Display` (títulos serif). Cargar vía `@import` en `index.css`.
- **Accesibilidad**: respetar `prefers-reduced-motion`.

## Orden de entrega
1. **Fase 1** → validás Home refinado + stack de prioridades.
2. **Fase 2** → validás flujo mañana + persistencia.
3. **Fase 3** → validás flujo noche + puente al día siguiente + limpieza del modal viejo.
