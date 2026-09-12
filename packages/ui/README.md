# @enjambre/ui

Design system compartido para el ecosistema Enjambre Legado. 3 subpaths de export.

## Instalacion

```bash
pnpm add @enjambre/ui
```

## Subpaths

| Subpath | Uso |
|---|---|
| `@enjambre/ui` | Componentes, hooks, lib, icons |
| `@enjambre/ui/tokens.css` | CSS custom properties (importar en globals.css) |
| `@enjambre/ui/tailwind-preset` | Tailwind preset con colores semanticos, tipografia editorial, animaciones |

## Componentes (52)

El design system cuenta con 52 componentes modulares en `src/components/`, cubriendo layout, data-display, interacción y compatibilidad:

| Categoría | Componentes |
|---|---|
| **Acciones y Formularios** | `Button`, `Input`, `Textarea`, `Select`, `Switch`, `Label`, `MoneyInput`, `DatePicker` |
| **Superficie y Layout** | `Card` (y subcomponentes), `CinematicCard`, `GlassPanel`, `BentoGrid`, `GrainOverlay`, `ViewShell`, `EnjTableShell`, `SectionHeader`, `ModuleHero` |
| **Datos y Métricas** | `DataTable`, `Badge`, `TierBadge`, `StatCard`, `ImpactStatCard`, `AchievementCard`, `QRCode` |
| **Feedback y Carga** | `HexagonLoader`, `ViewLoading`, `Spinner`, `EmptyState`, `Progress`, `ProgressRing`, `Skeleton`, `PredictivePill`, `ToastProvider` / `useToast` |
| **Overlays y Diálogos** | `Dialog` (Radix), `DropdownMenu` (Radix), `Tooltip` (Radix), `ImmersiveModal`, `OverlayFullscreen`, `PanelFocusToggle` |
| **Navegación y Shell** | `Sidebar` (y subcomponentes), `Tabs`, `Calendar`, `NotificationBell`, `NavigationProgressBar` |
| **Tema y Plataforma** | `ThemeProvider`, `ThemeToggle`, `ThemeInitScript`, `VercelInsights`, `RegisterServiceWorker` |
| **Capa de Compatibilidad (iOS 15)** | `LegacyBrowserPolyfills`, `LegacyDeviceDetect`, `ErrorRevealHarness` |

## Hooks (3)

| Hook | Descripcion |
|---|---|
| `useTheme` | Retorna tema actual (`light`/`dark`/`system`) + setter |
| `toast` | Wrapper de sonner para notificaciones |
| `useToast` | Context hook para toast desde componentes |

## Icons (24)

Re-exports de Lucide: `ChevronDownIcon`, `ChevronUpIcon`, `ChevronRightIcon`, `ChevronLeftIcon`, `ArrowRightIcon`, `ArrowLeftIcon`, `ArrowUpIcon`, `ArrowDownIcon`, `SearchIcon`, `PlusIcon`, `MinusIcon`, `XIcon`, `CheckIcon`, `CircleIcon`, `Loader2Icon`, `ExternalLinkIcon`, `LinkIcon`, `CopyIcon`, `PanelLeftIcon`, `GripVerticalIcon`, `ImageIcon`, `AlertCircleIcon`, `InfoIcon`, `CheckCircleIcon`, `XCircleIcon`

## Lib Utilities (4)

| Utilidad | Descripcion |
|---|---|
| `cn(...inputs)` | clsx + tailwind-merge para clases condicionales |
| `formatDate`, `formatDateShort`, `formatCLP`, `fmtCLP` | Formateo de fechas y moneda CLP |
| `friendlySupabaseError`, `friendlyApiError`, `friendlyError` | Mensajes de error amigables |
| `splitCsvLine` | Parser de lineas CSV |

## Tailwind Preset

```js
// tailwind.config.js
const { enjambrePreset } = require('@enjambre/ui/tailwind-preset')

module.exports = {
  ...enjambrePreset,
  // o con overrides:
  presets: [enjambrePreset],
}
```

Colores semanticos: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning`, `info`, `border`, `input`, `ring`, `surface`, `chart`, `sidebar`, `bosque`, `miel`, `crema`

Font families: `font-display` (Cormorant Garamond), `font-sans` (Inter), `font-mono` (JetBrains Mono)

## Loading

| Componente | Cuándo usar |
|---|---|
| **`HexagonLoader`** | Inline (botones, celdas, badges). Tamaños vía `data-size` + `tokens.css` (`sm` 1.75rem, `md` 2.5rem, `lg` 3.25rem). No forzar `h-* w-*` cuadrado. |
| **`ViewLoading`** | Bloques de vista, `loading.tsx`, Suspense, overlays de refetch. Variante `view` incluye `min-h-[12rem]` para evitar CLS. |
| **`ViewLoadingPlaceholder`** | Reserva altura sin hexágono — tras `dynamic()` o `loading.tsx` (evita doble loader). |
| **`useClientViewLoading`** | Hook que retrasa loader cliente ~80ms tras cambio de ruta. |
| **`Spinner`** | Compat legacy en núcleo; renderiza hexágono por defecto. |

**Spinner circular (`variant="circular"`):** implementación conservada en `spinner.tsx` pero **desactivada temporalmente** — el ecosistema unifica en el hexágono para evitar dos loaders distintos en pantalla. Para rehabilitar el circular, pasar `variant="circular"` explícitamente (solo rollback / A-B).

Animaciones en `tokens.css`: trazo perimetral (`enj-hex-loader-stroke`) + relleno ascendente con clip (`enj-hex-loader-fill-rect`).

**Tailwind en apps del monorepo:** cada `tailwind.config` debe incluir `...enjambreUiContent` del preset para generar clases de layout de `ViewLoading` y demás UI compartida. Los tamaños del hexágono viven en CSS y no dependen del purge.

## Overlays y modales

Estrategia unificada en `src/lib/overlay-layer.ts` (tokens internos):

| Componente | Cuándo usar | A11y / seguridad |
|---|---|---|
| **`Dialog`** (Radix) | Formularios rápidos con trigger (ej. confirmar stock). | Focus trap Radix, fondo inert, `aria-*` automático. |
| **`ImmersiveModal`** | Módulos admin con aside/footer o layouts complejos. | Focus trap manual, `aria-labelledby`, scroll lock. |
| **`OverlayFullscreen`** | Herramientas admin edge-to-edge (ej. editor CMS + iframe). | Mismo backdrop; **no** cierra con clic en fondo por defecto. |
| **`TiendaModal`** (solo tienda) | Sheet móvil + panel retail (galería, reseñas). | Portal + `useOverlayLock` + `useModalFocusTrap`; `aria-labelledby`. |

**Backdrop compartido:** `bg-background/72 backdrop-blur-md` · **z-index modal:** `220` (panel `221`). Toasts en `9999` quedan encima.

No usar `z-50` ni opacidades distintas en modales nuevos — importar tokens o reutilizar estos componentes.

## Tokens

4 brand hex: `bosqueUlmo` (#0A3D2F), `oroMiel` (#D4A017), `cremaNatural` (#FDFBF7), `negroTinta` (#1a1a1a)

7 HSL tokens + CSS custom properties completas con dark/light mode en `tokens.css`.

## Convenciones

- Named exports only
- Sin `any`
- Props con `interface ComponentProps`
- Sin comentarios a menos que expliquen el "porque"
