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
| |-- campo/ Next.js 16 · React 19 · Tailwind 3
| | |-- PWA para campo (apicultor/vendedor/rep_ventas)
| | |-- POS: CashProvider, QuickSale, TierBadge, Leaderboard, Threshold
| | |-- Offline-first planificado (no implementado aun)
| | |-- Puerto: 3002
|
|-- packages/
| |-- database/ Supabase + Postgres 17 + PostGIS
| | |-- Migraciones + tipos generados
| | |-- 43+ migraciones, 20+ tablas, RLS completo
| |
| |-- contable/ Logica tributaria chilena
| | |-- IVA 19%, RUT, facturas (Zod schemas)
| |
| |-- auth/ Autenticacion compartida
| | |-- Supabase client + Zustand store + role redirect
| |
| |-- ui/ Design tokens
| | |-- 4 tokens semanticos + CSS custom properties
| |
| |-- sumup/ SumUp POS integration
| |
| |-- banco-chile/ Banco Chile Empresas API client
|
|-- components/shop/ DEUDA: migrar a packages/ui o apps/tienda
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

### 2.2 Flujo Offline-First (Campo) — Planificado

> **Nota**: El offline-first no esta implementado aun. Campo actualmente usa Supabase directamente.

```console
UI Component (campo)
|
v
Custom Hook (useSync) — futuro
|
v
Dexie DB (IndexedDB) ← escritura inmediata — futuro
|
v
Sync Queue (pendientes) — futuro
|
v (cuando haya conexion)
Supabase (Postgres)
```

**Regla critica** (cuando se implemente): Toda escritura en campo persiste primero en Dexie. Nunca directamente a Supabase desde la UI.

### 2.3 Flujo de Pagos (Tienda)

```
Checkout (tienda/frontend)
|
v
POST /api/checkout/init (Next.js API Route)
|  → Verifica precios + stock en Supabase
|  → Persiste sesión en checkout_sessions (Postgres)
|  → Retorna URL + token del provider
v
Transbank SDK (Webpay) / Flow.cl
|
v
POST /api/checkout/commit (Next.js API Route)
|  → Lee sesión desde checkout_sessions (Postgres, no memoria)
|  → Idempotente: solo completa si status = 'pending'
|  → INSERT venta + decrement_stock
|  → Marca sesión como 'completed'
v
Supabase: INSERT venta + arboles_plantados
|
v
Confirmacion al cliente
```

**Tabla de sesiones**: `checkout_sessions` (Migration 38) — RLS service_role only, auto-expire 30 min, audit trail completo.

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

**Auth**: Middleware propio (`utils/supabase/middleware.ts`) con `updateSession()`. No usa `createAuthMiddleware`. No logea `access_denied` actualmente.

**Rutas publicas**:
- `/` Landing editorial premium
- `/catalogo` Catalogo de productos con filtros
- `/producto/[slug]` Ficha de producto con trazabilidad
- `/checkout` Flow de pago (Transbank)
- `/impacto` Pagina de impacto ambiental
- `/nosotros`, `/contacto`, `/experiencias`, `/galeria`
- `/login`, `/register`

**Rutas admin** (`/(admin)/`):
- `/dashboard` Panel general
- `/products`, `/orders`, `/customers`, `/collections` CRUD
- `/integrations` SII, bancos, notificaciones

**API Routes**:
- `/api/checkout/init` + `/commit` — Transbank
- `/api/admin/integrations/*` — SII, bancos, notificaciones (modo stub)

**Integraciones**:
- **Transbank SDK 6.1** — Webpay (pagos Chile)
- **SII** — Sincronizacion tributaria (stub)
- **Bancos** — Conciliacion bancaria (stub)
- **Notificaciones** — Eventos de notificacion (stub)

**Entorno**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (o PUBLISHABLE), `TRANSBANK_*`, `SUPABASE_SERVICE_ROLE_KEY`

---

### 3.2 Nucleo (`@enjambre/nucleo`)

**Stack**: Next.js 16.2.6 + React 19 + TanStack Query 5.96 + Leaflet + Zustand + Hono 4 BFF (App Router `/api/[[...routes]]`)

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

**Entorno**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

### 3.3 Campo (`@enjambre/campo`)

**Stack**: Next.js 16.2.6 + React 19.2.0 + Tailwind CSS 3.4

**Rutas**:
- `/` Landing
- `/login` Autenticacion
- `/pos` POS principal (3 links: Venta Rapida, Carrito, Historial)
- `/pos/catalogo` Catalogo POS (vendedor)
- `/pos/carrito` Carrito POS (integrado con cash session, channel + metodo_pago selectors)
- `/pos/historial` Historial 4 tabs (Curva volumen, Comisiones, Sesiones caja, Ranking leaderboard)
- `/api/pos/venta` POST (fallback local sin sesion de caja)
- `/setup-error` Error cuando Supabase no esta configurado

