# Arreglos en Lección y Categoría

## Problemas

1. La barra "Entendido / Leído · Volver" queda flotando sobre el texto y el BottomNav aparece sobre un fondo blanco. Causa: `LessonView` está dentro de `AppLayout` (que renderiza el BottomNav + padding inferior), y además agregamos una segunda barra fija propia. Se pisan entre sí.
2. Al volver desde una lección ya marcada como leída, en la categoría la tarjeta no muestra ningún indicador de "leído".

## Cambios

### 1. Sacar Lección y Práctica del AppLayout
En `src/App.tsx`, mover las rutas `/herramientas/contenido/leccion/:id` y `/herramientas/contenido/practica/:id` fuera del bloque envuelto por `AppLayout` (igual que hacen las sesiones de mindfulness / ejercicios inmersivos). Así no aparece el BottomNav blanco y la barra inferior de la lección queda pegada abajo sin solaparse con nada.

### 2. Restaurar la barra inferior de Lección
En `src/pages/psicoeducacion/LessonView.tsx`:
- Volver el contenedor del botón a `bottom-0` (ya sin BottomNav debajo).
- Reducir el `pb` del contenedor principal a algo razonable (`pb-28`) para que el texto no quede tapado por la barra fija.

(Mismo ajuste menor en `PracticeView` si ya tenía padding pensado para BottomNav.)

### 3. Mostrar "Leído" en CategoryDetail
En `src/pages/psicoeducacion/CategoryDetail.tsx`:
- Cargar `content_progress` del usuario actual para los ids de la categoría (una sola query `select content_id, completed where user_id=? and content_id in (...)`).
- En cada tarjeta de Teórico/Práctico, si está completado, mostrar a la derecha un check verde (`#10B981`) con texto "Leído" (para teórico) o "Hecho" (para práctico), y un sutil borde/halo verde encima del color base de la tarjeta.

### Fuera de alcance
- No tocar la lógica de auto‑marcado (scroll + 20 s) ya implementada.
- No tocar estilos de cards más allá del badge de completado.
- No tocar otras rutas ni BottomNav.

## Archivos a editar
- `src/App.tsx`
- `src/pages/psicoeducacion/LessonView.tsx`
- `src/pages/psicoeducacion/CategoryDetail.tsx`
- (opcional) `src/pages/psicoeducacion/PracticeView.tsx` si hace falta ajustar padding.
