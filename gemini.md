# ENJAMBRE LEGADO — Directrices Centrales para Gemini

Este archivo define las reglas arquitectonicas, metodologicas y de codificacion criticas para Enjambre Legado. **Lee y aplica en cada interaccion con la base de codigo.**

## 1. IDENTIDAD Y FILOSOFIA DEL PROYECTO
- **Enjambre Legado** es un sistema operativo para la regeneracion biocultural. Orquesta la relacion entre el bosque nativo de Chiloe, la abeja virgen y el consumo consciente de alta gama.
- **Estetica Premium No-Negociable**: El frontend es una pieza de diseno de lujo. Dark mode, Cormorant Garamond, GSAP, textura organica.
- **Offline-First para Campo**: El apicultor trabaja sin internet. Dexie primero, Supabase despues.
- **Seguridad en Postgres**: RLS obligatorio. Nunca confiar en el cliente para seguridad.

## 2. STACK TECNOLOGICO STRICTO
- **Core Frontend**: React 19 + Next.js 15/16 (App Router) + Vite 7 (SPA)
- **Estilos**: Tailwind CSS 3/4 con tokens semanticos (`bg-background`). Prohibido hex sueltos.
- **Estado**: Zustand (global) + TanStack Query (remoto) + Dexie 4 (offline)
- **Backend**: Supabase (Postgres 17 + PostGIS + RLS) + Hono (BFF)
- **Animaciones**: GSAP (premium) + Framer Motion (micro-transiciones)
- **Pagos**: Transbank SDK (Webpay Chile)
- **Validacion**: Zod

## 3. ARQUITECTURA MONOREPO
- Monorepo con Turborepo + pnpm. Apps en `apps/`, logica compartida en `packages/`.
- **Apps**: tienda (Next.js), nucleo (Vite SPA), campo (Next.js), api (Hono), eirl (Next.js+Prisma)
- **Packages**: database, contable, auth, offline, ui, ai, maps
- Lo que se usa en 2+ apps pertenece a un `package`.

## 4. FLUJO DE DATOS OFFLINE-FIRST (CAMPO)
1. **UI Component** interactua con un **Custom Hook**.
2. El hook lee/escribe a **Dexie DB** (IndexedDB).
3. Dexie encola la mutacion en la **Sync Queue**.
4. **Supabase** se sincroniza en background (si hay conexion).

## 5. CONVENCIONES DE CODIGO
- **Componentes**: `PascalCase.tsx`. Named exports (`export function MiComp()`). Prohibido `export default`.
- **Hooks**: `use-nombre.ts` en directorio `hooks/`.
- **Tipos**: `PascalCase` con sufijo `Props` para componentes.
- **CSS**: `cn()` para fusionar clases Tailwind. Tokens semanticos unicamente.
- **TypeScript**: `strict`. `any` es un error. Usar `unknown` + type guard.
- **Errores**: `toast.error()` para el usuario. Nunca `catch(e) {}` vacio.

## 6. DOMINIOS CLAVE
- **Tienda**: E-commerce premium con Transbank + CMS dinamico
- **Nucleo**: Dashboard multi-rol con mapas (Leaflet + PostGIS)
- **Campo**: PWA offline-first para apicultores/vendedores
- **API**: BFF multi-tenant con JWT + empresa context
- **EIRL**: Contabilidad independiente (SQLite + Prisma + NextAuth)
- **Contable**: IVA 19%, RUT chileno, facturas (Zod schemas)

## 7. REGLAS DE RESPUESTA
1. **Piensa en Arquitectura**: Antes de modificar, pregunta si rompe RLS, offline o la estetica premium.
2. **Cirugia, no Carniceria**: Modifica solo lo estrictamente necesario.
3. **Manejo de Errores UX**: Siempre `toast.error()` y estados de carga en UI async.
4. **Respeto a `AGENTS.md`**: Si hay dudas, revisa `AGENTS.md` y `docs/CONSTITUTION.md`.
