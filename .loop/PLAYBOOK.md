# PLAYBOOK — patrones reales de Oyz App (Enjambre Legado) v1.2

Actualizar solo cuando un fix o audit confirma el patrón en código.  
Prompt hermano: `.loop/PROMPT.md` v1.2 (go-live · SII · SumUp · Banco Chile).

---

## Go-live / validación de integraciones (fase v1.2)

| Patrón | Síntoma | Detección | Fix canónico |
|--------|---------|-----------|--------------|
| Checklist SII rojo | “casi listo” sin go-live | `GET /api/sii/certificacion/checklist` | CAF **33/39/46**, P12, clave SII, encryption key, DTE venta + FC aceptados; `listoCertificacion` ≠ `listoProduccion` (Palena solo si cert OK) |
| Jobs DTE huérfanos | emisión falla y nadie ve | dead_letter en DB sin UI | `GET /api/sii/jobs` + Retry; cron `/api/cron/fiscal` |
| Checklist SII sin UI | API existe, operador ciego | Settings SII sin panel | Card checklist en `SettingsTab` + badges Maullín/Palena |
| Config solo env/SQL | no se puede operar sin deploy | valor de negocio solo en `.env` o SQL | **config-en-UI**: form + PATCH/POST BFF; env = secretos plataforma |
| Emisor incompleto en UI | DTE con RUT/giro vacíos | Settings solo regimen/acteco | PATCH empresa: rut, razon_social, giro, dir, comuna, ciudad, region, email, tel |
| CAF sin import UI | folios solo por SQL | GET /caf sin POST | `POST /caf/import-xml` + parse AUTORIZACION; activar por tipo |
| P12 password env-only | no se emite sin Vercel | `resolveSiiCredentials` solo `SII_P12_PASSWORD` | upload UI cifra `p12_password_encriptada`; resolve DB→env fallback |
| Route huérfana | API existe sin mount | archivo routes sin `siiRoutes.route` | montar en `sii/index` al crear |
| Ambiente cert en prod UI | emite a Maullín sin querer | `empresas.sii_ambiente` + UI settings | gate explícito; no default produccion sin checklist |
| CAF exhausto open | vende sin folio | `getFoliosRestantes` / caf-guard | fail-closed min folios; alert threshold |
| SumUp sin key | terminal muerto | `sumup_config` vacío o disabled | config-en-UI tab Config + enable; API key cifrada; no mock en production |
| SumUp readers vacíos | API OK pero UI 0 | response `{items:[]}` no array | normalizar items/readers/data en client + BFF |
| SumUp doble cobro POS | retry re-envía al terminal | mismo checkout_reference | tabla `sumup_terminal_checkouts` + return existing |
| SumUp client duplicado | plaintext key / drift | new SumUpClient en cada route | `resolveSumUpClient` + decrypt legacy |
| SumUp sin checklist | “casi listo” ciego | no probe merchant/readers | `GET /sumup/checklist` + test-connection |
| Banco sandbox hardcode | creds prod golpean sandbox | `environment: sandbox\|production` en config | URL host según environment (client ya soporta) |
| Banco token churn | password-grant cada request | expires_in como epoch | tokenExpiresAtMs = now + expires_in*1000; hydrate DB |
| Banco sync incompleto | solo saldos, 0 movs | UI solo GET cuentas | POST /sync cuentas+movimientos |
| Banco secrets en client | password en RLS browser | `supabase.from(config).upsert` con secret | solo `POST /api/banco-chile/config` + seal AES |
| Banco sin checklist | go-live ciego | no token/cuentas probe | `GET /checklist` + Probar auth + sync cuentas |
| Conciliación 400 UI | motor no corre | body sin empresa_id + schema required | tenant `empresaId` en BFF; body opcional |
| Stats tabla wrong | tasa match 0 falsa | query `conciliaciones` genérica | `banco_chile_movimientos` + `banco_chile_conciliaciones` |
| Webhook sin verify | abono/tx forjada | route webhook sin secret/firma | secret server + HMAC + idempotency |
| Webhook reprocess dup | doble update de estado | no early-return si event id existe | dedupe `event:{id}` → 200 sin side-effects |
| Firma solo hex | 401 con base64 real | compare solo hex | aceptar hex, `sha256=`, base64 |
| Webhook secret open | 500 o accept vacío | throw si falta secret / `===` HMAC | 503 fail-closed; timing-safe equal |
| Webhook admin open | listar notifs sin JWT | GET pendientes en router pre-auth | authMiddleware + tenant + admin en esas rutas |
| Cron fiscal muerto | jobs stuck | `CRON_SECRET` empty en Vercel | require secret; schedule vercel.json |
| Env matrix incompleta | works local fails prod | `docs/ENV-CHECKLIST.md` | `pnpm env:check` + def en `scripts/lib/env-matrix-def.mjs` |
| Runtime env ciego | no se sabe qué falta en deploy | solo CLI local | `GET /api/health/env-status` + Configuración → Entorno |
| Encryption gap | no se pueden guardar secrets negocio | sin SII_CLAVE_ENCRYPTION_KEY | key ≥32 en Vercel nucleo; health checks encryption |
| Mock en production | cobro/fiscal falso | `if (process.env.NODE_ENV !==` skip real API | production siempre path real o deny |
| Pagos web ciego | no se sabe si puede cobrar | sin checklist runtime | `GET /api/checkout/admin/checklist` + UI `/pagos` tab web |
| Sesiones pending huérfanas | pago OK sin venta | no listado admin | `GET /checkout/admin/sessions` + fulfill path |

