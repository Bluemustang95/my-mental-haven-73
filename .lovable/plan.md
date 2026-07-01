
## 1. "Tu camino de hoy" — línea punteada conectando viñetas

Archivo: `src/pages/Dashboard.tsx` (`BulletRow`).

- Envolver los widgets `morning`, `recommended`, `night` en un contenedor con un pseudo-`::before` (o `<span>` absoluto) que dibuje una línea vertical `border-left: 1.5px dashed` en la columna de las viñetas.
- La línea debe correr solo entre viñetas (no arriba de la primera ni debajo de la última): agregar props `isFirst` / `isLast` a `BulletRow`, y renderizar el segmento superior/inferior en gris (`border-foreground/20`).
- Efecto visual: cada bullet queda "encadenado" al siguiente, mostrando secuencia mañana → recomendado → noche.

## 2. `CheckinModal` (Valoración mañana / noche) — slider, centrado y footer

Archivo: `src/components/modals/CheckinModal.tsx`.

Problemas actuales:
- El slider no responde bien al drag → el `<input type="range">` está debajo del botón fijo "Siguiente" + BottomNav, que capturan el gesto.
- El botón "Siguiente" queda tapado por la BottomNav (ambos son `fixed bottom-0`).
- El contenido está pegado arriba en lugar de centrado verticalmente.

Cambios:
- Ocultar la BottomNav mientras el modal está abierto: agregar `body.classList.add("hide-bottom-nav")` en `useEffect(open)` y usar CSS global (`body.hide-bottom-nav nav[aria-label], … `) para `display:none`. Alternativa más limpia: pasar `hidden` desde un contexto o simplemente ocultar `nav` mediante un flag en `AppLayout`. Elijo un pequeño store global (`useUiChrome`) con `setBottomNavHidden(true/false)`.
- Contenedor principal: cambiar `min-h-screen … pt-10 pb-32` por `min-h-[100dvh] flex flex-col`. Cabecera arriba, `stepContent` dentro de un `flex-1 flex flex-col justify-center` para que el emoji + slider queden centrados verticalmente.
- Aumentar `padding-bottom` del scroll para que el slider quede libre del footer (`pb-40`), y el botón "Siguiente" queda en `sticky bottom` con `safe-area-inset-bottom` (sin BottomNav de fondo).
- Elevar z-index del slider (`relative z-10`) y asegurar `touch-action: pan-x` para permitir el drag sin scroll vertical.

## 3. BottomNav — glassmorphism translúcido

Archivo: `src/components/layout/BottomNav.tsx`.

- Cambiar `bg-primary/95` → `bg-primary/45` (o `bg-primary/40 supports-[backdrop-filter]:bg-primary/30`) y reforzar `backdrop-blur-2xl`, `border-white/25`, sombra más suave.
- Asegurar contraste de íconos activos (mantener `text-foreground` con `drop-shadow`).
- El fondo detrás se percibirá difuminado sin tapar la UI.

## 4. Tests BAI y PSWQ — abren pero "vuelven" a la lista

Archivo: `src/components/modals/SymptomsTestModal.tsx` + `src/components/tests/TestRunner.tsx`.

Causa: `TestRunner` se monta con `z-[110]` **dentro** de `SymptomsTestModal` (z-100). En algunos navegadores móviles, el stacking context de `motion.div` con `opacity` rompe el z-index, dejando el runner detrás de la grilla (por eso ves "imagen 3" — la selección). BDI funciona porque… en realidad tampoco: es que el usuario probó BAI/PSWQ. Además, la grilla del modal sigue interactiva por debajo.

Fix:
- Mover `TestRunner` fuera del `motion.div` de `SymptomsTestModal` (renderizarlo como sibling con `createPortal(document.body)`), o simplemente devolverlo antes del contenido del modal.
- Alternativa mínima: cuando `running` no es null, ocultar el contenido interior del modal (`hidden` en la grilla) para que no interfiera y el runner ocupe todo.

Elijo la alternativa mínima + `z-[9999]` en `TestRunner` para blindar el stacking.

## 5. Big Five — permitir hacer / repetir el test

Archivo: `src/components/proceso/BigFiveProfileModal.tsx`.

- Agregar un botón CTA "Hacer / Repetir test Big Five" en el header de la tarjeta radar que abra `TestRunner` con `testCode="BIGFIVE"`.
- Al terminar el test, refrescar `values` con los resultados guardados (leyendo `test_results` último BIGFIVE del usuario, subs O/C/E/A/N → % en sliders).
- Cargar los últimos resultados al abrir el modal (si existen), para que el radar refleje los valores reales del usuario en vez de `DEFAULTS`.

## Notas técnicas

- `useUiChrome` puede ser un simple contexto pequeño en `src/hooks/useUiChrome.tsx` con `bottomNavHidden` + setter; `BottomNav` lee el flag y retorna `null` si `true`. `CheckinModal`, `TestRunner`, `BigFiveProfileModal` lo activan mientras están abiertos.
- Sin cambios de esquema en Supabase.
- Sin cambios en `client.ts`, `types.ts` ni `config.toml`.
