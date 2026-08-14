# Constitucion del Enjambre Legado

## I. Vision y Proposito

**Enjambre Legado** no es un software de gestion comercial. Es un **sistema operativo para la regeneracion biocultural**. Su proposito es orquestar la relacion entre el bosque nativo de Chiloe, la abeja virgen y el consumo consciente de alta gama.

Cada linea de codigo debe honrar la pureza de la miel y la complejidad de la colmena.

---

## II. Principios de Ingenieria

### 1. Estetica Editorial (The Wow Factor)

El frontend no es un "producto minimo viable". Es una pieza de diseno de lujo.

- **Dark Mode por defecto**: El negro profundo (`#050505`) representa la sombra del bosque.
- **Tipografia Display**: Uso mandatorio de *Cormorant Garamond* para una sensacion historica y editorial.
- **Micro-interacciones**: GSAP para simular vida en superficies publicas de marca. Nunca en el grafo server (Route Handlers, BFF, Server Components de datos). Nunca en Campo/POS ni en dispositivos `data-legacy`.
- **Textura organica**: GrainOverlay en paginas publicas de tienda. No en dashboards operativos ni en el POS.
- **Espaciado generoso**: El whitespace es lujo. Las paginas respiran.

#### Paleta Canonica

| Token | Hex | Uso |
|---|---|---|
| Bosque Ulmo | `#0A3D2F` | Verde profundo, primary actions |
| Oro Miel | `#D4A017` / `#c9a227` | Acentos premium, highlights |
| Crema Natural | `#FDFBF7` / `#f5f0e8` | Texto claro sobre oscuro |
| Negro Tinta | `#1a1a1a` / `#050505` | Fondos, profundidad |

> **Prohibido** usar hex sueltos. Usar siempre las variables CSS semanticas (`bg-background`, `text-foreground`, `text-primary`, etc.) o los tokens de `packages/ui`.

### 2. Monorepo y Modularidad

- El codigo compartido vive en `packages/`. Lo que puede ser compartido, **debe** ser compartido.
- Las `apps/` son interfaces especificas para roles especificos. No duplican logica.
- La base de datos es una sola (Supabase).
- Toda nueva funcionalidad que cruza apps debe evaluarse primero como `package`.

```
packages/
database/ Fuente de verdad del esquema
contable/ Logica tributaria reutilizable
auth/ Sesion y roles compartidos
ui/ Design tokens + componentes base
pricing/ Motor de precios y lealtad
fiscal/ DTE nativo
sumup/ SumUp POS integration
banco-chile/ Banco Chile Empresas API client
```

Tres apps Next = tres proyectos Vercel. **Prohibido un cuarto deploy** mientras el horizonte sea Hobby/Free. Nucleo es el unico BFF de escrituras caras (caja, DTE, pagos, RLS pesado).

### 3. Seguridad Nativa (RLS)

La base de datos (Supabase) es la fuente de verdad. La seguridad no es negociable.

- **Row Level Security (RLS)**: Nunca se confia en el cliente. La seguridad vive en Postgres.
- **RLS barato**: `is_admin()`, `is_gerente()`, `current_role()`, `has_empresa_access()`, `jwt_app_role()` son `STABLE` + `search_path = ''`. Predicado alineado a indice (`empresa_id`, `user_id`). Listados admin paginados.
- **`SECURITY DEFINER` no es un acelerador.** Solo cuando el cuerpo necesita privilegio y verifica `auth.uid()` / `has_empresa_access()` adentro. Ver `docs/AUDITORIA_PROFUNDA_2026-08.md`.
- **Roles Estrictos**: `admin`, `apicultor` (patio/operación), `cliente`, `creador`, `rep_ventas`, `territorial`. Los roles granulares anteriores (`vendedor`, `gerente`, `logistica`, `marketing`, `tienda_admin`) se elevan a `admin` vía `LEGACY_ROLE_MAP`. `apicultor` es RoleKey de primera clase (allowlist colmenas/bitácora; no elevación). `territorial` (migration 997) es red/censo Chiloé. Detalle: `docs/ROLES_Y_ACCESO.md`.
- **Multi-tenant contable**: La capa contable usa `has_empresa_access()` para aislar datos por empresa.
- **Validacion en BFF**: La API Hono valida JWT via Supabase Auth antes de cada operacion.
- **Service Role Key**: Solo se usa en server-side (API routes, BFF). Nunca en el cliente.

