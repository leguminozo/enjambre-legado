# Manifiesto de Deuda Tecnica — Enjambre Legado

> Puntos de friccion, redundancia y fragilidad tecnica. Priorizados por riesgo.

---

## CRITICO — Resolver antes de produccion

### D1. Redundancia en el Monorepo: Carpetas "Copia de..." (RESUELTO)

**Problema**: Existian multiples directorios como `apps/nucleo/Copia de Verano Eccomerce?`, `Copia de Tienda Shopify OYZ/`, etc.

**Estado**: RESUELTO — Purged 2 directories: `Copia de Tienda Shopify OYZ/` (root, 18K files, PHP/WordPress legacy) y `apps/nucleo/Copia de Verano Eccomerce?/` (43 files, Node/PHP legacy). Cero assets unicos referenciados por el monorepo actual.

**Leccion**: Nunca guardar backups de proyectos legacy dentro del monorepo. Usar git tags/archives en su lugar.

---

### D2. Componentes en la Raiz vs Monorepo (RESUELTO)

**Problema**: `components/shop/` en la raiz del proyecto mientras otros estan en `apps/tienda/components`.

**Estado**: RESUELTO — El directorio estaba vacio (0 archivos). Eliminado sin impacto. No existian imports desde esa ruta.

---

### D3. Version de Next.js (Todas las Apps) (RESUELTO)

**Problema**: `next: ^16.2.6` en las 3 apps — caret permite upgrades impredecibles.

**Estado**: RESUELTO — Fijado a `16.2.6` exacto (sin caret) en las 3 apps. Tipos Supabase regenerados tras migrations 39+40, lo que expuso 3 casts `as Record<string, unknown>` en joins Supabase que ahora tienen tipos concretos. Corregidos en `harvests/route.ts`, `products/route.ts`, `cart/abandonment/route.ts`. Tambien fixeado `subscriptions/route.ts` (circular reference), `sitemap.ts` (async return type), y `ulmo/page.tsx` (unicode arrow en JSX).

**Leccion**: Al fijar versiones y regenerar tipos, casts `as Record` en joins Supabase se vuelven innecesarios — los tipos generados ya describen el join.

---

### D4. No Existen Tests Automatizados (RESUELTO)

**Problema**: No habia unit tests ni tests de integracion para flujos criticos.

**Estado**: RESUELTO — Vitest implementado para `@enjambre/contable`. 79 tests en 8 archivos cubriendo: RUT validation, IVA/tax calculations, DTE XML generation, gasto-extranjero provider detection, Uber receipt parsing, tasa-cambio (mocked), receipt parser registry, Zod schemas (factura + factura-compra).

**Bug encontrado durante testing**: `detectarProveedor()` — keyword `"trip"` (uber) era substring de `"stripe"`, causando falsos positivos. Corregido con word-boundary regex (`\b`).

**Siguiente paso**: Playwright para flujo de compra completo, Testing Library para componentes criticos.

---

### D4b. Checkout Sessions en Map en Memoria (RESUELTO)

**Problema**: Las sesiones de checkout se almacenaban en un `Map` en memoria. En Vercel serverless, cada cold start pierde las sesiones — el pago se autoriza pero la orden no se persiste.

**Estado**: RESUELTO — Migration 38 crea tabla `checkout_sessions` en Postgres con RLS (service_role only). Las funciones `saveCheckoutSession`, `getCheckoutSession`, `completeCheckoutSession` ahora operan sobre Supabase. Ademas: idempotencia en webhooks (status `completed` previene doble insercion), auditoria trazable, auto-expire via `expire_checkout_sessions()`.

**Leccion**: Nunca almacenar estado de sesiones de pago en memoria en serverless. La fuente de verdad es Postgres.

---

### D4c. 15 Unsafe `as` Casts en Tienda (RESUELTO)

**Problema**: 15 casts `as` sin validacion runtime en boundaries criticos (Supabase rows, API responses, JSON.parse, user objects). Un cambio de schema o respuesta inesperada causa silent data corruption o crash.

**Estado**: RESUELTO — Reemplazados con Zod schemas + type guards + `TiendaUserProfile`:

