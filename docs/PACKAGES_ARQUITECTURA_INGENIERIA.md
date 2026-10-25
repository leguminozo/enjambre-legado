# Arquitectura e Ingeniería de Packages (packages/*)

> **Clase de Documento: VIVO.**
> **Propósito:** Tratado exhaustivo de arquitectura, contratos compartidos, interfaces de exportación y diseño de ingeniería de los **17 packages** del monorepo Enjambre Legado.
> **Audiencia:** Ingenieros de software, arquitectos de sistemas, auditores de seguridad y desarrolladores core.
> **Reglas Inviolables:**
> 1. Vocabulario Sagrado: **Recolección**, jamás "cosecha".
> 2. Estética y Tono: Poder silencioso y lujo territorial de alta gama; cero retórica de ONG, cooperativa o abnegación obrera.
> 3. Cero fuga técnica en UI: Sin nombres de scripts `.sql`, UUIDs crudos ni comandos expuestos en interfaces.
> 4. Cero paquetes fantasma: **No existe `@enjambre/offline`** (la persistencia offline vive exclusivamente en `apps/campo/src/lib/offline/` y `apps/nucleo/src/lib/offline/`).

---

## 1. Topología del Monorepo y Mapa de Packages

El monorepo Enjambre Legado gestiona su código compartido mediante **Turborepo** y **pnpm workspaces**. Todos los paquetes comparten el prefijo de espacio de nombres `@enjambre/*` y residen en el directorio raíz `packages/`.

```
                                  ┌───────────────────┐
                                  │   APPS CLIENTES   │
                                  │  Tienda · Núcleo  │
                                  │       Campo       │
                                  └─────────┬─────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               │                            │                            │
               ▼                            ▼                            ▼
      CAPA DE FUNDACIÓN           CAPA DE DOMINIO Y NEGOCIO      CAPA DE INTEGRACIÓN
  ┌───────────────────────┐       ┌───────────────────────┐      ┌───────────────────┐
  │  @enjambre/database   │       │  @enjambre/pricing    │      │ @enjambre/fiscal  │
  │  @enjambre/auth       │       │  @enjambre/logistica  │      │ @enjambre/banco-  │
  │  @enjambre/ui         │       │  @enjambre/resenas    │      │   chile           │
  │  @enjambre/rate-limit │       │  @enjambre/ciencia    │      │ @enjambre/sumup   │
  │  @enjambre/contable   │       │  @enjambre/impacto    │      │ @enjambre/wallet  │
  │                       │       │  @enjambre/shop-chrome│      │ @enjambre/calendar│
  │                       │       │                       │      │ @enjambre/sale-qr │
  └───────────────────────┘       └───────────────────────┘      └───────────────────┘
```

### Inventario Canónico de los 17 Paquetes

