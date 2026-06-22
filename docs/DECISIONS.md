# Architectural Decisions — Enjambre Legado

Living log of technical decisions. Format: Date | Decision | Rationale | Alternatives Considered

---

## 2026-06-22 | Comercio soberano — no Shopify; apps top como inspiración

**Decision**: La tienda D2C es una **app personalizada OYZ** (estética editorial, filosofía guardian, profundidad Chile). No se migra a Shopify. Las categorías de apps Shopify más usadas (ReCharge, Smile, Stamp Me, Klaviyo, Route, PassKit…) son **checklist de mecánica**, no dependencias. Especificación en [`COMERCIO_SOBERANO.md`](./COMERCIO_SOBERANO.md).

**Rationale**: Shopify aplana marca y desconecta fiscal CL, trazabilidad colmena→frasco y ritual biocultural. El moat es nativo en el monorepo.

**Alternatives considered**: Headless Shopify + custom storefront — **rejected** (soberanía de datos y costo apps). WooCommerce — **rejected** (legacy purgado).

**Status**: Documentado; implementación por fases A–F en `COMERCIO_SOBERANO.md` §6.

---

## 2026-06-22 | Ola 0 — Loyalty checkout server-authoritative

**Decision**: Canje de puntos solo vía BFF `checkout/init` (validación) + RPC `canjear_puntos_checkout` en fulfill (idempotente por `buy_order` + `venta_id`). Reglas en `@enjambre/pricing/loyalty-checkout` (100 pts = $1.000 CLP; mínimo pago $1). Ganancia de puntos y ciclos en `loyalty-fulfill.ts` tras insertar venta.

**Rationale**: Evita fraude de descuento; alinea monto Flow con sesión Postgres; cierra loop guardian antes de wallet/reseñas.

**Alternatives considered**: Canje solo en cliente — **rejected**. Reserva de puntos en init — **deferred** (complejidad TTL).

**Status**: Implementado; requiere `pnpm go-live:db-push` para mig 76.

---

## 2026-06-22 | Reseñas duales — anónima rápida vs guardian profunda

**Decision**: En tienda, dos modos de reseña con trade-offs explícitos. **Anónima**: rating + texto corto, moderación estricta, visibilidad secundaria en PDP, sin ciclos. **Guardian (registrada)**: huella sensorial completa, compra verificada, destacada en PDP, +ciclos al aprobar. Post-reseña anónima, CTA para registrarse y **elevar** vía `resenas_claim_tokens`. Spec en [`PLAN_COLOSAL.md`](./PLAN_COLOSAL.md) §3.

**Rationale**: Inspiración Judge.me/Okendo pero con profundidad OYZ; la anónima no compite con la profunda — la invita a convertirse en guardian.

**Alternatives considered**: Solo reseñas con cuenta — **rejected** (fricción alta, menos voces). Reseñas anónimas sin moderación — **rejected** (spam).

**Status**: Implementado (Ola 1); mig **77**, `@enjambre/resenas`, BFF `/api/resenas`, PDP + perfil. Requiere `pnpm go-live:db-push` (74–77).

---

## 2026-06-22 | Wallet Guardian — sellos por producto en Apple/Google Wallet

**Decision**: Ofrecer tarjeta **storeCard** (Apple) / **Loyalty Object** (Google) con progreso visible del tipo “te faltan N unidades de [producto] para 1 gratis”. Requiere tablas `guardian_stamp_programs` + `guardian_stamp_progress` y paquete `@enjambre/wallet`. Spec en [`WALLET_GUARDIAN.md`](./WALLET_GUARDIAN.md).

**Rationale**: Supera apps tipo Stamp Me al combinar wallet nativo + narrativa OYZ + mismo ledger que `ventas` y POS Campo (QR).

**Alternatives considered**: Solo PWA / perfil web — **rejected** (baja retención vs lock screen). Puntos genéricos sin producto — **rejected** (no comunica “10 sachets”).

**Status**: Implementado Ola 2 (B1–B3 + stubs W1–W2); mig **78**; firma `.pkpass` / Google JWT requiere certs en Vercel. `pnpm go-live:db-push`.

---

## 2026-06-21 | Puente incentivo_ledger → honorarios SII

**Decision**: Tras aprobar un ítem en `incentivo_ledger` (tipos honorario feria/bonos), el admin ejecuta `preparar_honorario_desde_ledger` (migración 71) vía `POST /api/sii/honorarios/desde-ledger`. Crea registro en `honorarios` con `incentivo_ledger_id` UNIQUE y actualiza `referencia_tabla/id` en el ledger. No marca `pagado` ni emite DTE 66 automáticamente.

