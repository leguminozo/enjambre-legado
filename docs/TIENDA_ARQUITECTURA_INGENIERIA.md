# TIENDA — Arquitectura, Ingeniería y Funcionamiento del Sistema

> **Clase: VIVO.** Mapa canónico de ingeniería para `@enjambre/tienda`.
> Monorepo Enjambre Legado. Índice: [`README.md`](./README.md). Mapa técnico: [`REPO_MAP.md`](./REPO_MAP.md). Contratos: [`CROSS_APP.md`](./CROSS_APP.md). Dinero: [`MONEY_PATH.md`](./MONEY_PATH.md).

---

## 1. Manifiesto e Identidad: E-Commerce de Alta Gama y Poder Silencioso

`@enjambre/tienda` (`:3001`) es la **fachada pública D2C (Direct-to-Consumer), portal de membresía y experiencia sensorial** de Enjambre Legado.

En la arquitectura del sistema:
- **Poder Silencioso y Lujo Territorial**: La interfaz está concebida como una pieza de alta costura digital. Utiliza Cormorant Garamond para tipografías de exhibición, Geist para interfaces funcionales, tokens semánticos oscuros (`bg-background`, `text-foreground`), animaciones sutiles con GSAP/Framer Motion y texturas de sustrato orgánico.
- **Cero Retórica Hippie / ONG**: Prohibido el uso de vocabulario complaciente o militante. Se habla de maestría apícola, miel virgen de bosque nativo de Chiloé, trazabilidad matemática y elegancia discreta. La palabra sagrada es **recolección** (jamás "cosecha").
- **Austeridad de Infraestructura (Hobby / Free)**: Diseñada para maximizar el rendimiento y minimizar los costos de cómputo en Vercel y Supabase. Las lecturas públicas son ultra-baratas (ISR de Next.js, Storage CDN, `createAnonServerClient`) y todas las escrituras complejas o caras (checkout, validación de inventario, emisión de boletas DTE, auditoría de seguridad) se delegan en el BFF de Núcleo (`:3000`).

```
                    ┌────────────────────────────────────────────────────────┐
                    │                      apps/tienda                       │
                    │               Next.js 16 (App Router)                  │
                    │   Catálogo ISR / D2C / Perfil / Club Legado / B2B      │
                    └───────────┬────────────────────────────────┬───────────┘
                                │                                │
                Lecturas Públicas Baratas               Mutaciones Sensibles & Checkout
                (ISR + Storage CDN + Anon)              (HTTP Bearer / Internal API Key)
                                │                                │
                                ▼                                ▼
                    ┌───────────────────────┐        ┌───────────────────────┐
                    │  Supabase Postgres    │        │      apps/nucleo      │
                    │  Lecturas cacheadas   │        │   BFF Hono & Fiscal   │
                    └───────────────────────┘        └───────────────────────┘
```

---

## 2. Topología y Relaciones con Núcleo BFF

Tienda no ejecuta lógica fiscal ni accede directamente a claves de servicio (`SUPABASE_SERVICE_ROLE_KEY`):

