## Fix: cápsulas glass del bento inferior colapsadas

### Causa raíz (verificada)

En `src/components/home/AtomicWidget.tsx` línea 46, el `<button>` externo usa `flex flex-col items-center` **sin `w-full`**. El botón toma ancho `auto` (= ancho del contenido más pequeño), la cápsula interna `w-full aspect-square` colapsa al ancho del ícono (~30 px), y las celdas del `grid grid-cols-3` del Dashboard (líneas 366-368) quedan con un cuadrado diminuto centrado — de ahí la sensación de "íconos flotando".

### Cambio

Un único edit en `src/components/home/AtomicWidget.tsx`:

- Agregar `w-full` al `<button>` (línea 46) para que ocupe toda la celda del grid.
- Confirmar que la cápsula interna use `w-full aspect-square rounded-2xl` (ya lo hace vía `w-full` + `aspectRatio: "1 / 1"`).
- Mantener tinte 15% + borde blanco + halo interno del color clínico (ya presente).
- Etiqueta fuera con `mt-2 text-[11px]` (ya presente).

### Resultado esperado

Tres cápsulas cuadradas idénticas y visibles (Sueño índigo, Hábitos esmeralda, Diario ámbar), llenando cada celda del `grid-cols-3 gap-4`, con etiqueta debajo — exactamente el sketch mostrado arriba.

No hay cambios de lógica, datos ni rutas: solo se corrige el ancho del contenedor.
