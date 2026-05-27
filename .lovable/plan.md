# Reestructuración integral de Recursos

Voy a transformar la pestaña de Recursos en un ecosistema clínico-interactivo unificado en tipografía/voseo, pero con identidad sensorial única por módulo. Cada recurso va a seguir el mismo loop de datos: **Registro inicial → Intervención → Feedback post → Progreso histórico**, persistido en `localStorage` con clave `resma:<recurso>:logs`.

---

## 1. Reglas globales (aplican a TODA la app)

- **Tipografía unificada**: títulos con `font-mindful`, cuerpo con `font-sans`, tamaños y espaciados clonados de `Mindfulness.tsx`.
- **Voseo argentino** en todos los textos UI ("Sumergí", "Frená", "Anotá", "Observá", "Registrá").
- **Sin intros estáticas**: eliminar pantallas `view === "intro"` de Mindfulness, Grounding, Sleep, Recovery, EmotionalRegulation, Rumination, CrisisPlan. Entrada directa al flujo.
- **Resmita**: solo en Dashboard/Home. Removerla de pantallas internas de recursos.
- **Helper común** `src/lib/resourceLogs.ts`: `saveLog(resource, payload)`, `getLogs(resource)`, `getLastLog(resource)` sobre `localStorage`.
- **Componente común** `<ResourceOutro>` reutilizable: muestra comparativa (ej. ansiedad antes vs después), mini-gráfico de últimas 7 sesiones y CTA "Volver".

## 2. Rediseño de la pestaña de Recursos (`Tools.tsx`)

Grid asimétrico con tarjetas de tamaños variados, `rounded-[3rem]`, **glowing shadows** del color del módulo (`shadow-[0_20px_60px_-15px_hsl(var(--resource-X)/0.45)]`). Cada tarjeta: ícono grande, nombre, micro-tagline y fondo del color sensorial del recurso.

Recursos visibles: Mindfulness, Grounding, Plan de Seguridad, Higiene del Sueño, Pensamiento/Rumiación, Recuperación, Regulación Emocional. (Se elimina cualquier residuo de "Respiración" como recurso independiente.)

## 3. Rediseño por recurso

### Mindfulness — Rosa Blush (#FDF2F8), ícono Spa
- Mandala respiratorio (animación expand/contract 4s/6s) ya existente, refinado.
- Nuevas pestañas: **Observar** (foco atencional en un punto/onda animada con timer 1/3/5 min) y **Describir** (textarea + chips "sin juicio").
- Loop: estado mental 1-10 antes → práctica → estado 1-10 después → outro comparativo.

### Grounding — Arena/Terracota (#FAF7F2), ícono Mountain
- Reemplaza el flujo actual de 5 inputs.
- **Termómetro de ansiedad 0-100** al entrar (slider).
- Juego 5-4-3-2-1 con botones por sentido (Ver/Tocar/Oír/Oler/Gustar): tap incrementa contador hasta llegar al objetivo del paso. Texturas (gradient noise) y bordes pesados.
- Outro: termómetro post + delta.

### Plan de Seguridad — Bordó (#FFF5F5), ícono Shield (NUEVA pantalla `/herramientas/plan-seguridad`)
- Checklist de señales de alerta.
- Botones grandes de discado rápido (`tel:` para 911, línea de prevención de suicidio AR 135, contactos personales editables).
- Bloque "modificación ambiental" con tips accionables.
- Botón **Descargar reporte .txt** (`Blob` → download).

### Higiene del Sueño — Azul Noche (#090D16), ícono Moon, **dark real**
- Checklist nocturno → indicador circular SVG "Probabilidad de sueño profundo" 0-100%.
- **Sintetizador Web Audio API nativo** (`src/lib/sleepAudio.ts`): noise generator + biquad lowpass para "Olas" con LFO sobre gain (vaivén ~0.1Hz), y "Lluvia" con noise+highpass. Control de volumen y play/stop. Sin assets externos.
- Bitácora de pesadillas: "Sueño original" → "Reescritura positiva" (TCC), guardada en `dream_log`.

