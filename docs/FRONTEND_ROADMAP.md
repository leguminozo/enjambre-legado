# Frontend Roadmap — La Experiencia de Lujo

Este documento detalla los elementos visuales y funcionales que faltan para alcanzar la visión de producto premium de **Enjambre Legado**.

## 1. Experiencia del Cliente (D2C)
### [ ] Perfil de Usuario "Guardián"
- **Descripción**: Una página donde el cliente pueda ver su historial de pedidos, su "impacto ambiental" (cuántos árboles ha plantado) y su nivel de fidelización.
- **Estética**: Tablero minimalista con visualización de datos (gráficos de impacto).

### [ ] Checkout Cinematográfico
- **Descripción**: El proceso de pago actual es funcional pero estándar. Falta una transición suave hacia el pago y una página de éxito que se sienta como una "recompensa".
- **Mejora**: Animaciones de carga con micro-videos del bosque mientras se procesa el pago.

### [ ] Multi-idioma (i18n)
- **Descripción**: La tienda solo habla español. Para un producto de exportación selectiva (Dubai, Asia), es imperativo el soporte para Inglés.
- **Acción**: Implementar `next-intl` y traducir el core de la landing.

---

## 2. El Cerebro del Admin (Control Maestro)
### [ ] Visual Theme Configurator (Lite)
- **Descripción**: Un panel dentro del admin donde se puedan subir las fotos del Hero, cambiar el mensaje de la landing y actualizar las fechas de los Talleres sin tocar código.
- **Acción**: Vincular `page.tsx` a un hook de `useCMSContent`.

### [ ] Dashboard de Logística en Tiempo Real
- **Descripción**: Integrar el mapa de `packages/maps` para visualizar dónde están los pedidos en tránsito y dónde están las colmenas con mayor producción.

---

## 3. Pulido Editorial y Wow Factor
### [ ] Transiciones de Página (Page Transitions)
- **Descripción**: Actualmente, al cambiar de página (ej: de Inicio a Catálogo), hay un salto brusco. 
- **Mejora**: Usar GSAP o Framer Motion para un fundido a negro o una transición tipo "cortina" que mantenga la inmersión.

### [ ] Hover Effects Avanzados en Catálogo
- **Descripción**: Las tarjetas de productos deben reaccionar más orgánicamente.
- **Mejora**: Efecto de distorsión sutil en las imágenes al pasar el cursor (usando WebGL/Shaders o GSAP).

### [ ] Modo "Inmersión Bosque"
- **Descripción**: Un toggle en el header que active un diseño aún más minimalista con sonidos ambientales sutiles de Chiloé mientras se navega.

---

## 4. Performance y PWA
### [ ] Optimización de Imágenes Crítica
- **Descripción**: Muchas imágenes de placeholder deben ser reemplazadas por WebP de última generación.
- **Acción**: Implementar un pipeline de procesamiento automático de imágenes.

### [ ] Soporte Offline Real
- **Descripción**: Asegurar que la tienda pueda navegarse (aunque no comprar) sin conexión, cacheando el catálogo de forma inteligente.
