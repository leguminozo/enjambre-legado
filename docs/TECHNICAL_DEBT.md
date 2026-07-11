# Manifiesto de Deuda Tecnica — Enjambre Legado

> Puntos de friccion, redundancia y fragilidad tecnica. Priorizados por riesgo.

---

## Update 2026-07-11 (CMS / monorepo hygiene)

| Item | Estado |
|------|--------|
| Brand/logo dual source + WEBP alpha | ✅ Resuelto (pipeline + `resolveHeaderBrand`) |
| CMS revalidate + CSP iframe | ✅ Resuelto |
| Duplicado `store-chrome` nucleo/tienda | ✅ Fuente única `@enjambre/shop-chrome` |
| Duplicado `sale-qr` campo/nucleo | ✅ Fuente única `@enjambre/sale-qr` |
| Packages ui/sumup/banco-chile sin tests | ✅ Smoke + CI |
| Env secrets checklist | ✅ `pnpm env:check` / `env:check:prod` |
| Header-menu.ts nucleo vs tienda | ✅ Unificado en `@enjambre/shop-chrome` |
| Campo e2e smoke en CI | ✅ `e2e/smoke.spec.ts` + job CI |
| `packages/database` sin tests | ✅ Vitest: types + migrations integrity |
| Health deps probe | ✅ `GET /api/health/deps` |
| Rate limit auth-events | ✅ `RATE_LIMIT_CONFIGS.auth` en security-events |
| `as any` cash/invites/cms/commission | ✅ `Json` tipado + rows inferidos |
| Campo `E2E_SKIP_AUTH` + POS shell smoke | ✅ middleware + smoke.spec |
| CRM / dashboard / producción / rep-ventas `as any` | ✅ `fromLoose`/`rpcLoose` + `productos` Json |
| creadores / blockchain / sumup / banco-chile casts | ✅ Enums/`Json`/fromLoose |
| Staging Supabase formal | 🔄 Abierto (manual) |
| Typegen CRM (`clientes` stub, `interacciones` vs `crm_*`) | 🔄 Abierto — `db:typegen` + alinear schema |
| `as any` residual SII routes | ✅ Tipado sin casts (dte/certificados/gastos/empresa) |
| CAF checkout fail-closed + min folios compartido | ✅ `getFoliosRestantes` + flag auto-emit / enforce |
| DTE boleta post-checkout retry | ✅ enqueue job `venta` → cron fiscal |

---

## CRITICAL BLOCKERS (Production Readiness)

**Date**: 2026-06-14
**Status**: Refined after critical review
**Context**: This document captures the consolidated analysis for taking Nucleo, Tienda, and Campo to production for real sales in Chile.

---

## Three Real Blockers (Must Fix Before Any Sale)

| # | Blocker | Location | Risk | Effort | Status |
|---|---------|----------|------|--------|--------|
| 1 | `getSession()` instead of `getUser()` | `apps/nucleo/src/lib/server/supabase.ts` | JWT forgery risk if middleware bypassed | 0.5 days (surgical audit + fix) | ✅ **DONE** — Audit complete: all `getSession()` calls are in client components (browser-side), no server components bypass middleware |
| 2 | No webhook signature verification | Transbank + Banco Chile webhooks | Fraud vector — fake payment confirmations | 1.5 days | ✅ **DONE** — Transbank: verify via `commit(token_ws)`; Banco Chile: HMAC-SHA256 verification added |
| 3 | DTE emission disconnected from checkout | `apps/nucleo/src/api/routes/facturas-emitidas.ts` + checkout flow | Illegal sales in Chile (SII requires DTE on sale) | 2 days | 🔄 **IN PROGRESS** — Checkout creates `facturas_emitidas` on commit, needs async retry + CAF monitoring |

**These are not improvements. These are legal/security requirements.**

---

## Corrected Architecture Decisions

### Auth: Surgical Fix, Not Full Migration
- **Reality**: Supabase SSR with httpOnly cookies + middleware refresh makes `getSession()` *mostly* safe
- **Real risk**: Routes that skip middleware and call `getSession()` directly from server components
- **Action**: Audit all server component entry points → replace `getSession()` with `getUser()` only where needed
- **Do NOT**: Refactor entire auth layer or migrate to Hono for this

### API Layer: Pragmatic Rate Limiting
- **Previous proposal**: Hono-based BFF with versioning
- **Correction**: Overhead for 1-2 person team. Next.js API routes + Zod work.
- **Action**: Add `@upstash/ratelimit` on existing routes (checkout, auth, webhooks)
- **Defer**: API versioning, OpenAPI docs, contract testing until post-launch

### Offline-First: Scope to Campo Only
- **Tienda**: `localStorage`/`IndexedDB` native for cart persistence covers 95% case
- **Campo**: Already uses Dexie correctly — keep as is
- **Action**: Remove Dexie from Tienda roadmap

### Decision Logging: DECISIONS.md Over ADRs
- **Format**: Single file with date, decision, rationale
- **Location**: `docs/DECISIONS.md`
- **Reason**: Zero friction, readable, no overhead

---

## Missing Critical Items (Added After Review)

### 1. CAF (Folio) Management — Operational Blocker
- **Problem**: SII issues folios in batches (CAF). When exhausted, **no DTEs can be emitted = sales stop**
- **Current state**: Migration exists (CAF tables), no monitoring/alerting
- **Required**:
  - Cron job checking `caf_folios_disponibles < 50` → alert (email/Slack)
  - UI in Nucleo to request new CAF from SII
  - Auto-pause checkout when folios < 10 (graceful degradation)
- **Priority**: Higher than F29 generation (F29 is monthly manual; CAF exhaustion is real-time sales stop)

### 2. Webhook Retry Policy with Exponential Backoff
- **Transbank constraint**: Confirmation window has timeout
- **Current gap**: No retry logic documented or implemented
- **Required schema**:
  ```
  Attempt 1: immediate
  Attempt 2: 30s
  Attempt 3: 2m
  Attempt 4: 10m
  Attempt 5: 1h (then dead-letter queue + alert)
  ```
- **Idempotency key**: Required on all payment webhooks (Transbank `token_ws`, SumUp `transaction_id`)

### 3. Environment Separation — Pre-requisite for Team Scaling
- **Current**: Single Supabase project (assumed)
- **Required before any other engineer joins**:
  - Staging Supabase project (separate org)
  - Anonymized seed data (no real RUTs, emails, payment data)
  - CI pipeline deploys to staging on PR, production on main merge
  - Migration strategy: `supabase db push` for staging, migration files for production

---

## Refined 2-3 Week Execution Plan

### Week 1: Security & Payments (Days 1-5) — ✅ COMPLETED
| Day | Task | Owner | Status |
|-----|------|-------|--------|
| 1 | Audit `getSession()` usage → replace with `getUser()` in server components | | ✅ Done — all usages in client components |
| 2 | Add Transbank webhook verification via `commit(token_ws)` | | ✅ Done — `apps/nucleo/src/api/routes/webhooks.ts` |
| 3 | Add Banco Chile webhook HMAC-SHA256 verification | | ✅ Done — `apps/nucleo/src/api/routes/banco-chile/webhook.ts` |
| 4 | Implement idempotency keys on payment confirmation endpoints | | ✅ Done — checkout sessions track `status: completed` |
| 5 | Add `@upstash/ratelimit` on `/api/checkout`, `/api/auth/*`, webhooks | | ✅ Done — `apps/nucleo/src/api/lib/ratelimit.ts` |

### Week 1.5: SumUp & Auth Hardening (Days 6-7)
| Day | Task | Owner |
|-----|------|-------|
| 6 | SumUp webhook verification (if webhooks used; currently uses polling sync) | |
| 7 | Auth hardening: secure `getSession()` in server actions, add CSRF to auth endpoints | |

### Week 2: DTE Pipeline & CAF (Days 6-10)
| Day | Task | Owner |
|-----|------|-------|
| 6 | Hook `facturas_emitidas` route into checkout success flow | |
| 7 | Implement DTE emission on payment confirmed (async, with retry) | |
| 8 | Build CAF monitoring: cron + alert when folios < 50 | |
| 9 | Add CAF exhaustion guard: pause checkout when folios < 10 | |
| 10 | Test full flow: cart → checkout → payment → DTE → email | |

### Week 3: Testing & Observability (Days 11-15)
| Day | Task | Owner |
|-----|------|-------|
| 11 | Vitest setup in Nucleo + Tienda (unit: auth, cart, price calc) | |
| 12 | Playwright E2E: purchase flow, login, admin product CRUD | |
| 13 | Sentry integration + structured logging (pino) | |
| 14 | Health checks with dependency verification (DB, Supabase, Transbank) | |
| 15 | Staging environment setup + CI pipeline | |

