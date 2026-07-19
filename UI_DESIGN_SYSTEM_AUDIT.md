# Enjambre Legado — UI Design System Audit Report

**Date:** 2026-07-12  
**Scope:** `packages/ui` vs `apps/tienda`, `apps/nucleo`, `apps/campo`  
**Method:** Static analysis of tokens, components, imports, CSS, and Tailwind configs

---

## Executive Summary

The `@enjambre/ui` package provides a **strong semantic token foundation** (HSL-based, dark-mode-first, Cormorant Garamond display) and **15 exported components**, but **~40% of components are underused or unused** across the three apps. Critical gaps exist in **interaction feedback** (no Tooltip, DropdownMenu, Tabs in UI package), **data display** (no DataTable, Progress in UI), and **animation consistency** (GSAP only in 3 files, Framer Motion ad-hoc in Nucleo). Each app has **divergent glassmorphism implementations** and **hardcoded color escape hatches** (QR codes, status badges, charts).

---

## 1. Design Tokens — Defined but Unused

### Tokens defined in `packages/ui/src/tokens.css` + `tailwind-preset.ts`

| Category | Token | Used in Apps? |
|----------|-------|---------------|
| **Color (semantic)** | `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring` | ✅ Widely used |
| **Color (brand)** | `bosque`, `miel`, `crema` (with light/dark/glow variants) | ⚠️ Partial — `miel-glow` used in Badge/Toast, `bosque` rarely |
| **Surface** | `surface-raised`, `surface-sunken` | ⚠️ Nucleo uses custom `--surface-*` CSS vars instead |
| **Chart** | `chart-1`…`chart-5` | ❌ **Unused** — apps use hardcoded hex (`#22c55e`, `#3b82f6`, etc.) |
| **Sidebar** | `sidebar`, `sidebar-*` | ⚠️ Nucleo redefines in globals.css |
| **Typography** | `font-display` (Cormorant), `font-sans` (Inter), `font-mono` (JetBrains) | ✅ Cormorant used for headings; `font-display` class used inconsistently |
| **Editorial sizes** | `editorial-xs`…`editorial-9xl` with tracking/leading | ❌ **Unused** — apps use raw `text-xl`, `font-display` |
| **Spacing** | `space-1`…`space-32` (mapped to `--space-*`) | ✅ Used via Tailwind utilities |
| **Radius** | `radius-sm`…`radius-2xl`, `radius-full` | ✅ Used |
| **Shadows** | `shadow-sm`…`shadow-xl`, `shadow-glow`, `shadow-glow-strong` | ⚠️ `shadow-glow` used in Card/Button hover; `glow-strong` unused |
| **Transitions** | `transition-fast`…`transition-elegant` | ❌ **Unused** — apps use `duration-200`, `duration-300` |
| **Animations** | `fade-in-up`, `fade-in`, `shimmer`, `float`, `pulse-gold`, `bee-flight` | ❌ **Unused** — apps write custom `@keyframes` |
| **Z-index** | `--sidebar-width`, `--header-height`, `--nav-height`, `--max-content-width` | ⚠️ Nucleo redefines; Tienda uses custom `--tienda-*` vars |

### Hardcoded values that should be tokens

| Location | Hardcoded | Should Use |
|----------|-----------|------------|
| `apps/nucleo/src/components/logistica/MapaEnviosHistorico.tsx` | `#22c55e`, `#3b82f6`, `#f59e0b`, `#a855f7` | `success`, `info`, `warning`, `accent` |
| `apps/tienda/app/producto/[slug]/ui.tsx` | `bg-white`, `fgColor="#000000"` | `bg-card`, `fgColor="hsl(var(--foreground))"` |
| `apps/nucleo/src/views/VendedorView.tsx` | `bg-white`, `fgColor="#000000"` | Same |
| `apps/campo/src/components/leaderboard/LeaderboardPanel.tsx` | `bg-slate-500/10`, `text-slate-400` | `bg-muted`, `text-muted-foreground` |
| `apps/nucleo/src/components/tienda/StoreChromeEditors.tsx` | `#ccc`, `#eee` | `border`, `muted` |

