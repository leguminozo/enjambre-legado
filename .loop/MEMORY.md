# Loop memory — Oyz App (Enjambre Legado)

## Doctrina del loop (actualizar solo si el operador la cambia)

- Foco **producción** y valor real a **largo horizonte**: cobros legítimos, stock atómico, DTE/CAF, feria POS, authz de roles, UX que no abandona cliente ni rep.
- **Loophole**: absorber → hipótesis → colapsar → redirigir a mejor → acrecer. Cada compuesto es **auto-mejorable** (dirección, sectores, método, greps, playbook, unificar UI).
- **Guardrieles no negociables**: fail-closed; no quitar authz/RLS/CAF/CSRF; cirugía con evidencia; no spawnear loops; producto estable salvo rotura; no mezclar WIP ajeno.
- **5 leyes** (`system_invariants.md`): Postgres Zero-Trust · Package-First · Geometry-First Editorial · Cirugía Verificable · Néctar Traceability.
- Entrelazados hop1–2 en el cono del hallazgo (incl. packages compartidos y apps hermanas); no monorepo-spray.
- Amenaza: atacantes con LLMs a escala + fraude de pago + rep malicioso + forge internal key + CMS XSS + claim token abuse.
- Cadencia: 60s–5m = reactivación; tiempo de investigación por pasada = **ilimitado** si es productivo.
- **Densidad, no alarde**: superioridad por el diff y lo que no se rompe; inevitable por acumulación de estándares.
- **Identidad producto**: Enjambre Legado — regeneración biocultural Chiloé; comercio soberano multi-app; **no** confundir con Trama (research) ni Ciclo Vivo (orgánicos).

---

## Evolución del prompt

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

- [alta] **Fiscal cadena**: DTE post-checkout async + CAF monitoring/alert en prod ops (código CAF fail-closed ya seed; verificar enforce end-to-end en init)
- [alta] **Crons fail-closed**: grepear `if (CRON_SECRET &&` / secrets opcionales en `apps/nucleo/app/api/cron/**` y BFF
- [alta] **Checkout residual**: alinear pricing/preview/commit + idempotencia bajo reintentos reales Transbank/Flow
- [media] **Campo/E2E**: `E2E_SKIP_AUTH` bloqueado en `VERCEL_ENV=production` (pass1); residual: documentar en Vercel que no setear el env
- [media] **verifyInternalApiKey**: comparación `===` no timing-safe (hop2 pass1)

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

---

## Hallazgos resueltos recientes (import seed — no reabrir sin regresión)

Fuente: `docs/TECHNICAL_DEBT.md` + git log 2026-06/07 + loop passes.

| Tema | Estado / ref |
|------|----------------|
| auth middleware fail-closed + defaultRole cliente + unlisted deny | ✅ pass1 (pendiente hash commit) |
| E2E_SKIP_AUTH blocked on Vercel production | ✅ pass1 nucleo+campo |
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

- pass: 1  
- index: 1  
- last: `auth-session`  
- next sector: `tienda-checkout-payments`  
- streak_clean: 0  

