# RUN — invocación por tick (v1.2 · Oyz App · go-live)

Repo: `/Users/macbook/Desktop/oyz app`  
Identidad: **Enjambre Legado** (oyz) — monorepo `apps/{tienda,nucleo,campo}` + `packages/*`

Ejecuta **ahora** `.loop/PROMPT.md` **v1.2** (validación SII / SumUp / Banco Chile / pagos + guardrieles + 5 leyes).  
Relee `MEMORY` (Doctrina v1.2 + Backlog go-live + Evolución) + `CURSOR` + `PLAYBOOK`.  
Contrasta: `docs/SOBERANIA_FISCAL.md`, `docs/BANCO_CHILE.md`, `docs/ENV-CHECKLIST.md`, `packages/{fiscal,sumup,banco-chile}`, routes nucleo `sii|sumup|banco-chile`.

## Cadencia

- Reactivación ~60s–5m entre fires; **investigación de la pasada = ilimitada** si es productiva.
- Cono: un sector de validación + grafo del hallazgo. Densidad > alarde.

## Prioridad (fase v1.2)

1. **V** — Validación go-live (env, credenciales, ambiente sandbox|prod, checklist, smoke path)
2. **R** — Runtime de integración (emit DTE, webhook, sync movimientos, terminal SumUp, idempotencia)
3. **S** — Fail-closed en el cono (CAF, secrets, firma webhook, no mock en production)
4. **E** — Entrelazado venta↔fiscal↔banco solo si bloquea go-live
5. **U** — UI de config/operación (**config-en-UI**: lo esencial se configura en la app, no solo env)
6. **O** — Perf solo si duele en el cono

## Guardrieles (rápido)

Fail-closed · no quitar authz/RLS/CAF · no mock pago/fiscal en production · `getUser` no `getSession` en gates · service_role solo server · cirugía · evidencia · no spawnear loops · no mezclar WIP ajeno · no reabrir sec 1–6 sin regresión.

## Loophole

Absorber → hipótesis → micro V/R/S → entrelazados → colapsar → redirigir → acrecer MEMORY.  
Compuestos auto-mejorables; **guardrieles no**.

## Cierre

Rotar CURSOR; MEMORY (backlog go-live ✓/gap, evo con `Compuesto:`).  
Commit (+ push main solo con evidencia).  
Salida = formato PROMPT. No menciones el scheduler.
