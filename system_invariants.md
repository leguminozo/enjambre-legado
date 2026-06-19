# System Invariants — Enjambre Legado

> Artefacto de gobernanza arquitectónica.  
> Estas 5 leyes son **inviolables**. Todo cambio de código — humano o agente — debe pasar por ellas antes de mergear o declarar éxito.  
> Fuentes canónicas: `docs/CONSTITUTION.md`, `docs/ARCHITECTURE.md`, `docs/AGENT_INSTRUCTIONS.md`, `AGENTS.md`, `MASTER_PLAN.md`.

---

## Ley I — Postgres Zero-Trust

**La seguridad vive en Postgres, no en el cliente.**

| Mandato | Implicación operativa |
|---|---|
| RLS obligatorio en toda tabla con datos de usuario | Toda migración nueva incluye `ENABLE ROW LEVEL SECURITY` + policies |
| Autorización con `supabase.auth.getUser()` | `getSession()` solo para leer Bearer token en memoria; nunca para gates de acceso |
| Roles desde `profiles` / `app_metadata` | `user_metadata` es autodeclarable por el cliente — no es fuente de verdad |
| `SUPABASE_SERVICE_ROLE_KEY` solo server-side | BFF Hono, API Routes, middleware internal — nunca en bundle cliente |
| Funciones de policy canónicas | `current_role()`, `is_admin()`, `is_gerente()`, `has_empresa_access()` |

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
| Campo conectado-first (estado operativo) | Supabase/BFF directo; scaffolding Dexie (`sync_queue`) solo si se extiende offline — sin `supabase.insert()` directo desde UI cuando offline esté activo |
| Tipos generados como contrato | `database.types.ts` + mappers puros (`mapProductoRow`) — no mocks desalineados con columnas SQL |

**Señal de violación:** sesión de pago en memoria, doble commit de venta, fechas en `DD-MM-YYYY` en columnas `DATE`, coordenadas sensibles expuestas sin RLS, columna `blockchain_hash` escrita sin trazabilidad de origen.

---

## Jerarquía de Resolución de Conflictos

Cuando dos fuentes discrepen, prevalece en este orden:

1. `system_invariants.md` (este artefacto, una vez confirmado por el operador)
2. `docs/CONSTITUTION.md`
3. `MASTER_PLAN.md` (diagnóstico Junio 2026)
4. `docs/ARCHITECTURE.md` + `AGENTS.md`
5. `docs/TECHNICAL_DEBT.md` / `docs/DECISIONS.md`

---

*Generado: Junio 2026 — Escaneo de contexto Staff Engineer.*  
*Estado: PENDIENTE DE CONFIRMACIÓN DEL OPERADOR. No proponer cambios de código hasta aprobación.*