**Rationale**: Cierra el ciclo legal-operativo (honorarios + retención art. 42 N°2 en F29) sin saltarse revisión humana. `impuestos.ts` ya suma `honorarios.monto_retencion` para F29.

**Alternatives considered**: Auto-emitir DTE 66 al aprobar — **rejected** (riesgo fiscal sin boleta del prestador). Duplicar monto en ledger y honorarios sin FK — **rejected** (sin trazabilidad).

**Status**: Implementado (migración 71, BFF, UI Operadores Feria, badge en HonorariosTab).

---

## 2026-06-21 | Panel reps sin contrato feria — visibilidad admin, sin bloquear caja

**Decision**: Exponer en `/reps` y `/operadores-feria` los `rep_ventas` / `rep_profiles` activos sin `participante_contrato.estado = activo`. Deep-link `/operadores-feria?rep={userId}` pre-rellena formulario de borrador. Guard en UI impide crear segundo borrador/activo; no migración DB.

**Rationale**: Un rep puede operar caja y comisiones (`rep_profiles`) sin contrato feria (`participante_contrato`). Eso deja hueco legal-operativo (sin consignación, arqueo ni honorarios trazados). La solución P2 es visibilidad + onboarding acelerado, no bloquear ventas (P3+ si se requiere hard gate en POS).

**Alternatives considered**: UNIQUE `user_id` en contrato — **deferred** (requiere limpieza de datos). Bloquear `channel=feria` sin contrato — **deferred** (impacta Campo offline).

**Status**: Implementado (`feria-contrato-status.ts`, `RepsPanel`, `OperadoresFeriaPanel`).

---

## 2026-06-21 | Devolución consignación feria — operador declara, RPC atómica

**Decision**: La devolución física de stock consignado se registra solo vía RPC `registrar_devolucion_consignacion_feria` (migración 70). El operador (`rep_ventas` con contrato activo) puede declarar devoluciones **solo** en su evento `en_curso`; admin puede registrar en cualquier evento no `cerrado`. Por defecto repone `productos.stock` (simetría con migración 68).

**Rationale**: Sin RPC, el operador no tiene RLS de escritura en `participante_consignacion` (solo SELECT). La devolución reduce `pendiente` y evita falsos 409 en POS (`validar_consignacion_feria`). No reutilizar `revertir_consignacion_feria` (service_role, revierte ventas).

**Alternatives considered**: Solo admin registra devoluciones — **rejected** (cuello de botella operativo en feria). UPDATE directo con policy amplia — **rejected** (riesgo de manipular `cantidad_vendida`).

**Status**: Implementado (migración 70, UI núcleo).

---

## 2026-06-21 | Red de Intercambio — participantes sin fragmentar roles

**Decision**: Portal creador en **tienda** (`/perfil/creador`); Vanguardia absorbida en **CRM** (tabs Aliados B2B + Huella Sensorial); operadores feria modelados en `participante_contrato` sin nuevo rol auth. Puntos legales frágiles documentados en [`RED_INTERCAMBIO_LEGAL.md`](./RED_INTERCAMBIO_LEGAL.md).

**Rationale**: Un participante externo no debe ver el sidebar de admin; la relación jurídica se expresa en perfiles y capabilities, no en multiplicar `profiles.role`. Comisiones = referidos; honorarios feria = prestación independiente con revisión humana.

**Status**: Implementado (migración 65, UI tienda + CRM, redirect auth).

---

## 2026-06-19 | Soberanía fiscal — sin facturadores de terceros

**Decision**: Toda emisión DTE, ingestión de invoices extranjeros, sincronización RCV y preparación F29 se implementa de forma **nativa** en el monorepo (`@enjambre/contable`, `@enjambre/fiscal`, Núcleo BFF). No se integrarán APIs de facturadores externos (Wasabil, etc.) como dependencia de producto.

**Rationale**:
- Soberanía de datos, marca y UX alineada a Enjambre Legado (territorio, trazabilidad, tienda+campo+núcleo unificados).
- Ventaja competitiva: fiscal + e-commerce chileno en una sola fuente de verdad, no “plugin de facturación”.
- El código existente (7 parsers, `enviar-sii`, RCV sync, 79 tests contable) ya es la base — falta cablear pipeline, no reemplazar por SaaS.

**Alternatives considered**:
- Adaptador API Wasabil para time-to-market — **rejected** (contradice estrategia de marca y dependencia).
- Solo facturador manual SII sin software — **rejected** (no escala rentabilidad).

