# MASTER PLAN — Enjambre Legado

> Arquitectura, seguridad, datos, calidad y roadmap a 3 sprints.
> Basado en diagnóstico real del código (Junio 2026).
> STOP al terminar. Espera aprobación antes de cualquier línea de código.

---

## 1. DIAGNÓSTICO REAL

### Qué existe y funciona hoy

| Capa | Estado | Evidencia |
|---|---|---|
| **Monorepo** | Operativo | Turborepo + pnpm, 3 apps + 7 packages, builds pasan |
| **Autenticación** | Completa | `@enjambre/auth` con 5 entry points, middleware por app, 13 security events |
| **Base de datos** | Madura | 50+ migraciones, 20+ tablas, RLS completo, PostGIS, types generados |
| **BFF (Nucleo)** | Operativo | Hono + 26 rutas, auth → tenant → route, 17 queries paralelas en dashboard |
| **Checkout Tienda** | En producción | Transbank + Flow, sesiones en Postgres (mig 38), idempotente, stock RPC |
| **Comisiones/Caja/Reps** | Completo | Mig 28-33: cash_sessions, rep_profiles, commission_rules/records, invitations, tier auto, channel_rate, leaderboard |
| **Contable** | Probado | 79 tests Vitest: IVA 19%, RUT, DTE XML, 7 receipt parsers, tasa-cambio, gasto-extranjero |
| **UI System** | Activo | 15 componentes, 3 hooks, 4 lib utils, tokens, Tailwind preset, 24 icons — 93+ refs cross-app |
| **Campo POS** | Funcional | CashProvider, QuickSale (4 toques), carrito, client lookup, tier badge, leaderboard, historial 4 tabs |
| **Seguridad** | Hardened | Mig 40: 8 tablas sin RLS → fixed, views sin security_invoker → fixed, SECURITY DEFINER functions con auth checks |

### Qué es shell, stub o promesa no cumplida

| Área | Estado | Realidad |
|---|---|---|
| **SII** | Stub | Routes existen en BFF (`/api/sii/*`), cliente SII configurado, pero sincronización real no implementada |
| **Bancos/Conciliación** | Stub | Banco Chile client existe (`packages/banco-chile`), routes en BFF, webhook recibido, pero matching/auto-reconciliation no hecho |
| **Notificaciones** | Parcialmente real (in-app + infraestructura) | notification_queue + notification_events + worker.ts funcional (Resend email real si key presente, Twilio WA, mocks para push/system). BFF enqueue protegido. Tienda tiene realtime in-app vía events. **Falta**: Invocación programada del worker (cron), triggers automáticos desde flujos de negocio (pago, envío, comisiones), preferencias de usuario, unificación alerts vs events para in-app cross-app. |
| **Blockchain trazabilidad** | Planificado | Columna `blockchain_hash` en `colmenas` + `lotes`, cero integración on-chain |
| **Multi-idioma Tienda** | No iniciado | Solo español, `next-intl` referenciado en roadmap pero no instalado |
| **Perfil Guardian (Cliente)** | No iniciado | Roadmap lo pide, no hay código |
| **Checkout Cinematográfico** | Funcional pero estándar | Transbank/flow funciona, cero GSAP/micro-video durante pago |
| **QR Trazabilidad** | Esquema listo | `blockchain_hash` existe, frontend no consume |
| **Offline-first Campo** | Cancelado | Documentado en TECHNICAL_DEBT D7 — no requerido por caso de uso real |

### Qué bloquea el próximo hito concreto de valor

