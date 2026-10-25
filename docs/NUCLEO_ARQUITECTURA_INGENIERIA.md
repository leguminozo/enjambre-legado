# NÚCLEO — Arquitectura, Ingeniería y Funcionamiento del Sistema

> **Clase: VIVO.** Mapa canónico de ingeniería para `@enjambre/nucleo`.
> Monorepo Enjambre Legado. Índice: [`README.md`](./README.md). Mapa técnico: [`REPO_MAP.md`](./REPO_MAP.md). Contratos: [`CROSS_APP.md`](./CROSS_APP.md). Dinero: [`MONEY_PATH.md`](./MONEY_PATH.md).

---

## 1. Manifiesto e Identidad Operativa

`@enjambre/nucleo` (`:3000`) es el **cerebro operacional, contable y el único plano de escritura caro (BFF)** de Enjambre Legado.

En la arquitectura del monorepo:
1. **Tienda (`apps/tienda`)**: Es la superficie pública de lujo y comercio (D2C). Prioriza lecturas baratas (ISR, Storage CDN) y delega mutaciones sensibles (checkout, autenticación, cálculo de precios, eventos de seguridad) en el BFF de Núcleo.
2. **Campo (`apps/campo`)**: Es el punto de venta (POS) y terminal para representantes de venta en ferias y terreno. Opera con arquitectura *Offline-First* sobre Dexie en el navegador del vendedor y sincroniza sus lotes de venta hacia Núcleo vía replay idempotente.
3. **Núcleo (`apps/nucleo`)**: Es el centro de control soberano. Alberga el backend-for-frontend (Hono BFF montado sobre Next.js App Router), la bitácora apícola de patio (con motor de audio offline propio), la gestión territorial y comunal de Chiloé, la emisión fiscal ante el SII, la conciliación bancaria con Banco de Chile, el motor de costeo, el editor visual de la tienda y la administración de identidades y accesos.

```
                    ┌──────────────────────────┐
                    │       apps/tienda        │
                    │   D2C / Catálogo / CMS   │
                    └────────────┬─────────────┘
                                 │ HTTP (BFF / Checkout / Auth)
                                 ▼
┌──────────────────┐        ┌──────────────────────────┐        ┌──────────────────┐
│    apps/campo    │------->│       apps/nucleo        │<-------│  Servicios Ext.  │
│ POS Feria/Dexie  │ Replay │  Next.js 16 + Hono BFF   │ Webhook│ SII / BancoChile │
│ Offline Sync     │        │    Write & Fiscal Plane  │        │ Flow / Transbank │
└──────────────────┘        └────────────┬─────────────┘        └──────────────────┘
                                         │
                                         ▼
                            ┌──────────────────────────┐
                            │    Supabase Postgres     │
                            │  PostGIS + RLS + Storage │
                            └──────────────────────────┘
```

---

## 2. Topología y Relaciones Interconectadas

### 2.1 Ecosistema de Packages Compartidos

Núcleo no duplica código de dominio; interactúa estrechamente con los paquetes del workspace:

| Paquete | Interacción en Núcleo |
|---|---|
| `@enjambre/auth` | Entry points de servidor (`/server-index`), middleware (`/middleware`), secretos (`/internal-api-secret`), eventos (`/security-events`) y redirecciones (`/role-redirect`). |
| `@enjambre/database` | Tipos TypeScript generados (`database.types.ts`) a partir de las más de 240 migraciones SQL. |
| `@enjambre/ui` | Tokens de diseño semánticos (`bg-background`, `text-foreground`), componentes visuales, loaders de imagen WebP (`cdn-image-loader`) y polyfills de compatibilidad para dispositivos legados (iOS 15.4+). |
| `@enjambre/contable` | Validación de RUT chileno, cálculo de IVA (19%), PPM, esquemas Zod de DTEs y 15 parsers de recibos y facturas en `src/domain/receipt-parsers/`. |
| `@enjambre/fiscal` | Orquestación de DTEs electrónicos (boletas tipo 39, facturas tipo 33, notas de crédito tipo 61) y consumo de CAF. |
| `@enjambre/pricing` | Multiplicadores de precio, descuentos por volumen, cálculo de márgenes y floor anti-dumping en el checkout. |
| `@enjambre/logistica` | Tarifarios dinámicos por courier (Chilexpress, Starken, Blue Express, retiro en bodega) y asignación de despachos. |
| `@enjambre/banco-chile` | Integración API Empresas Banco de Chile, descarga de cartolas y conciliación bancaria. |
| `@enjambre/sumup` | Integración con terminales físicos SumUp en feria y conciliación de transacciones con tarjeta. |
| `@enjambre/wallet` | Generación y actualización de pases digitales para Apple Wallet y Google Wallet. |
| `@enjambre/resenas` | Gestión de reseñas sensoriales de miel y orígenes botánicos. |
| `@enjambre/calendar` | Coordinación de actividades territoriales, eventos, floraciones y floradas apícolas. |
| `@enjambre/rate-limit` | Motor de limitación de tasa en memoria / Edge. |
| `@enjambre/impacto` | Fórmulas abiertas de captura de CO2 por árboles nativos, biomasa y retorno social (IRR). |
| `@enjambre/ciencia` | Matriz de afirmaciones científicas validadas sobre néctar, miel nativa y fenología botánica. |
| `@enjambre/shop-chrome` | Esquemas y tipos del CMS visual de la tienda web, segmentos B2B y temas de interfaz. |

