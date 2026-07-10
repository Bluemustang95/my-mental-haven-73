## 1. Mi Proceso — Bento tiles con íconos centrados

En `TherapyMiniTracker.tsx` (`MiniBento` y las tarjetas cuando hay pro asignado) y en `NextSessionCard.tsx` rediseñar los 4 tiles con **fill de color + ícono centrado grande + nombre debajo, centrado**. Estética moderna: sin sombras aparatosas, radio 22px, ícono blanco a ~30px sobre fondo pleno.

Íconos y colores propuestos (paleta ya validada por vos, la mantengo):

| Tile | Color fill | Ícono (lucide) |
|---|---|---|
| Próxima Sesión | Teal `#7cc2c8` | `CalendarClock` |
| Resumen Psico | Amber `#facb60` | `FileText` (ícono en `#101927`) |
| Notas de Sesión | Violeta `#7c3aed` | `NotebookPen` |
| Medicación | Dark Blue `#101927` | `Pill` (ícono teal `#7cc2c8`) |

Layout tile: `aspect-square`, `flex flex-col items-center justify-center gap-3`, ícono grande arriba centrado, nombre debajo centrado (font-display 14px bold, blanco salvo Amber que usa dark).

## 2. Inicio — bento uniforme sin extras

Problemas observados en la captura anotada:
- **Zona de descanso** ocupa 2 columnas (rectangular grande) → correcto, mantener.
- **Pack de activación** aparece chico (½ ancho de un tile normal). Debe ser un **cuadrado igual de grande** que Mini hábitos.
- **Mini hábitos** viene envuelto por el header "TUS WIDGETS ACTIVOS · GESTIONAR ♡" y borde/padding extra → eliminar ese wrapper.

Cambios:
- En `Dashboard.tsx` (case `mini_habits`): quitar el `<ActiveWidgetWrapper>` y renderizar solo `<MiniHabitsWidget />` como tile plano.
- Asegurar que **PendingBento** (donde vive "Pack de activación") use tiles del mismo tamaño que los otros widgets: quitar el `mt-4` extra, usar `aspect-square` y mismo padding/tipografía que `QuickToolWidget`. Si viene solo un pendiente, que ocupe 1 columna cuadrada — no más chico que el resto.
- Grid final: primer widget rectangular full-width (Zona de descanso), y a continuación una grilla `grid-cols-2 gap-3` donde **cada tile** (Pack de activación, Mini hábitos, y cualquier otro) tiene el **mismo `aspect-square`, mismo radio, mismo padding, ícono + nombre centrado abajo**. Sin headers intermedios, sin bordes de "widgets activos".

## 3. Inventarios cargados desde Admin

Hoy `InventariosHub.tsx` tiene un array **hardcoded** con BDI, BAI, PSWQ, PHQ-9, GAD-7, PSS-10, Rosenberg. El admin (`TestsCrudPanel`) ya lee/escribe `test_definitions` en la base pero el hub no lo usa → por eso ves inventarios que no creaste y los que creás en admin no aparecen.

Fix: reemplazar el array por una carga desde Supabase:

```ts
supabase.from("test_definitions")
  .select("code,name,kind,active,sort")
  .eq("kind","symptom").eq("active",true).order("sort")
```

- Mapear cada row a un tile con gradiente/arte asignado por índice (rotando entre los 3 estilos actuales `ArtBars`/`ArtSine`/`ArtSpiral` y una paleta de 6 gradientes) para conservar la estética.
- `label` = `code`, `title` = `name`, `onClick` sigue abriendo `<TestRunner testCode={code} />`.
- Estado "último completado" sigue basándose en `test_results.test_type` como ahora.
- Si no hay filas, mostrar empty state: "Aún no hay inventarios cargados. Pedile al admin que agregue."

Con esto, lo que se crea/desactiva en **Admin → Tests** aparece o desaparece automáticamente en Recursos → Tests e inventarios.

## Alcance

Solo presentación + wiring de datos existentes. Sin cambios en schema, sin nuevas rutas, sin lógica de negocio nueva.
