
# Plan por fases

Vamos a dividir todo en **6 fases**. Aprob\u00e1s esta fase, la implemento, la revis\u00e1s, y pasamos a la siguiente. Abajo est\u00e1 el mapa completo para que veas hacia d\u00f3nde vamos, pero **solo se implementa la Fase 1 al aprobar**.

---

## Mapa de fases

- **Fase 1 \u2014 Bugs cr\u00edticos + unificaci\u00f3n Resmita amarilla** (este plan)
- **Fase 2 \u2014 Inventarios (tests)**: saltar pr\u00f3logo, tiempo recomendado con sugerencia blanda, Resmita visible, admin de tiempo recomendado, edici\u00f3n de mensaje interpretativo en Baremos, explicaci\u00f3n de Big Five.
- **Fase 3 \u2014 Mente & Emoci\u00f3n**: rename \u201cModifica tus pensamientos\u201d, ejemplo en RTA adaptativa, paso \u201cTarea\u201d post-m\u00f3dulo, historial \u201cya lo hice\u201d, sacar subt\u00edtulo 5\u201310 min, admin: quitar Instrucciones IA, agregar distorsiones nuevas, actualizar emociones/somatizaci\u00f3n en Pensamientos y Regulaci\u00f3n.
- **Fase 4 \u2014 H\u00e1bitos, Mindfulness, Diario**: sacar psicoeducaci\u00f3n de h\u00e1bitos, Resmita registra ruta h\u00e1bitos, quitar icono rojo mindfulness, bot\u00f3n Insp\u00edrame reubicado + una frase por d\u00eda, modo zen sin Resmita/soporte. Admin H\u00e1bitos: renombrar \u201cCategor\u00edas DBT\u201d \u2192 \u201cCategor\u00edas\u201d, sincronizar con front, eliminar \u201cCoach IA\u201d y \u201cPlantillas cl\u00ednicas\u201d. Admin Diario: fix scroll subpesta\u00f1as, logos de Causas m\u00e1s est\u00e9ticos, 600 frases Insp\u00edrame.
- **Fase 5 \u2014 Noticias psicolog\u00eda (Resma Research \u201cMente Activa\u201d)**: como no hay RSS, agrego feed manual en el sitio + scraping semanal con Firecrawl + reescritura IA + CRUD admin + visibilidad opt-in en Home.
- **Fase 6 \u2014 Admin IA + Notificaciones**: sumar pantallas nuevas (Mindfulness scripts, Pensamientos etapas) al panel de Inteligencia Artificial con su prompt, subpesta\u00f1a de estad\u00edsticas de notificaciones y nuevas reglas de notificaci\u00f3n sugeridas.

---

## Fase 1 \u2014 Detalle a implementar ahora

### 1.1 Personalidad se ve en blanco
`src/pages/PersonalidadHome.tsx` renderiza `BigFiveProfileModal` como \u00fanica ruta. Si el modal falla o cierra, la p\u00e1gina queda blanca. Fix: envolver en una shell con fondo + fallback, y al `onClose` navegar a `/inventarios` (no `-1`, que puede volver a s\u00ed misma).

### 1.2 Segundo Resmita celeste sigue apareciendo en Mente y Mindfulness
Ya extendimos `HIDDEN_PREFIXES` para el FAB global, pero queda un **Resmita \u201cde escena\u201d celeste viejo** dentro de:
- `AiCompanionDrawer` en `PensamientosAutomaticos.tsx` (bot\u00f3n flotante celeste propio del wizard).
- Componente Resmita-escena en Mindfulness (revisar `MindfulnessHub`, `BreathingHome`, `ObservarHome`, `DescribirHome`).
- Regulaci\u00f3n emocional / cambio de pensamientos (mismo drawer viejo).