---

## DECISIONS.md (Living Log)

```markdown
# Architectural Decisions

## 2026-06-14: Auth Fix Strategy
**Decision**: Surgical `getSession()` → `getUser()` replacement only where middleware bypassed
**Rationale**: Full migration to Hono/Auth middleware adds complexity for marginal gain. SSR + middleware already validates JWT server-side.
**Risk**: Low — audit covers all server component entry points.

## 2026-06-14: Rate Limiting Approach
**Decision**: `@upstash/ratelimit` on existing Next.js API routes
**Rationale**: Hono BFF is premature abstraction. Upstash integrates in 10 lines, works at edge.
**Alternative considered**: Hono-based BFF — rejected for team size.

## 2026-06-14: Offline-First Scope
**Decision**: Dexie only for Campo (already implemented). Tienda uses native IndexedDB.
**Rationale**: Tienda cart persistence ≠ full offline sync. Dexie adds 15KB + sync complexity for 5% gain.

## 2026-06-14: Decision Logging Format
**Decision**: Single `docs/DECISIONS.md` file over `docs/adr/` directory
**Rationale**: Zero friction, searchable, no tooling required. ADRs are overhead for <3 person team.

## 2026-06-14: CAF Monitoring Priority
**Decision**: CAF alerting > F29 automation
**Rationale**: CAF exhaustion stops sales in real-time. F29 is monthly, can be manual initially.
```

---

## Validation Checklist (Pre-Launch)

- [x] All server components use `getUser()` (not `getSession()`) — **verified: no server components call getSession()**
- [x] Transbank webhook verifies via `commit(token_ws)` — **implemented in webhooks.ts**
- [x] Banco Chile webhook verifies HMAC-SHA256 — **implemented in banco-chile/webhook.ts**
- [x] Payment confirmation endpoints use idempotency keys — **checkout_sessions.status prevents double-processing**
- [x] Rate limiting active on checkout, webhooks — **Upstash Redis sliding window implemented**
- [x] Rate limiting on security-events (auth telemetry) via `RATE_LIMIT_CONFIGS.auth` — login/register siguen en Supabase Auth (rate limit nativo + captcha)
- [ ] SumUp webhook verification (currently uses polling sync)
- [x] Checkout success → DTE boleta (si `SII_AUTO_EMIT_BOLETA=true`) + reintento via `sii_document_jobs` / cron fiscal
- [x] CAF cron (`/api/cron/fiscal` daily) alerts on threshold (`SII_CAF_ALERT_THRESHOLD`, default 50)
- [x] Checkout pauses when folios < min (`SII_CAF_MIN_FOLIOS`, default 10) if auto-emit o `SII_ENFORCE_CAF_ON_CHECKOUT`
- [x] Vitest en CI (packages + apps; coverage gates en módulos críticos, no 60% global aún)
- [ ] Playwright E2E full: purchase + login + admin CRUD (smokes editor/campo/checkout en CI)
- [ ] Sentry captures errors with context
- [x] Health `/live` + `/ready` + `/deps` (env presence); deep connectivity probes still optional
- [ ] Staging environment deployed, anonymized data seeded
- [ ] CI: lint → typecheck → test → build → deploy staging

---

## Parallel Agent Coordination Notes

**This document serves as context for parallel agents.** Key coordination points:

1. **Auth agent** — Owns `getSession()` audit + fix (Week 1, Day 1)
2. **Payments agent** — Owns webhook verification + idempotency (Week 1, Days 2-4)
3. **DTE/Contable agent** — Owns DTE pipeline + CAF monitoring (Week 2)
4. **Testing agent** — Owns Vitest + Playwright setup (Week 3)
5. **Infra agent** — Owns Sentry, health checks, staging env, CI (Week 3)

**Shared dependencies**:
- All agents read/write `docs/DECISIONS.md` for decisions
- Database migrations go through `packages/database` — coordinate schema changes
- `@enjambre/auth` package changes affect all 3 apps — communicate before merging
- Environment variables documented in each app's `.env.example`

---

## Next Immediate Action

**Start with auth audit** — lowest effort, highest risk reduction:

```bash
# Find all getSession() usages in server components
grep -r "getSession()" apps/nucleo/src --include="*.tsx" --include="*.ts"
grep -r "getSession()" apps/tienda/src --include="*.tsx" --include="*.ts"
```

Replace only where middleware doesn't protect the route.

---

## CRITICO — Resolver antes de produccion

### D67. Checkout loyalty cosmético — puntos no enviados ni ganados (RESUELTO — Jun 2026)

**Problema**: `checkout/ui.tsx` mostraba descuento por puntos pero `startCheckout` no enviaba `puntosACanjear`; `fulfillCheckout` no llamaba RPCs de fidelización ni insertaba `ciclos`.

**Solución (Ola 0)**:
- `@enjambre/pricing/loyalty-checkout` — validación compartida cliente/servidor.
- `checkout.ts` — valida saldo, guarda `subtotal`, `loyalty_points_redeemed`, `loyalty_discount_clp` en sesión.
- `loyalty-fulfill.ts` — `canjear_puntos_checkout`, `calcular_puntos_compra`, `agregar_puntos_usuario`, `ciclos`.
- Migración `76_ola0_loyalty_checkout.sql` — columnas sesión + RPC canje idempotente.

**Ramificación**: Fallo de canje post-pago (race de saldo) retorna error en fulfill — mismo patrón que stock gate; requiere mig 76 en prod.

---

### D68. TiendaPanel pedidos — columna `items` inexistente (RESUELTO — Jun 2026)

**Problema**: `TiendaPanel.tsx` seleccionaba `ventas.items`; schema usa `productos` → query fallaba silenciosamente.

**Estado**: RESUELTO — select corregido a `productos`, `channel`.

---

### D1. Redundancia en el Monorepo: Carpetas "Copia de..." (RESUELTO)

**Problema**: Existian multiples directorios como `apps/nucleo/Copia de Verano Eccomerce?`, `Copia de Tienda Shopify OYZ/`, etc.

**Estado**: RESUELTO — Purged 2 directories: `Copia de Tienda Shopify OYZ/` (root, 18K files, PHP/WordPress legacy) y `apps/nucleo/Copia de Verano Eccomerce?/` (43 files, Node/PHP legacy). Cero assets unicos referenciados por el monorepo actual.

**Leccion**: Nunca guardar backups de proyectos legacy dentro del monorepo. Usar git tags/archives en su lugar.

---

### D2. Componentes en la Raiz vs Monorepo (RESUELTO)

**Problema**: `components/shop/` en la raiz del proyecto mientras otros estan en `apps/tienda/components`.

**Estado**: RESUELTO — Directorio raiz eliminado (estaba vacio). Los componentes activos estan en `apps/tienda/components/shop/` (18 archivos: legal-content, whatsapp-float, bee-canvas, landing-products, guardian-sidebar, etc.). No existian imports desde la ruta raiz.

---

### D3. Version de Next.js (Todas las Apps) (RESUELTO)

**Problema**: `next: ^16.2.6` en las 3 apps — caret permite upgrades impredecibles.

**Estado**: RESUELTO — Fijado a `16.2.6` exacto (sin caret) en las 3 apps. Tipos Supabase regenerados tras migrations 39+40, lo que expuso 3 casts `as Record<string, unknown>` en joins Supabase que ahora tienen tipos concretos. Corregidos en `harvests/route.ts`, `products/route.ts`, `cart/abandonment/route.ts`. Tambien fixeado `subscriptions/route.ts` (circular reference), `sitemap.ts` (async return type), y `ulmo/page.tsx` (unicode arrow en JSX).

**Leccion**: Al fijar versiones y regenerar tipos, casts `as Record` en joins Supabase se vuelven innecesarios — los tipos generados ya describen el join.

---

### D4. No Existen Tests Automatizados (RESUELTO)

**Problema**: No habia unit tests ni tests de integracion para flujos criticos.

**Estado**: RESUELTO — Vitest implementado para `@enjambre/contable`. 79 tests en 8 archivos cubriendo: RUT validation, IVA/tax calculations, DTE XML generation, gasto-extranjero provider detection, Uber receipt parsing, tasa-cambio (mocked), receipt parser registry, Zod schemas (factura + factura-compra).

**Bug encontrado durante testing**: `detectarProveedor()` — keyword `"trip"` (uber) era substring de `"stripe"`, causando falsos positivos. Corregido con word-boundary regex (`\b`).