### 2.2 Política de Presupuesto de Plataforma (Vercel Hobby + Supabase Free)

Núcleo está diseñado con austeridad de infraestructura para operar de forma indefinida dentro de las cuotas gratuitas:
1. **Sin SSR costoso en lecturas públicas**: Las lecturas de catálogo o lote público no golpean Postgres en cada visitante; consumen Storage CDN, ISR o respuestas con cabeceras de caché estrictas.
2. **Cero transformaciones de imagen en Vercel**: Se utiliza `cdn-image-loader` apuntando a imágenes ya optimizadas en WebP con `Cache-Control: 31536000`.
3. **Crons diarios**: Vercel Hobby no permite workers de sub-hora. Núcleo registra solo 3 crons diarios en `apps/nucleo/vercel.json`:
   - `08:00 UTC` (`/api/cron/notifications`): Barrido de cola de notificaciones transaccionales huérfanas.
   - `13:00 UTC` (`/api/cron/fiscal`): Verificación de folios CAF y jobs tributarios del SII.
   - `14:00 UTC` (`/api/cron/checkout`): Gestión de reposiciones, dunning de suscripciones y rescate de carritos.
4. **Realtime acotado a lista blanca**: Prohibido suscribirse a `postgres_changes` en vistas normales. Realtime solo se permite en el monitor de feria, la sesión de caja, el carrito multi-dispositivo y la campana de notificaciones. Nuevas vistas deben emplear *poll-on-focus*.

---

## 3. Arquitectura del BFF (Backend-for-Frontend Hono)

El backend de Núcleo se monta a través del App Router en `apps/nucleo/app/api/[[...routes]]/route.ts` delegando en una instancia centralizada de **Hono** (`apps/nucleo/src/api/app.ts`).

```
HTTP Request
     │
     ▼
[CORS Middleware] (Valida orígenes permitidos con isAllowedOrigin)
     │
     ▼
[CSRF Protection] (Valida token y headers en mutaciones)
     │
     ▼
[Rate-Limiting Tri-Tier]
  ├── Strict (20 req/min): Checkout, Seguridad, Caja, Ventas Reps
  ├── Standard (100 req/min): Contable, Banco, SII, Producción, CMS, IA
  └── Permissive (200 req/min): Rutas generales / públicas
     │
     ▼
[Security Check / Zero-Trust JWT Validation]
  ├── ¿Ruta en publicPaths? ───► Permite paso sin Authorization
  ├── ¿Ruta interna (/internal)? ───► Valida cabecera x-internal-key
  └── Ruta protegida:
        ├── Extrae Bearer JWT
        └── Ejecuta supabase.auth.getUser(token) (Valida firma real con Postgres)
     │
     ▼
[Hono Modular Router] (50+ módulos montados bajo /api/*)
```

### 3.1 Pipeline de Seguridad y Zero-Trust

El BFF implementa una política Zero-Trust estricta:
- **Validación de Firma Real**: Nunca confía en decodificar el payload JWT en el cliente ni en la mera presencia del encabezado `Bearer`. Para toda ruta protegida, el middleware ejecuta `createSupabaseUserClient(token).auth.getUser()`, forzando la validación de la firma criptográfica contra el servidor de Supabase.
- **Rutas Internas con Clave Secreta**: Rutas como `/api/security-events/internal`, `/api/notifications/internal` o `/api/replenishment/cron` exigen la cabecera `x-internal-key`, validada mediante `verifyInternalApiKey()`.
- **Detección Automática de Anomalías**: Si un cliente excede el límite en rutas estrictas (`strictPaths`), el rate-limiter dispara automáticamente un evento de seguridad de tipo `suspicious_activity` hacia el registro central de auditoría.

