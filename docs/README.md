# Documentación — Enjambre Legado

> Índice canónico. Si dos documentos se contradicen, **no improvises**: aplica la jerarquía de abajo y trata el perdedor como foto vieja.
> Censo de agosto 2026. El mapa vivo del código está en [`REPO_MAP.md`](./REPO_MAP.md).

## Cómo leer (humano o agente)

| Tiempo | Lee | Para |
|---|---|---|
| 3 min | Este archivo + [`REPO_MAP.md`](./REPO_MAP.md) + [`GLOSSARY.md`](./GLOSSARY.md) | Orientarte. Palabras que no se mezclan. |
| 10 min | [`CONSTITUTION.md`](./CONSTITUTION.md) § I–II + [`../system_invariants.md`](../system_invariants.md) | Operar sin romper el producto. |
| 15 min | [`DOMAINS.md`](./DOMAINS.md) + [`CROSS_APP.md`](./CROSS_APP.md) | Quién es dueño de qué; contratos entre apps. |
| +dinero | [`MONEY_PATH.md`](./MONEY_PATH.md) | Checkout, POS, webhooks, DTE. |
| +prod | [`PRODUCTION.md`](./PRODUCTION.md) + [`TRUST.md`](./TRUST.md) | Release, incidentes, RLS, PII. |
| +leyes CL | [`CUMPLIMIENTO_CHILE.md`](./CUMPLIMIENTO_CHILE.md) | Qué falta para estar al día; hidromiel no se vende. |
| +dossier legal | [`DOSSIER_JURIDICO_LEGAL.md`](./DOSSIER_JURIDICO_LEGAL.md) | Dossier jurídico, fiscal y regulatorio integral para abogado/auditoría. |
| +campo | [`CAMPO_OFFLINE.md`](./CAMPO_OFFLINE.md) | POS / Dexie / sync. |
| +datos | [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) + [`ROLES_Y_ACCESO.md`](./ROLES_Y_ACCESO.md) | Schema y roles. |
| +Chiloé | [`NUCLEO_CHILOE.md`](./NUCLEO_CHILOE.md) | Censo territorial. |
| +deploy | [`../DEPLOY.md`](../DEPLOY.md) + [`VERCEL.md`](./VERCEL.md) + [`ENV-CHECKLIST.md`](./ENV-CHECKLIST.md) | Proyectos Vercel y secretos. |

**No empieces por** `MASTER_PLAN.md`, `FRONTEND_ROADMAP.md`, `PLAN_COLOSAL.md` ni `COSTEO_ARQUITECTURA.md`. Son snapshots o specs de dominio. Tratarlos como estado actual es cómo se reintroducen mentiras (Campo “sin Dexie”, cron cada minuto, 7 packages).

## Jerarquía cuando hay conflicto

1. [`../system_invariants.md`](../system_invariants.md) — 6 leyes.
2. [`CONSTITUTION.md`](./CONSTITUTION.md) — carta (incluye presupuesto Hobby/Free § II.6).
3. Este índice + [`REPO_MAP.md`](./REPO_MAP.md) + [`DOMAINS.md`](./DOMAINS.md) + [`CROSS_APP.md`](./CROSS_APP.md) + [`CAMPO_OFFLINE.md`](./CAMPO_OFFLINE.md) + [`MONEY_PATH.md`](./MONEY_PATH.md) + [`PRODUCTION.md`](./PRODUCTION.md) + [`TRUST.md`](./TRUST.md) + [`GLOSSARY.md`](./GLOSSARY.md).
4. [`../AGENTS.md`](../AGENTS.md) — reglas operativas para agentes.
5. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — flujos (puede rezagarse; el mapa gana).
6. Snapshot / auditoría / roadmap (abajo). Nunca ganan a 1–5.

`../AGENTS.md` y los stubs de IDE (`CLAUDE.md`, `gemini.md`) **delegan** aquí. No duplicar topología en esos archivos.

## Clases de documento

Cada doc debería llevar su clase en la primera cita. Si no la tiene, asúmela por esta tabla.

