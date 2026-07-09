# Arquitectura del Sistema — Enjambre Legado

> Documento de referencia para entender la topologia completa del ecosistema.

---

## 1. Topologia del Monorepo

```
enjambre-legado/ (pnpm workspace + Turborepo)
|
|-- apps/
| |-- tienda/ Next.js 16 · React 19 · Tailwind 3
| | |-- E-commerce publico + admin comercial
| | |-- Transbank Webpay + integraciones SII
| | |-- Puerto: 3000
| |
| |-- nucleo/ Next.js 16 · React 19 · TanStack Query · Hono BFF
| | |-- Dashboard gerencial multi-rol (App Router)
| | |-- Mapas Leaflet + PostGIS + Caja/Comisiones/Reps/Leaderboard
| | |-- BFF: cash-sessions, rep-ventas, invitations, commission-rules
| | |-- EIRL contable views (absorbido de apps/eirl)
| | |-- Puerto: 3000
| |
| |-- campo/ Next.js 16 · React 19 · Tailwind 3 (src/ dir)
| | |-- POS completo: CashProvider, QuickSale, TierBadge, Leaderboard, Threshold, ClientLookup
| | |-- Puerto: 3002
|
|-- packages/
| |-- database/ Supabase + Postgres 17 + PostGIS
| | |-- Migraciones + tipos generados
| | |-- 50+ migraciones, 20+ tablas, RLS completo
| |
| |-- contable/ Logica tributaria chilena
| | |-- IVA 19%, RUT, facturas, DTE XML, receipt parsers (7), tasa-cambio, gasto-extranjero
| |
| |-- auth/ Autenticacion compartida (5 entry points)
| | |-- Supabase client + Zustand store + role redirect + security events
| |
| |-- ui/ Design system compartido
| | |-- 15 componentes + hooks + lib + Tailwind preset + tokens + icons
| |
| |-- sumup/ SumUp POS integration
| |
| |-- banco-chile/ Banco Chile Empresas API client
| |
| |-- fiscal/ Soberania fiscal (emision DTE nativa)
| |
| |-- logistica/ Gestión de envíos y transportistas
| |
| |-- pricing/ Motor de precios (multiplicadores, fidelización)
| |
| |-- resenas/ Sistema dual de reseñas (anon/guardian)
| |
| |-- wallet/ Integración con Apple/Google Wallet
|
|-- apps/tienda/components/shop/ Componentes de tienda (18 archivos activos)
|-- docs/ Documentacion (estas aqui)
|-- skills/ Supabase agent skills (gitignored)
```

---

## 2. Flujo de Datos y Autenticacion

### 2.1 Identidad Centralizada

La autenticacion se gestiona via **Supabase Auth**. La tabla `profiles` en el esquema publico es el nexo de union, vinculando el `uuid` de auth con un `role` especifico.

```console
Supabase Auth
|
v
+---------------------+
| auth.users (uuid) |
+---------------------+
|
v
+---------------------+
| profiles |
| - id (uuid FK) |
| - role (enum) |
| - full_name |
| - nivel_guardian |
+---------------------+
|
+----------+---------+-----------+-----------+
| | | |
v v v v
admin cliente creador rep_ventas
nucleo/ tienda/ nucleo/ campo/
campo/
```

### 2.2 Flujo de Datos (Campo)

```console
UI Component (campo)
|
v
Custom Hook / Server Component
|
v
Supabase (Postgres)
```

### 2.2.1 Flujo de Carrito (Tienda — localStorage + Server Action)

```
UI (CartProvider)
|
v
`lib/shop/commerce-storage.ts` → `CART_STORAGE_KEY` (`oyz_tienda_cart_v1`) en localStorage (guest + caché instantánea) ↔ `carrito_items` (usuario autenticado, multi-dispositivo)
|
v (debounce 300ms)
Server Action `calculateCartPricing` (app/actions/cart.ts)
|  → Input: solo product_id + quantity (anti-tampering)
|  → Precios desde `productos` en Supabase
|  → Rol B2B desde JWT `app_metadata.oyz_role` (+ header middleware)
|  → Multiplicadores alineados con Nucleo checkout
v
`cart.pricing` hidratado en cliente (preview UI + checkout payload)
```

**Pricing (P2)**: `@enjambre/pricing` centraliza multiplicadores (embajador 0.70, revendedor 0.80, suscriptor 0.90, volumen −5% con ≥10 ventas). Tienda Server Action y Nucleo `checkout/init` usan `computeCartPricing`; preview API: `POST {NUCLEO}/api/checkout/preview` con `{ items: [{ product_id, quantity }] }` + Bearer opcional.

**Abandono (mig. 42 + 55)**: `POST /api/cart/abandonment` recibe snapshot `{ items: [{ product_id, quantity }] }`, enriquece precios server-side, inserta en `cart_abandonment_events`. Trigger en checkout vía `useCartAbandonmentTracking` (visibility/pagehide). RLS: INSERT + SELECT propio (`user_id = auth.uid()`). Worker cron (`processCartAbandonmentEmails`): email único tras 30 min de gracia, respeta prefs `pedidos.email`; `fulfillCheckout` marca `converted=true`.

