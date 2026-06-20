# Architectural Decisions — Enjambre Legado

Living log of technical decisions. Format: Date | Decision | Rationale | Alternatives Considered

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