# 00 — EMPIEZA AQUI

> **Enjambre Legado** — Sistema operativo para la regeneracion biocultural.
> Monorepo multi-plataforma, multi-rol, multi-agente.
>
> **Docs:** [`docs/README.md`](docs/README.md) (índice ley / vivo / snapshot) · [`docs/REPO_MAP.md`](docs/REPO_MAP.md) (mapa del código).
> No empieces por `MASTER_PLAN.md` (foto de junio 2026).

---

## Que es este proyecto

Enjambre Legado no es un e-commerce. Es un ecosistema tecnologico que orquesta la relacion entre el bosque nativo de Chiloe, la abeja virgen y el consumo consciente de alta gama. Cada linea de codigo honra la pureza de la miel y la complejidad de la colmena.

El sistema cubre todo el ciclo: desde la inspeccion de colmenas en terreno (sin internet), pasando por la gestion contable chilena, hasta la venta premium internacional con trazabilidad blockchain.

---

## Mapa de la Documentacion

El índice vivo (clases de doc, jerarquía, catálogo entero) está en **[`docs/README.md`](docs/README.md)**. El censo de código en **[`docs/REPO_MAP.md`](docs/REPO_MAP.md)**.

| Si tienes... | Lee |
|---|---|
| 3 min | `docs/README.md` + `docs/REPO_MAP.md` + `docs/GLOSSARY.md` |
| 10 min | + Constitución + `system_invariants` + `docs/DOMAINS.md` |
| Cruza apps / plata | `docs/CROSS_APP.md` + `docs/MONEY_PATH.md` |
| Producción | `docs/PRODUCTION.md` + `docs/TRUST.md` |
| A tocar código | `docs/AGENT_INSTRUCTIONS.md` + spec del dueño (`DOMAINS`) |
| Deploy | `DEPLOY.md` + `docs/VERCEL.md` + `docs/ENV-CHECKLIST.md` |

---

## Topologia Rapida

Censo completo (15 packages, puertos, crons): [`docs/REPO_MAP.md`](docs/REPO_MAP.md).

```
apps/tienda    :3001   D2C + perfil + CMS (pagos vía BFF Núcleo)
apps/nucleo    :3000   Dashboard + único BFF Hono + fiscal
apps/campo     :3002   POS feria, Dexie first  → docs/CAMPO_OFFLINE.md
packages/*     15      database (213 migs), auth, ui, contable, fiscal, …
docs/          índice  docs/README.md
```

---

## Stack Tecnologico

| Capa | Tecnologia | Version |
|---|---|---|
| Monorepo | Turborepo + pnpm | 2.8 / 10.32 |
| Frontend | React 19, Next.js 16 | - |
| Estilos | Tailwind CSS 3, GSAP | - |
| Base de datos | Supabase (Postgres 17 + PostGIS + RLS) | - |
| Estado | Zustand, TanStack Query | - |
| Pagos | Flow y/o Transbank (`PAYMENT_PROVIDER`) | BFF Núcleo |
| Validacion | Zod | 4.x |
| BFF | Hono (dentro de nucleo) | 4.10 |
| Contabilidad | @enjambre/contable (Zod) | - |
| Node | >=20 (apps usan 24.x) | - |

---

## Roles del Sistema

| Rol | App principal | Que hace |
|---|---|---|
| `admin` | nucleo | Panel ejecutivo, gestiona todo (roles granulares previos consolidados via migration 39) |
| `cliente` | tienda | Compra, ve impacto, fidelizacion |
| `creador` | nucleo | Portal auto-servicio, comisiones |
| `rep_ventas` | campo, nucleo | POS en ferias, ventas directas |
| `territorial` | nucleo | Registro Territorial Apícola de Chiloé: inscripción, predios, trashumancia, alertas fitosanitarias (home `/territorio`) |

---

## Primeros Pasos

```bash
# 1. Instalar dependencias (raiz del monorepo)
pnpm install

# 2. Secretos (una vez) — Supabase Dashboard → Settings → API → service_role
# Crear en la raíz: .env.secrets.local con SUPABASE_SERVICE_ROLE_KEY=eyJ...
pnpm go-live:bootstrap    # fusiona a nucleo/tienda/campo + INTERNAL_API_SECRET

# 3. Verificar
pnpm go-live:check        # env obligatorio
pnpm verify               # build igual que Vercel

# 4. Local (puertos fijos)
pnpm --filter @enjambre/nucleo dev              # http://localhost:3000
pnpm --filter @enjambre/tienda dev -- --port 3001
pnpm --filter @enjambre/campo dev               # http://localhost:3002

# 5. Producción Vercel (proyectos: nucleo-theta, tienda, campo)
pnpm go-live:vercel-env   # sube env desde .env.secrets.local
cd apps/nucleo && vercel --prod
cd apps/tienda && vercel --prod
cd apps/campo && vercel --prod
```

### Checklist operativo feria (admin)

```bash
pnpm feria:check                              # readiness infra + DB
FERIA_REP_TOKEN=eyJ... pnpm feria:check       # + contexto BFF del rep
```

1. `/operadores-feria` — contrato activo + evento `en_curso` + consignación  
2. Campo POS — ventas `channel=feria`  
3. Devolución stock si aplica  
4. Rep cierra arqueo en `/mi-feria`  
5. Cliente reclama en tienda `/claim/{token}`  
6. Ledger → aprobar → **Preparar SII** → F29 en módulo Impuestos  

Ver `docs/RED_INTERCAMBIO_LEGAL.md`, `scripts/feria-readiness.mjs` y `docs/VERCEL.md`.

---

## Reglas de Oro para Agentes

1. **Lee `CONSTITUTION.md` antes de cualquier cambio** — Define lo que es y no es negociable
2. **Cirugia, no carniceria** — Modifica solo lo estrictamente necesario
3. **La seguridad vive en Postgres** — Nunca confies en el cliente para RLS
4. **Named Exports** — Prohibido `export default` (excepto pages Next.js)
5. **Tipado fuerte** — `any` es un error. Usa `unknown` + type guards
6. **Estetica premium** — Esto no es un MVP. Es producto de lujo

---

*Documento maestro. Actualizar cuando cambie la estructura del proyecto.*
*Ultima actualizacion: Junio 2026*