---

## 2. GSAP Animations — Capability vs Usage

### In `@enjambre/ui`
- **HexagonLoader** (`hexagon-loader.tsx`) — 195 lines of GSAP: stroke dashoffset, rotation, scale breathing, float. Context-aware (`tienda`/`campo`/`nucleo`).
- **ViewLoading** (`view-loading.tsx`) — GSAP entry animation (fade/scale/blur) for fullscreen/page/view/inline variants.

### Actual GSAP usage in apps (9 files)

| App | File | Usage |
|-----|------|-------|
| Tienda | `checkout/ui.tsx` | Page transition |
| Tienda | `checkout/resultado/ui.tsx` | Confetti/success animation |
| Tienda | `perfil/reposicion/resultado/ui.tsx` | Progress animation |
| Tienda | `perfil/logros-client.tsx` | Staggered card entry, counter animation |
| Tienda | `shop/mi-legado-client.tsx` | Bee flight path |
| Tienda | `shop/page-transition.tsx` | Route transition |
| Tienda | `shop/custom-cursor.tsx` | Cursor follower |
| Nucleo | `enjambre/EcosistemaDashboard.tsx` | Bento grid stagger |
| Nucleo | `auth/AuthHero.tsx` | Hero entrance |

### Gaps
| Missing Animation Pattern | Status |
|---------------------------|--------|
| **Scroll-triggered** (ScrollTrigger) | ❌ Not used anywhere |
| **Page transitions** (shared layout) | ⚠️ Only Tienda has `page-transition.tsx` (custom) |
| **Micro-interactions** (button press ripple, hover lift) | ⚠️ Button has `active:scale-[0.96]`; Card has `hover:-translate-y-1`; no ripple |
| **Loading skeletons** | ⚠️ `ViewLoadingPlaceholder` exists but rarely used; apps show raw spinners |
| **List enter/exit** (FLIP) | ❌ Not implemented |
| **Error/success state transitions** | ⚠️ Toast has enter/exit; form errors appear instantly |

---

## 3. Glassmorphism — Inconsistent & Ad-hoc

### Tokens available (tokens.css)
```css
--glass-bg: hsl(var(--enj-bosque-ulmo-h) var(--enj-bosque-ulmo-s) 14% / 0.4);
--glass-border: hsl(var(--enj-oro-miel-h) var(--enj-oro-miel-s) var(--enj-oro-miel-l) / 0.2);
```

### Tailwind preset maps: `bg-card/60 backdrop-blur-xl border border-foreground/20`

### Actual implementations per app

| App | Pattern | Files |
|-----|---------|-------|
| **Nucleo** | `.glass-panel` (globals.css) + `glass`/`glass-strong` utilities + `GlassCard` component (framer-motion) | 30+ matches |
| **Tienda** | `.glass-panel` (globals.css) + `.tienda-bottom-nav-glass` + `.tienda-modal-backdrop` | 15+ matches |
| **Campo** | `bg-card/40 backdrop-blur-xl` inline on landing cards | 5+ matches |

### Issues
1. **No shared Glass component** in `@enjambre/ui` — each app reimplements
2. **Opacity/blur values differ**: Nucleo `backdrop-blur-xl` + `bg-card/60`; Tienda `backdrop-blur-2xl` + `bg-card/60`; Campo `backdrop-blur-xl` + `bg-card/40`
3. **Border treatment differs**: Nucleo uses `border-foreground/20`; Tienda uses `border-border/55`; Campo uses `border-border/50`
4. **No `bg-glass` / `blur-glow` utility classes** in preset — apps write raw `backdrop-blur-*`

---

## 4. Component Gaps — What Exists vs What's Used

### Exported from `@enjambre/ui` (index.ts)

