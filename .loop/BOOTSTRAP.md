# Cómo arrancar / reanudar el loop — Oyz App (Enjambre Legado) v1.0

## Archivos

| Path | Rol | Git |
|------|-----|-----|
| `.loop/PROMPT.md` | Contrato + método + reglas cristalizadas + mapa oyz | versionar |
| `.loop/PLAYBOOK.md` | Tabla de patrones confirmados del monorepo | versionar |
| `.loop/RUN.md` | Prompt corto para el scheduler (lee PROMPT) | versionar |
| `.loop/BOOTSTRAP.md` | Este archivo | versionar |
| `.loop/MEMORY.md` | Memoria viva + evolución | versionar seed; muta cada tick |
| `.loop/CURSOR.json` | Índice de rotación de sectores | muta cada tick |
| `.loop/history/` | Evo archivadas tras cristalización | no crítico |
| `.loop/state/` | Artefactos locales de pasada | no |

## Identidad del loop

**Loophole quirúrgico auto-mejorable** orientado a **producción real** del ecosistema Oyz:

absorbe contexto → hipótesis falsable → repara mecanismo + entrelazados hop1–2 → redirige a estado mejor → acrece memoria.

Cada compuesto (dirección, sectores, método, greps, playbook, unificar UI editorial) se auto-mejora con evidencia; **los guardrieles no se relajan**.

**Producto:** Enjambre Legado — SO de regeneración biocultural (Chiloé · abeja virgen · miel premium).  
**No es** un e-commerce genérico ni un Shopify clone: es **comercio soberano** + feria/POS + fiscal SII + contable chileno + traza néctar.

## Scheduler (reactivación)

- Prompt del task = `RUN.md` / contrato `PROMPT.md` **v1.0**.
- Intervalo sugerido: **60s–5m** = solo reactivación tras terminar; **trabajo de pasada = ilimitado** si es productivo.
- Un sector + grafo del hallazgo; compuestos auto-mejorables; **guardrieles fijos**.
- Densidad profesional, horizonte largo, sin teatro.

## Primera pasada manual

```bash
cd "/Users/macbook/Desktop/oyz app"
# Leer PROMPT + MEMORY + CURSOR + PLAYBOOK
# git log -8 --oneline && git status -sb
# Ejecutar sector de CURSOR (no mezclar WIP ajeno en el commit del loop)
```

Docs ancla si el sector lo exige:

- `AGENTS.md`, `system_invariants.md`, `docs/CONSTITUTION.md`
- `docs/ARCHITECTURE.md`, `docs/TECHNICAL_DEBT.md`, `docs/AGENT_INSTRUCTIONS.md`
- `packages/database/supabase/migrations/` (últimas 85–94+)

## Criterio de salud del loop

- `streak_clean` alto + MEMORY sin backlog **alta** → bajar agresividad; solo S-class en checkout / BFF / RLS / fiscal.
- 2+ fixes misma clase en 10 pasadas → cristalizar regla en PROMPT (en `deep-followup`).
- Fix revertido por humano → anti-patrón inmediato en MEMORY.
- WIP ajeno en `git status` → **no** mezclar en el commit del loop (cirugía en archivos del cono).

## Producto (no confundir con Trama / Ciclo Vivo)

| Oyz | No es |
|-----|--------|
| Tienda + Núcleo BFF + Campo POS | Research field tool (Trama) |
| Transbank / Flow / SumUp / CAF-SII | Compost/Minga/Flow genérico (Ciclo) |
| Roles `admin` · `cliente` · `creador` · `rep_ventas` | Multi-org fundador/productor |
| Flujo del néctar: campo → lotes → traza → venta → impacto → contable | Mind-map teórico |