| Archivo | Cast eliminado | Reemplazo |
|---|---|---|
| `lib/shop/products.ts` | 4x `as unknown as ProductRow` / `as { fecha; colmenas }` | `ProductRowSchema.safeParse()`, `CosechaJoinSchema.safeParse()` |
| `lib/payments/flow-cl.ts` | 2x `as { url; token; ... }` / `as { status; ... }` | `FlowInitResponseSchema.safeParse()`, `FlowCommitResponseSchema.safeParse()` |
| `lib/payments/transbank.ts` | 1x `result as Record<string, unknown>` | `TransbankCommitResultSchema.safeParse()` |
| `lib/payments/types.ts` | 1x `data as unknown as CheckoutSessionRow` | `CheckoutSessionRowSchema.safeParse()` |
| `app/galeria/page.tsx` | 5x `item.content as Record<string, unknown>` + `as string` | `GaleriaItemContentSchema.safeParse()`, typed access |
| `app/perfil/pasaporte/page.tsx` | 1x `subConfig?.colmenas as Record<string, unknown>` | `ColmenaSchema.safeParse()` |
| `app/checkout/resultado/ui.tsx` | 2x `JSON.parse(raw) as {...}` / `res.json() as {...}` | `parsePendingCheckout()`, `parseCommitResponse()` type guards |
| `components/shop/guardian-sidebar.tsx` | `user: unknown` + `as Record` | `TiendaUserProfile` typed prop |
| `components/shop/mi-legado-client.tsx` | `user: unknown` + 2x `as string` / `as number` | `TiendaUserProfile` typed prop |
| `app/perfil/perfil-layout-client.tsx` | `user: unknown` | `TiendaUserProfile | null` typed prop |
| `components/providers/auth-context.tsx` | `role as TiendaUser['role']` | `VALID_ROLES.has()` check + fallback to `'cliente'` |

**Fixes adicionales**:
- `legal-content.tsx`: XSS en primer render (raw HTML antes de DOMPurify). Ahora `sanitized` inicia como `null` (render vacio seguro).
- `claim-client.tsx`: `createClient()` por render → `useMemo(() => createClient(), [])`. `venta.total as number` → `typeof` guard.
- `lib/integrations/run-sii-sync.ts`: 2 casts verificados — ya tenian runtime guards (`typeof` + `Array.isArray`), son narrowing seguro, no se modificaron.

**Leccion**: En boundaries externos (Supabase rows, APIs de pago, sessionStorage, JSON.parse), Zod o type guards son obligatorios. Los `as` solo son aceptables despues de un narrowing runtime verificado.

---

## ALTO — Resolver en proximos sprints

### D5. Paquetes Vacios/Stubs (RESUELTO)

**Problema**: `packages/ai`, `packages/maps`, `packages/ui` estaban practicamente vacios.

**Estado**: RESUELTO — `packages/ai` eliminado (0 consumidores, solo placeholder). `packages/maps` permanece pero eliminado de `nucleo/next.config.ts` transpilePackages (0 imports reales, nucleo usa Leaflet directamente). `packages/ui` confirmado como activo — 93+ referencias en las 3 apps (Button, Card, toast, ThemeProvider, tokens, tailwind-preset, friendlyError, etc.).

**Leccion**: Si un paquete no tiene consumidores y solo contiene placeholders, eliminar. No mantener stubs "por si acaso".

---

### D6. Auditoria de RLS Incompleta (RESUELTO)

**Problema**: Nuevas tablas sin RLS, views sin security_invoker, policies demasiado permisivas, SECURITY DEFINER functions sin auth checks.

**Estado**: RESUELTO — Migration 40 (`40_rls_hardening_audit.sql`) aborda:

| Hallazgo | Detalle | Fix |
|---|---|---|
| 8 tablas SIN RLS | `source_files`, `boletas_ingest`, `bank_movements`, `sii_sync_runs`, `notification_events`, `cosechas`, `lotes`, `arboles_plantados` | `ALTER TABLE ENABLE ROW LEVEL SECURITY` + policies por rol |
| `suscriptor_config` | RLS habilitado pero ZERO policies (todo bloqueado) | 4 policies: self SELECT/INSERT/UPDATE + admin ALL |
| `productos_read` | Policy con `USING true` permite anon ver productos ocultos | DROP policy legacy, queda `productos_public_read` con `visible = true` |
| `eventos_read` | `USING true` para anon | Restringido a `TO authenticated` |
| `configuracion_ia` | ALL para cualquier authenticated | Restringido a `is_gerente()` |
| `integrations_select` | SELECT para cualquier authenticated | Restringido a `is_gerente() OR current_role() = 'tienda_admin'` |
| 6 views sin security_invoker | `user_tier_view`, `user_ciclos_balance`, `creador_balance_view`, `creador_ranking_view`, `rep_session_summary_view`, `rep_performance_view` | `CREATE OR REPLACE VIEW ... WITH (security_invoker = true)` |
| Missing policies | `colmenas`, `inspecciones`, `varroa_records`, `peso_records`, `ciclos`, `ciclos_canjeados` sin INSERT/UPDATE/DELETE | Policies apropiadas por rol (campo app necesita write) |
| `decrement_stock()` | Ejecutable por anon/authenticated | `REVOKE EXECUTE FROM authenticated, anon` — solo service_role + triggers |
| `aplicar_codigo_creador()` | Sin auth check | `IF auth.uid() IS NULL THEN RETURN` + `SET search_path` |
| `canjear_codigo_invitacion()` | Acepta cualquier `p_user_id` | `auth.uid() != p_user_id` rechaza impersonacion |
| `calcular_comision_venta()` | Invocable desde RPC por cualquier usuario | `auth.role() NOT IN ('service_role', 'postgres')` RAISE EXCEPTION |

