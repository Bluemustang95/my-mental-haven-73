# Refinamientos previos a Fase 2

Antes de pasar a Fase 2 (Inventarios) resolvemos 3 bloques que quedaron colgando de Fase 1.

---

## 1. Navegación: "volver" siempre lleva a un lugar válido

**Personalidad (Big Five) → volver da 404**
- `PersonalidadHome.tsx` cierra el modal con `navigate(-1)` implícito en algún flujo interno del `BigFiveProfileModal`. Forzamos que cualquier cierre (X, backdrop, ESC, botón "volver a inventarios") vaya siempre a `/mi-proceso/inventarios` con `replace: true`.
- Revisamos `BigFiveProfileModal` para que el botón de retroceso interno también llame a `onClose()` en lugar de `history.back()`.

**Regulación emocional no abre la pantalla correcta**
- En `MenteEmocion.tsx` el link "Regulá tus emociones" apunta a `/herramientas/regulacion-emocional` (pantalla vieja `EmotionalRegulation`). Lo cambiamos a `/herramientas/regulacion-dbt` que es la pantalla activa (`RegulacionDbt`).
- Verificamos que el botón "volver" de `RegulacionDbt` vuelva a `/herramientas/mente-emocion` (o a `/herramientas`) y no a `-1`.

**Auditoría rápida de "volver"**
- Recorrida por las pantallas hijas de los hubs (Pensamientos, Mindfulness sub-módulos, Regulación DBT, Personalidad, Inventarios) para asegurar que cada `ArrowLeft` navega a una ruta absoluta razonable en vez de `navigate(-1)`, que rompe cuando se entra por deep link.

---

## 2. Resmita: contexto real por pantalla + eliminar drawer azul en Mindfulness

**Contexto sensible al paso, no solo a la ruta**
- Hoy `resmitaContextMap.ts` solo mira la URL, entonces en Pensamientos Automáticos siempre "cree" que estamos en el paso del pensamiento.
- Agregamos un contexto dinámico: el wizard de `PensamientosAutomaticos.tsx` publica el paso actual (evento / pensamiento / emoción / distorsión / evidencia / reencuadre / plan) vía `useResmitaContext` (o un `setResmitaStep` en un store liviano). Resmita usa ese paso para elegir el prompt/ayuda correcta ("Evento o situación" ≠ "Pensamiento automático").
- Mismo patrón se deja preparado para reutilizar en otros wizards (Mindfulness, DBT) sin implementarlo aún.

**Ícono azul en `/mindfulness` y `/mindfulness/respiracion`**
- Localizamos el `<AiCompanionDrawer>` o botón flotante celeste que sigue montado en `MindfulnessHub.tsx`, `BreathingHome.tsx` y `src/pages/Mindfulness.tsx` (o en `mindfulness/*View.tsx`) y lo removemos.
- Confirmamos que `HIDDEN_PREFIXES` de `resmitaContextMap.ts` **no** oculta el FAB amarillo global en esas rutas, para que Resmita amarilla quede como único ayudante visible (como pide la captura).

---

## 3. Inspírame + Modo Zen del Diario

**Tipografía de Inspírame**
- El banner del prompt usa `font-mindful` (serif especial) mientras el resto de la app usa `font-display` / `font-sans`. Unificamos el banner y el botón "Inspirame" a la misma familia que el resto del Diario (`font-display` para el texto del prompt, `font-sans` para el botón).

**Modo Zen: barra inferior blanca y mal posicionada**
- La toolbar inferior del editor (cámara, imagen, adjunto, mic, emoji, tag, mute) hoy queda con fondo claro sobre el fondo negro del Zen. La rehacemos con `surfaceCls` (translúcido oscuro con `backdrop-blur`) cuando `zen === true`.
- La bajamos usando `safe-area-inset-bottom` + `pb-[env(safe-area-inset-bottom)]` y le sumamos un margen extra en Zen para que no quede pegada al notch/home indicator.
- Volvemos a chequear que `useHideBottomNav(zen)` esté realmente ocultando el `BottomNav` global (si no, forzamos el hide con un `data-zen` en `<body>` que el `BottomNav` ya respeta o agregamos la regla).

---

## Detalles técnicos (archivos afectados)

- `src/pages/PersonalidadHome.tsx`, `src/components/proceso/BigFiveProfileModal.tsx`
- `src/pages/MenteEmocion.tsx`
- `src/pages/RegulacionDbt.tsx`, `src/pages/EmotionalRegulation.tsx` (solo revisar back)
- `src/lib/resmitaContextMap.ts`, `src/hooks/useResmitaContext.ts`, `src/pages/pensamientos/PensamientosAutomaticos.tsx`
- `src/pages/Mindfulness.tsx`, `src/pages/mindfulness/MindfulnessHub.tsx`, `src/pages/mindfulness/BreathingHome.tsx` (quitar drawer azul si queda)
- `src/pages/Diario.tsx` (tipografía Inspírame + toolbar Zen)
- `src/components/layout/BottomNav.tsx` (verificar hide en Zen)

Sin cambios de base de datos ni de edge functions.

---

Después de esto pasamos a **Fase 2 · Inventarios** (tiempo recomendado entre tests con sugerencia blanda, Resmita visible en la evaluación, ir directo sin prólogo, etc.).