### 4. Offline-First para Campo

El apicultor y el rep trabajan donde no hay internet.

- **Dexie (IndexedDB) es la primera parada de lectura/escritura en Campo.** Implementado: `apps/campo/src/lib/offline/db.ts`, cola en `cash-context.tsx`, motor en `use-sync-engine.ts`.
- Las mutaciones van a `sync_queue` y suben a Nucleo/Supabase al recuperar conexion.
- **Prohibido** `supabase.insert()` directo desde UI de Campo. Siempre el hook de sincronizacion.
- Dexie no es romance offline: es la valvula de egress (5 GB/mes en Supabase Free).

### 5. Codigo para Agentes (AI-Ready)

Este repositorio esta disenado para ser co-escrito con IA.

- **Named Exports**: Prohibido `export default` en componentes (excepto pages Next.js).
- **Tipado Fuerte**: TypeScript strict. `any` es un error. Usar `unknown` + type guards.
- **Comentarios Semanticos**: Los comentarios explican el "por que", no el "que".
- **Estructura Predecible**: Cada modulo sigue el mismo patron (hooks, componentes, tipos, utilidades).

### 6. Presupuesto de Plataforma (Hobby / Free) — ley, no anexo

OYZ opera hoy contra **Vercel Hobby + un proyecto Supabase Free**. Las cuotas son el producto. $0 es pista de despegue, no hogar legal eterno (Hobby es non-commercial; una tienda con ventas reales exige Pro). El codigo debe sobrevivir el mayor tiempo posible a $0 sin mentir sobre ese horizonte.

Cifras oficiales a agosto 2026 (cuenta / org, no por app):

| Recurso | Techo |
|---|---|
| Vercel Fast Data Transfer | 100 GB/mes |
| Vercel Fast Origin Transfer | 10 GB/mes |
| Vercel Active CPU | 4 h/mes (Fluid Compute; la instancia se reusa) |
| Vercel Function invocations | 1.000.000 |
| Vercel Image Transformations | 5.000 (cache reads 300k) |
| Vercel Cron | grosero (diario). Tres jobs en Nucleo: 08/13/14 UTC |
| Supabase DB | 500 MB → read-only al superar |
| Supabase RAM / CPU | shared, 500 MB RAM |
| Supabase egress + cached egress | 5 GB + 5 GB |
| Supabase Storage | 1 GB; Image Transformations **no incluidas** |
| Supabase Realtime | 200 conexiones; 2 M mensajes/mes |
| Supabase proyectos Free | 2; pause a 1 semana inactiva |
| Postgres directo | ~60; pooler ~200. El camino default es **Data API HTTP** |

Invariantes:

1. **Las lecturas publicas no tocan Postgres en cada hit.** Tienda: ISR (`revalidate` 120–3600) + `revalidatePath` desde CMS. Campo: Dexie. Nucleo: TanStack, no SSR de listados enteros.
2. **Un solo plano de writes caros**: BFF de Nucleo. Sin cuarto proyecto Vercel.
3. **Cron ≥ diario** en Hobby. Cola en Postgres + disparo en la mutacion (checkout, despacho). Prohibido cron sub-hora.
4. **`<Image>` no usa el optimizer de Vercel.** Loader `cdn-image-loader` sirve el origen (Storage ya WebP + `Cache-Control: 31536000`). No usar Image Transformations de Supabase en Free.
5. **Realtime no es default.** Solo superficies operativas (feria, caja, carrito multi-dispositivo, campana de notificaciones). Un dashboard nuevo hace poll-on-focus.
6. **Servidor no importa UI.** `@enjambre/auth/server-index` (o `/middleware`, `/security-events`). `optimizePackageImports` incluye `@enjambre/ui`. GSAP/Leaflet/Cytoscape fuera del grafo server.
7. **Postgres directo solo con Transaction pooler (`6543`).** El default es supabase-js HTTP. No abrir `postgres.js` / Drizzle en una funcion sin pooler.
8. **RLS `STABLE` + indice.** `SECURITY DEFINER` no es default.

