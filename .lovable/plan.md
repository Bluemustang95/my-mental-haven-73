# Plan: Regulación Emocional + Sesiones abiertas + Inicio

## 1. `DiarioInteligente.tsx` (regulacion-emocional) — estilo igual a Mindfulness

Reescribir la vista para que copie la estética de `MindfulnessHub.tsx`:

- Fondo plano `bg-[#FDFCFB]`, sin gradientes oscuros ni glass.
- Header igual a Mindfulness: botón redondo blanco con back, h1 `font-serif text-3xl font-bold text-[#101927]` ("Regulación Emocional"), subtítulo gris ("Equilibrá tus emociones con DBT").
- `WeekStrip` directo (sin contenedor card extra).
- **Quitar el badge "PREMIUM"** de la tarjeta "Cambiar respuestas emocionales".
- Convertir las tarjetas (Cambiar respuestas / STOP & TIPP) al mismo formato de Mindfulness: row blanca `rounded-2xl bg-white p-3 shadow-sm`, ícono cuadrado con gradiente a la izquierda, título + descripción.
- Mantener `PatternInsights` arriba, pero con los mismos tokens claros (texto `#101927`, sin pinks translúcidos).
- FAB "+" igual al de Mindfulness (`bottom-24 right-5`, `bg-[#101927]`), visible si `hasAnySession`.

## 2. Sesiones abiertas — sección desplegable debajo de los recursos

Nuevo componente `src/components/dbt/OpenSessionsList.tsx`:

- Lee `localStorage` key del flow DBT (`useChangeResponseFlow`) → si `draftHasProgress(state)` hay 1 sesión abierta DBT.
- (Extensible) también lee otros drafts existentes si los hubiera (psicoeducación / pack), pero por ahora solo DBT.
- Render: card colapsable blanca con título "Sesiones abiertas · N", al expandir muestra filas con: emoción, etapa actual (`subtitleByStage`), tiempo relativo.
- Cada fila tiene dos acciones:
  - **Continuar** → navega a `/herramientas/cambiar-respuestas` (mantiene el draft).
  - **Marcar como completada** → llama a `saveSession`-equivalente liviano: inserta en `dbt_emotion_sessions` con los datos del draft + `action_completed: true` (si la columna no existe, simplemente guarda con el path actual y limpia draft), luego limpia el draft y refresca.
- Se monta en `DiarioInteligente` (regulacion-emocional) justo debajo de las cards de recursos.

## 3. Quitar el "confeti final" al re-entrar a Cambiar Respuestas

En `CambiarRespuestas.tsx`:

- Al montar, si `state.stage === "done"`, hacer `dispatch({ type: "RESET" })` + `clearDraft()` automáticamente → la próxima visita arranca en `wizard8` paso 1.
- En `saveSession`, después del `toast.success` y del confeti, agendar `setTimeout(() => navigate("/diario-inteligente/regulacion-emocional"), 1800)` y limpiar el draft (el usuario ya no queda atrapado en la pantalla de "done").
- La pantalla "done" actual queda como transición corta (confeti + saludo) antes del redirect, no como vista persistente.

## 4. Botón "Completado" en `PatternInsights` (TUS PATRONES · N SESIONES)

Cuando exista al menos una sesión abierta detectada por `OpenSessionsList`:

- Agregar un pill en el header de `PatternInsights`: "1 sesión pendiente · Marcar como hecha" que dispara la misma acción de "Marcar como completada" de la sección de sesiones abiertas.
- Si no hay sesiones abiertas, el pill no se renderiza.

## 5. Pendientes en Inicio (`Dashboard.tsx`)

Nuevo bloque "Pendientes" entre el Timeline y el card de sueño:

- Componente `src/components/home/PendingBento.tsx` (grid 2 columnas, cards chicos `rounded-2xl bg-white shadow-sm`).
- Fuentes:
  - **DBT abierto**: lee draft de `useChangeResponseFlow` (sin hook completo, parsea localStorage). Muestra "Cambiar respuestas · {emoción}" → click navega al wizard.
  - **Psicoeducación inconclusa**: query a `psycho_progress` (o tabla equivalente; si no existe, lee localStorage de `PsychoModal`). Muestra "Seguir leyendo: {título}".
  - **Pack de actividades en curso**: query a `pack_progress` / `behavioral_activation_progress` (lo que ya esté implementado). Muestra "Día N · {pack}".
- Si no hay pendientes, el bloque no se renderiza.

## 6. Separación visual en Inicio: "Te ayudamos con tu sueño"

En `Dashboard.tsx`, el `PremiumLock` que envuelve el botón de sueño actualmente usa `mt-3`. Aumentar a `mt-8` (o `mt-10`) para despegarlo de "Valoración de la noche".

## Detalles técnicos

- No tocar `useChangeResponseFlow.tsx` salvo exponer un helper `readDraftFromStorage()` (o reusar el ya existente) para leer el draft fuera del provider en `OpenSessionsList` y `PendingBento` sin instanciar el reducer dos veces.
- `dbt_emotion_sessions` ya existe; al "marcar como completada" se inserta con los campos disponibles del draft (los faltantes quedan `null`). No requiere migración.
- Sin cambios en edge functions, RLS ni AI.
- Tipografía: respetar `font-serif`/`font-display`/`font-body` ya definidos. No introducir colores hardcodeados nuevos fuera de los que ya usa Mindfulness (`#FDFCFB`, `#101927`).

## Fuera de alcance

- Rediseño de STOP & TIPP, EmotionWheel o el wizard interno.
- Cambios en `Mindfulness.tsx` / `MindfulnessHub.tsx`.
- Nuevas tablas o columnas en Supabase.
