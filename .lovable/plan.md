## Resumen

Construir el módulo **Construir Bienestar** + limpieza del hub + las 4 mejoras aprobadas + continuidad en Inicio (estilo Cambiar Respuestas / Mindfulness).

---

## A) Módulo Construir Bienestar

**Ruta:** `/herramientas/construir-bienestar`
**Persistencia:** `localStorage` (`bienestar-draft-v1`) — valores, metas, pool de actividades, agenda semanal y registros de seguimiento. Si recarga o sale, retoma exactamente donde quedó. Sin tablas nuevas.

### Estética (glass premium claro)
- Fondo `#FDFCFB` con dos orbes (`#7cc2c8` y `#facb60`, `opacity-20`, `blur-3xl`) animados con `framer-motion`.
- Tarjetas `bg-white/60 backdrop-blur-xl border border-white/55 rounded-[32px]`.
- `font-serif` para títulos, Montserrat mayúsculas para kickers. Acentos teal/oro, texto `#101927`.
- Header con kicker "DESARROLLO PERSONAL" + título del paso + botón circular de reinicio (con confirm).
- Footer fijo con "Continuar" deshabilitado hasta cumplir el mínimo.

### Paso 1 · Brújula de Valores
14 acordeones con los **58 sub-ítems exactos** del briefing. Multi-selección entre categorías, múltiples abiertos. Cápsula flotante: "Seleccionados: X ítems · Elegí al menos uno". Bloquea si X=0.

### Paso 2 · Embudo de Acción (pirámide invertida)
Header con cápsula read-only listando los valores tildados. Pirámide CSS: 3 inputs píldora para metas + 1 input oro destacado "Meta de Enfoque para HOY". Botón **"¿Necesitás ideas? Preguntale a la IA"** que llama a `lovable-chat` con los valores seleccionados y devuelve 3 sugerencias clickeables.

### Paso 3 · Catálogo de Actividades
Array hardcoded con las **72 actividades exactas** + buscador con lupa (filtra por nombre/categoría). Lista con `+` para sumar; chips oscuros con `×` para quitar. Continuar requiere **≥ 3** actividades.

**(Favoritos — mejora #3):** cada actividad tiene una estrella; las favoritas se persisten en `localStorage` (`bienestar-favs-v1`) y aparecen en una sección **"⭐ Tus favoritas"** arriba del catálogo, precargadas en futuras semanas.

### Paso 4 · Planificador Semanal
Tabs **Armado** / **Seguimiento** + tab **Vista Semanal** (nueva — mejora #4).

- **Navegador Lun–Dom** con contador por día.
- **Grilla diaria** con bloques 08/10/12/14/16/18/20/22.
- **Armado:** click en bloque vacío → modal con actividades del Paso 3 → asignar pinta teal claro; eliminar libera el bloque.
- **Seguimiento:** checkbox por bloque agendado → modal de registro (sliders 0–5 de agrado, atención plena, dejar ir + notas). Guardar pinta verde esmeralda con mini-resumen.
- **Vista Semanal (mejora #4):** heatmap **7 días × 8 horarios** con colores por estado — gris vacío, teal agendado, verde completado. Tap en celda salta al día/hora correspondiente.

### Finalización
Check animado verde + tarjeta resumen (3 valores, meta de hoy, total actividades, total bloques) + CTA "Volver al inicio".

---

## B) Limpieza del hub `/diario-inteligente/regulacion-emocional`

En `DiarioInteligente.tsx`:
- Eliminar la card **STOP & TIPP** del hub (la página sigue accesible por deep-link).
- Sumar nueva card **Construir Bienestar** debajo de Cambiar Respuestas (icon Sparkles, gradiente teal→oro).
- Mover `<PatternInsights />` **debajo** de los recursos y del `OpenSessionsList`, envuelto en dropdown cerrado por defecto ("Tus patrones · N hallazgos" + chevron animado).

En `PatternInsights.tsx`:
- Botón **"Marcar como completado"** por insight, persistido en `localStorage` (`dbt-pattern-dismissed-v1`).
- Estado vacío "Sin patrones pendientes" cuando todo está completado.

---

## C) Continuidad y avisos suaves

### C.1 Reanudar sesión (igual que Cambiar Respuestas / Mindfulness)
- Si hay un `bienestar-draft-v1` activo y el wizard no llegó a Finalización:
  - En `OpenSessionsList` aparece la card "Construir Bienestar · Paso X de 4" con **Continuar** / **Descartar**.
  - En el FAB "+" del hub aparece la opción "Retomar plan en curso".
  - Al entrar al wizard, salta directo al último paso guardado.

### C.2 Bento en Inicio (mejora #1)
- En `PendingBento` (Dashboard) sumar card **"Tu plan de bienestar de hoy"** cuando hay agenda para el día actual:
  - Texto: "Tenés **N** bloques programados para hoy".
  - Sub-texto con el próximo bloque ("Próximo: 10:00 · Caminar por el parque").
  - Tap → abre `/herramientas/construir-bienestar?tab=seguimiento&day=hoy`.
- Si en cambio hay un draft del wizard sin terminar, muestra "Continuá tu plan · Paso X de 4".

### C.3 Badge suave en el FAB (mejora #2)
- Al final del día (≥ 20:00 hora local), si quedan bloques agendados del día actual **sin registrar**, el FAB "+" del hub `/diario-inteligente/regulacion-emocional` muestra un **punto oro** + tooltip "Tenés N bloques de hoy sin registrar". Tap directo al Seguimiento del día. Sin notificaciones push.

---

## Archivos

**Nuevos**
- `src/pages/ConstruirBienestar.tsx`
- `src/components/bienestar/ValuesAccordion.tsx`
- `src/components/bienestar/GoalFunnel.tsx`
- `src/components/bienestar/ActivityCatalog.tsx` (incluye favoritos)
- `src/components/bienestar/WeeklyPlanner.tsx` (Armado + Seguimiento + Vista Semanal)
- `src/components/bienestar/FinishScreen.tsx`
- `src/components/bienestar/data.ts` (58 valores + 72 actividades)
- `src/components/bienestar/useBienestarDraft.ts` (draft + favoritos + helpers de "bloques pendientes hoy")

**Editados**
- `src/App.tsx` (ruta nueva)
- `src/pages/DiarioInteligente.tsx` (quitar STOP&TIPP, agregar Construir Bienestar, mover PatternInsights a dropdown abajo, badge en FAB)
- `src/components/dbt/PatternInsights.tsx` (dropdown + dismiss persistente)
- `src/components/dbt/OpenSessionsList.tsx` (detectar draft de bienestar)
- `src/components/home/PendingBento.tsx` (card "Plan de hoy" + "Continuá tu plan")

**Sin tocar:** schema DB, Mindfulness, CambiarRespuestas, página `/herramientas/regulacion-emocional`.
