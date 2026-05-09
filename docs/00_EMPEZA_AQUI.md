# 00 — EMPIEZA AQUI

> **Enjambre Legado** — Sistema operativo para la regeneracion biocultural.
> Monorepo multi-plataforma, multi-rol, multi-agente.

---

## Que es este proyecto

Enjambre Legado no es un e-commerce. Es un ecosistema tecnologico que orquesta la relacion entre el bosque nativo de Chiloe, la abeja virgen y el consumo consciente de alta gama. Cada linea de codigo honra la pureza de la miel y la complejidad de la colmena.

El sistema cubre todo el ciclo: desde la inspeccion de colmenas en terreno (sin internet), pasando por la gestion contable chilena, hasta la venta premium internacional con trazabilidad blockchain.

---

## Mapa de la Documentacion

Lee en orden segun tu rol y tiempo disponible:

| Si tienes... | Lee | Para... |
|---|---|---|
| 5 min | Este archivo + `CONSTITUTION.md` | Entender la vision y las reglas inviolables |
| 15 min | + `ARCHITECTURE.md` + `AGENT_INSTRUCTIONS.md` | Entender la estructura y como trabajar |
| 30 min | + `DATABASE_SCHEMA.md` + `DEPLOY.md` | Entender los datos y el despliegue |
| 60 min | + `PROMPT_LIBRARY.md` + `TECHNICAL_DEBT.md` + `FRONTEND_ROADMAP.md` | Maestria completa del ecosistema |

### Indices por documento

| Archivo | Proposito |
|---|---|
| `CONSTITUTION.md` | Principios inviolables. Vision, filosofia, mandamientos |
| `ARCHITECTURE.md` | Topologia del monorepo, flujo de datos, integraciones |
| `AGENT_INSTRUCTIONS.md` | Reglas para agentes de IA. Convenciones, stack, workflow |
| `DATABASE_SCHEMA.md` | Esquema canonico de base de datos completo |
| `PROMPT_LIBRARY.md` | Prompts pre-construidos para dirigir agentes con precision |
| `FRONTEND_ROADMAP.md` | Roadmap visual y funcional por aplicacion |
| `TECHNICAL_DEBT.md` | Deuda tecnica conocida, priorizada y con plan de accion |
| `DEPLOY.md` | Guia de despliegue multi-plataforma |
| `VERCEL.md` | Checklist especifico para Vercel |

---

## Topologia Rapida

```
enjambre-legado/
  apps/
    tienda/     Next.js 16   E-commerce publico + admin
    nucleo/     Vite 7 SPA   Dashboard gerencial (PWA)
    campo/      Next.js 15   PWA campo (apicultor/vendedor)
    api/        Hono         BFF contable + integraciones
    eirl/       Next.js 15   Contabilidad EIRL (independiente)
  packages/
    database/   Supabase     Migraciones + tipos
    contable/   Zod          Logica tributaria chilena
    auth/       Supabase     Sesion + roles + redirect
    offline/    Dexie        Sync offline-first
    ui/         Tokens       Design tokens compartidos
    ai/         Stub         Prediccion de floracion
    maps/       Tipos        Utilidades cartograficas
  docs/                      Documentacion (estas leyendo esto)
```

---

## Stack Tecnologico

| Capa | Tecnologia | Version |
|---|---|---|
| Monorepo | Turborepo + pnpm | 2.8 / 10.32 |
| Frontend | React 19, Next.js 15/16, Vite 7 | - |
| Estilos | Tailwind CSS 3/4, GSAP, Framer Motion | - |
| Base de datos | Supabase (Postgres 17 + PostGIS + RLS) | - |
| Estado | Zustand, TanStack Query, Dexie (offline) | - |
| Pagos | Transbank SDK (Webpay) | 6.1 |
| Validacion | Zod | 4.x |
| BFF | Hono | 4.10 |
| Contabilidad | Prisma + SQLite (EIRL independiente) | 6.x |
| Node | >=20 (apps usan 24.x) | - |

---

## Roles del Sistema

| Rol | App principal | Que hace |
|---|---|---|
| `apicultor` | campo, nucleo | Inspecciona colmenas, registra cosechas |
| `vendedor` | campo, nucleo | POS en ferias, ventas directas |
| `gerente` | nucleo | Panel ejecutivo, ve todo |
| `logistica` | nucleo | Envios, stock, seguimiento |
| `marketing` | nucleo | Campanas, redes, comunidad |
| `tienda_admin` | tienda | Administra catalogo, ordenes |
| `cliente` | tienda | Compra, ve impacto, fidelizacion |

---

## Primeros Pasos

```bash
# 1. Instalar dependencias (raiz del monorepo)
pnpm install

# 2. Variables de entorno
cp .env.example .env.local
# Configurar SUPABASE_URL y SUPABASE_ANON_KEY

# 3. Levantar todo
pnpm dev

# 4. O levantar una app especifica
pnpm --filter @enjambre/tienda dev
pnpm --filter @enjambre/nucleo dev
pnpm --filter @enjambre/campo dev
pnpm --filter @enjambre/api dev
```

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
*Ultima actualizacion: Mayo 2026*
