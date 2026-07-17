## Ajustes solicitados

### 1. Recursos (bento en /herramientas)
En `src/components/recursos/BentoGrid.tsx`, remover los tiles **Diario** y **Psicoeducación** de la lista visible. Diario ya vive en la BottomNav / atajos del Home, y Psicoeducación pasa a ser accedida desde el widget correspondiente en el Home o desde Resmita.

Quedarían visibles en Recursos: Mente & Emoción, Tests e inventarios, Hábitos, Sueño y Plan de Seguridad (5 tiles).

### 2. Home — Bento 2x2 un poco más chico
En `src/pages/Dashboard.tsx` (línea 377) el grid usa `grid-cols-2 gap-4` a todo el ancho del contenedor. Para reducirlo sin romper la simetría:

- Envolver el grid con un contenedor `max-w-[300px] mx-auto` (aprox. 85% del ancho actual en 390px) y bajar el `gap` a `gap-3`.
- Esto encoge las cápsulas glass proporcionalmente y deja más aire alrededor, sin tocar `AtomicWidget` ni su `aspect-ratio 1/1`.

### 3. Picker "Elegir 4" (WidgetsBoard)
En `src/components/home/WidgetsBoard.tsx` remover del catálogo estos widgets porque son redundantes con Diario o son placeholders:

- `gratitude` — "Agradecimiento"
- `daily_quote` — "Frase del día"
- `diario_quick` — "Diario íntimo" (lleva a Diario)
- `contention_notes` — "Notas de contención" (lleva a Diario)

Cambios concretos:
- Sacarlos de `DEFAULT_WIDGETS` y de `LABELS`.
- Quitar sus entradas del `WIDGET_TO_CATEGORY` y del `renderWidget` switch en `Dashboard.tsx` (imports `DiarioQuickWidget`, etc.).
- Migración suave: al leer `home_widgets_v2` de localStorage, filtrar ids desconocidos (el código actual ya hace merge por id, así que los usuarios que los tuvieran elegidos simplemente los pierden del set — quedan con menos de 4 y pueden agregar otros).

### Fuera de alcance
No se toca lógica de wellbeing score, ni rutas, ni Resmita — solo visibilidad de tiles/widgets y tamaño del grid.
