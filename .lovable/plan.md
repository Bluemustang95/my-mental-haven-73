
# Rediseño del Índice de Bienestar — Modelo A

## Objetivo
El índice mide **cómo se siente la persona** (outcome auto-reportado). El uso de recursos se separa como "Autocuidado" y no entra al cálculo.

## Cálculo (0–100, últimos 7 días)

| Dimensión | Peso | Fuente | Escala |
|---|---|---|---|
| Ánimo | 35% | `daily_checkins.mood_score` (1–5) | promedio ×20 |
| Sueño | 25% | `daily_checkins.sleep_score` (1–5) | promedio ×20 |
| Despertar | 15% | `daily_checkins.dawn_score` | Excelente=100, Muy bien=80, Normal=60, Mal=30, Pésimo=10 |
| Balance emocional | 25% | `daily_checkins.emotions[]` en modo `night` | `pos/(pos+neg)` ×100, promedio de noches |

POSITIVAS: Alegría, Calma, Motivado, Cariño.
NEGATIVAS: Agotamiento, Ansiedad, Enojo, Tristeza, Confuso.

**Renormalización:** si una dimensión no tiene datos, se saca y los pesos restantes se reescalan a 100%. Ausencia no penaliza.

**Umbral:** mínimo 3 días distintos con check-in en la ventana. Bajo eso, no se muestra número — se muestra "Faltan X día(s) de registro para calcular tu bienestar."

**Delta:** solo sobre Ánimo, ventana actual vs. 7 días anteriores. Sin flecha si `|delta| ≤ 2` o sin datos previos.

**Trend:** array 7d con `mood_score × 20` (0 los días sin check-in, se renderiza como hueco).

**Mensajes:**
- Sin datos suficientes → "Faltan X día(s)…"
- ≥ 70 → "Vas muy bien. Sostené las rutinas que te están ayudando."
- 45–69 → "Semana con altibajos. Es normal que el proceso no sea lineal."
- < 45 → "Días difíciles. Bajá la exigencia y volvé a lo básico: dormir y respirar."

## Autocuidado (separado, no entra al índice)
Se sigue calculando y exponiendo en `snapshot.selfCare` (opcional) para futura UI de correlaciones:
- `habits`: % días con hábito completado (7d)
- `engagement`: conteo total (pensamientos + DBT + diario + mindfulness + pack + reflexiones) (7d)
- `medication`: % tomas `taken=true` (7d, si registra)
- `tests`: severidad del último test por tipo (excluyendo BFI)

## Archivos

**Se reescribe:**
- `src/lib/wellbeingScore.ts` — nueva `loadWellbeing()`, nuevos `WEIGHTS`, nuevo tipo `WellbeingSnapshot.components = { mood, sleep, dawn, balance }`, `selfCare` opcional, umbral de 3 días.

**Se auditan y ajustan** (solo si leen `components.habits/tests/engagement/medication`):
- `src/pages/MiProceso.tsx`
- `src/components/proceso/WellbeingCardV2.tsx`
- `src/components/proceso/WellbeingAnalysisSheet.tsx`

Si desglosan componentes viejos, se remapean a los nuevos (`mood/sleep/dawn/balance`) o se mueve a la sección `selfCare`. El número, delta, mensaje y trend siguen renderizándose igual.

## Fuera de alcance
- Sin migraciones de base de datos.
- No se toca `activityAggregator.ts` ni `WellbeingCard.tsx` legacy.
- No se cambia UI del Home ni de MiProceso más allá de lo necesario para no romper.

## Validación
1. `tsgo` limpio.
2. Preview: usuario con 0/1/2 check-ins → mensaje de umbral, sin número. Con 3+ → número calculado.
3. Confirmar que agregar/quitar hábitos ya no mueve el número.