| Component | Exported | Used in Apps | Notes |
|-----------|----------|--------------|-------|
| `Button` | ✅ | Tienda, Nucleo, Campo | Variants: primary, gold, outline, ghost, destructive |
| `Card` + subparts | ✅ | Nucleo (via local GlassCard), Tienda (rare) | Variants: default, dark, glass, accent, elevated |
| `Badge` | ✅ | All 3 apps | Variants: default, success, warning, danger, gold, info |
| `Input`, `Textarea` | ✅ | Nucleo (local Select/Label), Tienda (rare) | Basic styling only |
| `StatCard` | ✅ | Nucleo (local KpiCard instead) | Has sparkline, trend |
| `Spinner` / `HexagonLoader` | ✅ | All 3 apps | HexagonLoader is canonical |
| `ViewLoading` + variants | ✅ | All 3 apps (loading.tsx) | Context-aware (tienda/campo/nucleo) |
| `ImmersiveModal` | ✅ | Nucleo (heavy), Tienda (TiendaModal instead), Campo | Large admin panels |
| `OverlayFullscreen` | ✅ | ❌ **Unused** | Editor shells |
| `EmptyState` | ✅ | ❌ **Unused** | |
| `SectionHeader` | ✅ | ❌ **Unused** | |
| `GrainOverlay` | ✅ | Tienda (app-providers) | Film grain effect |
| `Toast` + `ToastProvider` | ✅ | All 3 apps | Full promise API, history |
| `NotificationBell` | ✅ | Tienda (shop-header), Nucleo (dashboard-layout) | Dropdown notifications |
| `ThemeProvider` / `ThemeToggle` | ✅ | All 3 apps | |
| `Dialog` (Radix) | ✅ | ❌ **Unused** — Tienda uses `TiendaModal`, Nucleo uses `ImmersiveModal` | |
| `BentoGrid` | ✅ | Nucleo (EcosistemaDashboard) | |
| `CinematicCard` | ✅ | Nucleo (EcosistemaDashboard) | |
| `PredictivePill` | ✅ | ❌ **Unused** | |
| `Calendar` / `DatePicker` | ✅ | Nucleo (PipelineView, OperadoresFeria, etc.) | |
| `QRCode` | ✅ | Tienda (producto, checkout) | |
| `Sidebar` components | ✅ | ❌ **Unused** — each app has custom sidebar | |
| `ModuleHero` | ✅ | ❌ **Unused** | |

### Components MISSING from `@enjambre/ui` but needed

| Component | Needed By | Current Implementation |
|-----------|-----------|------------------------|
| **Tooltip** | All apps | Inline `title` or custom — no consistent tooltip |
| **DropdownMenu** | All apps | MIGRATION.md claims migrated but **file doesn't exist** in UI package; Nucleo/tienda use custom |
| **Tabs** | Nucleo (CRM, SII, Pipeline), Tienda (perfil) | Nucleo: `ResponsiveTabBar` (globals.css); Tienda: custom |
| **DataTable** | Nucleo (ListaFacturas, Conciliacion, CRM) | Nucleo: `EnjTableShell` + `.data-table` (globals.css) |
| **Progress** | Nucleo (CalculosIA), Tienda (reposicion) | Nucleo: local `Progress` (Radix); Tienda: custom bars |
| **Select** | Nucleo (NuevaFactura, NuevoGasto, CalculosIA) | Nucleo: local `Select` (Radix) — **should be in UI** |
| **Label** | Nucleo (forms) | Nucleo: local `Label` — **should be in UI** |
| **SegmentControl** | Nucleo (views) | Nucleo: local `SegmentControl` (framer-motion) |
| **KpiCard** / **StatCard** | Nucleo (Dashboards) | Nucleo: local `KpiCard` + `GlassCard` (framer-motion) |
| **Tooltip** | All | ❌ Missing |
| **Tabs** | All | ❌ Missing |
| **Skeleton** | All | ⚠️ `ViewLoadingPlaceholder` only |
| **Avatar** | Nucleo (sidebar user), Tienda (perfil) | Inline |
| **Separator** | All | `hr` / `border-t` |
| **Switch** | ConfiguracionView | Inline |
| **Slider** | None yet | — |
| **Pagination** | Catalogo, ListaFacturas | Custom |

---

## 5. Responsive Gaps

