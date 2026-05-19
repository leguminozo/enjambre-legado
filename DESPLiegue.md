# 🚀 Guía de Despliegue - Enjambre Legado

## Resumen Ejecutivo

| App | Qué es | Dónde desplegar | Estado |
|-----|--------|-----------------|---------|
| `apps/tienda` | Frontend público (e-commerce) | Vercel | ✅ Listo |
| `apps/nucleo` | Dashboard unificado (ERP) | Vercel | ✅ Listo |
| `apps/api` | Backend unificado (Hono) | Railway | ⏳ Pendiente |
| `apps/campo` | PWA offline-first | Vercel | ✅ Listo |

---

## 1️⃣ Desplegar API en Railway (CRÍTICO)

La API **NO** puede ir a Vercel porque es Node.js puro (Hono), no Next.js.

### Pasos:

```bash
# 1. Crear cuenta en Railway
https://railway.app/dashboard

# 2. Nuevo proyecto
# - Deploy from GitHub repo
# - Seleccionar: oyz-app

# 3. Configurar variables de entorno:
SUPABASE_URL=https://hdhamxiblwwskvvqbcfo.supabase.co
SUPABASE_ANON_KEY=sb_publishable_sqF0fBsTuNzSKgpapPrU3Q_VUf0s-A1
PORT=3001

# 4. Build & Start commands:
# Build: npm install && npm run build
# Start: npm run start
```

### URLs después del deploy:

```
Producción: https://api-obrerayzangano.railway.app
Desarrollo: http://localhost:3001
```

### Endpoints clave:

```
/api/tienda/products      → Productos CRUD
/api/tienda/orders        → Pedidos
/api/tienda/customers     → Clientes
/api/tienda/dashboard     → Métricas
/api/contable/dashboard   → Contable
```

---

## 2️⃣ Desplegar Nucleo en Vercel

Nucleo es un dashboard unificado (sin roles, todo visible).

### Pasos:

```bash
# 1. Ir a Vercel Dashboard
https://vercel.com/dashboard

# 2. Importar repositorio
# - Root: apps/nucleo

# 3. Variables de entorno (Vercel > Settings > Environment Variables)
VITE_SUPABASE_URL=https://hdhamxiblwwskvvqbcfo.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_sqF0fBsTuNzSKgpapPrU3Q_VUf0s-A1
VITE_API_URL=https://api-obrerayzangano.railway.app  # ← URL de Railway

# 4. Deploy
```

### URL después del deploy:

```
Producción: https://nucleo.obrerayzangano.com
Desarrollo: http://localhost:3001
```

---

## 3️⃣ Desplegar Tienda en Vercel

Tienda es solo frontend público (sin admin).

### Pasos:

```bash
# 1. Vercel Dashboard
# - Root: apps/tienda

# 2. Variables:
NEXT_PUBLIC_SUPABASE_URL=https://hdhamxiblwwskvvqbcfo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_sqF0fBsTuNzSKgpapPrU3Q_VUf0s-A1

# 3. Deploy
```

### URL:

```
Producción: https://obrerayzangano.com
Desarrollo: http://localhost:3000
```

---

## 4️⃣ Desplegar Campo en Vercel

Campo es PWA offline-first para trabajo en terreno.

### Pasos:

```bash
# Root: apps/campo
# Mismas vars que Nucleo
```

---

## 📊 Arquitectura Final

```
┌─────────────────────────────────────────────┐
│              USUARIO                        │
└──────────────────┬──────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Tienda  │  │ Nucleo  │  │ Campo   │
│ (Vercel)│  │ (Vercel)│  │ (Vercel)│
└────┬────┘  └────┬────┘  └────┬────┘
     │           │           │
     └───────────┼───────────┘
                 │
                 ▼
         ┌───────────────┐
         │    API        │
         │  (Railway)    │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │  Supabase     │
         │  (Postgres)   │
         └───────────────┘
```

---

## 🔧 Comandos Útiles

### Desarrollo Local

```bash
# API (puerto 3001)
cd apps/api
pnpm dev

# Nucleo (puerto 3002)
cd apps/nucleo
pnpm dev

# Tienda (puerto 3000)
cd apps/tienda
pnpm dev
```

### Build

```bash
# Todo el monorepo
pnpm build

# Solo una app
pnpm --filter @enjambre/api build
pnpm --filter @enjambre/nucleo build
pnpm --filter @enjambre/tienda build
```

---

## ✅ Checklist Pre-Despliegue

### API (Railway)
- [ ] Variables de entorno configuradas
- [ ] Base de datos Supabase conectada
- [ ] Health check responde (`/api/health`)
- [ ] Endpoints de tienda funcionan
- [ ] CORS configurado

### Nucleo (Vercel)
- [ ] API_URL apunta a Railway
- [ ] Supabase configurado
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] Tienda panel funciona

### Tienda (Vercel)
- [ ] Supabase configurado
- [ ] Checkout funciona
- [ ] Catálogo visible
- [ ] Sin admin (solo frontend)

---

## 🔗 URLs Finales

| Servicio | URL | Estado |
|----------|-----|--------|
| Tienda | https://obrerayzangano.com | ⏳ |
| Nucleo | https://nucleo.obrerayzangano.com | ⏳ |
| API | https://api-obrerayzangano.railway.app | ⏳ |
| Campo | https://campo.obrerayzangano.com | ⏳ |

---

**Siguiente paso:** Desplegar API en Railway primero.
