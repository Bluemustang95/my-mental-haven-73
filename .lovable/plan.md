# Plan: Rediseño Home + Recursos + Proceso + Settings + Admin

Mantengo paleta actual (cream `#FDFCFB`, dark blue `#101927`, Montserrat/Lora) y aplico el **glassmorphism** que ya usamos en Onboarding sólo en los **modales oscuros** (Check-in mañana/noche, Diario Inteligente, Admin). El resto sigue claro y minimal como las capturas adjuntas.

---

## 1. Home `/inicio` (rediseño completo, conserva lógica)

- Header: "Buenas tardes, {nombre} ✨" + subtítulo "Tu plan del día te espera". A la derecha: ícono ⚙️ Settings (nuevo) + avatar inicial (existente).
- Tira semanal L-D con número, día actual en círculo crema, punto verde si hay actividad hoy.
- **Timeline vertical** (línea gris uniendo 4 viñetas con checkbox cuadrado a la izquierda):
  1. **Valoración de la mañana** → abre `CheckinModal mode="morning"`.
  2. **Psicoeducación** → abre `PsychoModal` (contenido dinámico según onboarding goal).
  3. **Tu práctica de hoy** → 3 chips dinámicos (de `get_daily_recommendations` o fallback por goal del onboarding). Al tocar chip → marca viñeta + texto "Completaste: X" + log en `exercise_sessions`.
  4. **Valoración de la noche** → abre `CheckinModal mode="night"`.
- Recompensa: si las 4 listas → checks, línea y número del día en verde + toast "¡Plan completado! 🎉".
- Banner curvo gradiente morado "Te ayudamos con tu sueño" → `/recursos/sueno`.

## 2. Modales

### 2.1 `CheckinModal` (fullscreen, `bg-[#1C1C1E]` + backdrop-blur, glass cards)

**Mañana (5 pasos):**
1. Sueño — gráfico nube + 5 puntos que crecen.
2. Amanecer — botones verticales (Excelente / Muy bien / Normal / Mal / Pésimo).
3. Emociones — grid de tarjetas emoji (multiselect).
4. Diario — 3 textareas: soñaste / pensamiento / objetivo.
5. Estadísticas — gauge naranja "1/7 días" + consejo dinámico.

**Noche (4 pasos):** Día (luna) → Emoción → Balance (2 textareas) → Estadísticas/gratitud.

Datos persisten en `daily_checkins` (extender columnas si falta: `emotions text[]`, `dream_note`, `thought_note`, `goal`, `balance_highlight`, `balance_improve`).

### 2.2 `PsychoModal`

Modal blanco, header gradiente morado con ▶, título/texto desde `psychoeducation_content` filtrado por el goal del onboarding. Botón negro grande: "He leído y aprendido" → marca viñeta 2.

## 3. Recursos `/recursos` (Bento Grid)

Layout asimétrico:
```
[ Mindfulness    ][ Reg.Emocional ]
[  (alta rosa)   ][ Tol. Malestar ]
[                ][ Efect.Personal]
[      Gestión de Pensamientos    ]
[      Pack de Actividades (dark) ]
```
Cada tarjeta navega a `/diario-inteligente/:categorySlug`.

## 4. Diario Inteligente `/diario-inteligente/:slug` (nueva, oscura)

- Fondo `#0F0F12`, calendario semanal mini arriba.
- **Paso 1:** grid de tarjetas grandes con color de fondo + ícono gigante semi-transparente (sub-recursos de la categoría desde `algo_sub_resources`).
- **Paso 2:** al tocar → oculta grid, muestra tarjeta apaisada "Registro guardado con éxito" + log en `exercise_sessions`.
- FAB violeta `+` abajo derecha → vuelve al grid para sumar otra.

## 5. Mi Proceso `/proceso` (rediseño)

