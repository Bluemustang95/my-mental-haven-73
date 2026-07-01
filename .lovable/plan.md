## Objetivo
Que el **Índice de Bienestar** sea el centro absoluto de "Mi Proceso": aparezca alto en pantalla y que al abrirlo se despliegue TODO el análisis (semanal/mensual, actividad, minutos, pilares, comparación, origen del número, feed de actividad reciente y stats mensuales de medicación/adherencia) sin secciones sueltas debajo.

## Cambios en `src/pages/MiProceso.tsx`
1. **Subir el Índice de Bienestar**:
   - Reducir el header: quitar el `pt-7` → `pt-4`, achicar el título a `text-[17px]` y el subtítulo a `text-[11px]` en una sola línea compacta.
   - Eliminar el label "Estadísticas de impacto" con el separador vertical (`mt-5 mb-2.5`) → el card queda directamente pegado al header.
   - Resultado: `WellbeingCardV2` visible en el primer viewport sin scroll.
2. **Mantener debajo solo**: `PsychometryCarousel`, `BigFiveCard` y el bloque de Terapia (sin cambios de contenido). Estos NO son "estadísticas" sino evaluaciones/vinculación, así que se quedan.
3. **Eliminar cualquier bloque de stats sueltos** que hubiera quedado abajo (ya no hay `PeriodStats` ni "Minutos de práctica" en la vista raíz — confirmar y limpiar imports muertos).

## Cambios en `src/components/proceso/WellbeingAnalysisSheet.tsx`
Convertir el sheet en el **hub único de estadísticas**. Orden final del contenido (ya con toggle Semanal/Mensual arriba):

1. Banner de estado ("Tu semana/mes") — existente.
2. Sparkline grande — existente.
3. **Minutos de práctica** (mindfulness + respiración) — existente.
4. **NUEVO**: bloque `PeriodStats` completo (con toggle interno oculto porque ya se controla arriba) mostrando check-ins, tests, hábitos, recursos, DBT, pensamientos.
5. **NUEVO**: card de **Adherencia a medicación** del período (tomas / totales, % adherencia) — leer de `medication_logs` usando la misma ventana que `rangeMode`.
6. **NUEVO**: `RecentActivityFeed` compacto (últimas 5 acciones del período) — reutilizar el componente existente en `src/components/proceso/RecentActivityFeed.tsx`.
7. Pilares 2×2 — existente.
8. Comparación semana anterior vs actual — existente (renombrar labels dinámicamente semana/mes).
9. "De dónde viene tu número" — existente.

Todos los queries respetan `rangeMode` (7 vs 30 días).

## Resultado
- Al entrar a Mi Proceso el Índice aparece arriba, sin scroll.
- Un solo tap en "Ver mi análisis" abre TODO el análisis clínico consolidado (semana o mes), sin métricas repartidas por otras pantallas.
