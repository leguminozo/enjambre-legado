# 🍯 Migración de Administración de Tienda a Nucleo

## Visión General

Como parte de la centralización del panel de control, **todo el admin de tienda** se ha movido desde `apps/tienda` hacia `apps/nucleo`.

### ¿Qué cambió?

| Antes (Tienda) | Ahora (Nucleo) |
|---|---|
| `/api/admin/products` | `/api/tienda/products` |
| `/api/admin/orders` | `/api/tienda/orders` |
| `/dashboard` (admin) | `/tienda` (Nucleo) |
| React + Next.js | React + Vite |

### Arquitectura Actual

```
┌─────────────────────┐     ┌─────────────────────┐
│   apps/nucleo       │     │   apps/tienda       │
│   (ERP/Dashboard)   │     │   (Frontend)        │
│                     │     │                     │
│ - Gestión Productos │     │ - Catálogo público  │
│ - Gestión Pedidos   │     │ - Checkout          │
│ - Clientes          │     │ - Perfil cliente    │
│ - Dashboard         │     │ - Landing pages     │
└─────────┬───────────┘     └─────────┬───────────┘
          │                           │
          └──────────┬────────────────┘
                     │
          ┌──────────▼──────────┐
          │  apps/api (Hono)    │
          │  /api/tienda/*      │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │   Supabase (DB)     │
          │   - productos       │
          │   - ventas          │
          │   - profiles        │
          └─────────────────────┘
```

## Endpoints API

### Productos

```bash
# Listar
GET http://localhost:3001/api/tienda/products

# Crear
POST http://localhost:3001/api/tienda/products
{
  "nombre": "Miel de Ulmo",
  "precio": 8990,
  "stock": 100,
  "formato": "500g",
  "visible": true
}

# Actualizar
PATCH http://localhost:3001/api/tienda/products/:id
{
  "precio": 9990,
  "stock": 50
}

# Eliminar
DELETE http://localhost:3001/api/tienda/products/:id
```

### Pedidos

```bash
# Listar
GET http://localhost:3001/api/tienda/orders

# Actualizar estado
PATCH http://localhost:3001/api/tienda/orders/:id
{
  "estado": "enviado"
}
```

## Importar Productos desde Shopify

1. Copia el CSV de Shopify a `apps/api/products_export.csv`

2. Ejecuta el script:
```bash
cd apps/api
tsx utils/import-shopify-products.ts
```

3. Verifica en Nucleo → Tienda → Productos

## Uso en Nucleo

1. Inicia Nucleo:
```bash
pnpm --filter @enjambre/nucleo dev
```

2. Navega a la pestaada **Tienda**

3. Gestiona:
   - ✅ Productos (CRUD completo)
   - ✅ Pedidos (estados)
   - ✅ Clientes (lista)
   - ✅ Dashboard (métricas)

## Próximos Pasos

- [ ] Mover clientes a API
- [ ] Mover colecciones a API
- [ ] Mover descuentos a API
- [ ] Sync en tiempo real con Supabase Realtime
- [ ] Eliminar admin de apps/tienda
