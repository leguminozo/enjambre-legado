# Plan: Pulido de performance multi-dispositivo para `apps/nucleo`

Lote **high-impact / low-risk**: 4 bloques de pulido sobre código existente (sin reescrituras arquitectónicas) + 1 pulido menor de middleware ligado. Verificación con `pnpm --filter @enjambre/nucleo build` después de **cada bloque** (decisión confirmada por el usuario). Corrección del bug `getSession()→getUser()` integrada en el bloque 2.

---

## Bloque 1 — Ampliar `experimental.optimizePackageImports`

**Por qué:** hoy solo 3 packages. `@enjambre/ui` (85 archivos importan del barrel), `recharts` (~400KB barrel, 7 vistas), `@react-three/drei` (milexports, chunk 3D), `date-fns` y `react-leaflet` son barrels pesados consumidos en la app. Tree-shaking per-component al añadir strings.

**Cambio:** `apps/nucleo/next.config.ts:87`

```ts
experimental: {
  optimizePackageImports: [
    "lucide-react", "framer-motion", "@tanstack/react-query",
    "@enjambre/ui", "recharts", "date-fns",
    "@react-three/drei", "react-leaflet",
  ],
},
```

**Verificación:** `pnpm --filter @enjambre/nucleo build`.

---

## Bloque 2 — Migrar `DashboardBancoChile` a `useQuery` + corregir `getSession()→getUser()`

**Por qué:** `useState`×5 + `useEffect` con `setInterval(fetchDashboard, 5*60*1000)` reimplementa exactamente `useQuery({ refetchInterval: 300_000 })`. Además **línea 54 usa `supabase.auth.getSession()`** (prohibido por AGENTS.md, debe validar firma JWT con `getUser()`) y línea 145 (en `autoConciliar`) repite el mismo `getSession()`. Hereda cache/dedupe del `PersistQueryClientProvider` ya montado.

**Cambios en `apps/nucleo/src/views/banco-chile/DashboardBancoChile.tsx`:**

1. Reemplazar los 5 `useState` (resumen, cuentas, movimientos, loading, sugerenciasConciliacion) por:
   ```ts
   const {
     data, isPending: loading, refetch,
   } = useQuery({
     queryKey: ['banco-chile', 'dashboard'],
     queryFn: fetchDashboardData,
     refetchInterval: 5 * 60 * 1000,
   });
   ```
2. En `fetchDashboard` interno:
   - Línea 54: `const { data: { session } } = await supabase.auth.getSession();` →
     `const { data: { session } } = await supabase.auth.getSession();` NO, lo correcto es **`const { data: { user } } = await supabase.auth.getUser();`** y obtener el token via `(await supabase.auth.getSession()).data.session?.access_token` sólo cuando se necesite el access_token para el header del BFF. Patrones del repo: otros fetch al BFF usan `useApiFetch` (Bearer automático). Aquí se usa `fetch` directo con `Authorization: Bearer ${session?.access_token}` → migrar a `useApiFetch` para que el Bearer lo inyecte el hook estandarizado (elimina la dependencia de `getSession()` y alinea con `use-cms-content.ts` patrón canónico).
   - Actualmente `fetchDashboard()` es *ad-hoc* con setResumen/setCuentas/setMovimientos. Convertir `fetchDashboardData` en una función pura que **retorne** `{ resumen, cuentas, movimientos, sugerenciasConciliacion }` (sin `setState`).
3. En `autoConciliar` (línea 141-166):
   - Sustituir `const { data: { session } } = await supabase.auth.getSession();` por `useApiFetch` mutation (o `fetch` con `useApiFetch` wrapper) y tras éxito llamar `refetch()` (en vez de `fetchDashboard()` directo).
4. Preferencia: si `useApiFetch` es componible para las 5 queries del `fetchDashboardData`, dividir en 2-3 `useQuery` independientes con `Promise.all` en `fetchDashboardData` para paralelismo (cuentas/movs/counts/documentos/sugerencias son independientes). Si complica, mantener como una query única — primar minimal forward del bloque.

**Salida del bloque:** el componente lee `data.resumen`, `data.cuentas`, `data.movs`, `data.sugerencias`; sin `useState`/`useEffect`/`setInterval`; sin `getSession()`. Usuarios: dashboard ejecutivo Banco Chile, conciliaciones.

**Verificación:** `pnpm --filter @enjambre/nucleo build` + revisión rápida de routes que importen el dashboard.

---

## Bloque 3 — Eliminar FOUC móvil/tablet: device detection server-side

**Por qué:** `useShellLayout` arranca en `'mobile'` siempre (comentario explícito línea 17 sobre evitar bottom-nav ausente en teléfonos) y rectifica tras hidratar → en desktop/tablet hay un flash inicial del shell incorrecto (sidebar absent / bottom-nav visible brevemente antes de corregirse). Multi-dispositivo = justamente donde más se nota.

**Cambios:**

1. `apps/nucleo/app/(dashboard)/layout.tsx` (server, ya `force-dynamic`): detectar UA vía `headers()` de `next/headers` y resolver `initialMode` con la misma lógica que `useShellLayout` (mobile <768, tablet <1024, desktop). Pasarlo como prop inicial al cliente:
   ```tsx
   import { headers } from 'next/headers';
   function resolveInitialMode(ua: string): ShellLayoutMode { ... }
   export default async function DashboardLayout({ children }) {
     const ua = (await headers()).get('user-agent') ?? '';
     return <DashboardLayoutClient initialMode={resolveInitialMode(ua)}>{children}</DashboardLayoutClient>;
   }
   ```