| Dominio | Responsabilidad de Tienda | Delegación en Núcleo BFF |
|---|---|---|
| **Catálogo** | Renderiza productos, filtros, variantes y taxonomías mediante ISR (`revalidate = 120` o bajo demanda). | Núcleo muta productos, actualiza lotes y gatilla revalidación instantánea vía `/api/revalidate`. |
| **CMS Visual** | Renderiza secciones (`site_content`) bilingües (`es`/`en`) con fallback automático y preview seguro (`x-cms-preview`). | Núcleo opera el editor visual WYSIWYG ([`EditorTiendaView.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/nucleo/src/views/EditorTiendaView.tsx)), procesa imágenes WebP en cliente e invalida caché vía `/api/cms/revalidate`. |
| **Carrito & Precios** | Persiste localmente en `localStorage` (`oyz_tienda_cart_v1`) y calcula subtotales mediante la Server Action `calculateCartPricing`. | Núcleo re-valida precios en servidor, comprueba piso de costos anti-dumping (`enforceCostFloor`) y bloquea compras si faltan timbres CAF. |
| **Checkout & Pagos** | Captura datos de envío, empaque y facturación; inicia sesión contra Núcleo (`POST /api/checkout/init`) y redirige a Flow o Webpay. | Núcleo procesa webhooks bancarios, serializa con claim atómico, descuenta inventario definitivo, emite Boleta 39 ante el SII y acredita sellos. |
| **Perfil & Fidelidad** | Interfaz del cliente para consultar pedidos, suscripciones de reposición recurrente, frascos devueltos y pases digitales. | Núcleo calcula comisiones, asigna tiers de Guardián y procesa retribuciones por envases. |
| **Reseñas & Sensorial** | Formulario CATA (*Check-All-That-Apply*) y captura de notas aromáticas. | Núcleo valida integridad, modera reseñas y acredita puntos de fidelidad en la billetera. |

---

## 3. Arquitectura del App Router, Middleware y Seguridad

Ubicado en [`apps/tienda/middleware.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/tienda/middleware.ts):

### 3.1 Pipeline de Seguridad en el Edge
1. **Puente POST de Pasarelas de Pago (`handleProviderReturnPost`)**:
   - Pasarelas chilenas como Flow devuelven al cliente mediante una petición HTTP `POST` a la URL de retorno (`/checkout/resultado` o `/perfil/reposicion/resultado`).
   - Sin este puente, Next.js respondería con `405 Method Not Allowed`. El middleware captura el payload `application/x-www-form-urlencoded`, extrae `token` y `buyOrder`, y realiza una redirección limpia `303 See Other` hacia la vista GET correspondiente.
   - Protege contra desbordamiento de memoria limitando el tamaño del body a 64 KB (`PAYMENT_RETURN_MAX_BODY_BYTES`).
2. **Defensa contra Redirección Abierta (`sanitizeAuthReturnTo`)**:
   - En las rutas `/login` y `/register`, sanea exhaustivamente el parámetro `returnTo` mediante `safeStoreReturnPath()`.
   - Si detecta URLs absolutas foráneas o esquemas manipulados (`javascript:`, `//malicious.com`), purga el parámetro y redirige a la ruta canónica interna, frustrando ataques de phishing.
3. **Internacionalización y Redirección Legacy (`redirectLegacyLocalePath`)**:
   - Detecta prefijos obsoletos `/es` o `/en`, reescribe hacia la ruta canónica y almacena la preferencia en la cookie `NEXT_LOCALE`.
   - Lee el idioma desde query param (`?locale=`), cookie o cabecera `Accept-Language`, inyectando `x-next-intl-locale` en las cabeceras internas.
4. **Previsualización Segura de Borradores CMS (`x-cms-preview`)**:
   - Permite a los editores previsualizar cambios no publicados desde Núcleo usando `?cms_preview=<token>`.
   - Si el token es válido (`isAuthorizedPreviewValue`), inyecta la cabecera `x-cms-preview: 1` e impone `X-Robots-Tag: noindex, nofollow`, evitando que motores de búsqueda indexen borradores internos.
5. **Control de Acceso a Rutas Privadas (`resolveRouteAccessForMiddleware`)**:
   - Protege las rutas `/perfil/*`. Si no existe sesión activa, redirige a `/login?returnTo=...`.
   - Si detecta credenciales de personal administrativo (`admin`, `apicultor`, `territorial`), ofrece redirección contextual hacia Núcleo (`:3000`).

---

## 4. Pipeline de Catálogo y CMS con ISR (Incremental Static Regeneration)

### 4.1 Catálogo Maestro (`apps/tienda/lib/shop/products.ts`)
- **Lectura Eficiente**: Consume la tabla `productos` mediante `createAnonServerClient()` (sin costo de sesión ni llamadas a `auth.getUser()`).
- **Caché con Tags**: Las consultas de catálogo se envuelven en `unstable_cache` de Next.js y React `cache()` bajo el tag `['products']`.
- **Estructura Enriquecida**:
  - Cruza con `taxonomias_producto` para resolver etiquetas de formato (250g, 500g, 1000g) y categoría botánica.
  - Cruza con `producto_variantes` para fortificaciones con botánicos nativos (Panal virgen, Polen floral, Avellana chilena, Maqui).
  - Cruza con la tabla `lotes` para inyectar trazabilidad real de origen: código de lote, nombre del apiario, fecha de recolección, análisis de laboratorio (humedad, Brix, HMF) y hash de anclaje blockchain.

### 4.2 Revalidación ISR Instantánea
Tienda expone dos endpoints de invalidación controlada:
1. **`/api/revalidate` (`apps/tienda/app/api/revalidate/route.ts`)**:
   - Revalidación operativa. Invocado por Núcleo tras mutaciones de stock, precios o lotes.
   - Recibe `{ path: string, type: 'page' | 'layout' }` y ejecuta `revalidatePath()`.
2. **`/api/cms/revalidate` (`apps/tienda/app/api/cms/revalidate/route.ts`)**:
   - Revalidación editorial. Invocado por Núcleo al guardar secciones en el Editor de Tienda.
   - Invalida la suite completa de páginas públicas y el layout principal.
   - **Autenticación Estricta**: Ambos endpoints exigen comparación en tiempo constante (`timingSafeEqualString`) contra `INTERNAL_API_SECRET`, `CMS_REVALIDATE_SECRET` o `SUPABASE_SERVICE_ROLE_KEY`.

---

## 5. Carrito de Compras y Pricing Server-Side Anti-Tampering

El carrito de Tienda implementa una división estricta entre la experiencia de usuario y la autoridad de cobro:

```
[Navegador del Cliente]
  ├── Persistencia local: localStorage key 'oyz_tienda_cart_v1'
  ├── Items: [{ product_id, quantity }] (Sin precios en cliente)
  └── UI reactiva con debounce de 300 ms
           │
           ▼
[Server Action: calculateCartPricing] (app/actions/cart.ts)
  ├── 1. Resuelve identidad con supabase.auth.getUser()
  ├── 2. Extrae rol comercial EXCLUSIVAMENTE del JWT (app_metadata.oyz_role)
  ├── 3. Carga multiplicadores dinámicos desde tabla beneficios_enjambre:
  │       ├── Embajador: 0.70 (-30%)
  │       ├── Revendedor: 0.80 (-20%)
  │       ├── Suscriptor: 0.90 (-10%)
  │       └── Volumen: 0.95 (-5% adicional si tiene >= 10 ventas previas)
  ├── 4. Lee precios oficiales desde la tabla productos en Postgres
  └── 5. Calcula subtotales, descuentos y total mediante @enjambre/pricing
           │
           ▼
Retorna CartPricing hidratado a la interfaz
```

### 5.1 Prevención de Manipulación (Anti-Tampering)
- El cliente **nunca envía el precio unitario ni el total a cobrar**; únicamente envía el arreglo de `product_id` y `quantity`.
- Si un atacante modifica el `localStorage` o inyecta precios adulterados en el DOM, la Server Action los descarta y consulta la base de datos oficial.
- Para clientes mayoristas o embajadores, el rol no se lee de cabeceras HTTP ni de cookies manipulables, sino estrictamente de la firma criptográfica del JWT (`app_metadata.oyz_role`).

### 5.2 Rescate de Carritos Abandonados
- Integrado en `POST /api/cart/abandonment`.
- Cuando un usuario con sesión iniciada agrega productos y abandona la pestaña (detectado vía eventos `visibilitychange` o `pagehide`), se registra un snapshot en `cart_abandonment_events`.
- El cron diario de Núcleo (14:00 UTC) procesa estos eventos tras 30 minutos de gracia, enviando un correo transaccional de rescate respetando las preferencias de privacidad del cliente.

---

## 6. Proceso de Checkout Omnicanal y Pagos

Ubicado en [`apps/tienda/lib/shop/cart-checkout-client.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/tienda/lib/shop/cart-checkout-client.ts) y [`payment-commit.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/tienda/lib/shop/payment-commit.ts):

```
                       INICIALIZACIÓN DE CHECKOUT
[Cliente en apps/tienda/checkout]
           │
           ▼
startCartCheckout()
  ├── 1. Construye attemptKey único (fingerprint de líneas + dirección + courier)
  ├── 2. Captura atribución UTM (readUtmAttribution: source, campaign, gclid, fbclid)
  ├── 3. Adjunta Bearer token opcional de sesión
  └── 4. Envía POST a {NUCLEO_URL}/api/checkout/init
           │
           ▼
[Núcleo BFF]
  ├── Valida stock disponible (fetchBloqueadosPorProducto)
  ├── Valida timbres CAF del SII (getCafMinFolios)
  ├── Comprueba piso de costo anti-dumping (enforceCostFloor)
  ├── Aplica descuento por retorno de frascos limpios (calculateJarReturnReward)
  ├── Registra sesión en checkout_sessions
  └── Retorna { url, token, provider: 'flow' | 'transbank' }
           │
           ▼
redirectToPaymentProvider() ───► Pasarela de Pago Externa
```

### 6.1 Retorno y Confirmación (`/checkout/resultado`)
1. Tras completar la transacción en Flow o Webpay, el usuario regresa a `/checkout/resultado`.
2. El puente de middleware convierte el POST de la pasarela en GET con `token` y `buyOrder`.
3. La interfaz invoca `commitPayment()` hacia `${NUCLEO_URL}/api/checkout/commit`.
4. Maneja tres estados posibles:
   - `authorized: true`: Compra exitosa. Despliega número de orden, boleta electrónica descargable y puntos acumulados.
   - `processing: true`: El webhook de la pasarela ya reclamó la liquidación; la UI espera confirmación sin duplicar el cobro.
   - `canceled: true`: El usuario canceló la operación en la pasarela; preserva los ítems en el carrito.

---

## 7. El Hub del Cliente: Perfil y Club Legado (`/perfil`)

El área de clientes (`/perfil`) es el centro neurálgico de la relación a largo plazo con el consumidor consciente.

### 7.1 Membresía Universal: Club Legado del Bosque
- Todo cliente registrado forma parte del Club Legado con niveles de reconocimiento ("Guardián del Bosque") administrados en `guardian-dashboard.ts`.
- Muestra los ciclos de recolección apoyados, árboles de bosque nativo protegidos y CO₂ evitado por sus compras.

### 7.2 Módulos del Perfil del Cliente
1. **Historial de Pedidos (`/perfil/pedidos`)**:
   - Línea de tiempo interactiva con estado del envío, courier asignado, código de seguimiento en vivo y enlace de descarga de la Boleta Electrónica SII oficial.
2. **Reposición Automática (`/perfil/reposicion`)**:
   - Administración de suscripciones recurrentes de miel de bosque.
   - Permite pausar, reactivar, cambiar la frecuencia de despacho (mensual, bimensual) o modificar la variedad floral.
3. **Economía Circular de Vidrio Austral (`/perfil/circular`)**:
   - Registro de tarros de vidrio devueltos para higienización y reutilización territorial.
   - Acredita 500 puntos ($500 CLP) por frasco retornado y bonos especiales al completar ciclos de 6 envases.
4. **Billetera y Pases Digitales (`/perfil/billetera`)**:
   - Saldo de puntos canjeables y créditos a favor.
   - Botones para descargar e instalar el pase de membresía oficial en **Apple Wallet** y **Google Wallet** (`@enjambre/wallet`).
5. **Ajustes y Derechos ARCO (`/perfil/ajustes`)**:
   - Configuración de canales de comunicación (correo, WhatsApp, notificaciones push).
   - Panel de autodeterminación informativa bajo la Ley 21.719: permite solicitar exportación completa de datos personales o eliminación definitiva de la cuenta.

---

## 8. Experiencias Sensoriales, Cata Interactiva y Reseñas CATA

- **Rutas**: `/cata/[codigo]`, `/producto/[slug]`, `/perfil/resenas`
- **Vistas**: `cata-view.tsx`, `pdp-body.tsx`, `resena-composer.tsx`
- **Paquete de dominio**: `@enjambre/resenas`

### 8.1 Ficha Sensorial y CATA (Check-All-That-Apply)
- La página de producto (`/producto/[slug]`) y la interfaz de degustación (`/cata/[codigo]`) presentan una ficha técnica sensorial que educa al consumidor:
  - **Gráficos de Atributos**: Intensidad aromática, balance dulzor/acidez, cristalización y textura en boca.
  - **Pares Semánticos**: Contraste guiado (Floral vs Terroso, Herbal vs Frutal, Fluida vs Untuosa, Limpio vs Persistente).
  - **Notas de Maridaje**: Sugerencias gastronómicas (quesos maduros de la cuenca del lago Llanquihue, café de especialidad, frutos secos patagónicos).

### 8.2 Compositor de Reseñas Sensoriales (`resena-composer.tsx`)
- Los clientes que han adquirido un lote pueden emitir una reseña técnica evaluando los descriptores sensoriales reales y adjuntando fotos de consumo.
- Cada reseña verificada acredita puntos de lealtad en la billetera del cliente tras ser aprobada en Núcleo.

---

## 9. Ciencia Pública y Biblioteca Botánica de Origen

- **Rutas**: `/ciencia`, `/ciencia/[slug]`, `/origen`, `/origen/[slug]`
- **Paquete de dominio**: `@enjambre/ciencia`

### 9.1 Catálogo de Afirmaciones Científicas Validadas y Ejes de Navegación
- `/ciencia` reúne la evidencia analítica y botánica del néctar y la miel nativa de Chiloé estructurada en 5 ejes de divulgación:
  - **Eje 01 · Triangulación Botánica & Pureza**: Refugio austral, análisis cromatográficos y ausencia de pesticidas.
  - **Eje 02 · Bioquímica & Enzimas Vivas**: Miel cruda viva vs azúcar refinada, preservación enzimática (diastasa, glucosa oxidasa) y parámetros Codex.
  - **Eje 03 · Biblioteca de Floraciones de Chile**: Mapeo palinológico con las fuentes nectaríferas del archipiélago.
  - **Eje 04 · Contabilidad Biofísica & CO₂**: Modelación matemática de emisiones evitadas y servicios ecosistémicos de pecoreo.
  - **Eje 05 · Respaldo Académico & Límites Legales**: Literatura universitaria (UACh, PUC, INIA) y límites normativos del RSA DS 977/96 y Ley 20.606.

### 9.2 Biblioteca Botánica Central de Origen
- `/origen` centraliza la biblioteca botánica oficial y el catastro de especies melíferas del archipiélago (absorbió y unificó la antigua `/floraciones`).
- Monografías botánicas individuales (`/origen/[slug]` y `/origen/ulmo`) con fenología de floración, perfil sensorial, descriptores organolépticos y taxonomía botánica.
- Distintivos territoriales de origen (Predio Pureo, Sin Trashumancia, Extracción y Centrifugado en Frío).
- El **Manifiesto de No-Trashumancia** (*«Por qué nuestras colmenas nunca viajan»*), declarando la permanencia territorial inmutable frente a la trashumancia intensiva.

---

## 10. Alianzas B2B y Canal Mayorista

- **Rutas**: `/alianzas`, `/alianzas/[segmento]`, `/perfil/mayorista` (la antigua ruta pública `/mayorista` redirige permanentemente a `/alianzas`)
- **Componentes clave**: `mayorista-portal-client.tsx`, formularios de onboarding B2B

### 10.1 Landings por Segmento Comercial
Tienda expone 5 páginas de captación para actores del canal horeca y retail gourmet:
- `b2b_cafeterias`: Barras de café de especialidad e infusiones con miel nativa.
- `b2b_hoteles`: Amenities de lujo y cartas de desayuno territorial.
- `b2b_tiendas_gourmet`: Selección de frascos para emporios y tiendas de origen.
- `b2b_ferias`: Kits de exhibición ferial.
- `b2b_revendedores`: Condiciones para embajadores comerciales independientes.

### 10.2 Portal Mayorista
- Permite a clientes empresariales validados realizar pedidos al por mayor con descuentos por volumen integrados y solicitar emisión directa de Factura Electrónica (DTE 33) ingresando su RUT comercial verificado.

---

## 11. Rendimiento, SEO y Compatibilidad de Dispositivos

### 11.1 Política de Cero Costo de Transformación de Imágenes
- La tienda **no utiliza el optimizador de imágenes de Vercel** (para no consumir la cuota de 5.000 transformaciones mensuales del plan Hobby).
- Configurado en [`apps/tienda/image-loader.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/tienda/image-loader.ts): Todas las imágenes se cargan directamente desde el CDN de Supabase Storage en formato WebP nativo pre-optimizado con cabeceras de caché inmutable (`Cache-Control: 31536000`).

### 11.2 Datos Estructurados (JSON-LD) y SEO de Alta Gama
- [`apps/tienda/lib/shop/json-ld.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/tienda/lib/shop/json-ld.ts):
  - Inyecta esquemas estructurados de Schema.org (`Product`, `Offer`, `BreadcrumbList`, `Organization`).
  - Incluye disponibilidad de stock en tiempo real, valoraciones de clientes y origen geográfico en Chiloé.

### 11.3 Soporte de Dispositivos Legados (Safari / iOS 15.4+)
- Implementa la capa de compatibilidad de `@enjambre/ui`:
  - `LegacyBrowserPolyfills`: Inyectado en el `<head>` antes del bundle de Next.js, cubriendo métodos modernos de JavaScript (`Array.prototype.at`, `structuredClone`, `Object.hasOwn`, etc.).
  - `StickyBarSensor`: Reemplaza selectores `:has()` de CSS por atributos de datos controlados por React para fijar barras de compra inferiores en navegadores antiguos sin bloquear la renderización.

---

## 12. Guía de Ejecución Local y Verificación

```bash
# Iniciar servidor de desarrollo de Tienda (puerto :3001)
pnpm --filter @enjambre/tienda dev

# Ejecutar suite de pruebas unitarias (Vitest)
pnpm --filter @enjambre/tienda test

# Ejecutar auditoría de tipos TypeScript
pnpm --filter @enjambre/tienda exec tsc --noEmit

# Compilar para producción (incluye escaneo de compatibilidad compat-audit.mjs)
pnpm --filter @enjambre/tienda build
```

---

*Documento completado: Octubre 2026. Mantener este documento actualizado ante cualquier adición de rutas en el App Router de Tienda o modificación en los contratos de integración con Núcleo BFF.*
