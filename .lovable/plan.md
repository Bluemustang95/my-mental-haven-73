
# Rediseño "Mi Proceso" — Dashboard Clínico Premium

Reemplazo total de `src/pages/MiProceso.tsx` por una pantalla mobile-first elástica (max-w-md, flex-col, scroll interno) con fondo claro + 2 orbes animados, glassmorphism, y tokens RESMA (navy `#101927`, teal `#7cc2c8`, gold `#facb60`). Tipografías: Playfair/Lora para títulos, Inter UI, Montserrat para etiquetas en mayúsculas.

## 1. Header
- "Mi Proceso" en serif 26px navy + subtítulo "Tu evolución, paso a paso." Inter italic.
- Etiqueta "ESTADÍSTICAS DE IMPACTO" con icono Activity.

## 2. Tarjeta Navy "Índice de Bienestar" (clickeable → abre sheet)
- Bg `#101927`, rounded-3xl, padding 20.
- Label superior + badge "-16%" (pill rojo translúcido con flecha SVG).
- Score "47" 72px blanco + "de 100" sutil.
- Frase humana: "Bajaste 16% vs semana anterior. Empezá de a poco."
- Sparkline SVG 7 días (`[63,58,55,52,48,47,47]`) con stroke teal 1.6px + nodos circulares.
- Hint inferior "↑ Ver mi análisis".

## 3. Bottom Sheet "Tu semana en resumen"
Componente nuevo `WellbeingAnalysisSheet.tsx`:
- Backdrop fade (rgba 0.45) + sheet con `translateY` y cubic-bezier(.32,1,.28,1) 380ms. Handle pill.
- **Sección A** — Banner "Semana con altibajos" (card f8fafc + ícono navy 44px con cara teal).
- **Sección B** — Sparkline grande 90px con valores flotantes sobre cada nodo + etiquetas Lun-Dom.
- **Sección C** — Grid 2×2 pilares (Sueño/Metas/Evaluación/Recursos) con iconos Lucide (Moon, Target, ClipboardHeart, Book), punto de color + nota humana.
- **Sección D** — 3 cards comparativa (Sem. pasada 63 / Esta sem. 47 / Diferencia -16 en rojo).
- **Sección E** — "De dónde viene tu número": 4 filas con barra de progreso (Sueño 60% teal, Metas 100% teal, Evaluación 30% gold, Herramientas 0% gris) + label humano (sin %).
- Lenguaje natural en todo (sin pesos de fórmula).

## 4. Carrusel "Evaluaciones y Psicometría"
- Header con título + "Desliza para ver más".
- `flex overflow-x-auto gap-3` con 3 cards sólidas grandes (~h-56):
  - **BDI-II** teal gradient + SVG abstracto de barras descendentes-resilientes + badge "BDI-II" + dot dorado "Toca actualizar · Hace 9 d".
  - **BAI** índigo gradient + SVG onda sinusoidal caótica→armónica + dot verde "✓ Al día · Hace 2 d".
  - **PSWQ** ámbar gradient + SVG espiral de Fibonacci + dot amarillo "Pendiente · Nunca".
- Click → abre `SymptomsTestModal` (ya existe) precargado con el test correspondiente.

## 5. Perfil de Personalidad (BFI-20)
- Subtítulo "TU PERFIL DE PERSONALIDAD" violeta + descripción "Evaluación trimestral de rasgos cognitivos estables."
- Card violeta gradient (`from-[#7c3aed] to-[#6d28d9]`) con ícono User, título "Rasgos Big Five (BFI-20)", estado "● Estable · Último test: hace 3 meses", flecha → circular.
- Click abre modal full-screen `BigFiveProfileModal.tsx` (nuevo):
  - SVG radar 5 ejes (Apertura/Responsabilidad/Extraversión/Amabilidad/Estabilidad) con cálculo matemático seguro para etiquetas (truncado + offset por cuadrante).
  - Chips de colores por rasgo.
  - 5 sliders táctiles → polígono morphea en tiempo real (interpolación suave con transición SVG).
  - Botón "Cerrar Perfil" navy fijo abajo.

## 6. Flujo BDI-II Jugable
Extender `SymptomsTestModal` (o crear `BeckTestRunner.tsx`) para BDI-II:
- Header: "DEPRESIÓN (BDI-II) · X de 4" + barra de progreso teal.
- 4 preguntas Beck: Tristeza, Pesimismo, Pérdida de Placer, Pensamientos Críticos. Cada opción 0–3 en card pill con número circular.
- Footer: "La honestidad contigo mismo es clave para un diagnóstico eficaz."
- Pantalla final (sin tilde verde):
  - "Evaluación Completa" + "Depresión (BDI-II)".
  - Card "PUNTAJE TOTAL" con número grande.
  - **Termómetro lineal segmentado**: verde 0–13, amarillo 14–19, naranja 20–28, rojo 29–63, con etiquetas Mínimo/Leve/Moderado/Severo y aguja flotante posicionada por puntaje.
  - Badge resultado (color según baremo).
  - Texto baremo.
  - **Si ≥ 29**: Banner gold "💛 SOPORTE MÉDICO RESMA" + 2 botones: "Sincronizar con Lic. Claudio" (navy) e "Iniciar Respiración de Rescate" (ámbar) que navega a `/herramientas/mindfulness/respiracion` con patrón coherencia cardíaca.

## 7. Terapia y Bento 2×2
- Toggle "TERAPIA Y SINCRONIZACIÓN" (mantiene `IOSToggle` y `TherapySyncModal`).
- Card horizontal profesional: avatar CP gradient navy+teal, nombre + chip "MÉDICO" verde menta, M.N., botón circular llamada navy.
- **Bento 2×2** glass:
  1. Soporte RESMA (mail teal) → mailto.
  2. Resumen Psico (file gold) → `/mi-proceso/resumen`.
  3. Notas de Sesión (edit violeta) → `/mi-proceso/terapia`.
  4. Medicación (pill teal + "Próxima toma: Al día") → `/mi-proceso/medicacion`.

## 8. Suscripción
Mantener bloque actual de membresía al final.

## Archivos
**Nuevos**
- `src/components/proceso/WellbeingCardV2.tsx` (tarjeta navy + sparkline)
- `src/components/proceso/WellbeingAnalysisSheet.tsx` (bottom sheet)
- `src/components/proceso/PsychometryCarousel.tsx` (+ SVGs abstractos inline)
- `src/components/proceso/BigFiveCard.tsx`
- `src/components/proceso/BigFiveProfileModal.tsx` (radar + sliders morph)
- `src/components/proceso/BeckTestRunner.tsx` (4 preguntas + resultados + contención)
- `src/components/proceso/WellbeingBadge.tsx` (badge -16% reutilizable)

**Modificados**
- `src/pages/MiProceso.tsx` — reemplazo completo de layout, conserva lógica de auth/terapia/suscripción.
- `src/index.css` — añadir `animate-orb-1/2` si no existen, clase `.no-scrollbar`.

## Notas técnicas
- Sheet animado con framer-motion (`AnimatePresence`).
- Radar morph: `<motion.polygon points={...}>` con transición spring.
- Sparkline reusable: helper `buildSparkline(values, w, h)` que devuelve `d` y nodos.
- Sin tocar tablas/Supabase; datos demo en constantes salvo lo ya conectado (terapeuta, suscripción).
- Lenguaje UX: nunca mostrar pesos ni decimales al usuario.
