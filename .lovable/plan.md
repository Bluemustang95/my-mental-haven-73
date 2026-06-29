## Rediseño del formulario de admisión (intake) — 3 pasos

Reemplazar el formulario de un solo paso en `TherapySyncModal.tsx` por un wizard de 3 pasos que cumpla el contrato del endpoint `app-bridge-intake`.

### Paso 1 — Datos personales
- Nombre * (`first_name`)
- Apellido * (`last_name`)
- Fecha de nacimiento * — date input, se envía como `YYYY-MM-DD` (string, no Date).
- Género * — pills: Masculino / Femenino / Otro / Prefiero no responder → `"masculino" | "femenino" | "otro" | "no_responde"`.

### Paso 2 — Contacto
- Teléfono * con selector de código país (default +54) — se normaliza a E.164 con `+`.
- Email (opcional).

### Paso 3 — Consulta
- Tipo de tratamiento * — pills: Individual / Pareja / Familiar / Niños → `"individual" | "pareja" | "familiar" | "ninos"`.
- Modalidad * — Online / Presencial.
- Si Presencial → aparecen dos selects dependientes:
  - Provincia (lista fija de 7): Buenos Aires, Chubut, Ciudad Autónoma de Buenos Aires, Ciudad de Buenos Aires, Córdoba, Entre Ríos, Mendoza, Neuquén.
  - Localidad: lista filtrada según provincia (las listas exactas que pasaste en el prompt) — se crea `src/lib/argentinaLocalities.ts` con el mapa `provincia → localidades[]`.
- Motivo de consulta * (`consultation_description`) — textarea, máx 2000 chars con contador.

### Envío
- POST directo al endpoint vía `bridge-proxy` (action `"intake"`), payload con el shape exacto del contrato:
  - `country: "AR"` y `consultation_reason: "Psicológica"` hardcoded.
  - `province`/`locality` solo se incluyen si `modality === "Presencial"`.
  - `email` se omite si está vacío.
- Manejo de respuestas:
  - 201 success nuevo o 200 con `deduplicated: true` → toast de éxito + `onSynced`.
  - 400 (`missing_name`, `invalid_phone`, `country_not_supported`, `invalid_payload`) → mostrar mensaje específico, NO reintentar.
  - 401 → error genérico de conexión.
  - 429 → reintentar con backoff (2s, 5s).
  - 5xx → reintentar 1 vez, si falla avisar.
- Validación client-side: nombre/apellido no vacíos, birth_date en formato válido, teléfono regex E.164 (`^\+\d{8,15}$`), motivo no vacío.

### Cambios técnicos
- `src/components/modals/TherapySyncModal.tsx`: refactor de la vista `"intake"` a wizard 3 pasos con barra de progreso; mantener intacta la vista `"sync"`.
- `src/lib/argentinaLocalities.ts` (nuevo): mapa provincia→localidades + helper `getLocalities(province)`.
- `src/lib/bridgeRetry.ts` (nuevo, opcional): helper de retry con backoff para 429/5xx.

### Fuera de alcance
- El handler del edge function (`app-bridge-intake`) lo actualizás vos.