---

## Entrelazado / herramientas por rol

| Patrón | Síntoma | Detección | Fix canónico |
|--------|---------|-----------|--------------|
| Page huérfana | herramienta inaccesible por nav | page en `(dashboard)` sin `sidebar-config` href | añadir item + greeting/mission + VIEW_SHELL si aplica |
| Widget sin CTA | dato huérfano en Ecosistema | widget sin `Link` a módulo dueño | links tokens: accent/muted + ArrowUpRight |
| Header duplicado | doble título | h1 local + shell global | ModuleHero **o** VIEW_SHELL_PATHS, no ambos sin criterio |
| Guard desalineado | 403 o open | ROUTE_ROLE_GUARDS vs sidebar | registrar path en guards (admin) |
| Deprecado sin rastro | URL muerta en bookmarks | page solo redirect | guards OK; no reintroducir en sidebar (vanguardia→crm) |
| Role home wrong | post-login mal app | getRoleRedirectPath | admin→ejecutivo; cliente→catalogo; rep→pos; creador→perfil/creador |

## UI canónica

| Patrón | Fix |
|--------|-----|
| Header de módulo | `ModuleHero` (greeting/title/mission del sidebar item) |
| Sección | `SectionHeader` (kicker/title/subtitle) |
| Glass | `GlassPanel` de `@enjambre/ui`, no `.glass-panel` ad-hoc nuevo |
| Loading | `ViewLoading` / `HexagonLoader` |
| Tabla | `DataTable` |
| Tokens | `bg-background`, `text-foreground`, `text-accent`, `border-border` — never slate/white hex |
| Referencia | EcosistemaDashboard Bento + GSAP stagger |

---

## Auth / sesión / roles

| Patrón | Síntoma | Detección | Fix canónico |
|--------|---------|-----------|--------------|
| getSession en gate server | JWT no revalidado | `getSession()` en middleware/API/server actions de acceso | `getUser()`; session solo client token cache |
| user_metadata role | cliente se auto-promueve | `user.user_metadata.role` / `oyz_role` client-writable | `profiles.role` o `app_metadata`; trigger/RLS bloquea self-role |
| Fail-open middleware | dashboard sin sesión | missing/invalid Supabase env → `next()` | `!isSupabaseConfigured()` → redirect login (no public/api); never bare next |
| defaultRole admin | JWT sin role = admin | `defaultRole: "admin"` en nucleo middleware | `defaultRole: "cliente"`; least privilege |
| Unlisted route open | cliente entra /monitor-feria etc. | `isRouteAllowed` final `return true` | fail-closed: unlisted → admin only; registrar en ROUTE_ROLE_GUARDS |
| Role redirect wrong app | cliente cae en núcleo o loop | `getRoleRedirectPath` absolute cross-host | redirects relativos dentro de la app (tienda fix histórico) |
| LEGACY_ROLE_MAP forget | rol viejo sin path | `apicultor`/`gerente` sin map | consolidar a `admin` vía map + migration 39 |
| ROUTE_ROLE_GUARDS solo UI | path accesible sin rol | page client check only | middleware + BFF authz |
| createClient ad-hoc | drift de auth | `createBrowserClient` suelto en component | `@enjambre/auth` / re-export `apps/*/lib` |
| Barrel auth en server | Turbopack / useEffect crash | import `@enjambre/auth` en RSC | entry `/server-index`, `/middleware`, `/security-events` |
| E2E_SKIP_AUTH en prod | auth bypass POS/SII | env `=1` en Vercel production | require `E2E_SKIP_AUTH=1` **and** `VERCEL_ENV !== 'production'` |
| access_denied no logueado | ciego a fuerza bruta path | middleware sin fire-and-forget | `POST …/security-events/internal` + `x-internal-key` |

