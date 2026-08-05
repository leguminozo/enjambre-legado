# Estado del Arte — Enjambre Legado

> Radiografía estratégica del monorepo: madurez local por workflow vs. estado del arte planetario,
> y la hoja de ruta de movimientos con valor real (inevitables → elegantes → salvajes).
> Documento vivo: actualizar cuando un movimiento se complete.

---

## 1. Tesis

El monorepo es un **sistema operativo biocultural**: el back es de clase mundial (fiscal, pagos,
conciliación, offline-first) pero la capa que mira al cliente (trazabilidad, impacto, contenido)
está desconectada del hardware ya construido. El ancla on-chain existe pero no se usa; los datos de
laboratorio existen pero no llegan al frasco; el censo territorial existe pero no es público.

**La estrategia**: no competir en precio de miel, competir en **prueba de origen verificable**.
Convertir infraestructura invisible en transparencia que el cliente puede escanear, verificar y presumir.

---

## 2. Matriz de madurez local

Escala 1-10. Fecha: 2026-08-02.

| Workflow | Madurez | Fuerza local | Brecha vs. planeta |
|---|---|---|---|
| Checkout web one-shot | 8/10 | Precios server-side (`cart.ts`), conflictos de precio 409, holds de stock 30' (RPC `reserve_checkout_stock`), CAF fail-closed, loyalty integrado, boleta automática post-checkout | Sin wallets (Webpay/MercadoPago), sin one-page, sin tracking de pedido guest |
| Reposición recurrente | 2→7/10 | Motor SQL (`process_ritual_renewals`), sesiones, UI completa | **No cobraba renovaciones** (migración 84); en curso: Pago Automático Flow (`20260802_flow_recurring_subscriptions.sql`) |
| Fiscal / SII | 8/10 | 17 parsers de recibos (`packages/contable/src/domain/receipt-parsers/`), DTE 33/34/39…66 por API oficial SII (palena/maullin), F29/F22/PPM/RCV, tasa-cambio, gasto-extranjero | CAF manual (sin solicitud automática de folios), facturación B2B manual, sin contabilidad de doble partida (no necesaria hoy) |
| Conciliación bancaria | 7/10 | Motor de matching banco↔ventas/gastos ≥90% auto-acepta (`banco-chile/conciliacion-auto.ts`), SumUp↔ventas, arqueo de caja | **Ventas web↔Flow sin conciliar** (el canal principal) |
| POS campo | 7/10 | Offline-first real (Dexie + idempotencia `client_request_id`), SumUp terminal, ferias con consignación y comisiones | Sin devoluciones, sin descuentos, sobreventa offline permitida (`decrement_stock_force`), sin bodegas |
| Trazabilidad | 4/10 | Lote→colmena→cosecha→envasado, análisis lab (humedad/HMF), anclaje on-chain real (Polygon Amoy, `blockchain/anchors.ts`) | "Blockchain" cosmético por defecto: `add_traceable_stock` hashea `producto+uuid+now` (sin payload), firma local con `block_number=1` fijo, página pública no verifica en explorer, sin QR por frasco |
| Registro territorial | 5/10 | Censo apícola de Chiloé (`registro-territorial.ts`: actores, apiarios, trashumancia, alertas fitosanitarias) | Declaración manual, sin integración SAG, **no público** (moat de datos desaprovechado) |
| Loyalty / guardianía | 7/10 | Puntos multi-nivel con multiplicador, canje idempotente, stamps guardian (`stamp-fulfill.ts`), ciclos, invitaciones | Referidos sin bono por compra, sin push |
| Marketing / contenido | 5/10 | CMS real con revalidate (`site_content` + `/api/cms/revalidate`), JSON-LD, banners por placement | Seasonal **hardcodeado** (`seasonal.ts`), reseñas sin rating en catálogo (API existe, catálogo no la consume), sin push web |
| Notificaciones | 6/10 | Email (Resend) + in-app, carrito abandonado con grace 30', dedupe por metadata | Sin push/SMS (schema lo contempla, sin sender) |
| Impacto / regeneración | 4/10 | Árboles, CO2, IRR, ciclos, dashboard ejecutivo | Coeficientes hardcodeados (0.05 tCO2/árbol, IRR 0.5%), sin metodología publicada |

