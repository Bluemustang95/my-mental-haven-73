# Plan — implementación

## 1. Notificaciones granulares por usuario

**Backend** ✅ ya aplicado: se agregaron a `notification_preferences` las columnas `morning_enabled`, `night_enabled`, `habits_relapse_enabled`, `tests_due_enabled`, `reengagement_enabled`, `resmita_enabled`, `content_enabled`, `therapist_enabled` (todas `true` por defecto para no cambiar el comportamiento actual).

**Nueva pantalla `src/pages/NotificationPreferences.tsx`** (`/configuracion/notificaciones`):
- Interruptor maestro (`push_enabled`) arriba.
- Sección **Rutinas diarias**: Buenos días, Cierre del día, Check-in, Medicación, Hábitos.
- Sección **Clínicas y bienestar**: Prevención de recaída, Tests vencidos, Te extrañamos, Notas del terapeuta.
- Sección **Comunicación y contenido**: Resmita, Novedades RESMA, Nuevo contenido.
- Persistencia inmediata con `upsert` en `notification_preferences`.

**Ajustes en `src/pages/Settings.tsx`:** reemplazar el toggle único "Notificaciones" por un `RowLink` que navega a la nueva pantalla, manteniendo el pedido de permiso del navegador cuando el maestro se enciende por primera vez.

**Router `src/App.tsx`:** agregar la ruta `/configuracion/notificaciones`.

**Engine `src/lib/notificationEngine.ts`:** antes de devolver un candidato, leer las prefs del usuario y descartar si el toggle correspondiente está en false. Mapa:
- `circadiana.amanecer → morning_enabled`
- `circadiana.anochecer → night_enabled`
- `habitos.recaida → habits_relapse_enabled`
- `psicometria.test_vencido → tests_due_enabled`
- `hibernacion.re_engagement → reengagement_enabled`

**Edge function `send-push`:** reemplazar el filtro `if (kind === "admin")` por un mapa `kind → columna` (`admin → admin_enabled`, `resmita → resmita_enabled`, `content → content_enabled`, `therapist → therapist_enabled`, `checkin → checkin_enabled`, `medication → medication_enabled`, `habits → habits_enabled`, `morning`/`night`/…). Siempre respetar `push_enabled` como maestro.

**Admin › Notificaciones (`ManualPushSection`):** agregar selector de categoría (`kind`) que se envía a `send-push`, para que la campaña respete el toggle correspondiente y no sólo `admin_enabled`. Mantener segmentación (all/país/plan) actual.

## 2. Onboarding — ajustes

**`SplashIntro`**
- Eliminar la tarjeta glass blanca detrás de Resmita: dejar sólo el aura teal + `<img>` de Resmita flotando con `animate-float-weightless` (fondo transparente del PNG).
- Reemplazar las comillas rectas por `\u201c … \u201d` (tipográficas) en la frase para evitar el warning de React y que quede editorial.

**`ValueSlides`**
- Bloque centrado verticalmente: `flex-1 justify-center` en el contenedor.
- Animación más lenta: `staggerChildren` 0.12 → 0.22, `duration` 0.6 → 0.85, `delayChildren` 0.1.

## 3. IA — mapa actual y qué queda pendiente

Edge functions con IA activa:
| Feature | Función | Editable en Admin › IA |
|---|---|---|
| resmita_chat | `resmita-chat` | ✅ |
| pensamientos_companion | `pensamientos-companion` | ✅ |
| dbt_ai | `dbt-ai` | ✅ |
| analyze_thought | `analyze-thought` | ⏳ (pendiente) |
| suggest_evidence | `suggest-evidence` | ⏳ |
| suggest_behavior_plan | `suggest-behavior-plan` | ⏳ |
| describe_neutral | `describe-neutral` | ⏳ |
| mindfulness_tts | `mindfulness-tts` | ⏳ |
| transcribe_voice | `transcribe-voice` | ⏳ |
| onboarding_algo | (cliente) | ⏳ |

**Fuera de alcance ahora** (según tu pedido): cablear esas 7 funciones al helper `_shared/ai-feature-config.ts` para que se editen desde el panel. Queda para un paso siguiente.

**Candidatos futuros que hoy no usan IA:** resumen del proceso, reflexión semanal, correlaciones actividad/bienestar, cierre reflexivo del Diario Inteligente, bienvenida personalizada tras onboarding.

## Fuera de alcance
- Cablear las 7 funciones IA restantes al panel (siguiente paso).
- Sumar nuevas features de IA.
- Rediseñar toda la vista Admin › Notificaciones más allá del selector de categoría.
