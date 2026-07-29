## Objetivo

Dividir `/mi-proceso` en dos estados de vista (`dashboard` y `detail`) en lugar de la vista apilada actual, donde hero + pilares + correlaciones se renderizan todos juntos.

## Estado actual (verificado)

`src/pages/MiProceso.tsx` renderiza en secuencia `WellbeingHeroV3`, `PillarGridV3` y `CorrelationInsights`, seguido del bloque de Terapia. No existe estado de navegación entre vistas ni tarjeta hero con anillos; el hero actual es una tarjeta oscura con número grande + barras de 7 días. El modal de calendario existe (`src/components/home/MonthCalendarSheet.tsx`) pero hoy solo lo usa `Dashboard.tsx`.

## Vista 1 — Dashboard (`view === 'dashboard'`)

Contenido único:
1. Header "Mi Proceso" + subtítulo "Estado emocional y compromiso" + badge de estado ("Al día") a la derecha.
2. Tarjeta hero oscura nueva `ProcesoSummaryCard`:
   - Título "RESUMEN GENERAL" con link "Ver Desglose ›".
   - Dos anillos SVG: BIENESTAR (Sentir: Ánimo/Sueño) y CUIDADO (Hacer: Uso/Tratamiento), con los valores de `snapshot.wellbeingScore` y `snapshot.careScore`.
   - Si `hasEnoughData === false`: tarjeta punteada de progreso (días registrados / mínimo) + CTA a Sintonía, en vez de los anillos.
   - Toda la tarjeta es clickeable → `setView('detail')`.
3. Bloque "TERAPIA & MEDICACIÓN" existente (toggle de terapia, próxima sesión, mini tracker, encuesta), sin cambios de lógica.

No se renderizan pilares ni correlaciones aquí.

## Vista 2 — Detalle (`view === 'detail'`)

1. Botón superior "← Volver a Mi Proceso" → `setView('dashboard')`.
2. `WellbeingHeroV3` en variante clara de detalle: número grande "78 / 100 Bienestar", línea "Cuidado y Adherencia: NN pts", barras de 7 días y botón "Ver calendario mensual completo" que abre `MonthCalendarSheet`.
3. "DESGLOSE POR PILARES": grilla 2x2 con `PillarGridV3` reorganizado en 4 tarjetas (Ánimo y Balance, Sueño y Descanso, Uso de Recursos, Tratamiento), cada una con ícono, score, y etiqueta de peso ("Bienestar 45%" / "Cuidado 60%"). Tocar una tarjeta abre el modal de calendario del mes.
4. Box plegable "INSIGHT CLÍNICO (SPEARMAN)" con `CorrelationInsights` dentro, con botón Ocultar/Mostrar.

## Detalles técnicos

- Estado local `const [view, setView] = useState<'dashboard'|'detail'>('dashboard')` en `MiProceso.tsx`; scroll al tope al cambiar de vista.
- Nuevos archivos: `src/components/proceso/ProcesoSummaryCard.tsx` (tarjeta oscura con anillos) y `src/components/proceso/PillarDetailGrid.tsx` (o refactor de `PillarGridV3` a 4 tarjetas con íconos y agrupación por índice).
- `WellbeingHeroV3` recibe una prop `variant?: 'detail'` para el layout claro con calendario; se mantiene el cálculo actual sin tocar `src/lib/wellbeing/*`.
- Reutilizar `MonthCalendarSheet` en Mi Proceso con el mismo contrato que en `Dashboard.tsx`.
- Ánimo y Balance se muestran combinados en una sola tarjeta (promedio ponderado por sus pesos actuales) para lograr la grilla 2x2 del mockup; los sub-ítems siguen visibles dentro de la tarjeta.
- Sin cambios en backend, hooks de datos ni tests de cálculo; solo capa de presentación.