---

## 3. Estado del arte planetario (referencias)

- **E-commerce**: Shopify/Stripe Checkout — one-page, wallets, guest tracking, rating+reviews en catálogo.
- **Suscripciones**: Stripe Billing — dunning (reintentos inteligentes), customer portal, prorrateo, pausas por temporada.
- **POS**: Square/Lightspeed — devoluciones, descuentos, split payments, conteo de inventario; offline-first como Shopify POS.
- **Trazabilidad alimentaria**: VeChain (verificación pública en explorer), Lavazza farm-to-cup, miel europea con QR de origen. **Nadie en Chile** vende miel con origen verificable en cadena.
- **Marcas "capitalismo salvaje"**: Patagonia (regeneración como core), Tony's Chocolonely (transparencia radical, cacao con blockchain), Who Gives A Crap (producto = activismo), Allbirds (carbon labels honestos). Patrón: **la transparencia verificable es el marketing**.
- **Datos geográficos**: SAG publica censos; cartografía apícola fragmentada — un mapa público de Chiloé sería pionero.

---

## 4. Hoja de ruta — los movimientos

### 🔵 Inevitables (madurar lo que ya existe; sin esto el negocio no escala)

| # | Movimiento | Detalle | Referencias |
|---|---|---|---|
| 1 | Conciliar ventas web↔Flow | Reusar motor de matching de banco-chile para cruzar `ventas.buy_order` con pagos Flow | `banco-chile/conciliacion-auto.ts`, `checkout-fulfill.ts` |
| 2 | CAF automático | Solicitar folios al SII por API cuando `restantes < umbral` (hoy manual) | `caf-guard.ts`, `sii/caf.ts` |
| 3 | Dunning de reposición | Email al fallar cargo + reintento; marcar `past_due` correctamente | motor Flow recurrente (en curso) |
| 4 | Devoluciones + descuentos en POS | Operativamente inevitables en ferias | `cash-context.tsx`, `rep-ventas.ts` |
| 5 | Rating agregado en catálogo | Reseñas ya existen → estrellas + JSON-LD en catálogo | `resenas-api.ts`, `catalog-ratings.ts` |

### 🟢 Elegantes (mínimos, intuitivos, alto valor percibido)

| # | Movimiento | Detalle |
|---|---|---|
| 6 | **Trazabilidad real y honesta** (EN CURSO) | Hash del payload real (lote→colmena→cosecha→lab), anclaje Polygon Amoy por defecto, página pública que verifica en explorer, QR por frasco |
| 7 | Métricas de impacto con metodología publicada | Coeficientes documentados + link a metodología (bosque nativo Chiloé) en vez de precisión falsa |
| 8 | Pausa de temporada en reposición | Invierno sin entregas (cancel/crear inscripción Flow) |
| 9 | Push web | Floración y entregas (schema ya lo contempla) |

### 🔴 Salvajes / Vanguardistas (rupturistas — definen la marca)

| # | Movimiento | Detalle |
|---|---|---|
| 10 | **"Miel con certificado de origen verificable en cadena"** | Cada frasco → QR → verificación on-chain + colmena real en mapa + apicultor + floración + análisis lab + CO2. El monorepo ya tiene el 80%: lotes, colmenas, apiarios, anclas, análisis, mapas, registro territorial |
| 11 | **Mapa público apícola de Chiloé** | Publicar el Registro Territorial (anonimizado): colmenas, floraciones estacionales, alertas fitosanitarias → moat de datos + positioning institucional |
| 12 | **Open-book de regeneración** | Dashboard público de impacto en vivo (árboles, CO2, kg, ciclos) — transparencia radical como marketing |
| 13 | **Club de la Cosecha** | Suscripción por temporada (ulmo, tiaca, quillay) con cata guiada y trazabilidad por lote; convierte `seasonal.ts` en editorial vivo, usa el motor de reposición |

### Qué NO hacer (el minimalismo es parte del diseño)

- Contabilidad de doble partida completa (banco-chile + SII + conciliación cubren el flujo de caja).
- Merkle trees / rollups / NFTs (el anchor simple da la garantía que el mercado entiende).
- App nativa (PWA + offline-first es la estrategia correcta).
- IA cosmética (no hay nada que alucinar en una miel).

