# Arquitectura del Sistema — Enjambre Legado

> Documento de referencia para entender la topologia completa del ecosistema.

---

## 1. Topologia del Monorepo

```
enjambre-legado/                    (pnpm workspace + Turborepo)
|
|-- apps/
|   |-- tienda/                     Next.js 16 · React 19 · Tailwind 3
|   |   |-- E-commerce publico + admin comercial
|   |   |-- Transbank Webpay + integraciones SII
|   |   |-- Puerto: 3000
|   |
| |-- nucleo/ Next.js 16 · React 19 · TanStack Query · Hono BFF
| | |-- Dashboard gerencial multi-rol (App Router)
| | |-- Mapas Leaflet + PostGIS + Caja/Comisiones/Reps/Leaderboard
| | |-- BFF: cash-sessions, rep-ventas, invitations, commission-rules
| | |-- Puerto: 3000
| |
| |-- campo/ Next.js 15 · React 19 · Tailwind 3
| | |-- PWA para campo (apicultor/vendedor/rep_ventas)
| | |-- POS: CashProvider, QuickSale, TierBadge, Leaderboard, Threshold
| | |-- Puerto: 3002
|   |
|   |-- api/                        Hono 4 · Node.js
|   |   |-- BFF contable + integraciones
|   |   |-- Multi-tenant con JWT + empresa context
|   |   |-- Puerto: 3001
|   |
|   |-- eirl/                       Next.js 15 · Prisma + SQLite
|       |-- Contabilidad EIRL PROPYME (independiente)
|       |-- NextAuth + Socket.IO
|       |-- Puerto: 3000
|
|-- packages/
|   |-- database/                   Supabase + Postgres 17 + PostGIS
|   |   |-- Migraciones + tipos generados
|   |   |-- 10 migraciones, 20+ tablas, RLS completo
|   |
|   |-- contable/                   Logica tributaria chilena
|   |   |-- IVA 19%, RUT, facturas (Zod schemas)
|   |
|   |-- auth/                       Autenticacion compartida
|   |   |-- Supabase client + Zustand store + role redirect
|   |
|   |-- offline/                    Sincronizacion offline-first
|   |   |-- Dexie DB + sync queue
|   |
|   |-- ui/                         Design tokens
|   |   |-- 4 tokens semanticos + CSS custom properties
|   |
|   |-- ai/                         Stub - prediccion floracion
|   |-- maps/                       Tipos cartograficos + utilidades
|
|-- components/shop/                DEUDA: migrar a packages/ui o apps/tienda
|-- docs/                           Documentacion (estas aqui)
|-- skills/                         Supabase agent skills (gitignored)
```

---

## 2. Flujo de Datos y Autenticacion

### 2.1 Identidad Centralizada

La autenticacion se gestiona via **Supabase Auth**. La tabla `profiles` en el esquema publico es el nexo de union, vinculando el `uuid` de auth con un `role` especifico.

```
                          Supabase Auth
                               |
                               v
                    +---------------------+
                    | auth.users (uuid)   |
                    +---------------------+
                               |
                               v
                    +---------------------+
                    | profiles            |
                    | - id (uuid FK)      |
                    | - role (enum)       |
                    | - full_name         |
                    | - nivel_guardian    |
                    +---------------------+
                               |
          +----------+---------+----------+-----------+
          |          |         |          |           |
          v          v         v          v           v
    apicultor    vendedor   gerente   logistica   tienda_admin
    campo/       campo/     nucleo/   nucleo/     tienda/
    nucleo/      nucleo/                         nucleo/
```

### 2.2 Flujo Offline-First (Campo)

```
UI Component (campo)
    |
    v
Custom Hook (useSync)
    |
    v
Dexie DB (IndexedDB) ← escritura inmediata
    |
    v
Sync Queue (pendientes)
    |
    v (cuando hay conexion)
Supabase (Postgres)
```

**Regla critica**: Toda escritura en campo persiste primero en Dexie. Nunca directamente a Supabase desde la UI.

### 2.3 Flujo de Pagos (Tienda)

```
Checkout (tienda/frontend)
    |
    v
POST /api/checkout/init (Next.js API Route)
    |
    v
Transbank SDK (Webpay)
    |
    v
POST /api/checkout/commit (Next.js API Route)
    |
    v
Supabase: INSERT venta + arboles_plantados
    |
    v
Confirmacion al cliente
```

### 2.4 Flujo Contable (API/EIRL)

