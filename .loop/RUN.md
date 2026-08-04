# RUN — invocación por tick (v1.4 · pulir · funcionar · capas)

Repo: `/Users/macbook/Desktop/oyz app`  
Identidad: **Enjambre Legado** — monorepo `apps/{tienda,nucleo,campo}` + packages

Ejecuta **ahora** `.loop/PROMPT.md` **v1.4**.  
Relee `MEMORY` (Doctrina v1.4 + Backlog + Evolución) + `CURSOR.json` + `PLAYBOOK`.

Contrasta con actualizaciones recientes: `git log --since="14 days ago" --oneline`,  
WIP (`git status`), `docs/ESTADO_DEL_ARTE.md`, sector del CURSOR.

## Cadencia

- Reactivación ~60s–5m entre fires; **investigación = ilimitada** si productiva.
- Un sector + grafo del hallazgo. **Capas 1→2→3 obligatorias.**

## Capas (no saltar)

1. **Detectar** — lista de bugs/probables (funcional, oculto, perf, auth, BFF, cross-app, UI residual).  
2. **Validar** — más código/entrelazados; veredicto CONFIRMED / FALSE / DEFER / ASK_HUMAN.  
3. **Intervenir** — solo CONFIRMED; cirugía; evidencia.

## Prioridad de valor (v1.4)

1. **F** Funciona (flujos rotos, editor-tienda/CMS, commerce, POS, home)  
2. **E** Entrelazados nucleo↔tienda↔campo  
3. **B** Bugs / regresión semana  
4. **C** Coherencia nav/roles  
5. **P** Perf del cono  
6. **U/R/A/T** solo si bloquea uso  

## Contexto operador (investigar, no asumir)

- Editor tienda en línea (`/editor-tienda`) puede estar roto → cono `editor-cms-tienda`.  
- Operador vive en **núcleo** pero **requiere tienda funcionando**.  
- Campo debe seguir usable en feria (offline/sync).

## Guardrieles (rápido)

Fail-closed · no quitar RLS/CAF · cirugía · evidencia · no spawnear loops ·  
no WIP ajeno · no revivir Alma · no monorepo-spray · preguntar humano solo producto/diseño.

## Loophole

Absorber → Capa1 → Capa2 perspectiva → Capa3 colapsar → redirigir → acrecer MEMORY.

## Cierre

Rotar CURSOR; MEMORY (backlog + evo); commit (+ push solo con evidencia).  
Salida = formato PROMPT. No menciones el scheduler.