**Notificaciones signup (P1)**: Tienda `POST /api/notifications/welcome` (auth) → Nucleo `POST /api/notifications/internal/welcome` (x-internal-key) → `notification_queue` (auditoría/retry) + `notification_events` channel `in_app` (NotificationBell). Sin inserts directos desde cliente.

**Worker de notificaciones (P1+)**: Vercel Cron `GET /api/cron/notifications` cada minuto (`CRON_SECRET`) → `processNotificationQueue()` (email/WhatsApp/push/system). Reintentos `metadata.in_app` crean `notification_events` in_app si el insert síncrono falló. Trigger manual: `POST /api/notifications/trigger-worker` (admin o `x-worker-secret`).

**Notificaciones transaccionales (P1++)**: `enqueue-transactional.ts` — post-pago en `fulfillCheckout` (email + in_app, dedupe `checkout_paid:{buyOrder}`); post-despacho en `PATCH /api/logistica/envios/:id` cuando status → enviado/en tránsito (dedupe `shipment_dispatched:{envioId}:{status}`).

**In-app unificado (P2)**: `notification_events` (`channel=in_app`, `created_by=user`) es la SoT para NotificationBell en tienda y núcleo. Hook compartido `useInAppNotifications` en `@enjambre/auth`. Tabla `alerts` queda legada (sin nuevos inserts). Leído/no-leído en `localStorage` (`oyz-notif-read-{userId}`).

**Preferencias de notificación (P2)**: `profiles.notification_preferences` JSONB — categorías `pedidos`, `floracion`, `sistema` × canales `in_app` / `email`. UI en tienda `/perfil/ajustes#notificaciones`. `enqueue-transactional` y `internal/welcome` consultan prefs antes de encolar; si ambos canales están off, registra dedupe en `notification_queue` con `skipped_preferences: true`.

**Carrito multi-dispositivo (P2)**: Tabla `carrito_items` (`user_id`, `product_id`, `quantity`). Guest → solo localStorage. Login → `mergeCartOnLogin` suma cantidades local+remoto y persiste. Cambios con sesión → debounce 500ms → `syncRemoteCart`. Realtime (mig. 58): suscripción `postgres_changes` en `carrito_items` recarga carrito cross-tab/dispositivo. Checkout exitoso → `clear` local + remoto. RLS: CRUD propio (`user_id = auth.uid()`).

### 2.3 Flujo de Pagos e Inventario (Tienda → Nucleo)

```
Checkout (tienda/frontend)
|
v
POST {NUCLEO}/api/checkout/init (BFF Hono en nucleo)
|  → Verifica precios + stock en Supabase
|  → Persiste sesión en checkout_sessions (Postgres)
|  → Retorna URL + token del provider
v
Transbank SDK (Webpay) / Flow.cl
|
v
POST {NUCLEO}/api/checkout/commit (BFF Hono en nucleo)
|  → Lee sesión desde checkout_sessions (Postgres, no memoria)
|  → Idempotente: solo completa si status = 'pending'
|  → INSERT venta + decrement_stock() RPC
|  → TRIGGER trg_sync_lote_stock
|    → Descuenta peso_neto_g del kg_total en tabla LOTES
|  → Marca sesión como 'completed'
|  → get_ecosystem_metrics() refleja impacto CO2 real
v
Dashboard Nucleo (Vista Admin/Operaciones)
|  → Refleja stock real de lotes en tiempo real
```

**Tabla de sesiones**: `checkout_sessions` (Migration 38) — RLS service_role only, auto-expire 30 min, audit trail completo.

**Cliente tienda (consolidado)**: `cart-checkout-client.ts` inicia pago; `payment-redirect.ts` redirige Flow/Transbank; `payment-commit.ts` confirma en `/checkout/resultado`. Storage: `PENDING_CHECKOUT_STORAGE_KEY` en `commerce-storage.ts`.

### 2.3.1 Flujo Reposición (suscripción por intervalo)

```
PDP / perfil / sheet reposición (tienda)
|
v
startSubscriptionCheckout() → POST {NUCLEO}/api/subscriptions/checkout/init
|  → delivery_address en subscription_checkout_sessions (mig. 83)
v
Flow / Transbank → /perfil/reposicion/resultado
|
v
commitPayment() → POST {NUCLEO}/api/subscriptions/checkout/commit
|  → fulfillSubscription() (reactiva past_due o crea suscripción)
v
Gestión: PATCH /api/subscriptions (pause / resume / cancel)
|  → subscription-route-handlers.ts + subscription-api.ts
v
Cron: POST {NUCLEO}/api/replenishment/cron/process (alias legacy /api/ritual/cron)
|  → RPC process_ritual_renewals() (mig. 84)
```

**Fuente única datos perfil**: `subscription-dashboard.ts` (`fetchSubscriptionDashboard`) — usado por SSR `/perfil/reposicion` y `GET /api/subscriptions`.

**Estados compartidos**: `@enjambre/pricing` → `SUBSCRIPTION_VISIBLE_STATUSES`, `SUBSCRIPTION_BLOCKING_STATUSES`.