1. **SII real** → Facturación automática Chile (hoy stub, requiere certificado digital + envío DTE)
2. **Conciliación bancaria auto** → Cierre contable mensual sin intervención manual
3. **Notificaciones transaccionales** → Email/push en eventos clave (pago, envío, comisiones, invitaciones). *Análisis quirúrgico de ramificaciones*: Pre-existente dual system (alerts table para in-app nucleo vs notification_events para historial/tienda) genera inconsistencia funcional y de UX. Inserts directos desde cliente en tienda (bypass queue) ramifican a riesgo de seguridad (sin tenant control, posible spam o exposición de datos sensibles en body) y menor eficacia a largo plazo (sin retries/rate limit del worker). Worker ya tiene lógica de delivery y reintentos (eficiencia buena para volumen bajo), pero sin invocación = eficacia 0 para entrega real. Impacto en regeneración de app compleja: Bloquea Perfil Guardian (notifs son clave para retención/impacto), ops reales, y trazabilidad de comunicaciones. Solución quirúrgica prioriza hacer invocable + 1-2 triggers sin re-arquitectura.
4. **Blockchain trazabilidad** → Diferenciador de mercado premium (hoy solo columna vacía)
5. **Multi-idioma Tienda** → Apertura a exportación (Dubai/Asia requieren inglés)
6. **Perfil Guardian** → Retención y LTV cliente (hoy no existe)

---

## 2. ARQUITECTURA

### Patrón elegido y por qué

**Monorepo Turborepo + Package-first + BFF Hono + Supabase RLS-as-Security**

| Decisión | Justificación |
|---|---|
| **Turborepo** | Cache inteligente, builds paralelos, filter por app, workspace protocol para packages |
| **Packages over Apps** | `@enjambre/auth`, `@enjambre/ui`, `@enjambre/contable`, `@enjambre/database` tienen 70+ consumidores combinados; evita duplicación |
| **BFF Hono en Nucleo** | App Router Next.js + Hono = single deploy, edge-ready, Zod validation, middleware pipeline (auth→tenant→route), 26 rutas cohesivas |
| **RLS como seguridad nativa** | Zero-trust: Postgres es la fuente de verdad, no el cliente. `current_role()`, `is_admin()`, `has_empresa_access()` en policies |
| **Supabase SSR + 5 entry points auth** | Browser/Server/Middleware/Security-events/Role-redirect separados — evita Turbopack barrel issue con hooks en server code |
| **Zod en boundaries** | Todos los inputs externos (API routes, BFF, checkout, webhooks) validan con Zod — 0 `any` en boundaries |

### Estructura de capas con responsabilidades y contratos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         APPS (Interfaces por Rol)                       │
├──────────────┬──────────────┬──────────────┬───────────────────────────┤
│   Tienda     │   Nucleo     │   Campo      │   (Futuro: Mobile/Export) │
│  (Next.js)   │  (Next.js)   │  (Next.js)   │                           │
│  Cliente     │  Admin/Reps  │  POS Field   │                           │
└──────┬───────┴──────┬───────┴──────┬───────┘
       │              │              │
       ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      SHARED PACKAGES (Contratos)                        │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────┤