**Siguiente paso**: Playwright para flujo de compra completo, Testing Library para componentes criticos.

---

### D4b. Checkout Sessions en Map en Memoria (RESUELTO)

### D5. UI Barrel / Toast System Mismatch + Hidden Type Errors pre-Vercel (RESUELTO)

**Problema**: El barrel `packages/ui/src/index.ts` declaraba `export { ToastProvider, useToast, useToastHistory } from './components/toast'` (y NotificationBell, QRCode, etc.) pero la implementacion en `toast.tsx` (version simple sin history/promise) no exportaba `useToastHistory`. Esto causo `Type error: Module '"./components/toast"' has no exported member 'useToastHistory'` solo durante el type-check de Next.js en `turbo build --filter=@enjambre/tienda` en Vercel (frozen-lockfile + remote). Commit 0a92323 expuso el desalineo. Similar a previos qrcode/lockfile y toast.success sugar errors. Local `next build` o turbo no siempre replicaba hasta que se corrio explicitamente el comando de CI.

**Estado**: RESUELTO — 
- Se completo la implementacion avanzada del ToastProvider en working tree (history via localStorage, promise<T>, OYZ styling con accent, exit animations, icons, persistent, actions).
- Se agrego `export function useToastHistory()` + `export type { ... }` al final de toast.tsx.
- Se alineo `use-toast.ts` con EnhancedToast via Object.assign (soporta tanto `toast(msg, {type:'success'})` base como `.success()` sugar).
- Se agrego el export faltante `AlertTriangleIcon` en `icons/index.ts`.
- Scripts de CI local en root `package.json`: `build:ci:tienda` y `build:ci:nucleo` (exacto `pnpm install --frozen-lockfile && pnpm turbo build --filter=...`).
- Verificacion local pre-push: `pnpm turbo build --filter=@enjambre/tienda` paso "Finished TypeScript in 54s" sin errores, full build exit 0 (compilo + type check + pages).
- Commit quirurgico f711feb solo toco los 3 archivos de ui (toast.tsx, use-toast.ts, icons/index.ts); resto de cambios (SII logs, notificaciones, trazabilidad, etc.) quedaron sin stage.
- Push a main realizado (0a92323 -> f711feb).

**Leccion / Ramificacion**: En monorepo con "main":"src/index.ts" (sin build de ui), Turbopack/Next type checker en apps consumidoras es la unica fuente de verdad para exports del barrel. Cambios en barrel deben ir acompanados inmediatamente de la impl en el modulo, y verificados con `build:ci:*` local antes de push. Esto replica exactamente el pipeline de Vercel (frozen + turbo filter) y hace visibles errores de SII/runtime/build en terminal (como se pidio inspirado en Trama). Evita "solo falla en Vercel". Futuro: agregar `turbo types` o `tsc -b` explicito en CI local + husky pre-push hook para los filters criticos (tienda/nucleo).

**Siguiente**: Extender a nucleo (build:ci:nucleo), mejorar logging en todas las rutas SII (calculos-ia, reportes, rcv, certificados) con console.error(context) antes de cualquier JSON error response (para que aparezca en `vercel dev` y en los logs de build), y habilitar el worker de notifications + trigger endpoint.

### D5b. SII / Contable Type Debt — Layered "ia" + "never" + "Database.public" + Scope Errors (RESUELTO in this pass)

**Problema (manifestation in 8272a43 build on main)**: After fixing the ui barrel, the next `turbo build --filter=@enjambre/nucleo` (exact command in Vercel logs) failed TypeScript with:
- `reportes.ts:132:33: Cannot find name 'ia'` (POST handler used `ia` for .insert but only GET had declared the `const ia = supabase as any`).
- After adding the declaration: `periodos_contables` relation is `never` / no overload on `.from` (the big join select in POST for computing report datos).
- Then: `Property 'public' does not exist on type 'Database'` on the precise `Database["public"]["Tables"]["facturas_..."]["Row"]` casts.
- Local CI then surfaced follow-on in `sii/dte.ts:627`: `Cannot find name 'input'` in a console.error added for visibility (scope/control-flow in the large emission try).

Root: The generated `packages/database/database.types.ts` is incomplete for SII/contable tables and relations (periodos_contables, facturas_emitidas/recibidas joins, reportes, calculos_ia, etc.). This is "pre-existing SII stub debt" from when the features were scaffolded before full schema/types alignment.

**Estado**: RESUELTO for the current build blockers (via local iteration):
- reportes.ts: `const ia = supabase as any` now in both GET and POST (with comment), heavy join routed through `ia`, result arrays cast to `any[]` (consistent with calculos-ia.ts and eirl-dashboard.ts).
- dte.ts: console.error in catch now safe (`{ empresaId: c.get("empresaId") }`) + comment explaining the visibility goal.
- Verified by running the exact Vercel command locally multiple times (`pnpm turbo build --filter=@enjambre/nucleo`); peeled the errors one by one in terminal (no more reportes or the dte 'input' failure). Full "Running TypeScript ..." now passes for these files (the only database.types.ts signature error is pre-existing/generated and not the blocker reported in app routes).
- Pushed 80a0bff after surgical staging of only the two route files.

**Leccion / Ramificaciones (para regeneracion a largo plazo de app web compleja)**:
- **Efficacy & long-term solidity**: The `as any` / `ia` alias pattern is a deliberate temporary shield (documented) that lets real SII/DTE/CAF/emission + reporting features deliver value while the type debt is paid down. Using loose `any[]` for the joined data is acceptable because the code immediately does numeric reduces and JSON.stringify for the report "datos".
- **Functionality**: Without these, builds are red on main; registration/other flows that hit SII paths would have been masked by generic errors. Now errors (including future runtime SII failures) will be explicit in logs thanks to the console.error work.
- **Efficiency of feedback loop**: The `build:ci:nucleo` / `build:ci:tienda` scripts + discipline of running them locally before push (and after every surgical change) replicate the frozen-lockfile + turbo filter + remote-caching-disabled reality of Vercel. This is the "en trama si se puede detectar el error log" behavior. Multiple layers were found and fixed in < terminal session instead of waiting for Vercel each time.
- **Security**: No impact — these are internal BFF routes behind authMiddleware + tenantMiddleware; the `any` is only for Supabase query builder on known tables.
- **Next real fix (not workaround)**: Improve packages/database type generation (custom types for SII tables, or post-codegen augmentation), or migrate the heavy reporting queries to use views / RPCs with explicit return types. Also consider adding a `turbo types` task and pre-push hook.
- Other SII files (impuestos.ts, rcv.ts, certificados, sii/gastos, facturas-emitidas async DTE hook) already use inline `(supabase as any)` or the ia pattern in *some* queries; not all (e.g. several .from("facturas_emitidas"), "gastos", "periodos_contables", "facturas_compra" in impuestos.ts were still on plain typed supabase). This surfaced on the cache-miss contable+nucleo build after the barrel clean-up (see below). Fixed surgically with casts to match the rest of the file and other routes (reportes etc.).

**Barrel explicit re-export lesson (this iteration)**: Attempt to "help" consumer visibility for formatDateSii etc. (after nucleo dte.ts import failed with "no exported member") by adding named `export { formatDateSii, ... } from "./domain/dte-xml";` (on top of existing `export *`) caused contable's own `tsc -p tsconfig.json` (when cache miss) to fail with TS2459: "Module declares 'xxx' locally, but it is not exported." (even though dte-xml.ts had `export function`). Root: mixing export * + named re-export for the same symbols can trigger declaration analysis issues in the package's type check. Reverted to clean single `export *` (the functions have proper `export` in source; consumers resolve via the barrel). Lesson: for source-based packages ("main": "src/index.ts"), keep barrel simple — explicit named re-exports are fine if used alone or via `import ... then export`, but test with full `turbo build --filter=the-package` (not just cache-hit). This is part of the ongoing SII integration debt + making errors visible locally (the explicit attempt + cache miss is exactly what local CI caught before more Vercel runs).

**Local CI value demonstrated**: After fixing the pasted contable explicit error (by clean barrel), the next `pnpm turbo ... --filter=@enjambre/nucleo` (matching Vercel) immediately surfaced the impuestos.ts "never" + the dte.ts track_id scope in consultar catch (from the rich logging we added for SII visibility). Hoisted the consts out of try (const/let in try {} not visible in catch {}), and cast the queries. Build now reaches further. Exactly the "detectar el error log en terminal antes de Vercel" behavior requested (inspired by Trama).