### 3.2 Catálogo Modular de Rutas del BFF

| Ruta Base | Archivo de Origen | Función y Dominio |
|---|---|---|
| `/api/health` | `routes/health.ts` | Chequeo de estado del BFF y conectividad con Supabase. |
| `/api/checkout` | `routes/checkout.ts` | Inicialización de pago, cálculo de precios con `@enjambre/pricing`, validación de folios CAF, reserva de stock, devoluciones de envases y settling de órdenes. |
| `/api/subscriptions/checkout` | `routes/subscriptions-checkout.ts` | Suscripciones de reposición periódica y membresías del Club Legado. |
| `/api/webhooks` | `routes/webhooks.ts` | Handlers de pasarelas de pago (Transbank Webpay Plus, Flow, SumUp). |
| `/api/security-events` | `routes/security-events.ts` | Ingesta y auditoría de eventos de seguridad (accesos denegados, login fallidos, incidentes ARCO). |
| `/api/rep-ventas` | `routes/rep-ventas.ts` | Replay idempotente de ventas POS de Campo (`client_request_id`), validación de consignación ferial y deducción de stock. |
| `/api/cash-sessions` | `routes/cash-sessions.ts` | Apertura, arqueo, declaración de efectivo y cierre de sesiones de caja. |
| `/api/comisiones` | `routes/comisiones.ts` | Cálculo de comisiones para representantes según reglas escalonadas. |
| `/api/commission-rules` | `routes/commission-rules.ts` | Administración de reglas de comisión (base, canal, volumen, lealtad, racha, tier bonus). |
| `/api/bitacora` | `routes/bitacora.ts` | Sesiones de inspección de patio apícola, colmenas, reinas y sanidad. |
| `/api/bitacora/ledger` | `routes/bitacora-ledger.ts` | Registro inmutable de eventos de la bitácora apícola con firmas criptográficas. |
| `/api/ai` | `routes/ai.ts` | Transcripción de audio con Whisper (Groq) y extracción de métricas apícolas estructuradas; consultas sobre el censo apícola del usuario. |
| `/api/registro-territorial` | `routes/registro-territorial.ts` | Censo territorial apícola de Chiloé: actores, predios facilitadores, apiarios externos, alertas fitosanitarias y solicitudes de trashumancia. |
| `/api/censo-publico` | `routes/censo-publico.ts` | Portal público de registro para apicultores y propietarios de predios. |
| `/api/produccion` | `routes/produccion.ts` | Registro de recolección de miel a granel, lotes envasados, fraccionamiento, mermas y anclaje blockchain. |
| `/api/inventario` | `routes/inventario.ts` | Control de stock central, mermas, transferencias entre bodegas y stock crítico. |
| `/api/costeo` | `routes/costeo.ts` | Modelo de costeo unitario de producto: miel cruda, botánicos, vidrio, tapas, etiquetas y mano de obra. |
| `/api/cms` | `routes/cms.ts` | CMS dinámico de la tienda web: secciones, versionado, auto-guardado en vivo e invalidación ISR. |
| `/api/variantes` | `routes/variantes.ts` | Consulta pública de variantes de producto, fortificaciones y formatos para Tienda y Campo. |
| `/api/sii` | `routes/sii/` | Integración integral con el SII chileno: DTEs, folios CAF, certificados digitales, RCV, F29 e intercambio. |
| `/api/contable` | `routes/contable.ts` | Contabilidad interna, libro de ventas, gastos, facturas emitidas y balance. |
| `/api/banco-chile` | `routes/banco-chile/` | Cartolas bancarias, transferencias, nóminas y conciliación automática con ventas y gastos. |
| `/api/alambique` | `routes/alambique.ts` | Gestión de destilaciones experimentales y pasaporte público de destilados (`/alambique/[id]`). |
| `/api/hidromiel` | `routes/hidromiel.ts` | Lotes de hidromiel, fermentaciones, control enológico y pasaporte público (`/hidromiel/[id]`). |
| `/api/infusiones` | `routes/infusiones.ts` | Formulaciones de infusiones y botánicos con miel nativa. |
| `/api/fenologia` | `routes/fenologia.ts` | Oráculo fenológico: curvas de floración nativa de Chiloé (Ulmo, Tiaca, Avellano, etc.). |
| `/api/meteo` | `routes/meteo.ts` | Proxy microclimático hacia Open-Meteo para coordenadas estratégicas (Pureo, Chiloé). |
| `/api/lotes-publicos` | `routes/lotes-publicos.ts` | Pasaporte público de trazabilidad por lote para consumidores finales (`/lote/[id]`). |
| `/api/phygital` | `routes/phygital.ts` | Emparejamiento de sellos NFC/QR con lotes físicos y verificación de autenticidad. |
| `/api/blockchain` | `routes/blockchain/anchors.ts` | Anclaje de hashes SHA-256 de lotes en la red pública Polygon Amoy para prueba inmutable de origen. |
| `/api/arco` | `routes/arco.ts` | Gestión de derechos ARCO bajo la Ley 21.719 de Protección de Datos Personales de Chile. |
| `/api/push` | `routes/push.ts` | Administración de suscripciones y emisión de notificaciones Web Push vía VAPID. |
| `/api/admin` | `routes/admin-identidades.ts` | Control de usuarios, asignación de roles (`admin`, `apicultor`, `territorial`, etc.) y permisos. |

