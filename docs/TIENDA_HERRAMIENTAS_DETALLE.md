# TIENDA — Catálogo Exhaustivo de Herramientas, Vistas y Operatoria

> **Clase: VIVO.** Desglose técnico y funcional de cada herramienta, vista y módulo existente en `@enjambre/tienda`.
> Complemento técnico de [`docs/TIENDA_ARQUITECTURA_INGENIERIA.md`](./TIENDA_ARQUITECTURA_INGENIERIA.md).
> Índice maestro: [`README.md`](./README.md). Mapa del monorepo: [`REPO_MAP.md`](./REPO_MAP.md). Contratos: [`CROSS_APP.md`](./CROSS_APP.md). Dinero: [`MONEY_PATH.md`](./MONEY_PATH.md).

---

## Índice de Herramientas

1. [Portada D2C & Experiencia Cinematográfica (`/`)](#1-portada-d2c--experiencia-cinematográfica)
2. [Catálogo Maestro, Filtros & Variantes (`/catalogo`)](#2-catálogo-maestro-filtros--variantes)
3. [Ficha Técnica de Producto & Perfil Sensorial (`/producto/[slug]`)](#3-ficha-técnica-de-producto--perfil-sensorial)
4. [Pasaporte de Trazabilidad de Lote (`/producto/[slug]/trazabilidad`)](#4-pasaporte-de-trazabilidad-de-lote)
5. [Carrito de Compras con Pricing Server-Side (`/carrito`)](#5-carrito-de-compras-con-pricing-server-side)
6. [Checkout Omnicanal & Conexión con Pasarelas (`/checkout`)](#6-checkout-omnicanal--conexión-con-pasarelas)
7. [Resultado de Pago & Puente 303 (`/checkout/resultado`)](#7-resultado-de-pago--puente-303)
8. [Degustación Sensorial & Instrumento CATA (`/cata/[codigo]`)](#8-degustación-sensorial--instrumento-cata)
9. [Canje de Botellas Físicas & Tarjetas de Regalo (`/claim/[token]`)](#9-canje-de-botellas-físicas--tarjetas-de-regalo)
10. [Escáner QR Integrado (`/qr-scan`)](#10-escáner-qr-integrado)
11. [Club Legado del Bosque (`/club-legado-del-bosque`)](#11-club-legado-del-bosque)
12. [Biblioteca Científica & Claims Validados (`/ciencia`)](#12-biblioteca-científica--claims-validados)
13. [Narrativa Geográfica de Origen (`/origen`)](#13-narrativa-geográfica-de-origen)
14. [Encuentros & Experiencias en el Bosque (`/experiencias`)](#14-encuentros--experiencias-en-el-bosque)
15. [Landings B2B por Segmento (`/alianzas/[segmento]`)](#15-landings-b2b-por-segmento)
16. [Portal Mayorista B2B (`/mayorista`)](#16-portal-mayorista-b2b)
17. [Portal de Embajadores & Creadores (`/embajadores`)](#17-portal-de-embajadores--creadores)
18. [Hub del Cliente: Mi Legado (`/perfil`)](#18-hub-del-cliente-mi-legado)
19. [Línea de Tiempo de Pedidos & DTEs (`/perfil/pedidos`)](#19-línea-de-tiempo-de-pedidos--dtes)
20. [Suscripciones de Reposición Recurrente (`/perfil/reposicion`)](#20-suscripciones-de-reposición-recurrente)
21. [Ciclo Circular del Vidrio Austral (`/perfil/circular`)](#21-ciclo-circular-del-vidrio-austral)
22. [Billetera Digital & Apple/Google Wallet (`/perfil/billetera`)](#22-billetera-digital--applegoogle-wallet)
23. [Ajustes de Privacidad & Derechos ARCO (`/perfil/ajustes`)](#23-ajustes-de-privacidad--derechos-arco)

---

## 1. Portada D2C & Experiencia Cinematográfica

- **Ruta**: `/`
- **Vistas**: `landing-view.tsx`, `editorial-hero.tsx`
- **Componentes clave**: `bee-canvas.tsx`, `hero-hueco-gl.tsx`, `media-carousel.tsx`, `grain-overlay.tsx`
- **Caché**: ISR (`revalidate = 120` o purga bajo demanda vía `/api/cms/revalidate`).

### Mecánica Interna
1. **Composición Modular Guiada por el CMS**:
   - Consulta las secciones cacheadas de `site_content` mediante `getSiteContentBatch()`: `announcement_slides`, `media_items`, `colecciones`, `nosotros`, `ciencia`, `talleres` y `footer_social`.
2. **WebGL y Canvas Orgánico de Rendimiento Ligero**:
   - `bee-canvas.tsx` y `hero-hueco-gl.tsx` renderizan trayectorias de vuelo y partículas orgánicas que evocan el bosque nativo de Chiloé.
   - Si el dispositivo activa `prefers-reduced-motion` o `LegacyDeviceDetect` reporta `data-legacy="true"` (iOS $\le 15$ o terminales de baja memoria), los efectos WebGL se desactivan de forma segura reemplazándose por fondos estáticos optimizados.
3. **Cero Transformaciones de Imagen en Servidor**:
   - Todas las imágenes utilizan el loader local `image-loader.ts` apuntando a imágenes WebP alojadas en Supabase Storage con `Cache-Control: 31536000`.

---

## 2. Catálogo Maestro, Filtros & Variantes

- **Ruta**: `/catalogo`
- **Vista**: `catalog-view.tsx`
- **Módulos clave**: `products.ts`, `taxonomias_producto`, `@enjambre/ui`

### Mecánica Interna
1. **Consultas Agregadas mediante React Cache & `unstable_cache`**:
   - `getShopProducts()` une las tablas `productos`, `taxonomias_producto` y `producto_variantes`.
   - Se cachea con el tag `['products']`, invalidable instantáneamente tras mutaciones en Núcleo vía `revalidateTag('products')`.
2. **Filtrado Multidimensional en Cliente**:
   - Filtro por **Variedad Botánica**: Ulmo, Tiaca, Bosque Nativo Multifloral.
   - Filtro por **Formato**: 250 g (cata personal), 500 g (mesa familiar), 1 kg (reserva).
   - Filtro por **Perfil Sensorial**: Fluida vs Untuosa, Dulzor Suave vs Profundo.
3. **Stock Dinámico y Badges de Edición**:
   - Despliega insignias de estado: `EdicionBadge` (lotes limitados de temporada de recolección), `ProductoAnalisisBadge` (certificación de laboratorio) y avisos de stock bajo.

---

## 3. Ficha Técnica de Producto & Perfil Sensorial

- **Ruta**: `/producto/[slug]`
- **Vistas**: `pdp-body.tsx`, `product-purchase-actions.tsx`
- **Componentes clave**: `perfil-sensorial-section.tsx`, `product-gallery.tsx`, `producto-analisis-badge.tsx`
- **Datos Estructurados**: `json-ld.ts` (`Product`, `Offer`, `BreadcrumbList`).

### Mecánica Interna
1. **Selector de Variantes y Fortificaciones**:
   - Permite al comprador elegir formatos o adiciones botánicas (miel virgen con trozo de panal, polen floral seleccionado, avellana chilena tostada, maqui silvestre).
   - Actualiza el precio dinámico y la disponibilidad de stock en tiempo real sin recargar la página.
2. **Gráfico Sensorial Radar**:
   - `perfil-sensorial-section.tsx` proyecta las intensidades de aroma floral, textura en boca, dulzor y persistencia gustativa.
   - Provee sugerencias de maridaje territorial (quesos maduros de Llanquihue, frutos secos patagónicos, café de especialidad).
3. **Estadísticas de Laboratorio**:
   - Despliega valores certificados del lote activo: Humedad ($< 18\%$), Grados Brix ($\ge 80^\circ\text{Bx}$) e Hidroximetilfurfural (HMF en $\text{mg/kg}$).

---

## 4. Pasaporte de Trazabilidad de Lote

- **Ruta**: `/producto/[slug]/trazabilidad`
- **Módulos clave**: `analisis-lote.ts`, `blockchain-card.tsx`
- **Integración**: Conexión con `/api/lotes-publicos` de Núcleo.

### Mecánica Interna
1. **Identidad del Apiario**:
   - Muestra el nombre del apiario de origen en Chiloé, las fechas de floración y la fecha exacta de recolección.
2. **Análisis Melisopalinológico**:
   - Porcentaje de polen dominante certificado (ej. $85\%$ polen de *Eucryphia cordifolia* para Miel de Ulmo).
3. **Prueba Criptográfica en Blockchain**:
   - Muestra el hash SHA-256 de los datos de extracción y el enlace de verificación en el explorador de bloques de la red Polygon Amoy.

---

## 5. Carrito de Compras con Pricing Server-Side

- **Ruta**: `/carrito`
- **Vistas**: `ui.tsx` (Carrito)
- **Módulos clave**: `cart-lines-context.tsx`, `commerce-storage.ts`, `app/actions/cart.ts`
- **Paquete de dominio**: `@enjambre/pricing`

### Mecánica Interna
1. **Persistencia Híbrida**:
   - `localStorage` (`oyz_tienda_cart_v1`) garantiza que el carrito se preserve de forma instantánea en el navegador del visitante.
   - Si el usuario inicia sesión, `app/actions/cart-sync.ts` sincroniza los ítems con la tabla `carrito_items` en Postgres para permitir carritos multi-dispositivo.
2. **Cálculo de Precios Server-Side Anti-Tampering (`calculateCartPricing`)**:
   - El cliente envía exclusivamente `{ product_id, quantity }`.
   - La Server Action lee el rol comercial del JWT autenticado (`app_metadata.oyz_role`).
   - Consulta la tabla `beneficios_enjambre` para obtener multiplicadores dinámicos (embajador 0.70, revendedor 0.80, suscriptor 0.90, volumen 0.95).
   - Recalcula los precios oficiales desde `productos.precio`, impidiendo cualquier manipulación de valores desde la consola o extensiones del navegador.

---

## 6. Checkout Omnicanal & Conexión con Pasarelas

- **Ruta**: `/checkout`
- **Vista**: `ui.tsx` (Checkout)
- **Módulos clave**: `cart-checkout-client.ts`, `checkout-attempt.ts`
- **Integración**: `${NUCLEO_URL}/api/checkout/init`

### Mecánica Interna
1. **Fingerprint de Intento (`attemptKey`)**:
   - Genera una clave de intento única basada en el contenido del carrito, email, dirección y couriers.
   - Previene duplicación de cobros ante clics compulsivos del usuario en conexiones intermitentes.
2. **Cotización Dinámica de Envíos (`@enjambre/logistica`)**:
   - Calcula la tarifa de envío en tiempo real según la comuna de destino en Chile y el peso acumulado, ofreciendo opciones entre Chilexpress, Starken, Blue Express y retiro local.
3. **Incentivos Circulares y Puntos**:
   - Permite al comprador declarar devolución de frascos vacíos, aplicando un crédito automático de compensación circular sin vulnerar el piso de costos del producto.
4. **Pase a la Pasarela**:
   - Envía el payload validado al BFF de Núcleo (`/api/checkout/init`), recibiendo la URL y token de pago para redirigir a **Flow** o **Transbank Webpay Plus**.

---

## 7. Resultado de Pago & Puente 303

- **Ruta**: `/checkout/resultado`
- **Vista**: `ui.tsx` (Resultado)
- **Módulos clave**: `payment-commit.ts`, `middleware.ts`
- **Integración**: `${NUCLEO_URL}/api/checkout/commit`

### Mecánica Interna
1. **Puente POST a GET 303 en Edge**:
   - Transbank y Flow devuelven al cliente mediante HTTP POST. El middleware captura el formulario, extrae los tokens y ejecuta un redirect 303 hacia la página GET.
2. **Compromiso de Pago (`commitPayment`)**:
   - La interfaz invoca el commit hacia Núcleo.
   - Si la orden está autorizada, vacía el carrito local, registra el evento de atribución y despliega:
     - Número de orden oficial (`buyOrder`).
     - Detalle de productos y dirección de despacho.
     - Enlace de descarga de la Boleta Electrónica SII oficial generada en tiempo real.
     - Sellos de fidelidad acreditados en la cuenta.

---

## 8. Degustación Sensorial & Instrumento CATA

- **Ruta**: `/cata/[codigo]`
- **Vista**: `cata-view.tsx`
- **Paquete de dominio**: `@enjambre/resenas`
- **Integración**: `${NUCLEO_URL}/api/resenas`

### Mecánica Interna
1. **Evaluación Sensorial Guiada**:
   - Diseñada para consumidores que escanean el código QR en un frasco o disfrutan una tabla de degustación en cafeterías aliadas.
2. **Pares Semánticos CATA**:
   - Permite seleccionar descriptores sensoriales estructurados:
     - **Aroma**: Floral, Resinoso, Amaderado, Húmedo, Frutal.
     - **Paladar**: Suave, Ácido balanceado, Amargo sutil, Cristalización fina.
3. **Recompensa de Fidelidad**:
   - Al completar la evaluación, el backend valida la autenticidad del frasco y acredita puntos de recompensa en la billetera digital del usuario.

---

## 9. Canje de Botellas Físicas & Tarjetas de Regalo

- **Ruta**: `/claim/[token]`
- **Vista**: `claim-client.tsx`
- **BFF**: `${NUCLEO_URL}/api/wallet/claim`

### Mecánica Interna
1. **Activación de Sellos Físicos**:
   - Permite reclamar la titularidad digital de un frasco de edición limitada o tarjeta física obsequiada en eventos.
2. **Acreditación en Billetera**:
   - Asocia el número de serie de la botella al perfil del cliente, sumando ciclos de recolección a su estatus de Guardián.

---

## 10. Escáner QR Integrado

- **Ruta**: `/qr-scan`
- **Vista**: `qr-scan-client.tsx`
- **Componente clave**: `qr-camera-scanner.tsx`

### Mecánica Interna
1. **Acceso a Cámara en PWA / Móvil**:
   - Emplea la API de MediaDevices del navegador con detección de códigos QR por hardware.
2. **Enrutamiento Inteligente**:
   - Si el QR corresponde a un lote $\to$ Redirige a `/producto/[slug]/trazabilidad` o `/lote/[id]`.
   - Si corresponde a una cata $\to$ Redirige a `/cata/[codigo]`.
   - Si corresponde a un reclamo de fidelidad $\to$ Redirige a `/claim/[token]`.

---

## 11. Club Legado del Bosque

- **Ruta**: `/club-legado-del-bosque`
- **Vista**: `page.tsx`
- **Componente clave**: `club-legado-section.tsx`

### Mecánica Interna
1. **Membresía Universal**:
   - Explica el modelo de fidelidad soberano: no es un club cerrado de pago, sino un pacto con el bosque nativo. Todo cliente registrado acumula trayectoria.
2. **Beneficios de Guardián**:
   - Acceso anticipado a lotes de floraciones escasas (ej. Miel de Tiaca virgen).
   - Bonificación de despacho gratuito por frecuencia.
   - Invitación a los encuentros anuales de apicultura en Chiloé.

---

## 12. Biblioteca Científica & Claims Validados

- **Rutas**: `/ciencia`, `/ciencia/[slug]`
- **Paquete de dominio**: `@enjambre/ciencia`

### Mecánica Interna
1. **Evidencia Botánica sin Prédica Médica**:
   - Detalla las propiedades físico-químicas del néctar nativo respetando el Decreto 977 (Reglamento Sanitario de los Alimentos) y la Ley 20.606.
   - Describe la actividad enzimática de la glucosa oxidasa presente en la miel cruda, la inhibina natural y la concentración de compuestos fenólicos.
2. **Triangulación Científica**:
   - Cada afirmación está respaldada por estudios botánicos y análisis de laboratorio universitarios sobre la flora melífera austral.

---

## 13. Narrativa Geográfica de Origen

- **Rutas**: `/origen`, `/origen/[slug]`, `/origen/ulmo`
- **Componente clave**: `mapa-identidad-hero.tsx`

### Mecánica Interna
1. **Inmersión Territorial en Chiloé**:
   - Cartografía visual interactiva que sitúa los apiarios en la microcuenca de Pureo y los bosques de Queilen y Quellón.
2. **Ecosistema del Bosque Templado Lluvioso**:
   - Explica la interacción entre la lluvia austral, los vientos del Pacífico y la abeja virgen, destacando la pureza de un entorno sin cultivos industriales transgénicos.

---

## 14. Encuentros & Experiencias en el Bosque

- **Rutas**: `/experiencias`, `/experiencias/talleres`, `/experiencias/degustaciones`, `/experiencias/pureo`, `/experiencias/floraciones`
- **BFF**: `/api/experiencias/inquiry`

### Mecánica Interna
1. **Catálogo de Experiencias en Terreno**:
   - Visitas guiadas a los apiarios con trajes de protección completos.
   - Talleres de iniciación sensorial en mieles nativas.
   - Catas maridadas con gastronomía chilota tradicional.
2. **Formulario de Reserva Institucional**:
   - Permite solicitar fechas exclusivas para grupos pequeños, integrando la gestión de reservas con la cabina de mando de Núcleo.

---

## 15. Landings B2B por Segmento

- **Rutas**: `/alianzas`, `/alianzas/[segmento]`
- **Segmentos**: `cafeterias`, `hoteles`, `tiendas-gourmet`, `ferias`, `revendedores`
- **Componentes clave**: Formularios de onboarding B2B, `b2b-segment-kits-showcase.tsx`
- **BFF**: `/api/b2b/register-lead`

### Mecánica Interna
1. **Propuesta de Valor Personalizada por Industria**:
   - Cafeterías: Kits de barra de café con mieles para endulzar cafés de origen.
   - Hoteles: Amenities de habitación y servicio de desayuno boutique.
   - Tiendas gourmet: Packs de exhibición en mostrador con material POP verjurado.
2. **Captura Directa hacia el Pipeline Comercial**:
   - El formulario de registro despacha los datos del prospecto hacia el BFF de Núcleo, creando automáticamente una tarjeta de lead en el tablero Kanban de `/pipeline`.

---

## 16. Portal Mayorista B2B

- **Ruta**: `/mayorista`
- **Vista**: `mayorista-portal-client.tsx`
- **BFF**: `/api/b2b/onboarding-order`

### Mecánica Interna
1. **Validación de RUT Comercial**:
   - Exige RUT de empresa válido según Módulo 11 para emitir Factura Electrónica (DTE 33).
2. **Escala de Descuentos por Caja**:
   - Despliega precios mayoristas por cajas de 12 o 24 unidades, descontando flete y calculando el IVA discriminado.

---

## 17. Portal de Embajadores & Creadores

- **Ruta**: `/embajadores`
- **Componente clave**: `creator-ref-capture.tsx`
- **BFF**: `/api/referrals/complete`

### Mecánica Interna
1. **Captura de Código de Creador**:
   - Si un usuario ingresa a través de un enlace de embajador (`?ref=codigo`), el componente captura la referencia en `localStorage`.
2. **Comisiones en Checkout**:
   - Durante el proceso de pago, el código se transmite a Núcleo para liquidar la comisión del creador según las reglas configuradas en `/reglas-comision`.

---

## 18. Hub del Cliente: Mi Legado

- **Ruta**: `/perfil`
- **Vista**: `mi-legado-client.tsx`
- **Componentes clave**: `guardian-sidebar.tsx`, `bosque-guardian-visualizer.tsx`, `orders-timeline.tsx`

### Mecánica Interna
1. **Resumen Ecosistémico Personal**:
   - Calcula el impacto positivo acumulado del cliente: número de tarros reciclados, kilogramos de CO₂ evitados y metros cuadrados de bosque nativo protegidos.
2. **Estatus de Guardián**:
   - Barra de progreso interactiva hacia el siguiente nivel de reconocimiento dentro del Club Legado.

---

## 19. Línea de Tiempo de Pedidos & DTEs

- **Ruta**: `/perfil/pedidos`
- **Vista**: `orders-timeline.tsx`
- **Integración**: `/api/dte/[buyOrder]`

### Mecánica Interna
1. **Trazabilidad en Vivo del Despacho**:
   - Muestra el estado actual del paquete (`preparando`, `despachado`, `en reparto`) y el botón directo para rastrear el envío en la web del courier.
2. **Descarga de Boleta Electrónica Oficial**:
   - Enlace seguro para visualizar o descargar el PDF de la Boleta Electrónica SII emitida al momento del pago.

---

## 20. Suscripciones de Reposición Recurrente

- **Ruta**: `/perfil/reposicion`
- **Vista**: `reposicion-client.tsx`
- **Componente clave**: `replenishment-sheet.tsx`

### Mecánica Interna
1. **Control Total del Cliente (Cero Fricción)**:
   - Permite al suscriptor pausar temporalmente sus entregas durante vacaciones.
   - Cambiar la dirección de entrega o la periodicidad del despacho.
   - Alternar la variedad de miel (ej. cambiar Ulmo por Tiaca o Miel con Avellana).
2. **Integración con Pagos Recurrentes**:
   - Comunica las modificaciones al motor de suscripciones de Núcleo (`/api/subscriptions/checkout`).

---

## 21. Ciclo Circular del Vidrio Austral

- **Ruta**: `/perfil/circular`
- **Vista**: `circular-client.tsx`
- **Constantes**: `JAR_RETURN_POINTS = 500` ($500 CLP de crédito)

### Mecánica Interna
1. **Bitácora de Retornos**:
   - Historial de frascos devueltos en puntos de entrega o ferias presenciales.
2. **Incentivos Económicos**:
   - Refleja el saldo a favor disponible para aplicar como descuento en la siguiente compra web, incentivando la esterilización y reutilización de envases.

---

## 22. Billetera Digital & Apple/Google Wallet

- **Ruta**: `/perfil/billetera`
- **Vista**: `billetera-client.tsx`
- **Componente clave**: `wallet-buttons.tsx`
- **Paquete de dominio**: `@enjambre/wallet`

### Mecánica Interna
1. **Pases Móviles Nativos**:
   - Botón oficial `Add to Apple Wallet` (`.pkpass`) y `Save to Google Wallet`.
   - El pase incluye el código QR de membresía del cliente, su estatus de Guardián y su saldo de sellos actualizado.
2. **Escaneo en Ferias**:
   - Al comprar en ferias presenciales (`apps/campo`), el vendedor escanea este pase para acreditar puntos de inmediato en la sesión de venta.

---

## 23. Ajustes de Privacidad & Derechos ARCO

- **Ruta**: `/perfil/ajustes`
- **Componentes clave**: `account-privacy-section.tsx`, `notification-preferences-form.tsx`
- **BFF**: `/api/usuario/exportar`, `/api/usuario/eliminar`

### Mecánica Interna
1. **Gobernanza de Datos Personales (Ley 21.719)**:
   - **Exportación de Datos**: Genera un archivo JSON descargable con todos los datos personales, compras, direcciones y reseñas del cliente.
   - **Solicitud de Eliminación**: Inicia el flujo formal de derecho al olvido, enviando la solicitud a la consola administrativa de Núcleo (`/arco`).
2. **Preferencias de Comunicación**:
   - Gestión granular de consentimiento para correos transaccionales, avisos de recolección estacional y notificaciones Web Push.

---

*Documento completado: Octubre 2026. Este catálogo representa el inventario técnico vivo de todas las herramientas y vistas de `@enjambre/tienda`.*
