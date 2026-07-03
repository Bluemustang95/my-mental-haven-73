## Dos correcciones en Psicoeducación

### 1. Admin Textos no scrollea

**Causa:** `AdminLayout` renderiza `<main class="flex-1 h-full overflow-hidden flex flex-col">`. Los módulos que sí scrollean (Mindfulness, General) envuelven su contenido en `admin-scroll flex-1 overflow-y-auto px-8 py-6 pb-32`. `ContentManager.tsx` NO lo hace: su `return` es un `<div>` plano, por eso al pasar cierta altura el contenido queda cortado.

**Fix (`src/pages/admin/ContentManager.tsx`):** envolver todo el `return` en `<div className="admin-scroll flex-1 overflow-y-auto px-8 py-6 pb-32">…</div>` y mover el `<div>` actual dentro. Aplica a las tres pestañas (Videos / Textos / Podcasts) y a Categorías.

### 2. Front-end de Psicoeducación se ve oscuro/negro, no matchea el resto de la app

**Causa:** `Psicoeducacion.tsx` (hub) usa `resma-bg-gradient` (crema con glow-blobs teal/amarillo, texto navy). Sin embargo, al entrar a una categoría o lección, `CategoryDetail.tsx`, `LessonView.tsx` y `PracticeView.tsx` usan fondo `#0B0B10` con texto blanco — rompe la coherencia.

**Fix estético — pasar a paleta clara (crema + navy + teal), manteniendo funcionalidad:**

- `src/pages/psicoeducacion/CategoryDetail.tsx`
  - Wrapper: `resma-bg-gradient relative min-h-screen overflow-hidden pb-32 safe-area-top` + dos `glow-blob` (teal y amarillo) como en el hub.
  - Sticky header: fondo `bg-[#FDFCFB]/85 backdrop-blur-md`, botón/título en `text-[#101927]`.
  - Título, descripción y meta pasan a `text-[#101927]` / `text-[#101927]/70`.
  - Tarjetas: fondo `bg-white/70 backdrop-blur border-white ring-1 ring-black/[0.04]`, sombras suaves; el color del tipo (video/podcast/teórico/práctico) sigue como acento.
  - Badge "Leído/Hecho" con `bg-[#7cc2c8]/15 text-[#0f766e]`.

- `src/pages/psicoeducacion/LessonView.tsx`
  - Wrapper: `resma-bg-gradient relative min-h-screen overflow-hidden pb-28 safe-area-top`, mismos `glow-blob`.
  - Header sticky: `bg-[#FDFCFB]/90`, textos `text-[#101927]`.
  - Título en `text-[#101927]`, chip "Teórico" con `bg-[#c5b8e8]/25 text-[#6B4EFF]`.
  - Cuerpo `body_html`: pasar de `prose prose-invert` a `prose prose-slate` con `prose-headings:font-display prose-headings:text-[#101927] prose-p:text-[#101927]/85 prose-strong:text-[#101927] prose-a:text-[#0f766e]`. Sanea HTML con `stripDefaultBlackColor` no es necesario aquí porque el fondo ya es claro, pero se puede reutilizar para consistencia.
  - Barra fija inferior: `bg-[#FDFCFB]/90 border-t border-black/5`, botón "Entendido, continuar" con `bg-[#7cc2c8] text-[#0f172a]`; cuando leído, `bg-emerald-500 text-white`.

- `src/pages/psicoeducacion/PracticeView.tsx`
  - Mismo wrapper crema + glow-blobs.
  - Header sticky claro.
  - Chip "Práctico" con `bg-[#7cc2c8]/20 text-[#0f766e]`.
  - Título `text-[#101927]`, intro `text-[#101927]/70`.
  - Placeholder "aún no tiene bloques" con `bg-white/70 border-black/10 text-[#101927]/70`.
  - Barra fija: fondo claro; botón "Guardar y finalizar" con `bg-[#7cc2c8] text-[#0f172a]`.

- `src/components/practice/blocks/InstructionsBlock.tsx` y `ExampleBlock.tsx`
  - Cambiar `prose prose-invert` → `prose prose-slate`.
  - Instrucciones: `prose-p:text-[#101927]/85 prose-strong:text-[#101927] prose-a:text-[#0f766e]`. Quitar el `[&_*:not([style*='color'])]:text-white/85` (ya no aplica en fondo claro) y dejar `stripDefaultBlackColor` (inocuo).
  - Example: contenedor cambia a `border-[#7cc2c8]/40 bg-[#7cc2c8]/10`, título/ícono `text-[#0f766e]`, prose slate.

### Archivos a tocar
- `src/pages/admin/ContentManager.tsx` — envolver return en contenedor scrollable.
- `src/pages/psicoeducacion/CategoryDetail.tsx` — repintado crema.
- `src/pages/psicoeducacion/LessonView.tsx` — repintado crema + prose slate.
- `src/pages/psicoeducacion/PracticeView.tsx` — repintado crema.
- `src/components/practice/blocks/InstructionsBlock.tsx` — prose slate.
- `src/components/practice/blocks/ExampleBlock.tsx` — prose slate + acento teal.

Sin cambios de base de datos ni de rutas. Solo estilos y un wrapper de scroll.