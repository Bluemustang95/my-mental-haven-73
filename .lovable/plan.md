## Primero: ¿participan estas variables en el Índice de Bienestar?

Sí, y ya están conectadas hoy (verificado en `src/lib/wellbeing/normalize.ts` y `compute.ts`). Entran dentro del pilar **Sueño (35% del Bienestar / SENTIR)**, que se compone internamente de:

- **S0 — calidad de sueño**: `daily_checkins.sleep_score` + `sleep_log.score`.
- **S1 — psicohigiene + sueños**: `sleep_hygiene_audits.score` ×0.5 + puntaje de pesadillas (`dream_log.themes/emotions` con palabras "pesadilla/terror/angustia") ×0.3 + cobertura de registro de sueños ×0.2, renormalizado si falta alguno.
- **S2 — despertar**: `dawn_score` de la Sintonía.

Consecuencia práctica del rediseño: el checklist de Psicohigiene sigue guardando en `sleep_hygiene_audits.score` (ahora % de 6 hábitos, 0-100), así que **sigue alimentando el índice sin tocar el algoritmo**. El Diario de Sueño y el Protocolo de Pesadillas también siguen alimentando S1 vía `dream_log`. Nada de esto entra en "Cuidado (HACER)". No propongo cambiar pesos en esta tarea.

---

## 1. Limpieza del dashboard (lo tachado con X)

En `src/pages/Sleep.tsx`:
- Eliminar el título grande "Santuario del Sueño" y el subtítulo "Tu espacio seguro para descansar."
- Eliminar la tarjeta "Tracker de descanso" (fila L-M-X-J-V-S-D) del dashboard.
- Dejar solo: botón volver + ícono de calendario (acceso al tracker) + las 3 tarjetas.

## 2. Tracker → Calendario nocturno

Nueva vista/sheet `SleepCalendarSheet` (dentro del módulo sueño, estilo Obsidian, no reusar el sheet claro de Home):
- Grilla mensual con navegación mes anterior/siguiente.
- Cada día se pinta según registro nocturno: punto índigo si hay sueño anotado, punto amatista/rojo si hay pesadilla (detectada por `themes`/`emotions`), tenue si no hay nada.
- Al tocar un día se abre el detalle inferior con: sueños anotados ese día (`dream_log.description`, emociones, temas, lucidez), marca de pesadilla, y el % de psicohigiene de esa fecha (`sleep_hygiene_audits`).
- Datos: query a `dream_log` (por `dream_date`) y `sleep_hygiene_audits` del mes visible.

## 3. Estética Deep Night Obsidian

- Fondo `#070b14` (base) con degradado hacia `#030712`.
- Auras radiales difuminadas: índigo, amatista y azul abisal, blur alto, opacidad baja.
- Tarjetas: `bg-slate-950/65 backdrop-blur-[30px] border border-white/12`, radios grandes.
- Tarjetas del menú principal: **sin subtítulos**, solo ícono en cápsula tintada + título serif ("Diario de Sueño", "Psicohigiene del Sueño", "Protocolo de Pesadillas"), apiladas verticalmente como en la captura de referencia.
- Íconos lucide (sin emojis): pluma/cuaderno (índigo), check (esmeralda), escudo (amatista).

## 4. Diario de Sueño

Mantener la funcionalidad actual, ajustando estética Obsidian:
- Textarea de descarga/registro.
- Chips disparadores: "¿Por qué soñé esto?", "¿Qué pasó hoy?", etc.
- Panel de contexto nocturno: emociones y conductas previas.
- Guarda en `dream_log`.

## 5. Psicohigiene del Sueño (renombra "Laboratorio")

Reescribir la vista `Lab`:
- Cabecera con **gráfico circular SVG animado** (stroke-dasharray/offset con transición) mostrando 0-100% de cumplimiento en vivo.
- Lista vertical de 6 hábitos en paneles de vidrio fino, texto analítico sin emojis, círculo de selección a la derecha:
  1. Mantener el cuarto fresco, ventilado y oscuro.
  2. Desconexión total de pantallas digitales 1 hora antes.
  3. Evitar cafeína y estimulantes después de las 16:00 hs.
  4. Cenar ligero al menos dos horas antes de acostarse.
  5. Establecer un horario constante para despertarse.
  6. Reservar el uso de la cama exclusivamente para dormir.
- **Eliminar por completo el bloque de SOS Nocturno** de esta vista.
- Guardar `score = round(marcados/6*100)` en `sleep_hygiene_audits` (upsert por `audit_date`), preservando el aporte al índice.

## 6. Protocolo de Pesadillas

Se mantiene el flujo IRT/DBT por pasos, solo re-skin a la estética Obsidian y encabezado consistente.

## Notas técnicas

- Todo el trabajo es de presentación + queries de lectura; no se modifica el motor `src/lib/wellbeing/*` ni se crean migraciones (las tablas `dream_log`, `sleep_hygiene_audits`, `sleep_log` ya existen con las columnas necesarias).
- Archivo principal: `src/pages/Sleep.tsx` (791 líneas) — se divide en componentes bajo `src/components/sleep/` (`SleepCalendarSheet.tsx`, `SleepHygiene.tsx`, `DreamDiary.tsx`, `NightmareProtocol.tsx`, `SleepGlass.tsx`) para mantenerlo manejable.
- Riesgo bajo: si un usuario tenía auditorías previas con escala 1-5, `normalizeAuditScore` ya soporta ambas escalas.