---

## 4. Matriz de Roles y Navegación Adaptativa

Núcleo ofrece una interfaz única basada en App Router (`apps/nucleo/app/(dashboard)/layout.tsx`) que adapta dinámicamente el sidebar, los permisos y las pantallas disponibles según el rol autenticado.

### 4.1 Definición de Roles

Configurado en `apps/nucleo/src/config/sidebar-config.ts` y sincronizado con `@enjambre/auth/role-redirect`:

| Rol de Plataforma | Enfoque Operativo | Rutas Visibles Principales |
|---|---|---|
| `admin` | Visión total del negocio y gobierno de plataforma. | Acceso completo (`ROLE_VISIBLE_KEYS = 'all'`): Finanzas, SII, Banco, Producción, CMS, Territorio, Salud. |
| `apicultor` | Gestión técnica y biológica del patio apícola O&Z. | `/inicio`, `/colmenas`, `/colmenas/cuaderno`, `/calendario`, `/configuracion`. |
| `territorial` | Participantes del Registro Territorial Apícola de Chiloé. | `/inicio`, `/territorio/mapa`, `/territorio/alertas`, `/territorio/trashumancia`, `/declaracion-sag`, `/registro-territorial`, `/fenologia`. Adaptado según sub-rol (residente, trashumante, facilitador, institución). |
| `operador` | Operaciones de bodega, inventario y fraccionamiento. | `/inicio`, `/produccion/inventario`, `/produccion/lotes`, `/produccion/recoleccion`, `/despacho/envios`, `/despacho/centros`. |
| `colaborador` | Personal de apoyo en planta o logística. | `/inicio`, `/produccion/inventario`, `/produccion/lotes`, `/configuracion`. |
| `disenador` | Diseñador gráfico y de packaging. | `/portal-imprenta`, `/etiquetas/qr`, `/etiquetas/artes`, `/catalogo`, `/configuracion`. |

### 4.2 Principio de Menor Privilegio (Least Privilege)

- **Cero elevación automática**: Si un usuario autenticado no posee perfil asignado o carece de `app_metadata.role`, el sistema asigna el rol por defecto `cliente` (sin acceso al panel administrativo) en lugar de elevar a `admin`.
- **Prefetch Inteligente (`PREFETCH_PRIORITY_KEYS`)**: Para no saturar el rendimiento en dispositivos móviles o conexiones rurales, Núcleo solo precarga en idle las vistas críticas (`/inicio`, `/colmenas`, `/produccion/inventario`, `/costeo`, `/contable`). Las librerías pesadas (Leaflet para mapas, Three.js, Recharts) solo se descargan bajo demanda al interactuar con el módulo correspondiente.

---

## 5. Subsistema: Bosque, Patio Apícola y Bitácora Offline-First

El patio apícola vive exclusivamente en **Núcleo** (no en Campo). Su diseño resuelve un problema territorial concreto: los apiarios en el bosque nativo de Chiloé carecen de cobertura celular.

```
[Apicultor en el Bosque]
       │
       ▼
Graba nota de voz o ingresa inspección en UI
       │
       ▼
Persistencia inmediata en Dexie (NucleoBitacoraDB)
  ├── sesiones_locales (UUID temporal)
  ├── grabaciones (Audio Blob puro)
  └── sync_queue (Tipo: sesion/captura, client_request_id idempotente)
       │
       ▼ (Al volver a tener cobertura celular / Wi-Fi)
Motor de Sincronización (useBitacoraSyncEngine)
  ├── 1. Downsync: Descarga cambios del servidor con TTL de 30s
  ├── 2. Upload de Blobs: Sube audio a Supabase Storage bucket 'bitacora-audio'
  ├── 3. Upsync Sesiones: Reconcilia UUIDs locales con IDs de Postgres
  └── 4. Replay Idempotente: Envía capturas con reintentos y backoff exponencial
```

