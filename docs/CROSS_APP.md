# Contratos entre apps

> **Clase: VIVO.** El monorepo no es tres sitios: es un grafo. Romper un contrato de esta página es un incidente cross-app.
> Secretos: [`ENV-CHECKLIST.md`](./ENV-CHECKLIST.md). Mapa: [`REPO_MAP.md`](./REPO_MAP.md).

## Topología de confianza

```
                    ┌──────── Supabase (1 proyecto) ────────┐
                    │  Auth · Postgres RLS · Storage · Realtime
                    └────────────▲────────────▲────────────▲─┘
                                 │            │            │
        anon/user JWT            │            │            │
                 ┌───────────────┴──┐    ┌────┴────┐   ┌───┴────┐
                 │     TIENDA       │    │  CAMPO  │   │ NÚCLEO │
                 │  :3001 / D2C     │    │  :3002  │   │ :3000  │
                 │  lee CMS, cobra  │    │  Dexie  │   │ BFF    │
                 └────────┬─────────┘    └────┬────┘   └───▲────┘
                          │                   │            │
                          │  NEXT_PUBLIC_NUCLEO_API_URL    │
                          └─────────── HTTP ──┴────────────┘
                          x-internal-key = INTERNAL_API_SECRET
                          (prod: NUNCA service_role)
```

Tres proyectos Vercel, **mismas** `NEXT_PUBLIC_SUPABASE_*`. URLs canónicas (guillermoc): `nucleo-theta`, `tienda-eta-lime`, `campo-olive` + dominios `obrerayzangano.*`. No uses proyectos `gaboxxc/*`.

## Contratos (romper = bug)

| # | De → A | Qué | Auth | Si falla |
|---|---|---|---|---|
| 1 | 3 apps → Supabase | Auth + Data API | anon / user JWT / service_role solo server Núcleo (y tienda server puntual) | Login, RLS, Storage |
| 2 | Tienda/Campo → Núcleo BFF | Checkout, caja, POS replay, welcome, CMS write path | Bearer usuario y/o `x-internal-key` | Cobro, sync, editor |
| 3 | Middleware 3 apps → `POST /api/security-events/internal` | `access_denied` | `INTERNAL_API_SECRET` | Se pierde el audit; no debe tumbar la request (fire-and-forget) |
| 4 | Núcleo editor → Tienda `POST /api/cms/revalidate` | Invalida landing/catálogo | `CMS_REVALIDATE_SECRET` o fallback internal | Iframe/CMS stale |
| 5 | Campo rewrite `/api/cash-sessions/*` | `next.config` → origen Núcleo | sesión Campo | 404 de caja en Campo |
| 6 | Campo POS → Tienda `/claim/…` | QR post-venta | público + token | Fidelización rota en feria |
| 7 | Auth redirects | `ROLE_REDIRECT_MAP` + `NEXT_PUBLIC_URL_*` | JWT role | Bucles tienda↔núcleo |
| 8 | Tienda iframe en editor | CSP `frame-ancestors` Núcleo | — | Editor en blanco |
| 9 | Webhooks Flow/TBK/Banco/SumUp → Núcleo | dinero / conciliación | firma o `commit(token_ws)` | Pago capturado sin orden |
| 10 | Crons Vercel → Núcleo `/api/cron/*` | cola, fiscal, checkout | `CRON_SECRET` | Cola crece 24 h |

## Secretos que deben **coincidir**

| Clave | Dónde | Regla |
|---|---|---|
| `INTERNAL_API_SECRET` | 3 apps, mismo valor | Prod: obligatorio. Sin fallback a service_role (`packages/auth/src/internal-api-secret.ts`). |
| `NEXT_PUBLIC_SUPABASE_URL` + anon/publishable | 3 apps | Un solo proyecto por environment. |
| `NEXT_PUBLIC_NUCLEO_API_URL` | Tienda + Campo (+ auto Núcleo) | Origin del BFF. CORS y rewrite viven de esto. |
| `NEXT_PUBLIC_URL_TIENDA` / `_CAMPO` | Núcleo (y Campo para claim) | Redirects y revalidate. |
| `CMS_REVALIDATE_SECRET` | Núcleo + Tienda | Si falta, internal secret. Dev puede abrir; prod no. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Núcleo (tienda server puntual) | Nunca `NEXT_PUBLIC_*`. Nunca en Campo client. |

Matriz completa: [`ENV-CHECKLIST.md`](./ENV-CHECKLIST.md).

## Superficies públicas vs internas

| Pública (anon / SEO) | Autenticada | Interna (secret) |
|---|---|---|
| Catálogo, CMS publicado, mapa/censo agregado, claim QR, webhooks firmados | Perfil, checkout, POS, patio, BFF usuario | `/internal/*`, crons, revalidate, service_role |

No montes un `GET` interno “por conveniencia” sin secret. Health: `/api/health/live` es público a propósito; `/ready` y `/deps` no exponen valores.

## Cómo añadir un contrato

1. ¿Puede vivir como lectura Supabase + RLS? Entonces no hay HTTP cross-app.
2. Si hay write caro o secreto: ruta en BFF Núcleo + `authMiddleware` / `verifyInternalApiKey`.
3. Documenta la fila en esta tabla en el mismo PR.
4. Suma la env a `scripts/lib/env-matrix-def.mjs` y a `ENV-CHECKLIST`.
