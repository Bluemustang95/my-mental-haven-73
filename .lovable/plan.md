## Diagnóstico confirmado

El problema no está en que falte el audio argentino. Está cargado correctamente, pero la app busca con otro formato de país.

Evidencia encontrada:

- El reproductor pidió:
  - `country_code = AR`
  - respuesta: vacío
- Luego cayó a:
  - `country_code = default`
  - respuesta: guion default
- En la base existen:
  - Guion argentino: `exercise_id=478`, `minutes=5`, `country_code=Argentina`
  - Audio argentino: `478/5/Argentina/1/arMlPrYpUo1XH5F2zM6R.mp3`
  - Voz argentina femenina: `country_code=Argentina`, `voice_id=arMlPrYpUo1XH5F2zM6R`
- Pero los perfiles y la “Vista por país” usan código ISO:
  - `AR`

Mapa del fallo:

```text
Vista por país / Perfil
        ↓
      AR
        ↓
useUserVoice busca voice_settings.country_code = AR
        ↓
No encuentra voz argentina porque está como Argentina
        ↓
Fallback a voz default / voz interna
        ↓
BreathingHome busca mindfulness_scripts_v2.country_code = AR
        ↓
No encuentra guion argentino porque está como Argentina
        ↓
Carga guion default
        ↓
Muestra “Audio pendiente para default...”
```

## Plan de corrección exhaustiva

### 1. Unificar países en toda la app
Crear una utilidad central para normalizar países, por ejemplo:

```text
AR → Argentina
Argentina → Argentina
UY → Uruguay
MX → México
ES → España
CL → Chile
CO → Colombia
PE → Perú
US → Estados Unidos
```

Se usará en:

- Perfil del usuario
- Vista por país admin
- Selección de voces
- Guiones de mindfulness
- Audio cacheado
- Función de pregeneración de audio

### 2. Corregir `useUserVoice`
Actualizar el hook para que:

- Si recibe `AR`, busque primero `Argentina`
- Si recibe `Argentina`, lo respete
- Devuelva un `country` ya normalizado para que el player no vuelva a consultar `AR`
- Evite caer a default mientras exista una voz del país

Resultado esperado:

```text
Vista país: AR
useUserVoice country efectivo: Argentina
voice_id: arMlPrYpUo1XH5F2zM6R
```

### 3. Corregir `BreathingHome`
Actualizar la carga de guiones/audio para que:

- Busque por país normalizado
- No caiga a default si existe guion argentino
- Use la voz argentina configurada
- Muestre un estado más explícito, por ejemplo:
  - `Audio pregenerado · Argentina · femenina · v1`
  - `Falta generar audio · Argentina · femenina · v1`
  - nunca `default` si el país activo es Argentina

### 4. Corregir Admin > Mindfulness
Actualizar la pestaña de guiones para que internamente use el mismo país normalizado.

Además, hacer visible el estado por país:

```text
Dormir mejor · 5 min · Argentina · v1
Guion: activo
Voz femenina: configurada
Audio femenino: generado
Archivo: 478/5/Argentina/1/arMlPrYpUo1XH5F2zM6R.mp3
```

### 5. Corregir Admin > General > Voces
Actualizar las voces por país para que no haya doble formato (`AR` vs `Argentina`).

Debe quedar claro que:

- Argentina es la voz usada para usuarios con país `AR`
- Uruguay idem con `UY`
- etc.

### 6. Blindar la función `mindfulness-precache`
Actualizar la función de pregeneración para que:

- Reciba `AR` o `Argentina` indistintamente
- Resuelva siempre el país canónico
- Genere el storage path con el país correcto
- Busque la voz correcta por país y género antes de caer a default

### 7. Migración/limpieza de datos existentes
Hacer una migración segura o una normalización compatible para los datos ya existentes.

Opción recomendada:

- Mantener los registros actuales como `Argentina` porque ya están así
- Hacer que todo el código traduzca `AR → Argentina`
- No romper audios ya cacheados

Opcionalmente, más adelante se puede migrar todo a ISO (`AR`) si preferís, pero no lo haría ahora porque ya tenés audios generados con paths `Argentina`.

### 8. Verificación completa
Validar con tres niveles:

```text
Base de datos:
- Existe voz Argentina/female
- Existe guion 478/5/Argentina
- Existe audio cacheado para ese script + voice_id

Frontend:
- Vista por país Argentina activa
- Player consulta Argentina, no AR
- Badge muestra Argentina, no default

Audio:
- Se reproduce audio pregenerado
- No usa cues internos “Inhalá/Sostené/Exhalá” salvo que realmente falte audio
```

### 9. Mejora de prevención
Agregar logs controlados solo en desarrollo para diagnosticar rápido:

```text
[Mindfulness] country raw: AR
[Mindfulness] country normalized: Argentina
[Mindfulness] voiceId: arMlPrYpUo1XH5F2zM6R
[Mindfulness] script country: Argentina
[Mindfulness] audio: cached
```

Esto permite detectar inmediatamente si vuelve a caer a default.