### 5.1 Motor de Base de Datos Local (`NucleoBitacoraDB`)

Ubicado en `apps/nucleo/src/lib/offline/db.ts`:
- **`sesiones_locales`**: Almacena las sesiones de trabajo en terreno con marca de sincronización.
- **`grabaciones`**: Almacena el `Blob` binario de audio (`audio/mp4` en iOS, `audio/webm` en navegadores modernos) junto con su `client_request_id`.
- **`sync_queue`**: Cola de mutaciones pendientes con estado, número de intentos y `next_retry_at`.
- **Cierre Cooperativo (`versionchange`)**: Permite que las herramientas de inspección o upgrades cierren la conexión limpiamente sin generar bloqueos de pestaña.

### 5.2 Procesamiento de Audio e Inteligencia Artificial (`Groq`)

Cuando el audio se sincroniza en el servidor:
1. El endpoint `POST /api/ai/bitacora/transcribe` descarga el archivo desde el bucket `bitacora-audio`.
2. Utiliza **Groq Whisper** (`groqTranscribeAudio`) para generar la transcripción cruda (`transcript_raw`).
3. Aplica un modelo de chat Groq (`groqChatCompletion`) con esquemas estructurados para extraer variables críticas: presencia de reina, cuadros de cría, reservas de miel, niveles de varroa, postura y recomendaciones de manejo.
4. **Barrera de Confidencialidad (`docs/TRUST.md`)**: El contexto de la IA está estrictamente acotado a los registros del propio apicultor autenticado (`user_registry_only`).

### 5.3 Oráculo Fenológico y Microclima

- **Especies Melíferas Nativas**: Seguimiento del ciclo biológico de especies como Tiaca (*Caldcluvia paniculata*), Ulmo (*Eucryphia cordifolia*), Avellano (*Gevuina avellana*), Tepú (*Tepualia stipularis*) y Canelo (*Drimys winteri*).
- **Proxy Meteorológico (`/api/meteo`)**: Consulta en tiempo real a Open-Meteo con coordenadas fijadas en Pureo (Queilen, Chiloé), entregando temperatura, humedad, viento y precipitaciones para proyectar el flujo de néctar y pecoreo de las colmenas.

---

## 6. Subsistema: Gobernanza Territorial (Chiloé)

El módulo territorial (`/registro-territorial` y `/territorio`) consolida la infraestructura de datos para ordenar la apicultura en el archipiélago de Chiloé frente a la trashumancia desregulada y el uso de pesticidas.

### 6.1 Modelo de Datos del Registro

- **`actores_registro`**: Apicultores residentes, apicultores trashumantes, propietarios de predios facilitadores, agricultores y fiscalizadores municipales o del SAG.
- **`predios_facilitadores`**: Terrenos privados disponibles para asentar colmenas bajo acuerdos formales.
- **`apiarios_externos`**: Ubicación geográfica de apiarios de terceros presentes en el archipiélago.
- **`alertas_fitosanitarias`**: Denuncias o avisos de aplicación de plaguicidas agrícolas.
- **`solicitudes_trashumancia`**: Solicitudes de ingreso de colmenas foráneas hacia comunas insulares.

### 6.2 Lógica de Cálculo Espacial y Distancias Legales

Implementada en `apps/nucleo/src/lib/distancias-legales.ts` y `src/api/routes/registro-territorial.ts`:
- **Fórmula de Haversine (`haversineKm`)**: Calcula distancias geodésicas directas entre coordenadas de apiarios y zonas de aplicación agrícola.
- **Radio de Amortiguación y Alertas Fitosanitarias**: Al emitirse una alerta de plaguicida tóxico, el sistema calcula de inmediato qué apiarios caen dentro del radio de afectación (ej. 3 km) y dispara notificaciones transaccionales automáticas a los apicultores en peligro.
- **Distancia Mínima Legal**: Valida que ninguna solicitud de trashumancia se asiente a menos de la distancia reglamentaria respecto a apiarios residentes preexistentes, protegiendo la carga melífera de los bosques nativos.

---

## 7. Subsistema: Producción, Alquimia y Costeo Soberano

### 7.1 Cadena de Recolección y Envasado

