# PLAYBOOK — patrones reales de Oyz App (Enjambre Legado) v1.3

Actualizar solo cuando un fix o audit confirma el patrón en código.  
Prompt hermano: `.loop/PROMPT.md` **v1.3** (interfaz gráfica · spacing · responsive).  
Sección go-live v1.2 se conserva abajo como referencia histórica/ops.

---

## UI / interfaz gráfica (fase v1.3 — activa)

| Patrón | Síntoma | Detección | Fix canónico |
|--------|---------|-----------|--------------|
| Hero cue overlap | texto “Descender” / línea corta copy | absolute center + hero bajo | `min-h-[100svh]`; cue a un lado o `pb-*` en stack; hide vertical label hasta `lg` |
| Hero cue vs home bar | línea “Descender” tapa safe area iPhone | `bottom-6` fijo | `bottom-[max(1.5rem,env(safe-area-inset-bottom))]` + hero pt/pb max(safe) |
| Landing media arrows | flechas 40px + dots 8px | `w-10 h-10` / `w-2 h-2` | arrows `min-h-11`; dots wrap `min-h-11 min-w-11`; bottom safe-area |
| Campaign banner CTA | CTA promo &lt;44 | `py-2` only | `min-h-11` + px-5 |
| Hero stack denso | CTA cortado / formula corta | `min(70dvh)` + clamp grande | bajar clamp H1; `max-w` subtitle; `mt` CTA |
| Nav densa | links apretados 1200px | header una sola fila | collapse / drawer desde `lg`; gap tokens |
| Announcement dismiss | usuario no puede cerrar en touch | solo doble-clic / hint hover | botón × min-h-11 con aria-label en carousel |
| PWA install prompt | Instalar/cerrar &lt;44 en móvil | py-2 / p-2 | install `min-h-11`; dismiss min-h/w-11 |
| Lang solo desktop | no se cambia idioma en 375 sin menú | `hidden sm:block` | LanguageSelector siempre en actions header |
| Mobile drawer home bar | últimos links bajo safe | pad-bottom fijo | `calc(... + var(--safe-bottom))` en panel/drawer |
| Header notch | brand/actions bajo status bar | sticky sin pad safe | `.tienda-shop-header { padding-top: var(--safe-top) }`; sticky-top + safe-top |
| Metrics 2-col crush | números gigantes en mobile | `grid-cols-2` + `text-5xl` | `text-3xl sm:text-5xl`; gap |
| Science 3-col tablet | párrafos aplastados | `md:grid-cols-3` | `lg:grid-cols-3` |
| Hex / emerald drift | rompe dark luxury | className raw | tokens `text-primary` / `text-success` / Badge variant |
| Go-live checklist div | ritmo distinto SII/checkout vs Banco | `bg-card rounded-2xl` ad-hoc | `Card`+`CardHeader`+lista `divide-y`+badge pill + CTAs min-h-11 |
| SII amber badges | dark mode roto en bandeja fiscal | `text-amber-*` estados revisión | `text-warning bg-warning/10 border-warning/*` |
| Perfil hover-only actions | edit/delete direcciones invisibles en touch | `opacity-0 group-hover` + p-2 | siempre visibles `min-h-11 min-w-11` |
| Custom notif switch | hit 40×20 | track h-5 w-10 | track min-h-11 w-[52px] knob h-5 (como Switch package) |
| Package Calendar hex | date picker gris iOS hardcode | `#4a4a4a` / `text-white` / `#a3a3a3` | `bg-card text-foreground border-border`; days `hover:bg-muted` |
| Tier stone/amber raw | dark mode / Ley III | `bg-stone-*` `text-amber-*` en TierBadge | muted/warning/accent/info semánticos; un solo tierConfig |
| Impact emerald drift | hex-like en package stats | `emerald-500` `green-600` variants | success/primary/warning/info/accent |
| SelectItem densos | mis-tap opciones en móvil | `py-1.5` sin min-h | `min-h-11 py-2.5`; search input min-h-11 |
| Dialog close &lt;44 | mis-tap cerrar modal | close icon absolute sin hit box | `min-h-11 min-w-11` absolute close |
| Button sin min-h | sm/md &lt;44 en ops táctil | solo py-1.5/2.5 | `min-h-11` (sm/md) · `min-h-12` (lg) en sizeClasses |
| Touch <44 | botones finos en campo/tienda/nucleo shell | py-1 / w-h 38 sin min-h | `min-h-[44px] min-w-[44px]`; header-btn/sheet close/bell 44 |
| ViewShell hero cascade | título del hero con color foreground (no primary-fg) | `.view-shell-title` después de `.hero-title` | `.view-shell--hero .view-shell-title { color: primary-foreground }` |
| SidebarNavItem crush | items menú ~28px touch | inline `padding: space-xs` pisa `.nav-item` | `minHeight: 44` + pad `0.625rem`; CSS `.nav-item` min-height 44 |
| Nucleo .btn densos | CTAs shell &lt;44 en desktop/tablet | `.btn` solo py space-sm | `.btn`/`.btn-sm`/`.input-field` `min-height: 44` |
| Filter chips 40 | mis-tap filtros view-deep | `min-height: 40px` | `min-height: 44px` |
| Login nucleo densos | forgot/toggle sin hit | text p-0 / pad 0.6rem | min-h-11 CTAs; submit min-h-12 |
| Shell footer logout | mis-tap cerrar sesión | `btn-ghost p-1.5` + icon 16 | `min-h-11 min-w-11`; avatar perfil 44 |
| Safe-area | FAB/WhatsApp tapa home bar | fixed bottom | `bottom-[max(1rem,env(safe-area-inset-bottom))]` |
| Sticky double safe | cart/checkout bar flota demasiado | `bottom: safe` + `padding-bottom: safe` | `bottom: 0; padding-bottom: calc(0.5rem + var(--safe-bottom))` |
| pb-safe fantasma | bottom nav sin padding iPhone | clase `pb-safe` sin util CSS | `@layer utilities { .pb-safe { padding-bottom: env(...) } }` + shell `pb-[calc(4rem+env(...))]` |
| Terminal CTA text-only | mis-tap cancelar/reintentar SumUp | `text-xs hover:underline` sin min-h | `min-h-11` + border hit area en flow terminal |
| Quick-sale step back | mis-tap cancelar/cambiar canal|qty | `text-[10px]` sin min-h | `min-h-11` full-width step backs |
| Campo sidebar logout | mis-tap cerrar sesión desktop shell | `p-2` + icon 16 | `min-h-11 min-w-11`; nav items `min-h-11` |
| Campo login densos | teclado/dedo falla en feria | inputs `py-2` submit sin min-h | inputs `min-h-11`; submit `min-h-12` |
| Caja icon ops &lt;44 | mis-tap detalle/reconciliar | `w-9 h-9` | `min-h-11 min-w-11` |
| POS client text-only | Nuevo/Buscar sin hit | `text-[10px] hover:underline` | `min-h-11` inline-flex |
| POS cart row crush | qty/precio/QR salen del card en 375 | `flex items-center gap-6` single row | `flex-col sm:flex-row` + icon btns 44 |
| Shop text-only recovery | error PDP / traza / volver catálogo | `hover:underline` sin min-h | `min-h-11` + border hit en recovery |
| Wallet py densos | Apple/Google wallet &lt;44 | `py-2.5` only | `min-h-11` on wallet buttons |
| Canvas/cursor noise | círculo vacío / cursor custom | BeeCanvas on desktop | gate `show_*` chrome o no render mobile |

