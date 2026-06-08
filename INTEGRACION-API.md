# API Integrada en Nucleo (sin Railway)

## Cambio de Arquitectura

**ANTES:**
```
apps/nucleo → apps/api (Hono en Railway) → Supabase
```

**AHORA:**
```
apps/nucleo (Next.js 16) → API Routes (Hono BFF) → Supabase
```

Las rutas BFF viven en `apps/nucleo/src/app/api/[[...routes]]/route.ts`. El directorio `apps/api` nunca existio en el codebase actual — toda la funcionalidad BFF fue implementada directamente dentro de nucleo.

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

## Archivos

```
apps/nucleo/src/app/api/
├── [[...routes]]/
│   └── route.ts          # Hono BFF entrypoint
├── tienda/
│   ├── products/route.ts
│   ├── orders/route.ts
│   ├── customers/route.ts
│   └── dashboard/route.ts
├── banco-chile/          # Banco Chile integration
├── contable/             # Contable endpoints
└── security-events/      # Security event logging
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

## Que paso con apps/api?

`apps/api` fue un plano arquitectonico que nunca se implemento como app independiente. Toda la logica BFF se integro directamente en nucleo via Next.js API Routes + Hono. No existe directorio `apps/api` en el codebase.

## Siguientes Pasos

1. ✅ Mover contable a API routes (hecho)
2. ✅ Mover creadores a API routes (hecho)
3. ~~Eliminar apps/api~~ (nunca existio como directorio)
4. ✅ Deploy a Vercel (nucleo con BFF incluido)

---

**Estado:** ✅ Completado  
**Fecha:** 2026-05-19