1. **Estadísticas de impacto**: barras verticales (divs altura variable) para Calidad de Sueño + 2 mini-cards con barras horizontales (Habilidades vs Síntomas / Actividades vs Síntomas).
2. **Evaluaciones**:
   - Test de Síntomas → fullscreen oscuro con grid de tarjetas altas (Irritabilidad, TOC, Desesperanza, etc.) con emoji gigante abajo. Lee `algo_questions` kind=symptom.
   - Test de Personalidad → idem kind=personality.
3. **Terapia y Seguimiento**: toggle iOS verde. Si ON → 3 botones (Notas / Resumen / Medicación → rutas existentes). Si OFF → recuadro punteado invitando a activarlo.

Toggle se persiste en `patient_app_profiles.in_therapy`.

## 6. Settings `/configuracion` (nuevo)

- Título = nombre del usuario.
- Lista iOS agrupada:
  - **Mi Cuenta**: Información, Estadísticas.
  - **Preferencias**: toggles Tema oscuro, Notificaciones.
  - **Seguridad**: Cerrar sesión (rojo), Eliminar cuenta (rojo oscuro).
- Al final: botón punteado **"Acceso Desarrollador / Admin"** → `/admin` (visible siempre; el guard de admin sigue gobernando acceso real).

Botón ⚙️ del Home abre esta pantalla. Quito el bloque admin actual de `/perfil` (queda solo el botón en Settings).

## 7. Admin Dashboard (estética + tabs)

Header `bg-[#0F172A]` con "v2.4.1" + badge "Modo Admin". Tabs:
- **Usuarios**: KPIs simulados (1,248 registrados, etc.) + lista de chats soporte (estados rojo/amarillo) — datos mock.
- **Psicoeducación**: usa el `ContentManager` existente, refactor visual oscuro con form completo.
- **Actividades (IA)**: lista de `resource_tools` con botón "Editar" (usa `ToolEditor` existente).
- **Tests**: lista categorías del `QuestionnaireManager` con ícono engranaje (ya existe la lógica).

## 8. Backend (única migración)

```sql
ALTER TABLE daily_checkins
  ADD COLUMN IF NOT EXISTS mode text DEFAULT 'morning',
  ADD COLUMN IF NOT EXISTS sleep_score int,
  ADD COLUMN IF NOT EXISTS dawn_score text,
  ADD COLUMN IF NOT EXISTS emotions text[],
  ADD COLUMN IF NOT EXISTS dream_note text,
  ADD COLUMN IF NOT EXISTS thought_note text,
  ADD COLUMN IF NOT EXISTS day_goal text,
  ADD COLUMN IF NOT EXISTS balance_highlight text,
  ADD COLUMN IF NOT EXISTS balance_improve text;

ALTER TABLE patient_app_profiles
  ADD COLUMN IF NOT EXISTS in_therapy boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS prefers_dark boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notifications_on boolean DEFAULT true;
```

(No se crean tablas nuevas, no requiere GRANTs.)

## 9. Archivos a crear / modificar

**Nuevos:** `src/pages/Settings.tsx`, `src/pages/DiarioInteligente.tsx`, `src/components/home/Timeline.tsx`, `src/components/home/WeekStrip.tsx`, `src/components/modals/CheckinModal.tsx`, `src/components/modals/PsychoModal.tsx`, `src/components/modals/SymptomsTestModal.tsx`, `src/components/recursos/BentoGrid.tsx`, `src/components/ui/IOSToggle.tsx`.

**Modificados:** `src/pages/Dashboard.tsx` (reemplaza por nuevo Home), `src/pages/Tools.tsx` (Bento), `src/pages/MiProceso.tsx`, `src/pages/Profile.tsx` (quita admin), `src/components/admin/AdminLayout.tsx` (estética + tabs nuevas), `src/App.tsx` (rutas `/configuracion`, `/diario-inteligente/:slug`).

## 10. Fuera de alcance (confirmar)

- No reescribo Diario clásico ni Journal existente.
- No reemplazo BottomNav (sigue igual).
- Datos de KPIs/chats de soporte en Admin → **mock** (no DB).