Acci\u00f3n: dejar **un solo Resmita amarillo (#facb60)** \u2014 el FAB actual chico estilo emergencia\u2014 y **eliminar** los launchers/burbujas celestes internos. El chat sigue siendo el mismo (`ResmitaSheet`), solo cambia qui\u00e9n lo abre. Hacer que el FAB amarillo aparezca en estas rutas (quitarlas de `HIDDEN_PREFIXES` que agregamos la vuelta anterior) para que quede visible y \u00fanico.

### 1.3 Icono rojo en Mindfulness
Localizar el bot\u00f3n rojo (probablemente CrisisButton o un launcher secundario en `MindfulnessHub`) y ocultarlo en rutas `/mindfulness/*` y en modo zen.

### 1.4 Insp\u00edrame tapa el input del Diario
En `Diario.tsx`, el bot\u00f3n \u201cInspirarme\u201d flota sobre el textarea. Moverlo a la barra de herramientas superior del editor (junto a los otros iconos) para que no cubra la escritura.

### 1.5 Modo Zen del Diario sin Resmita ni soporte
En zen mode, ocultar FAB Resmita, bot\u00f3n soporte/crisis e Insp\u00edrame. Se hace v\u00eda `useUiChrome` + `HIDDEN_PREFIXES` din\u00e1mico (bandera `zenMode`).

### 1.6 Scroll roto en Admin \u2192 Diario (subpesta\u00f1as)
Las subpesta\u00f1as de `AdminDiario` usan `overflow-hidden` en el contenedor padre; cambiar a `admin-scroll overflow-y-auto` con `pb-32` como en otros paneles admin.

### 1.7 Baremos no editable
En Admin \u2192 Progreso y Psicometr\u00eda \u2192 Baremos, el textarea del mensaje interpretativo est\u00e1 en `readOnly`/sin `onChange` conectado a `saveSetting`. Conectarlo al `update` correspondiente en `test_definitions` (columna `interpretation_message` o similar en `bands` JSON).

---

## Detalles t\u00e9cnicos (Fase 1)

Archivos a editar:
- `src/pages/PersonalidadHome.tsx` \u2014 envolver modal en shell + fallback + navigate `/inventarios`.
- `src/components/pensamientos/ai/AiCompanionDrawer.tsx` \u2014 eliminar launcher visual celeste; conservar solo la l\u00f3gica que abre `ResmitaSheet` v\u00eda evento global, o borrar componente si es solo UI.
- `src/pages/PensamientosAutomaticos.tsx` \u2014 quitar `<AiCompanionDrawer />` visible.
- `src/pages/Rumination.tsx`, `EmotionalRegulation.tsx`, `RegulacionDbt.tsx`, `Recovery.tsx`, `Grounding.tsx`, `MindfulnessHub.tsx`, `BreathingHome.tsx`, `ObservarHome.tsx`, `DescribirHome.tsx` \u2014 revisar y quitar launchers Resmita celestes internos.
- `src/lib/resmitaContextMap.ts` \u2014 sacar rutas de `HIDDEN_PREFIXES` que agregamos para que el FAB amarillo global vuelva a mostrarse en esas pantallas.
- `src/components/resmita/ResmitaFAB.tsx` \u2014 confirmar color `#facb60`, tama\u00f1o chico, izquierda; ocultar cuando `document.body.dataset.zen === '1'`.
- `src/pages/Diario.tsx` \u2014 reubicar bot\u00f3n Insp\u00edrame a la toolbar del editor; en zen agregar `document.body.dataset.zen = '1'` (y limpiar al salir).
- `src/pages/admin/modules/DiarioAdmin.tsx` (o similar) \u2014 fix scroll: `flex-1 admin-scroll overflow-y-auto`.
- Admin Baremos (archivo dentro de `src/pages/admin/modules/Psicometria*` / `Tests*`) \u2014 conectar `onChange` y guardar.
- Localizar y ocultar bot\u00f3n rojo en Mindfulness (probable `CrisisButton` renderizado dentro de la Hub; envolver con `useResmitaContext().ctx.hideCrisis` o filtrar por ruta).

Sin cambios de base de datos en esta fase.

---

## Qu\u00e9 NO se toca en Fase 1
Todo lo dem\u00e1s de tu lista (inventarios, tarea post-m\u00f3dulo, 600 frases, noticias Resma Research, admin IA, notificaciones, Big Five explicaci\u00f3n) \u2014 se aborda en Fase 2\u20136.

\u00bfArrancamos con Fase 1?