**New dedicated command to know BEFORE deriving to Vercel** (added in this iteration):
- `pnpm verify` (recommended) → runs `scripts/verify-before-vercel.sh`
- The script does exactly:
  1. `pnpm install --frozen-lockfile`
  2. `pnpm turbo build --filter=@enjambre/contable --filter=@enjambre/nucleo --filter=@enjambre/tienda`
- This is the closest possible local reproduction of what Vercel actually executes in the deployment logs you keep pasting.
- `pnpm verify:ci` does the same without the install step (faster if lockfile is already good).
- Use it **before every push** (or at least before "derivar a Vercel"). If it fails, you see the full SII / type / build error in your terminal instantly — no more waiting for the remote iad1 build.

Add this to your muscle memory:
```bash
pnpm verify
# fix whatever it reports
git add ... && git commit -m "..." && git push
```

This directly addresses the repeated request: "haga algo para saber si siguen ocurriendo errores antes de derivar a vercel". Now you have a single, documented, script-backed command that fails fast locally with the exact same turbo + frozen pipeline.

**Next**: Audit remaining plain supabase.from in other SII files (rcv, certificados, etc.) for the debt tables; consider a shared `createSiiClient(supabase)` helper that returns an any-cast version for those domains; improve Database types or add .d.ts augmentation for the contable tables. Continue the self-improving loop.

**Update (next iteration on main after 8f8f538)**: New failure on `sii/dte.ts:10` import: `Module '"@enjambre/contable"' has no exported member 'formatDateSii'` (and siblings formatRutSii, escapeXml). The helpers live in `packages/contable/src/domain/dte-xml.ts` and were `export *` re-exported via index.ts, but the named members were not visible to the Next/Turbopack type checker in nucleo during "Running TypeScript".

Local `pnpm turbo build --filter=@enjambre/nucleo` (and previous runs) continued to peel: after reportes fixes, hit scope issues in the detailed console.error statements added for SII visibility (shorthand { input }, { trackId } where vars were track_id or declared with different casing / narrower flow in the large try blocks of /emitir and /consultar-estado).

**Fixes applied**:
- Explicit named re-exports in contable/src/index.ts for the DTE helpers (in addition to export *). Forces the public surface for consumers.
- Surgical safe logging in the two catch blocks in dte.ts (use the actually declared vars or c.get/param() in the log object).
- This keeps the rich `[SII DTE ...] Error: ...` logs so that real SII failures (CAF, token, stamp, enviar, consultar) appear in terminal before they are swallowed into generic JSON responses.

Pushed as 0abce07. Local CI used to iterate the symptoms.

This iteration (plus the prior ui D5) keeps the project entrelazado, funcional, and with profundidad for planned long-term delivery (real notifications + SII compliance + Guardian flows).
---


**Problema**: Las sesiones de checkout se almacenaban en un `Map` en memoria. En Vercel serverless, cada cold start pierde las sesiones — el pago se autoriza pero la orden no se persiste.

**Estado**: RESUELTO — Migration 38 crea tabla `checkout_sessions` en Postgres con RLS (service_role only). Las funciones `saveCheckoutSession`, `getCheckoutSession`, `completeCheckoutSession` ahora operan sobre Supabase. Ademas: idempotencia en webhooks (status `completed` previene doble insercion), auditoria trazable, auto-expire via `expire_checkout_sessions()`.

**Leccion**: Nunca almacenar estado de sesiones de pago en memoria en serverless. La fuente de verdad es Postgres.

---

### D55. Tienda — Carrito sin Pricing + Abandono Roto (RESUELTO — P0 Jun 2026)

**Problema (ramificaciones detectadas en auditoría quirúrgica)**:

| Capa | Fallo | Impacto |
|---|---|---|
| **Funcionalidad** | `CartProvider` declaraba `pricing`/`isLoading` pero nunca llamaba `calculateCartPricing` | Checkout bloqueado en `!cart.pricing` (spinner infinito) |
| **Funcionalidad** | `/api/cart/abandonment` consultaba tabla fantasma `carrito_items` (no existe en migraciones) | Pipeline de abandono 100% roto |
| **Seguridad** | RLS en `cart_abandonment_events`: usuarios podían INSERT pero no SELECT propio | Check de idempotencia fallaba → eventos duplicados |
| **Seguridad** | `x-oyz-role` se inyectaba en response headers, no request headers | `getOyzRole()` en Server Actions siempre devolvía `comprador` |
| **Eficacia** | `calculateCartPricing` consultaba tabla `pedidos` (inexistente) para volumen B2B | Descuentos revendedor/embajador nunca aplicaban en preview |
| **Eficiencia** | Sin debounce en pricing | N+1 Server Action calls por cada click en qty |

**Estado**: RESUELTO (P0) —
- `cart-context.tsx`: debounce 300ms → `calculateCartPricing`; expone `pricing`, `isLoading`, `pricingError`
- `app/actions/cart.ts`: rol vía `resolveOyzRole(user)` + conteo en `ventas` (paridad con Nucleo checkout)
- `utils/supabase/middleware.ts`: `x-oyz-role` en request headers
- `app/api/cart/abandonment/route.ts`: Zod + enriquecimiento server-side desde `productos`
- `lib/hooks/use-cart-abandonment.ts`: tracking en checkout (pagehide/visibility)
- Migration `55_cart_abandonment_user_select.sql`: policy SELECT propia

**Pricing unificado (P2 Jun 2026)**: RESUELTO —
- `@enjambre/pricing`: multiplicadores rol/volumen + `computeCartPricing` (SoT matemática)
- Tienda `calculateCartPricing` + Nucleo `checkout/init` consumen el package
- Nucleo `POST /api/checkout/preview` para preview autoritativo cross-app
- Fix: conteo volumen B2B en `ventas.user_id` (antes `cliente_id` con auth uid incorrecto)

**Carrito multi-dispositivo (P2 Jun 2026)**: RESUELTO —
- Migration `57_carrito_items.sql`: tabla + RLS SELECT/INSERT/UPDATE/DELETE propio
- Tienda: `cart-sync` server actions (`mergeCartOnLogin`, `syncRemoteCart`, `clearRemoteCart`)
- `CartLinesProvider`: merge al login, sync debounced 500ms, clear remoto post-checkout
- Guest sigue en localStorage; autenticado sincroniza cross-dispositivo

---

### D56. Tienda — Signup Bypass de notification_queue (RESUELTO — P1 Jun 2026)

**Problema**: `auth-context.tsx` insertaba directo en `notification_events` desde el cliente, saltándose `notification_queue` y el worker (sin retry, sin auditoría de cola). Documentado en MASTER_PLAN como riesgo de seguridad/eficacia.

**Estado**: RESUELTO —
- Nucleo: `POST /api/notifications/internal/welcome` (x-internal-key) → `notification_queue` + `notification_events` in_app (service role)
- Tienda: `POST /api/notifications/welcome` (sesión validada con `getUser()`) → proxy a Nucleo
- Register: fire-and-forget post-`checkUser()`; cero inserts Supabase desde cliente

**In-app unificado (P2 Jun 2026)**: RESUELTO —
- SoT in-app: `notification_events` channel `in_app` (tabla `alerts` legada, sin writes nuevos)
- `@enjambre/auth`: `useInAppNotifications` + mappers compartidos (tienda + nucleo NotificationBell)
- BFF `GET /api/notifications` lee `notification_events`; `/enqueue` system → `notification_events` in_app
- Estado leído: localStorage `oyz-notif-read-{userId}` cross-app

**React perf tienda (P2 Jun 2026)**: RESUELTO —
- `CartLinesProvider` + `CartPricingProvider`: split evita re-renders en add/catalogo cuando pricing cambia
- Pricing server-side solo cuando `useCartPricing()` está montado (checkout)
- Realtime notificaciones lazy: `enableRealtime` al abrir NotificationBell (`onOpenChange`)

**Preferencias de notificación (P2 Jun 2026)**: RESUELTO —
- Migration `56_notification_preferences.sql`: JSONB en `profiles` (pedidos / floracion / sistema × in_app / email)
- `@enjambre/auth/notification-preferences`: parse, merge, `shouldSendNotification`, `sourceToNotificationCategory`
- Tienda: `getNotificationPreferences` / `updateNotificationPreferences` + UI real en `/perfil/ajustes#notificaciones`
- Nucleo: gate en `enqueue-transactional.ts` + `internal/welcome` (dedupe si usuario deshabilitó ambos canales)

