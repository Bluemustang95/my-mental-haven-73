## Cambios

### 1) Índice de Recursos (`src/components/recursos/BentoGrid.tsx`)
Dejar exactamente estos 7 tiles visibles por default, en este orden:

1. **Test e inventarios** → `/herramientas/inventarios`
2. **Pensamientos** (renombrar "Mente & Emoción") → `/herramientas/mente-emocion`
3. **Personalidad** → `/herramientas/personalidad`
4. **Hábitos** → `/diario-inteligente/gestion-pensamientos/habitos`
5. **Sueño** → `/herramientas/sueno`
6. **Diario** → `/diario`
7. **Psicoeducación** → `/herramientas/psicoeducacion`

- Reagregar tiles Diario (icon `BookOpen`) y Psicoeducación (icon `GraduationCap`) al array.
- Actualizar `DEFAULT_ON` con esos 7 slugs.
- Plan de Seguridad, Mindfulness, Pack, Noticias, quedan como off-by-default (solo se muestran si el admin los publica).

### 2) Home: 3 herramientas en una sola fila
`src/components/home/WidgetsBoard.tsx`
- `MAX_TOOLS = 3` (antes 4).
- Ajustar mensaje del toast al tope.

`src/pages/Dashboard.tsx`
- `.slice(0, 4)` → `.slice(0, 3)`.
- Grid: `grid-cols-2` → `grid-cols-3`, `max-w-[300px]` → `max-w-[340px]`, `gap-3` (queda).
- Placeholder "elegí hasta 4" → "hasta 3".
- Verificar visualmente que el picker respeta el cap de 3 al intentar activar un 4°.

### Notas
- No se toca lógica clínica (wellbeing score, notificaciones) — sólo visibilidad y presentación.
- Los widgets ya elegidos por usuarios que tengan 4 se recortan a 3 automáticamente al renderizar (slice), sin borrarse del storage.

### Pregunta abierta
Plan de Seguridad no está en tu lista de 7 — lo dejo oculto por default en Recursos (accesible solo si el admin lo re-publica). Si querés que quede como 8° tile fijo, decime.
