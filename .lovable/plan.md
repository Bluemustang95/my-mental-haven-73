## 1. Medicación — FAB "+" más abajo
En `src/pages/MedicationTracker.tsx`, mover el botón flotante `+` de `bottom-24` a `bottom-6` (justo sobre el downbar, alineado con el patrón iOS) y aumentar levemente el margen inferior del contenido para que no lo tape.

## 2. Medicación — Alta en una sola pantalla con filtros condicionales
Reemplazar el flujo actual de 3 pantallas (categoría → fármaco → dosis+hora) por una única pantalla `AgregarMedicacion` con 4 desplegables encadenados en cascada:

```
┌─────────────────────────────┐
│ 1. CATEGORÍA        [▼]     │  siempre activo
│ 2. FÁRMACO          [▼]     │  activo si hay categoría
│ 3. DOSIS            [▼]     │  activo si hay fármaco (usa standardDoses + "Otro")
│ 4. HORA + franja    [🕐]    │  activo si hay dosis; muestra chip Mañana/Tarde/etc.
└─────────────────────────────┘
        [ Guardar medicación ]
```

- Nueva página `src/pages/AddMedication.tsx` que reutiliza `drugsByCategory` de `MedCategoryList.tsx`.
- Selectores custom (dropdowns animados) con estados disabled visualmente atenuados, tal como muestra el mockup adjunto.
- La opción "Otro" en dosis abre un input manual inline.
- Chip de franja (Madrugada/Mañana/Tarde/Noche) calculado con la misma función `slotFromTime`.
- Ruta nueva: `/mi-proceso/medicacion/agregar`. El FAB `+` ahora navega directamente ahí (ya no pasa por biblioteca).
- Se conservan `MedCategoryList` y `MedDrugDetail` para el modo "Info" (biblioteca informativa vía botón `?`).
- `DoseSetup.tsx` queda deprecado (se puede borrar su ruta, dejar el archivo por si acaso).

## 3. Medicación — Registro en el calendario
Actualmente `medication_logs` ya se guarda con `log_date = hoy`, pero el calendario mensual (`src/lib/calendarActivity.ts` + `CalendarMonth.tsx`) no la lee. Cambios:

- Agregar en `calendarActivity.ts` la lectura de `medication_logs` (agrupado por `log_date`) para sumar al contador diario de actividad.
- Los días con tomas registradas aparecerán con su número resaltado (mismo tratamiento visual que Diario/Check-in).
- Contar tanto tomas positivas como "no tomadas" si registramos ese estado (por ahora solo se guarda cuando se marca; no se cambia esa lógica salvo que confirmes agregar el flujo "no tomé hoy").

## 4. Notas para terapia — Compartir como emoji
En `src/components/journal/TherapyNotes.tsx`:

- Eliminar la barra flotante inferior con el botón grande "Compartir con terapeuta".
- Reemplazar por un emoji flotante 💌 (sobre con corazón) en la esquina inferior derecha, tipo FAB circular translúcido, con badge del número de notas pendientes.
- Al tocarlo: mismo `shareAll()` actual (envío + toast + cifrado E2E como microcopy discreto debajo).
- Mantener el candado 🔒 "Cifrado extremo a extremo" como tooltip/subtítulo al presionar largo o debajo del emoji.

## Detalles técnicos

- **Rutas** (`App.tsx`): añadir `<Route path="/mi-proceso/medicacion/agregar" element={<AddMedication />} />`.
- **Datos**: `drugsByCategory` se exporta desde `MedCategoryList.tsx` — reutilizar sin duplicar.
- **Calendario**: extender el tipo `DayActivity` para incluir `medication: number` y sumarlo al total; sin migración de DB.
- **TherapyNotes**: usar emoji nativo 💌 dentro de un `button` con `bg-white/80 backdrop-blur` y `shadow-lg`, tamaño ~56px, posición `fixed bottom-24 right-5`.

## Fuera de alcance
- No se toca la lógica de efectos secundarios ni el registro de toma diaria existente.
- No se agrega aún un flujo "marqué como NO tomé" (puedo sumarlo si lo pedís).