
## 1. Aprender como "camino de aprendizaje" (CategoryDetail.tsx)

Rediseñar la lista de lecciones/prácticas como un **learning path** vertical estilo Duolingo/Resma: tarjetas más compactas, número de orden a la derecha marcado como nodo, y línea punteada conectando cada nodo.

**Estructura por item:**

```text
┌──────────────────────────────┐    ○ ← nodo (círculo con nº)
│ [icon]  TEÓRICO              │    ┊
│         Título de la lección │    ┊ ← línea punteada vertical
│         ⏱ 2 min · ✓ Leído    │    ┊
└──────────────────────────────┘    ○
```

- Card compacta: `p-3` (antes `p-4`), icono `h-11 w-11` (antes `h-14 w-14`), título `text-sm` (antes `text-base`), radio `rounded-xl`, sombra sutil, `bg-white/80`.
- Columna derecha fija de 40px con el nodo del camino:
  - Círculo `h-9 w-9 rounded-full` con el número `it.sort_order` (o índice+1) en `font-display`.
  - Nodo **completado** → fondo teal `#7cc2c8`, texto `#0f172a`, ring teal.
  - Nodo **pendiente** → fondo blanco, borde `dashed` del color de la categoría, texto navy `#101927`.
- Línea punteada vertical entre nodos: pseudo-elemento / `<div className="absolute left-1/2 -translate-x-1/2 top-9 bottom-0 border-l-2 border-dashed border-[#101927]/20" />` en cada fila menos la última.
- Layout: `grid grid-cols-[1fr_44px] gap-3 items-stretch` para alinear card + track de nodos.
- Mantener `motion.button` con `whileTap` y navegación a `/leccion/:id` o `/practica/:id`.
- Se retira el badge grande "LEÍDO" a la derecha (redundante con el nodo teal); se mueve a un `✓ Leído` inline junto al `⏱ 2 min`.

## 2. Fix estético de bloques de Práctica

Los bloques todavía usan tema oscuro (`bg-white/[0.03]`, `text-white`, `border-white/10`, `bg-black/30`) sobre el fondo claro `resma-bg-gradient`, lo que produce el efecto "gris sobre gris ilegible" de la imagen 2. Migrar los 4 bloques restantes al tema claro Resma (cream + navy + teal):

**`ProsConsBlock.tsx`** (el de la imagen):
- Cell wrapper: `border-[#101927]/10 bg-white/70 backdrop-blur` (era `border-white/10 bg-white/[0.03]`).
- Label superior: `text-[#0f766e]` (era `text-emerald-300`).
- Textarea: `border-[#101927]/10 bg-white text-[#101927] placeholder:text-[#101927]/40 focus:border-[#7cc2c8]`.
- Slider: `accent-[#7cc2c8]`; footer "Intensidad / 0/100" → `text-[#101927]/60` y valor `text-[#0f766e]`.
- Títulos de fila ("Practicar" / "No practicar"): `text-[#101927]`.
- Resumen "Diferencia neta": `border-[#7cc2c8]/30 bg-[#7cc2c8]/10 text-[#0f766e]`.

**`FreeTextBlock.tsx`**:
- Wrapper: `border-[#101927]/10 bg-white/70 backdrop-blur`.
- Prompt: `text-[#101927]`.
- Textarea: `border-[#101927]/10 bg-white text-[#101927] placeholder:text-[#101927]/40 focus:border-[#7cc2c8]`.
- Contador: `text-[#101927]/50`.

**`SudsBlock.tsx`**:
- Wrapper: `border-[#101927]/10 bg-white/70 backdrop-blur`.
- Label: `text-[#101927]`.
- Slider: `accent-[#7cc2c8]`.
- Escala inferior: `text-[#101927]/60` con valor central `text-[#0f766e]`.

**`ColumnsBlock.tsx` y `ChecklistBlock.tsx`**: revisar y aplicar el mismo mapping (border/bg/text) si aún tienen clases oscuras.

## Archivos a tocar

- `src/pages/psicoeducacion/CategoryDetail.tsx` — camino con nodos + línea punteada + cards compactas.
- `src/components/practice/blocks/ProsConsBlock.tsx`
- `src/components/practice/blocks/FreeTextBlock.tsx`
- `src/components/practice/blocks/SudsBlock.tsx`
- `src/components/practice/blocks/ColumnsBlock.tsx` (verificar/ajustar)
- `src/components/practice/blocks/ChecklistBlock.tsx` (verificar/ajustar)

Sin cambios de DB, rutas, ni lógica de guardado.
