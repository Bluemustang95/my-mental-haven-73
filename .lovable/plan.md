## Módulo "Resumen para Psico" — Reporte Clínico Selectivo

Refactor completo de `src/pages/ResumenPsico.tsx` en un wizard de 3 pantallas con selección granular, edición del texto y envío simulado (Fase 1).

### Pantalla 1 — Selección granular (6 categorías)

Accordions colapsables con `Checkbox` maestro por categoría + `Checkbox` por ítem individual. Datos de los últimos 7 días.

1. **Estado de ánimo (check-ins)** — `daily_checkins` últimos 7 días, agrupados por día con mood/energía/ansiedad.
2. **Notas para sesión** — `therapy_prep_notes` + `session_notes` (checkbox por nota).
3. **Inventarios y Tests** — `test_results` (BDI-II, BAI, PSWQ, BFI-20), con score + severidad.
4. **Uso de Recursos** — métricas cuantitativas agregadas: `exercise_sessions`, `habit_completions`, `dbt_emotion_sessions`, `thought_records`, `medication_logs` (adherencia %).
5. **Objetivos semanales** — `weekly_goals` de la semana en curso (cumplidos / pendientes).
6. **Fragmentos del Diario** — `journal_entries` con `highlighted = true`, texto literal, sin resúmenes por IA.

Header con `<Shield />` + microcopy "Solo se envía lo que marques." Botón inferior fijo Teal: "Generar resumen" (deshabilitado hasta que haya ≥1 selección).

### Pantalla 2 — Loading

Pantalla intermedia 2s con `animate-bounce` + copy "Preparando tu resumen…". `setTimeout(1500-2000ms)` → Pantalla 3.

### Pantalla 3 — Editor + envío

- `<textarea>` `font-mono` con el reporte generado por `buildReport(selection, data)`, totalmente editable.
- Card azul claro con `<Shield />` + texto: "Al enviar, el documento se cifra de extremo a extremo."
- Botón secundario outline: "Descargar copia (PDF)" — usa `window.print()` con estilos print o `html2canvas` si ya está en deps (fallback: descarga `.txt`).
- Botón fijo Teal `<Send />` "Enviar al profesional" → simula 1500ms → estado éxito verde "¡Enviado con éxito!" (deshabilitado).

### Arquitectura de archivos

- `src/pages/ResumenPsico.tsx` — refactor completo (state machine 3 pantallas).
- `src/components/resumen/CategoryAccordion.tsx` — card + accordion + checkboxes anidados.
- `src/components/resumen/LoadingScreen.tsx` — pantalla intermedia.
- `src/components/resumen/ReportEditor.tsx` — textarea + banner cifrado + botones.
- `src/components/resumen/reportBuilder.ts` — pura: `(selection, data) → string` con secciones y separadores.
- `src/hooks/useResumenData.ts` — fetches paralelos a Supabase para los últimos 7 días.

### Detalles técnicos

```text
Selection state:
{
  [categoryId]: {
    enabled: boolean,
    items: { [itemId]: boolean }
  }
}
```

- Sin cambios de schema, sin dependencias nuevas.
- Reutiliza `localDateStr()` para el corte de 7 días (UTC-3).
- `framer-motion` para transiciones entre pantallas y accordion.
- Persistencia de envío: Fase 1 solo simulado (no se inserta en DB). Fase 2 futura crearía tabla `therapist_reports`.

### Fuera de alcance
- Envío real por email/WhatsApp al terapeuta.
- Firma digital o encriptación real (solo mensaje UX).
- Historial de reportes enviados.
