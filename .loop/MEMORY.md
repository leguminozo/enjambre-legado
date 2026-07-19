# Loop memory — Oyz App (Enjambre Legado)

## Doctrina del loop (actualizar solo si el operador la cambia)

- **Fase v1.2 (activa — go-live / validación real):** llevar a **uso real** las integraciones **casi listas**: **SII**, **SumUp**, **Banco de Chile**, y adyacentes (pagos web TBK/Flow, conciliación, CAF/crons). Código y UI de v1.1 se asumen base; el valor es **cerrar el gap sandbox → producción**.
- **Config-en-UI (regla general del operador):** todo lo **esencial y de valor real** que un humano debe poder cambiar sin deploy (RUT, giro, domicilio, CAF, P12+clave, ambiente Maullín/Palena, readers, cuentas, etc.) se configura en la **interfaz gráfica** de la app dueña + API BFF. Env/Vercel solo secretos de plataforma (AES, CRON, OAuth client secret).
- Prioridad: **V** (validación go-live: env, credenciales, ambiente, smoke path) → **R** (runtime integración: emit/webhook/sync/idempotencia) → **S** (fail-closed secrets/CAF/webhooks en el cono) → **E** (entrelazado venta↔fiscal↔banco solo si bloquea go-live) → **U** (UI de config/operación — config-en-UI) → **O**.
- Conos canónicos:
  1. **SII** — `packages/fiscal` + `packages/contable` + `apps/nucleo` routes/sii + checklist `/certificacion` + CAF + cert P12 + jobs
  2. **SumUp** — `packages/sumup` + nucleo BFF sumup + campo POS terminal
  3. **Banco Chile** — `packages/banco-chile` + routes banco-chile + conciliación + env sandbox|production
  4. **Pagos web** — Transbank/Flow checkout_sessions (si toca go-live dinero)
  5. **Env matrix** — `docs/ENV-CHECKLIST.md`, secrets Vercel, no mock en production
- Criterio de “validado”: checklist crítico en verde **o** traza de smoke documentada (request→API externa→persistencia→UI) con fail-closed demostrado.
- Roles / UI canónica de v1.1: **no deshacer**; solo tocar si bloquean validación.
- **Loophole**: absorber → hipótesis → colapsar → redirigir → acrecer. Compuestos auto-mejorables; **guardrieles fijos**.
- Guardrieles: fail-closed; no quitar authz/RLS/CAF; no mock de pago/fiscal en production; cirugía; evidencia; no spawnear loops; no mezclar WIP ajeno; no reabrir sec passes 1–6 sin regresión.
- Cadencia: 60s reactivación; investigación **ilimitada** si productiva.
- Identidad: Enjambre Legado — néctar trazable multi-app.

### Backlog go-live (v1.2 — actualizar al validar)

| Integración | Casi listo | Gap típico a cerrar |
|-------------|------------|---------------------|
| SII | pipeline DTE, CAF guard, checklist v2, **Settings UI completa** (identidad+CAF XML+P12 cifrado) | ⏳ ops: aplicar mig 95; cargar P12/CAF reales en UI; 1ª boleta/FC Maullín → Palena |
| SumUp | client + BFF + **config UI** (merchant/API key cifrada, checklist, test-connection, readers) | ⏳ ops: keys en UI + enable; smoke venta POS→tx; webhook opcional |
| Banco Chile | client + config BFF + conciliación + **webhook HMAC fail-closed** | ⏳ ops: set BANCO_CHILE_WEBHOOK_SECRET; sync movs; 1 match |
| Conciliación | motor RPC + UI propuestas + métricas/checklist | ⏳ datos reales banco; reglas seed si vacío |
| Pagos web | TBK/Flow + fulfill + **admin checklist UI** (`/pagos` → Checkout web) + sesiones | ⏳ ops: keys Flow/TBK en Vercel; smoke pago real; 0 pending stuck |
| Crons | fiscal poll + CAF alert | `CRON_SECRET` en Vercel + job ejecuta |

---

## Evolución del prompt