2. `apps/nucleo/app/(dashboard)/dashboard-layout-client.tsx`:
   - Aceptar `{ children, initialMode }: { children; initialMode: ShellLayoutMode }`.
   - `useShellLayout(initialMode)` en vez de `useShellLayout()`.
3. `apps/nucleo/src/hooks/use-shell-layout.ts`:
   - `useShellLayout(initialMode: ShellLayoutMode = 'mobile')` y `useState(initialMode)`. Mantener el default `'mobile'` para no romper otros consumidores si los hay (verificar grep antes — reporte indica uso único en `dashboard-layout-client`).

**Nota técnica:** UA-based detection es heurística (tablets reportedán ua móvil en algunos casos). Aceptable: el primer paint errará hacia mobile en esos casos y se rectifica en <16ms con el efecto de resize — lo mismo que hoy, pero desktop/tablet reales ya nunca se ven antes el shell móvil. Net win sin downside nuevo.

**Verificación:** `pnpm --filter @enjambre/nucleo build`. Smoke test mental: en desktop no debe aparecer la bottom-nav ni el rail-tablet en el primer paint.

---

## Bloque 4 — `dynamic()` para `Sidebar` y `MobileNavSheet`

**Por qué:** `dashboard-layout-client.tsx:6-9` importa estáticamente `Sidebar`, `SidebarRail`, `LiquidBottomNav`, `MobileNavSheet`. En móvil NO se necesita `Sidebar` (desktop-only), y `MobileNavSheet` (drawer) solo cuando se abre. Reduce bundle JS del shell en móvil/tablet.

**Cambios en `apps/nucleo/app/(dashboard)/dashboard-layout-client.tsx`:**

1. Mover import estático de `MobileNavSheet` a `dynamic(() => import('@/components/layout/MobileNavSheet'), { ssr: false, loading: null })` — solo se carga cuando `navSheetOpen` se vuelve `true` (equivale a lazy-on-open).
2. Para `Sidebar` mantener import estático: ya que `dynamic({ssr:true})` aporta poco para Sidebar (componente sí quiere SSR en desktop para evitar flash del sidebar). En cambio **condicionar el chunk**: el bundle ya lo excluye parcialmente vía árbol de render (`shellMode === 'desktop' && !isDesktopCollapsed`), pero el import estático lo deja SIEMPRE en el chunk del cliente. Decisión: dado que `Sidebar` quiere SSR (no `ssr:false`), el coste de migrar a `dynamic({ssr:true})` es marginal y complicaría el componente. **Mantengo `Sidebar` estático**, sólo hago `MobileNavSheet` dinámico (chunk lazy al abrir). Pulido conservador dentro del lote low-risk.

**Salida:** `MobileNavSheet` (drawer con su lógica heavy) sale del bundle base del shell. Sidebar/Rail/BottomNav siguen SSR (sin coste de FOUC del drawer).

**Verificación:** `pnpm --filter @enjambre/nucleo build`.

---

## Bloque 5 (pulido menor ligado) — `/lote/[id]` en rutas públicas del middleware

**Por qué:** `middleware.ts:16` solo declara `["/", "/login", ...e2ePublic]` como públicas. La ruta `app/lote/[id]/page.tsx` (mapa público `PublicMap`, ssr:false) — pensada para compartir/producto público — pasa por `createAuthMiddleware` innecesariamente y puede redirigir a login a visitantes no autenticados. Confirmado en el exploratorio: no está en `publicRoutes`.

**Cambio en `apps/nucleo/middleware.ts:16`:**
```ts
publicRoutes: ["/", "/login", "/lote", ...e2ePublicRoutes],
```
(Next.js hace matching por prefijo para `/lote/[id]` con `/lote`.)

**Verificación:** `pnpm --filter @enjambre/nucleo build`. Confirmar que `createAuthMiddleware` soporta el prefijo del parámetro dinámico (revisar `packages/auth/.../middleware.ts` antes de tocarlo — si no soporta `:param` o `[id]`, añadir patrón explícito `/lote/:id` o el matcher del middleware usado).

**Pre-condición**: revisar la implementación de `createAuthMiddleware` para confirmar la sintaxis de `publicRoutes` (string prefijo vs regex/glob). Si el middleware internamente usa `pathname.startsWith(route)`, `/lote` alcanza; si usa match exacto, ajustar. Esto se valida antes de editar.

---

## Orden de ejecución y verificación

| Orden | Bloque | Archivos tocados |
|---|---|---|
| 1 | optimizePackageImports | `next.config.ts` |
| 2 | Bloque 1 build ✓ | — |
| 3 | DashboardBancoChile → useQuery + getUser | `src/views/banco-chile/DashboardBancoChile.tsx` |
| 4 | Bloque 2 build ✓ | — |
| 5 | Device detection server-side | `app/(dashboard)/layout.tsx`, `app/(dashboard)/dashboard-layout-client.tsx`, `src/hooks/use-shell-layout.ts` |
| 6 | Bloque 3 build ✓ | — |
| 7 | dynamic(MobileNavSheet) | `app/(dashboard)/dashboard-layout-client.tsx` |
| 8 | Bloque 4 build ✓ | — |
| 9 | /lote en publicRoutes (tras revisar createAuthMiddleware) | `middleware.ts` |
| 10 | Build final ✓ | — |

## Reglas invariantes
- Named exports, TypeScript strict, sin `any` (`unknown` + type guards), sin hex en componentes (tokens semánticos), sin `getSession()` para auth — usar `getUser()` (AGENTS.md).
- Trabajo en branch actual (`main`) — no commit/push salvo que el usuario pida (política harness).
- Cada cambio **mínimo y verificable** (Surgery Protocol). Se reporta fielmente el resultado del build (incluyendo failures si los hay).