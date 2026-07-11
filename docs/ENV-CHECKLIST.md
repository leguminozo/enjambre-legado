# Checklist de entornos (nucleo · tienda · campo)

Secrets **nunca** se commitean. Usá `.env.local` en local y Vercel Project Settings en preview/prod.

## Proyectos Vercel canónicos

| App | URL prod (guillermoc) | Root directory |
|-----|------------------------|----------------|
| Núcleo | `https://nucleo-theta.vercel.app` | `apps/nucleo` |
| Tienda | `https://tienda-eta-lime.vercel.app` | `apps/tienda` |
| Campo | `https://campo-olive.vercel.app` | `apps/campo` |

No uses proyectos viejos (`gaboxxc/*`) para prod.

## Matriz de variables

| Variable | nucleo | tienda | campo | Notas |
|----------|:------:|:------:|:-----:|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ | Mismo proyecto Supabase por env |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` o `ANON_KEY` | ✅ | ✅ | ✅ | Pública |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ server | ✅ server | ⚠️ opcional | Nunca `NEXT_PUBLIC_*` |
| `INTERNAL_API_SECRET` | ✅ | ✅ | ✅ (si llama BFF) | **Mismo valor** en las 3 apps |
| `CMS_REVALIDATE_SECRET` | recomendado | recomendado | — | Opcional; fallback = `INTERNAL_API_SECRET` |
| `NEXT_PUBLIC_NUCLEO_API_URL` | ✅ | ✅ | ✅ | URL del BFF (nucleo) |
| `NEXT_PUBLIC_URL_TIENDA` / `NEXT_PUBLIC_TIENDA_URL` | ✅ | — | ✅ | CORS, claim QR, revalidate |
| `NEXT_PUBLIC_URL_CAMPO` | ✅ | — | — | Redirects rep_ventas |
| `NEXT_PUBLIC_SITE_URL` | — | ✅ | — | SEO / metadata tienda |
| Flow / Transbank | ✅ | — | — | Solo nucleo (pagos) |
| `BANCO_CHILE_*` | ✅ | — | — | Webhooks + client |
| SumUp keys | ✅ / campo | — | via nucleo | Terminal POS |
| `CRON_SECRET` | Vercel | — | — | Crons fiscales/notif |

## Supabase (por environment)

- [ ] Migraciones aplicadas (`pnpm go-live:verify-db` / `db-push`)
- [ ] Buckets Storage: `cms` (public read, admin write), `productos`
- [ ] RLS: `site_content`, storage policies
- [ ] RPC: `registrar_escaneo_qr`, feria consignación, etc.

## Cross-app smoke

```bash
# Local: presencia de keys (sin imprimir valores)
pnpm go-live:check

# Matriz extendida
node scripts/env-matrix-check.mjs
```

1. Nucleo Editor → guardar Marca → iframe tienda refresca (revalidate)
2. Campo POS → venta + claim URL apunta a tienda
3. Tienda checkout → BFF nucleo responde (no CORS)

## Preview vs Production

| | Preview | Production |
|--|---------|------------|
| Supabase | Preferir branch o proyecto staging | Proyecto prod |
| Secrets | Mismos nombres; valores de staging | Valores prod |
| URLs públicas | `*.vercel.app` del deploy | Dominios canónicos |

## Checklist post-deploy

- [ ] Headers CSP: nucleo `frame-src` incluye tienda; tienda `frame-ancestors` incluye nucleo
- [ ] Sin `X-Frame-Options: SAMEORIGIN` en tienda (rompe preview CMS)
- [ ] `INTERNAL_API_SECRET` idéntico nucleo ↔ tienda
- [ ] `NEXT_PUBLIC_URL_TIENDA` en nucleo = origen real de tienda
