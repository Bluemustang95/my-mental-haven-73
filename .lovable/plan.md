## Cambios en `src/pages/Dashboard.tsx` y `src/components/home/AtomicWidget.tsx`

### 1. Limpieza de cabecera (Dashboard.tsx, líneas ~318-355)

Reemplazar TODO el bloque header + WeekStrip por una fila simple con dos elementos simétricos:

```tsx
<div className="flex items-center justify-between">
  <button
    onClick={() => setMonthOpen(true)}
    aria-label="Abrir calendario"
    className="glass-premium flex h-11 w-11 items-center justify-center rounded-2xl text-resma-navy active:scale-95"
  >
    <CalendarDays size={20} strokeWidth={1.5} />
  </button>
  <button
    onClick={() => navigate("/configuracion")}
    aria-label="Perfil"
    className="flex h-11 w-11 items-center justify-center rounded-full bg-resma-navy font-display text-[13px] font-semibold uppercase text-white shadow-[0_8px_20px_-10px_rgba(16,25,39,0.5)] active:scale-95"
  >
    {name ? name[0].toUpperCase() : "U"}
  </button>
</div>
```

Elimina:
- `<p>` con "BUEN DÍA" + `<h1>` con el nombre.
- El bloque `Week strip` completo (`<div className="mt-4 flex items-center gap-2">` con `<WeekStrip />` + botón calendario mensual). El acceso al calendario queda unificado en el botón superior izquierdo.
- El import de `WeekStrip` si ya no se usa en el archivo.

El botón del calendario mantiene la funcionalidad actual (`setMonthOpen(true)` → abre `MonthCalendarSheet`).

### 2. Reforzar visibilidad de las cajas en `AtomicWidget.tsx`

Las cápsulas glass actuales usan tinte al ~8% (`${color}14`), lo cual queda casi invisible sobre fondos claros. Subir a ~14% para que la caja se lea siempre como contenedor:

- Cambiar `const tint8 = \`${color}14\`` → `const tint = \`${color}26\`` (~15% alpha).
- Aumentar levemente el borde en estado no-completado: `border: "1px solid rgba(255,255,255,0.75)"` + añadir `outline: 1px solid ${color}1a` como halo perimetral suave (via boxShadow `inset 0 0 0 1px ${color}22`).

Esto conserva el estilo glassmorphism entintado pero garantiza que las tres cajas (Sueño índigo, Hábitos esmeralda, Diario ámbar) sean visibles como contenedores discretos con el label fuera abajo (ya está implementado así: `mt-2 text-[11px] font-medium text-slate-600`).

### Fuera de alcance
- El grid `grid-cols-3 gap-4` con `flex flex-col items-center` ya está implementado en `Dashboard.tsx` líneas ~386-405 y en `AtomicWidget.tsx`. No se toca.
- La lógica de `NotificationStack`, `PriorityStack`, y `MonthCalendarSheet` queda idéntica.