### Pensamiento/Rumiación — Amarillo Ámbar (#FFFDF0), ícono Spiral
- Slider de "intensidad del bucle".
- Cuadro TCC: Situación / Emoción / Pensamiento automático / Respuesta alternativa.
- Filtro chips de **distorsiones cognitivas** (Lectura de mente, Catastrofismo, Todo o nada, Personalización, Filtro mental, Adivinación, Etiquetado).
- Animación ACT "nube": el pensamiento se escribe, se antepone "Estoy teniendo el pensamiento de…", y al tocar "Soltar" la nube flota hacia arriba con fade-out (`framer-motion`).
- Botón "Descargar cuadro" (.txt).

### Recuperación — Violeta (#FAF8FF), ícono Wine
- Contador de racha con 🔥 (días sin consumir).
- **Tarro de ahorro**: SVG de frasco de vidrio gigante con etiqueta "Para mi meta". Día exitoso → animación de monedas doradas cayendo (`framer-motion`) + incremento de monto.
- Recaída → drawer con chips de disparadores (Estrés, Presión Social, Soledad, Aburrimiento, Tristeza) + frase compasiva fija.
- Botón rojo suave **"Tengo ganas de consumir"** → modal de contención con 3 CTAs:
  - "Frenar con STOP" → `/herramientas/regulacion-emocional?tool=stop`
  - "Shock con Hielo (TIPP)" → `/herramientas/regulacion-emocional?tool=tipp&step=temperatura`
  - "Escribir en la Nube" → `/herramientas/rumiacion?tool=defusion`

### Regulación Emocional — Celeste (#F0F9FF), ícono Wave
- Slider "temperatura emocional" 1-10.
- Tab **STOP**: semáforo vertical (4 luces), tap secuencial revela instrucción animada de cada paso.
- Tab **TIPP**:
  - **T** (Temperatura): ilustración de cubos de hielo + cronómetro real 30s con animación ripple.
  - **I** (Intense exercise): timer 60s + guía rápida (jumping jacks).
  - **P-P** (Paced breathing + Paired relaxation): círculo celeste que expande 5s / contrae 7s, sincronizado con instrucciones de tensar/soltar grupos musculares.
- Lee `?tool=` y `?step=` para deep-links del Recovery.

## 4. Persistencia y outro

`src/lib/resourceLogs.ts` con shape:
```ts
type ResourceLog = { ts: number; resource: string; pre?: number; post?: number; meta?: Record<string, unknown> };
```
Al cerrar cada recurso: `<ResourceOutro pre={...} post={...} history={getLogs(...)} />` con mini-barras SVG de las últimas 7 sesiones y un mensaje "Bajaste X puntos hoy. Volvé cuando lo necesites."

## 5. Detalles técnicos

- **Archivos nuevos**: `src/lib/resourceLogs.ts`, `src/lib/sleepAudio.ts`, `src/components/resources/ResourceOutro.tsx`, `src/pages/SafetyPlan.tsx`.
- **Archivos reescritos**: `src/pages/Tools.tsx`, `src/pages/Mindfulness.tsx`, `src/pages/Grounding.tsx`, `src/pages/Sleep.tsx`, `src/pages/Rumination.tsx`, `src/pages/Recovery.tsx`, `src/pages/EmotionalRegulation.tsx`.
- **Tokens nuevos** en `index.css`/`tailwind.config.ts`: `--resource-mindful`, `--resource-grounding`, `--resource-safety`, `--resource-sleep`, `--resource-rumination`, `--resource-recovery`, `--resource-regulation` (HSL) + clases `bg-resource-X-bg`, `text-resource-X-accent`, shadow utilities.
- **Routing** (`App.tsx`): agregar `/herramientas/plan-seguridad`. Mantener resto.
- **Sin cambios de DB**: todo lo nuevo va a `localStorage`. Se mantiene `sleep_log` y `dream_log` existentes para Sleep.

## 6. Fuera de alcance

- No toco Dashboard, Diario, Proceso, panel admin, BottomNav.
- No agrego tablas Supabase nuevas.
- No cambio el sistema de auth ni Resmita chat.

¿Aprobás para empezar?
