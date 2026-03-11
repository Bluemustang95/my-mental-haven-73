

## RESMA Patient App — Fase 1 MVP

### Visión
Aplicación mobile-first de acompañamiento terapéutico digital. Un "patio interior" tranquilo para la autogestión de salud mental, conectado a la red RESMA.

### Dirección de Diseño (Estudio Nido)
- **Tipografía:** Montserrat (headlines/UI, pesos livianos) + Lora (cuerpo/journal, serif de lectura)
- **Colores sólidos, sin gradientes:** Fondo `#F4F4F0` (Bone White), estructura `#101927` (Deep Indigo), contenedores `#E8F4F8` (Faded Sky), acento `#FACB60` (Muted Gold solo para interacciones)
- **Sin emojis, sin streaks, sin gamificación.** Mood con formas abstractas. Calendario con dots sutiles en lugar de contadores.
- **Layout:** Scroll vertical con secciones de ancho completo separadas por líneas, no carousels horizontales.
- **Dark mode** desde el inicio

---

### 1. Autenticación
- Login/registro con email + contraseña
- Login con Google (OAuth)
- Pantalla de reset de contraseña
- Perfiles de usuario en tabla separada (`patient_app_profiles`)

### 2. Onboarding (4 pasos)
- **Bienvenida:** Logo + mensaje "Tu espacio seguro para cuidar tu salud mental" → CTA "Comenzar"
- **Paso 1 — Etapa de vida:** Cards ilustradas (5 opciones de rango etario), selección única
- **Paso 2 — Áreas de interés:** Chips seleccionables múltiples (ansiedad, ánimo, hábitos, relaciones, etc.)
- **Paso 3 — Sentimientos recientes:** Selección múltiple con íconos abstractos (formas de línea, no emojis) — ola calma, línea enredada, etc.
- **Paso 4 — Estado de tratamiento:** 3 opciones que bifurcan: vincularse, solicitar, o ir directo al dashboard
- Las respuestas se guardan en perfil y determinan contenido sugerido

### 3. Dashboard (Tab Inicio)
- Saludo personalizado según hora del día
- **Sección Check-in:** Escala de ánimo con 5 formas abstractas (no emojis), nota opcional
- **Sección "Foco de hoy":** Una sola herramienta sugerida según perfil
- **Sección "Entradas recientes":** Últimos check-ins en vista calendario con dots de color (sin streaks ni contadores)
- Botón "Solicitar tratamiento" si no está vinculado
- Separadores horizontales entre secciones (estilo arquitectónico)

### 4. Mood Tracker + Check-in Diario
- Registro: estado de ánimo (1-5 con formas abstractas), nota de texto
- Vista calendario mensual con dots de colores por día registrado (sin juicio)
- Gráfico simple de tendencia semanal (Recharts)

### 5. Ejercicio de Respiración Guiada
- Animación circular de inhalar/sostener/exhalar
- Presets: 4-7-8, box breathing, coherencia cardíaca
- Registro de sesión completada (mood antes/después)

### 6. Chat Resmita (IA)
- Chatbot con personalidad empática y cálida, tono argentino
- System prompt diseñado: acompañamiento, psicoeducación, sugerencia de herramientas
- Disclaimer visible: "No reemplaza terapia profesional"
- Streaming de respuestas token por token (Lovable AI con Gemini)
- Botón de crisis siempre visible → líneas de emergencia (135, 137)

### 7. Formulario "Solicitar Tratamiento"
- Campos: nombre, apellido, edad, teléfono, email, motivo de consulta, modalidad preferida, obra social, zona
- Guarda en tabla `patients_intake`
- Confirmación visual al enviar

### 8. Perfil (Tab Mi Perfil)
- Datos personales editables
- Toggle dark mode
- Configuración de frecuencia de check-ins
- Botón solicitar tratamiento
- Cerrar sesión

### 9. Botón de Crisis (Global)
- Ícono fijo accesible desde cualquier pantalla
- Al presionar: lista de líneas de emergencia (135, 137) con click-to-call
- CTA "Solicitar tratamiento urgente"

### 10. Momento Firma: Ritual de Cierre
- Al guardar un check-in, animación sutil: el contenido se pliega en un sobre que flota hacia el calendario de entradas — transforma el input en un recuerdo privado preservado

---

### Navegación (Bottom Tabs — MVP)
1. 🏠 Inicio (Dashboard + Check-in)
2. 🫁 Respiración (Ejercicio guiado)
3. 💬 Resmita (Chat IA)
4. 👤 Mi Perfil

*(Tests y Herramientas expandidas llegarán en Fase 2)*

---

### Backend (Lovable Cloud + Supabase)
- **Auth:** Email/contraseña + Google OAuth
- **Tablas:** `patient_app_profiles`, `daily_checkins`, `exercise_sessions`, `patients_intake`, `user_roles`
- **Edge Function:** Chat de Resmita (Lovable AI Gateway)
- **RLS:** Cada usuario solo ve sus propios datos

### Paquetes adicionales
- `phosphor-react` (iconografía)
- `react-markdown` (render de respuestas del chat)
- Google Fonts: Montserrat + Lora