**Legacy**: `/perfil/ritual` → redirect permanente a `/perfil/reposicion` (`next.config.ts` + páginas App Router).

### 2.4 Flujo Contable (Nucleo BFF)

```console
Nucleo (frontend)
|
v
BFF Hono (apps/nucleo /api/[[...routes]])
|-- auth.ts → valida JWT via Supabase Auth
|-- tenant.ts → resuelve empresa via x-empresa-id
|
v
/packages/contable → calcula IVA, neto, total
|
v
Supabase: facturas_emitidas, gastos, impuestos
```

---

## 3. Aplicaciones — Detalle Completo

### 3.1 Tienda (`@enjambre/tienda`)

**Stack**: Next.js 16.2.1 + React 19.2.4 + Tailwind CSS 3.3 + GSAP 3.15 + Hono 4 BFF

**Auth**: Middleware `middleware.ts` propio con `updateSession()` + CSRF validation + admin route guard + `logAccessDenied()` que posta a nucleo BFF (`POST /api/security-events/internal` con `x-internal-key`). `access_denied` logging activo.

**Rutas publicas**:
- `/` Landing editorial premium
- `/catalogo` Catalogo de productos con filtros (metadata completa + JSON-LD ItemList)
- `/producto/[slug]` Ficha de producto con trazabilidad (generateMetadata dinamico + JSON-LD Product)
- `/checkout` Flow de pago (Transbank)
- `/impacto` Pagina de impacto ambiental
- `/nosotros`, `/contacto`, `/experiencias`, `/galeria`, `/ciencia` (metadata completa + OG + canonical)
- `/login`, `/register`

**Rutas admin** (`/(admin)/`):
- `/dashboard` Panel general
- `/products`, `/orders`, `/customers`, `/collections` CRUD
- `/integrations` SII, bancos, notificaciones

**API Routes (tienda — BFF ligero)**:
- `/api/subscriptions` — GET dashboard reposición, PATCH pause/resume/cancel, POST 410 (alta vía Núcleo)
- `/api/agents/subscription` — mismo contrato PATCH/GET para agentes
- `/api/cart/abandonment`, `/api/loyalty`, `/api/pre-orders`, `/api/referrals/complete`
- Pagos carrito y reposición: **no** en tienda; delegados a Núcleo (`NEXT_PUBLIC_NUCLEO_API_URL`)

**Libs comercio** (`apps/tienda/lib/shop/`): `commerce-storage`, `cart-checkout-client`, `subscription-checkout-client`, `payment-commit`, `subscription-dashboard`, `subscription-route-handlers`, `replenishment-address`, `replenishment-i18n`.

**Integraciones**:
- **Núcleo BFF** — checkout, reposición, wallet, reseñas (Flow + Transbank vía Núcleo)
- **SII** — Sincronizacion tributaria (stub)
- **Bancos** — Conciliacion bancaria (stub)
- **Notificaciones** — Eventos de notificacion (stub)

**Entorno**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (o PUBLISHABLE), `TRANSBANK_*`, `SUPABASE_SERVICE_ROLE_KEY`

**Vercel (monorepo)** — obligatorio por proyecto:
| Proyecto | Root Directory | Build filter |
|----------|----------------|--------------|
| tienda | `apps/tienda` | `@enjambre/tienda` |
| nucleo | `apps/nucleo` | `@enjambre/nucleo` |
| campo | `apps/campo` | `@enjambre/campo` |

No usar `vercel.json` en la raíz del repo para build (evita desplegar núcleo en un proyecto tienda). Config por app: `apps/tienda/vercel.json`, etc. Script: `pnpm go-live:vercel-setup`.

Prod verificada: `tienda-eta-lime.vercel.app`, `campo-olive.vercel.app`, `nucleo-theta.vercel.app` (200 en `/`). Un preview con **404 en todas las rutas** (`x-matched-path: /_not-found`) indica Root Directory o `outputDirectory` mal configurados — redeploy tras corregir.

---

### 3.2 Nucleo (`@enjambre/nucleo`)

**Stack**: Next.js 16.2.6 + React 19 + TanStack Query 5.96 + Leaflet + Zustand + Hono 4 BFF (App Router `/api/[[...routes]]`)

**SEO**: `robots: noindex, nofollow` — app privada, no indexable por motores de busqueda.

**Vistas por rol** (App Router con sidebar filtrado por rol):

