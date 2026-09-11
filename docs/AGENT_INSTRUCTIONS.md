# Agent Instructions Guide — Enjambre Legado

> Guia maestra para cualquier Agente de IA (Claude, Cursor, Trae, Windsurf, Gemini, Copilot) que opere en este repositorio.
> **Lee esto completo antes de escribir una sola linea de codigo.**

---

## 0. Lectura Obligatoria Previa

Antes de CUALQUIER accion, lee estos archivos en orden:

1. `docs/README.md` — qué es ley, qué es foto vieja, qué doc usar
2. `docs/REPO_MAP.md` + `docs/GLOSSARY.md` + `docs/DOMAINS.md`
3. `docs/CONSTITUTION.md` + `system_invariants.md` + `docs/TRUST.md`
4. Este archivo — reglas de operacion
5. Corte: `CROSS_APP` / `MONEY_PATH` / `PRODUCTION` / `CAMPO_OFFLINE` / `DATABASE_SCHEMA` / spec del dueño
6. `docs/NUCLEO_CHILOE.md` — si tocas el módulo territorial apícola

Si no entiendes la Constitucion, no escribas codigo. `MASTER_PLAN.md` es un SNAPSHOT de junio 2026: no es el mapa.

**Presupuesto de plataforma (ago 2026):** Vercel Hobby + un Supabase Free. Tres apps, un Postgres, cero cuarto deploy. Lecturas publicas = ISR/Dexie/CDN. `next/image` = `cdn-image-loader` (no optimizer de Vercel). Crons solo diarios. Realtime no es default. `SECURITY DEFINER` no es atajo. Hobby es non-commercial: $0 es pista, no licencia. Ley: `docs/CONSTITUTION.md` § II.6 y `system_invariants.md` Ley VI.

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

### E. Superficie de Usuario Limpia (Cero Fuga Técnica)

**Regla Inviolable**: Las interfaces dirigidas a usuarios finales, clientes y operadores (Tienda, POS Campo, Perfil, Checkout, Trazabilidad) deben comunicar valor claro, confianza y diseño de alta calidad. Queda terminantemente prohibido exponer detalles de implementación, nombres de scripts o jerga interna de ingeniería.

| Prohibido en UI | Reemplazar por |
|---|---|
| Nombres de scripts de migración (`46_stock_lote_sync.sql`) | Descripción funcional del beneficio ("Sincronización automática de inventario") |
| Comandos de consola (`pnpm db:push`, `git pull`) | Indicación clara de acción ("Actualizar sistema", "Reintentar operación") |
| Hashes criptográficos crudos (`SHA-256`, `0x4f8...`) | "Sello de autenticidad digital", "Código único de registro" |
| Jerga blockchain técnica (`On-Chain`, `Bloque Confirmado`) | "Registro oficial verificado", "Certificación digital de origen" |
| Identificadores internos (`UUID`, `table_name_id`) | Códigos de referencia legibles ("N° de Pedido", "Lote #123") |
| Mensajes de error crudos de base de datos | Mensajes claros y orientados a la solución (`friendlyError()`, `toast.error('No fue posible completar la operación...')`) |

Cualquier texto que provenga de una base de datos o API que pueda contener trazas técnicas debe ser sanitizado antes de su renderizado con `humanizeTechnicalPhrase` de `@enjambre/ui`.

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
- La funcion `is_admin()` checkea si el usuario es admin.
- La funcion `has_empresa_access()` checkea acceso multi-tenant.

```sql
-- Patron RLS estandar
CREATE POLICY "Usuario ve solo sus datos"
  ON colmenas FOR SELECT
  TO authenticated
  USING (
    current_role() = 'admin'
    OR user_id = auth.uid()
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
      .eq('user_id', profile!.id),
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

### 4.2 Nucleo (Next.js 16 App Router)

```bash
pnpm --filter @enjambre/nucleo dev
pnpm --filter @enjambre/nucleo build
```

- Next.js 16 App Router para rutas y BFF (Hono)
- TanStack Query para datos remotos
- Zustand para estado global
- Leaflet para mapas

### 4.3 Campo (Next.js 16)

```bash
pnpm --filter @enjambre/campo dev
pnpm --filter @enjambre/campo build
```

- Offline: Dexie en `apps/campo/src/lib/offline/` — canónico `docs/CAMPO_OFFLINE.md`. **No existe** `@enjambre/offline`.
- Middleware con Supabase session + graceful error handling
- Optimizado para uso tactil en terreno



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
