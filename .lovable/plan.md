## Objetivo

Unificar toda la gestión de scripts de mindfulness bajo **/admin/recursos → Mindfulness**, eliminar la sección "Sonidos de respiración" (los sonidos ya viven en Configuración + librería sintetizada) y mantener en Body Scan los marcadores de timeline por zona.

## Cambios

### 1. Base de datos
Agregar columna `markers jsonb` a `mindfulness_scripts` para guardar los marcadores `[{ second, zone }]` del Body Scan junto al script de cada duración.

### 2. `/admin/recursos` reescrito
Pantalla única con sub-tabs por **módulo** (no por sub-ejercicio), todos persistiendo en `mindfulness_scripts` (Supabase):

- **Respiración (Orbe)** — 4 intenciones × 4 duraciones (16 scripts)
- **Body Scan** — 3 duraciones (5/15/30 min) con script + **marcadores de timeline por zona** + 9 bloques por zona (texto que la voz lee al iluminar esa parte)
- **Observar** — Hojas pasar y 5-4-3-2-1 (5 sentidos × 3 duraciones)
- **Describir** — Hechos vs Juicios, Escáner Neutral, Anatomía de la Emoción

Cada tab muestra a la izquierda el árbol filtrado de `MINDFULNESS_TREE` para ese módulo, y a la derecha el editor con:
- Textarea grande para el script
- Botón "Probar voz" (ElevenLabs Nadia)
- Botón "Guardar" (upsert a Supabase)
- **Solo en hojas Body Scan por duración**: panel adicional para agregar/borrar marcadores (segundo + zona del cuerpo), guardados en `markers`.

### 3. Sincronización in-session
`BodyScanView` pasa a leer los marcadores desde Supabase en vez de localStorage, para que lo que se edita en admin aparezca en la práctica real.

### 4. Limpieza
- Borrar `BreathingSoundsManager.tsx` (la sección "Sonidos de respiración" se va).
- Borrar los managers viejos basados en localStorage: `BodyScanManager.tsx`, `Grounding54321Manager.tsx`, `MiraElPresenteManager.tsx`.
- Eliminar la entrada duplicada **Mindfulness** del nav del admin (`/admin/mindfulness`) y redirigir esa ruta a `/admin/recursos`.

### 5. Detalles técnicos

```text
/admin/recursos
└── Mindfulness (única categoría activa por ahora)
    ├── Respiración        → tree filtrado a category="respiracion"
    ├── Body Scan          → tree filtrado a category="body_scan"
    │     ├── Duraciones   → script + markers[]
    │     └── Bloques zona → solo script por zona
    ├── Observar           → tree filtrado a category="observar"
    └── Describir          → tree filtrado a category="describir"
```

Tabla `mindfulness_scripts` (clave única `category + sub_key + duration_min`) ya existe; solo agregamos `markers jsonb default '[]'::jsonb`.

### 6. Fuera de alcance
- No se tocan los ejercicios en sí ni la lógica de reproducción del Orbe/Observar/Describir.
- La gestión de sonidos ambiente queda solo en `/admin/configuracion` con la librería sintetizada actual.