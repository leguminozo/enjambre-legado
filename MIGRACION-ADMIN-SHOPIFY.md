# 🍯 Migración Admin Shopify → Nucleo

## ✅ Completado

### 1. API Centralizada en `apps/api`

**Rutas implementadas:**
- `/api/tienda/products` (GET, POST, PATCH, DELETE)
- `/api/tienda/orders` (GET, PATCH)
- `/api/tienda/customers` (GET)
- `/api/tienda/dashboard` (GET)

**Archivos creados:**
- `apps/api/src/routes/tienda/index.ts` - Rutas principales
- `apps/api/src/routes/tienda/README.md` - Documentación
- `apps/api/utils/import-shopify-products.ts` - Script importación CSV
- `apps/api/MIGRACION-TIENDA.md` - Guía de migración

### 2. Panel de Tienda en Nucleo

**Componente creado:**
- `apps/nucleo/src/components/tienda/TiendaPanel.tsx`

**Funcionalidades:**
- ✅ Dashboard con métricas (ventas, productos, inventario)
- ✅ Productos CRUD (crear, leer, actualizar, eliminar)
- ✅ Pedidos (lista y estados)
- ✅ Clientes (listado)
- ✅ Búsqueda y filtros
- ✅ Formulario de edición inline

**Vista integrada en:**
- `apps/nucleo/src/views/GerenteView.tsx` - Nueva pestaña "Tienda"

### 3. Importación de Shopify

**Datos disponibles:**
- 261 productos en `products_export.csv`
- 16 pedidos en `orders_export.csv`
- URLs de imágenes de Shopify CDN

**Script de importación:**
```bash
cd apps/api
tsx utils/import-shopify-products.ts
```

## 📊 Comparación Shopify vs Implementación Actual

| Feature | Shopify Admin | Nucleo Admin |
|---|---|---|
| Productos | ✅ | ✅ |
| Inventario | ✅ | ✅ |
| Pedidos | ✅ | ✅ |
| Clientes | ✅ | ✅ |
| Colecciones | ✅ | ⏳ Pendiente |
| Descuentos | ✅ | ⏳ Pendiente |
| Analytics | ✅ | ✅ (básico) |
| Dashboard | ✅ | ✅ (más completo) |

## 🎯 Arquitectura Final

```
┌─────────────────────────────────────────────┐
│              NUCLEO (Vite + React)           │
│  ┌─────────────────────────────────────┐    │
│  │  Gerente View                        │    │
│  │  ├─ Dashboard Ejecutivo              │    │
│  │  ├─ Tienda (Productos/Pedidos)      │    │
│  │  ├─ Vanguardia (Seguridad)          │    │
│  │  └─ Creadores (Red)                 │    │
│  └─────────────────────────────────────┘    │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│          API (Hono + Node)                  │
│  /api/tienda/*                              │
│  /api/contable/*                            │
│  /api/creadores/*                           │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Supabase (Postgres)                 │
│  - productos                                │
│  - ventas                                   │
│  - profiles                                 │
│  - cashflow                                 │
└─────────────────────────────────────────────┘
```

## 📝 Próximos Pasos

### Fase 1: Completar Migración
- [ ] Mover colecciones a API
- [ ] Mover descuentos a API
- [ ] Mover contenido (CMS) a API
- [ ] Eliminar `/api/admin/*` de `apps/tienda`

### Fase 2: Mejoras
- [ ] Supabase Realtime para sync en vivo
- [ ] Importar imágenes de Shopify CDN
- [ ] Subida de imágenes a S3/Supabase Storage
- [ ] Variantes de productos
- [ ] Inventario por ubicación

### Fase 3: Avanzado
- [ ] Reportes PDF/Excel
- [ ] Email de notificaciones
- [ ] Integración SII (facturación)
- [ ] Sync con MercadoLibre

## 🚀 Comandos Útiles

### API
```bash
cd apps/api
pnpm dev  # Puerto 3001
```

### Nucleo
```bash
cd apps/nucleo
pnpm dev
```

### Importar Productos
```bash
cp Copia\ de\ Tienda\ Shopify\ OYZ/products_export.csv apps/api/
cd apps/api
tsx utils/import-shopify-products.ts
```

## 📸 Capturas de Referencia

Las capturas originales de Shopify están en:
- `Copia de Tienda Shopify OYZ/Capturas tienda oyz/`
- `Copia de Tienda Shopify OYZ/Admin Shopify/`

**Secciones documentadas:**
1. Dashboard principal
2. Lista de productos
3. Editor de producto
4. Gestión de inventario
5. Lista de pedidos
6. Detalle de pedido
7. Base de clientes
8. Analytics

## 🎨 Diseño System

El diseño de Nucleo sigue la línea de Shopify pero con identidad propia:

- **Header sticky** con navegación por tabs
- **Cards** con sombra y border suave
- **Tablas** limpias con hover states
- **Formularios** inline con validación
- **Botones** dorados (gold) para acciones principales
- **Iconos** Lucide React

---

**Estado:** ✅ Migración completada en un 80%
**Próximo:** Eliminar admin de `apps/tienda`
**Fecha:** 2026-05-19
