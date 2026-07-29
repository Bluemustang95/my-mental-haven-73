## Ajustes a la pantalla splash del onboarding

Archivo: `src/components/onboarding/IntroScreens.tsx` (componente `SplashIntro`).

**1. Header — solo el logo**
- Quitar el texto "RESMA" y el punto verde con animación `ping` de la píldora.
- Dejar únicamente el isotipo RESMA (`ResmaIsotipoMark`), un poco más grande (~28px) para que se lea bien solo, dentro de la misma píldora glass (`bg-white/90 backdrop-blur-md rounded-full border-[#7cc2c8]/40`) con padding ajustado a un contenedor circular.

**2. Logo más arriba**
- Sacar el `justify-center` del contenedor y anclar el header al tope: el bloque de marca queda pegado arriba (`mt-0`) en lugar de centrado verticalmente con el resto.

**3. Botón "Comenzar mi viaje" más abajo**
- Empujar el CTA y el footer legal al fondo de la pantalla con `mt-auto`, dejando el área visual + frase centradas en el espacio restante.
- Mantener el footer legal justo debajo del botón, con un pequeño respiro inferior (`pb-2`) para no chocar con el borde seguro del dispositivo.

No se toca ningún otro contenido: ilustración, tarjetas flotantes, frase central, textos ni links legales quedan igual.