**Auth**: Middleware propio con custom `logAccessDenied()` que posta a nucleo BFF (`POST /api/security-events/internal` con `x-internal-key`). No usa `createAuthMiddleware` directamente. Middleware protege `/pos/*` con redirect a `/login` si no autenticado.

**Middleware**: Auth guard en `/pos/*` + manejo de sesion Supabase con graceful degradation. Si faltan variables, reescribe a `/setup-error` en vez de crashear. `access_denied` se logea via BFF internal route.

**Styling**: 100% semantic Tailwind tokens (`bg-background`, `text-foreground`, `text-primary`, `bg-card`, `border-border`, `text-muted-foreground`, `text-destructive`, `text-primary-foreground`, `bg-surface-raised`, `bg-surface-sunken`). Sin colores hardcoded. Tokens mapeados en `tailwind.config.js` desde `@enjambre/ui` CSS variables.

**Offline**: Offline-first planificado. Campo actualmente usa Supabase directamente. Futuro: `@enjambre/offline` (Dexie + sync queue).

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
| `/api/contable/*` | (existentes) | Dashboard, facturas emitidas |
| `/api/health/*` | (existentes) | Liveness, readiness |

**Stack**: Hono 4.10.5 + Node.js + `@enjambre/contable`

**Middleware pipeline**:
```
Request → auth.ts (valida JWT) → tenant.ts (resuelve empresa) → Route Handler
```

**Rutas**:
- `GET /api/health/live` — Liveness (sin auth)
- `GET /api/health/ready` — Readiness (requiere Bearer)
- `GET /api/contable/dashboard` — Dashboard financiero por empresa
- `POST /api/contable/facturas-emitidas` — Crear factura con calculo IVA automatico

**Tipos**: `AppVariables` (user, accessToken, supabase, empresaId, rol)

**Entorno**: `PORT` (3001), `SUPABASE_URL`, `SUPABASE_ANON_KEY`

---

## 4. Paquetes — Detalle Completo

### 4.1 `@enjambre/database`

Fuente de verdad del esquema. 10 migraciones que cubren:

| # | Migracion | Dominio |
|---|---|---|
| 00 | Schema inicial | 20+ tablas base (identidad, apiarios, colmenas, productos, ventas, etc.) |
| 01 | RLS policies | Roles, funciones `current_role()`, `is_gerente()` |
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
| `api.ts` | Tipos genericos: `ApiSuccess<T>`, `ApiError` |

### 4.3 `@enjambre/auth`

Autenticacion y clientes Supabase compartidos para apps Next.js. Dos puntos de entrada:

**`@enjambre/auth`** (cliente/browser):
| Modulo | Funcionalidad |
|---|---|
| `supabase.ts` | Cliente browser Supabase (singleton, null-safe, soporta PUBLISHABLE_DEFAULT_KEY) + env helpers (`getSupabaseUrl`, `getSupabaseKey`, `isSupabaseConfigured`) |
| `auth-store.ts` | Zustand store: `user`, `session`, `isAuthenticated`, `isLoading`, `appSource` (`AppSource` = 'nucleo'|'tienda'|'campo'|'api'), `checkUser()`, `signOut()` (logsea `session_revoked` con `appSource` dinámico), `setAppSource()`, `refreshSession()` |
| `auth-provider.ts` | `useAuthProvider()` — hook que sincroniza `onAuthStateChange` con Zustand store (se usa una vez en root Providers) |
| `hooks.tsx` | `useRoleBasedRedirect` — redirige segun rol post-login |
| `security-events.ts` | `logSecurityEvent`, `fetchSecurityEvents`, `isRepeatedFailure` — 13 tipos de evento (incluye `access_denied`, `signup_success`) |
| `role-redirect.ts` | `ROLE_REDIRECT_MAP` (rol→ruta), `ROUTE_ROLE_GUARDS` (ruta→roles), `getRoleRedirectPath()`, `isRouteAllowed()`, `RoleKey` |
| `use-security-alerts.ts` | `useSecurityAlerts` hook para monitoreo de eventos de seguridad |

**`@enjambre/auth/server-index`** (server-only):
| Modulo | Funcionalidad |
|---|---|
| `server.ts` | `createServerClientFromCookies()` — cliente RSC con `next/headers` |
| `middleware.ts` | `createAuthMiddleware()` — factory de middleware Next.js con timeout, rutas publicas, redirect por rol + route guards |
| `bff.ts` | `createSupabaseUserClient()` — cliente Hono BFF con Bearer token |

