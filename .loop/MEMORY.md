# Loop memory — Oyz App (Enjambre Legado)

## Doctrina del loop (actualizar solo si el operador la cambia)

- **Fase v1.1 (activa):** cada **herramienta de cada rol** con **entrelazado correcto en código** + **UI canónica** alineada al estado del arte ya logrado (`packages/ui`, Ecosistema Bento/GSAP, ModuleHero, tokens, tienda editorial).
- Prioridad: **E** (entrelazado) → **U** (UI canónica) → **R** (runtime herramienta) → **S** (solo si aparece) → **O**.
- Referencia visual: `EcosistemaDashboard`, `ModuleHero`/`SectionHeader`/`GlassPanel`/`BentoGrid`/`CinematicCard`, `tokens.css`, CONSTITUTION.
- Roles: `admin` (núcleo) · `cliente` (tienda) · `rep_ventas` (campo) · `creador` (tienda portal).
- **Loophole**: absorber → hipótesis → colapsar → redirigir → acrecer. Compuestos auto-mejorables; **guardrieles fijos**.
- Guardrieles: fail-closed; no quitar authz/RLS/CAF; cirugía; evidencia; no spawnear loops; no mezclar WIP ajeno; no reabrir sec passes 1–6 sin regresión.
- Cadencia: 60s reactivación; investigación **ilimitada** si productiva.
- Identidad: Enjambre Legado — néctar trazable multi-app.

---

## Evolución del prompt

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
| ui-canon nucleo: ViewShell catalogo/productos/banco + contable nested | ✅ pass11 (pendiente hash) |
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
- pass: 11  
- index: 5  
- last: `ui-canon-nucleo`  
- next sector: `ui-canon-tienda`  
- streak_clean: 0  









