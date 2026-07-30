## Qué encontré (verificado en el código)

**1. "Regulá tus emociones" abre la pantalla equivocada**
En `src/pages/MenteEmocion.tsx` la tarjeta apunta a `/herramientas/regulacion-emocional`, que en `App.tsx` renderiza `EmotionalRegulation.tsx`. Ese componente es en realidad **Tolerancia al Malestar** (menú "¿Qué necesitás ahora?" con Habilidad STOP y Habilidades TIPP), no Regulación Emocional. La verdadera Regulación Emocional DBT (Ficha Linehan, 5 pasos, acción opuesta) vive en `/herramientas/regulacion-dbt` → `RegulacionDbt.tsx`, y hoy no está enlazada desde ningún lado del hub.

**2. "Psicoeducación" del Bento lleva a una ruta inexistente**
`BentoGrid.tsx` apunta a `/herramientas/psicoeducacion`, pero esa ruta no existe en `App.tsx`. La página real está en `/psicoeducacion`. Resultado: cae en NotFound / pantalla vacía.

**3. El resto de los destinos del Bento sí existen** (inventarios, mente-emocion, personalidad, hábitos, sueño, diario, plan-seguridad, mindfulness → redirige a respiración, pack, noticias).

## Plan de corrección

1. **Mente & Emoción** (`src/pages/MenteEmocion.tsx`): dejar tres accesos claros en vez de dos ambiguos:
   - "Modificá tus pensamientos" → sin cambios (CBT).
   - "Regulá tus emociones" → `/herramientas/regulacion-dbt` (Ficha DBT real), descripción "Ficha DBT · acción opuesta y 5 pasos".
   - "Tolerá el malestar" (nueva tarjeta) → `/herramientas/regulacion-emocional` con descripción "STOP y TIPP · frená el impulso", que es lo que esa pantalla efectivamente hace.

2. **Bento de Recursos** (`src/components/recursos/BentoGrid.tsx`): corregir el target de Psicoeducación a `/psicoeducacion`.

3. **Red de seguridad de rutas** (`src/App.tsx`): agregar un redirect `/herramientas/psicoeducacion` → `/psicoeducacion` para que enlaces viejos, notificaciones y sugerencias de Resmita no rompan.

4. **Auditoría cruzada**: revisar los demás orígenes de navegación (widgets de Home, `resmitaContextMap`, `hiddenTools`, `DiarioInteligente`, notificaciones) buscando cualquier target que no matchee una ruta declarada, y corregir los que aparezcan en la misma pasada. Te reporto la lista al terminar.

### Nota técnica
`/herramientas/regulacion-dbt` está envuelto en `PremiumLock`. Si el usuario no es premium verá el bloqueo en lugar de la ficha — puedo dejarlo así o quitar el gate; decime si preferís que quede abierto.
