
## Cambios en `src/components/psico/RichContent.tsx`

1. **Botón "Más" centrado**
   - Envolver el botón en `<div className="mt-5 flex justify-center">`.
   - Mantiene el estilo pill actual con texto "Más" + ícono `ChevronDown`.
   - Todo lo que viene después del token `[[more]]` ya está oculto hasta el click (comportamiento actual); solo se ajusta la posición del botón.

2. **Lottie una única reproducción**
   - Cambiar `<Lottie animationData={data} loop autoplay />` por `<Lottie animationData={data} loop={false} autoplay />`.
   - Se aplica a todas las animaciones insertadas (teórico y bloques de práctica).

Sin cambios de datos, tokens, ni admin.