**`@enjambre/auth/security-events`** (server-safe, sin React):
| Modulo | Funcionalidad |
|---|---|
| `security-events.ts` | `logSecurityEvent()`, `fetchSecurityEvents()`, `isRepeatedFailure()`, tipos — para uso en BFF/routes server-side sin importar hooks de React |

**`@enjambre/auth/middleware`** (Edge-safe):
| Modulo | Funcionalidad |
|---|---|
| `middleware.ts` | `createAuthMiddleware()` — factory con role redirect + route guards + logging `access_denied` via BFF |

**Uso en apps**: Nucleo usa `@enjambre/auth` via re-exports en `@/lib/` (71 consumidores, cero rotos). `useAuthProvider()` hook en root. Middleware usa `createAuthMiddleware()` de `@enjambre/auth/middleware`. Tienda tiene middleware propio (`utils/supabase/middleware.ts`) con `updateSession()`, no usa `createAuthMiddleware`. Campo tiene middleware propio con custom `logAccessDenied()` que posta a nucleo BFF. Los archivos `env.ts` locales son necesarios para evitar que Turbopack resuelva el barrel de `@enjambre/auth` (que incluye hooks de React) en contextos server-side.

**Eventos de seguridad** (Phase 5 — logging centralizado):

| Ubicación | Eventos | Mecanismo |
|---|---|---|
| Login page (3 apps) | `login_success`, `login_failed`, `password_reset_requested`, `signup_success` | `logSecurityEvent(supabase, ...)` directo |
| Nucleo middleware | `access_denied` | Fire-and-forget `POST /api/security-events/internal` con `x-internal-key` |
| Campo middleware | `access_denied` | Fire-and-forget `POST /api/security-events/internal` (via BFF nucleo) |
| Tienda middleware | — | No logea `access_denied` actualmente |
| Auth store `signOut()` | `session_revoked` | `logSecurityEvent(supabase, ...)` antes de `supabase.auth.signOut()`, con `appSource` dinámico |

**BFF route de seguridad** (`/api/security-events`):
- `POST /` — autenticado via Bearer token (`authMiddleware`) para client-side logging
- `POST /internal` — autenticado via `x-internal-key` = `SUPABASE_SERVICE_ROLE_KEY` para middleware/Edge logging

**RLS en `security_events`**:
- SELECT: `is_admin()` (consolidated role)
- INSERT (auth): `auth.uid() IS NOT NULL`
- INSERT (anon): solo para `login_failed`, `password_reset_requested`, `signup_success`

### 4.4 `@enjambre/ui`

Design tokens (4 tokens semanticos + CSS custom properties):

| Token | Hex | Significado |
|---|---|---|
| `bosqueUlmo` | `#0A3D2F` | Verde profundo del bosque |
| `oroMiel` | `#D4A017` | Dorado de la miel premium |
| `cremaNatural` | `#FDFBF7` | Crema natural de cera |
| `negroTinta` | `#1a1a1a` | Negro profundo |

### 4.5 `@enjamble/sumup`

Integracion con SumUp POS para punto de venta.

### 4.6 `@enjambre/banco-chile`

Cliente TypeScript para Banco Chile Empresas API. Autenticacion OAuth 2.0, refresh automatico, tipos estrictos con Zod.

---

## 5. Grafo de Dependencias

```
tienda -----> @enjambre/database, @supabase/ssr, @supabase/supabase-js
gsap, lucide-react, recharts, transbank-sdk, zod

nucleo -----> @supabase/supabase-js, @tanstack/react-query, @enjambre/contable
leaflet, react-leaflet, recharts, zustand, hono

campo -----> @supabase/ssr, @supabase/supabase-js
lucide-react
```

---

## 6. Integraciones Externas

| Servicio | Estado | App | Proposito |
|---|---|---|---|
| Transbank Webpay | Implementado | tienda | Pagos online Chile |
| SII | Stub | tienda, nucleo BFF | Sincronizacion tributaria |
| Bancos | Stub | tienda, nucleo BFF | Conciliacion bancaria |
| Notificaciones | Stub | tienda | Eventos de notificacion |
| Blockchain | Planificado | nucleo | Certificacion de origen |
| IA/ML | Stub | packages/ai | Prediccion de floracion |

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

*Este documento es la referencia tecnica maestra. Actualizar cuando cambie la estructura o se agreguen apps/paquetes.*
*Ultima actualizacion: Junio 2026 — 3 apps en Next.js 16, roles consolidados (migration 39), EIRL absorbido por nucleo, BFF Hono dentro de nucleo, packages/sumup + banco-chile agregados, offline-first planificado*
