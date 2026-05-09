# Agent Instructions Guide — Enjambre Legado

> Guia maestra para cualquier Agente de IA (Claude, Cursor, Trae, Windsurf, Gemini, Copilot) que opere en este repositorio.
> **Lee esto completo antes de escribir una sola linea de codigo.**

---

## 0. Lectura Obligatoria Previa

Antes de CUALQUIER accion, lee estos archivos en orden:

1. `docs/CONSTITUTION.md` — Principios inviolables del proyecto
2. Este archivo (`docs/AGENT_INSTRUCTIONS.md`) — Reglas de operacion
3. `docs/ARCHITECTURE.md` — Estructura del monorepo
4. `docs/DATABASE_SCHEMA.md` — Si vas a tocar datos

Si no entiendes la Constitucion, no escribas codigo.

---

## 1. Contexto del Repositorio

Este es un **Monorepo gestionado con Turborepo + pnpm**.

| Concepto | Detalle |
|---|---|
| Workspace | `pnpm-workspace.yaml` define `apps/*` y `packages/*` |
| Build | `turbo run build` construye todo con cache inteligente |
| Dev | `turbo run dev` levanta todas las apps |
| Filter | `pnpm --filter @enjambre/tienda build` para una app especifica |
| Node | >=20 (apps usan 24.x) |
| pnpm | 10.32.1 |

### Apps vs Packages

```
apps/     = Interfaces especificas por rol/plataforma
packages/ = Logica compartida reutilizable
```

**Regla**: Si un componente, hook o utilidad se usa en 2+ apps, pertenece a un `package`.

---

## 2. Reglas de Interaccion de Codigo

### A. Estilo Arquitectonico — Cirugia, no Carniceria

1. **Investigar** antes de editar. Busca componentes similares con grep/glob.
2. **Planear** si el cambio afecta a mas de 3 archivos. Documenta el plan.
3. **Ejecutar** cambios pequenos y verificables. Un PR = un proposito.
4. **Verificar** con build antes de reportar exito.

```
ANTES de crear un componente nuevo:
  1. Existe ya en packages/ui?
  2. Existe en la app donde trabajo?
  3. Existe un patron similar que pueda extender?
  4. Lo necesito mas de una app? → packages/ui
```

### B. Estandares React/Next.js

- **`'use client'`** solo cuando sea estrictamente necesario (hooks, event handlers, useState/useEffect).
- **Iconografia**: `lucide-react`. No otros sets de iconos.
- **Animaciones**: GSAP para animaciones de alto nivel. Framer Motion para micro-transiciones.
- **Componentes**: Atómicos, en el directorio `components/` de cada app o `packages/ui` si son universales.
- **Hooks**: Toda logica de negocio encapsulada en hooks. Los componentes son capas delgadas de presentacion.

### C. Estructura de un Modulo Nuevo

```
apps/tienda/src/features/nuevo-modulo/
  components/          Componentes visuales
  hooks/               Custom hooks con logica de negocio
  types.ts             Tipos e interfaces del modulo
  utils.ts             Utilidades puras
  index.ts             Re-exports publicos
```

### D. Estilo de Codigo (Linting Mental)

#### TypeScript
```typescript
// CORRECTO
interface ProductCardProps {
  product: Product
  variant?: 'compact' | 'full'
}

export function ProductCard({ product, variant = 'full' }: ProductCardProps) {
  if (!product.visible) return null
  return <article>...</article>
}

// INCORRECTO
export default function ProductCard({ product }: any) {
  return <div>...</div>
}
```

#### Tailwind
```typescript
// CORRECTO: usa tokens semanticos
<div className="bg-background text-foreground border border-border">

// INCORRECTO: hex sueltos
<div className="bg-white text-gray-900 border border-gray-200">
```

#### Estado
| Patron | Cuando usar |
|---|---|
| Zustand | Estado global (user, tema, preferencias) |
| React Context | Estado compartido en un arbol de componentes |
| TanStack Query / SWR | Datos remotos de Supabase/API |
| useReducer | Estado complejo dentro de un feature |
| useState | Estado local simple de un componente |
| Dexie | Persistencia offline (campo) |

#### Manejo de Errores
```typescript
// CORRECTO: notifica al usuario
try {
  await supabase.from('ventas').insert(venta)
} catch (error) {
  toast.error('Error al registrar la venta')
  console.error('[Ventas]', error)
}

// INCORRECTO: silencio
try {
  await supabase.from('ventas').insert(venta)
} catch (e) {}
```

---

## 3. Base de Datos (Supabase)

### 3.1 Migraciones

Toda modificacion al esquema debe hacerse en:
```
packages/database/supabase/migrations/NN_descripcion.sql
```

Numeracion secuencial. Incluir:
- Tabla o alteracion
- Indices necesarios
- Politicas RLS si la tabla tiene datos sensibles
- Comentario SQL documentando el proposito

### 3.2 Reglas RLS

- Toda tabla con datos de usuario **debe** tener RLS habilitado.
- Al escribir consultas, considera siempre el rol del usuario (`profiles.role`).
- La funcion `current_role()` retorna el rol del usuario autenticado.
- La funcion `is_gerente()` checkea si el usuario es gerente.
- La funcion `has_empresa_access()` checkea acceso multi-tenant.

