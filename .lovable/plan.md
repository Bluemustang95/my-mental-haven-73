
## 1 · Página `/diario-inteligente/regulacion-emocional`

Archivo: `src/pages/DiarioInteligente.tsx`

- Cambiar el fondo oscuro `bg-[#0F0F12] text-white` por el mismo tono crema que usa Mindfulness (`bg-resource-mindfulness-bg text-foreground`) y quitar los blurs violeta/fucsia. El header y las tarjetas pasan a paleta clara coherente con la identidad calma (acentos en `resource-mindfulness-accent` y `#7cc2c8`).
- Asegurar que `min-h-screen` cubra todo (sin franja blanca al final) ajustando padding inferior y removiendo el `absolute` que dejaba huecos.
- **Eliminar la grilla "Otros ejercicios"** (los 3 fallback "Ejercicio" morados/rojos): borrar el bloque `OTROS EJERCICIOS` + `items.map` cuando `slug === "regulacion-emocional"`. Solo quedan: `PatternInsights`, tarjeta **Cambiar respuestas emocionales** y tarjeta **STOP & TIPP**.
- **FAB "+"**: mostrarlo siempre (no solo cuando `saved`) cuando el usuario ya tiene al menos una sesión registrada (usar `PatternInsights` o un fetch breve a `dbt_emotion_sessions`/`exercise_sessions` para detectar `hasAny`). Al tocarlo se hace scroll a las tarjetas / abre un selector simple igual al patrón de Mindfulness.

## 2 · Página `/herramientas/cambiar-respuestas`

Archivo: `src/pages/CambiarRespuestas.tsx`, `src/components/dbt/shared.tsx`, `src/components/dbt/SessionTimeline.tsx`, `src/components/dbt/Ficha8AModal.tsx`.

### 2.1 · Downbar tapa "Siguiente"
- Aumentar el padding inferior del contenido (`pb-32` → `pb-44`) y subir el `WizardFooter` fijo (`bottom-0` → `bottom-20` o sumar safe-area + altura del bottom nav) para que el botón "Siguiente" quede visible sobre la barra flotante de navegación.
- Hacer lo mismo con el FAB socrático (ya está en `bottom-24`, verificar).

### 2.2 · Paso 3 (Wizard F8) — recordar el evento
- Antes del textarea de "interpretaciones", insertar una tarjeta de contexto con `state.eventDescription` (estilo `rounded-[20px] bg-[#f2f2f2] p-4`, con label "Tu evento"). Solo se muestra si hay texto.

### 2.3 · Paso 6 (Wizard F8) — ejemplos solo de la emoción elegida
- En `Ficha8AModal`, aceptar prop opcional `emotion?: DbtEmotion`. Cuando viene, renderizar **solo** `FICHA_8A[emotion]` (no el listado completo).
- Pasar `emotion={state.selectedEmotion}` desde `CambiarRespuestas`.
- Cambiar la etiqueta del botón a "Ver ejemplo de {emoción}" y quitar la mención "(Ficha 8A)".

### 2.4 · Quitar nomenclatura "Ficha N" / "F8 · F9 · F10 · F11 · F12 · F13"
- **Header (`subtitleByStage`)**: reemplazar por etiquetas limpias:
  - `wizard8` → "Verificar los hechos"
  - `decision9` → "Mente Sabia"
  - `problem12` → "Resolver el problema"
  - `opposite10` → "Acción Opuesta"
  - `done` → "Sesión guardada"
- **`FichaCallout`**: cambiar el `label` en cada paso para que no diga "Ficha 8 · Paso 1" etc. Usar "Paso N" o el título descriptivo (ej. "Empezamos", "Justificación", "Descubrir").
- **`SessionTimeline`**: quitar el prefijo "F" en los círculos. Usar números/iconos simples (`1`, `2`, `3`, `✓`) o únicamente el label ("Hechos", "Mente Sabia", "Acción Opuesta", "Cierre"). Sin "F10·13".
- **Tarjeta de la sesión Premium** en `DiarioInteligente`: cambiar "Fichas 8 a 13 · IA guiada · …" por "IA guiada · Verificá los hechos, decidí y actuá".
- Limpiar otros textos visibles: "Iniciar · Resolución de Problemas (Ficha 12)" → "Iniciar · Resolver el problema"; "Iniciar · Acción Opuesta (Ficha 10)" → "Iniciar · Acción Opuesta"; "Plan corporal (Ficha 13)" → "Plan corporal"; "Usar plan corporal de referencia (Ficha 13)" → "Usar plan corporal de referencia". Conservar la lógica interna intacta (los nombres `wizard8`, `problem12`, etc. se mantienen, solo cambia el copy visible).

### 2.5 · Acción Opuesta como "tarea pendiente"
- Insertar un nuevo paso/bloque antes del cierre (entre el paso 6 plan corporal y el paso 7 cierre): tarjeta "Tu tarea" con un resumen (`acción opuesta sugerida` + `plan corporal`) y un botón **"Listo, ya lo hice"**. Funciona igual que el paso 6 de `problem12` ("Ya actué, pasar a evaluar"): hasta que el usuario confirme no se avanza al guardado. Persistimos `opposite.actionTaken: boolean` en el reducer (`useChangeResponseFlow.tsx`) y bloqueamos `Guardar` hasta `actionTaken === true`.
- En `problem12` paso 6 ya existe ese patrón — solo unificar el copy.

## Detalles técnicos

- `useChangeResponseFlow.tsx`: añadir `actionTaken: boolean` dentro de `opposite` (default `false`). Soporte en `PATCH_OPPOSITE`.
- `SessionTimeline`: aceptar etiquetas sin prefijo F; reducir tamaño del círculo si hace falta.
- `WorkspaceHeader`: el subtitle ya viene parametrizado, no requiere cambios estructurales.
- `Ficha8AModal`: prop `emotion?: DbtEmotion` opcional para retro-compatibilidad.
- Sin cambios de schema en Supabase.

## Fuera de alcance
- No se tocan los flujos de IA, ni `PatternInsights`, ni `EmotionWheelSVG`.
- No se modifica `EmotionalRegulation.tsx` (STOP & TIPP) ni `Mindfulness.tsx`.
