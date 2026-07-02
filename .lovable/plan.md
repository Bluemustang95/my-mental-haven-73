
## 1. Fix drawer IA (Modificá tus pensamientos)
- `AiCompanionDrawer.tsx`: usar `useHideBottomNav(open)` para ocultar el `BottomNav` (incluye el SOS FAB) mientras el drawer esté abierto y aumentar `z-index` del drawer por encima de la nav.
- Contexto para la IA: hoy el drawer ya envía `draft` (situación, pensamiento, emociones, distorsiones…). Ampliar el `system prompt` en `pensamientos-companion/index.ts` para que:
  - lea explícitamente cada campo completado (incluye `evidenceFor/Against`, `alternativeThought`, `resolutionPlan`, `intensityInitial/Final`).
  - Cuando el usuario diga "completalo" / "sugerí", la IA devuelva propuestas puntuales para el paso actual.
- En el drawer agregar dos chips rápidos: "Leé lo que escribí" y "Ayudame a completar este paso" que precargan un mensaje al input.

## 2. Historial "Mente & Emoción"
- Nueva sección en `/herramientas/mente-emocion` (`MenteEmocion.tsx`) debajo de las 2 cards: lista de últimos registros de `thought_records` (situación, emoción, fecha, estado de tarea) con "Ver todo".
- Nueva ruta `/herramientas/mente-emocion/historial` con lista completa + detalle (reutiliza datos existentes; no se duplica en Diario).
- El calendario (`calendarActivity.ts`) y `wellbeingScore` ya leen `thought_records`; verificar que el nuevo campo de tarea no rompa nada. Se muestran ahí como "actividad" pero el contenido solo se lee desde Mente & Emoción.

## 3. Tarea de seguimiento post-ejercicio
Al terminar el wizard (Paso 8 guardado):
- Modal "¿Querés fijar esta tarea en Inicio?" con:
  - Tipo detectado (`reestructuracion` → "Practicá tu pensamiento alternativo" / `abordaje` → "Ejecutá tu plan de acción").
  - Fecha objetivo (hoy / mañana / +3 días).
- Si acepta → se crea `thought_followups` vinculado al `thought_record_id`.

Widget Inicio "Tarea pendiente – Mente & Emoción":
- Aparece cuando hay followup no completado (integrado en `WidgetsBoard` como widget opcional).
- Al tocar → mini-flow: ¿La hiciste? Sí/No → si Sí: SUDS antes/después, "¿Lo lograste?" (sí/parcial/no), nota breve, próximo paso.
- Guarda `thought_followup_logs` y marca followup como `completed`.

Historial: cada entrada de Mente & Emoción muestra badge "Tarea: pendiente / completa" y expande los logs.

## 4. Admin — `PensamientosAdmin.tsx`
Convertir listas a persistidas y editables completas:
- **Distorsiones**: CRUD (agregar/editar/eliminar/toggle) con emoji o URL de icono, nombre, descripción. Se leen desde `admin_settings` en el wizard (`Step7Distorsiones` reemplaza `DISTORTIONS` estático por fetch).
- **Emociones**: CRUD con emoji + label + intensidad por defecto. Consumido por `Step3Emociones`.
- **Somatizaciones**: CRUD con emoji + label + emociones vinculadas. Consumido por `Step5Sensaciones`. Pre-cargar las que ya existen en `bodySensations.ts` como semilla si el setting está vacío.
- **Instrucciones IA**: además del textarea de prompt, agregar:
  - Selector de modelo (`google/gemini-3-flash-preview` [default], `google/gemini-2.5-flash`, `google/gemini-2.5-pro`, `openai/gpt-5-mini`, `openai/gpt-5`) con el costo relativo textual editable.
  - Prompt precargado específico para pensamientos automáticos (TCC Beck + voseo AR, socrático, no diagnóstico, lee draft).
  - Se guarda en `admin_settings.pensamientos_ai` (`{ model, prompt, costs }`). La edge function `pensamientos-companion` lee ese setting antes de llamar al gateway.

## 5. Base de datos
Migración con:
- `thought_followups` (`thought_record_id`, `user_id`, `type`, `title`, `due_date`, `status`, `pinned_home`).
- `thought_followup_logs` (`followup_id`, `user_id`, `suds_before`, `suds_after`, `achieved`, `note`, `next_step`).
- GRANT + RLS por `user_id`.

## 6. Detalles técnicos
- El edge function `pensamientos-companion` pasa a leer `admin_settings.pensamientos_ai` para armar system prompt y elegir modelo (fallback al default).
- `MenteEmocion.tsx` recibe una prop de historial cargando desde `thought_records` (últimos 5) + count de followups pendientes.
- No se duplica el contenido en el Diario; el calendario mensual sigue mostrando el punto de actividad únicamente.
