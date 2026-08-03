## Visión
Centralizar el Oráculo Fenológico (GDD) como **widget** dentro de una lista ampliable de widgets, y evolucionar el **Inicio** (icono `network` en el sidebar, no "home") con distinción admin / territorial enfocada en apicultores residentes. Apps: `apps/nucleo` + `packages/auth` (redirects/guards) + 1 migración.

## FASE 1 — Sistema de widgets + Oráculo centralizado

### 1.1 Infraestructura de widgets (nueva)
- `src/components/widgets/types.ts`: `WidgetDef { key, titulo, descripcion, Componente, contextos: WidgetContexto[] }` con `type WidgetContexto = 'apicultor' | 'inicio-admin' | 'inicio-territorial'`.
- `src/components/widgets/registry.ts`: `WIDGETS: WidgetDef[]` (registro central ampliable) + `widgetsPara(contexto)`.
- `src/components/widgets/WidgetRail.tsx`: renderiza los widgets de un contexto (filosofía self-fetching, como los widgets actuales).

### 1.2 Migrar widgets existentes al registro
- `OraculoFloracion.tsx` → `src/components/widgets/oraculo-fenologico/WidgetOraculoFenologico.tsx`: **eliminar fallback hardcodeado** (`FALLBACK_ESPECIES` con umbrales falsos) → empty state con enlace a `/fenologia`.
- Mover `VentanasDeVuelo.tsx` y `EspectroVivo.tsx` → `src/components/widgets/<modulo>/` sin cambios de lógica.
- Extraer tarjetas inline de `ApicultorView` ("Voz de la Colmena", "Última Reflexión") como widgets registrados.
- `ApicultorView.tsx:318-351`: columna derecha → `<WidgetRail contexto="apicultor" />`. El oráculo sigue visible en colmenas, ahora centralizado.

### 1.3 Expandibilidad del oráculo
- Migración `20260803000000_fenologia_estaciones.sql`: tabla `estaciones_fenologicas` (nombre, lat, lng, activo) con RLS + seed Pureo (-41.86, -73.82); `DROP COLUMN apiario_id` en `observaciones_floracion`. Regenerar `database.types.ts`.
- `src/api/lib/fenologia.ts`: helper `agruparEspeciesPorTbase()` (1 llamada Open-Meteo por Tbase distinta).
- `src/api/routes/fenologia.ts`: `GET/POST /estaciones`, `PATCH /estaciones/:id`; `GET /pronostico?estacion=<uuid>` usa coordenadas + Tbase por especie, `meta.estacion`.
- `FenologiaView.tsx`: selector de estación en tab Pronóstico; título "Oráculo Fenológico". Sidebar: label → "Oráculo Fenológico".

### 1.4 Tests
- `src/api/lib/fenologia.test.ts` (vitest): `gddDiario`, `agruparEspeciesPorTbase`, `proyectarFloracion`.
- `src/components/widgets/registry.test.ts`: keys únicas, componentes válidos, contextos.

## FASE 2 — Inicio role-aware (profundizar, tras Fase 1)

### 2.1 Home con distinción admin/territorial
- Nueva página `app/(dashboard)/inicio/page.tsx` → `HomeView`:
  - **admin**: renderiza `DashboardEjecutivo` (el panel ejecutivo pasa a ser el Inicio).
  - **territorial**: nueva `InicioTerritorialView` — bienvenida + **métricas personales** (apiarios registrados, total colmenas desde `apiarios_registro`, nivel de acreditación, alertas fitosanitarias en radio vía RPC `alertas_en_radio`, observaciones fenológicas propias) + `<WidgetRail contexto="inicio-territorial" />` (incluye el **Oráculo Fenológico**) + CTAs a `/territorio` y `/registro-territorial`.
- Nuevo endpoint `GET /api/registro-territorial/resumen` (agrega métricas personales del actor).
- `/ejecutivo` → `redirect('/inicio')`; "Alma del Enjambre" sale del toggle interno y pasa a su propia vista elegante `/alma` (no es home).

### 2.2 Sidebar y accesos
- `sidebar-config.ts`: ítem `ejecutivo` → `{ key: 'inicio', label: 'Inicio', icon: 'network', href: '/inicio' }` (greeting/mission del ejecutivo se conservan); nuevo ítem `alma` "Alma del Enjambre" en VISIÓN; `ROLE_VISIBLE_KEYS.territorial = ['inicio','territorio','fenologia']`; actualizar `VIEW_SHELL_PATHS`, `BOTTOM_NAV_KEYS`, `PREFETCH_PRIORITY_KEYS`.
- `packages/auth/src/role-redirect.ts`: `ROUTE_ROLE_GUARDS['/inicio'] = ['admin','territorial']`, `['/fenologia'] = ['admin','territorial']`, `['/alma'] = ['admin']`; `NUCLEO_ROLE_REDIRECT_MAP`: admin y territorial → `/inicio`.
- Actualizar tests de auth/redirect (`apps/nucleo/src/__tests__/auth-integration.test.ts` + tests de `packages/auth`).

## Verificación (por fase)
1. `pnpm --filter @enjambre/nucleo test` (vitest).
2. `pnpm --filter @enjambre/nucleo build` (incluye compat-audit).
3. Consistencia `database.types.ts`; grep final sin referencias rotas a `OraculoFloracion` como home.

## Fuera de alcance (la arquitectura lo permite)
- Colmenas/cuaderno/trazabilidad para territorial (decisión de producto posterior).
- Widgets cross-app (requerirían packages/ui como host + inyección de datos).
- Job diario de `alertas_floracion` por estación.