**Leccion**: Cada tabla nueva debe incluir `ENABLE ROW LEVEL SECURITY` + policies en su migration. Las views que acceden datos de usuario requieren `security_invoker = true`. Las SECURITY DEFINER functions deben verificar `auth.uid()` o `auth.role()`.

---

### D7. Offline-First Sin Implementar (Campo)

**Problema**: Campo es offline-first por diseno pero actualmente usa Supabase directamente. No hay `@enjambre/offline`, Dexie, ni sync queue.

**Impacto**: Perdida de datos en zonas con baja senal (apicultor en terreno).

**Accion**:
1. Crear `packages/offline` con Dexie (IndexedDB) + sync queue
2. Tests de sincronizacion con interrupcion de red simulada
3. Validar en Chrome DevTools > Application > Service Workers

**Prioridad**: ALTA — El apicultor depende de esto en el campo.

---

## MEDIO — Planificar para el roadmap

### D8. EIRL Absorbido por Nucleo (VERIFICADO — Sin residuos)

**Problema**: `apps/eirl` fue absorbido por nucleo (vistas en `apps/nucleo/src/views/eirl/`). Originalmente usaba SQLite + Prisma + NextAuth, totalmente independiente de Supabase.

**Estado**: VERIFICADO — No se encontraron residuos de Prisma, SQLite ni NextAuth en nucleo. Las vistas EIRL usan Supabase + `@enjambre/contable` + `@enjambre/ui`. Cero imports de prisma. EIRL es el tipo legal de entidad del negocio, no un residue tecnico.

---

### D9. Hardcoding de Contenido (Resuelto)

**Problema**: Textos de landing quemados en codigo.

**Estado**: RESUELTO — Implementado `site_content` en Supabase + fetching dinamico.

**Leccion**: Siempre usar CMS para contenido editable por el cliente.

---

### D10. Variables de Entorno Dispersas (RESUELTO)

**Problema**: Cada app tenia sus propias variables con nombres inconsistentes. Nucleo aun referenciaba `VITE_*` (pre-Next.js migration). `apps/tienda/.env` estaba committed a git con placeholder secrets. `turbo.json` no incluia `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` para cache invalidation.

**Estado**: RESUELTO — Acciones:
- Eliminado `apps/tienda/.env` (legacy Express, committed con placeholders). Solo `.env.local` (gitignored) y `.env.example` quedan.
- Eliminado `apps/nucleo/src/vite-env.d.ts` (legacy Vite type declarations, 0 consumers).
- Migracion scripts (`migrate.ts`, `migrate_phase2.ts`): `VITE_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`.
- `turbo.json`: removidas 3 `VITE_*` vars, agregada `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (cache invalidation fix).
- `apps/nucleo/.env.example`: reescrito sin VITE_, solo NEXT_PUBLIC_.
- `apps/tienda/.env.example`: agregado `NEXT_PUBLIC_YOUTUBE_VIDEO_ID`.
- Root `.env.example`: reescrito reflejando estado actual (3 apps Next.js, cero VITE_).

---

## BAJA — Mejoras de calidad

### D11. Linting Inconsistente

**Problema**: No hay ESLint configurado consistentemente en todo el workspace.

**Accion**: Configurar ESLint flat config con reglas compartidas en la raiz.

### D12. Sin CI/CD Pipeline

**Problema**: No hay pipeline de integracion continua. Los builds se verifican manualmente.

**Accion**: GitHub Actions con:
- Build de la app afectada en cada PR
- Lint + typecheck
- Tests (cuando existan)

---

## Indice de Prioridad

| ID | Deuda | Prioridad | Esfuerzo | Riesgo |
|---|---|---|---|---|
| D7 | Offline sin implementar | ALTA | Alto | Alto |
| D11 | Linting | BAJA | Medio | Bajo |
| D12 | Sin CI/CD | BAJA | Medio | Medio |

---

*Actualizar este documento cuando se resuelva un item o se descubra nueva deuda.*
*Ultima actualizacion: Junio 2026*