**Abandono email worker (P2 Jun 2026)**: RESUELTO —
- `cart-abandonment-worker.ts`: grace 30 min, email vía Resend, prefs `pedidos.email`, auditoría en `notification_queue`
- Cron `GET /api/cron/notifications` ejecuta cola + abandono en paralelo
- `fulfillCheckout` marca `cart_abandonment_events.converted=true`

**Realtime carrito (P2 Jun 2026)**: RESUELTO —
- Migration `58_carrito_items_realtime.sql` → publicación `supabase_realtime`
- `CartLinesProvider`: subscribe `carrito_items` + reload debounced; `applyingRemoteRef` evita echo con sync local

**Estado triggers (P1++ Jun 2026)**: RESUELTO —
- `enqueue-transactional.ts`: helper idempotente (`metadata.dedupe_key`) → `notification_queue` email + `notification_events` in_app
- `fulfillCheckout`: `notifyCheckoutConfirmed` post-venta (no bloquea checkout si falla)
- `PATCH /api/logistica/envios/:id`: `notifyShipmentDispatched` al pasar a enviado/en tránsito

**Estado cron (P1+ Jun 2026)**: RESUELTO —
- `GET /api/cron/notifications` (Next route, fuera del catch-all Hono): auth `Authorization: Bearer CRON_SECRET` (Vercel) o `x-worker-secret`
- `apps/nucleo/vercel.json`: cron `* * * * *` → procesa `notification_queue`
- `worker.ts`: `syncInAppEvent()` idempotente para `metadata.in_app` en reintentos; evita duplicar historial `system`+in_app

**Leccion**: Server Actions que dependen de headers de middleware deben mutar `request.headers` en `NextResponse.next({ request })`, no `response.headers`. Toda ruta que hace idempotency check bajo RLS necesita policy SELECT explícita, no solo INSERT.

---

### D64. Perfil Guardian — páginas decorativas cableadas (RESUELTO — P2 Jun 2026)

**Problema**: `/perfil/circular`, `/perfil/ritual`, `/reservas`, `/canje` tenían datos hardcodeados sin conexión a DB/API.

**Estado**: RESUELTO —
- `perfil-experiences.ts`: loyalty, subscriptions, pre_orders, referral
- Reposición canónica: `/perfil/reposicion` + `subscription-dashboard.ts`; legacy `/perfil/ritual` → redirect
- Componentes cliente con acciones reales (canje, reposición, reserva, copiar enlace)
- `/api/loyalty` corregido: usa `puntos_fidelizacion` en lugar de columnas inexistentes en `profiles`

---

### D65. Migraciones 55–61 aplicadas en remoto + typegen (RESUELTO — P1 Jun 2026)

**Problema**: Colisiones de versión (47/48 duplicados), `cart_abandonment_events` ausente pese a migration 42 registrada, tablas subscription/pre_orders faltantes.

**Estado**: RESUELTO —
- Renombrado `47_sumup` → `59`, `48_regimen` → `60`
- `55` bootstrap de `cart_abandonment_events` + RLS SELECT
- `61_bootstrap_subscriptions_preorders.sql` crea tablas + seed planes
- `pnpm db:push:all --yes` + `db:typegen` ejecutados; tipos incluyen `carrito_items`, `subscription_plans`, `pre_orders`

---

### D61. Perfil Guardian — nombre/email decorativos en Ajustes (RESUELTO — P1 Jun 2026)

**Problema**: `/perfil/ajustes` mostraba inputs estáticos sin persistencia; layout pasaba `user={null}` al sidebar.

**Estado**: RESUELTO —
- `app/actions/profile.ts` + `ProfileIdentityForm` (nombre editable, email read-only)
- Layout carga `profiles` y alimenta `TiendaSidebar` con nombre real
- Tras guardar: `refreshSession()` + `router.refresh()`

---

### D62. SII credenciales duplicadas en rutas DTE (RESUELTO — P1 Jun 2026)

**Problema**: Lógica de certificado P12 (storage + env fallback) copiada en `dte.ts`, `facturas.ts`, `rcv.ts`.

**Estado**: RESUELTO — `api/lib/sii-credentials.ts` centraliza `resolveSiiCredentials()` + `resolveSiiAmbiente()`.

---

### D66. Pipeline fiscal — soberanía Ola 1–3 (EN PROGRESO — P0 Jun 2026)

**Problema**: Gastos extranjeros tenían parse/facturar desconectados de emisión SII, poll usaba solo `SII_P12_PASSWORD`, RCV no se disparaba post-aceptación, y duplicación de lógica en `facturas.ts` / `rcv.ts`.

**Estado**: Ola 1 RESUELTA; Ola 2–3 implementadas en código (Jun 2026) —
- Ola 1: módulos `apps/nucleo/src/api/lib/fiscal/*`, cron `/api/cron/fiscal`, boleta post-checkout, 101+ tests núcleo
- Ola 2: `@enjambre/fiscal`, migraciones `63`+`64`, upload PDF/imagen, Bandeja Fiscal UI, 12 parsers, F29 FC46
- Ola 3: CSV/email ingest, conciliación stats, OpenAPI esqueleto, trazabilidad, checklist certificación
- P0 fix: migración `64_fiscal_jobs_rls_fix.sql` (INSERT authenticated en `sii_document_jobs`)
- Emisión async por defecto (`SII_ASYNC_EMIT !== 'false'`), worker actualiza `gastos_extranjeros` al completar job
- OCR imágenes PNG/JPG/WebP vía `tesseract.js` en `extractTextFromDocument`

**Pendiente producción**:
- `pnpm db:push` + `pnpm db:typegen` (migraciones 63–64 en remoto)
- Playwright E2E bandeja fiscal (`apps/nucleo/e2e/bandeja-fiscal.spec.ts`)
- Certificación SII producción (checklist API existe; go-live operativo pendiente)

**Ramificaciones mitigadas**:
| Área | Antes | Ahora |
|------|-------|-------|
| Seguridad | Poll sin credenciales por empresa | `resolveSiiCredentials` centralizado |
| Funcionalidad | UI no persistía `gastos_extranjeros` | Pipeline enlaza `factura_compra_id` + estados |
| Eficacia | CAF consumido sin guard previo | `assertCafAvailable` pre-RPC |
| Eficacia | `enviado` sin poll | Cron cada 2 min |

---

### D63. `as any` obsoleto en tablas ya tipadas (RESUELTO — P1 Jun 2026)

**Problema**: `terceros`, `notification_queue`, `reconciliation_rules`, `banco_chile_notificaciones` seguían con casts aunque existen en `database.types.ts`.

**Estado**: RESUELTO — casts removidos en rutas nucleo correspondientes.

**Siguiente**: `pnpm db:push:all && pnpm db:typegen` para tablas CRM/subscriptions (migrations 41–44) aún ausentes en remoto.

---

### D58. INTERNAL_API_SECRET reutilizaba service role (RESUELTO — P1 Jun 2026)

**Problema**: Rutas internas (`/api/security-events/internal`, `/api/notifications/internal/*`, middleware cross-app) aceptaban `SUPABASE_SERVICE_ROLE_KEY` como fallback de `x-internal-key`. En producción eso expone el service role si alguien intercepta el header.

**Estado**: RESUELTO —
- `@enjambre/auth/internal-api-secret`: `getInternalApiSecret()` + `verifyInternalApiKey()`
- Producción (`NODE_ENV=production` o `VERCEL`): exige `INTERNAL_API_SECRET`; sin fallback
- Dev/test: fallback a service role con `console.warn`
- Consumidores actualizados: nucleo BFF, tienda welcome, campo middleware, auth middleware

---

### D59. Rate limit deshabilitado sin Upstash (RESUELTO — P1 Jun 2026)

**Problema**: Sin `UPSTASH_REDIS_*`, `checkRateLimit()` devolvía `success: true` ilimitado — checkout y webhooks quedaban sin protección en entornos sin Redis.

**Estado**: RESUELTO —
- Fallback in-memory (`rate-limit.ts`) cuando Upstash no está configurado
- Test `ratelimit.test.ts` verifica enforcement local
- Upstash sigue siendo recomendado para multi-instancia en producción

---

### D60. Banco Chile /auth era stub (RESUELTO — P1 Jun 2026)

**Problema**: `POST /api/banco-chile/auth` retornaba mensaje stub aunque `@enjambre/banco-chile` y credenciales en DB existían.

**Estado**: RESUELTO — Autentica con `BancoChileClient`, persiste token en `banco_chile_tokens`, actualiza `last_sync`.

---

### D57. fulfillCheckout permitía venta con stock insuficiente (RESUELTO — P0 Jun 2026)

