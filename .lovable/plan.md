
# Correcciones RESMA — Sprint UX/Bugs

## 1. Notificaciones push en primer plano
**Problema:** No se renderizan ni se pueden "actuar" cuando la PWA está abierta.

- En `src/lib/pushNotifications.ts`: agregar `onMessage(messaging, payload => ...)` que dispare un toast (`sonner`) con título/body y un botón "Abrir" que navegue al `data.url`.
- Inicializar el listener una sola vez desde `src/App.tsx` (o un `NotificationForegroundListener` montado en `AppLayout`).
- Asegurar que el SW `firebase-messaging-sw.js` use `notificationclick` con `clients.openWindow` (ya está). Verificar permiso de notificación pidiéndolo explícitamente desde el toggle de Settings.
- Si el navegador bloqueó permisos, mostrar mensaje claro en Settings (no fallar en silencio).

## 2. Widgets Inicio estilo iOS (drag + resize)
**Problema:** No se pueden arrastrar ni redimensionar; el "Camino de hoy" se ve chico.

- Reemplazar el board de widgets (`src/components/home/WidgetsBoard.tsx`) por un **grid 2 columnas** con **`react-grid-layout`** (`react-grid-layout` + `react-resizable`) en modo edición: cada widget admite tamaños `1x1`, `2x1`, `2x2`. Drag con long-press (250 ms) en mobile, resize handle visible solo en modo edición.
- Persistir layout en tabla existente `home_layouts` (campo JSON con `{i, x, y, w, h}` por widget).
- Aumentar ligeramente el tamaño del bloque "Camino de hoy" (≈ +15% altura, padding interno 16→20, título `text-base`→`text-lg`).
- Mantener vibración háptica al entrar en modo edición.

## 3. Respiración pantalla en blanco
**Problema:** `/herramientas/mindfulness/respiracion` queda en blanco al entrar.

- Revisar `src/pages/mindfulness/BreathingHome.tsx` para crash en montaje (probable: `primeAudio()` o un visualizer sin `data`). Envolver render en `<ErrorBoundary>` y loguear.
- Reproducir con Playwright en `localhost:8080/herramientas/mindfulness/respiracion`, capturar console + screenshot, corregir el error específico.

## 4. Hub Mindfulness simplificado
- En `src/pages/mindfulness/MindfulnessHub.tsx`: **eliminar el hero con imagen** y dejar SOLO las 4 tarjetas (Recomendado + Respiración + Mira el presente + Ver los hechos) con el estilo claro de la captura.
- Mantener el orden y los iconos circulares en gradiente.

## 5. Hub "Mente & Emoción" (nuevo)
**Problema:** Pensamientos y Regulación Emocional son dos boxes separados; Pensamientos está en tema oscuro feo y muestra "0 registros".

- Crear `src/pages/MenteEmocion.tsx` (ruta `/herramientas/mente-emocion`) con el **mismo estilo claro** del hub Mindfulness (4 tarjetas en lista).
- Dentro: dos tarjetas — "Modificá tus pensamientos · Wizard CBT con IA" y "Regulá tus emociones · Ficha DBT".
- **Quitar** la sección "ÚLTIMOS 7 DÍAS — 0 registros" del módulo de Pensamientos.
- Convertir `PensamientosHub.tsx` a tema claro (sin fondo `#0F172A`), heredando tokens del hub Mindfulness.
- En `Recursos` reemplazar los dos boxes (Pensamientos / Regulación) por un único box **"Mente & Emoción"** que abre el nuevo hub.

## 6. Hábitos — tilde no funciona
**Problema:** Click en el botón ✓ no marca completado.

- Revisar `src/components/habitos/HabitCard.tsx` y el handler `toggle` en `useHabits.ts`. Sospecha: el botón está dentro de un elemento con `onClick` padre que abre el sheet → falta `e.stopPropagation()`.
- Confirmar con Playwright (click + verificar fila en `habit_completions`).

## 7. Diario — ancho completo + bento 2x2 + búsqueda
**Problemas:** No usa ancho completo; historial no se ve bien.

- En `src/pages/Diario.tsx`:
  - Editor: remover `max-w-md`/padding lateral excesivo, usar `w-full` real (respetando safe-area).
  - Historial: cambiar lista vertical por **bento grid 2 columnas** (`grid-cols-2 gap-3`), cada card con fecha + preview 3 líneas, altura uniforme.
  - Agregar **ícono lupa** arriba a la derecha (junto al reloj) que expande un input de búsqueda (`Command`-like) que filtra por contenido y fecha en cliente.

## Detalles técnicos
- Dependencias nuevas: `react-grid-layout` + `react-resizable` + tipos.
- Sin cambios de schema salvo posible ampliación de columna `layout` en `home_layouts` para soportar `w,h` (ya es JSON, probablemente alcanza).
- Estilo: respetar tokens cream/dark-blue existentes; no introducir colores nuevos.
- Verificación: Playwright para Respiración (smoke), Hábitos (toggle), Diario (búsqueda), e inspección visual de Inicio en viewport 390×746.

## Fuera de scope (confirmar si los querés ahora)
- Notificaciones nativas iOS sin instalar como PWA (requiere Capacitor).
- Sincronización del layout de widgets entre dispositivos (ya queda en DB pero sin realtime).
