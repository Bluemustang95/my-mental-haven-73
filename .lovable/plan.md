## Cambios solicitados

### 1. Flujo modal de sincronización
- Tras `handleSync` exitoso (encontrado o intake enviado): **cerrar el modal** automáticamente. No mostrar la vista de tracking adentro del modal — el seguimiento vive en la página `Mi Proceso`.
- `TherapyTrackingView` deja de usarse dentro del modal (la dejamos para no romper imports pero se elimina del flujo).
- `handleSynced` recibe los datos y reemplaza la card "Profesional vinculado" por un mini-tracker.

### 2. Mini-tracker inline en Mi Proceso (reemplaza card actual)
Cuando `inTherapy === true` y el estado bridge es `searching` o `assigned`, mostrar **dos esferas compactas horizontales** (no las 4 grandes):

```text
( ● ) ──── ( ○ )           ( ● ) ──── ( ● )
Buscando   Asignado        Buscando   Asignado
profesional                            ✓ Lista
```

- Polling cada 60s vía `useTherapyStatus(linked_phone)` ya implementado.
- Cuando pasa a `assigned`/`coordinating`/`concretized`: el segundo círculo se llena, aparece debajo el **aviso amarillo**: "El profesional [Nombre] se contactará contigo en las próximas 24 hs hábiles" + botón "¿Ya te contactó?" (reusa `ContactConfirmDialog`).
- Cuando el paciente confirma contacto → se muestra la card actual completa con datos del profe + bento grid.

### 3. Encuesta de satisfacción a los 7 días
Disparador: 7 días desde `bridge_assigned_at`. Se muestra como **banner** en Mi Proceso ("Contanos cómo fue tu experiencia →") + se persiste hasta que la responda o la descarte.

**Flujo de encuesta (sheet modal de 4-5 pasos):**

1. **¿Pudiste comenzar tratamiento?** Sí / No
2. **Si Sí:**
   - ¿El profesional se contactó dentro de las 24 hs hábiles? Sí / No
   - ¿Cuántas sesiones tuviste? `0 / 1 / 2-3 / 4+`
   - ¿Cómo te sentís con el profesional asignado? escala 1-5 (vínculo)
   - ¿La modalidad fue la que pediste? Sí / No / Cambió y está bien
   - ¿Recomendarías RESMA? NPS 0-10
3. **Si No:**
   - ¿Por qué? (multi-choice):
     - El profesional no se contactó
     - Tema económico
     - Horarios no compatibles
     - Ya no lo necesito / cambié de opinión
     - Otro (texto)
4. **Calificación final RESMA:** NPS 0-10 + comentario libre
5. **Cierre:** "Si querés volver a contactarte con nosotros, podés hacerlo cuando lo desees." + botón cerrar.

### 4. Base de datos

**Nueva tabla `therapy_satisfaction_surveys`** (visible para admin en CRM):
- `user_id`, `started_treatment` (bool), `contacted_in_24h` (bool, null), `sessions_count` (text), `bond_rating` (1-5), `modality_match` (text), `nps_score` (0-10), `not_started_reasons` (text[]), `other_reason` (text), `final_nps` (0-10), `comment` (text), `triggered_at`, `completed_at`.
- RLS: paciente inserta/lee la suya; admin lee todas (via `has_role`).

**Columnas nuevas en `patient_app_profiles`:**
- `bridge_assigned_at` (timestamptz) — se setea cuando bridge state pasa a `assigned`
- `satisfaction_survey_completed_at` (timestamptz, null)
- `satisfaction_survey_dismissed_at` (timestamptz, null)

### 5. Admin
- Nueva sección en `CrmPacientes` o nueva ruta `/admin/satisfaccion`: listado de respuestas con filtros (NPS promedio, % que inició tratamiento, motivos más comunes). Tabla básica + export CSV reutilizando patrón existente.

## Detalles técnicos

- `MiProceso.tsx`: reemplazar bloque `inTherapy ?` actual. Agregar componente `<TherapyMiniTracker />` que polea estado y renderiza condicional (mini-tracker / card-completa).
- `TherapySyncModal.tsx`: en `handleSync` y `handleIntake`, llamar `onSynced({...})` y `onClose()` directamente — eliminar vistas `tracking` e `intake-success` del modal.
- Nuevo `src/components/proceso/TherapyMiniTracker.tsx` — usa `useTherapyStatus` con `linked_phone` ya guardado.
- Nuevo `src/components/proceso/SatisfactionSurveySheet.tsx` — wizard 4-5 pasos, guarda en `therapy_satisfaction_surveys`.
- Nuevo hook `useSatisfactionSurveyTrigger.ts` — checa si `bridge_assigned_at + 7d <= now()` y no hay survey completada/descartada.
- Detección del cambio `searching→assigned` para setear `bridge_assigned_at`: en el `useEffect` que ya graba `bridge_last_state`, si pasa a `assigned` y `bridge_assigned_at` es null, lo escribe.

## Archivos afectados
- `src/components/modals/TherapySyncModal.tsx` (simplificar)
- `src/pages/MiProceso.tsx` (reemplazar bloque inTherapy)
- `src/components/proceso/TherapyMiniTracker.tsx` (nuevo)
- `src/components/proceso/SatisfactionSurveySheet.tsx` (nuevo)
- `src/hooks/useSatisfactionSurveyTrigger.ts` (nuevo)
- Migración Supabase (tabla + columnas)
- `src/pages/admin/modules/CrmPacientes.tsx` o nueva ruta admin para ver respuestas