```sql
-- Patron RLS estandar
CREATE POLICY "Apicultor ve solo sus datos"
  ON colmenas FOR SELECT
  TO authenticated
  USING (
    current_role() = 'gerente'
    OR apicultor_id = auth.uid()
  );
```

### 3.3 Consultas

```typescript
// CORRECTO: hook con validacion de rol
export function useMisColmenas() {
  const { data: profile } = useProfile()
  return useQuery({
    queryKey: ['colmenas', profile?.id],
    queryFn: () => supabase
      .from('colmenas')
      .select('*')
      .eq('apicultor_id', profile!.id),
    enabled: !!profile?.id,
  })
}

// INCORRECTO: consulta directa sin RLS awareness
const { data } = await supabase.from('colmenas').select('*')
```

---

## 4. Workflow de Edicion por App

### 4.1 Tienda (Next.js 16)

```bash
pnpm --filter @enjambre/tienda dev
pnpm --filter @enjambre/tienda build
```

- Usa `@supabase/ssr` para sesion server-side
- API Routes en `src/app/api/`
- Componentes server por defecto, `'use client'` solo cuando necesario
- GSAP en componentes client con `useGSAP` hook
- Integraciones Transbank en server-side

### 4.2 Nucleo (Vite SPA)

```bash
pnpm --filter @enjambre/nucleo dev
pnpm --filter @enjambre/nucleo build
```

- React Router para rutas (no Next.js routing)
- TanStack Query para datos remotos
- Zustand para estado global
- Leaflet para mapas
- PWA con vite-plugin-pwa

### 4.3 Campo (Next.js 15)

```bash
pnpm --filter @enjambre/campo dev
pnpm --filter @enjambre/campo build
```

- Usa `@enjambre/offline` para persistencia local
- Middleware con Supabase session + graceful error handling
- Optimizado para uso tactil en terreno

### 4.4 API (Hono)

```bash
pnpm --filter @enjambre/api dev
pnpm --filter @enjambre/api build
```

- Middleware: auth → tenant → route
- Usa `@enjambre/contable` para calculos tributarios
- Nunca Service Role Key para operaciones de usuario

### 4.5 EIRL (Next.js + Prisma)

```bash
pnpm --filter @enjambre/eirl dev
pnpm --filter @enjambre/eirl build
```

- **Independiente**: SQLite + Prisma + NextAuth
- No tocar si no es para contabilidad especifica

---

## 5. Estetica "Premium Editorial"

Si se te pide crear una nueva pagina:

### Checklist Visual
- [ ] Tipografia `font-display` (Cormorant Garamond) para titulos grandes
- [ ] Espaciado generoso (whitespace = lujo)
- [ ] Capa de textura (GrainOverlay) si es pagina publica
- [ ] Efectos hover suaves y elegantes
- [ ] Dark mode por defecto
- [ ] Transiciones entre secciones (GSAP/Framer Motion)
- [ ] Mobile-first responsive
- [ ] No parece un MVP generico

### Componentes Premium Reutilizables
- **GrainOverlay**: Textura de grano sobre secciones hero
- **AnimatedCounter**: Contadores con animacion GSAP
- **ParallaxSection**: Secciones con parallax suave
- **PageTransition**: Transiciones entre paginas (futura)

---

## 6. Anti-patrones de Agentes (Prohibido)

| Accion | Alternativa |
|---|---|
| Crear 10 archivos de golpe | Crear 1-2 archivos, verificar, continuar |
| Refactorizar sin que te lo pidan | Solo refactorizar si afecta tu cambio |
| Agregar dependencias nuevas | Verificar que no exista ya en el workspace |
| Escribir tests sin framework configurado | Verificar `vitest`/`playwright` existe primero |
| Usar `fetch` directo para Supabase | Usar el cliente `@supabase/supabase-js` |
| Crear componentes en la raiz | `packages/ui` o `apps/*/components` |
| Hardcodear textos en componentes | Tabla `site_content` o constantes |
| Ignorar el build | Siempre `pnpm --filter @enjambre/app build` al final |

---

## 7. Protocolo de Verificacion

Despues de cada cambio:

```bash
# 1. Build de la app afectada
pnpm --filter @enjambre/<app> build

# 2. Si tocaste packages/, build de todo
pnpm build

# 3. Si tocaste migraciones, verificar tipos
cd packages/database && pnpm db:typegen

# 4. Si tocaste contable, verificar schemas
pnpm --filter @enjambre/api build
```

---

## 8. Comunicacion con el Operador

Cuando informes sobre un cambio completado, usa este formato:

```
ARCHIVO: ruta/al/archivo.tsx
CAMBIO: Descripcion breve de que se hizo
POR QUE: Contexto de la decision
IMPACTO: Que apps/funcionalidades se ven afectadas
VERIFICADO: build exitoso / pendiente verificacion
```

---

*Este documento es dinamico. Actualizar cuando se adopten nuevas tecnologias, patrones o convenciones.*
*Ultima actualizacion: Mayo 2026*
