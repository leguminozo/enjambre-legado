# System Invariants — Enjambre Legado

> Artefacto de gobernanza arquitectónica.  
> Estas 7 leyes son **inviolables**. Todo cambio de código — humano o agente — debe pasar por ellas antes de mergear o declarar éxito.  
> Fuentes canónicas: `docs/README.md` (índice), `docs/REPO_MAP.md` (censo), `docs/CONSTITUTION.md`, `docs/AGENT_INSTRUCTIONS.md`, `AGENTS.md`.
> `MASTER_PLAN.md` es SNAPSHOT junio 2026 — no es fuente.

---

## Ley I — Postgres Zero-Trust

**La seguridad vive en Postgres, no en el cliente.**

| Mandato | Implicación operativa |
|---|---|
| RLS obligatorio en toda tabla con datos de usuario | Toda migración nueva incluye `ENABLE ROW LEVEL SECURITY` + policies |
| Autorización con `supabase.auth.getUser()` | `getSession()` solo para leer Bearer token en memoria; nunca para gates de acceso |
| Roles desde `profiles` / `app_metadata` | `user_metadata` es autodeclarable por el cliente — no es fuente de verdad |
| `SUPABASE_SERVICE_ROLE_KEY` solo server-side | BFF Hono, API Routes, middleware internal — nunca en bundle cliente |
| Funciones de policy canónicas | `current_role()`, `is_admin()`, `is_gerente()`, `has_empresa_access()`, `jwt_app_role()` — `STABLE`, `search_path = ''` |
| `SECURITY DEFINER` excepcional | Solo con `auth.uid()` / `has_empresa_access()` en el cuerpo; no es atajo de CPU |

**Señal de violación:** lógica de rol solo en React, `select('*')` sin RLS awareness, cliente Supabase ad-hoc fuera de `@enjambre/auth`, mutación confiando en filtros del frontend.

---

## Ley II — Package-First Boundaries

**Las apps son interfaces delgadas; los packages son contratos.**

| Mandato | Implicación operativa |
|---|---|
| Lógica usada en 2+ apps → `packages/` | Antes de crear: ¿existe en `packages/ui`, `packages/auth`, `packages/contable`? |
| Schema solo vía migraciones secuenciales | `packages/database/supabase/migrations/NN_descripcion.sql` → `pnpm db:typegen` |
| Clientes Supabase centralizados | Re-exports en `apps/*/lib/`; prohibido `createClient()` ad-hoc en componentes |
| Server code evita barrel `@enjambre/auth` | Usar entry points específicos (`/server-index`, `/middleware`, `/security-events`) por Turbopack |
| BFF Hono como gateway de mutaciones sensibles | Pipeline fijo: `authMiddleware` → `tenantMiddleware` → handler con Zod |

**Señal de violación:** duplicación cross-app, componente en raíz del repo, schema alterado sin migración, lógica tributaria fuera de `@enjambre/contable`.

---

## Ley III — Geometry-First Editorial

**La geometría visual se gobierna desde el design system, no se improvisa por componente.**

| Mandato | Implicación operativa |
|---|---|
| Tokens semánticos exclusivos | `bg-background`, `text-foreground`, `text-primary`, `bg-card`, `border-border`, `bg-surface-raised`, `bg-surface-sunken` |
| Prohibido hex y paletas crudas en JSX | `#fff`, `text-white`, `bg-black`, `text-stone-*`, `bg-gray-*` — solo en `packages/ui/tokens` |
| Dark mode por defecto | Cormorant Garamond (`font-display`) + espaciado editorial generoso + GrainOverlay en superficies públicas |
| Animación con intención | GSAP para macro-vida; Framer Motion para micro-transiciones — no UI genérica MVP |
| Named exports + TypeScript strict | `export function Component`; `interface Props`; `any` prohibido → `unknown` + type guard |

**Señal de violación:** estilos inline con color crudo, componente visual nuevo sin consultar `@enjambre/ui`, página pública sin textura/ritmo editorial, `export default` fuera de pages Next.js.

---

## Ley IV — Cirugía Verificable

**Un diff, un propósito, una prueba de build.**

| Mandato | Implicación operativa |
|---|---|
| Investigar antes de escribir | `grep` / `glob` por patrones existentes; extender antes de inventar |
| Cambio mínimo y acotado | Prohibidos refactors masivos no solicitados; no "limpiezas" colaterales |
| Plan explícito si ≥3 archivos | Documentar alcance antes de ejecutar |
| Build obligatorio post-cambio | `pnpm --filter @enjambre/<app> build`; si tocaste `packages/` → `pnpm build` |
| Errores visibles al operador | `toast.error()` / `friendlyError()` — prohibido `catch(e) {}` silencioso |

**Señal de violación:** PR que mezcla features, archivos tocados sin relación con el objetivo, éxito declarado sin build, `console.error` como única respuesta UX ante fallo.

---

## Ley V — Néctar Traceability

**Todo dato crítico es trazable, idempotente y fluye por el ciclo del néctar.**

