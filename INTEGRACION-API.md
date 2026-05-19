# ✅ API Integrada en Nucleo (sin Railway)

## Cambio de Arquitectura

**ANTES:**
```
apps/nucleo → apps/api (Hono en Railway) → Supabase
```

**AHORA:**
```
apps/nucleo → API Routes (Next.js) → Supabase
```

## Ventajas

- ✅ Mismo deploy (Vercel)
- ✅ Mismo código (TypeScript)
- ✅ Mismas vars de entorno
- ✅ Sin fragmentación
- ✅ Más simple
- ✅ Todo junto

## Endpoints Creados

### `/api/tienda/products`
- `GET` - Listar productos
- `POST` - Crear producto
- `PATCH` - Actualizar producto
- `DELETE` - Eliminar producto

### `/api/tienda/orders`
- `GET` - Listar pedidos
- `PATCH` - Actualizar estado

### `/api/tienda/customers`
- `GET` - Listar clientes

### `/api/tienda/dashboard`
- `GET` - Métricas del dashboard

## Archivos Creados

```
apps/nucleo/src/app/api/
├── tienda/
│   ├── products/route.ts
│   ├── orders/route.ts
│   ├── customers/route.ts
│   └── dashboard/route.ts
```

## Uso en el Frontend

```typescript
// Productos
fetch('/api/tienda/products')

// Pedidos
fetch('/api/tienda/orders')

// Clientes
fetch('/api/tienda/customers')

// Dashboard
fetch('/api/tienda/dashboard')
```

## Deploy

Todo va a Vercel:

```bash
# Nucleo (con API routes incluidas)
cd apps/nucleo
pnpm build
pnpm deploy
```

## ¿Qué pasó con apps/api?

Se puede:
1. **Eliminar** (recomendado)
2. **Mantener** como backup
3. **Migrar** la lógica contable y de creadores

## Siguientes Pasos

1. Mover contable a API routes
2. Mover creadores a API routes
3. Eliminar apps/api
4. Deploy a Vercel

---

**Estado:** ✅ Completado  
**Fecha:** 2026-05-19
