## Cambios en /admin/contenido (Psicoeducación)

### 1. Filtro por categoría en el admin

En `src/pages/admin/ContentManager.tsx`, agregar un selector de categoría encima de la tabla dentro de cada pestaña (Videos / Textos / Podcasts).

- Nuevo estado `categoryFilter: string` (por defecto `"all"`).
- Se resetea al cambiar de pestaña.
- El `filtered` incluye la condición extra:
  `(categoryFilter === "all" || item.category_id === categoryFilter)`.
- UI: un `<Select>` alineado a la derecha del encabezado de la tabla, con opciones "Todas las categorías" + las categorías del `content_type` actual (`catsForType(tab)`).
- Muestra un contador tipo `"12 elementos"` al lado del filtro.

### 2. Texto invisible en prácticas del front-end

**Causa:** el editor rich-text del admin (`RichTextEditor`) envuelve el texto sin color en `<p>` heredando el negro por defecto. En el front-end, `PracticeView.tsx` usa fondo oscuro `#0B0B10` y los bloques `InstructionsBlock` / `ExampleBlock` renderizan HTML crudo con `prose prose-invert`. Cualquier `color: #000 / rgb(0,0,0) / black` inline del editor pisa `prose-invert` y el texto queda negro sobre negro.

**Fix:** sanear el HTML antes de renderizarlo en los dos bloques (frontend-only, sin tocar el editor ni la base):

- Nueva utilidad `stripDefaultBlackColor(html: string)` en `src/lib/utils.ts` (o en un nuevo `src/lib/richTextSanitize.ts`) que:
  - Quita de cualquier atributo `style="..."` las declaraciones `color: #000`, `color: #000000`, `color: black`, `color: rgb(0, 0, 0)` (con o sin espacios/mayúsculas).
  - Deja intactos los colores explícitos que el admin sí eligió (violeta, naranja, verde, rojo, teal, pasteles).
- `InstructionsBlock.tsx` y `ExampleBlock.tsx` pasan `html` por esa función antes del `dangerouslySetInnerHTML`.
- Además, refuerzo defensivo en `InstructionsBlock` con clase Tailwind `[&_*:not([style*="color"])]:text-white/85` para que párrafos sin color explícito hereden el claro correcto (por si viniera texto sin estilo inline).

### Archivos a tocar
- `src/pages/admin/ContentManager.tsx` — filtro por categoría.
- `src/lib/richTextSanitize.ts` — nueva utilidad.
- `src/components/practice/blocks/InstructionsBlock.tsx` — usar utilidad + clase defensiva.
- `src/components/practice/blocks/ExampleBlock.tsx` — usar utilidad.

Sin cambios de base de datos, ni al `RichTextEditor`, ni al flujo de guardado.