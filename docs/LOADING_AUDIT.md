# Auditoría de pantallas de carga — Enjambre Legado

> Inventario y plan de fortalecimiento del sistema de loading en el monorepo.  
> Fecha: julio 2026 · Contrato canónico: `packages/ui` (`HexagonLoader`, `ViewLoading`).

---

## 1. Resumen ejecutivo

| Métrica | Valor |
|---------|-------|
| **Componente canónico** | `HexagonLoader` + `ViewLoading` (`@enjambre/ui`) |
| **Archivos con API canónica** | ~45 |
| **Archivos con loaders legacy** | ~25 residual (Loader2 en botones CRM/panels; guard CI en views) |
| **`loading.tsx` Next.js** | 3 (tienda, núcleo, campo) |
| **Estado global** | **Parcialmente unificado** — núcleo EIRL/SII y varios botones aún fuera del contrato |

### Objetivo

Un solo lenguaje visual de espera, mínima latencia percibida, y reglas claras por capa (página / vista / inline / overlay).

---

## 2. Contrato canónico (`@enjambre/ui`)

Fuente: `packages/ui/src/components/view-loading.tsx`, `hexagon-loader.tsx`, `README.md`.

| Componente | Variante / uso | Cuándo |
|------------|----------------|--------|
| `HexagonLoader` | `sm` \| `md` \| `lg` | Botones, celdas, badges, acciones puntuales |
| `ViewLoading` | `inline` | Suspense estrecho, filas, banners |
| `ViewLoading` | `view` | Fetch inicial de panel, `dynamic()` fallback |
| `ViewLoading` | `page` | `app/**/loading.tsx` |
| `ViewLoading` | `fullscreen` | Splash, gates de app (landing) |
| `ViewLoadingFallback` | = `view` + `hideLabel` | `next/dynamic` en Server Components |
| `LoadingOverlay` | — | Refetch con contenido visible (dashboards) |

### Convenciones de rendimiento

1. **`hideLabel` en producción** cuando el contexto ya comunica la sección (reduce ruido visual y layout shift).
2. **`LoadingOverlay`** en refetch — no reemplazar toda la vista si ya hay datos.
3. **`next/dynamic`** con `ViewLoadingFallback` para bundles pesados (mapas, checkout, carrito).
4. **`loading.tsx`** solo para transiciones de ruta Next — no duplicar loader cliente encima.
5. **Evitar** `Loader2` + `animate-spin` en vistas completas — reservar para iconos de botón si hace falta micro-feedback.

---

## 3. Inventario por app

### 3.1 `apps/tienda` (~15 puntos de carga)

| Ubicación | Patrón actual | Variante | Estado |
|-----------|---------------|----------|--------|
| `app/loading.tsx` | `ViewLoading` | `page` | ✅ Canónico |
| `app/login/page.tsx` | Suspense + `ViewLoading` | `inline` | ✅ |
| `app/register/page.tsx` | `ViewLoading` | `view` | ✅ |
| `app/carrito/page.tsx` | `dynamic` + `ViewLoadingFallback` | `view` | ✅ |
| `app/checkout/page.tsx` | `dynamic` + `ViewLoadingFallback` | `view` | ✅ |
| `app/perfil/creador/page.tsx` | `dynamic` + `ViewLoadingFallback` | `view` | ✅ |
| `app/landing-view.tsx` | Suspense + `ViewLoading` en secciones | `view` | ✅ (3 bloques lazy) |
| `components/shop/landing-loader.tsx` | `ViewLoading` | `fullscreen` | ✅ **Migrado jul-2026** |
| `app/checkout/ui.tsx` | `HexagonLoader` en botón pagar | `sm` | ✅ Inline correcto |
| `components/creador/creador-portal-client.tsx` | `ViewLoading` + `Loader2` en tabs | mixto | ⚠️ Unificar botones a `HexagonLoader` |
| `components/auth/login-form.tsx` | `ViewLoading` | `inline` | ✅ |
| `app/carrito/ui.tsx` | `ViewLoading` | `view` | ✅ |
| `app/contacto/page.tsx` | Suspense + `ViewLoading` | `inline` | ✅ |
| `components/shop/qr-camera-scanner.tsx` | `HexagonLoader` | `sm` | ✅ |
| `app/claim/.../claim-client.tsx` | `HexagonLoader` | `sm` | ✅ |
| `app/qr-scan/page.tsx` | `HexagonLoader` | `sm` | ✅ |
| `components/auth/auth-shell.tsx` | `AuthPageLoading` | `inline` | ✅ Centralizado jul-2026 |

