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

## Componentes (15)

| Componente | Variantes / Notas |
|---|---|
| `Button` | primary, gold, outline, ghost, destructive · sm, md, lg |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | default, dark, glass, accent, elevated |
| `Badge` | default, success, warning, danger, gold, info |
| `Input`, `Textarea` | - |
| `StatCard` | Metrica con valor + label |
| `Spinner` | sm, md, lg |
| `EmptyState` | Estado vacio con icono + texto |
| `SectionHeader` | Titulo de seccion |
| `GrainOverlay` | Overlay de textura granulada |
| `ModuleHero` | Hero de modulo con titulo + descripcion |
| `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription` | Radix UI Dialog |
| `SidebarSection`, `SidebarNavItem`, `SidebarBadgeIndicator`, `registerSidebarIcons` | Sidebar con iconos + badge indicators |
| `ThemeProvider`, `useThemeContext` | light/dark/system |
| `ThemeToggle` | Toggle de tema |
| `ToastProvider`, `useToast` | default, success, warning, error |

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

## Tokens

4 brand hex: `bosqueUlmo` (#0A3D2F), `oroMiel` (#D4A017), `cremaNatural` (#FDFBF7), `negroTinta` (#1a1a1a)

7 HSL tokens + CSS custom properties completas con dark/light mode en `tokens.css`.

## Convenciones

- Named exports only
- Sin `any`
- Props con `interface ComponentProps`
- Sin comentarios a menos que expliquen el "porque"