| Ruta | Rol | Componente | Funcionalidad |
|---|---|---|---|
| `/` | Todos | Auth | Login/register |
| `/mapa` | admin | MapaView | Mapa interactivo (apiarios, arboles, ferias, ventas) |
| `/caja` | admin | CashSessionsPanel | Sesiones de caja, CSV export, alertas Δ |
| `/reps` | admin | RepsPanel | Gestión reps, tier override |
| `/comisiones` | admin | ComisionesPanel | Comisiones con Tier + Canal |
| `/invitaciones` | admin | InvitacionesPanel | Códigos invitación + redenciones |
| `/reglas-comision` | admin | ReglasComisionPanel | 6 rule_types (base, channel_rate, volume_threshold, loyalty, streak, tier_bonus) |
| `/leaderboard` | admin | LeaderboardPanel | Ranking semanal (stat cards + top 3 + tabla) |
| `/contable` | admin | ContableView | Integracion contable via BFF |
| `/eirl` | admin | EIRL views | Contabilidad EIRL (absorbido de apps/eirl) |
| `/catalogo`, `/catalogo/productos` | admin | — | Catálogo y gestión de productos |
| `/crm` | admin | CRMView | CRM de Representantes de Venta (rep_ventas) |
| `/ejecutivo` | admin | — | Dashboard ejecutivo |
| `/comunidad` | admin | — | Gestión de comunidad |
| `/operaciones` | admin | — | Operaciones logísticas |
| `/conciliacion` | admin | — | Conciliación bancaria |
| `/pagos` | admin | — | Gestión de pagos |
| `/sii` | admin | SiiDteView | Sincronización SII/DTE |
| `/calculos-ia` | admin | — | Cálculos de IA |
| `/vanguardia` | admin | — | Arquitectura vanguardia |

**Entorno**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

### 3.3 Campo (`@enjambre/campo`)

**Stack**: Next.js 16.2.6 + React 19.2.0 + Tailwind CSS 3.4 (src/ dir)

**SEO**: `robots: noindex, nofollow` — app privada, no indexable por motores de busqueda.

**Rutas**:
- `/` Landing
- `/login` Autenticacion
- `/pos` POS principal (3 links: Venta Rapida, Carrito, Historial)
- `/pos/catalogo` Catalogo POS (rep_ventas / admin)
- `/pos/carrito` Carrito POS (integrado con cash session, channel + metodo_pago selectors)
- `/pos/historial` Historial 4 tabs (Curva volumen, Comisiones, Sesiones caja, Ranking leaderboard)
- `/api/pos/venta` POST (fallback local sin sesion de caja)
- `/setup-error` Error cuando Supabase no esta configurado

**Auth**: Middleware propio con custom `logAccessDenied()` que posta a nucleo BFF (`POST /api/security-events/internal` con `x-internal-key`). No usa `createAuthMiddleware` directamente. Middleware protege `/pos/*` con redirect a `/login` si no autenticado.

**Middleware**: Auth guard en `/pos/*` + manejo de sesion Supabase con graceful degradation. Si faltan variables, reescribe a `/setup-error` en vez de crashear. `access_denied` se logea via BFF internal route.

**Styling**: 100% semantic Tailwind tokens (`bg-background`, `text-foreground`, `text-primary`, `bg-card`, `border-border`, `text-muted-foreground`, `text-destructive`, `text-primary-foreground`, `bg-surface-raised`, `bg-surface-sunken`). Sin colores hardcoded. Tokens mapeados en `tailwind.config.js` desde `@enjambre/ui` CSS variables.

**Offline**: Campo opera conectado a Supabase. Offline-first no implementado (no requerido por caso de uso).

**Entorno**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (o PUBLISHABLE), `NEXT_PUBLIC_NUCLEO_API_URL` (BFF endpoint para cash sessions/comisiones)

---

### 3.4 Nucleo BFF (Hono dentro de Next.js)

**Stack**: Hono 4 + Zod + Supabase client (server-side)

**Middleware pipeline**: `authMiddleware` (valida JWT) → `tenantMiddleware` (resuelve empresa) → Route Handler

**Rutas BFF** (montadas en `/api/[[...routes]]/route.ts`):

| Prefijo | Archivo | Descripcion |
|---|---|---|
| `/api/cash-sessions` | `cash-sessions.ts` | Abrir/cerrar/reconciliar sesiones de caja + GET /export/csv |
| `/api/rep-ventas` | `rep-ventas.ts` | Venta rápida (4 toques), estado comisiones, historial (week/month/quarter), tier-progress, leaderboard |
| `/api/invitations` | `invitations.ts` | Canje público + admin CRUD invitaciones, reps, pagos |
| `/api/commission-rules` | `commission-rules.ts` | CRUD reglas comisión (6 tipos) + dashboard |
| `/api/dashboard/resumen` | `dashboard-resumen.ts` | Dashboard gerencial: 17 queries paralelas (colmenas, apiarios, cosechas, ventas, caja, comisiones, leaderboard) |
| `/api/security-events` | `security-events.ts` | Logging de eventos de seguridad: `POST /` (auth Bearer) + `POST /internal` (x-internal-key) |
| `/api/contable/*` | `contable.ts` | Dashboard, facturas emitidas |
| `/api/banco-chile/*` | `banco-chile/` | Config, cuentas, movimientos, conciliacion, transferencias, nominas, documentos, cotizaciones, rentas, montos, webhook |
| `/api/creadores` | `creadores.ts` | Gestión de creadores |
| `/api/sumup` | `sumup.ts` | SumUp POS integration |
| `/api/sii` | `sii.ts` | Sincronización SII |
| `/api/facturas-emitidas` | `facturas-emitidas.ts` | CRUD facturas emitidas |
| `/api/gastos` | `gastos.ts` | CRUD gastos |
| `/api/terceros` | `terceros.ts` | CRUD terceros |
| `/api/eirl-dashboard` | `eirl-dashboard.ts` | Dashboard EIRL |
| `/api/reportes` | `reportes.ts` | Reportes contables |
| `/api/calculos-ia` | `calculos-ia.ts` | Cálculos IA |
| `/api/costeo` | `costeo.ts` | Costeo de productos |
| `/api/cms` | `cms.ts` | CMS content management |
| `/api/logistica` | `logistica.ts` | Logística y envíos |
| `/api/produccion` | `produccion.ts` | Producción y trazabilidad |
| `/api/crm` | `crm.ts` | CRM de Representantes de Venta (rep_ventas) |
| `/api/dashboard/ejecutivo` | `dashboard-ejecutivo.ts` | Dashboard ejecutivo |
| `/api/health/*` | `health.ts` | Liveness, readiness |