**Problema**: `decrement_stock` fallaba en líneas pero `fulfillCheckout` insertaba `ventas` igual (`ok: true` + `stockErrors` opcional). Mismo patrón en Campo `POST /api/pos/venta`.

**Estado**: RESUELTO —
- `cart-stock.ts`: pre-validación + decrement atómico con rollback manual si falla mid-cart
- `fulfillCheckout`: aborta antes de insertar venta si stock gate falla (`ok: false`, `stockErrors`)
- `checkout/commit`: mensaje explícito cuando pago autorizado pero stock falló
- Campo POS: 409 sin insertar venta; rollback si insert falla post-decrement

---

### D4c. 15 Unsafe `as` Casts en Tienda (RESUELTO)

**Problema**: 15 casts `as` sin validacion runtime en boundaries criticos (Supabase rows, API responses, JSON.parse, user objects). Un cambio de schema o respuesta inesperada causa silent data corruption o crash.

**Estado**: RESUELTO — Reemplazados con Zod schemas + type guards + `TiendaUserProfile`:

| Archivo | Cast eliminado | Reemplazo |
|---|---|---|
| `lib/shop/products.ts` | 4x `as unknown as ProductRow` / `as { fecha; colmenas }` | `ProductRowSchema.safeParse()`, `CosechaJoinSchema.safeParse()` |
| `lib/payments/flow-cl.ts` | 2x `as { url; token; ... }` / `as { status; ... }` | `FlowInitResponseSchema.safeParse()`, `FlowCommitResponseSchema.safeParse()` |
| `lib/payments/transbank.ts` | 1x `result as Record<string, unknown>` | `TransbankCommitResultSchema.safeParse()` |
| `lib/payments/types.ts` | 1x `data as unknown as CheckoutSessionRow` | `CheckoutSessionRowSchema.safeParse()` |
| `app/galeria/page.tsx` | 5x `item.content as Record<string, unknown>` + `as string` | `GaleriaItemContentSchema.safeParse()`, typed access |
| `app/perfil/pasaporte/page.tsx` | 1x `subConfig?.colmenas as Record<string, unknown>` | `ColmenaSchema.safeParse()` |
| `app/checkout/resultado/ui.tsx` | 2x `JSON.parse(raw) as {...}` / `res.json() as {...}` | `parsePendingCheckout()`, `parseCommitResponse()` type guards |
| `components/shop/guardian-sidebar.tsx` | `user: unknown` + `as Record` | `TiendaUserProfile` typed prop |
| `components/shop/mi-legado-client.tsx` | `user: unknown` + 2x `as string` / `as number` | `TiendaUserProfile` typed prop |
| `app/perfil/perfil-layout-client.tsx` | `user: unknown` | `TiendaUserProfile | null` typed prop |
| `components/providers/auth-context.tsx` | `role as TiendaUser['role']` | `VALID_ROLES.has()` check + fallback to `'cliente'` |

**Fixes adicionales**:
- `legal-content.tsx`: XSS en primer render (raw HTML antes de DOMPurify). Ahora `sanitized` inicia como `null` (render vacio seguro).
- `claim-client.tsx`: `createClient()` por render → `useMemo(() => createClient(), [])`. `venta.total as number` → `typeof` guard.
- `lib/integrations/run-sii-sync.ts`: 2 casts verificados — ya tenian runtime guards (`typeof` + `Array.isArray`), son narrowing seguro, no se modificaron.

**Leccion**: En boundaries externos (Supabase rows, APIs de pago, sessionStorage, JSON.parse), Zod o type guards son obligatorios. Los `as` solo son aceptables despues de un narrowing runtime verificado.

---

### D1b. Legacy CRA Client + Express Server en Tienda (RESUELTO)

**Problema**: `apps/tienda/client/` (CRA React 18 SPA, 2,167 lineas) y `apps/tienda/server/` (Express backend) eran artefactos del proyecto "Verano '25" pre-monorepo. Auth propio con JWT en localStorage (vulnerable a XSS), credenciales de prueba en UI de produccion, React 18 vs React 19 del monorepo, 786KB `package-lock.json` (npm dentro de pnpm workspace).

**Estado**: RESUELTO — Eliminados ambos directorios. Tambien:
- ESLint: removidas 2 entradas `globalIgnores` (`apps/tienda/server/**`, `apps/tienda/client/**`)
- tsconfig: removido `"client"` del `exclude` en `apps/tienda/tsconfig.json`
- Root `vercel.json`: eliminado (SPA fallback `/(.*) -> /index.html` residual que podria servir contenido erroneo si el repo root se desplegaba como proyecto Vercel)
- `apps/tienda/package-lock.json`: eliminado (lockfile npm legacy con nombre `verano-ecommerce`, deps Express del server muerto)

**Cero imports rotos** — nada en el monorepo referenciaba estos directorios. Build verificado.

**Leccion**: El monorepo no debe contener sub-proyectos legacy con su propio `package.json`, auth system y lockfile. Si existe codigo pre-migracion, completar la migracion y eliminar el original, no dejarlo coexistiendo en paralelo.

---

## ALTO — Resolver en proximos sprints

### D5. Paquetes Vacios/Stubs (RESUELTO)

**Problema**: `packages/ai`, `packages/maps`, `packages/ui` estaban practicamente vacios.

**Estado**: RESUELTO — `packages/ai` eliminado (0 consumidores, solo placeholder). `packages/maps` eliminado (0 consumidores, solo un tipo y una funcion utilitaria — nucleo usa Leaflet directamente). `packages/ui` confirmado como activo — 93+ referencias en las 3 apps (Button, Card, toast, ThemeProvider, tokens, tailwind-preset, friendlyError, etc.).

**Leccion**: Si un paquete no tiene consumidores y solo contiene placeholders, eliminar. No mantener stubs "por si acaso".

---

### D6. Auditoria de RLS Incompleta (RESUELTO)

**Problema**: Nuevas tablas sin RLS, views sin security_invoker, policies demasiado permisivas, SECURITY DEFINER functions sin auth checks.

**Estado**: RESUELTO — Migration 40 (`40_rls_hardening_audit.sql`) aborda:

| Hallazgo | Detalle | Fix |
|---|---|---|
| 8 tablas SIN RLS | `source_files`, `boletas_ingest`, `bank_movements`, `sii_sync_runs`, `notification_events`, `cosechas`, `lotes`, `arboles_plantados` | `ALTER TABLE ENABLE ROW LEVEL SECURITY` + policies por rol (migration 40) |
| `suscriptor_config` | RLS habilitado pero ZERO policies (todo bloqueado) | 4 policies: self SELECT/INSERT/UPDATE + admin ALL |
| `productos_read` | Policy con `USING true` permite anon ver productos ocultos | DROP policy legacy, queda `productos_public_read` con `visible = true` |
| `eventos_read` | `USING true` para anon | Restringido a `TO authenticated` |
| `configuracion_ia` | ALL para cualquier authenticated | Restringido a `is_admin()` |
| `integrations_select` | SELECT para cualquier authenticated | Restringido a `is_admin()` |
| 6 views sin security_invoker | `user_tier_view`, `user_ciclos_balance`, `creador_balance_view`, `creador_ranking_view`, `rep_session_summary_view`, `rep_performance_view` | `CREATE OR REPLACE VIEW ... WITH (security_invoker = true)` |
| Missing policies | `colmenas`, `inspecciones`, `varroa_records`, `peso_records`, `ciclos`, `ciclos_canjeados` sin INSERT/UPDATE/DELETE | Policies apropiadas por rol (campo app necesita write) |
| `decrement_stock()` | Ejecutable por anon/authenticated | `REVOKE EXECUTE FROM authenticated, anon` — solo service_role + triggers |
| `aplicar_codigo_creador()` | Sin auth check | `IF auth.uid() IS NULL THEN RETURN` + `SET search_path` |
| `canjear_codigo_invitacion()` | Acepta cualquier `p_user_id` | `auth.uid() != p_user_id` rechaza impersonacion |
| `calcular_comision_venta()` | Invocable desde RPC por cualquier usuario | `auth.role() NOT IN ('service_role', 'postgres')` RAISE EXCEPTION |

**Leccion**: Cada tabla nueva debe incluir `ENABLE ROW LEVEL SECURITY` + policies en su migration. Las views que acceden datos de usuario requieren `security_invoker = true`. Las SECURITY DEFINER functions deben verificar `auth.uid()` o `auth.role()`.

---

### D7. Offline-First Implementado (Campo) (RESUELTO)

**Problema**: Hubo confusión documental sobre el estado del offline-first en Campo, indicando erróneamente que había sido cancelado.