**Fortalezas tienda:** buen uso de `dynamic()` en carrito/checkout/creador; landing con Suspense por sección.

**Gaps tienda:** pocos `Loader2` residuales; falta `loading.tsx` en `/perfil/*` (depende del layout server — aceptable si shell es instantáneo).

---

### 3.2 `apps/nucleo` (~50+ puntos de carga)

| Zona | Archivos representativos | Patrón | Estado |
|------|-------------------------|--------|--------|
| Dashboard shell | `app/(dashboard)/loading.tsx` | `ViewLoading page` | ✅ |
| Paneles admin | `CreadoresAdminPanel`, `OperadoresFeriaPanel`, `TiendaPanel`, … | `ViewLoading view` | ✅ Mayoría |
| Dashboards gerente | `DashboardEjecutivo`, `DashboardResumen` | `ViewLoading` + `LoadingOverlay` | ✅ Patrón óptimo refetch |
| Vistas módulo | `LogisticaView`, `RegeneracionView`, `ContableHubView` | `ViewLoading` | ✅ |
| SII / fiscal | `BandejaFiscalTab`, `DashboardTab`, … | `ViewLoading` + algunos `Loader2` | ⚠️ |
| EIRL legacy | `ListaFacturas`, `ListaGastos`, `CalculosIA*` | `Loader2`, `Spinner`, `border spin` | ❌ Prioridad P1 |
| Costeo / producción | `CosteoView`, `ProduccionView` | `Spinner` wrapper | ⚠️ → `ViewLoading view` |
| Banco Chile | `BancoChileView`, `ConciliacionAutoView` | mixto Loader2/Spinner | ⚠️ |
| Perfil núcleo | `PerfilView.tsx` | `Loader2` fullscreen | ❌ → `ViewLoading view` |
| Mapas dynamic | `LogisticaView`, `EnvioComposerModal` | `ViewLoading` en import | ✅ |

**Mayor deuda técnica:** carpeta `views/eirl/**` y tabs SII con spinners Lucide sueltos.

---

### 3.3 `apps/campo` (~14 puntos)

| Ubicación | Patrón | Estado |
|-----------|--------|--------|
| `app/loading.tsx` | `ViewLoading page` | ✅ |
| `app/login/page.tsx` | Suspense + `ViewLoading inline` | ✅ |
| POS `page`, `catalogo`, `historial` | `ViewLoading view` | ✅ |
| `pos/carrito/page.tsx` | `dynamic` + `ViewLoadingFallback` | ✅ |
| `feria-context-banner` | `ViewLoading inline` | ✅ |
| `reader-selector`, `sumup-terminal-flow` | `HexagonLoader` / `ViewLoading` | ✅ |
| `quick-sale-button`, `carrito-view` | `HexagonLoader` / `ViewLoadingPlaceholder` | ✅ |
| `client-lookup-panel` | `HexagonLoader sm` en búsqueda | ✅ |

**Campo POS unificado** — P3 + P4 completos.

---

### 3.4 `packages/ui` (origen del contrato)

| Archivo | Rol |
|---------|-----|
| `hexagon-loader.tsx` | Animación SVG única (trazo + relleno) |
| `view-loading.tsx` | Variantes + `LoadingOverlay` + `ViewLoadingFallback` |
| `spinner.tsx` | Wrapper legacy → delega a hexágono por defecto |
| `notification-bell.tsx` | Texto "Cargando" sin hexágono en panel | ⚠️ alinear |
| `toast.tsx` | `Loader2` en toast de progreso | ✅ aceptable (micro) |

---

## 4. Anti-patrones detectados