---

## Checkout / pagos / pricing

| Patrón | Síntoma | Detección | Fix canónico |
|--------|---------|-----------|--------------|
| Precio del body | paga $1 producto caro | `unit_price` / `total` del client en init | solo `product_id`+`qty`; precio desde `productos` |
| Multiplicador solo client | B2B gratis | preview client sin JWT check | `computeCartPricing` server + `app_metadata.oyz_role` |
| Session en memoria | double charge / lost session | Map en process memory | `checkout_sessions` Postgres; expire 30m |
| Fulfill no idempotente | doble venta / doble stock− | commit sin `status=pending` | update condicional pending→completed |
| Webhook sin verify | orden gratis | POST “paid” sin commit real | Transbank `commit(token_ws)`; Flow/HMAC según provider |
| Monto body Flow/TBK | fraude | amount del request | amount desde sesión + BD |
| returnUrl abierto | phishing post-pago | `returnUrl` body → provider.init | `resolveCheckoutReturnUrl` allowlist origin+path |
| CAF open checkout | venta ilegal sin DTE | folios=0 sigue init | enforce en production o auto-emit; opt-out `SII_ENFORCE_CAF_ON_CHECKOUT=false` |
| SII clave AES vacío | password SII cifrado con key vacía | `SERVICE_ROLE ?? ""` | fail-closed; prefer `SII_CLAVE_ENCRYPTION_KEY` ≥32 |
| POS CAF if cafData | sin CAF vende igual | only check when row exists | `getFoliosRestantes` (0 si null) + min |
| DTE desconectado | venta sin boleta | commit sin enqueue fiscal | job `venta` → cron fiscal retry |
| Abandonment flood | spam email | POST abandonment abierto | auth + rate; precios server-side |
| Pricing desalineado | preview ≠ charge | tienda action vs nucleo init | único `@enjambre/pricing` |

---

## BFF Hono / internal / crons

| Patrón | Síntoma | Detección | Fix canónico |
|--------|---------|-----------|--------------|
| Handler sin authMiddleware | mutación anónima | route registra sin chain | `authMiddleware` → `tenantMiddleware` → Zod |
| x-internal-key = anon | forge internal | compare con NEXT_PUBLIC | secret server; timing-safe |
| if (CRON_SECRET && …) | cron abierto sin env | grepear `if (.*SECRET &&` | `if (!secret) return 500`; luego compare |
| service_role pre-authz | bypass RLS total | admin client al inicio del handler | authz primero; scope mínimo |
| Zod skip | inject weird types | handler raw body | schema parse fail → 400 |
| Health leaks secrets | info disclosure | `/api/health` dumps env | deps probe booleans only |

---

## Campo POS / offline / feria

| Patrón | Síntoma | Detección | Fix canónico |
|--------|---------|-----------|--------------|
| supabase.insert UI directa | offline pierde venta | insert en component POS | Dexie `sync_queue` + `use-sync-engine` |
| Double sync sale | stock/caja ×2 | reprocess sin idempotency key | `client_request_id` → ventas.buy_order `POS-{uuid}`; replay 200 |
| items_override price | feria paga de menos | precio_unitario del body | reprice desde productos server |
| Cash session open race | dos cajas abiertas | open sin check active | constraint/RPC una sesión activa por rep |
| Feria sin contrato | venta canal feria ilegal | channel=feria sin evento | operadores-feria: contrato+en_curso |
| Claim token forge | cliente reclama ajeno | token predecible / sin bind venta | token crypto + single use + RLS |
| Leaderboard PII | ranking expone datos | select * profiles | campos mínimos |
| SW cache auth HTML | shell ajeno device compartido | Serwist cache navigate dashboard | NetworkOnly API + auth paths |
| SumUp webhook open | POS falso | route sin verify | signature + idempotency transaction_id |

