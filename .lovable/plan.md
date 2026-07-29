## Fase 4 — Índice de Bienestar (Modelo A) en pantalla

El cálculo Modelo A ya está implementado en el motor (`src/lib/wellbeingScore.ts`). Lo que falta es que la interfaz **muestre y explique** ese modelo: hoy la tarjeta solo enseña un número grande y un porcentaje verde/rojo, sin distinguir "sin datos suficientes" de "score bajo", sin decir de dónde sale y sin separar bienestar de autocuidado.

### Qué mide hoy el índice (recordatorio del modelo)

Solo auto-reporte de los últimos 7 días (Sintonía de la mañana y Balance nocturno):

| Componente | Peso | De dónde sale |
|---|---|---|
| Ánimo | 35% | promedio de `mood_score` (1-5 → 0-100) |
| Sueño | 25% | promedio de `sleep_score` (1-5 → 0-100) |
| Balance emocional | 25% | emociones positivas / (positivas + negativas) del check-in nocturno |
| Despertar | 15% | `dawn_score` mapeado (Excelente 100 … Pésimo 10) |

- Si falta un componente, los pesos se **renormalizan** entre los presentes.
- Umbral: se necesitan **3 días distintos con check-in** dentro de la ventana de 7 días. Por debajo de eso el índice no se calcula.
- Delta: ánimo de los últimos 7 días vs. los 7 anteriores; se ignoran variaciones menores a ±2%.
- Autocuidado (hábitos, medicación, uso de recursos, tests) se calcula aparte y **no suma al índice** — para que "usar la app" no infle el bienestar.

### Cambios de esta fase

**1. Tarjeta del índice (`WellbeingCardV2`)**
- Anillo de progreso alrededor del número (arco 0-100, color según franja: verde ≥70, ámbar 45-69, coral <45) en vez de solo el número suelto.
- Etiqueta de estado bajo el número: "En equilibrio" / "Con altibajos" / "Semana difícil".
- Micro-sparkline de 7 días a la derecha usando `trend`, con los días sin check-in marcados como huecos y no como cero.
- Chip de delta solo cuando hay comparación real (hoy muestra "+0%" incluso sin datos previos).

**2. Estado "datos insuficientes"**
- Si `hasEnoughData` es falso, la tarjeta deja de mostrar "0/100" y pasa a un estado propio: anillo punteado, texto "2 de 3 días registrados" y CTA "Registrar Sintonía de hoy" que lleva al ritual correspondiente.
- Esto elimina el falso negativo actual de un 0 rojo cuando la persona simplemente no registró.

**3. Mensaje contextual**
- El mensaje deja de depender solo del score y apunta al **componente más débil**: por ejemplo "Tu descanso es lo que más pesa esta semana" (sueño más bajo) o "Las emociones difíciles predominaron en tus noches" (balance bajo).
- Si un componente falta por completo, mensaje invitando a completarlo ("Sin datos de despertar esta semana").

**4. Bottom sheet de detalle (`WellbeingAnalysisSheet`)**
- Bloque nuevo "Cómo se compone tu índice": 4 barras (Ánimo 35%, Sueño 25%, Balance 25%, Despertar 15%) con su valor 0-100 y el peso aplicado; si un peso se renormalizó, se indica.
- Bloque separado y visualmente distinto "Autocuidado — no afecta tu índice": hábitos, medicación, uso de recursos y tests.
- Línea de metodología: ventana de 7 días, mínimo 3 días de registro, fuente de los datos.

**5. Consistencia**
- Tipografía unificada a `font-display` en tarjeta y sheet, alineada al resto de la app.
- Los mismos estados (franja de color y etiqueta) se reutilizan en el sheet para que tarjeta y detalle nunca se contradigan.

### Detalles técnicos

- `src/lib/wellbeingScore.ts`: agregar al snapshot `weakestComponent`, `appliedWeights` (pesos renormalizados) y `daysWithCheckin`; ajustar `message` para que sea contextual. El cálculo del score no cambia.
- `src/components/proceso/WellbeingCardV2.tsx`: reescritura con anillo SVG, estado sin datos, sparkline y etiqueta de franja.
- `src/components/proceso/WellbeingAnalysisSheet.tsx`: nuevos bloques de composición y autocuidado, más nota de metodología.
- Sin cambios de base de datos ni de esquema.

Con esto quedan cerradas las 5 fases del rediseño.
