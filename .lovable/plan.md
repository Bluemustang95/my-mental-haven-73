## Objetivo

En Psicoeducación, el subtipo "Texto" se divide en dos:

- **Teórico** (violeta, como hoy) — explicación conceptual.
- **Práctico** (verde esmeralda) — ejercicio que la persona realiza dentro de la app.

Además: marcar el Teórico como leído automáticamente (scroll al final + tiempo mínimo) y crear un motor de ejercicios prácticos con bloques flexibles, porque no todas las prácticas tienen el mismo formato.

---

## 1. Modelo de datos

### Cambios a `psychoeducation_content`

Agregar columnas:

- `text_kind text` — `'theory' | 'practice'`. Solo se usa cuando `content_type = 'text'`. Default `'theory'`.
- `practice_blocks jsonb` — definición de bloques de la práctica. Null para teórico.
- `practice_intro text` — descripción breve de la actividad (opcional).

### Nueva tabla `practice_responses`

Guarda las respuestas del usuario por práctica.

```
id uuid pk
user_id uuid (auth.users)
content_id uuid -> psychoeducation_content.id
data jsonb            -- respuestas por bloque, indexadas por block id
completed boolean default false
created_at, updated_at
```

RLS: cada usuario ve/edita solo lo suyo. GRANTs para `authenticated` y `service_role`.

### Reutilizar `content_progress`

El "leído" del Teórico ya usa `content_progress` (existe). Sumamos un flag implícito: cuando `progress_percent = 100` y `completed = true` lo consideramos leído. El front lo marcará automáticamente.

---

## 2. Tipos de bloque (motor de práctica)

Cada práctica = arreglo ordenado de bloques. Cada bloque tiene `id`, `type`, `config`.

| Tipo | Para qué sirve | Config | Respuesta del usuario |
|---|---|---|---|
| `instructions` | Texto enriquecido con instrucciones | `html` | — |
| `example` | Caja destacada "💡 Ejemplo" | `html` | — |
| `pros_cons` | Tabla 2x2 (Practicar vs No practicar) con escala 0–100 por celda | `labels{rowA,rowB,colPros,colCons}` | `{prosA, consA, prosB, consB}` + 4 escalas |
| `columns` | N columnas libres con título | `columns:[{title}]` | array de textos por columna |
| `suds` | Escala 0–100 con etiqueta | `label, minLabel, maxLabel` | número |
| `free_text` | Textarea con prompt | `prompt, placeholder, minChars` | texto |
| `checklist` | Pasos a marcar | `items:[string]` | array de booleans |

El admin agrega/ordena/elimina bloques desde el ContentManager cuando `content_type=text` y `text_kind=practice`.

---

## 3. Cambios de UI

### 3.1 Admin — `ContentManager.tsx`

- En el modal de Nuevo/Editar, cuando `content_type='text'` aparece un selector **Teórico / Práctico**.
- Si **Teórico**: se muestra el `RichTextEditor` actual (sin cambios).
- Si **Práctico**:
  - Campo `practice_intro` (textarea corta).
  - **PracticeBuilder**: lista de bloques con botones "Agregar bloque" (selector de tipo), reordenar (up/down), borrar, editar config inline.
  - Cada bloque tiene su mini-editor según `type`.
- En la tabla de "Textos", agregar columna **Tipo** con badge violeta "Teórico" o verde "Práctico".

### 3.2 Categoría — `CategoryDetail.tsx`

Cambiar `typeMeta.text` para diferenciar:

```
theory:  { label: "TEÓRICO",  color: "#8B7CF6" }  // violeta (actual)
practice:{ label: "PRÁCTICO", color: "#10B981" }  // verde esmeralda
```

Resolver `meta` por `(content_type, text_kind)`. Para video/podcast se mantiene tal cual.
Listado plano: no se agrupan, conviven en el mismo orden (independientes).

### 3.3 Teórico — `LessonView.tsx`