**Implementation path**: Ver [`docs/SOBERANIA_FISCAL.md`](./SOBERANIA_FISCAL.md) y [`docs/FISCAL_PIPELINE.md`](./FISCAL_PIPELINE.md). Ola 1: cablear UI → emisión → poll → RCV. Ola 2: `@enjambre/fiscal` + upload PDF + bandeja.

**Status**: OLA 1 COMPLETE — S1.1–S1.6 (Jun 2026). Ver `TECHNICAL_DEBT.md` D66. Siguiente: Ola 2 documental.

---

## 2026-06-14 | Auth Fix Strategy: Surgical `getSession()` → `getUser()` Replacement
**Decision**: Audit all server components for `getSession()` usage. Replace with `getUser()` only where middleware bypass is possible.
**Rationale**: Supabase SSR with httpOnly cookies + middleware refresh validates JWT server-side. Full migration to Hono/Auth middleware adds complexity for marginal gain. Risk is localized to routes skipping middleware.
**Alternatives Considered**: Full auth layer refactor, migrate all apps to `@enjambre/auth/middleware` — rejected (overhead for 1-2 person team).
**Status**: ✅ **COMPLETED** — Audit complete: all `getSession()` calls are in client components (browser-side). No server components bypass middleware. No changes needed.

---

## 2026-06-14 | Rate Limiting: `@upstash/ratelimit` on Existing Next.js API Routes
**Decision**: Add Upstash rate limiting to `/api/checkout`, `/api/auth/*`, webhook endpoints.
**Rationale**: Hono-based BFF is premature abstraction. Upstash integrates in ~10 lines, works at edge, no new runtime. Next.js API routes + Zod validation already functional.
**Alternatives Considered**: Hono BFF with versioning, OpenAPI, contract testing — rejected (architectural debt for current team size).
**Implementation**: 
- `apps/nucleo/src/api/lib/ratelimit.ts` — Upstash Redis sliding window rate limiter with per-IP tracking
- Applied to: `/api/checkout/init`, `/api/checkout/commit`, `/api/checkout/webhook/flow`, `/api/webhooks/transbank`, `/api/banco-chile/webhook`
- Configurable limits: checkout (5/min), auth (10/min), webhook (100/min), api (30/min)
- Returns standard headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`
**Status**: ✅ **COMPLETED** — Week 1.5 Day 6

---

## 2026-06-14 | Transbank Webhook Verification: Call `commit(token_ws)` Instead of HMAC
**Decision**: Verify Transbank webhooks by calling the Transbank `commit(token_ws)` endpoint, not HMAC signature.
**Rationale**: Transbank Webpay Plus doesn't use HMAC signatures on webhooks. The official verification pattern is to call `commit(token_ws)` which validates the transaction directly with Transbank. This is more secure than HMAC because it validates with the payment processor.
**Implementation**: `apps/nucleo/src/api/routes/webhooks.ts` — receives webhook, calls `provider.commit(token_ws)`, only processes if `authorized === true`.
**Alternatives Considered**: HMAC verification — rejected (Transbank doesn't provide HMAC signatures for Webpay Plus webhooks).
**Status**: ✅ **COMPLETED** — `apps/nucleo/src/api/lib/payments/transbank-cl.ts` provider + webhook updated

---

## 2026-06-14 | Banco Chile Webhook Verification: HMAC-SHA256
**Decision**: Verify Banco Chile webhooks using HMAC-SHA256 with shared secret (`BANCO_CHILE_WEBHOOK_SECRET`).
**Rationale**: Banco Chile signs webhooks with HMAC-SHA256. The signature is sent in `x-banco-chile-signature` header.
**Implementation**: `apps/nucleo/src/api/routes/banco-chile/webhook.ts` — reads raw body, computes HMAC, compares with header.
**Alternatives Considered**: No verification — rejected (security risk).
**Status**: ✅ **COMPLETED** — Added `verifyBancoChileSignature()` function

---

## 2026-06-14 | Payment Provider Abstraction: Support Both Flow and Transbank
**Decision**: Create `PaymentProvider` interface with `FlowClProvider` and `TransbankClProvider` implementations. Select via `PAYMENT_PROVIDER` env var.
**Rationale**: Allows switching between Flow and Transbank without code changes. Both providers implement the same interface (`init`, `commit`, `refund`).
**Implementation**: `apps/nucleo/src/api/lib/payments/provider.ts`, `transbank-cl.ts`, `flow-cl.ts`, `types.ts`.
**Alternatives Considered**: Hardcoded Flow only — rejected (need Transbank for production Chilean payments).
**Status**: ✅ **COMPLETED** — Both providers implemented, registry updated

---

## 2026-06-14 | Offline-First Scope: Dexie Only for Campo
**Decision**: Keep Dexie-based offline sync in Campo (already implemented). Tienda uses native `localStorage`/`IndexedDB` for cart persistence only.
**Rationale**: Tienda cart persistence ≠ full offline sync. Dexie adds 15KB + sync engine complexity for ~5% UX gain. Campo legitimately needs full offline POS.
**Alternatives Considered**: Dexie for both apps — rejected (overengineering for Tienda).
**Status**: CONFIRMED — No action needed

---

## 2026-06-14 | Decision Logging Format: Single `DECISIONS.md` Over ADR Directory
**Decision**: Use this file (`docs/DECISIONS.md`) for all architectural decisions.
**Rationale**: Zero friction, searchable, no tooling, readable in any editor. ADR directory structure is overhead for <3 person team.
**Alternatives Considered**: `docs/adr/001-title.md` format — rejected (process overhead).
**Status**: ACTIVE — This file

---

## 2026-06-14 | CAF Monitoring Priority Over F29 Automation
**Decision**: Implement CAF (folio) monitoring + alerting before F29 automated generation.
**Rationale**: CAF exhaustion stops sales in real-time (no DTEs can be emitted). F29 is monthly, can be manual initially. Operational impact of CAF exhaustion > F29 automation.
**Required**: Cron job checking `caf_folios_disponibles < 50` → alert; checkout pause when folios < 10.
**Alternatives Considered**: F29 automation first — rejected (lower operational risk).
**Status**: TODO — Week 2 Days 8-9

---

## 2026-06-14 | Webhook Retry Policy: Exponential Backoff with Dead-Letter Queue
**Decision**: Implement retry schema for Transbank/SumUp webhooks:
- Attempt 1: immediate
- Attempt 2: 30s
- Attempt 3: 2m
- Attempt 4: 10m
- Attempt 5: 1h → dead-letter queue + alert
**Rationale**: Transbank confirmation window has timeout. Without retry, confirmed payments can stay "pending" indefinitely. Idempotency keys required on all payment webhooks.
**Status**: TODO — Week 1 Days 2-4 (part of webhook verification)

---

## 2026-06-14 | Environment Separation: Staging Supabase Project Required Pre-Team
**Decision**: Provision separate Supabase project for staging with anonymized seed data before any other engineer onboards.
**Rationale**: Single production DB is single point of failure. Staging enables safe migration testing, PR preview deployments, and parallel development.
**Required**: 
- Separate Supabase org/project for staging
- Anonymization script (no real RUTs, emails, payment data)
- CI: deploy staging on PR, production on main merge
- Migration strategy: `supabase db push` for staging, migration files for production
**Status**: TODO — Week 3 Day 15

---

## 2026-06-14 | DTE Pipeline: Async Emission with Retry on Payment Confirmed
**Decision**: Hook `facturas_emitidas` into checkout success → emit DTE asynchronously with retry logic (not blocking checkout response).
**Rationale**: SII requires DTE on sale. Sync emission blocks user, fails on SII downtime. Async with retry + idempotency = resilient compliance.
**Status**: TODO — Week 2 Days 6-7

---

## 2026-06-14 | Testing Strategy: Vitest (Unit) + Playwright (E2E) in CI
**Decision**: 
- Vitest for unit tests (auth logic, cart calculations, price/tax utils)
- Playwright for E2E (purchase flow, login, admin CRUD)
- CI pipeline: lint → typecheck → test → build
**Rationale**: 3 API tests in Nucleo = effectively zero coverage. Need confidence for payments + auth.
**Target**: >60% unit coverage on business logic; 5 critical E2E paths.
**Status**: TODO — Week 3 Days 11-12

---

## 2026-06-14 | Observability: Sentry + Structured Logging (Pino) + Health Checks
**Decision**: 
- Sentry for error tracking (DSN in env)
- Pino for structured JSON logs (not `console.log`)
- `/api/health` with dependency checks: DB, Supabase Auth, Transbank connectivity
**Rationale**: Production debugging without observability is guesswork. Health checks enable load balancer / Vercel probing.
**Status**: TODO — Week 3 Days 13-14

---

## Decision Template (For Future Entries)

```markdown
## YYYY-MM-DD | Short Title
**Decision**: What was decided
**Rationale**: Why this over alternatives
**Alternatives Considered**: What else was evaluated
**Status**: TODO | IN_PROGRESS | CONFIRMED | SUPERSEDED
**Related**: Links to code, PRs, or other decisions
```