---

## 5. Estado de los movimientos

- [x] Auditoría de flujos (2026-08-02): checkout, auth, reposición, fiscal, trazabilidad, POS, territorial, contenido
- [x] Fixes rápidos: OAuth PKCE (`login-form.tsx` → `/auth/callback?next=`), meta stale en resultado, registro 500 (insert redundante removido), `email_not_confirmed` mapeado
- [x] Reposición Pago Automático Flow (migración `20260803160000_flow_recurring_subscriptions.sql`, flow-cl recurrente, commit endurecido, webhook, cron)
- [x] Movimiento 6: trazabilidad real y honesta (hash canónico, anclaje por defecto, página con verificación en vivo)
- [x] Movimiento 5: rating agregado en catálogo (UI `catalog-view.tsx` + rich results `itemListJsonLd` con AggregateRating + tests)
- [x] Movimiento 1: integridad de pagos web (`GET /api/checkout/admin/integrity` — cruza sesiones/ventas, detecta pagos sin venta, webhooks perdidos, ventas sin sesión)
- [x] Movimiento 2: CAF automático (builder `SolicitudDeFolios` + `signNode` + `sii-caf-client` + `caf-auto-worker` con kill-switch `SII_CAF_AUTO_ENABLED` + tabla `sii_caf_requests` + rutas admin) — 306/306 nucleo, 159/159 contable
- [x] Movimiento 3: dunning de reposición (cron diario → email único por sub `past_due` con dedupe)
- [x] Test de auth-integration flaky arreglado (`vi.resetModules`) — 306/306 nucleo, 159/159 contable
- [x] Movimiento 4: descuentos POS (0–50% / CLP fijo, server-side) + anulación de venta de sesión (stock + consignación feria)
- [x] Movimiento 7: metodología de impacto versionada (`impacto-metodologia.ts`) + coeficientes en plantaciones
- [x] Movimiento 12 (parcial): open-book público `/impacto` + `GET /api/impacto/{metodologia,open-book}`
- [x] Movimiento 11: mapa público Chiloé `/mapa-chiloe` + `GET /api/mapa-publico/chiloe` (anonimizado ±1 km, bandas de colmenas, alertas por tipo)
- [x] Movimiento 13: Club de la Cosecha (`/club-cosecha`, planes club_ulmo/tiaca/quillay, deep-link a reposición, cata + temporada)
- [ ] Movimiento 9 (push web)

## 6. Trabajo autónomo del agente de auditoría (conservado)

Durante la sesión, un agente de fondo implementó features completas por su cuenta. El dueño decidió CONSERVARLAS. Quedaron en los commits `6f57274` y `92c17aa` de main (mezclados con el trabajo aprobado — la separación vive en este documento):

| Feature | Estado | Nota |
|---|---|---|
| Bitácora apícola por voz + offline (parsers, Dexie, audio) | ✅ completa | spec `docs/BITACORA_APICOLA.md` |
| Trazabilidad QR verificable (cadena de custodia en `/lote/[id]`) | ✅ completa | = movimiento 10 de la hoja de ruta |
| Fenología GDD + proxy meteo + mapa del legado | ✅ completa | |
| Alma/Inicio + navegación por roles | ✅ | **Unificado sin Alma (2026-08-04).** Origen de la dup: Alma/`EcosistemaDashboard` (~2026-06) + Inicio ejecutivo (2026-08 en `92c17aa`) convivieron en VISIÓN. Ahora solo `/inicio` por rol: admin→DashboardEjecutivo (KPIs + atajos + Recargar Stock); territorial→InicioTerritorial; resto→tienda/campo. `/alma` y `/ejecutivo` = redirect. API `dashboard/resumen` y widgets Alma eliminados (sin deuda). |
| Código de creador en checkout (comisión en fulfill) | ✅ | mezclado con checkout aprobado (`checkout.ts`, `types.ts`) |
| POS Campo: tercero_id + loyalty + sync backoff | ✅ | fix real del ledger de puntos |
| Widgets, comisiones, calendario cíclico, cosmético | ✅ | |
| `apps/nucleo/public/sw.js` | 🔴 basura | 1 línea, regenerado constantemente por OTRA sesión de ZCode activa — ignorar hasta cerrarla |