| Anti-patrón | Ejemplo | Impacto |
|-------------|---------|---------|
| `div.animate-spin.rounded-full.border` | `ListaGastos.tsx` | Rompe identidad visual |
| `Loader2` pantalla completa | `PerfilView.tsx`, `BancoChileView` | Segundo lenguaje de carga |
| `Spinner` en vista (aunque sea hexágono) con padding ad-hoc | `CosteoView`, `ConciliacionAutoView` | Layout inconsistente |
| Splash custom sin hexágono | ~~`landing-loader.tsx`~~ | **Corregido** |
| Full view replace en refetch | Algunos tabs CRM | Parpadeo innecesario → usar `LoadingOverlay` |
| `hideLabel` inconsistente | Algunos con label, otros sin | Ruido visual en móvil |

---

## 5. Matriz de decisión (árbol rápido)

```
¿Es transición de ruta Next App Router?
  → app/**/loading.tsx con ViewLoading variant="page"

¿Es import lazy / dynamic de chunk grande?
  → ViewLoadingFallback (server) o viewLoadingFallback() (client)

¿Es fetch inicial sin datos en pantalla?
  → ViewLoading variant="view" hideLabel

¿Es refetch manteniendo datos visibles?
  → LoadingOverlay

¿Es acción en botón (submit, pagar, copiar)?
  → HexagonLoader size="sm" dentro del botón

¿Es toast / notificación de progreso?
  → Loader2 sm aceptable (excepción documentada)
```

---

## 6. Plan de fortalecimiento por fases

### P0 — Inmediato (sin riesgo, alto impacto visual)

- [x] **Tienda `landing-loader`** → `ViewLoading fullscreen` (jul-2026)
- [x] **Hexágono gigante en `/login` (desktop)** — causa: Tailwind de tienda/campo no escaneaba `@enjambre/ui`; tamaños ahora en `tokens.css` (`data-size`) + `enjambreUiContent` en preset (jul-2026)
- [x] **`AuthPageLoading`** centralizado en `auth-shell.tsx` (login, registro, gate de sesión)
- [x] Sustituir `Loader2` en `qr-camera-scanner`, `claim-client`, `qr-scan` por `HexagonLoader sm`
- [x] Documentar Tailwind + tamaños en `packages/ui/README.md`

### P1 — Núcleo EIRL + Perfil (1–2 PRs)

- [x] **jul-2026** — EIRL + Perfil unificados al hexágono canónico

| Archivo | Cambio |
|---------|--------|
| `views/eirl/facturas/ListaFacturas.tsx` | `ViewLoading view` + `HexagonLoader sm` en botones | ✅ |
| `views/eirl/facturas/NuevaFacturaForm.tsx` | `HexagonLoader sm` en submit | ✅ |
| `views/eirl/gastos/ListaGastos.tsx` | Eliminar `border spin` → `ViewLoading view` | ✅ |
| `views/eirl/calculos-ia/*` | `RefreshCw` en botones refresh; vista inicial → `ViewLoading` | ✅ |
| `views/PerfilView.tsx` | Fullscreen → `ViewLoading view` + `HexagonLoader sm` inline | ✅ |

### P2 — Núcleo operaciones (1 PR)

- [x] **jul-2026** — Costeo, producción, banco Chile y SII unificados

| Archivo | Cambio |
|---------|--------|
| `views/costeo/CosteoView.tsx` | `ViewLoading view` + `LoadingOverlay` en refetch por tab | ✅ |
| `views/produccion/ProduccionView.tsx` | `ViewLoading view` + `LoadingOverlay` en refetch | ✅ |
| `views/banco-chile/BancoChileView.tsx` | `ViewLoading view` + `HexagonLoader sm` sync | ✅ |
| `views/banco-chile/ConciliacionAutoView.tsx` | `ViewLoading` + `LoadingOverlay` + hexágono en botones | ✅ |
| `views/sii/SiiDteView.tsx` | `TabFallback` → `ViewLoading inline` | ✅ |
| `views/sii/components/*` | `ViewLoading` carga inicial; `LoadingOverlay` refetch; `HexagonLoader sm` en acciones | ✅ |

