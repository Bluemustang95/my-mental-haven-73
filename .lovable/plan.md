## Primero: la respuesta a tu pregunta (estado real de hoy, leído del código en `src/lib/wellbeingScore.ts`)

### La verdad incómoda
Hoy **solo UNA tabla alimenta el índice**: `daily_checkins`. Nada más. Ni inventarios, ni pensamientos automáticos, ni diario, ni hábitos, ni psicoeducación, ni pesadillas, ni higiene del sueño entran al número. Eso fue una decisión explícita del "Modelo A": el índice mide **cómo te sentís** (auto-reporte), no **cuánto usás la app**. Todo lo demás se calcula, se muestra aparte como *Autocuidado*, y **suma 0%** al índice.

### Qué alimenta cada subíndice, exactamente

| Subíndice | Peso | Única fuente | Campo | Fórmula real |
|---|---|---|---|---|
| Ánimo | 35% | Sintonía de la mañana | `mood_score` (1-5) | promedio de la ventana ÷ 5 × 100 |
| Sueño | 25% | Balance nocturno | `sleep_score` (1-5) | promedio ÷ 5 × 100 |
| Balance emocional | 25% | Balance nocturno | `emotions[]` | por noche: positivas ÷ (positivas+negativas) × 100, luego promedio |
| Despertar | 15% | Sintonía de la mañana | `dawn_score` (texto) | Excelente 100 · Muy bien 80 · Normal 60 · Mal 30 · Pésimo 10, luego promedio |

Detalles que probablemente no sabías:
- **Ánimo** promedia *todas* las filas con `mood_score`, sin importar el modo. Si un día registrás mañana y noche, ese día pesa doble en el promedio. Es un sesgo real.
- **Balance** solo lee filas con `mode = 'night'` **o `mode = null`**. Emociones fuera de las 10 listas (5 positivas / 5 negativas) se **ignoran silenciosamente**.
- **Renormalización**: si falta un factor, su peso se reparte proporcional entre los presentes. Ej.: sin Despertar, Ánimo pasa de 35% a 41%. Dos personas con el mismo 72 pueden tener bases distintas.
- **Delta**: no compara el índice, compara **solo el ánimo** contra los 7 días previos, y se ignora si es menor a 3 puntos.
- **Tendencia (los 7 puntos)**: es `mood_score × 20`, **no el índice**. El gráfico que ves no es la serie del índice.
- **Autocuidado (0% de peso)**: Hábitos (días con hábito ÷ 7), Medicación (tomas sí ÷ total), Engagement (thought_records + DBT + diario + mindfulness + reflexiones + BA → escalones 1/3/6/10 = 35/60/80/100), Tests (última severidad por test, excluyendo Big Five).

### ¿Por qué 3 días de 7?
No es arbitrario, pero tampoco está documentado: con 1-2 días, un mal día individual mueve el índice 30-40 puntos y la persona lee ruido como diagnóstico. Con 3 días distintos ya hay una mínima señal de tendencia y el error de un outlier cae a ~1/3. La ventana de 7 mantiene el índice **sensible** (una buena semana se nota) sin ser volátil. Es el mismo criterio que usan Samsung/Oura para no mostrar score hasta tener suficientes noches.

### Variables que HOY no se tienen en cuenta y que sí deberían discutirse
1. **Tests clínicos (PHQ-9, GAD-7)** — son el único dato psicométricamente validado que tenés y pesan 0%. Es la omisión más grande.
2. **Pesadillas / registro de sueños** — contradicen directamente el `sleep_score` autoinformado y no se cruzan.
3. **Higiene del sueño** — conductual, no subjetiva; podría matizar el subíndice Sueño.
4. **Pensamientos automáticos** — la *intensidad* de la emoción y el SUDS pre/post son señal afectiva pura, no "uso de app". Hoy solo se cuentan como engagement.
5. **Hábitos y medicación** — la adherencia predice recaída, pero mezclarla infla el índice. Se puede mostrar como *modulador*, no como sumando.
6. **Sesgo de doble registro en Ánimo** (mañana + noche cuentan doble el mismo día).
7. **Emociones fuera de lista** que se descartan en silencio.

---

## Qué voy a entregarte

### 1. PDF exhaustivo (`/mnt/documents`)
Documento completo con:
- Diagrama de flujo pantalla → tabla → campo → transformación → peso.
- Un mapa por subíndice, con lo que entra hoy y lo que se ignora (marcado en gris).
- Tablas de rango, normalización, obligatoriedad y renormalización con ejemplos numéricos reales.
- Mapeo completo de Despertar y listas exactas de emociones.
- Sección "Por qué 3 días" con la justificación estadística.
- Sección de recomendaciones: 3 modelos alternativos (A actual, B con tests como modulador clínico, C con capas Sentir/Dormir/Actuar) con pros y contras de cada uno.
- Auditoría de sesgos conocidos (doble registro, emociones descartadas, delta que solo mira ánimo).

### 2. Rediseño de la vista del usuario, estilo Samsung Health
En "Mi proceso": índice grande arriba con etiqueta de estado ("Buena", "En equilibrio") y **barra de 7 días con puntos por día** — igual que tu captura, donde cada día muestra si hubo registro y con qué color. Debajo, **tarjetas de subíndice** (Ánimo, Sueño, Balance, Despertar) cada una con su número, su mini-anillo o barra, y su peso aplicado esa semana, para que se entienda de dónde sale el número.

### 3. Espejo del esquema en Admin
La misma explicación del PDF, viva y leída de las constantes reales, en la pestaña "Índice de Bienestar" — incluyendo la columna nueva de "variables que NO entran y por qué".

---

## Detalles técnicos
- PDF generado con script Python (reportlab) + QA página por página antes de entregarlo.
- Fuente de verdad: `WEIGHTS`, `MIN_DAYS`, `WINDOW_DAYS`, `DAWN_MAP`, `POSITIVE_EMOTIONS`, `NEGATIVE_EMOTIONS` ya exportadas de `src/lib/wellbeingScore.ts`.
- Rediseño visual en el componente del índice de `MiProceso` + un `SubIndexCard` nuevo; sin tocar la lógica de cálculo salvo que apruebes un cambio de modelo.
- Los cambios de modelo (sumar tests, corregir doble registro) **no se implementan en este paso**: primero leés el PDF y decidís.