| Breakpoint | Nucleo | Tienda | Campo |
|------------|--------|--------|-------|
| **Mobile (<768px)** | Sidebar → liquid bottom nav (CSS); tables scroll horizontally; grids → 1col | Bottom nav (PWA); sheets for modals; cart bar; sticky CTA | Bottom nav (liquid); POS optimized for touch |
| **Tablet (768-1024px)** | Sidebar → rail (72px); grids → 2col | Header expands; catalog sticky filters | N/A (POS is mobile-first) |
| **Desktop (>1024px)** | Full sidebar; multi-col grids | Full header; multi-col layouts | — |

### Specific Issues
- **Nucleo**: `.sidebar-rail` exists but **no sidebar collapse animation** (instant switch)
- **Nucleo**: `ResponsiveTabBar` (globals.css) has scroll indicators but **no keyboard navigation**
- **Tienda**: `TiendaModal` uses bottom sheet on mobile, center panel on desktop — **good pattern** but not in UI package
- **Campo**: POS layout is mobile-only; **no desktop POS view**
- **All**: **No standardized bottom sheet component** — each app rolls its own

---

## 6. Animation Gaps — Missing Interaction Feedback

| Interaction | Current State | Expected |
|-------------|---------------|----------|
| **Button hover** | `hover:brightness-110` / `hover:-translate-y-0.5` | ✅ Present |
| **Button press (ripple)** | `active:scale-[0.96]` only | ❌ No ripple |
| **Card hover** | `hover:-translate-y-1 hover:shadow-glow` | ✅ Present (Card, GlassCard) |
| **Focus visible** | `focus-visible:ring-2` (Button, Dialog) | ⚠️ Inconsistent — some custom inputs lack |
| **Loading spinner** | `HexagonLoader` (GSAP) | ✅ Canonical |
| **Skeleton screens** | `ViewLoadingPlaceholder` (empty div) | ⚠️ No shimmer/content shape |
| **Page transition** | Tienda: `page-transition.tsx` (GSAP); Nucleo: none; Campo: none | ❌ No shared system |
| **List item enter** | Nucleo: `animate-in fade-in zoom-in-95` (Tailwind); Tienda: GSAP stagger | ❌ No FLIP/shared |
| **List item exit** | Toast has exit; others instant | ❌ |
| **Error appear** | Toast `animate-pulse` for promise; inline errors instant | ❌ No shake/slide |
| **Success check** | Toast icon swap; QR success custom GSAP | ⚠️ Ad-hoc |
| **Modal enter/exit** | Dialog: Radix `overlayPanelMotionClassName`; ImmersiveModal: `animate-in zoom-in-95` | ⚠️ Two different systems |

---

## 7. Typography Consistency

### Token: `--font-display: 'Cormorant Garamond'`, `--font-sans: 'Inter'`

| App | Heading Font | Body Font | Issues |
|-----|--------------|-----------|--------|
| **Nucleo** | `font-existencial` (Cormorant) via CSS var | `font-datos` (Inter) via CSS var | CSS vars duplicate tokens; `font-display` Tailwind class unused |
| **Tienda** | `@apply font-display` in globals.css for h1-h4 | `@apply font-sans` on body | ✅ Consistent |
| **Campo** | `font-serif` (Tailwind = Cormorant via preset) | `font-sans` | ✅ Uses preset |

### Hardcoded font families found
- `apps/nucleo/globals.css`: `--font-existencial: var(--font-cormorant)...` — duplicates preset
- `apps/nucleo/src/components/ui/GlassCard.tsx`: `'font-display-garamond'` class but not using preset
- Inline `font-serif` / `font-sans` in JSX — should use `font-display` / `font-sans` tokens

---

## 8. Icon Gaps

### `@enjambre/ui` exports 24 Lucide icons (index.ts)

| Category | Icons |
|----------|-------|
| Navigation | ChevronDown, ChevronUp, ChevronRight, ChevronLeft, ArrowRight, ArrowLeft, ArrowUp, ArrowDown |
| Actions | Search, Plus, Minus, X, Check, Circle, Loader2, ExternalLink, Link, Copy |
| UI | PanelLeft, GripVertical, Image |
| Status | AlertCircle, AlertTriangle, Info, CheckCircle, XCircle |

