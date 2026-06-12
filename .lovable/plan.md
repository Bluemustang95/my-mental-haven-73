Tres ajustes al módulo BA, todos en frontend salvo una pequeña ayuda DB para el reset (DELETE cascada ya existente).

## 1. Reset del programa para Admins

**Dónde aparece**: botón discreto en el header de `BAJourney` y en `BAOnboarding`, visible solo si `useAdminRole()` devuelve `isAdmin`. Etiqueta "Reiniciar programa (admin)". También se habilita el botón DEV "Simular 24h" para admins (hoy solo aparece en `import.meta.env.DEV`).

**Qué hace**: abre un `AlertDialog` de confirmación → al aceptar, ejecuta:
```ts
await supabase.from("ba_programs").delete().eq("id", program.id);
```
El `ON DELETE CASCADE` de `ba_day_logs`, `ba_baseline_entries` y `vlq_responses` (ya configurado en la migración previa) borra todo el progreso. Luego refetch del hook y la UI vuelve sola a `BAOnboarding`. No se tocan `day_timeline_entries` (son del Diario y persisten).

## 2. Ver días anteriores (read-only)

**Hoy**: en `BAJourney` los botones de días pasados están deshabilitados a nivel UX (solo el día actual abre `BADayTask`).

**Cambio**: los días con `dayNum < program.current_day` se vuelven clickeables y abren un nuevo componente `BADayLogSheet` (sheet desde abajo, light glass, no editable).

**Contenido del sheet** (lee de `ba_day_logs` por `day`):
- Día N — fecha de cierre (`completed_at`)
- Paso de la escalera (`ladder[N-2]`) con SUDS planificado
- Hora agendada (`scheduled_time`)
- Dificultad anticipada vs. real (dos badges)
- Dominio y Agrado (sliders deshabilitados con valor visible)
- Si hay `barrier_chosen`: chip "Barrera reportada: …"
- Botón "Cerrar"

El Día 1 (planificación) abre un sheet equivalente que muestra: dominios VLQ top elegidos, motivación, 3 metas y la escalera completa, también read-only.

## 3. Scroll del calendario línea base

**Problema actual**: 
- Embedded (dentro del wizard): la tabla solo tiene `overflow-x-auto`, no `overflow-y`, así que con 15 filas se corta o empuja todo el wizard.
- Modal flotante: el contenedor `<div className="mx-auto max-w-3xl p-4">` no es scrollable; el body de la app queda bloqueado y la tabla queda fija.

**Fix**:
- **Embedded**: envolver la tabla en un contenedor con `max-h-[55vh] overflow-auto rounded-2xl border border-[#101927]/10 bg-white` y `position: sticky` correcto en `thead`/primera columna para que se vea la hora al hacer scroll vertical.
- **Modal**: cambiar la raíz a `fixed inset-0 flex flex-col` y darle al área del grid `flex-1 overflow-auto px-4 pb-[env(safe-area-inset-bottom)]`. Mantener `thead`/`tbody td` sticky con `top: 0` y `left: 0` para que los encabezados acompañen el scroll en ambos ejes.

## 4. Archivos tocados

- `src/pages/pack/ba/BAJourney.tsx` — botones clickeables en días pasados, botón admin "Reiniciar", siempre mostrar "Simular 24h" si admin.
- `src/pages/pack/ba/BAOnboarding.tsx` — botón admin "Reiniciar" en header.
- `src/pages/pack/ba/BADayLogSheet.tsx` — nuevo componente (sheet read-only).
- `src/pages/pack/ba/BACalendarModal.tsx` — wrappers con scroll vertical correcto, sticky headers en ambos ejes.
- `src/pages/pack/ba/BAProgram.tsx` — exponer `onReset` que ejecuta el delete y refetch.
- `src/hooks/useBAProgram.ts` — agregar método `reset()` que hace el delete + refetch.

Sin migraciones nuevas (los CASCADE ya están).

## 5. Fuera de scope

- Permitir reset desde el panel admin viendo a otros pacientes (eso vendría con la pestaña "Pacientes" del Pack en una próxima tanda).
- Edición de días pasados (intencionalmente read-only para no romper la línea temporal del tratamiento).