| Package | Directorio | Responsabilidad Principal | Consumidores Principales |
|---|---|---|---|
| **`@enjambre/auth`** | `packages/auth` | Autenticación Supabase, RBAC, eventos de seguridad, 9 puntos de entrada | Tienda, Núcleo, Campo |
| **`@enjambre/ui`** | `packages/ui` | Design system (tokens, componentes, loader CDN, compatibilidad iOS 15) | Tienda, Núcleo, Campo |
| **`@enjambre/pricing`** | `packages/pricing` | Motor de precios, descuentos, cost-floor, fidelización y B2B | Tienda, Núcleo |
| **`@enjambre/contable`** | `packages/contable` | Modelos tributarios SII, RUT módulo 11, IVA, DTE XML, F29, parsers de recibos | Núcleo, Fiscal |
| **`@enjambre/fiscal`** | `packages/fiscal` | Emisión nativa DTE, jobs SII, ingesta OCR y control de folios CAF | Núcleo BFF |
| **`@enjambre/database`** | `packages/database` | 324 migraciones SQL, generador de tipos `database.types.ts` | Todo el workspace (build) |
| **`@enjambre/logistica`** | `packages/logistica` | Couriers chilenos, cálculo de fletes y división territorial Chiloé | Tienda, Núcleo |
| **`@enjambre/banco-chile`**| `packages/banco-chile`| API Empresas Banco de Chile, cartolas y conciliación bancaria | Núcleo BFF |
| **`@enjambre/sumup`** | `packages/sumup` | Integración API con terminales de pago SumUp Air y Solo | Núcleo, Campo |
| **`@enjambre/wallet`** | `packages/wallet` | Generación de pases Apple Wallet y Google Wallet (pasaporte) | Tienda, Núcleo |
| **`@enjambre/resenas`** | `packages/resenas` | Reseñas públicas y verificadas por token de compra | Tienda, Núcleo |
| **`@enjambre/calendar`** | `packages/calendar` | Calendario biocultural: floraciones nativas, ferias y obligaciones | Núcleo |
| **`@enjambre/rate-limit`**| `packages/rate-limit`| Limitador de tasa distribuido Upstash Redis con fallback en memoria | Tienda, Núcleo |
| **`@enjambre/sale-qr`** | `packages/sale-qr` | Generación y verificación de sellos criptográficos QR para envases | Campo, Núcleo |
| **`@enjambre/shop-chrome`**| `packages/shop-chrome`| Esquemas de personalización CMS (marca, tipografía, menú dinámico) | Tienda, Núcleo |
| **`@enjambre/ciencia`** | `packages/ciencia` | Catálogo de afirmaciones y claims científicos triangulados | Tienda |
| **`@enjambre/impacto`** | `packages/impacto` | Fórmulas open-book, SROI y métricas de regeneración territorial | Tienda, Núcleo |

---

## 2. Contratos Compartidos Nucleares

---

### 2.1. `@enjambre/auth` — Autenticación, RBAC y Telemetría de Seguridad

