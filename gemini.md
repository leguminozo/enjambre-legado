# ENJAMBRE LEGADO — Directrices Centrales para Gemini

Este archivo define las reglas arquitectonicas, metodologicas y de codificacion criticas para Enjambre Legado. **Lee y aplica en cada interaccion con la base de codigo.**

## 1. IDENTIDAD Y FILOSOFIA DEL PROYECTO
- **Enjambre Legado** es un sistema operativo para la regeneracion biocultural. Orquesta la relacion entre el bosque nativo de Chiloe, la abeja virgen y el consumo consciente de alta gama.
- **Estetica Premium No-Negociable**: El frontend es una pieza de diseno de lujo. Dark mode, Cormorant Garamond, GSAP, textura organica.
- **Offline-First para Campo**: El apicultor trabaja sin internet. Dexie primero, Supabase despues.
- **Seguridad en Postgres**: RLS obligatorio. Nunca confiar en el cliente para seguridad.

## 2. STACK TECNOLOGICO STRICTO
- **Core Frontend**: React 19 + Next.js 16 (App Router)
- **Estilos**: Tailwind CSS 3/4 con tokens semanticos (`bg-background`). Prohibido hex sueltos.
- **Estado**: Zustand (global) + TanStack Query (remoto)
- **Backend**: Supabase (Postgres 17 + PostGIS + RLS) + Hono (BFF dentro de nucleo)
- **Animaciones**: GSAP (premium) + Framer Motion (micro-transiciones)
- **Pagos**: Transbank SDK (Webpay Chile)
- **Validacion**: Zod

## 3. ARQUITECTURA MONOREPO
- Monorepo con Turborepo + pnpm. Apps en `apps/`, logica compartida en `packages/`.
- **Apps**: tienda (Next.js), nucleo (Next.js + Hono BFF), campo (Next.js)
- **Packages**: database, contable, auth, ui, sumup, banco-chile
- Lo que se usa en 2+ apps pertenece a un `package`.

## 4. FLUJO DE DATOS OFFLINE-FIRST (CAMPO)
- **Offline-first es planificado pero no implementado.** Campo actualmente usa Supabase directamente.
- Futuro: UI Component → Custom Hook → Dexie DB → Sync Queue → Supabase

## 5. CONVENCIONES DE CODIGO
- **Componentes**: `PascalCase.tsx`. Named exports (`export function MiComp()`). Prohibido `export default`.
- **Hooks**: `use-nombre.ts` en directorio `hooks/`.
- **Tipos**: `PascalCase` con sufijo `Props` para componentes.
- **CSS**: `cn()` para fusionar clases Tailwind. Tokens semanticos unicamente.
- **TypeScript**: `strict`. `any` es un error. Usar `unknown` + type guard.
- **Errores**: `toast.error()` para el usuario. Nunca `catch(e) {}` vacio.

## 6. DOMINIOS CLAVE
- **Tienda**: E-commerce premium con Transbank + CMS dinamico
- **Nucleo**: Dashboard multi-rol con mapas (Leaflet + PostGIS), Hono BFF + contable
- **Campo**: PWA para campo (apicultor/vendedor/rep_ventas), offline-first planificado
- **Contable**: IVA 19%, RUT chileno, facturas (Zod schemas)

## 7. REGLAS DE RESPUESTA
1. **Piensa en Arquitectura**: Antes de modificar, pregunta si rompe RLS, offline o la estetica premium.
2. **Cirugia, no Carniceria**: Modifica solo lo estrictamente necesario.
3. **Manejo de Errores UX**: Siempre `toast.error()` y estados de carga en UI async.
4. **Respeto a `AGENTS.md`**: Si hay dudas, revisa `AGENTS.md` y `docs/CONSTITUTION.md`.
