Rediseñaré el panel admin (`/admin/*`) como un **Master Dashboard B2B desktop-first** con un nuevo shell, sidebar acordeón, tokens RESMA+ y reemplazaré los módulos por las vistas que pediste. Psicoeducación y Pack de Actividades **conservan su lógica** y solo se reestilan para encajar en el shell. Añado un módulo nuevo de **Notificaciones Anti-Fatiga** con simulador de push.

---

### 1 · Sistema de diseño (tokens nuevos)

En `tailwind.config.ts` y `src/index.css` agrego:
- Colores: `resmaNavy #101927`, `resmaTeal #7cc2c8`, `resmaGold #facb60`, `resmaPurple #6366f1`, fondo `#f4f7f9`.
- Fuentes: `font-sans = Inter` para tablas/forms, `font-display = Montserrat` con `tracking-wider` para etiquetas.
- Clase utilitaria `.admin-scroll` (scrollbar 6px, thumb `#cbd5e1`, oscurece en hover).
- Animaciones modal `animate-in zoom-in-95 duration-200`.
- Aislamos los tokens admin: aplican solo dentro de `.resma-admin-shell` para no romper la app móvil del paciente.

### 2 · Nuevo Shell (`AdminLayout.tsx` reescrito)

```text
┌──────────── 100vw / 100vh, overflow-hidden ────────────┐
│ Sidebar w-64 navy  │  Header (título + subtítulo)       │
│  · Logo RESMA+     │  Tabs (subrayado dinámico teal)    │
│  · Acordeón 4 secs │ ─────────────────────────────────  │
│  · Footer admin    │  Outlet — flex-1 overflow-y-auto   │
└────────────────────┴────────────────────────────────────┘
```

- **Sidebar**: `bg-resmaNavy text-slate-300`, header 16px logo, secciones colapsables con estado React (`Principal`, `Recursos Clínicos`, `Monitoreo`, `Librería CMS`). Activo: `bg-resmaTeal/10 text-resmaTeal border-l-2 border-resmaTeal`. Footer con avatar admin.
- **Header**: módulo activo + subtítulo, derecho reservado para acciones contextuales (ej. "Guardar configuración global").
- **Tabs**: componente `AdminTabs` controlado por router (querystring `?tab=`) con subrayado animado teal.
- **Toast**: usar el `sonner` existente con variante inferior derecha (`position="bottom-right"`).

### 3 · Mapa de rutas

| Ruta | Componente | Tabs internas |
|------|------------|---------------|
| `/admin` → redirect a `/admin/dashboard` | — | — |
| `/admin/dashboard` | `DashboardGlobal` | Uso App |
| `/admin/pacientes` | `CrmPacientes` (tabla + modal ficha) | Directorio |
| `/admin/pacientes/:userId` | mantiene `PatientDetail` reestilado | — |
| `/admin/pensamientos` | `PensamientosAdmin` | Instrucciones IA · Distorsiones · Emociones |
| `/admin/regulacion` | `RegulacionDbtAdmin` | Matriz de Efectividad |
| `/admin/mindfulness` | `MindfulnessAdmin` | Guiones · Voz IA |
| `/admin/escaner` | `EscanerAdmin` | Nodos · Cromoterapia |
| `/admin/habitos` | `HabitosAdmin` | Plantillas · Categorías · Coach IA |
| `/admin/progreso` | `ProgresoAdmin` | Índice · Baremos · Protocolos |
| `/admin/notificaciones` | `NotificacionesAdmin` | Anti-fatiga |
| `/admin/contenido` | `ContentManager` actual, reestilado | — |
| `/admin/pack` | `PackOverview` actual, reestilado | — |

Rutas legacy útiles (`/admin/solicitudes`, `/admin/cuestionario`, `/admin/configuracion`, `/admin/recursos`, `/admin/estadisticas`) quedan accesibles pero **fuera del sidebar nuevo** para mantenerlas operativas sin saturar el menú.

### 4 · Detalle de los módulos nuevos

**Dashboard Global** — 3 cards (Usuarios Activos · Tasa Check-in · Tiempo en App) + barras horizontales "Uso de Módulos Clínicos" (`bg-slate-100` con relleno teal/gold/purple). Datos: query a `auth.users` / tablas de actividad existentes; si falta métrica, mock determinista marcado como *demo*.