### P3 — Campo POS micro-loaders (1 PR)

- [x] **jul-2026** — Terminales SumUp, venta rápida y carrito unificados

| Archivo | Cambio |
|---------|--------|
| `reader-selector.tsx` | `ViewLoading inline` en fetch inicial; `HexagonLoader sm` en estado busy | ✅ |
| `sumup-terminal-flow.tsx` | `HexagonLoader sm` en envío y polling | ✅ |
| `quick-sale-button.tsx` | `HexagonLoader sm` en botones de pago | ✅ |
| `carrito-view.tsx` | `ViewLoading view` en sync; `HexagonLoader sm` en confirmar venta | ✅ |

### P4 — Performance / percepción

- [x] **jul-2026** — CLS, prefetch, anti-doble-loader y guard CI

| Item | Cambio |
|------|--------|
| Prefetch PWA | `MobileBottomNav` prefetch en `<Link>` + `router.prefetch` de tabs al montar PWA | ✅ |
| Prefetch POS | Links `/pos/catalogo`, `/pos/carrito`, `/pos/historial` con `prefetch` | ✅ |
| CLS Suspense | `ViewLoading variant="view"` ya usa `min-h-[12rem]`; catálogo campo sin `py-20` duplicado | ✅ |
| Anti-doble-loader | `ViewLoadingPlaceholder` (carrito tienda/campo); `useClientViewLoading` (POS, historial) | ✅ |
| Mapas / GSAP | Sin cambio — `dynamic(..., { ssr: false })` + `ViewLoading view` se mantiene | ✅ |
| CI | `pnpm check:loading` → `scripts/check-loading-legacy.sh` (border-spin en views) | ✅ |
| Residual campo | `client-lookup-panel.tsx` → `HexagonLoader sm` en búsqueda | ✅ |

---

## 7. Rutas y guards (contexto tienda — jul-2026)

Documentado junto a esta auditoría por coherencia operativa:

| Ruta | Guard |
|------|-------|
| `/perfil/creador` | `creador_required` |
| `/perfil/mayorista` | `aliado_activo_required` |
| `/perfil/*` staff admin/gerente | `nucleo_staff_redirect` → `{NUCLEO}/ejecutivo` |
| Contrato | `apps/tienda/lib/shop/store-routes.ts` |

---

## 8. Comandos útiles

```bash
# Inventario rápido loaders canónicos
rg "ViewLoading|HexagonLoader|ViewLoadingFallback" apps packages --glob "*.tsx" -l

# Deuda legacy (guard CI)
pnpm check:loading

# Inventario amplio
rg "Loader2|animate-spin rounded-full|<Spinner" apps --glob "*.tsx" -l

# Tests tienda (rutas + guards)
pnpm --filter @enjambre/tienda exec vitest run lib/shop/

# Smoke E2E
pnpm --filter @enjambre/tienda test:e2e:smoke
```

---

## 9. Definición de éxito

- [x] **P0–P4** loaders POS / EIRL / operaciones / carrito unificados (jul-2026)
- [x] **100%** `loading.tsx` usando `ViewLoading page hideLabel` (tienda, núcleo, campo)
- [x] **Dashboards núcleo** con refetch vía `LoadingOverlay` donde hay datos previos
- [x] **LCP landing tienda** sin splash duplicado (`LandingLoader` → `ViewLoading fullscreen`)
- [x] **CI** `pnpm check:loading` para border-spin en views
- [ ] **0** `Loader2` pantalla completa en núcleo CRM/panels (deuda residual — botones/micro OK)
- [x] **E2 jul-2026** — smoke cross-app: feria-context, guards perfil, checkout quote, claim
- [ ] CI smoke E2E Playwright verde (puertos dev vs config)

---

## 10. Referencias

- `packages/ui/README.md` — Loading
- `system_invariants.md` — Ley III (geometría), Ley IV (cirugía verificable)
- `apps/tienda/lib/shop/store-routes.ts` — contrato rutas tienda
- Commits relacionados: fortaleza nav, mayorista, staff redirect, landing-loader (jul-2026)