En cumplimiento de la invariante constitucional del proyecto, se utiliza exclusivamente el término **recolección** (jamás "cosecha"):
1. **Recolección en Terreno**: Registro del peso en kilogramos, apiario de origen y fecha en la tabla `cosechas` (nombre técnico de base de datos preservado para integridad de schema).
2. **Asociación Atómica a Lote (`attachCosechaToLote`)**: Sincroniza bidireccionalmente los IDs entre recolecciones y lotes envasados, recalculando el peso neto total del lote.
3. **Fraccionamiento y Mermas**: Registro de la merma técnica durante el proceso de extracción, decantación y envasado en tarros de vidrio.

### 7.2 Alquimia: Alambique e Hidromiel

- **Destilaciones (`/alambique`)**: Bitácora de maceración botánica, destilado experimental, cortes de cabeza/corazón/cola, graduación alcohólica y notas de cata.
- **Hidromiel (`/hidromiel`)**: Control de fermentación (densidad inicial/final, levaduras, PH) y maduración en barrica o botella.
- **Pasaportes Públicos**: Ambos procesos exponen rutas públicas de consulta (`/alambique/[id]` y `/hidromiel/[id]`) que permiten verificar el origen de cada botella sin necesidad de inicio de sesión.

### 7.3 Costeo de Producto y Floor Anti-Dumping

Ubicado en `apps/nucleo/src/api/lib/payments/cost-floor.ts` y `routes/costeo.ts`:
- **Cálculo de Costo Real**: Integra el costo de la miel cruda, botánicos nativos, envase de vidrio importado, tapa metálica, etiqueta de algodón con relieve, sello de seguridad, horas de mano de obra y merma.
- **Protección de Piso de Costo (`enforceCostFloor`)**: El motor de pagos rechaza cualquier combinación de cupones o descuentos que fije un precio final inferior al costo de reposición del producto, garantizando la sostenibilidad económica del modelo.

---

## 8. Subsistema: Packaging, Imprenta y Phygital

### 8.1 Portal Imprenta y Bóveda de Etiquetas

Ubicado en `apps/nucleo/app/(dashboard)/portal-imprenta` y `src/views/portal-imprenta/`:
- Provee especificaciones técnicas rigurosas para la fabricación física de packaging de lujo (medidas en milímetros, sangrados de corte, áreas de reserva para estampados en foil o barniz sectorizado, perfiles de color CMYK).
- Almacena artes vectoriales aprobados para cada lote y producto en la bóveda de etiquetas.

### 8.2 Trazabilidad Phygital y Pasaporte Digital

- **Generador de Sellos QR**: Emisión de códigos QR únicos vinculados a cada lote de recolección.
- **Pasaporte Público (`/lote/[id]`)**: Vista de acceso público optimizada para teléfonos móviles que muestra:
  - Mapa interactivo Leaflet con el área del apiario de recolección.
  - Perfil polínico y botánico de la miel.
  - Análisis de laboratorio (humedad, hidroximetilfurfural - HMF, pureza).
  - Fecha de envasado y número de serie del frasco.
- **Anclaje Criptográfico en Blockchain (`blockchain/anchors.ts`)**: Para garantizar que los datos de origen no puedan ser alterados retroactivamente, el BFF genera un hash SHA-256 de los datos de trazabilidad del lote y lo ancla en la red pública Polygon Amoy (`getBlockchainProvider`), proveyendo un sello digital inmutable.

---

## 9. Subsistema: CMS Visual de la Tienda y Catálogo

El gestor de contenidos de la tienda web vive dentro de Núcleo (`apps/nucleo/src/views/EditorTiendaView.tsx` y `src/api/routes/cms.ts`).

### 9.1 Auto-Guardado Canónico y Sincronización en Vivo

- **Sin paso forzado de publicación**: Las modificaciones realizadas en el editor visual se guardan y aplican automáticamente sobre la tabla `site_content`.
- **Bloqueo Optimista (`expected_updated_at`)**: Si múltiples operadores editan la misma sección en paralelo, el servidor rechaza mutaciones concurrentes con un error `409 Conflict`, evitando sobreescrituras accidentales.
- **Optimización de Imágenes WebP en Navegador**: Todo asset subido al CMS se procesa localmente mediante `processImage` (`apps/nucleo/src/lib/process-image.ts`):
  - Redimensionamiento escalonado (multi-step downsampling) con tope en 1600px de ancho.
  - Conversión a formato WebP con calidad del 88% para eliminar efecto de aliasing y artefactos.
  - Almacenamiento en bucket de Supabase con encabezados de caché inmutables (`Cache-Control: 31536000`).
