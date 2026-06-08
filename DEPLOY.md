# Guia de Despliegue — Enjambre Legado

> Despliegue multi-plataforma para el ecosistema completo.
> Cada app es un proyecto Vercel separado con su propio Root Directory.

---

## 1. Prerequisitos

| Herramienta | Version | Proposito |
|---|---|---|
| Node.js | 24.x | Runtime |
| pnpm | 10.32.1 | Gestor de paquetes |
| Vercel CLI | Ultima | Despliegue |
| Supabase CLI | Ultima | Migraciones locales |

---

## 2. Configuracion de Supabase (Primera vez)

### 2.1 Variables de Entorno

Copiar desde Supabase > Settings > API:

| Variable | Donde se usa |
|---|---|
| `SUPABASE_URL` | Todas las apps |
| `SUPABASE_ANON_KEY` o `PUBLISHABLE_DEFAULT_KEY` | Todas las apps (cliente) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo server-side (tienda API routes, BFF) |

### 2.2 Migraciones

```bash
# Push del esquema completo a Supabase
cd packages/database
pnpm db:push

# Regenerar tipos TypeScript
pnpm db:typegen
```

### 2.3 Storage Buckets

Los buckets se crean en la migracion `02_storage_buckets.sql`:
- `colmenas` — Fotos de colmenas (privado)
- `productos` — Imagenes de productos (publico)
- `arboles` — Fotos de arboles plantados (publico)
- `fuentes` — Documentos fuente (restringido)

---

## 3. Despliegue por App

### 3.1 Nucleo (Next.js)

| Config | Valor |
|---|---|
| **Root Directory** | `apps/nucleo` |
| **Framework** | Next.js |
| **Node.js** | 24.x |
| **Install Command** | `cd ../.. && npx pnpm@10.32.1 install --frozen-lockfile` |
| **Build Command** | `cd ../.. && npx pnpm@10.32.1 exec turbo run build --filter=@enjambre/nucleo` |
| **Output** | Default (Next / `.next`) |

**Variables**:
| Clave | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hdhamxiblwwskvvqbcfo.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only (para BFF) |

### 3.2 Tienda (Next.js)

| Config | Valor |
|---|---|
| **Root Directory** | `apps/tienda` |
| **Framework** | Next.js |
| **Node.js** | 24.x |
| **Install Command** | `cd ../.. && npx pnpm@10.32.1 install --frozen-lockfile` |
| **Build Command** | `cd ../.. && npx pnpm@10.32.1 exec turbo run build --filter=@enjambre/tienda` |
| **Output** | Default (Next / `.next`) |

**Variables**:
| Clave | Obligatoria | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Si | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Una de dos | JWT anon |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Una de dos | Clave publishable |
| `NEXT_PUBLIC_SITE_URL` | No | URL canonica del sitio |
| `TRANSBANK_COMMERCE_CODE` | Si | Server-only |
| `TRANSBANK_API_KEY` | Si | Server-only |
| `SUPABASE_SERVICE_ROLE_KEY` | Si | Server-only, para API routes |
| `SII_*`, `BANK_*`, `NOTIFY_*` | No | Integraciones (modo stub si faltan) |
| `INTEGRATIONS_CRON_SECRET` | No | Para cron futuro |

**Rutas**: `/` landing, `/catalogo`, `/impacto`, `/login`, `/dashboard`, `/products`, `/orders`, `/customers`, `/collections`

### 3.3 Campo (Next.js)

| Config | Valor |
|---|---|
| **Root Directory** | `apps/campo` |
| **Framework** | Next.js |
| **Node.js** | 24.x |
| **Install Command** | `cd ../.. && npx pnpm@10.32.1 install --frozen-lockfile` |
| **Build Command** | `cd ../.. && npx pnpm@10.32.1 exec turbo run build --filter=@enjambre/campo` |
| **Output** | Default (Next / `.next`) |

**Variables**:
| Clave | Obligatoria |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Si |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Una de dos |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Una de dos |

**Troubleshooting**: Si ves `500 MIDDLEWARE_INVOCATION_FAILED`, verificar que las variables `NEXT_PUBLIC_SUPABASE_*` existen. El middleware actual reescribe a `/setup-error` en vez de crashear.

### 3.4 EIRL (Absorbido por Nucleo)

Las vistas de contabilidad EIRL fueron absorbidas por nucleo. Se encuentran en `apps/nucleo/src/views/eirl/`. No existe una app `apps/eirl` independiente.

---

## 4. Post-Despliegue

### 4.1 Verificacion por App

**Nucleo**:
- [ ] Login funciona y redirige por rol
- [ ] Mapa carga con apiarios
- [ ] BFF health checks responden
- [ ] Dashboard contable retorna datos

**Tienda**:
- [ ] Landing carga con estetica premium
- [ ] Catalogo muestra productos
- [ ] Checkout completo con Transbank (sandbox primero)
- [ ] Admin dashboard accesible con rol admin

**Campo**:
- [ ] Login funciona
- [ ] POS catalogo + carrito funcionan
- [ ] API `/api/pos/venta` responde correctamente

### 4.2 Integracion Cross-App

Despues de desplegar nucleo, tienda y campo:

1. Copiar URLs `*.vercel.app` de cada proyecto
2. Configurar segun sea necesario en cada app
3. Redeploy si hay cambios en variables de entorno

---

## 5. Rollback

### Vercel
```bash
# Listar deployments
vercel ls

# Rollback a deployment anterior
vercel rollback [deployment-url]
```

### Supabase
```bash
# Las migraciones son acumulativas. Para revertir:
# 1. Crear migracion nueva que deshaga el cambio
# 2. NO eliminar migraciones pasadas
```

---

## 6. Monitoreo

| App | Donde ver logs |
|---|---|
| Tienda | Vercel Dashboard > Functions/Logs |
| Nucleo | Vercel Dashboard > Functions/Logs |
| Campo | Vercel Dashboard > Functions/Logs |
| Supabase | Supabase Dashboard > Logs > Postgres/Auth/API |
| Transbank | Transbank Portal > Comercio |

---

## 7. Checklist Pre-Produccion

- [ ] Todas las variables de entorno configuradas
- [ ] Migraciones aplicadas (`pnpm db:push`)
- [ ] Storage buckets creados (migracion 02)
- [ ] RLS verificado para todas las tablas
- [ ] Transbank en modo produccion (no sandbox)
- [ ] Service Worker testeado en multiples navegadores
- [ ] Lighthouse score > 80 en mobile
- [ ] Test de flujo de compra completo
- [ ] Test de login/logout con multiples roles
- [ ] Service Role Key nunca en cliente

---

*Para detalles especificos de Vercel, ver `VERCEL.md`.*
*Ultima actualizacion: Junio 2026*
