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
| `PLAN_COLOSAL.md` | **Plan maestro** — 5 olas (reseñas, wallet, ritual, catálogo, vanguardia) |
| `COMERCIO_SOBERANO.md` | App comercial propia (no Shopify). Inspiracion apps top + roadmap |
| `WALLET_GUARDIAN.md` | Tarjetas Wallet iOS/Android con sellos por producto |
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
  tienda/          Next.js 16 E-commerce publico + admin
  nucleo/          Next.js 16 Dashboard gerencial + BFF Hono (App Router)
  campo/           Next.js 16 PWA campo (apicultor/vendedor/rep_ventas)
packages/
  database/        Supabase Migraciones + tipos
  contable/        Zod Logica tributaria chilena
  auth/            Supabase Sesion + roles + redirect
  ui/              Design tokens compartidos
  sumup/           SumUp POS integration
  banco-chile/     Banco Chile Empresas API client
  maps/            Utilidades cartograficas (sin consumidores activos)
docs/              Documentacion (estas leyendo esto)
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
| Pagos | Transbank SDK (Webpay) | 6.1 |
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

1. `/operadores-feria` — contrato activo + evento `en_curso` + consignación  
2. Campo POS — ventas `channel=feria`  
3. Devolución stock si aplica  
4. Rep cierra arqueo en `/mi-feria`  
5. Ledger → aprobar → **Preparar SII** → F29 en módulo Impuestos  

Ver `docs/RED_INTERCAMBIO_LEGAL.md` y `docs/VERCEL.md`.

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
