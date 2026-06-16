## 1. Home Screen — caber sin scroll (390×741)

Reducir paddings, tipografía y nodos del timeline para que el plan diario completo (header + week strip + 4 nodos + banner sueño) entre en una pantalla mobile sin scroll.

**`src/pages/Dashboard.tsx`**
- `pt-8` → `pt-5`, `pb-28` → `pb-24`.
- Header H1: `text-2xl` → `text-xl`; avatar `h-10 w-10` → `h-9 w-9`.
- WeekStrip wrapper: `mt-6` → `mt-4`.
- Label "Tu progreso de hoy": `mt-8 mb-3` → `mt-4 mb-2`.
- Banner sueño: `mt-6 p-5` → `mt-3 p-3`, ícono `h-12 w-12` → `h-10 w-10`, título `text-base` → `text-sm`.

**`src/components/home/Timeline.tsx`**
- `space-y-4` → `space-y-2`.
- Card `p-4` → `px-3 py-2.5`, `rounded-[28px]` → `rounded-[22px]`.
- Ícono `h-12 w-12 rounded-2xl` → `h-10 w-10 rounded-xl`; tamaño lucide 22 → 18.
- Title `text-[15px]` → `text-[14px]`; subtitle `text-[13px]` → `text-[12px] leading-snug`.
- Nodo check: `h-6 w-6` → `h-5 w-5`, posición `top-5` → `top-3.5`, rail `left-3` → `left-2.5`, padre `pl-9` → `pl-7`, offset check `-left-9` → `-left-7`.
- Chips de práctica: `px-4 py-2 text-xs` → `px-3 py-1.5 text-[11px]`, `gap-2` → `gap-1.5`, `pt-1` → `pt-0.5`.

**`src/components/home/WeekStrip.tsx`** (revisar al editar)
- Reducir altura de celda y tipografía del día (~10–15% más chico) para ahorrar ~16px.

Resultado esperado: ahorro de ~120–140px verticales, lo justo para que en 390×741 entre todo hasta el banner sueño.

## 2. /herramientas — reemplazar emojis por íconos

**Recomendación:** usar **íconos lucide-react monocromáticos dentro de un círculo teal claro**, alineados con el lenguaje visual que ya tiene la Home (mismos círculos `rounded-2xl` con `hsl(var(--primary)/0.2)` o `hsl(var(--accent)/0.2)`). Limpio, propio, no genérico.

Mapeo propuesto (lucide):
- Mindfulness → `Wind` (respiración consciente)
- Regulación Emocional → `HeartPulse`
- Tolerancia al Malestar → `Waves`
- Efectividad Personal → `Users` (vínculos)
- Gestión de Pensamientos → `Brain`

**`src/components/recursos/BentoGrid.tsx`**
- Quitar campo `emoji`, agregar `icon: LucideIcon`.
- Reemplazar fondos crudos (`bg-[#FFE4EC]`, etc.) por **tokens semánticos** unificados: card glass (`bg-card/80 backdrop-blur-3xl border border-foreground/5 shadow-glass`) + círculo de ícono con tinte teal (`bg-primary/15 text-primary`) y dos variantes alternadas con accent (`bg-accent/20 text-foreground`) para no perder ritmo de color.
- Eliminar el ícono gigante decorativo (`-top-3 -right-3 text-6xl opacity-30`).
- Card de Gestión de Pensamientos: misma estética (glass + círculo con `Brain`), reemplazar `bg-[#E0E9FF]` y `text-[#1E3A8A]`.
- Pack de Actividades queda igual (ya usa teal).

Resultado: una grilla coherente con el resto de la app (light glass + teal/gold), sin emojis y sin colores hardcoded.

## Notas técnicas
- Sin cambios de lógica/rutas/datos.
- Sólo CSS Tailwind + tokens semánticos ya definidos.
- Íconos lucide-react ya está en deps; no agregar nada.
