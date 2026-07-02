## Diagnóstico

Sí, puede ser: en la base ya existe un guion de **Argentina / Dormir mejor / 5 min / Versión 1** y tiene audio cacheado. El problema es que el reproductor actual no está leyendo ese guion completo; sigue reproduciendo frases cortas internas del patrón (`Inhalá...`, `Sostené...`, `Exhalá...`) vía TTS en vivo. Por eso escuchás algo que no escribiste y puede sonar robótico/fallback.

## Plan de implementación

1. **Usar guion admin real en el player**
   - Al iniciar una práctica, buscar el guion activo por:
     - ejercicio: `478` para “Dormir mejor”
     - duración: 5/10/15/20
     - país del usuario/admin: Argentina si el perfil lo indica
   - Prioridad: país del usuario → `default` como fallback.
   - Si hay varias versiones activas, elegir una aleatoria para variedad.

2. **Reproducir audio pregenerado antes que TTS en vivo**
   - Si existe audio cacheado para ese guion + voz argentina elegida, reproducir ese MP3.
   - Si no existe, mostrar aviso claro: “Audio pendiente de generar para Argentina”, y recién ahí usar guía por fases como fallback opcional.
   - Evitar que el navegador use `speechSynthesis`, que es lo que suele sonar robótico.

3. **Corregir selección de voz por país y género**
   - Respetar `patient_app_profiles.country = Argentina` y `voice_gender_preference`.
   - Si el usuario está como admin en Argentina, debe resolver voz de `voice_settings` para Argentina.
   - En admin, permitir generar audio por país y por género, no solo femenino.

4. **Agregar selector Femenino / Masculino en Mindfulness**
   - En la pantalla de ajustes antes de iniciar: selector “Voz femenina / Voz masculina”.
   - En los ajustes dentro de la práctica: mismo selector junto a volumen y sonido ambiente.
   - Guardar preferencia para próximas prácticas y sincronizarla con el perfil del usuario.

5. **Ajustar estado visual y mensajes**
   - Mostrar qué voz se está usando: “Argentina · femenina/masculina”.
   - Mostrar si el audio está “pregenerado” o si falta generarlo.
   - Mantener el timer chico arriba como pediste antes.

## Resultado esperado

Cuando entres a **Dormir mejor → 5 minutos** con perfil/admin Argentina, debe sonar exactamente el guion cargado en Admin para Argentina, con la voz argentina configurada, y el usuario podrá elegir voz femenina o masculina desde ajustes.