### Evo 2026-07-16 pass 24 (deep-followup-golive / val-banco-webhooks)
- Señal: webhook HMAC con `===` timing-leaky; secret missing → throw 500; GET pendientes/reprocesar en router público sin JWT (service role)
- Compuesto: colapsar + redirigir + S
- Regla nueva: webhooks banco fail-closed (503 sin secret); firma timing-safe; rutas admin en webhook con auth+tenant; BANCO_CHILE_WEBHOOK_SECRET en matriz env
- Anti-patrón: endpoints admin montados antes de auth global; `computed === signature` en HMAC
- Guardriel: intacto
- Cristalizado: ver PLAYBOOK webhook sin verify / timing-safe

### Evo 2026-07-16 pass 23 (val-conciliacion-e2e)
- Señal: POST ejecutar exigía empresa_id en body (UI no lo enviaba → 400); stats leían tabla `conciliaciones` wrong; sin checklist/métricas go-live
- Compuesto: colapsar + método + redirigir
- Regla nueva: conciliación-auto usa **tenant empresaId** (body opcional, mismatch = 403); stats = `banco_chile_*`; checklist en `/conciliacion-stats`; enrich venta fallback `ventas`
- Anti-patrón: schema body con empresa_id required cuando UI usa solo tenant; métricas sobre tabla genérica ajena
- Guardriel: intacto

### Evo 2026-07-16 pass 22 (val-env-secrets)
- Señal: matriz env desactualizada (sin SII_CLAVE_ENCRYPTION_KEY/CRON/pagos); /health/deps sin tienda/encryption; sin UI runtime
- Compuesto: redirigir + config-en-UI (presencia, no valores)
- Regla nueva: `scripts/lib/env-matrix-def.mjs` SoT local; nucleo `buildNucleoEnvRuntimeStatus` + `GET /health/env-status` admin; Configuración → Entorno; deps endurece tienda_url+encryption en prod
- Anti-patrón: documentar keys en MEMORY sin matriz ejecutable; mostrar valores de secrets en API
- Guardriel: intacto

### Evo 2026-07-16 pass 21 (val-pagos-web)
- Señal: checkout Flow/TBK sin panel go-live; operador no veía env readiness ni sesiones pending; keys deben quedarse en Vercel
- Compuesto: método + redirigir + config-en-UI (estado, no secretos)
- Regla nueva: `buildPagosGoLiveChecklist` + `GET /checkout/admin/checklist|sessions` admin-only; hub `/pagos` tab Checkout web; secretos pasarela = env plataforma (no form)
- Anti-patrón: exponer FLOW_SECRET en UI; mock pago en production sin checklist
- Guardriel: intacto (returnUrl allowlist, fulfill idempotente)

### Evo 2026-07-16 pass 20 (val-banco-chile + config-en-UI)
- Señal: BancoChileView escribía client_secret/password directo a Supabase desde el browser; secrets plaintext; sync solo leía cache local; sin checklist
- Compuesto: colapsar + redirigir + S
- Regla nueva: secretos de integración **solo BFF** + cifrado AES; UI usa `useApiFetch`; `resolveBancoChileClient`; checklist + POST /auth; sync cuentas vía GET /cuentas API
- Anti-patrón: `supabase.from('*_config').upsert({ password })` desde cliente; secretos en claro en prod sin encryption key
- Guardriel: intacto

### Evo 2026-07-16 pass 19 (val-sumup-pos + config-en-UI)
- Señal: SumUp API config existía sin pestaña UI; api_key en claro; client duplicado en readers/tx/payouts; sin checklist ni smoke
- Compuesto: colapsar + unificar + redirigir
- Regla nueva: SumUp config-en-UI en `SumUpView` tab Config; `resolveSumUpClient` único; API key cifrada (AES, legacy plaintext OK); `GET /checklist` + `POST /test-connection`
- Anti-patrón: sumup_config solo por SQL/env; plaintext key en prod sin material cifrado; getClient copiado por route
- Guardriel: intacto (fail-closed encrypt en production)

### Evo 2026-07-16 pass 18 (val-sii-emision + config-en-UI)
- Señal: operador pide configurar ecosistema desde la app; empresa PATCH no editaba RUT/giro/domicilio; CAF solo GET; certificados routes sin montar; P12 password solo env
- Compuesto: colapsar + unificar + dirección (regla general)
- Regla nueva: **config-en-UI** — valor de negocio/integración → form+BFF; env = plataforma. SII: identidad completa, import CAF XML, upload P12+clave cifrada, resolveSiiCredentials lee DB
- Anti-patrón: “configurá el RUT en SQL”; certificados API huérfana sin route; password P12 solo en Vercel cuando se puede cifrar en DB
- Guardriel: intacto (AES fail-closed; no secretos en cliente)

