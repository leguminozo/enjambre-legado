# API de Tienda - Endpoints

## Productos

### GET /api/tienda/products
Obtener todos los productos

```bash
curl http://localhost:3001/api/tienda/products
```

### POST /api/tienda/products
Crear producto

```bash
curl -X POST http://localhost:3001/api/tienda/products \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Miel de Ulmo",
    "descripcion_regenerativa": "Miel cosechada en bosques nativos",
    "precio": 8990,
    "stock": 100,
    "formato": "500g",
    "visible": true,
    "fotos": ["https://ejemplo.com/foto.jpg"]
  }'
```

### PATCH /api/tienda/products/:id
Actualizar producto

```bash
curl -X PATCH http://localhost:3001/api/tienda/products/UUID \
  -H "Content-Type: application/json" \
  -d '{
    "precio": 9990,
    "stock": 50
  }'
```

### DELETE /api/tienda/products/:id
Eliminar producto

```bash
curl -X DELETE http://localhost:3001/api/tienda/products/UUID
```

## Pedidos

### GET /api/tienda/orders
Obtener todos los pedidos

### PATCH /api/tienda/orders/:id
Actualizar estado de pedido

```bash
curl -X PATCH http://localhost:3001/api/tienda/orders/UUID \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "enviado"
  }'
```

## Clientes

### GET /api/tienda/customers
Obtener lista de clientes

## Dashboard

### GET /api/tienda/dashboard
Obtener métricas del dashboard