**Tipos**: `AppVariables` (user, accessToken, supabase, empresaId, rol)

**Entorno**: `PORT` (3001), `SUPABASE_URL`, `SUPABASE_ANON_KEY`

---

## 4. Paquetes — Detalle Completo

### 4.1 `@enjambre/database`

Fuente de verdad del esquema. 10 migraciones que cubren:

| # | Migracion | Dominio |
|---|---|---|
| 00 | Schema inicial | 20+ tablas base (identidad, apiarios, colmenas, productos, ventas, etc.) |
| 01 | RLS policies | Roles, funciones `current_role()`, `is_admin()` |
| 02 | Storage buckets | colmenas, productos, arboles (public), fuentes (restringido) |
| 03 | Productos slug | Columna slug con indice unico parcial |
| 04 | Integrations | Tabla de configuracion de servicios externos |
| 05 | Contable core | Multi-empresa: empresas, usuarios_empresas, terceros, facturas |
| 05 | Data sources | Ingesta: boletas, movimientos bancarios, sync SII |
| 06 | Contable RLS | `has_empresa_access()`, multi-tenant |
| 07 | Job runs | Audit log de integraciones con tracking de estado |
| 10 | Site content | CMS para contenido dinamico de la landing |
| 14 | Creadores | Codigo_ref, comisiones, portal auto-servicio |
| 28 | Cierres de caja + comisiones + invitaciones | cash_sessions, commission_rules/records, invitation_codes/redemptions, rep_profiles, vistas, triggers, RLS, semilla |
| 29 | Tier automático | evaluar_tier_rep(), tier_progress_rep(), tier_override, tier_promoted_at, trigger on_rep_profile_tier_check |
| 30 | Tier bonus comisión | calcular_comision_venta() con tier_multiplier, columna tier_multiplier en commission_records, seed tier_bonus |
| 31 | Channel rate comisiones | calcular_comision_venta() con channel_rate lookup, columna channel_rate en commission_records, seed channel_rate |
| 32 | RLS hardening | 6 parches: commission_rules split, commission_records INSERT restrict, rep_profiles soft-delete, cash_sessions UPDATE restrict |
| 33 | Leaderboard semanal | weekly_leaderboard(p_empresa_id), SECURITY DEFINER STABLE, top 20 reps |
| 37 | Security events Phase 5 | CHECK event_type + `access_denied`/`signup_success`, RLS anon INSERT para pre-auth events |

**Comandos**: `db:push` (push schema), `db:typegen` (generar tipos TS)

### 4.2 `@enjambre/contable`

Logica tributaria chilena pura, sin dependencias de framework:

| Modulo | Funciones |
|---|---|
| `rut.ts` | `normalize()`, `validate()`, `format()` — Digito verificador |
| `impuestos.ts` | `calcularIVA()`, `calcularNetoDesdeTotal()`, `calcularTotal()` — 4 decimales |
| `factura.ts` | Zod schemas: `FacturaEmitidaInput`, `FacturaEmitidaOutput` |
| `gasto-extranjero.ts` | 7 proveedores digitales, deteccion, conversion CLP |
| `receipt-parsers/` | Uber, Meta, Google, AWS, Shopify, Stripe, Hostinger |
| `dte-xml.ts` / `sii-dte.ts` | XML DTE, tipos SII |
| `api.ts` | Tipos genericos: `ApiSuccess<T>`, `ApiError` |

Ver [`packages/contable/README.md`](../packages/contable/README.md). **79 tests Vitest.**

### 4.2.1 Soberania fiscal (plan `@enjambre/fiscal`)

Estrategia y Pipeline Técnico: [`SOBERANIA_FISCAL.md`](./SOBERANIA_FISCAL.md). Emision e ingestión **nativas** — sin facturadores terceros.

### 4.3 `@enjambre/auth`

Autenticacion y clientes Supabase compartidos para apps Next.js. **5 puntos de entrada**:

**`@enjambre/auth`** (cliente/browser):
| Modulo | Funcionalidad |
|---|---|
| `supabase.ts` | `createClient()` (singleton, null-safe, soporta PUBLISHABLE_DEFAULT_KEY), `createAdminClient()` (service_role), `getSupabaseUrl()`, `getSupabaseKey()`, `isSupabaseConfigured()` |
| `auth-store.ts` | Zustand store: `user`, `session`, `isAuthenticated`, `isLoading`, `appSource` (`AppSource` = 'nucleo'\|'tienda'\|'campo'\|'api'), `checkUser()`, `signOut()` (logea `session_revoked` con `appSource` dinamico), `setAppSource()`, `refreshSession()` |
| `auth-provider.ts` | `useAuthProvider()` — hook que sincroniza `onAuthStateChange` con Zustand store |
| `hooks.tsx` | `useRoleBasedRedirect` — redirige segun rol post-login |
| `security-events.ts` | `logSecurityEvent`, `fetchSecurityEvents`, `isRepeatedFailure` — 13 tipos de evento |
| `role-redirect.ts` | `ROLE_REDIRECT_MAP` (rol→ruta), `ROUTE_ROLE_GUARDS` (ruta→roles), `ALL_ADMIN_ROLES`, `getRoleRedirectPath()`, `isRouteAllowed()`, `RoleKey`, `LEGACY_ROLE_MAP` |
| `use-security-alerts.ts` | `useSecurityAlerts` hook para monitoreo de eventos de seguridad |

**`@enjambre/auth/browser`** (browser-only subset):
| Modulo | Funcionalidad |
|---|---|
| `supabase.ts` | `createClient()`, `createAdminClient()`, `getSupabaseUrl()`, `getSupabaseKey()`, `isSupabaseConfigured()` |

**`@enjambre/auth/server-index`** (server-only):
| Modulo | Funcionalidad |
|---|---|
| `server.ts` | `createServerClientFromCookies()` — cliente RSC con `next/headers` |
| `middleware.ts` | `createAuthMiddleware()` — factory de middleware Next.js con timeout, rutas publicas, redirect por rol + route guards |
| `bff.ts` | `createSupabaseUserClient()` — cliente Hono BFF con Bearer token |

**`@enjambre/auth/security-events`** (server-safe, sin React):
| Modulo | Funcionalidad |
|---|---|
| `security-events.ts` | `logSecurityEvent()`, `fetchSecurityEvents()`, `isRepeatedFailure()`, tipos `SecurityEventType`, `SecurityEvent`, `SecurityEventPayload`, `AppSource` |

**`@enjambre/auth/role-redirect`** (server-safe, sin React):
| Modulo | Funcionalidad |
|---|---|
| `role-redirect.ts` | `LEGACY_ROLE_MAP`, `RoleKey`, `ROLE_REDIRECT_MAP`, `ALL_ADMIN_ROLES`, `ROUTE_ROLE_GUARDS`, `getRoleRedirectPath()`, `isRouteAllowed()` |

**Uso en apps**: Nucleo usa `@enjambre/auth` via re-exports en `@/lib/` (71 consumidores). `useAuthProvider()` hook en root. Middleware usa `createAuthMiddleware()` de `@enjambre/auth/middleware`. Tienda tiene `middleware.ts` propio con `updateSession()` + CSRF + admin guard + `access_denied` logging. Campo tiene middleware propio con `logAccessDenied()` que posta a nucleo BFF. Los archivos `env.ts` locales son necesarios para evitar que Turbopack resuelva el barrel de `@enjambre/auth` (que incluye hooks de React) en contextos server-side.

**Eventos de seguridad** (13 tipos — Phase 5 logging centralizado):

| Tipo | Descripcion |
|---|---|
| `login_success`, `login_failed` | Autenticacion |
| `password_reset_requested`, `password_changed` | Password |
| `account_locked`, `suspicious_activity` | Seguridad |
| `role_change` | Permisos |
| `session_revoked` | Logout |
| `mfa_enabled`, `mfa_disabled` | MFA |
| `oauth_linked` | OAuth |
| `access_denied` | Route guard (middleware) |
| `signup_success` | Registro |

| Ubicacion | Eventos | Mecanismo |
|---|---|---|
| Login page (3 apps) | `login_success`, `login_failed`, `password_reset_requested`, `signup_success` | `logSecurityEvent(supabase, ...)` directo |
| Nucleo middleware | `access_denied` | Fire-and-forget `POST /api/security-events/internal` con `x-internal-key` |
| Campo middleware | `access_denied` | Fire-and-forget `POST /api/security-events/internal` (via BFF nucleo) |
| Tienda middleware | `access_denied` | Fire-and-forget `POST /api/security-events/internal` (local origin) |
| Auth store `signOut()` | `session_revoked` | `logSecurityEvent(supabase, ...)` antes de `supabase.auth.signOut()`, con `appSource` dinamico |

**BFF route de seguridad** (`/api/security-events`):
- `POST /` — autenticado via Bearer token (`authMiddleware`) para client-side logging
- `POST /internal` — autenticado via `x-internal-key` = `SUPABASE_SERVICE_ROLE_KEY` para middleware/Edge logging

**RLS en `security_events`**:
- SELECT: `is_admin()` (consolidated role)
- INSERT (auth): `auth.uid() IS NOT NULL`
- INSERT (anon): solo para `login_failed`, `password_reset_requested`, `signup_success`

