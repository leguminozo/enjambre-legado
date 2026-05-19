# 🐝 API - Enjambre Legado

Backend unificado para todo el ecosistema OYZ.

## 🚀 Despliegue en Railway

### 1. Preparar Railway

```bash
# 1. Crear proyecto en Railway
# https://railway.app/dashboard

# 2. Conectar repositorio GitHub
# Selecciona: oyz-app/apps/api

# 3. Variables de entorno (Railway Dashboard > Variables)
SUPABASE_URL=https://hdhamxiblwwskvvqbcfo.supabase.co
SUPABASE_ANON_KEY=tu_key_aqui
PORT=3001
```

### 2. Comandos de Build

```bash
# Build Command (Railway)
npm install && npm run build

# Start Command (Railway)
npm run start
```

### 3. Variables de Entorno

```bash
PORT=3001
SUPABASE_URL=https://hdhamxiblwwskvvqbcfo.supabase.co
SUPABASE_ANON_KEY=sb_publishable_sqF0fBsTuNzSKgpapPrU3Q_VUf0s-A1
```

### 4. Endpoints

Una vez desplegado:

```
https://tu-api.railway.app/api/tienda/products
https://tu-api.railway.app/api/tienda/orders
https://tu-api.railway.app/api/tienda/customers
https://tu-api.railway.app/api/tienda/dashboard
https://tu-api.railway.app/api/contable/dashboard
https://tu-api.railway.app/api/creadores/...
```

## 📦 Estructura

```
apps/api/
├── src/
│   ├── routes/
│   │   ├── tienda/        # Tienda (productos, pedidos, clientes)
│   │   ├── contable.ts    # Contabilidad (SII, facturas)
│   │   ├── creadores.ts   # Creadores
│   │   └── health.ts      # Health checks
│   ├── middleware/
│   │   ├── auth.ts        # Auth middleware
│   │   └── tenant.ts      # Multi-tenant
│   └── index.ts           # Entry point
├── utils/
│   └── import-shopify-products.ts  # Importar desde Shopify
└── package.json
```

## 🛠️ Desarrollo Local

```bash
# 1. Instalar dependencias
pnpm install

# 2. Crear .env.local
cp .env.example .env.local

# 3. Agregar variables
SUPABASE_URL=tu_url
SUPABASE_ANON_KEY=tu_key
PORT=3001

# 4. Iniciar
pnpm dev

# API corriendo en http://localhost:3001
```

## 📚 Endpoints

### Tienda

```bash
# Productos
GET    /api/tienda/products
POST   /api/tienda/products
PATCH  /api/tienda/products/:id
DELETE /api/tienda/products/:id

# Pedidos
GET    /api/tienda/orders
PATCH  /api/tienda/orders/:id

# Clientes
GET    /api/tienda/customers

# Dashboard
GET    /api/tienda/dashboard
```

### Contable

```bash
GET    /api/contable/dashboard
POST   /api/contable/facturas-emitidas
```

### Creadores

```bash
GET    /api/creadores
POST   /api/creadores
PATCH  /api/creadores/:id
```

## 🔒 Seguridad

- JWT Auth middleware
- Rate limiting
- CORS configurado
- Validación con Zod

## 📊 Monitoreo

- Health check: `/api/health`
- Logs en Railway Dashboard
- Métricas en Railway Dashboard

## 🔗 URLs

| Ambiente | URL |
|----------|-----|
| Desarrollo | http://localhost:3001 |
| Producción | https://api.obrerayzangano.com (Railway) |

## 📝 Notas

- **No es Next.js** → Es Hono (Node.js puro)
- **No va a Vercel** → Usar Railway o Render
- **Base de datos** → Supabase (ya configurado)
- **Estado** → Sin estado (stateless)

---

**Enfoque:** Backend unificado para Nucleo, Tienda y Creadores.