### Missing icons forcing inline SVGs / extra imports

| Needed Icon | Used In | Workaround |
|-------------|---------|------------|
| `Calendar`, `CalendarDays` | DatePicker, CRM, Logistica | Import from `lucide-react` directly |
| `Users`, `UserPlus`, `UserCog` | CRM, Creadores, Sidebar | Direct import |
| `Package`, `PackagePlus`, `PackageX` | Productos, Catalogo, Costeo | Direct import |
| `Trash2`, `Edit3`, `Eye`, `EyeOff` | Lists, forms | Direct import |
| `MapPin`, `Navigation`, `Truck` | Logistica, Map | Direct import |
| `CreditCard`, `Wallet`, `Banknote` | Checkout, Wallet, Banco | Direct import |
| `Shield`, `ShieldCheck`, `Award` | Logros, Guardian | Direct import |
| `BarChart3`, `TrendingUp`, `Activity` | Dashboards, Analytics | Direct import |
| `Settings`, `SlidersVertical`, `LayoutTemplate` | Configuracion | Direct import |
| `Hexagon` | Branding, HexagonLoader | Direct import |
| `Leaf`, `Trees`, `Zap` | Landing, Regeneracion | Direct import |
| `Crown`, `Flame`, `Sparkles` | Tier badges, Gamification | Direct import |

**Recommendation**: Extend `@enjambre/ui/icons` to ~50 icons covering all app needs; ban direct `lucide-react` imports in app code.

---

## 9. Dark Mode Completeness

| State | Nucleo | Tienda | Campo |
|-------|--------|--------|-------|
| **Default (dark)** | ✅ | ✅ | ✅ |
| **Light mode** | ✅ (globals.css `:root.light`) | ✅ (tokens.css `:root.light`) | ✅ (tokens.css) |
| **Loading** | `ViewLoading` (context-aware bg) | `ViewLoading` | `ViewLoading` |
| **Error** | Toast (semantic), inline `text-destructive` | Toast, inline | Toast |
| **Empty** | ❌ No `EmptyState` used | ❌ | ❌ |
| **Disabled** | `disabled:opacity-50` (Button), custom on inputs | Button, custom | Button |
| **Focus** | `focus-visible:ring` (Button, Dialog) | Button, custom | Button |
| **Active/Selected** | `bg-accent/10 text-accent` (nav), `border-l-accent` (cards) | `bg-accent/10` (nav), custom | `bg-primary/5` (nav) |

### Gaps
- **No `EmptyState` component usage** — apps render "No data" text inline
- **No standardized disabled input style** — Nucleo uses `opacity-50`, Tienda uses `bg-secondary/35`
- **Focus rings inconsistent** — some custom inputs lack `focus-visible`

---

## 10. Priority Ranking — Visual/Interaction Gaps by User Impact

| Rank | Gap | Impact | Effort | Apps Affected |
|------|-----|--------|--------|---------------|
| **1** | **No Tooltip / DropdownMenu / Tabs in UI package** | High — inconsistent menus, no hover hints, keyboard a11y gaps | Medium (port Nucleo Select/Label + Radix DropdownMenu/Tabs) | All 3 |
| **2** | **Hardcoded chart/status colors** (`#22c55e`, `#3b82f6`, slate) | High — breaks theming, light mode broken | Low (replace with `success`/`info`/`warning` tokens) | Nucleo, Campo |
| **3** | **No shared Glass component** | Medium — 3 divergent implementations, maintenance burden | Medium (extract Nucleo `GlassCard` + Tienda `.glass-panel` to UI) | All 3 |
| **4** | **No DataTable / Progress / Select / Label in UI** | Medium — duplicated Radix wrappers in Nucleo | Medium (promote Nucleo local components) | Nucleo primarily |
| **5** | **No page transition system** | Medium — jarring navigation, especially Nucleo/Campo | High (design + implement shared layout transitions) | All 3 |
| **6** | **No Skeleton/Shimmer loaders** | Medium — perceived latency, layout shift | Low (extend `ViewLoadingPlaceholder` with shimmer) | All 3 |
| **7** | **GSAP ScrollTrigger unused** | Low-Medium — missed storytelling (scroll-reveal, parallax) | Medium (add ScrollTrigger preset + demo components) | Tienda, Nucleo |
| **8** | **Icon set incomplete (24 → ~50 needed)** | Low — direct `lucide-react` imports bypass design system | Low (add to `packages/ui/src/icons/index.ts`) | All 3 |
| **9** | **Typography tokens unused (`editorial-*`)** | Low — inconsistent heading scales | Low (document + lint) | All 3 |
| **10** | **Animation tokens unused (`transition-elegant`, `fade-in-up`)** | Low — custom durations everywhere | Low (migrate to preset) | All 3 |