---

## Fiscal / contable / empresa

| Patrón | Síntoma | Detección | Fix canónico |
|--------|---------|-----------|--------------|
| Sin has_empresa_access | cross-tenant contable | query empresa_id del body | RLS + helper policy; JWT/profile bind |
| CAF no monitor | sales stop sorpresa | sin cron alert folios | cron <50 alert; <10 pause emit |
| as any SII | datos corruptos silent | casts en dte/cert | tipos + fromLoose pattern ya usado |
| F29 manual only | OK | no auto | no inventar auto-F29 en loop sin pedido |
| RUT invalid accept | DTE reject SII | skip validator contable | `@enjambre/contable` RUT helpers |

---

## CMS / chrome / público

| Patrón | Síntoma | Detección | Fix canónico |
|--------|---------|-----------|--------------|
| CMS HTML raw | XSS tienda | `dangerouslySetInnerHTML` menú/banner | sanitize allowlist; CSP iframe audit |
| Revalidate abierto | DoS cache / poison | `/api/revalidate` sin secret | secret header fail-closed |
| shop-chrome fork | drift nucleo/tienda | copy local store-chrome | solo `@enjambre/shop-chrome` |
| sale-qr fork | QR distinto feria/campo | copy local | `@enjambre/sale-qr` |
| Reseña sin rate | flood / SEO spam | insert abierto | auth o throttle + RLS |
| Wallet pass forge | sello falso | endpoint sin authz compra | bind venta/pedido verificado |

---

## Runtime / UI general

| Patrón | Síntoma | Detección | Fix canónico |
|--------|---------|-----------|--------------|
| Theme hydration #418 | flash / React error | theme script post-hydrate | blocking script pre-paint (fix histórico) |
| Spinner eterno | blanco post-login | `loading \|\| !user` sin redirect | `!loading && !user` → `/login` |
| null.id dashboard | crash home | map rows nullable | guard + optional chain |
| Setter `_setX` | ReferenceError | rename sin wrapper | restaurar nombre o useCallback |
| Hook sin import | crash mount | bare `useEffect` | named import react |
| catch vacío | falla silenciosa feria | `catch {}` / `catch (e) { console }` only | `toast.error` / friendlyError |
| ChunkLoadError blank | editor-tienda blanco | lazy wrong path | import directo view (fix histórico) |

---

## Design system (Ley III)

| Patrón | Síntoma | Detección | Fix canónico |
|--------|---------|-----------|--------------|
| Hex / stone / gray | dark mode roto | `bg-stone-`, `#`, `text-white` en apps | `bg-background` / `text-foreground` / tokens ui |
| font ad-hoc | no editorial | font-family inline | Cormorant `font-display` + sans tokens |
| Touch pequeño POS | mis-tap feria | icon btn sin min size | `min-h-11 min-w-11` |
| Safe-area ausente | notch cubre caja | fixed sin safe | utilidades safe-area |
| Duplicar componente ui | drift | nuevo Button local | `packages/ui` |

---

## Entrelazados frecuentes

- `@enjambre/auth` → middleware tienda/nucleo/campo + security-events  
- `@enjambre/pricing` → cart action tienda + checkout/preview núcleo + suscripciones  
- `fulfillCheckout` → stock → lotes → DTE job → notifications  
- `x-internal-key` → security-events/internal + notifications/internal  
- cash-sessions ↔ rep-ventas ↔ campo POS ↔ commission-rules  
- CAF ↔ checkout commit ↔ cron fiscal  
- `@enjambre/shop-chrome` ↔ editor-tienda ↔ tienda header  
- `@enjambre/sale-qr` ↔ campo ↔ feria claim  
- carrito_items RLS ↔ mergeCartOnLogin ↔ abandonment worker  

---

## Comandos baratos (reactivación)

