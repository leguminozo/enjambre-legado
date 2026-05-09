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
|   |-- nucleo/                     Vite 7 SPA · React 19 · TanStack Query
|   |   |-- Dashboard gerencial multi-rol (PWA)
|   |   |-- Mapas Leaflet + PostGIS
|   |   |-- Puerto: 5173
|   |
|   |-- campo/                      Next.js 15 · React 19 · Tailwind 3
|   |   |-- PWA para campo (apicultor/vendedor)
|   |   |-- Offline-first con Dexie
|   |   |-- Puerto: 3002
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

**Stack**: Next.js 16.2.1 + React 19.2.4 + Tailwind CSS 3.3 + GSAP 3.15

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

**Stack**: Vite 7.3.1 + React 19.2.0 + TanStack Query 5.96 + Leaflet + Zustand + PWA

**Vistas por rol** (React Router):

| Vista | Rol | Funcionalidad |
|---|---|---|
| `AuthView` | Todos | Login/register |
| `MapaView` | gerente | Mapa interactivo (apiarios, arboles, ferias, ventas) |
| `ApicultorView` | apicultor | Gestion de colmenas, inspecciones |
| `RegeneracionView` | apicultor, gerente | Arboles plantados, reforestacion |
| `VendedorView` | vendedor | Catalogo en vivo, CRM |
| `GerenteView` | gerente | Panel ejecutivo, metricas |
| `LogisticaView` | logistica | Envios, stock, seguimiento |
| `MarketingView` | marketing | Campanas, redes |
| `ClienteView` | cliente | Perfil, historial |
| `ContableView` | gerente | Integracion contable via BFF |

**PWA**: Service worker con `autoUpdate`, manifest con branding Enjambre Legado, iconos rasterizados desde SVG.

**Legacy (purgar)**:
- `Copia de Cafeteria Eureka!/`
- `Copia de Verano Eccomerce?/`

**Entorno**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PUBLIC_URL_TIENDA`, `VITE_PUBLIC_URL_CAMPO`

---

### 3.3 Campo (`@enjambre/campo`)

**Stack**: Next.js 15.3.5 + React 19.2.0 + Tailwind CSS 3.4 + `@enjambre/offline`

**Rutas**:
- `/` Landing
- `/login` Autenticacion
- `/pos/catalogo` Catalogo POS (vendedor)
- `/pos/carrito` Carrito POS
- `/api/pos/venta` POST (requiere sesion + profiles para vendedor_id)
- `/setup-error` Error cuando Supabase no esta configurado

**Middleware**: Manejo de sesion Supabase con graceful degradation. Si faltan variables, reescribe a `/setup-error` en vez de crashear.

**Offline**: Usa `@enjambre/offline` (Dexie + sync queue) para operar sin conexion.

**Entorno**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (o PUBLISHABLE)

---

### 3.4 API (`@enjambre/api`)

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

Autenticacion compartida para apps Next.js:

| Modulo | Funcionalidad |
|---|---|
| `supabase.ts` | Crea cliente browser Supabase |
| `auth-store.ts` | Zustand store: user, session, profile, signOut, refreshSession |
| `hooks.tsx` | `useRoleBasedRedirect` — redirige segun rol post-login |

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
*Ultima actualizacion: Mayo 2026*