| Clase | Significa | Puedes usarlo como |
|---|---|---|
| **LEY** | Invariante. Violarlo es un bug de gobernanza. | Orden de implementación. |
| **VIVO** | Debe coincidir con el código de `main` hoy. | Mapa, comandos, rutas, packages. |
| **OPS** | Cómo desplegar / secretos / checklists. | Deploy, no diseño. |
| **AUDITORÍA** | Hallazgos en una fecha. El código pudo cerrar el hueco. | Riesgo residual, no “así es el repo”. |
| **SNAPSHOT** | Diagnóstico o plan fechado. Congelado a propósito. | Historia. Contrastar con `REPO_MAP` / `ESTADO_DEL_ARTE`. |
| **SPEC** | Diseño de un dominio (a menudo parcialmente implementado). | Intención + gaps. Verificar tablas/código antes de construir. |
| **ROADMAP** | Deseable, no estado. Checkboxes mienten con el tiempo. | Prioridad, no inventario. |

## Catálogo

### Ley y operación

| Doc | Clase | Rol |
|---|---|---|
| [`../system_invariants.md`](../system_invariants.md) | LEY | 6 leyes. Gana a todo. |
| [`CONSTITUTION.md`](./CONSTITUTION.md) | LEY | Visión, principios, presupuesto de plataforma § II.6. |
| [`../AGENTS.md`](../AGENTS.md) | LEY | Qué puede / no puede hacer un agente. Apunta a este índice. |
| [`AGENT_INSTRUCTIONS.md`](./AGENT_INSTRUCTIONS.md) | LEY | Cirugía, stack, workflow de verificación. |
| [`ROLES_Y_ACCESO.md`](./ROLES_Y_ACCESO.md) | LEY | Roles de plataforma vs comerciales (`oyz_role`). |
| [`TRUST.md`](./TRUST.md) | LEY | RLS, secretos, tenancy, PII, Groq/Sentry. |
| [`CUMPLIMIENTO_CHILE.md`](./CUMPLIMIENTO_CHILE.md) | OPS | Destilado: hacer / ya está / no aplica (leyes CL). |
| [`DOSSIER_JURIDICO_LEGAL.md`](./DOSSIER_JURIDICO_LEGAL.md) | SPEC | Dossier jurídico, fiscal y regulatorio integral para abogado/auditoría. |
| [`CONTRATO_TIPO_CONSIGNACION_FERIA.md`](./CONTRATO_TIPO_CONSIGNACION_FERIA.md) | OPS | Contrato marco de consignación ferial y servicios independientes. |
| [`DPA_CLAUSULAS_CONTRACTUALES_TIPO_LEY21719.md`](./DPA_CLAUSULAS_CONTRACTUALES_TIPO_LEY21719.md) | OPS | DPA con Cláusulas Contractuales Tipo (CCT) Ley 21.719 (SaaS transfronterizo). |
| [`ACTA_DIRECTORIO_DESIGNACION_EPD_LEY21595.md`](./ACTA_DIRECTORIO_DESIGNACION_EPD_LEY21595.md) | OPS | Acta de Directorio: adopción de MPD y designación formal de EPD Ley 21.595. |
| [`ANTI_SLOP.md`](./ANTI_SLOP.md) | LEY | Constricción anti-slop, branding y diseño de superficie pública. |
| [`RRSS_POSICION_PUBLICA.md`](./RRSS_POSICION_PUBLICA.md) | LEY | Doctrina de RRSS y distribución pública (Instagram + X). |
| [`GLOSSARY.md`](./GLOSSARY.md) | VIVO | Patio ≠ Campo; `oyz_role` ≠ admin. |
| [`OPS_ROLES_CHECKLIST.md`](./OPS_ROLES_CHECKLIST.md) | OPS | Checklist post-migración de roles. |

### Mapa vivo