```bash
cd "/Users/macbook/Desktop/oyz app"

# auth gates
rg -n "getSession\(|getUser\(|user_metadata|E2E_SKIP_AUTH|createAdminClient|SERVICE_ROLE" \
  packages/auth apps --glob '!**/node_modules/**' --glob '!**/.next/**'

# checkout / dinero
rg -n "fulfillCheckout|checkout_sessions|computeCartPricing|token_ws|CRON_SECRET|x-internal-key" \
  apps/nucleo apps/tienda packages/pricing --glob '!**/node_modules/**'

# fail-open secrets
rg -n "if \(.*SECRET &&|if \(.*secret &&" apps packages --glob '!**/node_modules/**'

# campo offline
rg -n "sync_queue|createAdminClient|service_role|CashProvider" apps/campo --glob '!**/node_modules/**'

# design drift (cono)
rg -n "text-white|bg-black|bg-stone-|text-stone-|bg-gray-|#\[|#[0-9a-fA-F]{3,8}" \
  apps packages/ui/src --glob '!**/node_modules/**' --glob '!**/*.css'

# tests mínimos según cono
pnpm --filter @enjambre/pricing test
pnpm --filter @enjambre/auth test
pnpm --filter @enjambre/database test
pnpm --filter @enjambre/campo exec vitest run
```

---

## Ya endurecido (no reabrir sin regresión) — seed desde TECHNICAL_DEBT 2026-07

| Área | Nota |
|------|------|
| getSession audit server | usos residuales client-only (re-auditar si nuevas server routes) |
| Transbank commit verify | webhooks route |
| Banco Chile HMAC | webhooks |
| CAF fail-closed + min folios | fiscal checkout |
| DTE boleta retry jobs | cron fiscal |
| Rate limit auth-events | security-events |
| shop-chrome / sale-qr packages | fuente única |
| Campo e2e smoke + E2E_SKIP_AUTH | solo test path |
| Database package tests | types + migrations integrity |
| Theme blocking script | hydration #418 |
| Role redirects relativos tienda | auth fix |

Ops residual frecuente: **staging Supabase**, apply migraciones 93–94+, typegen CRM, secrets Vercel (`pnpm env:check:prod` / `go-live:check`).


## Feria / reps / comisiones (pass6)

| Patrón | Síntoma | Fix canónico |
|--------|---------|--------------|
| commission-rules sin role | rep inventa multiplicadores | `requireProfileRole('admin')` en toda la route |
| cash close race | doble cierre / resumen basura | update `.eq(session_status,'open').eq(rep_id)` + maybeSingle |
| claim token race | doble vinculo reseña | update `.is(claimed_at,null)` first |
| salt dev en prod | forge rate-limit/claim hash | RESENAS_*_SALT ≥16 required in production |
| claim POS | — | UUID + RPC obtener/reclamar (OK medido) |


## Campo / rep_ventas (pass9)

| Patrón | Fix canónico |
|--------|--------------|
| Solo /pos protegido | `CAMPO_PROTECTED_PREFIXES` + `isCampoProtectedPath` en middleware Edge |
| Nav duplicada landing | grid desde `CAMPO_NAV_ROUTES` |
| POS sin hermanas | PosHeader toolLinks = NAV sin /pos |
| Shell oprime POS | full-bleed si `pathname.startsWith('/pos')` |
| paths en middleware | `paths.ts` sin lucide (Edge-safe) |


## UI canónica Núcleo (pass11)

| Patrón | Fix |
|--------|-----|
| Header módulo | `ViewShell` compact/hero (no inline style h1) |
| Tab anidado en hub | h2 de sección, no segundo ViewShell hero |
| CTA primary | `Button` de `@enjambre/ui` |
| Referencia | ContableHubView, CosteoView, EcosistemaDashboard |


## UI canónica Tienda perfil (pass12)

| Patrón | Fix |
|--------|-----|
| Header /perfil/* | `PerfilPageHeader` → ModuleHero |
| Display type | `font-display` (Cormorant), never `font-serif` |
| Empty list | `EmptyState` + `Button` from `@enjambre/ui` |


## UI canónica Campo (pass13)

| Patrón | Fix |
|--------|-----|
| Display type | `font-display` (Cormorant), never `font-serif` |
| Headers POS/tools | `ViewShell` compact + CSS en `globals.css` |
| Toggle knobs | `bg-background` not `bg-white` |
| Touch | `min-h-11` on range filters / primary actions |


## Néctar crosslinks (pass14)

| Patrón | Fix |
|--------|-----|
| Módulo silo | `NectarRail` bajo ViewShell en colmenas/producción/catálogo/operaciones/regeneración/contable |
| Flujo canónico | Colmenas → Lotes → Productos → Despacho → Impacto → Contable → SII |
| Cliente | Mi Legado chips a pedidos/reposicion/trazabilidad/catalogo/ciencia |