- **Revalidación Instantánea ISR (`revalidateTiendaCms`)**: Tras cada guardado, Núcleo envía una solicitud autenticada con clave interna hacia la Tienda (`/api/revalidate-cms`), invalidando la caché de Next.js de inmediato sin requerir un nuevo despliegue.

---

## 10. Subsistema: Feria, POS y Microcanales

Núcleo actúa como el receptor central de las operaciones de venta presencial que ocurren en ferias o puntos de venta asistidos por `apps/campo`.

### 10.1 Monitor de Feria en Tiempo Real

Ubicado en `apps/nucleo/src/views/FeriaMonitorView.tsx`:
- Supervisa las sesiones de caja activas de los representantes de ventas.
- Permite detectar desviaciones (*alertas delta*) entre las ventas registradas por el sistema y el dinero en efectivo declarado en el arqueo físico al cierre de la jornada.

### 10.2 Replay Idempotente de Ventas (`routes/rep-ventas.ts`)

Dado que Campo opera offline y sincroniza transacciones en ráfagas al recuperar señal:
- Cada venta incluye un identificador único generado por el cliente (`client_request_id`), guardado como `ventas.buy_order`.
- Si el servidor recibe una venta ya procesada (por reintento de red), responde con éxito `200 OK` de forma idempotente sin duplicar cobros, boletas ni decrementos de inventario.
- **Deducción de Inventario Central**: Aplica decremento atómico sobre el stock del lote asociado mediante `buildBatchStockPayload`.
- **Motor de Comisiones**: Evalúa la venta frente a las reglas configuradas (comisión base, bono por volumen, bono por racha semanal, multiplicador por canal ferial).

---

## 11. Subsistema: Soberanía Fiscal (SII) y Conciliación Bancaria

Núcleo contiene la infraestructura de cumplimiento tributario nativo para Chile, evitando depender de intermediarios de facturación electrónica.

```
                      ┌────────────────────────────────────────┐
                      │              SII CHILE                 │
                      │  Ambiente Certificación / Producción   │
                      └──────────────▲────────────┬────────────┘
                                     │            │
                         Envío DTE   │            │ Consultas RCV
                         (XML + CAF) │            │ y Estado DTE
                                     │            │
                      ┌──────────────┴────────────▼────────────┐
                      │          apps/nucleo/src/api           │
                      │               Módulo SII               │
                      ├────────────────────────────────────────┤
                      │ • dte.ts: Emisión boletas/facturas     │
                      │ • caf.ts: Control de folios y alertas  │
                      │ • certificados.ts: Firma digital PFX   │
                      │ • impuestos.ts: Cálculo de F29 e IVA   │
                      └───────────────────▲────────────────────┘
                                          │
                                          │ Conciliación automática
                                          │
                      ┌───────────────────┴────────────────────┐
                      │          Módulo Banco de Chile         │
                      ├────────────────────────────────────────┤
                      │ • Ingesta de cartolas bancarias        │
                      │ • conciliacion-auto.ts: Matching       │
                      │ • transferencias.ts y nóminas          │
                      └────────────────────────────────────────┘
```

### 11.1 Documentos Tributarios Electrónicos (DTE)

Implementado en `apps/nucleo/src/api/routes/sii/`:
- **Tipos Soportados**: Boleta Electrónica (39), Factura Electrónica (33), Factura Exenta (34), Nota de Crédito (61), Guía de Despacho (52).
- **Control de Folios CAF (`caf-guard.ts`)**:
  - Administra los archivos XML de Código de Autorización de Folios (CAF) provistos por el SII.
  - Implementa una salvaguarda crítica: si los folios restantes caen por debajo del umbral mínimo (`getCafMinFolios`), el checkout bloquea nuevas compras en efectivo o boleta hasta que el administrador cargue un nuevo timbre, previniendo ventas ilegales no facturadas.
- **Firma Digital XML**: Firma los documentos en servidor utilizando el certificado digital personal (.pfx) cargado de forma segura en las variables de entorno.
- **Registro de Compras y Ventas (RCV)**: Sincronización periódica para conciliar compras acreditadas ante el SII con las facturas de proveedores registradas en el sistema.
- **Propuesta de Formulario 29 (F29)**: Cálculo mensual automático del Débito Fiscal (IVA 19%), Crédito Fiscal por compras de insumos, retención de honorarios y Pago Provisional Mensual (PPM).

### 11.2 Integración Bancaria (Banco de Chile)