### 4.4 `@enjambre/ui`

Design system compartido. 3 subpaths: `@enjambre/ui`, `@enjambre/ui/tokens.css`, `@enjambre/ui/tailwind-preset`.

**Componentes** (16+): `Button`, `Card`, `Badge`, `Input`, `Textarea`, `StatCard`, `Spinner`, `EmptyState`, `SectionHeader`, `GrainOverlay`, `ModuleHero`, `ImmersiveModal`, `Dialog` (Radix), `Sidebar`, `ThemeProvider`, `ThemeToggle`, `ToastProvider`, `ViewLoading`, `NotificationBell`, etc.

**Overlays / modales** (`packages/ui/src/lib/overlay-layer.ts`):

| Capa | z-index | Uso |
|---|---|---|
| Chrome tienda (nav, sidebars) | 60–82 | No bloquea modales admin |
| `Dialog` + `ImmersiveModal` backdrop | 220 | `bg-background/72 backdrop-blur-md` |
| Panel modal | 221 | Contenido interactivo |
| Toasts | 9999 | Errores/éxito sobre modales abiertos |

- **`Dialog`**: Radix — focus trap nativo, fondo inert. Formularios cortos con trigger (único uso hoy: `QuickActionAddStock`).
- **`ImmersiveModal`**: layouts admin (aside, footer). Focus trap manual; ~15 vistas en núcleo.
- **`OverlayFullscreen`**: herramientas admin a pantalla completa (`StoreEditorModal`). Backdrop compartido; sin cierre accidental por clic en fondo.
- **`TiendaModal`**: retail sheet/panel en `apps/tienda` (CSS `globals.css`); backdrop 72% alineado a `overlay-layer`; `useModalFocusTrap` compartido con `ImmersiveModal`.

Regla: no introducir `fixed inset-0` con z-index propio; reutilizar tokens o componentes anteriores.

**Hooks** (3): `useTheme` (light/dark/system), `toast` (sonner wrapper), `useToast` (context)

**Icons** (24): Re-exports Lucide icons centralizados

**Lib utilities** (4): `cn` (clsx+twMerge), `formatDate`/`formatDateShort`/`formatCLP`/`fmtCLP`, `friendlySupabaseError`/`friendlyApiError`/`friendlyError`, `splitCsvLine`

**Tokens** (4 brand hex + 7 HSL + CSS custom properties completas con dark/light mode, tipografia editorial, spacing, radii, shadows, transitions, keyframes)

**Tailwind preset**: `createEnjambrePreset(overrides?)` / `enjambrePreset` — colores semanticos (background, foreground, card, primary, accent, destructive, success, warning, info, border, surface, sidebar, bosque, miel, crema), font families (display/sans/mono), editorial font scale, spacing, animations

### 4.5 `@enjamble/sumup`

Integracion con SumUp POS para punto de venta.

### 4.6 `@enjambre/banco-chile`

Cliente TypeScript para Banco Chile Empresas API. Autenticacion OAuth 2.0, refresh automatico, tipos estrictos con Zod.

---

## 5. Grafo de Dependencias

```
tienda -----> @enjambre/database, @enjambre/ui, @supabase/ssr, @supabase/supabase-js
gsap, lucide-react, recharts, transbank-sdk, zod

nucleo -----> @enjambre/ui, @enjambre/contable, @enjambre/auth
@supabase/supabase-js, @tanstack/react-query
leaflet, react-leaflet, recharts, zustand, hono

campo -----> @enjambre/ui, @enjambre/auth, @supabase/ssr, @supabase/supabase-js
lucide-react
```

---

## 6. Integraciones Externas

| Servicio | Estado | App | Proposito |
|---|---|---|---|
| Transbank Webpay | Implementado | tienda | Pagos online Chile |
| SII | Parcial (nativo) | nucleo BFF `/api/sii` | DTE, FC46, RCV, gastos extranjeros — ver SOBERANIA_FISCAL.md |
| Bancos | Stub | tienda, nucleo BFF | Conciliacion bancaria |
| Notificaciones | Stub | tienda | Eventos de notificacion |
| Blockchain | Planificado | nucleo | Certificacion de origen |

---

## 7. Estrategia de Despliegue

| App | Plataforma | Framework | Root Directory |
|---|---|---|---|
| nucleo | Vercel | Next.js | `apps/nucleo` |
| tienda | Vercel | Next.js | `apps/tienda` |
| campo | Vercel | Next.js | `apps/campo` |

Cada app es un **proyecto Vercel separado** con su propio Root Directory y variables de entorno.

Ver `DEPLOY.md` y `VERCEL.md` para instrucciones detalladas.

---

## 8. Seguridad, Funcionalidad, Eficiencia y Eficacia (Directrices de Regeneración)

En el proceso de transición de datos mock/estáticos a flujos dinámicos con Supabase en apps complejas como Nucleo, se deben considerar las siguientes ramificaciones arquitectónicas:

