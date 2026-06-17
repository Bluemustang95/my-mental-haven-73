Plan de implementación

1. Corregir problemas visibles del módulo Construir Bienestar
- Subir el footer fijo de “Continuar/Siguiente” por encima de la bottom bar de la app, con espacio seguro inferior para que nunca quede tapado.
- Revisar los paddings inferiores del contenido y del contador flotante del Paso 1 para que no se superpongan con navegación ni CTA.
- Mejorar el Paso 2 de IA:
  - Si la función devuelve error, mostrar un mensaje claro y dejar sugerencias locales de respaldo para que el usuario pueda avanzar.
  - Si la IA devuelve sugerencias, aplicar automáticamente la primera como “Meta 1” y, si “Meta de enfoque · HOY” está vacía, también cargarla allí.
  - Si el usuario escribe primero en “Meta de enfoque · HOY” y no hay metas cargadas, completar automáticamente la primera meta con ese texto.

2. Actividades relacionadas con valores
- En el Paso 3, ordenar el catálogo para que primero aparezcan actividades recomendadas según los valores elegidos.
- Agregar una etiqueta/sección “Recomendadas para tus valores” antes del catálogo general.
- Mantener favoritas arriba cuando existan, pero sin duplicar tarjetas.
- Permitir crear actividades propias desde el Paso 3:
  - Input “Crear actividad propia”.
  - Se guarda en el draft local.
  - Se puede seleccionar, agendar y marcar como favorita igual que una actividad base.
- Agregar botón de IA para crear ideas de actividades según valores + meta de hoy:
  - Si responde bien, se agregan como actividades propias sugeridas.
  - Si falla, aparecen ideas locales coherentes con los valores seleccionados.

3. Portada Bento interactiva para Construir Bienestar
- Agregar una portada inicial ultra-premium antes del wizard cuando no haya un plan en curso.
- Estructura Bento de 4 tarjetas:
  - Emociones Positivas.
  - Brújula.
  - Planificación.
  - Saborizar.
- Panel inferior dinámico oscuro que cambia icono, label y explicación clínica al tocar cada tarjeta.
- Estado activo para la tarjeta seleccionada y transición breve del texto.
- Header con reset de selección y toast elegante.
- CTA “Comenzar mi construcción” que inicia el Paso 1.
- Si ya hay progreso guardado, mostrar acceso directo “Continuar mi construcción” y entrar al paso guardado, sin obligar a ver la portada.

4. Mis patrones en Regulación Emocional
- Cambiar “Tus patrones” para que deje de ser solo estadísticas agregadas y pase a ser continuidad clínica accionable.
- Para Cambiar respuestas emocionales:
  - Mostrar una tarjeta simple con un único checkbox de completado cuando exista una tarea de “Resolver el problema” o “Acción opuesta”.
  - Un toque en el cuerpo de la tarjeta despliega qué tenía que hacer; un toque en el checkbox marca completado.
  - Evitar múltiples métricas tipo “emoción frecuente / últimos 30 días” como elemento principal.
- Para Construir Bienestar:
  - Mostrar una tarjeta de proceso a largo plazo con valores elegidos y calendario/semana compacta.
  - Al tocarla, abrir el seguimiento del día actual o el calendario semanal del módulo.
  - Los bloques se completan desde el planificador diario/semanal.

5. Inicio / Home
- Asegurar que ambos procesos aparezcan en Inicio:
  - Cambiar respuestas emocionales: si hay una tarea pendiente o sesión abierta, card “Tenés una acción pendiente” con checkbox rápido o acceso a detalle.
  - Construir Bienestar: si hay plan en curso o bloques agendados hoy, card “Tenés N bloques programados para hoy” con acceso a seguimiento del día.
- Hacer que Inicio se actualice correctamente al volver desde Regulación Emocional o Construir Bienestar, leyendo el estado local cada vez que la pantalla gana foco.
- Mantener el tono calmo: sin alarmas ni push, solo cards suaves.

6. Ajustes técnicos
- Mantener persistencia local existente (`bienestar-draft-v1`, favoritos y draft de Cambiar respuestas), ampliándola para actividades propias y tareas accionables.
- Actualizar la función de IA `dbt-ai` para actividades de bienestar, además de metas, con manejo robusto de errores en frontend.
- No crear tablas nuevas salvo que sea estrictamente necesario; esta corrección puede resolverse con el almacenamiento local y las tablas existentes de sesiones.
- Verificar en mobile que footer, bottom bar, portada Bento, Paso 2, Paso 3, Mis patrones e Inicio no se superpongan.