Implementado en `apps/nucleo/src/api/routes/banco-chile/`:
- **Conciliación Automática (`conciliacion-auto.ts`)**: Cruza los movimientos de la cartola bancaria con las órdenes pagadas vía transferencia electrónica y los pagos procesados por Flow o Transbank, marcando las cuentas por cobrar como saldadas.
- **Nóminas y Pagos**: Generación de archivos de transferencia masiva para liquidación de comisiones a representantes de venta y pagos a proveedores locales.

---

## 12. Subsistema: Checkout, Pagos y Reposición

### 12.1 Orquestación de Pagos Multi-Pasarela

Núcleo abstrae las pasarelas de pago chilenas mediante una interfaz homogénea (`getPaymentProvider` en `src/api/lib/payments/`):
- **Proveedores**: Transbank Webpay Plus y Flow.
- **Ciclo de Vida de la Sesión**:
  1. `POST /api/checkout/init`: Crea la sesión en `checkout_sessions` con un `buy_order` único, congela los precios validados por el servidor y genera la URL de redirección a la pasarela.
  2. Retorno de Pasarela (`middleware.ts`): Captura el retorno POST o GET de la pasarela y redirige al flujo de resultado.
  3. Webhook de Confirmación (`/api/webhooks/*`): Valida el token contra la API del proveedor, comprueba la autorización y ejecuta `settleCheckout`.
  4. `fulfillCheckout`: Emite la boleta electrónica ante el SII, descuenta el stock de productos, acredita puntos o sellos de fidelidad y despacha correos transaccionales.

### 12.2 Economía Circular: Retorno de Envases

El checkout bonifica el retorno de tarros de vidrio limpios mediante `calculateJarReturnReward` (`@enjambre/pricing`), aplicando un descuento regulado que fomenta la economía circular sin vulnerar el piso de costos.

---

## 13. Seguridad, Privacidad y Cumplimiento de la Ley 21.719

### 13.1 Módulo ARCO (Derechos de los Titulares)

Ubicado en `apps/nucleo/src/api/routes/arco.ts` y `src/views/ArcoAdminView.tsx`:
- Provee los mecanismos exigidos por la **Ley 21.719 sobre Protección de Datos Personales de Chile** para gestionar solicitudes de:
  - **A**cceso: Reporte consolidado de todos los datos personales del usuario.
  - **R**ectificación: Actualización de datos inexactos.
  - **C**ancelación (Supresión / Derecho al Olvido): Anonimización irreversible de la cuenta preservando únicamente los registros tributarios exigidos por el SII (con retención legal de 6 años).
  - **O**posición: Cese de envíos promocionales y perfilamiento algorítmico.

### 13.2 Bus Central de Seguridad (`security_events`)

Toda actividad crítica en Núcleo o reportada desde Tienda y Campo se audita en la tabla `security_events`:
- Intentos de inicio de sesión fallidos y bloqueos por fuerza bruta.
- Denegaciones de acceso por violación de permisos de rol.
- Cambios de privilegios de usuario.
- Revocación de sesiones activas.

---

## 14. Salud de Plataforma y Observabilidad

La pantalla `/salud` (`apps/nucleo/src/views/SaludPlataformaView.tsx`) y el endpoint `/api/health` consolidan las métricas vitales:
- **Estado de Conexión a Supabase**: Latencia y conectividad del pooler de base de datos.
- **Disponibilidad de Almacenamiento**: Estado de los buckets de Storage (`bitacora-audio`, `cms`, `documentos-sii`).
- **Estado de Certificados Digitales**: Alerta de vencimiento del certificado digital tributario del SII.
- **Folios CAF Disponibles**: Semáforo visual del saldo de folios de boletas y facturas electrónicas.
- **Cola de Notificaciones Transaccionales**: Monitoreo de envíos pendientes o fallidos.

---

## 15. Guía de Ejecución Local y Verificación

```bash
# Iniciar el entorno de desarrollo de Núcleo (puerto :3000)
pnpm --filter @enjambre/nucleo dev

# Ejecutar suite de pruebas unitarias
pnpm --filter @enjambre/nucleo test

# Ejecutar auditoría de tipos TypeScript
pnpm --filter @enjambre/nucleo exec tsc --noEmit

# Compilar para producción (incluye auditoría de compatibilidad de Safari/iOS 15)
pnpm --filter @enjambre/nucleo build
```

---

*Documentación creada: Octubre 2026. Mantener este documento actualizado ante cualquier cambio en el BFF Hono, nuevos contratos entre aplicaciones o adición de dominios a Núcleo.*