| Mandato | Implicación operativa |
|---|---|
| Flujo canónico del ecosistema | Origen (campo) → transformación (nucleo/lotes) → producto (tienda) → venta → impacto → contable |
| Operaciones críticas idempotentes | Checkout, POS, cierres de caja: estado en Postgres (`checkout_sessions`), no memoria volátil |
| Pagos y stock atómicos | `commit` solo si `status = 'pending'`; `decrement_stock()` RPC + triggers de lote |
| Campo offline-first (estado operativo) | Dexie + `sync_queue` es la primera parada; sync hacia Núcleo/Supabase al recuperar red. Prohibido `supabase.insert()` desde UI de Campo |
| Tipos generados como contrato | `database.types.ts` + mappers puros (`mapProductoRow`) — no mocks desalineados con columnas SQL |

**Señal de violación:** sesión de pago en memoria, doble commit de venta, fechas en `DD-MM-YYYY` en columnas `DATE`, coordenadas sensibles expuestas sin RLS, columna `blockchain_hash` escrita sin trazabilidad de origen.

---

## Ley VI — Presupuesto de Plataforma

**Las cuotas de Vercel Hobby y Supabase Free son invariantes de diseño, no un afterthought de deploy.**

| Mandato | Implicación operativa |
|---|---|
| 3 apps Next, 1 Postgres, 0 cuarto deploy | Núcleo BFF = único plano de writes caros |
| Lecturas públicas cacheadas | ISR en tienda; Dexie en campo; Storage CDN para media |
| Cero Image Optimization de Vercel | `cdn-image-loader`; origen WebP + `Cache-Control` 1 año |
| Cron diario, no worker de 60 s | `apps/nucleo/vercel.json` 08/13/14 UTC + outbox |
| Data API por defecto | Pooler `6543` solo si hay cliente SQL directo |
| Realtime excepcional | Feria, caja, carrito, campana. Resto: poll-on-focus |
| Grafo server sin UI | `@enjambre/auth/server-index`; `optimizePackageImports` incluye `@enjambre/ui` |

**Señal de violación:** `<Image>` sin loader custom, cron `*/5`, `.channel()` en un dashboard nuevo, `postgres`/`drizzle` contra `:5432`, barrel de auth en un Server Component, cuarto `vercel.json` de app.

Números y ToS: `docs/CONSTITUTION.md` § II.6. Hobby es non-commercial — $0 es pista, no licencia de tienda.

---

## Ley VII — Superficie Limpia y Voz Humana (Cero Fuga Técnica)

**Las interfaces de usuario son para humanos reales; la plomería técnica pertenece al código y a los logs.**

| Mandato | Implicación operativa |
|---|---|
| Cero archivos `.sql` o números de migración en UI | Prohibido `NN_archivo.sql` en banners, inputs, tooltips o toasts. Explicar el valor funcional de negocio |
| Cero comandos dev en la cara del usuario | Prohibido `pnpm db:push`, `SQL Editor`, rutas de endpoints internos en vistas |
| Dominio humano sobre conceptos de BD | "Código identificador" (no "UUID"), "Datos del registro" (no "data_payload"), "Regla del sistema" (no "trigger Postgres") |
| Trazabilidad de lujo, no jerga cripto | "Sello digital", "Certificado de origen" (no "SHA-256", "on-chain", "bloque", "testnet Polygon Amoy", "enlace mágico") |
| Errores siempre traducidos y sanitizados | `friendlySupabaseError()` / `friendlyError()`; nunca volcar `error.message` SQL/PostgREST crudo al operador |
| Cero cuotas de infraestructura en UI | Prohibido mencionar cuota de Supabase, límites de Vercel Hobby o proveedores de hosting en pantalla |

**Señal de violación:** banner avisando que falta correr un `.sql`, label pidiendo un "UUID", toast mostrando error de Postgres / PostgREST, tarjeta de producto hablando de "bloques on-chain", "SHA-256" o "enlace mágico".

---

## Jerarquía de Resolución de Conflictos

Cuando dos fuentes discrepen, prevalece en este orden:

1. `system_invariants.md` (este artefacto)
2. `docs/CONSTITUTION.md`
3. `docs/README.md` + `docs/REPO_MAP.md` + `docs/DOMAINS.md` + `docs/CROSS_APP.md` + `docs/MONEY_PATH.md` + `docs/CAMPO_OFFLINE.md` + `docs/PRODUCTION.md` + `docs/TRUST.md` + `docs/GLOSSARY.md`
4. `AGENTS.md` + `docs/AGENT_INSTRUCTIONS.md` + `docs/ARCHITECTURE.md`
5. `docs/DECISIONS.md` / `docs/ESTADO_DEL_ARTE.md`
6. Snapshots (`MASTER_PLAN.md`, `TECHNICAL_DEBT.md`, `FRONTEND_ROADMAP.md`) — nunca ganan a 1–5.

---

*Generado: Junio 2026 — Escaneo de contexto Staff Engineer.*  
*Actualizado: Septiembre 2026 — Ley VII (Cero Fuga Técnica); Ley VI; Campo Dexie; índice `docs/README.md` + `REPO_MAP`.*  
*Estado: VIGENTE. Las 7 leyes mandan sobre AGENTS y ARCHITECTURE.*