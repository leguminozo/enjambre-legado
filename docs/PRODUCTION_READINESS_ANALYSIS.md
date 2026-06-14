# Production Readiness Analysis — Enjambre Legado

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
| 5 | Add `@upstash/ratelimit` on `/api/checkout`, `/api/auth/*`, webhooks | | 🔄 Pending |

### Week 1.5: Rate Limiting & SumUp (Days 6-7)
| Day | Task | Owner |
|-----|------|-------|
| 6 | Add `@upstash/ratelimit` on checkout, auth, webhook endpoints | |
| 7 | SumUp webhook verification (if webhooks used; currently uses polling) | |

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
- [ ] Rate limiting active on auth, checkout, webhooks
- [ ] SumUp webhook verification (currently uses polling sync)
- [ ] Checkout success → DTE emitted (async, retried, logged) — **partial: facturas_emitidas created on commit, needs retry + CAF**
- [ ] CAF cron runs daily, alerts on <50 folios
- [ ] Checkout pauses gracefully when folios <10
- [ ] Vitest runs in CI (unit coverage >60% on business logic)
- [ ] Playwright E2E passes: purchase, login, admin CRUD
- [ ] Sentry captures errors with context
- [ ] Health endpoint checks DB, Supabase Auth, Transbank connectivity
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