| Doc | Clase | Rol |
|---|---|---|
| [`REPO_MAP.md`](./REPO_MAP.md) | VIVO | Apps, 17 packages, puertos, crons, plano de datos, lo que **no** existe. |
| [`DOMAINS.md`](./DOMAINS.md) | VIVO | Dueño por dominio + horizonte del néctar. |
| [`CROSS_APP.md`](./CROSS_APP.md) | VIVO | Contratos HTTP/secretos entre las 3 apps. |
| [`MONEY_PATH.md`](./MONEY_PATH.md) | VIVO | Plata: init → webhook → fulfill → DTE / POS. |
| [`CAMPO_OFFLINE.md`](./CAMPO_OFFLINE.md) | VIVO | Dexie en Campo. Única verdad offline. |
| [`CMS_EDITOR.md`](./CMS_EDITOR.md) | VIVO | Editor de Tienda: auto-guardado canónico en vivo, optimizador WebP (1600px, q=0.88, multi-step downsampling) y revalidación ISR. |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | VIVO | Flujos detallados. Topología: `REPO_MAP`. Contratos: `CROSS_APP`. |
| [`CIENCIA_PUBLICA.md`](./CIENCIA_PUBLICA.md) | VIVO | Catálogo de claims científicos y fuentes trianguladas. |
| [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) | VIVO | Esquema. Regenerar tipos tras migrar. |
| [`ESTADO_DEL_ARTE.md`](./ESTADO_DEL_ARTE.md) | VIVO | Madurez por workflow (actualizar al cerrar un movimiento). |
| [`DECISIONS.md`](./DECISIONS.md) | VIVO | ADRs. Lo nuevo va arriba. |
| [`ENV-CHECKLIST.md`](./ENV-CHECKLIST.md) | OPS | Matriz de env por app. |
| [`LEGACY_TIER.md`](./LEGACY_TIER.md) | LEY | iPhone 7 / iOS 15.4. |

### Ops y plataforma

| Doc | Clase | Rol |
|---|---|---|
| [`PRODUCTION.md`](./PRODUCTION.md) | OPS | Release, CI, backups/pausa Free, incidentes, kill switches. |
| [`../DEPLOY.md`](../DEPLOY.md) | OPS | Tres proyectos Vercel. Crons = diarios (no cada minuto). |
| [`VERCEL.md`](./VERCEL.md) | OPS | Overrides de build. `VITE_*` está muerto. |
| [`../packages/database/README.md`](../packages/database/README.md) | OPS | CLI Supabase, typegen. Conteo de migs: `REPO_MAP`. |

### Dominio (spec + implementación parcial)

| Doc | Clase | Dominio |
|---|---|---|
| [`COMERCIO_SOBERANO.md`](./COMERCIO_SOBERANO.md) | SPEC | Tienda propia, no Shopify. |
| [`PLAN_MARKETING_MENSUAL_CARRUSELES.md`](./PLAN_MARKETING_MENSUAL_CARRUSELES.md) | SPEC | Plan mensual de distribución por carruseles. |
| [`WALLET_GUARDIAN.md`](./WALLET_GUARDIAN.md) | SPEC | Sellos Apple/Google Wallet. |
| [`SOBERANIA_FISCAL.md`](./SOBERANIA_FISCAL.md) | SPEC | DTE / SII nativo. |
| [`SII_CERTIFICACION.md`](./SII_CERTIFICACION.md) | OPS | Certificación SII. |
| [`BANCO_CHILE.md`](./BANCO_CHILE.md) | SPEC | API Empresas + conciliación. |
| [`CIERRES_CAJA_COMISIONES.md`](./CIERRES_CAJA_COMISIONES.md) | SPEC | Caja, tiers, leaderboard. |
| [`INCENTIVOS_Y_BONOS_TERCEROS.md`](./INCENTIVOS_Y_BONOS_TERCEROS.md) | SPEC | Matriz integral de bonos, comisiones, tiers, B2B y blindaje laboral. |
| [`COSTEO_ARQUITECTURA.md`](./COSTEO_ARQUITECTURA.md) | SPEC | Costeo por frasco. **No** describe Campo: ver `CAMPO_OFFLINE`. |
| [`BITACORA_APICOLA.md`](./BITACORA_APICOLA.md) | SPEC | Bitácora de patio (Núcleo, no Campo). |
| [`BLINDAJE_Y_AMENAZAS.md`](./BLINDAJE_Y_AMENAZAS.md) | SPEC | Threat model, ledger inmutable y salvaguardas de bitácora. |
| [`NUCLEO_CHILOE.md`](./NUCLEO_CHILOE.md) | SPEC | Censo territorial. |
| [`GOBERNANZA_TERRITORIAL_CARBONO_INAPI.md`](./GOBERNANZA_TERRITORIAL_CARBONO_INAPI.md) | SPEC | Sello INAPI, MRV y carbono (largo horizonte). |
| [`MICROCANALES_CIENCIA_Y_GOBERNANZA.md`](./MICROCANALES_CIENCIA_Y_GOBERNANZA.md) | SPEC | B2B / ciencia / gobernanza. |
| [`RED_INTERCAMBIO_LEGAL.md`](./RED_INTERCAMBIO_LEGAL.md) | SPEC | Red de intercambio. |
| [`AI_NUCLEO.md`](./AI_NUCLEO.md) | SPEC | Groq en Núcleo. Kill `AI_ENABLED`. Datos: `TRUST`. |