---

## 11. Recommended Action Plan

### Phase 1 — Quick Wins (1-2 weeks)
1. **Add missing tokens to components**: Replace hardcoded `#22c55e` etc. with `success`/`info`/`warning` in Nucleo/Campo
2. **Promote Nucleo local components to UI**: `Select`, `Label`, `Progress`, `SegmentControl`, `KpiCard`/`GlassCard`
3. **Extend icon set** to 50 icons; add lint rule banning direct `lucide-react` imports
4. **Add `DropdownMenu`, `Tabs`, `Tooltip`** to UI (Radix wrappers following `Dialog` pattern)
5. **Standardize glass**: Create `Glass` component in UI with variants (`default`, `strong`, `accent`); deprecate app-local versions

### Phase 2 — Systemic (3-4 weeks)
6. **Build `DataTable` shell** in UI (column defs, sorting, pagination, row selection, responsive scroll) — consume `EnjTableShell` pattern
7. **Implement `Skeleton` component** with shimmer (using `animation-shimmer` from preset)
8. **Create shared `PageTransition`** (GSAP + Next.js `layout.tsx` integration) for Tienda/Nucleo
9. **Add ScrollTrigger preset** + `ScrollReveal` / `Parallax` components for landing pages

### Phase 3 — Polish (ongoing)
10. **Migrate all apps to `editorial-*` typography tokens**; remove duplicate CSS font vars
11. **Audit focus-visible coverage** across all interactive elements
12. **Document component API** in Storybook (or MDX) for `@enjambre/ui`

---

## Appendix: File Inventory

### `@enjambre/ui` Components (`packages/ui/src/components/`)
```
button.tsx              card.tsx                badge.tsx
input.tsx               stat-card.tsx           spinner.tsx
hexagon-loader.tsx      view-loading.tsx        immersive-modal.tsx
overlay-fullscreen.tsx  empty-state.tsx         section-header.tsx
grain-overlay.tsx       toast.tsx               notification-bell.tsx
ThemeProvider.tsx       theme-toggle.tsx        theme-init-script.tsx
sidebar.tsx             module-hero.tsx         dialog.tsx
bento-grid.tsx          cinematic-card.tsx      predictive-pill.tsx
calendar.tsx            date-picker.tsx         QRCode.tsx
icons/index.ts          (24 Lucide exports)
```

### App-Local UI Components (Candidates for Promotion)

| App | Component | Location |
|-----|-----------|----------|
| Nucleo | `Select`, `Label`, `Progress` | `src/components/ui/` |
| Nucleo | `GlassCard`, `KpiCard`, `SegmentControl` | `src/components/ui/` |
| Nucleo | `EnjTableShell`, `ViewShell`, `ResponsiveTabBar` | `src/components/layout/` |
| Tienda | `TiendaModal`, `MobileBottomNav`, `MobileCartBar` | `components/shop/` |
| Tienda | `GrainOverlay` (already in UI), `CustomCursor` | `components/ui/`, `components/shop/` |
| Campo | `CampoShell`, `CampoBottomNav`, `CampoSidebar` | `components/layout/` |

---

*End of Audit*