# Dominios y dueños

> **Clase: VIVO.** Qué existe, quién lo posee, a qué spec apunta, qué está a medias.
> Glosario: [`GLOSSARY.md`](./GLOSSARY.md). Mapa técnico: [`REPO_MAP.md`](./REPO_MAP.md). Madurez: [`ESTADO_DEL_ARTE.md`](./ESTADO_DEL_ARTE.md).

## Flujo del néctar (dueño por etapa)

```
ORIGEN          Patio Núcleo (apicultor) + bitácora
                BITACORA_APICOLA · NUCLEO_CHILOE
                    ↓
TRANSFORMA      Lotes / hidromiel / infusiones / alambique / costeo
                COSTEO_ARQUITECTURA (spec; no todo persistido)
                    ↓
TRAZA           lote→colmena→lab · QR · ancla (a menudo cosmética)
                /producto/[slug]/trazabilidad · blockchain/anchors.ts
                    ↓
PRODUCTO        CMS + catálogo Tienda · editor en Núcleo
                COMERCIO_SOBERANO · shop-chrome · site_content
                    ↓
VENTA           Web: MONEY_PATH (Flow/Transbank)
                Feria: CAMPO_OFFLINE + CIERRES_CAJA_COMISIONES
                Reposición: replenishment / subscriptions
                    ↓
IMPACTO         árboles, CO2, IRR, ciclos guardian
                (coeficientes aún hardcodeados — ESTADO_DEL_ARTE)
                    ↓
CONTABILIDAD    DTE, F29, banco, gastos extranjeros
                SOBERANIA_FISCAL · BANCO_CHILE · SII_CERTIFICACION
```

Ninguna etapa “vive en las tres apps”. Si cruza, el **write caro** pasa por el BFF de Núcleo.

## Inventario de dominios

| Dominio | App que se ve | Código dueño | Spec | Estado honesto |
|---|---|---|---|---|
| Identidad / roles | 3 | `@enjambre/auth` | `ROLES_Y_ACCESO` | Vivo. Dos ejes (plataforma ≠ comercial). |
| Design system / iOS 15 | 3 | `@enjambre/ui` | `LEGACY_TIER` | Vivo. GSAP no entra al grafo server. |
| Catálogo + CMS | Tienda lee; Núcleo escribe | `shop-chrome`, `site_content`, `/api/cms` | `COMERCIO_SOBERANO` | Vivo + revalidate. Experiencias y talleres (`talleres`) conectados. |
| Checkout web | Tienda UI → Núcleo BFF | `checkout.ts`, `checkout-fulfill`, `@enjambre/pricing` | `MONEY_PATH` | Vivo. Descuentos (`/descuentos`) gestionables en Núcleo. |
| Suscripciones / club | Tienda + cron Núcleo | `replenishment`, `subscriptions-checkout` | `PLAN_COLOSAL` / Flow recurring | Club Legado del Bosque = cualquier usuario registrado (membresía universal única e irrepetible). Suscripciones de reposición y reservas de recolección futura creadas desde Núcleo. Cosecha desterrado (siempre recolección). |
| POS / feria | Campo | Dexie + `/api/rep-ventas` | `CAMPO_OFFLINE`, `CIERRES_CAJA` | Vivo. Idempotencia online frágil (auditoría). |
| Caja / comisiones | Núcleo + Campo | cash-sessions, commission-* | `CIERRES_CAJA` | Vivo. |
| Loyalty / wallet / canje | Tienda + Núcleo | `@enjambre/pricing`, `wallet`, `resenas`, `loyalty_rewards` | `WALLET_GUARDIAN` | Vivo. Catálogo de canje de sellos editable desde Núcleo (`/planes-suscripcion`). |
| Logística | Núcleo | `@enjambre/logistica` | — | Vivo básico. |
| Fiscal / SII | Núcleo | `@enjambre/fiscal`, `@enjambre/contable` | `SOBERANIA_FISCAL`, `SII_CERTIFICACION` | Fuerte en código; cert. prod es ops. |
| Banco Chile | Núcleo | `@enjambre/banco-chile` | `BANCO_CHILE` | Matching existe; web↔Flow aún hueco. |
| Costeo por frasco | Núcleo (parcial) | `costeo.ts` + spec | `COSTEO_ARQUITECTURA` | Spec adelante del schema. |
| Patio / bitácora | Núcleo | `bitacora.ts`, `apicultor/` | `BITACORA_APICOLA` | En construcción sobre patio, no Campo. |
| Censo Chiloé | Núcleo (+ público parcial) | `registro-territorial`, `censo-publico`, `mapa-publico` | `NUCLEO_CHILOE` | Datos hay; capa pública incompleta. |
| Hidromiel / infusiones / alambique | Núcleo | rutas homónimas | — | Dominios operativos internos. |
| IA | Solo Núcleo | `/api/ai/*` | `AI_NUCLEO` | Groq, scope por `user_id`, kill `AI_ENABLED`. |
| Ciencia / regeneración | Tienda + Núcleo | `ciencia`, fenología, percepción | `MICROCANALES_…`, `CUMPLIMIENTO_CHILE` | Metodología, biblioteca de floraciones y triangulación botánica centralizada en `/ciencia` (sin ruta `/impacto` en tienda); claims de salud en tienda = hueco 20.606. |
| Cumplimiento CL | Transversal | legales tienda + fiscal + territorial | `CUMPLIMIENTO_CHILE` | P0: 21.719 ops + copy alimentos. Hidromiel no es venta. |
| Red intercambio / B2B | Núcleo + Tienda | `b2b`, `enjambre` | `RED_INTERCAMBIO_LEGAL` | Spec + código parcial. |
| Seguridad eventos | 3 → BFF | `security-events` | `TRUST` | Vivo. |

## Hacia dónde apunta la construcción (horizonte, no checklist)

1. **Prueba de origen verificable** (tesis de `ESTADO_DEL_ARTE`): el cliente escanea y ve colmena real, no un hash cosmética.
2. **Un ledger de dinero**: web + feria + reposición + comisiones + DTE + banco cuadran sin Excel.
3. **Patio y feria no se mezclan** en una app: dos oficios, un Postgres.
4. **Soberanía fiscal nativa** (no facturador externo).
5. **$0 el mayor tiempo posible** sin mentir el ToS de Hobby.
6. **No un cuarto deploy.** Dominio nuevo = package o ruta en las 3.

Si abres un dominio que no está en esta tabla, agrégalo aquí **antes** de crear un package.
