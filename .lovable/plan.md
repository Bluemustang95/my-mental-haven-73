# Fase 3 · Hábitos, Noticias Resma Research y Notificaciones

Retomamos los 3 bloques que quedaron pendientes del alcance original. Al terminar cada bloque paramos y revisamos, como venís pidiendo.

---

## Bloque A · Hábitos

**Objetivo:** que el módulo de hábitos sea usable sin fricción y que el admin pueda sugerir hábitos por categoría.

1. **Sugerencias de hábitos desde admin**
   - Agregar tabla `habit_suggestions` (id, category_id, title, icon, description, sort, active).
   - En `HabitosAdmin.tsx`: CRUD de sugerencias por categoría.
   - En `NewHabitSheet.tsx`: chips de "Sugeridos" arriba del formulario libre.
2. **Racha y consistencia visibles**
   - En `HabitCard.tsx`: mostrar racha actual con ícono de llama y % de consistencia últimos 7 días.
   - En `StatsDashboard.tsx`: gráfico de barras semanal + "mejor día de la semana".
3. **Recordatorios por hábito**
   - Campo `reminder_time` (ya existe en `habits`) enganchado al motor de notificaciones (bloque C).
   - Nuevo campo `reminder_days` (int[] 0-6) para elegir días de la semana.
4. **Contexto Resmita**
   - Publicar step Resmita en `HabitDetailSheet` con el título del hábito para consejos concretos.

---

## Bloque B · Noticias Resma Research

**Objetivo:** feed curado de investigación en psicología, editable desde admin, sin depender de RSS externo.

1. **Modelo**
   - Tabla `psychology_news` ya existe; verificamos columnas (title, summary, url, source, published_at, image_url, tags[], active, sort).
   - Si falta algo, migración corta para agregar `tags text[]` y `featured boolean`.
2. **Admin**
   - Nuevo módulo `NoticiasAdmin.tsx` con CRUD (título, resumen, link externo, fuente, imagen, tags, destacada).
   - Reordenamiento con drag & drop.
3. **UI usuario**
   - Nueva pantalla `/noticias` (Resma Research) accesible desde Recursos y desde el widget Home.
   - Cards con imagen + fuente + tag; tap abre link externo (`target=_blank`).
   - Filtros por tag y sección "Destacadas" arriba.
4. **Home**
   - Widget "Resma Research" con últimas 3 noticias destacadas.

---

## Bloque C · Notificaciones

**Objetivo:** que las notificaciones lleguen bien, sean editables por el usuario y aprovechables por el admin.

1. **Preferencias del usuario (`NotificationPreferences.tsx`)**
   - Reagrupar en secciones: Diarias · Ritual · Hábitos · Recordatorios clínicos · Push del admin.
   - Toggle maestro + hora preferida por sección.
   - Vista previa: "Así se verá tu próximo recordatorio".
2. **Motor (`notificationEngine.ts` + `cron-push-dispatcher`)**
   - Enganchar `habits.reminder_time` + `reminder_days` al cron.
   - Respetar la zona horaria del usuario (AR / UTC-3) ya usada por `localDateStr()`.
   - Log ampliado en `notification_log`: motivo (habit / ritual / admin / clinical) y `delivery_status`.
3. **Admin (`NotificacionesAdmin.tsx`)**
   - Editor de reglas con visor de "próximos disparos" (dry-run del cron sin enviar).
   - Push manual: filtro por país + segmento (activos 7d, con hábito X, sin check-in hoy).
   - Historial: tabla con status de entrega FCM (delivered / failed / no token).
4. **Runner cliente (`NotificationRunner.tsx`)**
   - Manejar el caso "token expirado" → re-registrar transparente.
   - Foreground listener: mostrar toast + deep-link a la pantalla relevante.

---

## Orden sugerido de ejecución

1. Bloque A (hábitos) — sin dependencia con los otros.
2. Bloque B (noticias) — habilita el contenido para el widget Home y notificaciones opcionales de "nueva noticia".
3. Bloque C (notificaciones) — usa hábitos + noticias como fuentes de recordatorio.

## Detalles técnicos

- Migraciones nuevas: `habit_suggestions`, columnas extra en `habits` (`reminder_days`), `psychology_news` (`tags`, `featured`) si no están, `notification_log` (`reason`, `delivery_status`).
- Todas con `GRANT` + RLS por `auth.uid()`.
- Sin cambios en `client.ts` ni `types.ts` (los regenera el sistema).
- Reuso de `useResmitaStep` para hábitos y noticias.

## Confirmación

¿Arrancamos por **Bloque A (Hábitos)** completo o querés que dentro de A prioricemos algo puntual (ej. solo sugerencias del admin, o solo racha + estadísticas)?
