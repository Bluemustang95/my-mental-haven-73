# Ajustes: Sueño, Home, Sintonía, Notificaciones y Perfil

## 1. Psicohigiene del Sueño (`src/components/sleep/SleepHygiene.tsx`, `src/pages/Sleep.tsx`)
- Convertir cada pauta en una fila tipo píldora totalmente redondeada, con el selector circular bien visible, para que la selección se lea como círculos.
- Aumentar el padding inferior de la pantalla de sueño (`pb-28` → `pb-40`) para que el botón "Guardar verificación" y la última pauta no queden tapados por la barra inferior. Mismo ajuste en Diario de Sueño y Protocolo de Pesadillas.

## 2. El calendario de la home no marca "Sueño"
Causa verificada: en `src/hooks/useTodayCompletion.ts` la clave `sleep_zone` sólo consulta la tabla vieja `sleep_log`. El Santuario nuevo guarda en `dream_log` (diario) y `sleep_hygiene_audits` (psicohigiene).
- Ampliar `sleep_zone` para que se marque si hay registro de hoy en `sleep_log` **o** `dream_log` **o** `sleep_hygiene_audits`.
- Sumar `sleep_hygiene_audits` a `src/lib/calendarActivity.ts` para que el detalle del día muestre "Psicohigiene del sueño".

## 3. Sintonía de la mañana (`src/pages/ritual/SintoniaManana.tsx`)
- Paso 1: agrandar el porcentaje de sueño (número grande con el color del estado) en vez del texto chico actual.
- Paso 2 "¿Qué te habita hoy?": eliminar por completo el bloque "Tu nebulosa emocional".
- Paso 3: ampliar el catálogo de valores (hoy son 10) sumando los que faltan y alineándolos con los de "Mis valores" (Relaciones, Crecimiento, Ocio, Familia, Espiritualidad, Amabilidad, Orden, Coraje, Descanso, Honestidad, Contribución), manteniendo la grilla de burbujas y el tope de 4.
- Cambiar el rótulo "Intenciones de hoy (opcional)" por "¿Qué vas a hacer para cumplir estos valores?" con placeholders orientados a acciones concretas.

## 4. Notificaciones de la home (`src/components/home/NotificationStack.tsx`)
Cómo funcionan hoy: no son push; se calculan en el cliente según tus preferencias y lo que falta completar en el día. Problemas y arreglos:
- **"Sesión mañana" sin sesión real**: se usa `next_session_at` del perfil junto con `roll_next_session_forward`, que adelanta la fecha automáticamente semana a semana; por eso aparece aunque no tengas sesión agendada. Mostrar la tarjeta sólo con sesión confirmada y ajustar el texto al día real (hoy / mañana / fecha).
- **Hábito ya cumplido pero la notificación queda**: el estado de completitud no se refresca al volver a la home. Refrescar al recuperar foco/visibilidad y ocultar la tarjeta apenas hay una completación de hoy.
- **"Anotá en el diario"**: hoy sólo mira `journal_entries`. Contar también los check-ins de Sintonía/Balance del día para no pedir algo ya hecho.

## 5. Perfil y cuenta (`src/pages/Settings.tsx`)
- "Información personal" lleva a `/perfil`, la pantalla vieja: apuntarla a la vista de datos personales vigente (nombre, email, país, vinculación) y sacar el duplicado de la navegación.
- Quitar la fila "Voz de mindfulness" de Preferencias.
- **Eliminar cuenta**: hoy sólo muestra un aviso para contactar a soporte, no borra nada. Crear una función de backend `delete-account` que valide al usuario autenticado, borre sus datos y elimine su cuenta, con confirmación escrita y cierre de sesión al terminar.

## Notas técnicas
- La función de borrado corre en el backend con rol de servicio y sólo permite borrar la propia cuenta (nunca un id arbitrario del cliente).
- Los cambios de sueño no modifican el cálculo del Índice de Bienestar; sólo la visualización del calendario y el checklist diario.