### Snapshots y auditorías (fechados — no son el mapa)

| Doc | Clase | Fecha / nota |
|---|---|---|
| [`MASTER_PLAN.md`](../MASTER_PLAN.md) | SNAPSHOT | Junio 2026. “Offline cancelado”, “7 packages”, “sin next-intl” están **muertos**. |
| [`FRONTEND_ROADMAP.md`](./FRONTEND_ROADMAP.md) | ROADMAP | Checkboxes mezclan hecho y deseo. Contrastar con `ESTADO_DEL_ARTE`. |
| [`PLAN_COLOSAL.md`](./PLAN_COLOSAL.md) | ROADMAP | Olas de comercio. Ops (`db:push`) puede estar viejo. |
| [`TECHNICAL_DEBT.md`](./TECHNICAL_DEBT.md) | SNAPSHOT | Junio + parches. Busca `RESUELTO` antes de “arreglarlo”. |
| [`AUDITORIA_PROFUNDA_2026-08.md`](./AUDITORIA_PROFUNDA_2026-08.md) | AUDITORÍA | Ago 2026. Exploits DEFINER, POS idempotencia. Verificar si el finding sigue en código. |
| [`RLS_AUDIT_COLMENAS_BITACORA.md`](./RLS_AUDIT_COLMENAS_BITACORA.md) | AUDITORÍA | Patio / bitácora. |
| [`LOADING_AUDIT.md`](./LOADING_AUDIT.md) | AUDITORÍA | Spinners / ViewLoading. |
| [`../UI_DESIGN_SYSTEM_AUDIT.md`](../UI_DESIGN_SYSTEM_AUDIT.md) | AUDITORÍA | Tokens de diseño, contraste y componentes visuales. |
| [`QA_STRATEGY.md`](./QA_STRATEGY.md) | LEY | Vitest + Playwright. E2E **existe** en las 3 apps. |

### Auxiliares

| Doc | Clase |
|---|---|
| [`PROMPT_LIBRARY.md`](./PROMPT_LIBRARY.md) | OPS — prompts para dirigir agentes. |
| [`../README.md`](../README.md) | VIVO — puerta de entrada; no duplica el mapa. |

## Reglas para quien escribe docs

1. **Un hecho vive en un solo sitio.** Topología → `REPO_MAP`. Dominios → `DOMAINS`. Contratos → `CROSS_APP`. Dinero → `MONEY_PATH`. Offline → `CAMPO_OFFLINE`. Cuotas → `CONSTITUTION` § II.6. Roles → `ROLES_Y_ACCESO`. Confianza → `TRUST`. Día 2 → `PRODUCTION`. Palabras → `GLOSSARY`. El resto **enlaza**.
2. Si cambias apps, packages, crons, auth, un contrato HTTP o un dominio, actualizas el mapa correspondiente **en el mismo PR**.
3. Snapshot nuevo = banner en la primera línea: `> SNAPSHOT YYYY-MM — no es el estado de main.`
4. No inventes packages (`@enjambre/offline` **no existe**). Extiende `apps/campo/src/lib/offline/` o extrae de ahí.
5. Números redondos (“50+ migraciones”, “7 parsers”) están prohibidos en docs VIVO. Cuenta o enlaza.
6. Tras un hallazgo de auditoría cerrado, no borres la auditoría: marca el ítem y deja la fecha.

## Stubs de IDE (no son la carta)

| Archivo | Debe |
|---|---|
| [`../AGENTS.md`](../AGENTS.md) | Apuntar aquí. Reglas cortas, no censo. |
| [`../CLAUDE.md`](../CLAUDE.md) | Apuntar aquí. Prohibido “offline planned”. |
| [`../gemini.md`](../gemini.md) | Apuntar aquí. Packages incompletos = bug. |
| [`../PROXYAI.md`](../PROXYAI.md) | Vacío a propósito; no añadir un tercer mapa. |

*Índice creado: 2026-08-14. Actualizar la tabla de catálogo cuando nazca o muera un doc.*