**CRM Pacientes** — Tabla limpia con buscador (Nombre · Plan · Estado · Última actividad · Acción "Ver Ficha"). Modal `max-w-2xl` con 3 sub-tabs: Perfil (Edad/Ocupación/Motivo/BDI-II), Uso App (módulo top + check-ins + barras 7d), Membresía (pausar/revocar, botones destructivos rojos).

**Pensamientos Auto** — Tab 1: Prompt RESMITA (textarea grande) → guarda en tabla `ai_prompts` (key `pensamientos_companion`). Tab 2: grid de cards de distorsiones (emoji + nombre + toggle activo). Tab 3: matriz emoción→somatización editable.

**Regulación DBT** — Tabla "Matriz de Efectividad" (Emoción · Criterio de Ajuste · Acción Opuesta). Botón "Editar" abre modal con dos `Textarea` clínicos.

**Mindfulness & Resp** — 2 columnas: izq árbol de ejercicios (4-7-8, Suspiro, Box, Coherencia con minutos), der textarea XL para guion ElevenLabs + botones "Probar Voz" (llama edge function `elevenlabs-tts` si existe) y "Guardar".

**Escáner Corporal** — 2 columnas igual + Tab "Cromoterapia" con `input type="color"` para Tensión y Relajación.

**Gestión de Hábitos** — Tab "Plantillas Clínicas" (CRUD con icon + color), Tab "Categorías DBT" (chips agregables/eliminables), Tab "Coach IA" (prompt + frecuencia).

**Progreso y Psicometría** — Tab Índice: 4 sliders (Check-in, Tests, Hábitos, Recursos) con barra multicolor en tiempo real; si suma ≠ 100% muestra alerta gold y bloquea guardar. Tab Baremos: tabla con barra segmentada (verde/amarillo/naranja/rojo). Tab Protocolos: lista SOS con toggles fluidos.

### 5 · Notificaciones Anti-Fatiga (`NotificacionesAdmin.tsx`)

Header fijo + botón "Guardar Configuración Global". Layout 2-col:
- **Izquierda (scroll)**: 5 tarjetas blancas `rounded-3xl` para Circadianas, Hábitos, Psicometría, Hibernación, Vínculo Terapéutico. Cada disparador: toggle teal + condición (texto/dropdown) + input copy. Input deshabilitado y `opacity-50` cuando el toggle está off.
- **Derecha (sticky)**: Mockup de iPhone (SVG) que muestra en tiempo real la notificación del input enfocado — escucha `onFocus` y refleja `title + body`.

Persistencia: tabla nueva `notification_rules` (id, category, trigger_key, enabled bool, condition_text, copy_text, updated_at) con RLS solo admin. Migration incluida con GRANT correcto.

Toast: `sonner` "Reglas de notificación guardadas y propagadas a los dispositivos".

### 6 · Componentes globales reutilizables

`src/components/admin/ui/`: `AdminCard`, `AdminTabs`, `AdminTable`, `AdminToggle`, `AdminModal`, `AdminButton` (primary navy, secondary purple, ghost slate), `AdminColorBar`, `PhonePreview`.

### 7 · Trabajo técnico

- Reescribir `AdminLayout.tsx` y `AdminRoute.tsx` (este último sin cambios funcionales).
- Editar `App.tsx` para registrar las nuevas rutas y redirect raíz.
- Migración Supabase: `ai_prompts`, `distortions`, `dbt_matrix`, `mindfulness_scripts`, `body_scan_nodes`, `habit_templates`, `wellbeing_weights`, `risk_protocols`, `notification_rules` (todas con RLS admin-only + GRANTs).
- ContentManager y PackOverview: solo envuelvo su contenido en `AdminCard` y reemplazo paleta/clases, sin tocar lógica.

### 8 · Fuera de alcance

- No toco la app móvil del paciente (rutas no-`/admin`).
- No implemento integración real de envío push (solo configuración + persistencia).
- "Probar Voz" en Mindfulness solo se conecta si ya existe edge function ElevenLabs; si no, queda con toast informativo.

¿Avanzo con esta arquitectura o querés ajustar algo (alcance de migraciones, conservar las rutas legacy en el sidebar, o priorizar solo algunos módulos en una primera entrega)?