### Evo 2026-07-16 pass 17 (val-sii-certificacion)
- Señal: checklist solo CAF 46 + FC; `listoProduccion` exigía Palena junto a pruebas Maullín; sin UI; no medía clave/encryption/DTE venta 33/39
- Compuesto: método + colapsar + unificar (UI operación)
- Regla nueva: checklist SII con fases `certificacion` | `go-live`; críticos 33/39/46 + P12 + clave + encryption + DTE venta + FC; `listoCertificacion` independiente de `listoProduccion`; SettingsTab muestra badges
- Anti-patrón: checklist que solo mira FC46; `storage-docs` hardcoded true; go-live flag sin panel operador
- Guardriel: intacto

### Evo 2026-07-16 reorientación v1.2
- Señal: operador pide enfocar loop a validar SII, SumUp, Banco Chile y funciones casi listas para uso real
- Compuesto: dirección + sectores
- Regla nueva: fase v1.2 prioridad V→R→S; sectores val-sii / val-sumup / val-banco-chile / val-pagos / val-env; no reabrir UI-canon salvo bloqueo de go-live
- Anti-patrón: tick de tokens visuales cuando hay gap de credenciales/ambiente/smoke de dinero o fiscal
- Guardriel: intacto

### Evo 2026-07-16 pass 16
- Señal: GlassPanel exportado solo en WIP; apps usaban `.glass-panel` CSS / `glass` local; SectionHeader 0 usos; Select local muerto en reportes/cálculos
- Compuesto: unificar + acrecer
- Regla nueva: superficies glass en apps → `GlassPanel` de `@enjambre/ui` (no clase CSS nueva ni fork); aterrizar export + ≥1 consumidor en el mismo commit
- Anti-patrón: export en packages/ui sin adopción; `.glass-panel` / `glass shadow-glass` ad-hoc en vistas
- Guardriel: intacto

### Evo 2026-07-16 pass 15
- Señal: herramientas admin (costeo/CRM/pipeline/reportes/cálculos IA/SII/banco/creadores/feria) con ViewShell pero sin CTAs al grafo; reportes/cálculos sin shell
- Compuesto: entrelazado + unificar UI
- Regla nueva: módulos no-néctar usan `ToolActionRail` + `TOOL_ACTION_CONTEXTS` (salidas de rol al entorno); reportes/cálculos con ViewShell compact + rail; acciones primarias marcadas `primary`
- Anti-patrón: herramienta admin solo hero sin riel de entorno; tarjetas generador sin shell de vista
- Guardriel: intacto

### Evo 2026-07-16 pass 14
- Señal: Produccion/Regeneracion/Logistica/Contable/Colmenas sin CTAs al resto del flujo néctar; silos de herramienta
- Compuesto: entrelazado + acrecer
- Regla nueva: módulos del ciclo usan `NectarRail` (colmenas→lotes→productos→despacho→impacto→contable→SII); cliente legado ya enlaza catálogo/ciencia
- Anti-patrón: ViewShell de producción sin salida a colmenas/catálogo
- Guardriel: intacto

### Evo 2026-07-16 pass 13
- Señal: POS Campo usaba font-serif; headers sueltos; sin ViewShell CSS; toggle bg-white
- Compuesto: unificar UI campo
- Regla nueva: Campo display = font-display; cabeceras ViewShell compact + CSS en globals; tool panels (caja/comisiones/feria/pos) misma shell
- Anti-patrón: font-serif en POS; h1 suelto sin shell; bg-white en knobs
- Guardriel: intacto