Auto-marcado de leído cuando se cumplen ambas:

1. Scroll alcanza el final del contenido (umbral 95%).
2. Tiempo mínimo de lectura en pantalla: 20 segundos.

Implementación:

- `IntersectionObserver` sobre un sentinel al final del `body_html`.
- `setTimeout` de 20s desde el mount.
- Cuando ambas banderas son `true` y la lección no estaba completada → `upsert` en `content_progress` y cambiar el botón inferior a "Leído ✓ Volver" (mantiene tap para volver).
- Si ya estaba completada al entrar, mostrar el check desde el inicio.

El botón "Entendido, continuar" sigue existiendo como atajo manual.

### 3.4 Práctico — nueva ruta `/herramientas/contenido/practica/:id`

Nuevo archivo `src/pages/psicoeducacion/PracticeView.tsx`. Renderiza:

- Header verde con título y `practice_intro`.
- Cada bloque con su componente correspondiente (`<InstructionsBlock>`, `<ProsConsBlock>`, etc.).
- Auto-guardado en `practice_responses` con debounce (1s) por cambio.
- Botón inferior verde "Guardar y finalizar" → `completed=true` + redirect.
- Si el usuario ya tiene respuestas → precargar.

En `CategoryDetail.tsx`, el `onClick` de la tarjeta enruta según `text_kind`:
- `theory` → `/herramientas/contenido/leccion/:id` (actual).
- `practice` → `/herramientas/contenido/practica/:id` (nueva).

### 3.5 Paleta verde (Práctico)

Agregar token en `index.css`:

```
--practice-accent: 152 76% 40%;   /* #10B981 */
--practice-soft:   152 76% 95%;
```

Usados en headers de tarjeta, badge, botones del PracticeView.

---

## 4. Detalle del bloque "Pros y Contras" (tu ejemplo)

UI: tabla 2x2 responsive (en mobile: stack vertical de 4 cards).

```
                  Pros            Contras
Practicar         [textarea]      [textarea]
                  SUDS 0–100      SUDS 0–100
No practicar      [textarea]      [textarea]
                  SUDS 0–100      SUDS 0–100
```

Cada celda guarda `{text, suds}`. Footer del bloque muestra el cálculo "Diferencia: practicar +X" como feedback visual suave.

---

## 5. Archivos a tocar / crear

**Crear:**
- `src/pages/psicoeducacion/PracticeView.tsx`
- `src/components/practice/blocks/InstructionsBlock.tsx`
- `src/components/practice/blocks/ExampleBlock.tsx`
- `src/components/practice/blocks/ProsConsBlock.tsx`
- `src/components/practice/blocks/ColumnsBlock.tsx`
- `src/components/practice/blocks/SudsBlock.tsx`
- `src/components/practice/blocks/FreeTextBlock.tsx`
- `src/components/practice/blocks/ChecklistBlock.tsx`
- `src/components/admin/PracticeBuilder.tsx`
- `src/lib/practiceTypes.ts` (tipos compartidos)

**Editar:**
- `src/pages/admin/ContentManager.tsx` — selector teórico/práctico + PracticeBuilder + columna tipo.
- `src/pages/psicoeducacion/CategoryDetail.tsx` — meta por kind + routing condicional.
- `src/pages/psicoeducacion/LessonView.tsx` — auto-marcado por scroll+tiempo.
- `src/App.tsx` — ruta `/herramientas/contenido/practica/:id`.
- `src/index.css` — tokens `--practice-accent`.

**Migración:**
- Add columns a `psychoeducation_content`.
- Create `practice_responses` con RLS + GRANTs.

---

## Fuera de alcance

- No tocar visualización de video/podcast.
- No cambiar el flujo del Teórico actual (solo agrego auto-marcado, mantengo el botón).
- No vinculo Teórico↔Práctico (son independientes como pediste).
- No agrego analítica avanzada de respuestas; solo guardado para que el usuario las recupere.
