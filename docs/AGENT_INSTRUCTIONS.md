# Agent Instructions Guide — Enjambre Legado

Este documento es la guía maestra para cualquier Agente de IA (como Antigravity, Cascade, Cursor, etc.) que opere en este repositorio.

## 1. Contexto del Repositorio
Este es un **Monorepo gestionado con Turborepo y pnpm**.
- **Apps**: `apps/tienda` (Next.js), `apps/nucleo` (Vite), `apps/campo` (Next.js), `apps/api` (Hono).
- **Paquetes**: `packages/database` (Supabase schema), `packages/contable` (Lógica financiera), `packages/ai` (Modelos de IA).

## 2. Reglas de Interacción de Código

### A. Estándares de React/Next.js
- **Directivas**: Usa `'use client'` solo cuando sea estrictamente necesario (hooks, interactividad).
- **Iconografía**: Usa `lucide-react`.
- **Animaciones**: GSAP es el estándar para animaciones de alto nivel. Framer Motion para micro-transiciones.
- **Componentes**: Deben ser atómicos y vivir en el directorio `components/` de cada app, o en `packages/ui` si son universales.

### B. Estilo de Código (Linting Mental)
- **Named Exports**: Usa siempre `export function MyComponent()`. Evita `export default`.
- **Tailwind**: No uses clases arbitrarias si existen variables en `globals.css`. Respeta la paleta:
    - Fondo: `#050505`
    - Primario: `#c9a227` (Oro)
    - Texto: `#f5f0e8` (Crema)
- **TypeScript**: Define interfaces para todos los Props. No uses `any`.

### C. Base de Datos (Supabase)
- **Migraciones**: Todas las modificaciones al esquema deben hacerse en `packages/database/supabase/migrations`.
- **RLS**: Al escribir consultas, considera siempre el rol del usuario (`profiles.role`).

## 3. Workflow de Edición
1.  **Investigar**: Antes de editar, busca componentes similares para mantener la consistencia.
2.  **Planear**: Crea un plan si el cambio afecta a más de 3 archivos.
3.  **Ejecutar**: Realiza cambios pequeños y verificables.
4.  **Verificar**: Siempre ejecuta `pnpm --filter @enjambre/app-name build` para detectar errores de tipos o sintaxis antes de reportar éxito.

## 4. Estética "Premium Editorial"
Si se te pide crear una nueva página:
- Usa tipografía `font-display` (Cormorant Garamond) para títulos grandes.
- Implementa espaciado generoso (whitespace).
- Añade una capa de textura (GrainOverlay) si es una página pública.
- Asegura que los efectos de hover sean suaves y elegantes.

---
*Este documento es dinámico y debe actualizarse cuando se adopten nuevas tecnologías o patrones.*
