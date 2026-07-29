## Objetivo

En Admin → Progreso y Psicometría → pestaña "Índice de Bienestar", reemplazar la configuración vieja (que todavía muestra pesos "Check-in / Tests / Hábitos / Recursos", desalineados con el Modelo A actual) por tres bloques: **esquema visual completo del índice**, **auditoría global** y **datos de prueba**.

---

### 1. Esquema visual con TODAS las variables

Diagrama de flujo completo: de qué pantalla sale cada dato, en qué columna de la base se guarda, cómo se transforma y con cuánto peso entra.

```text
RITUAL MAÑANA (Sintonía)        RITUAL NOCHE (Balance)
   mood_score  1-5                 sleep_score  1-5
   dawn_score  texto               emotions[]  etiquetas
        │                                │
        └────────► daily_checkins ◄──────┘
                        │
     ventana 7 días · mínimo 3 días distintos con check-in
                        │
   ┌────────────────────┴────────────────────┐
   │ Ánimo      35%  = avg(mood_score)  × 20 │
   │ Sueño      25%  = avg(sleep_score) × 20 │
   │ Balance    25%  = pos / (pos + neg)×100 │
   │ Despertar  15%  = DAWN_MAP[dawn_score]  │
   └──────────────┬──────────────────────────┘
     si un factor falta → su peso se reparte
     proporcionalmente entre los presentes
                  ▼
          ÍNDICE 0-100  +  delta vs. 7 días previos
                        +  tendencia (7 puntos)
                        +  componente más flojo → mensaje

AUTOCUIDADO (se muestra, NO suma al índice)
   Hábitos · Medicación · Uso de recursos · Tests
```

Cada variable listada en una tabla con: origen (pantalla), campo en base, rango de entrada, fórmula de normalización a 0-100, peso y si es obligatoria u opcional. Se incluyen además todas las variables auxiliares: `checkin_date` y el modo mañana/noche, el mapeo completo de `dawn_score` (Excelente 100 · Muy bien 80 · Normal 60 · Mal 30 · Pésimo 10), la lista exacta de emociones positivas y negativas del Balance, el filtro de recursos ocultos que se aplica al autocuidado, y las constantes de ventana (7 días) y umbral (3 días). Todo leído de las constantes exportadas del motor, nunca copiado a mano.

### 2. Auditoría global de la plataforma

Tarjeta con métricas sobre `daily_checkins` (7 y 30 días) vía función de base de datos nueva solo para admins:

- % de usuarios con datos suficientes (≥3 días) vs. insuficientes vs. sin ningún check-in.
- Cobertura por variable: qué porcentaje de check-ins trae `mood_score`, `sleep_score`, `dawn_score` y emociones nocturnas, en barras.
- Lista de faltantes ordenada por impacto (ej. "62% de los índices se calculan sin Despertar → su 15% se redistribuye").
- Alertas automáticas por cobertura baja y por desbalance entre ritual de mañana y de noche.

### 3. Sembrar check-ins de prueba

- **Sembrar 3 días** — crea check-ins reales de hoy, ayer y anteayer en tu propia cuenta admin, con mañana y noche completas, marcados como datos de prueba.
- Escenarios: *Alto*, *Medio*, *Bajo* e *Incompleto* (sin despertar ni emociones, para ver la renormalización en vivo).
- **Borrar datos de prueba** — elimina solo lo sembrado, sin tocar check-ins reales.
- Aviso de que escribe datos reales en tu cuenta y link directo a "Mi proceso".

---

### Detalles técnicos

- Migración: columna `is_test_seed boolean default false` en `daily_checkins` y función `admin_wellbeing_audit()` `security definer` con chequeo `has_role(auth.uid(),'admin')`.
- Sembrado y borrado desde el cliente con la sesión del admin sobre su propio `user_id`, respetando RLS.
- `src/lib/wellbeingScore.ts`: exportar `WEIGHTS`, `MIN_DAYS`, `DAWN_MAP`, `POSITIVE_EMOTIONS`, `NEGATIVE_EMOTIONS` y el tamaño de ventana como fuente única de verdad.
- UI nueva en `src/pages/admin/modules/ProgresoAdmin.tsx` + componentes en `src/components/admin/` (esquema, auditoría, sembrador) con los primitivos `AdminCard`/`AdminButton`.
- Se elimina el slider de pesos obsoleto (checkin/tests/habits/resources) porque ya no corresponde al cálculo real.