---

## III. El Flujo del Nectar (Data Flow)

```
1. ORIGEN       cosechas + inspecciones en el bosque (campo/offline)
2. TRANSFORMA   lotes vinculados a colmenas especificas (nucleo)
3. TRAZA        blockchain_hash por colmena para certificacion
4. PRODUCTO     productos premium con descripcion regenerativa (tienda)
5. VENTA transbank + impacto ambiental (tienda/nucleo BFF)
6. IMPACTO arboles plantados por pedido (nucleo + tienda)
7. CONTABILIDAD facturas, IVA, impuestos (nucleo BFF)
```

Cada etapa del flujo es trazable. Un cliente puede escanear un QR y ver exactamente de que colmena viene su miel.

---

## IV. Mandamientos del Desarrollador

1. **No romperas el legado** — Cada cambio debe ser verificado con `build` antes de subir.
2. **Honraras la simplicidad** — Menos componentes, mas intencion.
3. **Documentaras el cambio** — Si cambias la medula (database), actualiza el esquema documental inmediatamente.
4. **No haras carniceria** — Cirugia: modifica solo lo estrictamente necesario. Evita refactors masivos no solicitados.
5. **Probable la critica** — Si hay flujo de pago o dato sensible, debe haber test automatizado.
6. **Respetaras los roles** — Cada nueva tabla necesita RLS. Sin excepciones.
7. **Leeras antes de escribir** — Investiga componentes similares antes de crear nuevos.

---

## V. Anti-patrones (Prohibido)

| Anti-patron | Correcto |
|---|---|
| `export default function` | `export function MiComponente` |
| `any` como tipo | `unknown` + type guard |
| Hex sueltos (`#fff`) | Tokens semanticos (`bg-background`) |
| `bg-white` en superficies | `bg-card` / `surface-raised` |
| `catch(e) {}` vacio | `toast.error()` con mensaje al usuario |
| `supabase.insert()` directo en UI (campo) | Cola Dexie + `use-sync-engine` |
| `<Image>` con loader default de Vercel | `cdn-image-loader` (origen Storage / static) |
| Cron cada minuto en Vercel | Cron diario + outbox + trigger en la mutacion |
| Realtime en cada vista de Nucleo | Poll-on-focus; Realtime solo feria/caja/carrito |
| Cuarto proyecto Vercel | Package o ruta en una de las 3 apps |
| `SECURITY DEFINER` como atajo de CPU | `STABLE` + `search_path = ''`; DEFINER solo con check de caller |
| `DATABASE_URL` :5432 en una Lambda | Transaction pooler `:6543` o Data API |
| Barrel `@enjambre/auth` en Server Component | `@enjambre/auth/server-index` |
| Componentes en la raiz del repo | `packages/ui` o `apps/*/components` |
| `console.log` en produccion | Logger estructurado o remover |
| Service Role Key en el cliente | Solo server-side |

---

## VI. Gobernanza del Codigo

### Decisiones Arquitectonicas
Toda decision que afecte a mas de 3 archivos o cruce apps/packages debe documentarse en `docs/ARCHITECTURE.md` con:
- Contexto del problema
- Opciones consideradas
- Decision tomada y razon
- Consecuencias

### Nuevo Paquete/App
Antes de crear un nuevo paquete o app, responder:
1. Puede vivir en un paquete existente?
2. Lo necesita mas de una app?
3. Tiene dependencias circulares con otros paquetes?

### Migraciones de Base de Datos
- Toda migracion va en `packages/database/supabase/migrations/`
- Numeracion secuencial (`NN_descripcion.sql`)
- Incluir RLS si la tabla tiene datos sensibles
- Actualizar `DATABASE_SCHEMA.md`

---

*Este documento es la ley suprema del proyecto. Todo agente (humano o IA) debe leerlo antes de operar.*
*Ultima actualizacion: Agosto 2026 — presupuesto Hobby/Free como principio II.6; Campo Dexie vigente.*