### 8.1 Seguridad (Security)
- **Alineación con RLS (Zero-Trust)**: Al remover variables locales `ROLE` u objetos mock de autenticación, toda consulta o mutación debe ser filtrada basándose en el identificador de usuario verificado mediante `supabase.auth.getUser()`. **ADVERTENCIA CRÍTICA**: Nunca utilizar `supabase.auth.getSession()` para verificar o autorizar el estado del usuario en el lado del servidor o del cliente de forma confiable, ya que lee el token del almacenamiento local sin validar su firma con Supabase, permitiendo falsificaciones de JWT y escalación de privilegios. El uso de `getSession()` queda limitado a la lectura en memoria del Bearer token de forma rápida (ej. para adjuntarlo en headers de peticiones al BFF).
- **Pre-auth vs Post-auth**: No exponer selectores ni realizar fetching en el cliente antes de validar la existencia de una sesión de usuario activa.
- **Acceso Restringido**: El mapa y otros componentes que consumen la tabla `eventos` o `apiarios` deben adherirse estrictamente a políticas RLS que limitan la lectura a usuarios autenticados, previniendo la filtración de coordenadas sensibles a crawlers o accesos anónimos.

### 8.2 Funcionalidad (Functionality)
- **Null-Safety y Coalescencia**: Los datos dinámicos introducen la posibilidad de retornos vacíos (`null` o `[]`). Todos los componentes visuales deben usar operadores de coalescencia nula (`??`) y estados vacíos (`EmptyState`) amigables para el usuario.
- **Mapeo Riguroso de Base de Datos**: Asegurar consistencia entre los nombres de columnas de las tablas de Supabase y las interfaces locales. Por ejemplo, evitar la discrepancia típica de mock data utilizando los tipos generados en `database.types.ts`.
- **Mapeos Auxiliares**: Cuando el backend devuelva campos genéricos, usar funciones puras de mapeo (ej. `mapProductoRow`) para adaptarlos a la UI, manteniendo la presentación separada del modelo físico de base de datos.

### 8.3 Eficiencia (Efficiency)
- **Selección Acotada (Column Narrowing)**: Evitar consultas pesadas `select('*')` en tablas de gran volumen (como `arboles_plantados` o `ventas`). Consultar únicamente los campos requeridos para el renderizado del componente (ej. `select('id, lat, lng, type')`).
- **Control de Paralelismo**: Agrupar peticiones independientes de carga inicial mediante `Promise.all` en lugar de encadenar `await` secuenciales, optimizando el tiempo de respuesta total de las vistas.
- **Cache y Query State**: Aprovechar TanStack Query para la persistencia del estado en el cliente, evitando re-fetching redundantes al alternar entre tabs o vistas del dashboard.

### 8.4 Eficacia (Efficacy)
- **Mapeo de Errores al Usuario**: Reemplazar silencios en catch blocks y `console.error` con invocaciones controladas a `toast` con la ayuda de la utilidad `friendlyError` de `@enjambre/ui`, garantizando la visibilidad del estado de error para el operador en terreno.
- **Flujos Idempotentes**: Garantizar que las operaciones críticas (como transacciones POS o cierres de caja) registren logs y prevengan doble envío mediante deshabilitación temporal de botones (`disabled={loading}`).

### 8.5 Lecciones de Auditoría de la Fase 3
Durante la preparación de la Fase 3 (Profundidad Funcional), se documentaron las siguientes vulnerabilidades y mejoras de diseño:
- **Seguridad**: Las mutaciones en `apiarios` y `arboles_plantados` (inserts, updates, deletes) se realizan directamente desde el cliente Supabase utilizando la sesión activa. Se verificó que las políticas RLS restringen estas mutaciones a `user_id = auth.uid()` o a usuarios con rol `admin` (`public.is_admin()`).
- **Funcionalidad (Formato de Fechas)**: Inicializar formularios con `new Date().toLocaleDateString('es-CL')` (formato localized tipo `DD-MM-YYYY`) causa fallos de parsing en columnas SQL de tipo `DATE`. Estandarizar en `new Date().toISOString().split('T')[0]` (formato ISO `YYYY-MM-DD`) garantiza la compatibilidad en base de datos.
- **Funcionalidad (Consistencia de Íconos)**: La falta de mapeo de llaves de íconos de la barra lateral (como `'contact'` para CRM) en `LUCIDE_MAP` de `Sidebar.tsx` degrada la interfaz al renderizar elementos vacíos.
- **Eficiencia**: Las mutaciones de coordenadas geográficas en marcadores Leaflet deben realizarse a través de una única llamada `update` acotada en `dragend`, evitando recargas masivas o re-fetching de la base de datos completa.
- **Eficacia**: Los catch blocks no deben usar `console.error` de forma silenciosa para el usuario. Es mandatorio propagar el error utilizando la utilidad centralizada de Sonner `toast(friendlyError(err, '...'), { type: 'error' })` para garantizar la visibilidad de fallos en terreno.

---

*Este documento es la referencia tecnica maestra. Actualizar cuando cambie la estructura o se agreguen apps/paquetes.*
*Ultima actualizacion: Junio 2026 — Añadida sección de directrices de regeneración y lecciones de auditoría de la Fase 3.*
