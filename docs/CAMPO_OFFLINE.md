# Campo offline-first

> **Clase: VIVO.** Única verdad sobre persistencia local del POS.
> Si lees “offline no implementado”, “offline cancelado” o “usa `@enjambre/offline`” en otro doc, **ese doc está mal.** Mapa: [`REPO_MAP.md`](./REPO_MAP.md).

## Qué es

Campo (`apps/campo`, rol `rep_ventas` / admin en feria) escribe y lee **primero en el dispositivo**. Supabase/Núcleo son el drenaje cuando hay red. Eso ahorra egress (5 GB Free) y permite vender en bosque o feria sin señal.

El patio apícola (`apicultor`, bitácora, colmenas) **no** es Campo. Vive en Núcleo. Spec: [`BITACORA_APICOLA.md`](./BITACORA_APICOLA.md).

## Qué no es

| Fantasma | Hecho |
|---|---|
| Package `@enjambre/offline` | **No existe.** No lo crees para “alinear docs”. Extrae desde Campo solo si un segundo consumidor (p. ej. bitácora Núcleo) lo necesita de verdad. |
| “Campo pega a Supabase desde el JSX” | Prohibido. `AGENTS.md` + Constitución § II.4. |
| “Offline cancelado / no requerido” | Mentira de `MASTER_PLAN` junio 2026. `TECHNICAL_DEBT` D7 ya lo desmintió. |
| Offline de **costeo** (ingredientes, recetas, lotes) | Eso es backlog de [`COSTEO_ARQUITECTURA.md`](./COSTEO_ARQUITECTURA.md) Fase 6. Distinto del POS. No confundir. |

## Dónde está el código

| Pieza | Ruta | Oficio |
|---|---|---|
| Schema Dexie | `apps/campo/src/lib/offline/db.ts` | `productos`, `sync_queue`, `feria_context`, metadata |
| Encolar | `apps/campo/src/components/pos/cash-context.tsx` | Quick sale / carrito → cola si offline o como fallback |
| Motor | `apps/campo/src/hooks/use-sync-engine.ts` | Replay FIFO, backoff, POST al BFF |
| Feria | `apps/campo/src/…/feria-context.tsx` (y vecinos) | Consignación local; no pisar con snapshot stale |
| Sync schema SQL | `packages/database/supabase/migrations/80_campo_offline_sync.sql` | Contrato server del replay |

Clientes Supabase: solo re-exports de `@enjambre/auth`. Cero `createClient` ad-hoc. Cero service_role en el bundle de Campo.

## Flujo

```
UI POS
  → cash-context (valida consignación / stock local)
  → Dexie (productos, feria_context, sync_queue)
  → use-sync-engine (red)
       → POST {NUCLEO}/api/rep-ventas/…  (idempotencia por client_request_id)
       → RLS + decremento stock en Postgres
```

Camino online directo **también** debe llevar `client_request_id` estable (no un UUID nuevo en cada retry). Hallazgo vivo: [`AUDITORIA_PROFUNDA_2026-08.md`](./AUDITORIA_PROFUNDA_2026-08.md) C-9 / A-6 — verificar en código antes de “darlo por cerrado”.

## Reglas

1. Toda escritura de venta/caja/feria pasa por Dexie o por el hook de sync. Nunca `supabase.from('ventas').insert` en un componente.
2. El snapshot de feria del server **no** pisa decrementos locales pendientes.
3. Un segundo mount de `useSyncEngine` no debe drenar la misma cola en paralelo (un provider).
4. Extraer a package solo con un segundo consumidor real y tests de replay. Hasta entonces el código vive en Campo.

## Relación con Hobby/Free

Dexie es la válvula de egress y de CPU RLS: el POS no lista `ventas` remotas en cada toque. Constitución § II.6 y Ley VI. No reemplazar esto por “Realtime en el catálogo del POS”.