```
Nucleo/EIRL (frontend)
    |
    v
BFF Hono (apps/api)
    |-- auth.ts    → valida JWT via Supabase Auth
    |-- tenant.ts  → resuelve empresa via x-empresa-id
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

**Auth**: Integrado con `@enjambre/auth` via `AuthProvider` wrapper (`auth-context.tsx`). Usa `useAuthStore` como fuente de verdad, expone `useAuth()` API compatible con `TiendaUser`. `onAuthStateChange` con cliente local. `appSource: 'tienda'`. Middleware logea `access_denied` via Supabase REST API directa con service role key (sin dependencia BFF).

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
| `/mapa` | gerente | MapaView | Mapa interactivo (apiarios, arboles, ferias, ventas) |
| `/caja` | gerente, tienda_admin | CashSessionsPanel | Sesiones de caja, CSV export, alertas Δ |
| `/reps` | gerente, tienda_admin | RepsPanel | Gestión reps, tier override |
| `/comisiones` | gerente, tienda_admin | ComisionesPanel | Comisiones con Tier + Canal |
| `/invitaciones` | gerente, tienda_admin | InvitacionesPanel | Códigos invitación + redenciones |
| `/reglas-comision` | gerente, tienda_admin | ReglasComisionPanel | 6 rule_types (base, channel_rate, volume_threshold, loyalty, streak, tier_bonus) |
| `/leaderboard` | gerente, tienda_admin | LeaderboardPanel | Ranking semanal (stat cards + top 3 + tabla) |
| `/apicultor` | apicultor | ApicultorView | Gestion de colmenas, inspecciones |
| `/logistica` | logistica | LogisticaView | Envios, stock, seguimiento |
| `/marketing` | marketing | MarketingView | Campanas, redes |
| `/contable` | gerente | ContableView | Integracion contable via BFF |

**Entorno**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

### 3.3 Campo (`@enjambre/campo`)

**Stack**: Next.js 15.3.5 + React 19.2.0 + Tailwind CSS 3.4 + `@enjambre/offline`

**Rutas**:
- `/` Landing
- `/login` Autenticacion
- `/pos` POS principal (3 links: Venta Rapida, Carrito, Historial)
- `/pos/catalogo` Catalogo POS (vendedor)
- `/pos/carrito` Carrito POS (integrado con cash session, channel + metodo_pago selectors)
- `/pos/historial` Historial 4 tabs (Curva volumen, Comisiones, Sesiones caja, Ranking leaderboard)
- `/api/pos/venta` POST (fallback local sin sesion de caja)
- `/setup-error` Error cuando Supabase no esta configurado

**Auth**: Integrado con `@enjambre/auth` via `CampoAuthProvider` (sync `onAuthStateChange` → `useAuthStore`, `appSource: 'campo'`). Middleware protege `/pos/*` con redirect a `/login` si no autenticado. `access_denied` logging via fire-and-forget `POST /api/security-events/internal`.

**Middleware**: Auth guard en `/pos/*` + manejo de sesion Supabase con graceful degradation. Si faltan variables, reescribe a `/setup-error` en vez de crashear. `access_denied` se logea via BFF internal route.

**Styling**: 100% semantic Tailwind tokens (`bg-background`, `text-foreground`, `text-primary`, `bg-card`, `border-border`, `text-muted-foreground`, `text-destructive`, `text-primary-foreground`, `bg-surface-raised`, `bg-surface-sunken`). Sin colores hardcoded. Tokens mapeados en `tailwind.config.js` desde `@enjambre/ui` CSS variables.

**Offline**: Usa `@enjambre/offline` (Dexie + sync queue) para operar sin conexion.

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

### 3.5 EIRL (`@enjambre/eirl`)

**Stack**: Next.js 15.3.5 + Prisma 6.11 + SQLite + NextAuth 4.24 + Socket.IO + shadcn/ui + Zustand

**Independiente del ecosistema Supabase**:
- Base de datos propia (SQLite via Prisma)
- Autenticacion propia (NextAuth)
- Servidor custom con WebSocket (Socket.IO)

**Modelos Prisma**: Empresa, Tercero, FacturaEmitida, FacturaRecibida, Gasto, Impuesto, PeriodoContable, Reporte, CalculoIA, ConfiguracionIA

**Taxonomia tributaria chilena**: IVA, PPM, Retencion, Primera Categoria, impuestos especificos.

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

**Uso en apps**: Nucleo usa `@enjambre/auth` via re-exports en `@/lib/` (71 consumidores, cero rotos). Tienda usa `auth-context.tsx` que wrapesa `useAuthStore` + expone `useAuth()` compatible con `TiendaUser`, sincroniza `onAuthStateChange` con cliente local, setea `appSource: 'tienda'`. Campo usa `CampoAuthProvider` con el mismo patrón (cliente local + `appSource: 'campo'`). Los archivos `env.ts` locales son necesarios para evitar que Turbopack resuelva el barrel de `@enjambre/auth` (que incluye hooks de React) en contextos server-side.

**Eventos de seguridad** (Phase 5 — logging centralizado):

| Ubicación | Eventos | Mecanismo |
|---|---|---|
| Login page (3 apps) | `login_success`, `login_failed`, `password_reset_requested`, `signup_success` | `logSecurityEvent(supabase, ...)` directo |
| Nucleo middleware | `access_denied` | Fire-and-forget `POST /api/security-events/internal` con `x-internal-key` |
| Campo middleware | `access_denied` | Fire-and-forget `POST /api/security-events/internal` (via BFF nucleo) |
| Tienda middleware | `access_denied` | Supabase REST API directa con service role key (sin BFF dependency) |
| Auth store `signOut()` | `session_revoked` | `logSecurityEvent(supabase, ...)` antes de `supabase.auth.signOut()`, con `appSource` dinámico |

**BFF route de seguridad** (`/api/security-events`):
- `POST /` — autenticado via Bearer token (`authMiddleware`) para client-side logging
- `POST /internal` — autenticado via `x-internal-key` = `SUPABASE_SERVICE_ROLE_KEY` para middleware/Edge logging

**RLS en `security_events`**:
- SELECT: `is_gerente()` OR `current_role() = 'tienda_admin'`
- INSERT (auth): `auth.uid() IS NOT NULL`
- INSERT (anon): solo para `login_failed`, `password_reset_requested`, `signup_success`

### 4.4 `@enjambre/offline`

Sincronizacion offline-first para campo:

| Modulo | Funcionalidad |
|---|---|
| `dexie-db.ts` | BD IndexedDB: tablas `transacciones` + `tickets` con indices |
| `sync-queue.ts` | `syncPendingTransactions()` — itera pendientes y pushea via callback |

### 4.5 `@enjambre/ui`

Design tokens (4 tokens semanticos + CSS custom properties):

| Token | Hex | Significado |
|---|---|---|
| `bosqueUlmo` | `#0A3D2F` | Verde profundo del bosque |
| `oroMiel` | `#D4A017` | Dorado de la miel premium |
| `cremaNatural` | `#FDFBF7` | Crema natural de cera |
| `negroTinta` | `#1a1a1a` | Negro profundo |

### 4.6 `@enjambre/ai` (Stub)

Placeholder para prediccion de floracion. Funcion `predictFloracion()` retorna ceros.
Futuro: Edge Function o integracion con OpenRouter.

### 4.7 `@enjambre/maps` (Minimo)

Tipos y utilidades cartograficas:
- `MapLayerId`: `'apiarios' | 'arboles' | 'ferias' | 'ventas'`
- `latLngKey()`: Utilidad para claves de mapa

---

## 5. Grafo de Dependencias

```
tienda -----> @enjambre/database, @supabase/ssr, @supabase/supabase-js
              gsap, lucide-react, recharts, transbank-sdk, zod

nucleo -----> @supabase/supabase-js, @tanstack/react-query
              leaflet, react-leaflet, recharts, zustand

campo  -----> @enjambre/offline, @supabase/ssr, @supabase/supabase-js
              lucide-react

api    -----> @enjambre/contable, @supabase/supabase-js
              hono, @hono/zod-validator, zod

eirl   -----> (independiente)
              prisma, next-auth, shadcn/ui, zustand, socket.io
```

---

## 6. Integraciones Externas

| Servicio | Estado | App | Proposito |
|---|---|---|---|
| Transbank Webpay | Implementado | tienda | Pagos online Chile |
| SII | Stub | tienda, api | Sincronizacion tributaria |
| Bancos | Stub | tienda, api | Conciliacion bancaria |
| Notificaciones | Stub | tienda | Eventos de notificacion |
| Blockchain | Planificado | nucleo | Certificacion de origen |
| IA/ML | Stub | packages/ai | Prediccion de floracion |

---

## 7. Estrategia de Despliegue

| App | Plataforma | Framework | Root Directory |
|---|---|---|---|
| nucleo | Vercel | Vite | `apps/nucleo` |
| tienda | Vercel | Next.js | `apps/tienda` |
| campo | Vercel | Next.js | `apps/campo` |
| api | TBD (Docker/VPS) | Hono/Node | `apps/api` |
| eirl | TBD | Next.js custom server | `apps/eirl` |

Cada app es un **proyecto Vercel separado** con su propio Root Directory y variables de entorno.

Ver `DEPLOY.md` y `VERCEL.md` para instrucciones detalladas.

---

*Este documento es la referencia tecnica maestra. Actualizar cuando cambie la estructura o se agreguen apps/paquetes.*
*Ultima actualizacion: Junio 2026 — Auth centralizada en 3 apps, campo 100% semantic tokens, security events phase 5 completa*