⚠️ **Alerta operacional**: hay OTRA sesión de ZCode activa escribiendo en este repo (host de agentes con `sess_*` distintos). Mientras siga abierta puede regenerar `sw.js` y commitear. Cerrar esa sesión cuando ya no se necesite.

## 7. Deuda de datos documentada (auditoría 2026-08-04 — NO tocar sin plan)

| Deuda | Riesgo | Acción recomendada |
|---|---|---|
| Migración `991_registro_territorial_apicola.sql` tiene **dependencia hacia adelante**: crea `actores_registro`/`update_updated_at_column()` pero ~7 migraciones posteriores en orden lexicográfico (`1002`, `1003`, `1004`, `20260802*`, `20260803*`) las usan. **`supabase db reset` en fresco falla en `1002`**; en prod es inerte (se aplicó cronológicamente). | Reset/CI/staging roto | Renombrar a `0991_*` (o mover los objetos base a una migración temprana) — requiere probar `db reset` completo en staging |
| DDL bootstrap duplicado: `subscription_plans`/`subscriptions`/`subscription_deliveries` en `42` y `61`; `loyalty_*`/`pre_orders`/`cart_abandonment_events` en `41`/`61`/`20260803130000` (idéntico con `IF NOT EXISTS` → no rompe, pero **drift silencioso** si una copia cambia). | Divergencia de esquema entre entornos | Consolidar: una migración define cada tabla; las demás solo verifican existencia |
| **RPC overwrites en cascada** (`CREATE OR REPLACE` secuencial, last-wins): `handle_new_user` ×10 (995 usaba `tier_override` que 998 removió), `calcular_comision_venta` ×4, `decrement_stock` ×3, `process_ritual_renewals` ×3, `redeem_loyalty_reward` ×3, `get_sidebar_badges` ×2, etc. | Regresión funcional **silenciosa** en el último overwrite | Tests de salida por RPC crítico + consolidar definiciones en una migración |
| Vistas `OR REPLACE` (11→40, 14→15→40, 28→40): mismo patrón last-wins. | Ídem | Ídem |
| RLS: ✅ sin políticas duplicadas activas; enums: ✅ sin duplicados; columnas: ✅ todas `IF NOT EXISTS`. | — | — |

## 8. Rondas de deduplicación de código (2026-08-04)

| Ronda | Qué se eliminó | Estado |
|---|---|---|
| 1 (nucleo) | Alma completo, `ProductosCatalogoView`, `dashboard-resumen`, 5 formatters CLP, 4 lazy muertos | ✅ |
| 2 (tienda/campo/packages) | 9 endpoints huérfanos + 4 componentes sin uso en tienda; `packages/rate-limit` canónico (2 copias unificadas); `use-api-fetch` campo sincronizado (fix Bearer expirado); formatCLP ×31 → `@enjambre/ui`; lazy reintroducido por otra sesión | ✅ |
| 3 (transversal) | Alias legacy `/api/ritual` = `/api/replenishment` (0 callers, 2 bypasses, test); `nucleo/src/lib/rut.ts` → `@enjambre/contable`; `slugify` → `@enjambre/ui` (tienda re-export, ProductForm); `createServerClientFromCookies` unificado en 3 apps (re-export `@enjambre/auth/server-index`; tienda con wrapper no-null); `createAdminClient` con `persistSession:false` exportado de `@enjambre/auth/server-index` (2 workers sin client ad-hoc) | ✅ (verificar builds) |
| Franja `INICIO_OPS` del Inicio admin | 8 chips que duplicaban la sidebar + `QuickActionAddStock` (duplicaba recarga de Catálogo) | ✅ |
| `ToolActionRail` ("Actuar en el entorno") | Rail de navegación contextual montado en 12 vistas; ~90% de sus chips duplicaban los 34 hrefs de la sidebar (verificado 1:1). Eliminado componente + 12 montajes. Enlaces únicos perdidos: "Caja / POS campo" (acceso por `NEXT_PUBLIC_URL_CAMPO/caja`; roles venta ya redirigen a campo vía role-redirect) y `/crm?tab=aliados|ferias` (la vista CRM tiene sus 6 tabs propios). | ✅ |
