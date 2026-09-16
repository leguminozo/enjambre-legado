# ENJAMBRE LEGADO — Directrices Centrales para Gemini

Este archivo define las reglas arquitectonicas, metodologicas y de codificacion criticas para Enjambre Legado. **Lee y aplica en cada interaccion con la base de codigo.**

## 1. IDENTIDAD Y FILOSOFIA DEL PROYECTO
- **Enjambre Legado** es un sistema operativo para la regeneracion biocultural y territorial. Orquesta la relacion entre el bosque nativo de Chiloe, la abeja virgen y el consumo consciente de alta gama.
- **Estetica Premium No-Negociable**: El frontend es una pieza de diseno de lujo. Dark mode, Cormorant Garamond, GSAP, textura organica. Poder superior y elegancia discreta; cero jerga de ONG, cooperativa o prédica ecológica.
- **Offline-First para Campo**: Campo = **rep_ventas / POS feria** (no patio apícola). Dexie primero, Supabase despues. Bitácora de patio vive en Núcleo (`NucleoBitacoraDB`), no en Campo.
- **Seguridad en Postgres**: RLS obligatorio. Nunca confiar en el cliente para seguridad.

## 2. STACK TECNOLOGICO STRICTO
- **Core Frontend**: React 19 + Next.js 16 (App Router)
- **Estilos**: Tailwind CSS 3/4 con tokens semanticos (`bg-background`). Prohibido hex sueltos.
- **Estado**: Zustand (global) + TanStack Query (remoto)
- **Backend**: Supabase (Postgres 17 + PostGIS + RLS) + Hono (BFF dentro de nucleo)
- **Animaciones**: GSAP (premium) + Framer Motion (micro-transiciones)
- **Pagos**: Flow y/o Transbank (`PAYMENT_PROVIDER`). Mapa: `docs/REPO_MAP.md`.
- **Validacion**: Zod

## 3. ARQUITECTURA MONOREPO
- Monorepo con Turborepo + pnpm. Apps en `apps/`, logica compartida en `packages/`.
- **Apps**: tienda (Next.js), nucleo (Next.js + Hono BFF), campo (Next.js)
- **Packages**: 17 — censo en `docs/REPO_MAP.md`. No existe `@enjambre/offline`.
- Lo que se usa en 2+ apps pertenece a un `package`.

## 4. FLUJO DE DATOS OFFLINE-FIRST (CAMPO)
- **Offline-first está implementado y activo.** Campo usa una arquitectura basada en Dexie para persistencia local en zonas sin conectividad.
- Flujo: UI Component → Custom Hook → Dexie DB (`apps/campo/src/lib/offline/db.ts`) → Sync Queue → Supabase

## 5. CONVENCIONES DE CODIGO
- **Componentes**: `PascalCase.tsx`. Named exports (`export function MiComp()`). Prohibido `export default`.
- **Hooks**: `use-nombre.ts` en directorio `hooks/`.
- **Tipos**: `PascalCase` con sufijo `Props` para componentes.
- **CSS**: `cn()` para fusionar clases Tailwind. Tokens semanticos unicamente.
- **TypeScript**: `strict`. `any` es un error. Usar `unknown` + type guard.
- **Errores**: `toast.error()` para el usuario. Nunca `catch(e) {}` vacio.
- **Vocabulario Sagrado (Recolección, JAMÁS Cosecha)**: Prohibido usar `cosecha`, `cosechas`, `cosechado`, `Club de la Cosecha` en interfaces, textos de producto, metadatos y menús. Siempre usar `recolección` o `recolectado`.
- **Tono de Poder Silencioso (Cero Jerga de ONG o Hippie)**: Prohibido usar `biocultural` en UI pública (se hace en el bosque, pero no se publicita como muletilla). Prohibido usar `custodia` en interfaces de cliente/B2B (usar `trayectoria`, `vínculo`, `presencia` o `legado`). Prohibido usar `oficio` que denote sacrificio obrero/abnegado (proyectar maestría y alta gama). Prohibido usar `regenerativo` como muletilla B2B/alianzas (el valor se sustenta en hechos y trazabilidad comprobable).
- **Superficie de Usuario Limpia (Cero Fuga Técnica)**: Prohibido exponer nombres de archivos (`.sql`, `.ts`), comandos CLI (`pnpm`, `git`), hashes internos (`SHA-256`), UUIDs crudos o mensajes técnicos de base de datos en interfaces de usuario final. Toda interfaz debe expresarse en lenguaje de valor, claridad operativa y estética de alta gama.

## 6. DOMINIOS CLAVE
- **Tienda**: E-commerce premium (Flow/Transbank vía BFF) + CMS dinamico
- Docs: empieza en `docs/README.md`. `MASTER_PLAN.md` es snapshot junio 2026.
- **Nucleo**: Dashboard multi-rol con mapas (Leaflet + PostGIS), Hono BFF + contable
- **Campo**: PWA POS revendedores (`rep_ventas`), offline-first activo (Dexie). Patio apícola = Núcleo (`role=apicultor`)
- **Contable**: IVA 19%, RUT chileno, facturas (Zod schemas)

## 7. REGLAS DE RESPUESTA
1. **Piensa en Arquitectura**: Antes de modificar, pregunta si rompe RLS, offline o la estetica premium.
2. **Cirugia, no Carniceria**: Modifica solo lo estrictamente necesario.
3. **Manejo de Errores UX**: Siempre `toast.error()` y estados de carga en UI async.
4. **Respeto a `AGENTS.md` y Vocabulario Sagrado**: Recuerda: recolección (no cosecha), poder silencioso (cero palabrería hippie/ONG/oficio).
5. **Cero Ruido Técnico en UI**: Ninguna pantalla pública, dashboard de cliente o POS debe exhibir scripts internos o jerga técnica de desarrollo.

