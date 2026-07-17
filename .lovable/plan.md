
## Objetivo

Tres bloques en una tanda:

1. **Admin — Toggle "Visible" por actividad** de Recursos, con efecto en Recursos, Home, Resumen Psico e Índice de Bienestar.
2. **Reordenar el bento 2×2** de Terapia y Sincronización en Mi Proceso.
3. **Tracker de 3 esferas** (Buscando → Asignado → Concretado) + tarjeta expandida del profesional con envío del Resumen Psico por WhatsApp.

Sin migraciones de base de datos. Sin cambios en el proyecto RESMA+ Digital (todo lo que necesitamos ya lo manda el bridge).

---

### 1) Toggle "Visible en la app" por actividad de Recursos

**Estado actual:** ya existe `resource_tools.is_published` (booleano) y `resource_categories.is_published`. En `/pages/admin/ResourceDetail.tsx` hay un botón ojo/ojo-tachado poco visible. En el frontend, `ResourceTools.tsx` ya filtra `is_published = true`.

**Cambios:**

- **`src/pages/admin/ResourceDetail.tsx`**
  - Reemplazar el ícono ojo por un `<Switch>` shadcn con label "Visible en la app" en cada tarjeta de actividad.
  - Agregar badge "Oculto" cuando `!is_published`.
  - Nota informativa arriba: *"Las actividades ocultas no aparecen en Recursos, Home, Resumen Psico ni cuentan en el Índice de Bienestar."*

- **`src/components/recursos/BentoGrid.tsx` (Home)**
  - Hoy los 7 tiles son estáticos. Se agrega un fetch a `resource_categories` (react-query) que trae los `slug` publicados. Se filtran los tiles cuyo `slug` esté en `is_published = false`.
  - Los slugs de tiles hoy: `mindfulness`, `mente-emocion`, `habitos`, `pack`, `inventarios`, `personalidad`, `noticias`. Se matchea por slug.

- **Índice de Bienestar y Resumen Psico**
  - `src/lib/wellbeingScore.ts`, `src/lib/activityAggregator.ts` y `src/hooks/useResumenData.ts` no leen `resource_tools` directamente; suman actividades desde tablas nativas (`exercise_sessions`, `journal_entries`, `habit_completions`, etc.).
  - Se agrega un helper `getHiddenToolSlugs()` que devuelve los `slug` de `resource_tools` con `is_published = false`, y en los agregadores se descartan las filas cuyo `tool_slug`/`exercise_type` pertenezca a un tool oculto. Cache de 5 min con react-query.

**Alcance:** el toggle es **global** (afecta a todos los usuarios).

---

### 2) Reordenar bento 2×2 en `TherapyMiniTracker.tsx`

Cambio solamente el orden de los `MiniBento` inferiores (líneas ~166-167 y ~258-259). Sin cambios visuales ni de rutas.

De:
```
[ Próxima sesión ] [ Medicación   ]
[ Resumen Psico  ] [ Notas Sesión ]
```

A:
```
[ Próxima sesión ] [ Medicación   ]
[ Notas Sesión   ] [ Resumen Psico]
```

---

### 3) Tracker de 3 esferas + estado Concretado

**Contexto verificado del bridge RESMA+ (`app-bridge-status`):**

| Estado en bridge  | Trigger                                                      | Datos que devuelve                                       |
| ----------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| `searching`       | Aún no hay oferta aceptada                                   | `state, found=false`                                     |
| `assigned`        | Profesional aceptó la oferta en RESMA+                       | `state, assigned_at, eta_horas_habiles: 24`              |
| `coordinating`    | Paciente tocó "¿Ya te contactó?" **en la app** → `confirm-contact` → RESMA+ setea `coordination_started_at` | `state, coordination_started_at, first_session_date, professional { name, phone, specialty }` |
| `concretized`     | Profesional/operador marca `concretized='si'` en RESMA+      | `state, concretized_at, first_session_date, professional { name, phone, specialty }` |

**Diseño visual de 3 esferas:**

```
[ Buscando ] ─── [ Asignado ] ─── [ Concretado ]
```

Mapeo estado → esferas:
- `searching` → Esfera 1 activa.
- `assigned` → Esfera 2 activa (mensaje azul 24 hs) + aparece el botón "¿Ya te contactó?" (pasadas 24 hs desde `assigned_at`).
- `coordinating` → Esfera 2 con ✓ verde (contacto confirmado) + tarjeta del pro simplificada con nombre/tel/especialidad + botón "Llamar" y "WhatsApp".
- `concretized` → Esfera 3 activa + **tarjeta expandida** del pro + **CTA "Compartir Resumen Psico por WhatsApp"**.
- `failed` → Esfera roja + mensaje de contactar a RESMA.

Barra de progreso entre esferas: 0% / 50% / 100% según avance.

**Tarjeta expandida del profesional (visible en `coordinating` y `concretized`):**

- Avatar con iniciales + Nombre completo + badge según estado ("Contacto confirmado" / "Concretado").
- Fila **Teléfono**: botones "Llamar" (`tel:`) y "WhatsApp" (`https://wa.me/<phone>`).
- Fila **Especialidad** (si `professional.specialty` existe).
- Fila oculta email/matrícula (Opción A — no viene del bridge; queda como TODO futuro si se agregan del lado RESMA+).

**Bloque "Compartir Resumen Psico" (solo en `concretized`):**

- Genera el link `${origin}/mi-proceso/resumen` (usa `reportBuilder.ts` existente solo si más adelante querés incluir preview — hoy solo link).
- Texto WhatsApp por defecto:
  ```
  Hola {nombre_pro}, te comparto el resumen de mi proceso psicológico para nuestra próxima sesión: {link}
  ```
- CTA único: **"Enviar por WhatsApp"** → `https://wa.me/${phone_sin_+}?text=${encodeURIComponent(mensaje)}`.
- CTA secundario: "Copiar link" (fallback).
- Se registra evento en `resmita_context_events` (`event_type: 'psico_summary_shared'`, `payload: { channel: 'whatsapp' }`) para métricas — opcional, avisame si no lo querés.

---

### Archivos a tocar

```
src/pages/admin/ResourceDetail.tsx                (Switch por tool + aviso)
src/components/recursos/BentoGrid.tsx             (fetch categorías, filtro visible)
src/lib/hiddenTools.ts                            NUEVO (helper de slugs ocultos)
src/lib/wellbeingScore.ts                         (excluir tools ocultos)
src/lib/activityAggregator.ts                     (idem)
src/hooks/useResumenData.ts                       (idem)
src/components/proceso/TherapyMiniTracker.tsx     (3 esferas + reorden + tarjetas)
src/components/proceso/ShareSummaryCard.tsx       NUEVO (CTA WhatsApp + copiar link)
```

Sin migraciones. Sin cambios en RESMA+ Digital.

---

### Fuera de alcance (para próxima iteración)

- Email del profesional en el bridge (queda pendiente pedirlo a RESMA+ Digital cuando lo necesites).
- Compartir por email desde la app.
- Botón "Ya tuve mi primera sesión" auto-declarado (por ahora el pase a `concretized` lo hace exclusivamente RESMA+).