### Evo 2026-07-16 pass 12
- Señal: perfil tienda con font-serif y h1 ad-hoc por página; direcciones sin EmptyState/Button canónico
- Compuesto: unificar UI tienda
- Regla nueva: páginas /perfil/* usan PerfilPageHeader (ModuleHero); display = font-display no font-serif; empties EmptyState
- Anti-patrón: font-serif en tienda; header inventado por page sin shared shell
- Guardriel: intacto

### Evo 2026-07-16 pass 11
- Señal: CatalogoView/ProductosCatalogoView con inline styles --bosque-ulmo; ContableView doble hero bajo hub; BancoChile h1 ad-hoc sin ViewShell
- Compuesto: unificar UI canónica nucleo
- Regla nueva: módulos admin usan ViewShell (compact/hero) como ContableHub/Costeo; no h1 inline style con vars legacy; tabs anidados usan h2 sección no segundo hero
- Anti-patrón: style={{ color: 'var(--bosque-ulmo)' }}; h1 gigante dentro de hub con ViewShell
- Guardriel: intacto

### Evo 2026-07-16 pass 10
- Señal: portal creador sin link de share a catálogo; código no fluía a checkout; header ad-hoc sin ModuleHero; empty states sin EmptyState
- Compuesto: entrelazado + unificar UI
- Regla nueva: embajador → share `/catalogo?ref=CODE` → CreatorRefCapture → CREATOR_REF_CODE_KEY → checkout prefill; portal con ModuleHero + CTAs legado/pedidos
- Anti-patrón: solo copiar código sin URL; portal desconectado del catálogo
- Guardriel: intacto

### Evo 2026-07-16 pass 9
- Señal: middleware Campo solo protegía /pos; caja/feria/comisiones/ranking abiertos; POS header sin grafo de herramientas; landing duplicaba links; shell doblaba padding en POS
- Compuesto: entrelazado + redirigir + método
- Regla nueva: CAMPO_PROTECTED_PREFIXES = grafo completo rep; middleware Edge importa paths sin lucide; landing/sidebar/bottom/pos-header desde CAMPO_NAV_ROUTES; shell full-bleed en /pos
- Anti-patrón: PROTECTED_PREFIXES=['/pos'] solo; nav ad-hoc en landing
- Guardriel: intacto (authz expandida fail-closed)

### Evo 2026-07-16 pass 8
- Señal: cliente /perfil/resenas y /perfil/trazabilidad pages sin PERFIL_NAV; i18n guardian ausente; Mi Legado KPIs sin deep links a herramientas
- Compuesto: entrelazado + unificar
- Regla nueva: toda page /perfil/* (no resultado/legacy) debe estar en PERFIL_NAV + i18n links; hub Mi Legado CTAs a pedidos/reposicion/guardian/resenas/trazabilidad
- Anti-patrón: labelKey en icons sin href en PERFIL_NAV; KPI card no-click
- Guardriel: intacto

### Evo 2026-07-15 pass 7 (fase v1.1)
- Señal: operador pide reactivar loop hacia herramientas por rol + entrelazado + UI coherente con SOTA del monorepo
- Compuesto: dirección + sectores + unificar
- Regla nueva: sectores v1.1 role-*-tool-graph + ui-canon-*; prioridad E→U→R; canónico packages/ui + Ecosistema
- Anti-patrón: page huérfana sin sidebar; widget sin CTA a herramienta dueña; header h1 ad-hoc si ModuleHero aplica
- Guardriel: intacto
- Hallazgo pass7: `/calculos-ia` page+lazy sin sidebar; Ecosistema widgets sin deep links; typo Guadián → fix `63c4669`

### Evo 2026-07-15 pass 6
- Señal: commission-rules sin requireProfileRole(admin) → rep muta multiplicadores; cash close sin eq status=open; resenas claim race; salt claim/anon hardcoded en prod
- Compuesto: colapsar + método
- Regla nueva: rutas de dinero (comisiones/reglas) admin-only; cierres/claims condicionales; RESENAS_*_SALT obligatorios en production
- Sector boost: —
- Anti-patrón: tenantMiddleware solo en mutators de dinero; update claim/close sin status/claimed_at guard
- Guardriel: intacto
- Claim POS venta: UUID gen_random_uuid + RPC SECURITY DEFINER OK (medido limpio)

### Evo 2026-07-15 pass 5
- Señal: sii-clave cifraba con SERVICE_ROLE??"" (key vacía); checkout CAF solo con flag; POS CAF solo si existía fila sii_caf; cron fiscal === no timing-safe
- Compuesto: colapsar + redirigir + método
- Regla nueva: cifrado SII fail-closed (SII_CLAVE_ENCRYPTION_KEY|service≥32); CAF enforce en VERCEL production (opt-out false); getFoliosRestantes=0 sin CAF → deny; cron secrets timing-safe
- Sector boost: —
- Anti-patrón: `SERVICE_ROLE_KEY ?? ""` como AES key; `if (cafData)` skip when missing; checkout CAF opt-in only
- Guardriel: intacto
- Ops: set SII_CLAVE_ENCRYPTION_KEY en Vercel; SII_ENFORCE_CAF_ON_CHECKOUT=false solo en staging sin CAF

### Evo 2026-07-15 pass 4
- Señal: offline POS retry sin idempotency → doble venta; items_override confiaba precio_unitario del cliente
- Compuesto: colapsar + método
- Regla nueva: toda venta POS con client_request_id (buy_order POS-uuid); items_override siempre reprice desde productos
- Sector boost: —
- Anti-patrón: items_override.precio_unitario del body; sync_queue sin id de request
- Guardriel: intacto

### Evo 2026-07-15 pass 3
- Señal: verifyInternalApiKey usaba `===` (timing-leaky); backlog de pass1
- Compuesto: colapsar + acrecer
- Regla nueva: secretos internal/cron comparar timing-safe; siempre `!expected || !header → false`
- Sector boost: —
- Anti-patrón: `header === expected` en x-internal-key / cron secrets
- Guardriel: intacto
- Nota BFF: publicPaths checkout/webhooks OK con auth en handlers; creadores/cms con authMiddleware en rutas mutadoras

### Evo 2026-07-15 pass 2
- Señal: `POST /checkout/init` y subscriptions init pasaban `returnUrl` del body al provider sin allowlist → open redirect post Webpay/Flow
- Compuesto: método + colapsar + entrelazados hop1 (subs)
- Regla nueva: en checkout/subs, grepear returnUrl; solo orígenes NEXT_PUBLIC_SITE_URL/URL_TIENDA + paths /checkout/resultado|/perfil/reposicion/resultado
- Sector boost: —
- Anti-patrón: confiar `z.string().url()` del cliente como return del pago
- Guardriel: intacto
- Nota: precios init OK (server product.precio + computeUnitPrice); quote usa subtotal client solo preview; CAF enforce solo con flag/auto-emit

### Evo 2026-07-15 pass 1
- Señal: `createAuthMiddleware` devolvía `next()` si anon key inválida (fail-open); nucleo `defaultRole: "admin"` elevaba JWT sin role; `isRouteAllowed` default `true` abría rutas no listadas (monitor-feria/calendario); E2E_SKIP_AUTH sin bloqueo VERCEL production
- Compuesto: método + colapsar + redirigir
- Regla nueva: middleware auth siempre fail-closed si `!isSupabaseConfigured()`; defaultRole nunca admin; unlisted routes admin-only; E2E skip solo si `VERCEL_ENV !== 'production'`
- Sector boost: nucleo-bff-api (APIs siguen con auth local)
- Anti-patrón: `if (!isValidKey) return next()`; `defaultRole: "admin"`; `isRouteAllowed` → true al final
- Guardriel: intacto

### Evo 2026-07-15 pass 0 (bootstrap)
- Señal: creación del loophole Oyz desde plantilla Trama/Ciclo Vivo, reescrito al monorepo real (tienda/núcleo/campo + packages + fiscal + feria)
- Compuesto: absorber + sectores + método
- Regla nueva: sectores rotan 0–10 específicos Oyz; siempre contrastar 5 leyes + CONSTITUTION antes de fix de dinero/auth
- Sector boost: —
- Anti-patrón: copiar sectores de Trama (RSN/destilador) o Ciclo (compost/Minga) a este repo
- Guardriel: intacto
- Nota: primera pasada real debe ejecutar sector `auth-session` (#0) sin mezclar WIP feria/guardian del working tree

---

## Backlog sectorial

### Alta (priorizar en deep-followup o boost)

- [media] **Fiscal cadena**: CAF enforce production + POS fail-closed pass5; residual DTE async ops + SII_CLAVE_ENCRYPTION_KEY en Vercel
- [baja] **Crons**: fiscal timing-safe pass5; residual notifications brother check
- [alta] **Checkout residual**: alinear pricing/preview/commit + idempotencia bajo reintentos reales Transbank/Flow
- [media] **Campo/E2E**: `E2E_SKIP_AUTH` bloqueado en `VERCEL_ENV=production` (pass1); residual: documentar en Vercel que no setear el env
- [baja] **verifyInternalApiKey**: timing-safe cerrado pass3

### Media

- [media] **Internal key hygiene**: `x-internal-key` ≠ service_role reuse si se puede separar; timing-safe compare en todos los internal handlers
- [media] **Typegen CRM residual**: `clientes` stub / `interacciones` vs `crm_*` — `db:typegen` + alinear schema
- [media] **Migraciones 93–94**: guardian impact + feria pausa meta — aplicar prod + RLS review
- [media] **Feria WIP**: monitor-feria, rep-ventas, claim — auditar cuando el WIP se estabilice (no pisar WIP ajeno)
- [media] **SW/Serwist campo**: bypass auth/API same-origin; no cache HTML dashboard
- [media] **canWrite solo UI** vs mutaciones BFF hermanas en núcleo
- [media] **Reseñas / wallet / claim** flood y bind de ownership
- [media] **Multi-empresa contable**: `has_empresa_access` en rutas gastos/SII/banco

### Baja / ops

- [baja] Staging Supabase formal (ops, no solo código)
- [baja] Design drift residual hex/stone en apps (auditar cono packages-contracts-ui)
- [baja] Documentar secrets checklist post go-live (`pnpm env:check:prod`)
- [baja] i18n tienda edge cases (en/es) no seguridad

---

## Anti-patrones confirmados (seed + repo doctrine)

- `getSession()` como gate de acceso server-side (usar `getUser()`)
- Roles desde `user_metadata` o solo botones disabled en React
- Precio / total / buyerId / empresa_id confiados desde body del cliente
- `if (CRON_SECRET && auth !== …)` → secret ausente deja cron abierto
- `SERVICE_ROLE` / `createAdminClient` en componentes cliente o sin authz previa
- `E2E_SKIP_AUTH` en `VERCEL_ENV=production` (bypass POS/SII)
- Clientes Supabase ad-hoc fuera de `@enjambre/auth` + re-exports
- Import barrel `@enjambre/auth` en server (Turbopack + hooks)
- Fail-open middleware cuando faltan env Supabase (`!isValidKey → next()`)
- `defaultRole: "admin"` cuando falta `app_metadata.role`
- `isRouteAllowed` default `true` para rutas no listadas (cliente entra a dashboard)
- Checkout fulfill sin filtrar `status = 'pending'`
- CAF/folios agotados pero checkout sigue emitiendo
- Duplicar `store-chrome` / `sale-qr` en apps en vez de packages
- Hex / `text-white` / `bg-black` / `text-stone-*` en JSX de producto
- `export default` en componentes (excepto pages Next)
- `any` / `catch {}` vacío
- Copiar sectores o fixes de **Trama** o **Ciclo Vivo** sin mapear al dominio Oyz
- Mezclar WIP no relacionado (feria/guardian UI) en commits del loop
- `returnUrl` arbitrario en checkout/subscriptions init (open redirect post-pago)

---

## Hallazgos resueltos recientes (import seed — no reabrir sin regresión)

Fuente: `docs/TECHNICAL_DEBT.md` + git log 2026-06/07 + loop passes.

| Tema | Estado / ref |
|------|----------------|
| nectar-crosslinks: NectarRail en colmenas/lotes/productos/despacho/impacto/contable | ✅ pass14 `3df4b0e` |
| ui-canon campo: font-display + ViewShell POS/caja/feria/comisiones | ✅ pass13 `6868f05` |
| ui-canon tienda: PerfilPageHeader + font-display direcciones/alertas/pasaporte/logros | ✅ pass12 `8e88497` |
| ui-canon nucleo: ViewShell catalogo/productos/banco + contable nested | ✅ pass11 `e39619e` |
| creador: share ref→catalogo→checkout + ModuleHero/EmptyState | ✅ pass10 `1a1b58d` |
| rep campo: protect full tool graph + nav unificado + shell POS | ✅ pass9 `71fc124` |
| cliente resenas+trazabilidad nav + legado deep links | ✅ pass8 `e8ac9c6` |
| calculos-ia nav + Ecosistema crosslinks ModuleHero | ✅ pass7 `63c4669` |
| commission-rules admin + cash close race + resenas claim/salt | ✅ pass6 `3ff7e2f` |
| SII clave AES fail-closed + CAF prod/POS + cron fiscal timing-safe | ✅ pass5 `a438dd8` |
| POS client_request_id + server reprice items_override | ✅ pass4 `d681b5b` |
| timing-safe verifyInternalApiKey | ✅ pass3 `3dabf65` |
| checkout/subs returnUrl allowlist (open redirect) | ✅ pass2 `ab77d61` |
| auth middleware fail-closed + defaultRole cliente + unlisted deny | ✅ pass1 `d2a6a9f` |
| E2E_SKIP_AUTH blocked on Vercel production | ✅ pass1 `d2a6a9f` nucleo+campo |
| getSession audit server paths | ✅ client-only residual |
| Transbank verify via commit | ✅ webhooks |
| Banco Chile HMAC | ✅ |
| CAF checkout fail-closed + min folios | ✅ `2685837` área fiscal |
| DTE boleta retry / cron fiscal | ✅ |
| Rate limit auth-events | ✅ |
| shop-chrome / sale-qr unificados | ✅ packages |
| Campo e2e smoke + skip auth test | ✅ |
| Database package tests | ✅ |
| as any cash/cms/invites/SII wave | ✅ refactors tipados |
| Theme script hydration #418 | ✅ `efa5cab` |
| Role redirects relativos tienda | ✅ `d94053` / `1d94053` |
| Editor-tienda ChunkLoadError | ✅ import directo |
| Calendar RLS + harden CRUD | ✅ `486df6e` |

---

## Producto: valor diferencial (loophole debe proteger y potenciar)

### Qué es Oyz
- **Enjambre Legado**: SO de regeneración biocultural — bosque nativo Chiloé, abeja virgen, miel de alta gama.
- Tres superficies: **tienda** (cliente premium) · **núcleo** (ops + BFF + contable + SII) · **campo** (POS feria / rep_ventas, offline path).
- Roles canónicos: `admin` | `cliente` | `creador` | `rep_ventas` (legacy map → admin).

### Flujo del néctar (no romper al “arreglar”)
```
Origen (campo/cosecha) → Lotes (núcleo) → Traza (hash) → Producto (tienda)
  → Venta (Transbank/Flow/SumUp) → Impacto (árboles/CO₂) → Contable/SII
```

### Feria (cadena de valor operativa)
1. `/operadores-feria` — contrato + evento `en_curso` + consignación  
2. Campo POS — `channel=feria`  
3. Devolución stock si aplica  
4. Arqueo rep `/mi-feria`  
5. Claim cliente `/claim/{token}`  
6. Ledger → aprobar → Preparar SII → F29  

### Anti-patrón de producto
- Tratar Oyz como “e-commerce template”: perder traza de lote, feria, DTE o impacto al “simplificar” checkout.
- Unificar tienda+núcleo+campo en un solo next app “para limpiar” — rompe roles y deploys Vercel.
- Quitar fail-closed CAF “para no bloquear ventas” — ilegal/operativo en Chile.

---

## Notas de contexto macro (bootstrap)

- Working tree al crear el loop: **WIP activo** (feria monitor, guardian perfil, ui components nuevos, rep-ventas). El loop **no** debe commitear ese WIP de paso.
- Remote: `main` ahead 1 en snapshot bootstrap — respetar historia; no force-push.
- Superficie BFF grande (`apps/nucleo/src/api/routes/*`): rotar por sector; no auditar todas las routes en un tick.
- Packages de dinero/fiscal: `pricing`, `contable`, `fiscal`, `sumup`, `banco-chile`, `wallet`.
- Go-live scripts: `pnpm go-live:check`, `feria:check`, `env:check` — útiles en absorber, no como teatro cada tick.
- Migraciones recientes foco: 85 security perf, 91–92 calendario RLS, 93 guardian, 94 feria pausa.

---

## Estado del cursor (espejo humano; fuente de verdad = CURSOR.json)

- phase: v1.1-roles-ui  
- pass: 14  
- index: 8  
- last: `nectar-crosslinks`  
- next sector: `packages-ui-adoption`  
- streak_clean: 0  












