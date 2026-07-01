# Plan: Fixes + Refactor Medicación & Notas para Terapia

## 1. BottomNav — Íconos legibles
`src/components/layout/BottomNav.tsx`: subir contraste sobre el fondo glass translúcido.
- Íconos/labels inactivos: `text-white/85` (hoy quedan casi invisibles).
- Ítem activo: pastilla sólida `bg-white text-primary` para destacar.
- Añadir `drop-shadow-sm` a los íconos para separarlos del fondo cuando hay contenido claro detrás.
- Mantener el `bg-primary/40 backdrop-blur-2xl` que ya definimos (no volver atrás al glassmorphism).

## 2. BAI / PSWQ abren un selector en vez del test
`src/components/modals/SymptomsTestModal.tsx`: el click sobre BAI/PSWQ está abriendo otra vez la grilla de selección en lugar de disparar `TestRunner`.
- Revisar handler `onSelect(testCode)`: forzar `setRunning(testCode)` y `setPickerOpen(false)` para todos los inventarios (no solo BDI).
- Asegurar que `TestRunner` reciba `code` válido y que al cerrarse limpie `running` sin re-abrir el picker.
- Verificar `test_definitions` (ya confirmado: BAI/PSWQ existen con ítems).

## 3. Big Five — estética coherente
`src/components/tests/TestRunner.tsx` + `BigFiveHexagon.tsx`: hoy usa fondo oscuro y violeta (`#a78bfa`) que rompe la línea visual RESMA.
- Reemplazar violeta por `resma-teal` (#7cc2c8) en polígono, líneas y accents.
- Fondo del runner: crema/blanco `bg-background` con tipografía navy, igual que BDI/BAI.
- Textos de ejes en `text-muted-foreground` en lugar de blanco translúcido.
- Botones de opciones con el mismo estilo pill usado en los otros tests.

## 4. Refactor Módulo Medicación (`src/pages/MedicationTracker.tsx` + subpaths)

### 4a. Split de flujos `flowMode: 'add' | 'info'`
- FAB `+` (abajo-derecha) → `flowMode='add'`: Categorías → Fármacos → **Ajustes de Toma** (salta la ficha).
- Nuevo botón `?` (arriba-derecha del header) → `flowMode='info'`: Categorías → Fármacos → **Ficha Informativa** (¿Qué es?, ¿Para qué se usa?). Sin CTA "Configurar toma" al final; solo back.
- Estado propagado por URL param o context ligero entre pantallas del wizard.

### 4b. Input de dosis inteligente
En `MedDrugDetail.tsx` / pantalla Ajustes de Toma:
- Actualizar `DRUG_DATABASE` (mock en `src/lib/` o donde viva) agregando `standardDoses: string[]` por fármaco (ej. Sertralina: `["25mg","50mg","100mg","150mg","200mg"]`).
- Reemplazar input libre por `<select>` con esas dosis + última opción `"Otro (Ingreso manual)"`.
- Si elige "Otro", renderizar debajo `<input type="text">` con `animate-in fade-in slide-in-from-top-1`.

### 4c. Automatización del momento del día
- Eliminar chips "Mañana/Tarde/Noche/Madrugada".
- Dejar solo `<input type="time">` grande.
- Helper `computePeriod(time)`:
  - 05:00–11:59 → Mañana
  - 12:00–18:59 → Tarde
  - 19:00–23:59 → Noche
  - 00:00–04:59 → Madrugada
- Mostrar badge readonly junto al título "Hora de la toma": `text-resma-teal bg-[#7cc2c8]/10 rounded-full px-2 py-0.5 text-[10px] uppercase`.

Se conservan: glassmorphism del card "Progreso de hoy", anillo circular, animaciones de check.

## 5. Refactor "Notas para Terapia" (`src/components/journal/TherapyNotes.tsx`)

### 5a. Lienzo expansible
- Estado inactivo: botón ancho `border-dashed bg-white` con `+ Escribir nueva nota...`.
- Al tocar → expandir con `animate-in fade-in zoom-in-95` a card con `<textarea min-h-[120px]>` sin bordes internos, `text-sm leading-relaxed`.
- Footer del card: `Cancelar` (texto gris) + `Guardar Nota` (sólido `bg-[#101927] text-white`).

### 5b. Separación Pendientes vs Historial Compartido
Añadir campo `shared_at` (nullable) a `therapy_prep_notes` vía migración; también reutilizar `resolved` no — creamos `shared_at` para semántica "compartido con terapeuta".
- **Pendientes**: tarjetas blancas `border-amber-200/60`, texto `#101927`, botón `Trash2` sutil arriba-derecha.
- **Historial Compartido**: `opacity-75 bg-slate-50`, sin basurero, footer con `Check` verde + `LEÍDO POR TERAPEUTA` (uppercase, tracking).

### 5c. Botón flotante de sincronización
- Contenedor `absolute bottom-0 w-full` con gradiente `from-transparent to-[#f9f9fb]`.
- Botón teal `#7cc2c8` `Compartir con terapeuta (X)` con X = pendientes.
- Al pulsar: estado disabled `Enviando... ⏳` por 1.5s, luego update `shared_at = now()` en todas las pendientes → migran a la sección compartida y el botón se oculta.
- Trust badge debajo: `Lock` + `Cifrado de extremo a extremo` (texto muted xs).

### 5d. Layout
- `max-w-md mx-auto min-h-screen bg-[#f9f9fb]`.
- Lista con `overflow-y-auto no-scrollbar pb-32` para no tapar el CTA flotante.

## Detalles técnicos

- **Migración DB**: `ALTER TABLE therapy_prep_notes ADD COLUMN shared_at timestamptz;` (una sola call, con GRANTs ya existentes).
- **Medicación**: si `DRUG_DATABASE` está hardcoded en `MedLibrary.tsx`/`MedCategoryList.tsx`, extraerlo a `src/lib/drugDatabase.ts` con el nuevo `standardDoses`.
- **flowMode**: pasar como query param `?mode=add|info` en las rutas `/medication/*` para preservarlo al navegar back/forward.
- No se toca la lógica del anillo de progreso ni animaciones de check existentes.

## Fuera de alcance
- No se cambia el modelo de datos de `medications` salvo lo estrictamente necesario para el badge (ya tiene `time_of_day`; se calcula en cliente).
- No se implementa envío real E2E cifrado — el badge es solo UX; el `shared_at` marca el estado.