---

## Go-live / validación de integraciones (fase v1.2 — referencia / ops)

| Patrón | Síntoma | Detección | Fix canónico |
|--------|---------|-----------|--------------|
| Checklist SII rojo | “casi listo” sin go-live | `GET /api/sii/certificacion/checklist` | CAF **33/39/46**, P12, clave SII, encryption key, DTE venta + FC aceptados; `listoCertificacion` ≠ `listoProduccion` (Palena solo si cert OK) |
| Checklist falso verde | cert OK pero DTE no emite | sin identidad emisor / P12 password | items `emisor-identidad` + `cert-credenciales` críticos |
| Jobs DTE huérfanos | emisión falla y nadie ve | dead_letter en DB sin UI | `GET /api/sii/jobs` + Retry; cron `/api/cron/fiscal` |
| Job dead tras éxito | retry de boleta ya enviada | emit returns invalid_state | emit idempotente enviado\|aceptado → ok:true |
| Enqueue sin jobId | ignoreDuplicates vacío | upsert no devuelve row | lookup por idempotency_key |
| Processing stuck | worker murió mid-flight | status=processing eterno | reclaim processing updated_at >15m |
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
| SumUp pending stale | reintento no cobra (checkout muerto) | DB pending sin poll SumUp | getCheckout antes de reusar; EXPIRED → new create |
| SumUp already_paid fail | 409 rompe POS | throw genérico en fetch | treat already_paid → complete sale |
| Readers paired invisible | Solo status online | SumUp returns paired/ready | normalizeReaderStatus → online |
| SumUp client duplicado | plaintext key / drift | new SumUpClient en cada route | `resolveSumUpClient` + decrypt legacy |
| SumUp sin checklist | “casi listo” ciego | no probe merchant/readers | `GET /sumup/checklist` + test-connection |
| Banco sandbox hardcode | creds prod golpean sandbox | `environment: sandbox\|production` en config | URL host según environment (client ya soporta) |
| Banco token churn | password-grant cada request | expires_in como epoch | tokenExpiresAtMs = now + expires_in*1000; hydrate DB |
| Banco sync incompleto | solo saldos, 0 movs | UI solo GET cuentas | POST /sync cuentas+movimientos |
| Sync multiplica movs | conciliación inflada | upsert sin unique | `external_key` + UNIQUE(cuenta_id,external_key) mig 98 |
| Mov insert fail silent | 0 movs tras sync | fecha_valor NULL / tipo inválido | mapMovimientoRow fallback + normalizeTipo |
| Banco secrets en client | password en RLS browser | `supabase.from(config).upsert` con secret | solo `POST /api/banco-chile/config` + seal AES |
| Banco sin checklist | go-live ciego | no token/cuentas probe | `GET /checklist` + Probar auth + sync cuentas |
| Conciliación 400 UI | motor no corre | body sin empresa_id + schema required | tenant `empresaId` en BFF; body opcional |
| Stats tabla wrong | tasa match 0 falsa | query `conciliaciones` genérica | `banco_chile_movimientos` + `banco_chile_conciliaciones` |
| Motor sin ventas | abono web/POS sin propuesta | RPC solo `facturas_emitidas` | `buscar_venta_por_regla` + fallback en `aplicar_reglas` (mig 97) |
| Reglas vacías post-seed | motor 0 propuestas | empresa creada después de mig 53 | `POST …/reglas/seed-defaults` + botón UI |
| Aceptar pierde metadata | stats auto/manual rotas; venta no flag | insert sin confianza/regla/ventas.conciliado | aceptar persiste + update ventas |
| Webhook sin verify | abono/tx forjada | route webhook sin secret/firma | secret server + HMAC + idempotency |
| Webhook reprocess dup | doble update de estado | no early-return si event id existe | dedupe `event:{id}` → 200 sin side-effects |
| Reprocess no-op | admin reintentar no marca procesado | id = UUID fila no event | resolveWebhookEventId + mark by row id |
| Webhook race insert | dos 200 con doble insert | sin unique | mig 99 UNIQUE (empresa, event:*) |
| Firma solo hex | 401 con base64 real | compare solo hex | aceptar hex, `sha256=`, base64 |
| Webhook secret open | 500 o accept vacío | throw si falta secret / `===` HMAC | 503 fail-closed; timing-safe equal |
| Webhook admin open | listar notifs sin JWT | GET pendientes en router pre-auth | authMiddleware + tenant + admin en esas rutas |
| Cron fiscal muerto | jobs stuck | `CRON_SECRET` empty en Vercel | require secret; schedule vercel.json |
| Cron auth `===` | timing leak / brother drift | notifications vs fiscal distintos | `isCronAuthorized` en `@/lib/cron-auth` |
| Fiscal 1×/día | DTE jobs tardan 24h | schedule `0 13 * * *` | `*/15 * * * *` + processFiscalDocumentJobs |
| Stock hold eterno | pending sin ops | expire-stale solo admin | cron `/api/cron/checkout` cada 10m |
| Env matrix incompleta | works local fails prod | `docs/ENV-CHECKLIST.md` | `pnpm env:check` + def en `scripts/lib/env-matrix-def.mjs` |
| Runtime env ciego | no se sabe qué falta en deploy | solo CLI local | `GET /api/health/env-status` + Configuración → Entorno |
| Encryption gap | no se pueden guardar secrets negocio | sin SII_CLAVE_ENCRYPTION_KEY | key ≥32 en Vercel nucleo; health checks encryption |
| Encryption falso OK | UI verde con key corta | `present(KEY)` sin length | misma regla crypto: candidate **≥32** chars |
| Auto-emit invisible | boletas no salen post-venta | flag no en Entorno / valor ≠ `true` | item `SII_AUTO_EMIT_BOLETA=true` en env-status fiscal |
| Matrix vs runtime drift | CLI OK, UI no (o al revés) | grupos distintos en def vs TS | sync `NUCLEO_RUNTIME_GROUPS` ↔ `buildNucleoEnvRuntimeStatus` |
| Mock en production | cobro/fiscal falso | `if (process.env.NODE_ENV !==` skip real API | production siempre path real o deny |
| Pagos web ciego | no se sabe si puede cobrar | sin checklist runtime | `GET /api/checkout/admin/checklist` + UI `/pagos` tab web |
| Sesiones pending huérfanas | pago OK sin venta | no listado admin | `GET /checkout/admin/sessions` + fulfill path |
| Pending stale stock | hold 30m nunca liberado en session | solo RPC TTL holds | expire-stale marca expired + release_checkout_stock |
| Fulfill post-pago fallido | paid sin venta | session pending sin ops | `POST …/retry-fulfill` (no re-cobra provider) |
| Expire mata paid | venta OK + session expired | expire sin lookup ventas | skip paid → complete; only abandon → expired |
| alreadyProcessed huerfano | venta sí, session pending | early return sin complete | completeCheckoutSession + release holds |

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