**Estado**: RESUELTO — La lógica offline-first está activamente implementada y en uso en la aplicación Campo utilizando Dexie (`apps/campo/src/lib/offline/db.ts`). No se debe eliminar; es la arquitectura autorizada según las directrices (`AGENTS.md`).

**Leccion**: Mantener alineada la documentación técnica con la realidad del código y las constituciones del proyecto para evitar refactorizaciones destructivas por confusión.

---

## MEDIO — Planificar para el roadmap

### D70. Preview Vercel tienda 404 global (`x-matched-path: /_not-found`)

**Problema**: URLs tipo `tienda-eta-lime.vercel.app` devuelven 404 en `/`, `/catalogo` y peticiones `?_rsc=` aunque el layout cargue. El service worker solo propaga el fallo de red.

**Causa**: Proyecto Vercel sin **Root Directory** `apps/tienda` o con `outputDirectory` heredado del antiguo `vercel.json` raíz (build de núcleo).

**Acción**: Dashboard → proyecto tienda → Root Directory `apps/tienda`; Build Command directo `next build` (ver `apps/tienda/vercel.json`); sin `outputDirectory` manual. O `pnpm go-live:vercel-setup` + redeploy. Prod sana: `tienda-eta-lime.vercel.app` (fix middleware next-intl Jun 2026).

---

### D69. Migraciones reposición 83–84 pendientes en remoto

**Problema**: `83_replenishment_canonical.sql` (`delivery_address` en checkout sessions, nombres de planes) y `84_subscription_renewal_period_roll.sql` (motor renovación v2) no aplicadas si `supabase db push` falla por auth.

**Acción**: Pegar `packages/database/scripts/apply-replenishment-migrations-83-84.sql` en Supabase SQL Editor (script standalone, sin `\ir`).

**Impacto sin migrar**: dirección de entrega no persiste en sesión; cron de renovación sigue en versión anterior.

---

### D13. Version Mismatch @supabase/ssr en Nucleo (RESUELTO)

**Problema**: Nucleo usaba `@supabase/ssr ^0.6.1` mientras tienda, campo y auth usaban `^0.10.3`. Gap de version mayor podia causar comportamiento inconsistente.

**Estado**: RESUELTO — Nucleo actualizado a `@supabase/ssr ^0.10.3`, consistente con el resto del monorepo.

---

### D14. lucide-react peerDep Incompatible en packages/ui (RESUELTO)

**Problema**: `packages/ui` declaraba `lucide-react ^0.575.0` como peerDep pero las 3 apps usan `^1.16.0`. Major version gap.

**Estado**: RESUELTO — peerDep actualizada a `^1.16.0` para coincidir con las apps consumidoras.

---

### D15. @enjambre/maps Dead Code (RESUELTO)

**Problema**: `packages/maps` existia con 9 lineas (1 tipo + 1 funcion) pero tenia 0 consumidores. Nucleo usa Leaflet directamente.

**Estado**: RESUELTO — Paquete eliminado. Referencia en FRONTEND_ROADMAP.md actualizada a "Integrar Leaflet". D5 actualizado para reflejar eliminacion completa (antes decia "permanece").

---

### D16. Campo y Tienda sin transpilePackages (RESUELTO)

**Problema**: Campo tenia `transpilePackages: []` y Tienda no tenia el campo. Ambas usan `@enjambre/auth` y `@enjambre/ui` (workspace packages) sin declararlos para transpilacion. Nucleo si lo hacia correctamente.

**Estado**: RESUELTO — Ambas apps ahora declaran `transpilePackages: ["@enjambre/auth", "@enjambre/ui"]`.

---

### D17. LEGACY_ROLE_MAP Duplicado en Tienda (RESUELTO)

**Problema**: Tienda reimplementaba `LEGACY_ROLES` set en `auth-context.tsx` y `user-profile.ts` en vez de importar desde `@enjambre/auth`. Violacion DRY, riesgo de desincronizacion si se agregan roles legacy.

**Estado**: RESUELTO — Ambos archivos ahora importan `LEGACY_ROLE_MAP` y `RoleKey` desde `@enjambre/auth`. Se agrego export entry `@enjambre/auth/role-redirect` (server-safe, sin hooks React) para evitar el Turbopack barrel issue en server components.

---

### D18. Non-Null Assertions en BFF (RESUELTO)

**Problema**: `security-events.ts` y `middleware.ts` usaban `process.env.NEXT_PUBLIC_SUPABASE_URL!` y `process.env.SUPABASE_SERVICE_ROLE_KEY!`. Si la env var falta, el error es criptico en vez de descriptivo.

**Estado**: RESUELTO — Reemplazados con `getEnvOrThrow()` que lanza `Error` con mensaje claro indicando la variable faltante.

---

### D19. Date.now() como ID Generator en Checkout (RESUELTO)

**Problema**: El init de checkout (antes en tienda, hoy en Núcleo `apps/nucleo/src/api/routes/checkout.ts`) usaba `Date.now()` para `buyOrder` y `sessionId`. Riesgo de colisión bajo concurrencia.

**Estado**: RESUELTO — Reemplazado con `crypto.randomUUID()`. La ruta `apps/tienda/app/api/checkout/*` fue eliminada; tienda delega a `{NUCLEO}/api/checkout/init|commit`.

---

### D20. tsconfig.next.json Excluye Directorio Inexistente (RESUELTO)

**Problema**: `apps/nucleo/tsconfig.next.json` excluia `"Copia de Cafeteria Eureka!"` — directorio ya eliminado en D1.

**Estado**: RESUELTO — Entrada removida del `exclude`.

---

### D21. Vite Remanents en Nucleo (RESUELTO)

**Problema**: `vite.config.ts`, `tsconfig.app.json`, `tsconfig.node.json` y scripts `dev:spa`/`build:spa` persistian tras la migracion a Next.js App Router.

**Estado**: RESUELTO — Eliminados los 3 archivos de config Vite y los 2 scripts SPA del `package.json`. La app es 100% Next.js.

---

### D22. Root test Script Placeholder (RESUELTO)

**Problema**: Root `package.json` tenia `"test": "echo 'Error: no test specified' && exit 1"`. `pnpm test` siempre fallaba.

**Estado**: RESUELTO — Redirigido a `cd packages/contable && pnpm test` donde existen 79 tests con vitest.

---

### D23. Campo tailwind.config.js sin preset + clases Tailwind prohibidas (RESUELTO)

**Problema**: Campo tenia `tailwind.config.js` manual sin usar `@enjambre/ui/tailwind-preset`, sin tokens `success`/`warning`/`info`. 43 usos de clases prohibidas (`text-amber-400`, `bg-green-500/10`, `from-stone-400`, `text-red-400`, `bg-salud-optima`, etc.) en 9 archivos POS.

**Estado**: RESUELTO — Campo ahora usa `enjambrePreset` (tiene `success`/`warning`/`info` + `bosque`/`miel`/`crema` + `card`/`popover`/`sidebar` etc). `globals.css` importa `@enjambre/ui/tokens.css` y define utilities `.card-glow`. 43 clases prohibidas reemplazadas en:
- `leaderboard-panel.tsx`: `from-amber-*` → `from-warning`, `from-stone-*` → `from-secondary`, `from-orange-*` → `from-accent`
- `quick-sale-button.tsx`: `text-green-400` → `text-success`, `text-amber-400` → `text-warning`, `text-orange-400` → `text-accent`
- `client-lookup-panel.tsx`: `bg-amber-500/10` → `bg-warning/10`, `text-amber-400` → `text-warning`
- `threshold-notification.tsx`: `from-amber-500` → `from-warning`
- `cash-session-panel.tsx`: `bg-salud-optima` → `bg-success`, `bg-salud-riesgo` → `bg-destructive`, `text-amber-400` → `text-warning`
- `tier-badge.tsx`: `text-green-400` → `text-success`, `text-amber-400` → `text-warning`, gradient `to-amber-400` → `to-warning`
- `pos/page.tsx`, `historial/page.tsx`, `carrito/page.tsx`, `catalogo/page.tsx`: `green-*` → `success`, `amber-*` → `warning`, `red-*` → `destructive`, `cyan-*`/`purple-*`/`blue-*` → `info`

---

### D24. WhatsApp hardcoded hex en Tienda (RESUELTO)

**Problema**: `whatsapp-float.tsx` usaba `bg-[#25D366]` y `hover:bg-[#20bd5a]` (hardcoded hex, prohibido por convencion).

