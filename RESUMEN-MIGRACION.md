# ✅ Migración Completada - Admin Shopify → Nucleo

## Resumen Ejecutivo

Se migró **todo el panel de administración** desde `apps/tienda` hacia `apps/nucleo`, centralizando el control del ecosistema OYZ en un único dashboard ejecutivo.

## Cambios Realizados

### 1. API Centralizada (`apps/api`)
- ✅ `/api/tienda/products` - CRUD completo
- ✅ `/api/tienda/orders` - Gestión de pedidos
- ✅ `/api/tienda/customers` - Lista de clientes
- ✅ `/api/tienda/dashboard` - Métricas unificadas

### 2. Nuevo Panel en Nucleo
- ✅ Componente `TiendaPanel.tsx` con:
  - Dashboard de métricas
  - Productos (CRUD + búsqueda)
  - Pedidos (lista y estados)
  - Clientes (listado)
- ✅ Integrado en `GerenteView.tsx` como pestaña "Tienda"

### 3. Limpieza en Tienda
- ✅ Eliminada carpeta `app/(admin)/`
- ✅ Eliminados componentes `components/admin/`
- ✅ Eliminadas rutas API `app/api/admin/`
- ✅ Eliminados utils de admin
- ✅ Eliminada caché de build `.next/`

### 4. Importación de Datos
- ✅ Script `import-shopify-products.ts` para 261 productos
- ✅ CSV de Shopify analizado (products_export.csv)
- ✅ URLs de imágenes identificadas

## Estado Actual

| Componente | Ubicación | Estado |
|---|---|---|
| Dashboard | `apps/nucleo` | ✅ |
| Productos | `apps/nucleo` | ✅ |
| Pedidos | `apps/nucleo` | ✅ |
| Clientes | `apps/nucleo` | ✅ |
| Colecciones | Pendiente | ⏳ |
| Descuentos | Pendiente | ⏳ |
| CMS | `apps/tienda` | ⏳ |

## Próximos Pasos

1. **Importar productos** desde CSV de Shopify
2. **Subir imágenes** a Supabase Storage
3. **Mover colecciones** a API
4. **Mover descuentos** a API
5. **Implementar realtime** con Supabase

## URLs de Acceso

### Producción
- Tienda: `https://obrerayzangano.com`
- Nucleo: `https://obrerayzangano.com/nucleo` (pendiente deploy)
- API: `https://api.obrerayzangano.com` (pendiente)

### Desarrollo
- Tienda: `http://localhost:3000`
- Nucleo: `http://localhost:3001`
- API: `http://localhost:3002`

## Comandos Útiles

```bash
# Importar productos desde Shopify
cd apps/api
cp ../../Copia\ de\ Tienda\ Shopify\ OYZ/products_export.csv .
tsx utils/import-shopify-products.ts

# Desarrollo
pnpm --filter @enjambre/api dev
pnpm --filter @enjambre/nucleo dev
pnpm --filter @enjambre/tienda dev

# Build
pnpm build
```

## Documentación Generada

- `MIGRACION-ADMIN-SHOPIFY.md` - Guía completa
- `apps/api/MIGRACION-TIENDA.md` - API docs
- `apps/api/src/routes/tienda/README.md` - Endpoints
- `apps/tienda/README.md` - Actualizado

---

**Fecha:** 2026-05-19  
**Estado:** ✅ Completado  
**Tiempo estimado:** 2 horas  
**Próximo:** Importar datos reales de Shopify