│   @auth      │   @ui        │ @contable    │ @database    │  @sumup/   │
│  (5 entries) │ (design sys) │ (tax logic)  │ (migrations) │ @banco-chile│
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┴───────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      SUPABASE (Fuente de Verdad)                        │
├──────────────┬──────────────┬──────────────┬───────────────────────────┤
│   Auth       │   Database   │   Storage    │   Realtime/Edge           │
│  (JWT+RLS)   │  (Postgres   │  (Buckets    │   (Future: cron, queues)  │
│              │  17+PostGIS) │   RLS)       │                           │
└──────────────┴──────────────┴──────────────┴───────────────────────────┘
```

**Contratos entre capas:**

| Límite | Contrato | Validación |
|---|---|---|
| App → Package | Named exports, types estrictos | TypeScript strict, `pnpm build` |
| App → BFF | Hono routes + Zod schemas | `zValidator` en cada route |
| BFF → DB | Supabase client con Bearer token | RLS + `authMiddleware` + `tenantMiddleware` |
| Package → DB | Migraciones numeradas + RLS | `db:typegen` regenera types |
| Auth → Apps | 5 entry points, `AppSource` enum | Middleware usa `createAuthMiddleware` o custom con logging interno |

### Puntos de extensión deliberados

| Punto | Para qué | Contrato |
|---|---|---|
| `@enjambre/auth/role-redirect` | Nuevos roles sin tocar middleware | `ROLE_REDIRECT_MAP`, `ROUTE_ROLE_GUARDS`, `getRoleRedirectPath()` |
| `commission_rules.rule_type` | Nuevos tipos de comisión (6 hoy) | `parameter` JSONB flexible, `priority` para orden |
| `site_content.seccion/clave` | CMS sin deploy | JSONB `contenido`, `activo` boolean, `orden` integer |
| `integrations.config` | Nuevos proveedores externos | `slug` unique, `tipo` category, `config` JSONB, `activo` |
| BFF routes modulares | Añadir dominio sin romper | Cada route = Hono app independiente, montado en `/api/[[...routes]]` |
| `security_events.event_type` | Nuevos eventos auditoría | CHECK constraint en migración 37, RLS por tipo |

---

## 3. SEGURIDAD

### Superficie de ataque identificada hoy

| Vector | Estado | Mitigación actual |
|---|---|---|
| **JWT forgery** | Mitigado | `supabase.auth.getUser()` (no `getSession()`) valida firma server-side |
| **RLS bypass** | Mitigado | Todas las tablas sensibles con RLS, `service_role` solo server-side |
| **CSRF** | Mitigado | `csrfMiddleware` en BFF (Origin/Referer), Tienda middleware propio |
| **Role escalation** | Mitigado | `app_metadata` (no `user_metadata`) para roles, `LEGACY_ROLE_MAP` normaliza |
| **Multi-tenant leak** | Mitigado | `has_empresa_access()` + `tenantMiddleware` resuelve `x-empresa-id` |
| **Checkout session hijack** | Mitigado | Tabla `checkout_sessions` RLS service_role only, idempotencia por `buy_order` |
| **Commission tampering** | Mitigado | `commission_records` INSERT solo service_role/admin, trigger `on_venta_insert_commission` |
| **Secrets exposure** | Mitigado | `.env.local` gitignored, `.env.example` sin valores, Vercel env vars por proyecto |
| **Rate limiting** | Parcial | `rate-limit.ts` en BFF lib, aplicado selectivamente (no global) |
| **Security event logging** | Completo | 13 tipos, RLS: admin SELECT, authenticated INSERT, anon INSERT solo pre-auth |

### Validación, Autenticación, Autorización: estado actual y brechas

| Capa | Implementación | Brecha |
|---|---|---|
| **Auth (Supabase)** | Email/password, OAuth, MFA, session refresh | Sin passwordless/magic links, sin SSO empresarial |
| **Session validation** | `getUser()` en middleware + BFF, `getSession()` solo para Bearer token rápido | Correcto |
| **Role source** | `profiles.role` + `app_metadata.oyz_role` (Tienda) + `usuarios_empresas.rol` (BFF) | Consolidado, `LEGACY_ROLE_MAP` mapea granulares a `admin` |
| **Route guards** | `ROUTE_ROLE_GUARDS` (nucleo), middleware custom (tienda/campo) | Consistente |
| **API validation** | Zod en todos los BFF routes + Tienda API routes | Completo |
| **Input sanitization** | Zod `strictObject`, DOMPurify en `legal-content` | Completo |

### Secrets, env vars, rate limiting: mapa de exposición

| Variable | Dónde se usa | Exposición |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Todas las apps (client) | Pública por diseño |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Todas las apps (client) | Pública por diseño |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Auth package (fallback) | Pública por diseño |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo server: BFF, admin clients, webhooks, middleware internal | **Nunca en cliente** — enforced por entry points |
| `TRANSBANK_*` | Tienda + Nucleo BFF checkout | Server-only |
| `INTERNAL_API_SECRET` / `SUPABASE_SERVICE_ROLE_KEY` | Middleware internal calls (`x-internal-key`) | Server-only |
| `SII_CERT_*` | Nucleo BFF `/api/sii/*` | Server-only (stub) |
| `BANCO_CHILE_*` | Nucleo BFF `/api/banco-chile/*` | Server-only (stub) |

**Rate limiting**: Existe `rate-limit.ts` (token bucket en memoria) pero no aplicado globalmente. Solo en routes específicos. **Brecha**: sin rate limit global en auth endpoints, checkout, BFF.

---

## 4. DATOS

### Esquema actual → brechas → propuesta mínima de migración

**Tablas core (20+):** `profiles`, `apiarios`, `colmenas`, `inspecciones`, `varroa_records`, `peso_records`, `cosechas`, `lotes`, `arboles_plantados`, `productos`, `clientes`, `ventas`, `pedidos_cliente`, `cashflow`, `calendario_tasks`, `logistica_envios`, `stock_centers`, `proveedores`, `marketing_posts`, `marketing_campaigns`, `eventos`, `tickets_fidelizacion`, `site_content`, `integrations`, `integration_job_runs`, `source_files`, `boletas_ingest`, `bank_movements`, `sii_sync_runs`, `notification_events`, `empresas`, `usuarios_empresas`, `periodos_contables`, `facturas_emitidas`, `gastos`, `impuestos`, `terceros`, `rep_profiles`, `cash_sessions`, `commission_rules`, `commission_records`, `invitation_codes`, `invitation_redemptions`, `checkout_sessions`, `suscriptor_config`, `configuracion_ia`, `ciclos`, `ciclos_canjeados`, `creadores`, `creador_contenido`, `creador_balance_view`, `creador_ranking_view`, `user_tier_view`, `user_ciclos_balance`, `rep_session_summary_view`, `rep_performance_view`, `productos_read`, `eventos_read`, `security_events`

**Brechas críticas:**

| Brecha | Impacto | Migración propuesta |
|---|---|---|
| **SII DTE certificación** | Facturación legal Chile | `dte_certificados` (certificado digital, clave privada encriptada, CA, estado, expiración) + `dte_enviados` (track_envio, respuesta_sii, xml_firmado) |
| **Conciliación bancaria auto** | Cierre mensual sin manual | `bank_reconciliations` (movement_id, factura_id/gasto_id, matched_at, confidence, rule_id) + `reconciliation_rules` (patrón, acción, prioridad) |
| **Notificaciones worker** | Tiempo real usuario | `notification_channels` (tipo: email/push/whatsapp, config, activo) + `notification_queue` (destinatario, canal, payload, intentos, status) |
| **Blockchain trazabilidad** | Diferenciador premium | `blockchain_anchors` (entity_type, entity_id, tx_hash, chain, block_number, timestamp, merkle_proof) |
| **Multi-idioma contenido** | Exportación | `site_content_translations` (site_content_id, locale, contenido_jsonb) + locale en `profiles` |
| **Perfil Guardian cliente** | Retención/LTV | `guardian_profiles` (user_id, nivel, puntos, arboles_financiados, badges_jsonb, referral_code) |
| **Checkout cinematográfico state** | UX premium | `checkout_sessions` ya existe — añadir `animation_state` JSONB para micro-video sync |

### Estrategia de acceso por rol

| Rol | Acceso DB (RLS) | Acceso BFF | Acceso Apps |
|---|---|---|---|
| `admin` | `is_admin()` → ALL en tablas empresa, `has_empresa_access()` | Todos los routes BFF | Nucleo completo |
| `rep_ventas` | Own `rep_profiles`, `cash_sessions`, `commission_records` (own) | `/api/rep-ventas`, `/api/cash-sessions`, `/api/commission-rules` (read) | Campo POS + Nucleo `/caja`, `/comisiones`, `/leaderboard` |
| `creador` | Own `creadores`, `creador_contenido`, `commission_records` (own) | `/api/creadores` | Nucleo `/creador` |
| `cliente` | Own `profiles`, `clientes`, `ventas`, `pedidos_cliente`, `arboles_plantados` (own) | Ninguno directo (Tienda usa Supabase client) | Tienda pública + `/perfil` |

### Caching: qué, dónde y cuándo

| Dato | Estrategia | TTL | Invalidación |
|---|---|---|---|
| `site_content` | TanStack Query (Nucleo/Tienda) | 5 min | `site_content` webhook o admin save |
| `productos` (catalogo) | TanStack Query + SWR | 2 min | Admin product save, stock change |
| `commission_rules` | TanStack Query (Nucleo/Campo) | 10 min | Admin rule save |
| `weekly_leaderboard` | BFF RPC `weekly_leaderboard()` | 1 hora (lunes-domingo) | Auto por semana |
| `rep tier progress` | BFF RPC `tier_progress_rep()` | 5 min | Venta insert → trigger |
| `dashboard resumen` | 17 queries paralelas en BFF | Per request | N/A (real-time) |
| `checkout sessions` | Postgres (no cache) | N/A | Status change → `completed`/`expired` |
| Auth user/profile | Zustand store + `onAuthStateChange` | Session lifetime | Sign out, token refresh |

---

## 5. CALIDAD

### Convenciones de naming y estructura por capa

| Capa | Convención | Ejemplo |
|---|---|---|
| **Packages** | `@enjambre/<nombre-kebab>` | `@enjambre/auth`, `@enjambre/contable` |
| **Exports** | Named exports only | `export function createClient()` |
| **Types** | `interface XxxProps`, `type Xxx = ...` | `interface ProductCardProps` |
| **Components** | PascalCase, archivo = nombre componente | `ProductCard.tsx` exporta `ProductCard` |
| **Hooks** | `useXxx` | `useAuthProvider`, `useTierProgress` |
| **Utils** | `kebab-case.ts`, funciones puras | `format.ts`, `friendly-error.ts` |
| **API Routes (BFF)** | `kebab-case.ts`, Hono router export | `cash-sessions.ts` exporta `cashSessionsRoutes` |
| **Database** | `snake_case` tablas/columnas, `NN_descripcion.sql` migraciones | `rep_profiles`, `28_cash_sessions_commissions_invitations.sql` |
| **RLS Functions** | `snake_case`, prefijo semántico | `current_role()`, `has_empresa_access()`, `evaluar_tier_rep()` |
| **Env Vars** | `NEXT_PUBLIC_*` para client, sin prefijo para server | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

### Estrategia de tests: unitario → integración → e2e

| Nivel | Herramienta | Cobertura actual | Objetivo |
|---|---|---|---|
| **Unitario** | Vitest | `@enjambre/contable`: 79 tests (100% domain logic) | 100% packages puros |
| **Integración** | Vitest + Supabase local | `@enjambre/auth`: 15 tests middleware/role-redirect | BFF routes críticos (checkout, comisiones, auth) |
| **Componentes** | Testing Library | 0 | Componentes `@enjambre/ui` + formularios críticos |
| **E2E** | Playwright | Tienda: 1 spec (setup) | Flujo compra completo, login multi-rol, POS campo |

**Regla**: Todo flujo de pago, dato sensible o mutación crítica = test automatizado obligatorio.

### Lint rules críticas para este dominio

```json
// Reglas obligatorias (enforced via CI)
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "react/no-default-export": "error",
    "react/require-default-props": "off",
    "@typescript-eslint/consistent-type-imports": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "tailwindcss/no-custom-classname": "error",  // Solo tokens semánticos
    "tailwindcss/enforce-negative-values": "error"
  }
}
```

**Reglas de dominio específicas:**
- Prohibido `supabase.auth.getSession()` para auth checks → usar `getUser()`
- Prohibido `user_metadata` para roles → usar `app_metadata` o tabla `profiles`
- Prohibido `service_role` en cliente → solo entry points server de `@enjambre/auth`
- Prohibido `export default` (excepto Next.js pages)
- Prohibido hex sueltos → tokens semánticos Tailwind (`bg-background`, `text-primary`, etc.)
- Prohibido `catch(e) {}` → `toast.error(friendlyError(e, 'contexto'))`

---

## 6. ROADMAP — 3 SPRINTS POR ROI/RIESGO

### Sprint 1: Facturación Legal + Conciliación (Semanas 1-3)
**Objetivo**: Cerrar ciclo contable real en Chile — SII DTE + conciliación bancaria auto

| Archivos afectados | Criterio de Done |
|---|---|
| `packages/database/supabase/migrations/NN_dte_certificates.sql` | Migración aplicada, types generados, RLS `has_empresa_access()` |
| `packages/database/supabase/migrations/NN_bank_reconciliation.sql` | Migración aplicada, views con `security_invoker=true` |
| `apps/nucleo/src/api/routes/sii/dte.ts` (nuevo) | Emitir DTE firmado, enviar SII, recibir respuesta, guardar XML |
| `apps/nucleo/src/api/routes/sii/rcv.ts` | Consumir RCV (Registro Compras Ventas) SII |
| `apps/nucleo/src/api/routes/banco-chile/conciliacion-auto.ts` | Matching reglas: monto+fecha+RUT → auto-reconcile ≥90% confidence |
| `packages/contable/src/domain/dte-xml.ts` | Generar XML DTE válido (factura, boleta, nota crédito) |
| `apps/nucleo/src/views/sii/components/DteEmitirForm.tsx` | UI emitir DTE con certificado seleccionado |
| `apps/nucleo/src/views/banco-chile/ConciliacionAutoView.tsx` | Dashboard matching con approve/reject manual |

**Riesgo**: Certificado digital SII requiere trámite presencial — **mitigación**: ambiente certificación SII (no producción) para dev.

---

### Sprint 2: Notificaciones Transaccionales + Blockchain Anchoring (Semanas 4-6)
**Objetivo**: Tiempo real al usuario + diferenciador premium trazabilidad

| Archivos afectados | Criterio de Done |
|---|---|
| `packages/database/supabase/migrations/NN_notifications.sql` | `notification_channels`, `notification_queue`, RLS + cron pg_cron |
| `packages/database/supabase/migrations/NN_blockchain_anchors.sql` | `blockchain_anchors`, RPC `anchor_entity(entity_type, entity_id)` |
| `apps/nucleo/src/api/routes/notifications.ts` (nuevo) | CRUD canales, worker procesa queue (email/push), retry exponencial |
| `apps/nucleo/src/lib/notifications/worker.ts` | Background job (Vercel Cron o pg_cron) cada 1 min |
| `apps/nucleo/src/lib/blockchain/anchor.ts` | Proveedor abstracto (Polygon/Base/Solana), mock para dev |
| `apps/tienda/app/producto/[slug]/trazabilidad/page.tsx` | QR → página trazabilidad con anchor verificado on-chain |
| `apps/nucleo/src/views/apicultor/TrazabilidadPanel.tsx` | Mostrar anchors por lote/colmena |
| `packages/ui/src/components/QRCode.tsx` | Componente reutilizable QR trazabilidad |

**Riesgo**: Blockchain en prod requiere gas/mainnet — **mitigación**: testnet Polygon Amoy, anchor asíncrono (no bloquea UX).

---

### Sprint 3: Multi-idioma Tienda + Perfil Guardian + Checkout Premium (Semanas 7-9)
**Objetivo**: Apertura exportación + retención cliente + wow factor checkout

| Archivos afectados | Criterio de Done |
|---|---|
| `apps/tienda/package.json` | `next-intl` instalado, config `i18n.ts` (es/en) |
| `apps/tienda/messages/es.json`, `en.json` | 100% strings landing + catalogo + checkout traducidas |
| `apps/tienda/app/[locale]/layout.tsx` | Routing por locale, middleware detecta `Accept-Language` |
| `apps/tienda/app/perfil/guardian/page.tsx` | Dashboard impacto: arboles, CO2, nivel, badges, referral |
| `packages/database/supabase/migrations/NN_guardian_profiles.sql` | `guardian_profiles` + RPC `calculate_guardian_tier(user_id)` |
| `apps/tienda/app/checkout/page.tsx` | GSAP micro-video bosque durante procesamiento, success cinemático |
| `apps/tienda/app/checkout/resultado/cinematica/page.tsx` | Página éxito con animación partículas, contador impacto |
| `apps/tienda/components/shop/GuardianSidebar.tsx` | Navegación perfil guardian integrada |

**Riesgo**: i18n rompe SEO si mal configurado — **mitigación**: `alternates.canonical` por locale, sitemap multi-idioma.

---

## 7. SEÑALES CRUZADAS — Abstracciones reutilizables (declaradas, no desarrolladas)

| Abstracción | Contexto actual | Reutilizable en |
|---|---|---|
| **Commission Engine** | `calcular_comision_venta()` + `commission_rules` (6 tipos, JSONB params, priority) | Marketplace creadores, afiliados, programa embajadores, B2B volume discounts |
| **Tier Auto-evaluation** | `evaluar_tier_rep()` + `tier_progress_rep()` (solo sube, override admin, métricas configurables) | Gamificación clientes (Guardian), partners, loyalty programs genéricos |
| **Invitation System** | `invitation_codes` + `invitation_redemptions` (roles[], tools[], max_uses, expiry) | Onboarding SaaS multi-tenant, referidos, beta access, waitlists |
| **Cash Session Pattern** | `cash_sessions` + `rep_session_summary_view` (apertura/cierre, Δ efectivo, CSV, reconciliación) | Cualquier POS multi-vendedor: ferias, food trucks, retail, eventos |
| **Multi-tenant RLS Helper** | `has_empresa_access()` + `usuarios_empresas` pivot + `tenantMiddleware` | Cualquier SaaS B2B con aislamiento por empresa |
| **Security Event Logging** | 13 tipos, dual endpoint (Bearer + internal key), RLS por tipo | Audit trail completo para cualquier app regulada (fintech, health, legal) |
| **Checkout Session Persistence** | `checkout_sessions` tabla + idempotencia + auto-expire RPC | Cualquier flujo pago serverless (Stripe, MercadoPago, PayPal, etc.) |
| **Contable Domain (Zod)** | IVA 19%, RUT, DTE XML, 7 receipt parsers, tasa-cambio, gasto-extranjero, PPM, F29, F22, remanente IVA | Cualquier SaaS Chile que facture, gaste en extranjero, concilie bancos |
| **Offline-first Hook Pattern** | `useSyncEngine` + Dexie schema + `sync_queue` (cancelado en Campo pero arquitectura lista) | Apps field workers: delivery, mantenimiento, inspecciones, encuestas |
| **Design Token System** | 4 brand hex + 7 HSL + CSS vars completas + Tailwind preset + editorial font scale | Cualquier brand premium que necesite dark mode, consistencia cross-app |

---

## RESUMEN EJECUTIVO

| Métrica | Valor |
|---|---|
| **Sprint 1 ROI** | Alto — habilita facturación legal Chile, cierre contable automático |
| **Sprint 2 ROI** | Medio-Alto — diferenciador premium (blockchain) + operacional (notificaciones) |
| **Sprint 3 ROI** | Medio — expansión mercado (i18n) + retención (Guardian) + brand (checkout) |
| **Riesgo técnico total** | Bajo — arquitectura sólida, deuda crítica resuelta, patterns establecidos |
| **Brecha crítica restante** | SII certificado digital (trámite externo), rate limiting global |

---

**Próximo paso**: Aprobación del plan → Inicio Sprint 1 (Migraciones DTE + Conciliación)

```json
{ 
  "cycle": 1, 
  "status": "COMPLETE", 
  "checks": { 
    "typecheck": "N/A", 
    "lint": "N/A", 
    "tests": "N/A", 
    "coverage": "N/A" 
  }, 
  "debt": [], 
  "next": "Sprint 1: Migración DTE certificates + bank_reconciliation + sii/dte.ts route + conciliacion-auto.ts"
}
```