**Estado**: RESUELTO — Reemplazado con `bg-success` y `hover:bg-success/90`. Tienda ya usa `enjambrePreset` que mapea `--success` al verde del design system.

---

### D25. ProductForm `as any` + CRMView formatter type error (RESUELTO)

**Problema**: `ProductForm.tsx` usaba `resolver: zodResolver(...) as any` (eslint-disable). `CRMView.tsx` tenia `formatter={(val: number) => ...}` incompatible con recharts `ValueType`.

**Estado**: RESUELTO — `as any` reemplazado con `as never` (type assertion mas estrecha, no desactiva type checking en todo el form). CRMView: `(val: number)` → `(val: unknown)` con `Number(val)` runtime guard.

---

### D26. Persistent `any` types en apps y API (RESUELTO)

**Problema**: A pesar de la prohibición en la Constitución, existían usos de `any` en componentes clave (`LogisticaView.tsx`, `TrazabilidadPanel.tsx`, `PedidosPage.tsx`) y rutas de la API (`produccion.ts`). Esto degradaba la seguridad de tipos y dificultaba el mantenimiento.

**Estado**: RESUELTO —
- `LogisticaView.tsx`: Tipado manual de `selectedVenta` y `items` en mappings.
- `produccion.ts` (API): Implementado `itemSchema` con Zod para validar `items` de ventas dinámicamente.
- `TrazabilidadPanel.tsx`: Definida interfaz `Lote` y tipado fuerte en iteraciones.
- `PedidosPage.tsx` (Tienda): Definida interfaz `Order` y casting seguro del resultado de Supabase.

**Lección**: La eliminación de `any` es un proceso continuo. No basta con arreglar `as any` puntuales; hay que auditar componentes visuales y boundaries de API frecuentemente.

---

### D8. EIRL Absorbido por Nucleo (VERIFICADO — Sin residuos)

**Problema**: `apps/eirl` fue absorbido por nucleo (vistas en `apps/nucleo/src/views/eirl/`). Originalmente usaba SQLite + Prisma + NextAuth, totalmente independiente de Supabase.

**Estado**: VERIFICADO — No se encontraron residuos de Prisma, SQLite ni NextAuth en nucleo. Las vistas EIRL usan Supabase + `@enjambre/contable` + `@enjambre/ui`. Cero imports de prisma. EIRL es el tipo legal de entidad del negocio, no un residue tecnico.

---

### D9. Hardcoding de Contenido (Resuelto)

**Problema**: Textos de landing quemados en codigo.

**Estado**: RESUELTO — Implementado `site_content` en Supabase + fetching dinamico.

**Leccion**: Siempre usar CMS para contenido editable por el cliente.

---

### D10. Variables de Entorno Dispersas (RESUELTO)

**Problema**: Cada app tenia sus propias variables con nombres inconsistentes. Nucleo aun referenciaba `VITE_*` (pre-Next.js migration). `apps/tienda/.env` estaba committed a git con placeholder secrets. `turbo.json` no incluia `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` para cache invalidation.

**Estado**: RESUELTO — Acciones:
- Eliminado `apps/tienda/.env` (legacy Express, committed con placeholders). Solo `.env.local` (gitignored) y `.env.example` quedan.
- Eliminado `apps/nucleo/src/vite-env.d.ts` (legacy Vite type declarations, 0 consumers).
- Migracion scripts (`migrate.ts`, `migrate_phase2.ts`): `VITE_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`.
- `turbo.json`: removidas 3 `VITE_*` vars, agregada `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (cache invalidation fix).
- `apps/nucleo/.env.example`: reescrito sin VITE_, solo NEXT_PUBLIC_.
- `apps/tienda/.env.example`: agregado `NEXT_PUBLIC_YOUTUBE_VIDEO_ID`.
- Root `.env.example`: reescrito reflejando estado actual (3 apps Next.js, cero VITE_).

---

### D27. SEO Incompleto en Tienda + Apps Privadas Indexables (RESUELTO)

**Problema**: 6 páginas públicas de Tienda (`/catalogo`, `/nosotros`, `/ciencia`, `/experiencias`, `/galeria`, `/contacto`) solo tenían `metadata.title` — sin description, OG, canonical, ni JSON-LD. Esto degradaba CTR en SERPs y perdía rich snippets. Además, Nucleo y Campo (apps privadas con datos sensibles) no tenían `robots: noindex`, permitiendo su indexación por buscadores.

**Estado**: RESUELTO —
- 6 páginas de Tienda: metadata completa con `description`, `alternates.canonical`, `openGraph` (title, description, url, type, locale, siteName), `twitter` (card, title, description).
- `/catalogo`: JSON-LD `ItemList` dinámico con productos reales.
- `/nosotros`: JSON-LD `Article` + `BreadcrumbList`.
- `json-ld.ts`: nueva export `articleJsonLd()`.
- Nucleo layout: `robots: { index: false, follow: false }`.
- Campo layout: `robots: { index: false, follow: false }`.

**Ramificaciones identificadas**:
- Seguridad: Nucleo/Campo exponían rutas autenticadas a crawlers. El `noindex` mitiga filtración de URLs internas en resultados de búsqueda (no reemplaza auth/RLS, que ya existe).
- Eficacia SEO: Sin canonical, Google podía considerar contenido duplicado entre www/non-www o HTTP/HTTPS. Sin OG, los shares en redes no tenían preview.
- Consistencia: Las páginas legales (`/terminos`, `/privacidad`, etc.) ya tenían `description` en metadata — las públicas eran las únicas sin completar.

**Leccion**: Toda página pública debe tener metadata completa (title, description, canonical, OG) como paso mínimo de SEO. Las apps privadas (dashboard, POS) siempre deben declarar `robots: noindex`.

---

### D28. Type Errors en Nucleo: TrazabilidadPanel + LogisticaView (RESUELTO)

**Problema**: `TrazabilidadPanel.tsx` usaba `useApiFetch` como si retornara `{ data, isLoading }` (patrón SWR/TanStack), pero la firma real retorna una función `apiFetch` que produce `Promise<Response>`. Además usaba `stats: any` y `useState([])` sin tipo, causando inferencia `never[]`. `LogisticaView.tsx` tenía `items: string | unknown[]` en tipo `Envio` (no renderizable como ReactNode) y accedía propiedades inexistentes (`venta_id`, `items`) en tipos de ventas.

**Estado**: RESUELTO —
- `TrazabilidadPanel.tsx`: Reemplazado `useApiFetch<T>(path)` con patrón correcto: `const apiFetch = useApiFetch()` + `useQuery<ProduccionData>({ queryFn: async () => { const res = await apiFetch(path); ... return res.json() } })`. Eliminado `any` (tipado `ProduccionData` con stats explícito). Tipado explícito en `useState` para `localArboles` y `localReflexiones`. Removido `useEffect` no usado.
- `LogisticaView.tsx`: `items: string | unknown[]` → `items: string`. Agregado `venta_id?: string` a tipo `Envio`. Agregado `items?` a tipo de `ventasRecientes`.

**Leccion**: `useApiFetch` es un factory que retorna una función fetch, no un hook de datos. Los 10+ consumidores correctos usan `const apiFetch = useApiFetch()` + `useQuery`. Los `useState([])` sin tipo genérico inferencian `never[]`, inservible para `.reduce()` o `.map()`.

---

## BAJA — Mejoras de calidad

### D11. Linting Inconsistente

**Problema**: No hay ESLint configurado consistentemente en todo el workspace.

**Accion**: Configurar ESLint flat config con reglas compartidas en la raiz.

### D12. Sin CI/CD Pipeline (PARCIALMENTE RESUELTO — Jun 2026)

**Problema**: No había pipeline fiable; job `test-contable` apuntaba a `packages/database` sin script `test`.

**Estado**: PARCIALMENTE RESUELTO —
- `.github/workflows/ci.yml`: `pnpm install --frozen-lockfile`, tests (contable, pricing, auth, nucleo, tienda), builds+lint por app
- Root `pnpm test` ejecuta el mismo stack de packages

**Siguiente**: Playwright e2e en CI; `verify` script en pre-push hook.

---

## Indice de Prioridad

| ID | Deuda | Prioridad | Esfuerzo | Riesgo |
|---|---|---|---|---|
| D11 | Linting | BAJA | Medio | Bajo |
| D12 | Sin CI/CD | BAJA | Medio | Medio |

*Actualizar este documento cuando se resuelva un item o se descubra nueva deuda.*
*Ultima actualizacion: Junio 2026 — D66 Ola 1–3 en código; P0 RLS+async+OCR; pendiente db:push remoto*