El paquete [`packages/auth`](file:///Users/macbook/Desktop/oyz%20app/packages/auth) es el guardián de identidad de toda la plataforma. Aísla de forma rigurosa el código que corre en el navegador del código que corre en el servidor o en el Edge Runtime de Next.js mediante **9 puntos de entrada explícitos** (`package.json#exports`):

```
                                  @enjambre/auth
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
    Browser Context               Server / BFF Context               Edge Context
  (React Hooks / Zustand)         (Node.js / Route Handlers)         (Middleware)
        │                                │                                │
   [ . ]                          [ ./server-index ]             [ ./middleware ]
   [ ./browser ]                  [ ./security-events ]          [ ./role-redirect ]
   [ ./in-app-notifications ]     [ ./internal-api-secret ]      [ ./notification-
   [ ./web-push ]                                                  preferences ]
```

#### Los 9 Puntos de Entrada Canónicos

1. **`.` (`@enjambre/auth`)**
   - **Archivo:** [`src/index.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/auth/src/index.ts).
   - **Entorno:** Navegador (Client Components).
   - **Contenido:** Hook `useAuthProvider`, almacén global Zustand `useAuthStore`, `createClient()`, `createAdminClient()`, `logSecurityEvent`, `useSecurityAlerts`, constantes de roles (`ALL_ADMIN_ROLES`, `ROUTE_ROLE_GUARDS`).
2. **`./browser` (`@enjambre/auth/browser`)**
   - **Archivo:** [`src/supabase.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/auth/src/supabase.ts).
   - **Entorno:** Navegador puro sin dependencias de React/Zustand.
   - **Contenido:** `createClient()`, `createAdminClient()`, `getSupabaseUrl()`, `getSupabaseKey()`, `isSupabaseConfigured()`.
3. **`./server-index` (`@enjambre/auth/server-index`)**
   - **Archivo:** [`src/server-index.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/auth/src/server-index.ts) y [`src/server.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/auth/src/server.ts).
   - **Entorno:** Servidor Node.js (Server Components, Route Handlers).
   - **Contenido:** `createServerClientFromCookies()` (manejo seguro de cookies de sesión vía `@supabase/ssr`), `createSupabaseUserClient()`, re-exportación de `logSecurityEvent` y `fetchSecurityEvents`.
4. **`./middleware` (`@enjambre/auth/middleware`)**
   - **Archivo:** [`src/middleware.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/auth/src/middleware.ts).
   - **Entorno:** Edge Runtime de Next.js.
   - **Contenido:** `createAuthMiddleware()`: actualiza las cookies de sesión con `supabase.auth.getUser()` (previene falsificación de JWT), evalúa `ROUTE_ROLE_GUARDS`, redirige roles desautorizados y registra eventos `access_denied` de forma fire-and-forget.
5. **`./security-events` (`@enjambre/auth/security-events`)**
   - **Archivo:** [`src/security-events.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/auth/src/security-events.ts).
   - **Entorno:** Servidor / BFF (sin hooks de React).
   - **Contenido:** Registro de auditoría en la tabla `security_events`: `login_success`, `login_failed`, `password_reset_requested`, `access_denied`, `session_revoked`. Incluye `isRepeatedFailure()` para mitigación de fuerza bruta.
6. **`./role-redirect` (`@enjambre/auth/role-redirect`)**
   - **Archivo:** [`src/role-redirect.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/auth/src/role-redirect.ts).
   - **Entorno:** Isomórfico (Edge, Server y Browser).
   - **Contenido:** Mapeo de roles canónicos (`admin`, `apicultor`, `rep_ventas`, `territorial`, `cliente`, `creador`). Normalización de roles legados (`LEGACY_ROLE_MAP`), mapas de redirección (`ROLE_REDIRECT_MAP`) y función pura `isRouteAllowed()`.
7. **`./in-app-notifications` (`@enjambre/auth/in-app-notifications`)**
   - **Archivo:** [`src/in-app-notifications.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/auth/src/in-app-notifications.ts).
   - **Entorno:** Isomórfico / Browser.
   - **Contenido:** Consulta de notificaciones internas de usuario (`fetchInAppNotifications`), marcado atómico (`markNotificationRead`, `markAllNotificationsRead`) y tipos de datos `NotificationItem`.
8. **`./notification-preferences` (`@enjambre/auth/notification-preferences`)**
   - **Archivo:** [`src/notification-preferences.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/auth/src/notification-preferences.ts).
   - **Entorno:** Isomórfico / Browser.
   - **Contenido:** Preferencias de comunicación por usuario (WhatsApp, Email, Push) y categorías operativas (pedidos, seguridad, boletín).
9. **`./internal-api-secret` (`@enjambre/auth/internal-api-secret`)**
   - **Archivo:** [`src/internal-api-secret.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/auth/src/internal-api-secret.ts).
   - **Entorno:** Servidor / Edge.
   - **Contenido:** Validación de llamadas internas entre aplicaciones (`INTERNAL_API_SECRET` con fallback a `SUPABASE_SERVICE_ROLE_KEY` en desarrollo local).
- **Punto de Entrada Extra (`./web-push`):**
  - **Archivo:** [`src/use-web-push.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/auth/src/use-web-push.ts).
  - Manejo de suscripción Web Push API con claves VAPID y registro en base de datos.

---

### 2.2. `@enjambre/ui` — Design System, Tokens y Capa de Compatibilidad

El paquete [`packages/ui`](file:///Users/macbook/Desktop/oyz%20app/packages/ui) materializa la estética de **poder silencioso y lujo territorial**:
- **Tokens Semánticos:** En [`tokens.css`](file:///Users/macbook/Desktop/oyz%20app/packages/ui/src/tokens.css) y [`tailwind-preset.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/ui/src/tailwind-preset.ts). Prohibición absoluta de colores hexadecimales hardcodeados en JSX. Solo tokens semánticos: `bg-background`, `text-foreground`, `text-primary`, `bg-card`, `border-border`, `text-destructive`.
- **Cero Consumo de Vercel Image Optimization:** Exporta `./cdn-image-loader` ([`cdn-image-loader.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/ui/src/lib/cdn-image-loader.ts)), el cual transforma URLs de Supabase Storage para servir activos WebP pre-optimizados con `Cache-Control: 31536000`, evitando agotar la cuota de 5.000 transformaciones/mes de Vercel Hobby.
- **Capa de Compatibilidad iOS 15 / Safari 15.4 ([`legacy-browser-polyfills.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/ui/src/components/legacy-browser-polyfills.tsx)):**
  Script inline ES5 que se inyecta en el `<head>` de los root layouts de las 3 apps. Instala polyfills antes de que arranque el runtime de Next.js:
  - `Array.prototype.at`, `Object.hasOwn`, `findLast`, `findLastIndex`.
  - `String.prototype.replaceAll`, `Promise.withResolvers`, `structuredClone`.
  - ES2023/24: `toSorted`, `toReversed`, `toSpliced`, `with`, `isWellFormed`, `Object.groupBy`.
- **Detección de Hardware Legacy ([`legacy-device-detect.tsx`](file:///Users/macbook/Desktop/oyz%20app/packages/ui/src/components/legacy-device-detect.tsx)):**
  Evalúa User-Agent y memoria (`deviceMemory <= 1 && hardwareConcurrency <= 2`), marcando `data-legacy="true"` en `<html>` para apagar efectos de desenfoque costosos (`backdrop-filter`) y orbes decorativos que provocarían OOM (Out Of Memory) en iPhone 7 con 2GB de RAM.
- **Componentes de Alto Nivel:**
  - `ViewShell` y `EnjTableShell`: Estructuras de vista con encabezados y tablas consistentes.
  - `ImmersiveModal`: Modales interactivos accesibles con trampa de foco y bloqueo de scroll.
  - `ClpCurrencyInput`: Input numérico con máscara de pesos chilenos sin alterar el valor crudo.
  - `friendlyError()` / `friendlySupabaseError()`: Sanitización obligatoria de errores para que nunca se muestren códigos de Postgres al usuario final.

---

### 2.3. `@enjambre/pricing` — Motor de Precios, Cost-Floor y Fidelización

El paquete [`packages/pricing`](file:///Users/macbook/Desktop/oyz%20app/packages/pricing) encapsula las reglas comerciales de la plataforma:
- **Cálculo de Carrito ([`cart-pricing.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/pricing/src/cart-pricing.ts)):** Determina subtotales, costo de flete según monto y umbrales de despacho gratuito.
- **Protección Anti-Tampering y Cost Floor ([`cost-floor.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/pricing/src/cost-floor.ts)):**
  Verifica que ningún descuento, cupón o precio mayorista sitúe el valor de venta final por debajo del piso de costo de producción y recolección nativa:
  ```typescript
  export function assertPriceAboveCostFloor(price: number, minCostFloor: number) {
    if (price < minCostFloor) {
      throw new Error('El precio final no puede ser inferior al costo de reposición territorial');
    }
  }
  ```
- **Motor de Lealtad y Quema de Puntos ([`loyalty-engine.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/pricing/src/loyalty-engine.ts) & [`loyalty-checkout.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/pricing/src/loyalty-checkout.ts)):**
  - Tasa de acumulación de puntos por compras en Tienda y Campo.
  - Límite máximo de redención (burn cap) por pedido (máximo 20% del valor de la orden pagadero con puntos para proteger el flujo de caja).
- **Tiers Guardianes ([`guardian-tier.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/pricing/src/guardian-tier.ts)):** Multiplicadores exclusivos para miembros activos del Club Legado.
- **Condiciones Mayoristas B2B ([`wholesale-conditions.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/pricing/src/wholesale-conditions.ts)):** Matriz de precios por volumen para hoteles de lujo, restaurantes gourmet y tiendas especializadas.

---

### 2.4. `@enjambre/contable` — Normativa Tributaria Chilena y Parsers DTE

El paquete [`packages/contable`](file:///Users/macbook/Desktop/oyz%20app/packages/contable) codifica las leyes del Servicio de Impuestos Internos (SII) de Chile:
- **Validación de RUT Chileno ([`rut.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/contable/src/domain/rut.ts)):**
  Implementa el algoritmo canónico Módulo 11 con dígito verificador (`0-9`, `K`). Limpieza de puntos y guiones.
- **Modelos de Impuestos Chilenos ([`impuestos.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/contable/src/domain/impuestos.ts)):**
  - IVA general: 19%.
  - ILA (Impuesto a las Bebidas Alcohólicas / Hidromiel si aplica).
  - Retenciones de segunda categoría (boletas de honorarios).
- **Cambio de Sujeto del IVA ([`cambio-sujeto.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/contable/src/domain/cambio-sujeto.ts)):**
  Modela la normativa legal chilena donde la empresa compradora retiene y declara el IVA en adquisiciones a pequeños recolectores apícolas tradicionales que no emiten facturas.
- **Formularios Tributarios Oficiales:**
  - **F29 ([`f29.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/contable/src/domain/f29.ts)):** Declaración mensual de débitos y créditos fiscales, PPM y retenciones.
  - **F22 ([`f22.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/contable/src/domain/f22.ts)):** Balance anual de impuesto a la renta.
  - **PPM ([`ppm.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/contable/src/domain/ppm.ts)):** Cálculo dinámico del Pago Provisional Mensual según tasa vigente.
- **Generación y Parseo DTE XML ([`dte-xml.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/contable/src/domain/dte-xml.ts)):**
  Genera la estructura XML firmada del SII para Boletas (39), Facturas (33), Guías de Despacho (52) y Notas de Crédito (61).
- **Orquestador y 15 Parsers de Recibos ([`receipt-orchestrator.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/contable/src/domain/receipt-orchestrator.ts) & `receipt-parsers/`):**
  Parsers especializados para extraer automáticamente montos, RUT emisor y fechas desde comprobantes de Servipag, Transbank, Uber, Copec, Starken, Sodimac, Mercado Pago y boletas electrónicas estándar.

---

### 2.5. `@enjambre/fiscal` — Emisión Nativa y Pipeline de Documentos

El paquete [`packages/fiscal`](file:///Users/macbook/Desktop/oyz%20app/packages/fiscal) depende de `@enjambre/contable` y opera como el motor fiscal de ejecución en Núcleo BFF:
- **Emisión DTE ([`fiscal-documents.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/fiscal/src/fiscal-documents.ts)):**
  Asigna folios timbrados, genera el timbre electrónico (TED) con clave RSA y emite el documento oficial.
- **Guardián de Folios CAF ([`caf-guard.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/fiscal/src/caf-guard.ts)):**
  Monitorea el inventario de folios autorizados por el SII en el Código de Autorización de Folios (CAF). Emite alertas críticas cuando quedan menos del 15% de folios disponibles o restan menos de 30 días para su expiración.
- **Ingesta Documental con OCR ([`document-ingestion.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/fiscal/src/document-ingestion.ts)):**
  Procesa facturas y comprobantes en PDF (usando `pdf-parse`) o imágenes JPG/PNG (usando `tesseract.js`) para extraer automáticamente el texto y tipificar el gasto.
- **Idempotencia de Gastos ([`gasto-idempotency.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/fiscal/src/gasto-idempotency.ts)):**
  Calcula un hash SHA-256 combinando `RUT Emisor + Tipo DTE + Folio`. Si un operador intenta subir dos veces la misma factura, el sistema la rechaza inmediatamente sin duplicar el crédito fiscal.

---

## 3. Análisis de los 12 Paquetes Restantes

---

### 3.1. `@enjambre/database` — Fuente de Verdad del Esquema SQL
- **Ubicación:** [`packages/database`](file:///Users/macbook/Desktop/oyz%20app/packages/database).
- **Responsabilidad:**
  - Contiene **324 migraciones SQL** ordenadas cronológicamente en `supabase/migrations/`.
  - Mantiene el archivo de tipos TypeScript autogenerado [`database.types.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/database/database.types.ts).
  - Nunca se importa SQL en runtime de producción: su único propósito es servir como contrato de tipos estáticos (`Database['public']['Tables']...`) para las aplicaciones y BFFs.

---

### 3.2. `@enjambre/logistica` — Distribución Territorial y Couriers
- **Ubicación:** [`packages/logistica`](file:///Users/macbook/Desktop/oyz%20app/packages/logistica).
- **Responsabilidad:**
  - Modela la **División Político-Administrativa de Chile (DPA)** en [`chile-dpa.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/logistica/src/chile-dpa.ts), con especial detalle en las 10 comunas del Archipiélago de Chiloé (Castro, Ancud, Chonchi, Curaco de Vélez, Dalcahue, Puqueldón, Queilén, Quellón, Quemchi, Quinchao).
  - Integración con couriers nacionales (Chilexpress, Starken, Blue Express) y cálculo de tarifas por peso volumétrico en [`couriers.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/logistica/src/couriers.ts) y [`shipping-rates.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/logistica/src/shipping-rates.ts).

---

### 3.3. `@enjambre/banco-chile` — API Empresas y Conciliación Bancaria
- **Ubicación:** [`packages/banco-chile`](file:///Users/macbook/Desktop/oyz%20app/packages/banco-chile).
- **Responsabilidad:**
  - Cliente de integración con la API de Empresas del Banco de Chile ([`client.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/banco-chile/src/client.ts)).
  - Consulta de saldos, cartola de transferencias entrantes y conciliación automática con órdenes de compra de Tienda y terminales SumUp de Campo.

---

### 3.4. `@enjambre/sumup` — Terminales de Pago Móvil POS
- **Ubicación:** [`packages/sumup`](file:///Users/macbook/Desktop/oyz%20app/packages/sumup).
- **Responsabilidad:**
  - Cliente oficial de comunicación con la API de SumUp ([`client.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/sumup/src/client.ts)).
  - Inicialización de checkouts en lectores físicos SumUp Solo y Air, sondeo de estado (`pollStatus`) y conciliación de comisiones cobradas por la pasarela.

---

### 3.5. `@enjambre/wallet` — Pasaporte Biocultural Apple & Google Wallet
- **Ubicación:** [`packages/wallet`](file:///Users/macbook/Desktop/oyz%20app/packages/wallet).
- **Responsabilidad:**
  - Generación de pases digitales para smartphones:
    - **Apple Wallet:** Genera archivos `.pkpass` firmados con certificados criptográficos de Apple PassKit.
    - **Google Wallet:** Genera tokens JWT para pases de Google Pay.
  - Visualiza el balance de puntos, el rango de membresía (Guardián del Bosque) y el sello QR personal del comprador para canjear beneficios en ferias.

---

### 3.6. `@enjambre/resenas` — Sistema de Calificaciones y Reseñas
- **Ubicación:** [`packages/resenas`](file:///Users/macbook/Desktop/oyz%20app/packages/resenas).
- **Responsabilidad:**
  - Valida la elegibilidad de reseñas ([`eligibility.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/resenas/src/eligibility.ts)).
  - Distingue entre **Reseñas Públicas Abiertas** y **Reseñas Verificadas de Guardianes**, las cuales solo pueden ser emitidas por clientes con una orden de compra comprobada en base de datos.

---

### 3.7. `@enjambre/calendar` — Calendario Apícola y Territorial
- **Ubicación:** [`packages/calendar`](file:///Users/macbook/Desktop/oyz%20app/packages/calendar).
- **Responsabilidad:**
  - Motor de eventos temporales que sincroniza:
    - Floraciones del bosque nativo de Chiloé (época de floración de Ulmo, Tiaca, Tepú).
    - Calendario de recolección de miel y postura de reinas vírgenes.
    - Eventos y ferias comerciales programadas.
    - Fechas límite tributarias (F29, declaraciones juradas del SII).

---

### 3.8. `@enjambre/rate-limit` — Limitador de Frecuencia Distribuido
- **Ubicación:** [`packages/rate-limit`](file:///Users/macbook/Desktop/oyz%20app/packages/rate-limit).
- **Responsabilidad:**
  - Algoritmo de ventana deslizante (*sliding window*) basado en Upstash Redis ([`index.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/rate-limit/src/index.ts)).
  - Si las variables de Upstash no están configuradas (desarrollo local / offline), conmuta de manera transparente a un limitador en memoria para no romper el entorno de pruebas.

---

### 3.9. `@enjambre/sale-qr` — Sellos Criptográficos de Autenticidad
- **Ubicación:** [`packages/sale-qr`](file:///Users/macbook/Desktop/oyz%20app/packages/sale-qr).
- **Responsabilidad:**
  - Genera y valida códigos QR de seguridad para los envases físicos de miel ([`index.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/sale-qr/src/index.ts)).
  - Incluye firma HMAC para garantizar que el frasco proviene efectivamente de un lote auditado de Enjambre Legado y prevenir adulteraciones o falsificaciones de marca.

---

### 3.10. `@enjambre/shop-chrome` — Configuración CMS y Apariencia
- **Ubicación:** [`packages/shop-chrome`](file:///Users/macbook/Desktop/oyz%20app/packages/shop-chrome).
- **Responsabilidad:**
  - Define los contratos de datos del CMS dinámico de Tienda:
    - Marca, logo y eslogan ([`brand.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/shop-chrome/src/brand.ts)).
    - Estructura del menú de cabecera ([`header-menu.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/shop-chrome/src/header-menu.ts)).
    - Paleta de colores y tipografía ([`typography.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/shop-chrome/src/typography.ts)).
    - Modos estacionales de recolección ([`seasonal.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/shop-chrome/src/seasonal.ts)).
  - Permite que el editor visual en Núcleo persista la configuración y la Tienda la consuma de forma tipada sin recompilar el código.

---

### 3.11. `@enjambre/ciencia` — Catálogo de Evidencia Biológica
- **Ubicación:** [`packages/ciencia`](file:///Users/macbook/Desktop/oyz%20app/packages/ciencia).
- **Responsabilidad:**
  - Registro de afirmaciones científicas y propiedades bioactivas de la miel de bosque nativo ([`index.ts`](file:///Users/macbook/Desktop/oyz%20app/packages/ciencia/src/index.ts)).
  - **Gate Estricto de Veracidad:** Solo permite desplegar en la Tienda afirmaciones que cuenten con al menos tres fuentes bibliográficas trianguladas (análisis de laboratorio certificados, estudios botánicos universitarios o publicaciones indexadas).

---

### 3.12. `@enjambre/impacto` — Métricas de Libro Abierto y Regeneración
- **Ubicación:** [`packages/impacto`](file:///Users/macbook/Desktop/oyz%20app/packages/impacto).
- **Responsabilidad:**
  - Fórmulas de cálculo de impacto biocultural de libro abierto (*Open Book Methodology*).
  - Computa la preservación de colmenas de abeja virgen, hectáreas de bosque nativo protegidas y retorno social de la inversión (SROI) por cada compra realizada.

---

## 4. Matriz de Dependencias Cruzadas entre Paquetes

```
┌────────────────────┐      ┌────────────────────┐
│ @enjambre/contable │ ◄────┤  @enjambre/fiscal  │
└─────────┬──────────┘      └────────────────────┘
          │
          │ (Tipos e interfaces DTE)
          ▼
┌────────────────────┐      ┌────────────────────┐
│  @enjambre/pricing │ ◄────┤@enjambre/shop-chrome
└────────────────────┘      └────────────────────┘
          │
          ▼
┌────────────────────┐
│   @enjambre/auth   │ ◄──── (Consumido por las 3 aplicaciones)
└────────────────────┘
          │
          ▼
┌────────────────────┐
│   @enjambre/ui     │ ◄──── (Base visual de las 3 aplicaciones)
└────────────────────┘
```

---

## 5. Invariantes de Ingeniería de Paquetes

1. **Named Exports Exclusivos:** Ningún paquete exporta componentes o utilidades como `default export` (salvo páginas App Router de Next.js según la regla de convención del framework).
2. **TypeScript Estricto:** Prohibido el uso de `any`. Se exige tipado estricto con `unknown` y validación mediante *type guards* o schemas Zod.
3. **Aislamiento Server/Client en `@enjambre/auth`:** Ningún componente de cliente debe importar desde `@enjambre/auth/server-index` o `@enjambre/auth/internal-api-secret`, y ningún código del servidor debe importar hooks de React desde el barrel principal.
4. **Respeto a Vercel Hobby:** `@enjambre/ui` jamás debe importar ni delegar la optimización de imágenes en el optimizador por defecto de Next.js; siempre debe utilizar `@enjambre/ui/cdn-image-loader`.
