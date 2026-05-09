# Manifiesto de Base de Datos — Esquema Canonico

> Fuente de verdad: `packages/database/supabase/migrations/`
> Proyecto Supabase: `hdhamxiblwwskvvqbcfo`
> Motor: Postgres 17 + PostGIS + RLS

---

## 0. Configuracion Supabase

| Parametro | Valor |
|---|---|
| Postgres | 17 |
| API Port | 54321 |
| DB Port | 54322 |
| Auth | Habilitado |
| Realtime | Habilitado |
| Storage | Habilitado |
| Email Confirmation | Deshabilitado |
| Signup | Habilitado |

---

## 1. Nucleo de Identidad

### `profiles`

La tabla maestra que define quien es quien en el ecosistema.

| Columna | Tipo | Restriccion | Descripcion |
|---|---|---|---|
| `id` | UUID | PK, FK → `auth.users` | Identidad del usuario |
| `role` | TEXT | NOT NULL | Rol en el ecosistema |
| `full_name` | TEXT | - | Nombre completo para visualizacion |
| `nivel_guardian` | TEXT | - | Nivel en el programa de fidelizacion |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |

**Roles validos**: `apicultor`, `vendedor`, `gerente`, `logistica`, `marketing`, `cliente`, `tienda_admin`

**Funciones helper**:
- `current_role()` → retorna el `role` del `auth.uid()` actual
- `is_gerente()` → booleano si el usuario es gerente

---

## 2. Estructura Apicola

### `apiarios`

Ubicaciones geograficas de las colmenas. Usa **PostGIS**.

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador unico |
| `nombre` | TEXT | Nombre del apiario |
| `ubicacion` | GEOGRAPHY(Point) | Coordenadas para mapas |
| `sector` | TEXT | Descripcion del entorno (bosque, pradera, etc.) |
| `apicultor_id` | UUID FK → profiles | Responsable del apiario |

### `colmenas`

La unidad de produccion basica.

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador unico |
| `apiario_id` | UUID FK → apiarios | Apiario donde vive |
| `estado` | TEXT | `optima`, `atencion`, `riesgo` |
| `blockchain_hash` | TEXT | Identificador unico para trazabilidad |
| `lote_activo` | UUID FK → lotes | Vinculo con la produccion actual |

### `inspecciones`

Registros de inspeccion de colmenas.

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `colmena_id` | UUID FK → colmenas | Colmena inspeccionada |
| `apicultor_id` | UUID FK → profiles | Quien inspecciono |
| `fecha` | DATE | Fecha de inspeccion |
| `observaciones` | TEXT | Notas del apicultor |

### `varroa_records`

Registros de monitoreo de varroa.

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `colmena_id` | UUID FK → colmenas | - |
| `fecha` | DATE | - |
| `nivel_infestacion` | NUMERIC | Porcentaje |

### `peso_records`

Registros de peso de colmenas (monitorizacion remota).

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `colmena_id` | UUID FK → colmenas | - |
| `fecha` | TIMESTAMPTZ | - |
| `peso_kg` | NUMERIC | - |

### `cosechas`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `colmena_id` | UUID FK → colmenas | Colmena de origen |
| `fecha` | DATE | Fecha de cosecha |
| `cantidad_kg` | NUMERIC | Volumen cosechado |

### `lotes`

Agrupa multiples cosechas para procesamiento y venta.

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `nombre` | TEXT | Nombre del lote |
| `fecha_procesamiento` | DATE | - |
| `certificacion` | TEXT | Tipo de certificacion |

### `arboles_plantados`

Impacto regenerativo. Cada pedido planta arboles.

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `especie` | TEXT | Especie del arbol |
| `ubicacion` | GEOGRAPHY(Point) | Donde se planto |
| `fecha_plantacion` | DATE | - |
| `pedido_id` | UUID FK → ventas | Que pedido lo financio |

---

## 3. Capa Comercial

### `productos`

Items listados en la tienda.

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `nombre` | TEXT | Nombre del producto |
| `slug` | TEXT | URL slug (unico cuando visible) |
| `descripcion_regenerativa` | TEXT | Texto enfocado en impacto ambiental |
| `lote_id` | UUID FK → lotes | Lote de origen (trazabilidad total) |
| `precio` | NUMERIC | Precio en CLP |
| `visible` | BOOLEAN | Flag para control de catalogo |
| `imagen_url` | TEXT | URL de imagen principal |

### `clientes`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `user_id` | UUID FK → profiles | Vinculo con usuario autenticado |
| `email` | TEXT | - |
| `telefono` | TEXT | - |
| `direccion` | TEXT | - |

### `ventas`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `cliente_id` | UUID FK → clientes | - |
| `producto_id` | UUID FK → productos | - |
| `cantidad` | INTEGER | - |
| `total` | NUMERIC | Monto total en CLP |
| `origen` | TEXT | `web`, `feria`, `local` |
| `arboles_plantados_por_pedido` | INTEGER | Calculo del impacto ambiental directo |
| `fecha` | TIMESTAMPTZ | - |

### `pedidos_cliente`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `cliente_id` | UUID FK → clientes | - |
| `estado` | TEXT | Estado del pedido |
| `total` | NUMERIC | - |
| `fecha` | TIMESTAMPTZ | - |

---

## 4. Gestion Contable y Operativa

### `cashflow`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `mes` | DATE | Mes del registro |
| `tipo` | TEXT | `ingreso` o `egreso` |
| `monto` | NUMERIC | - |
| `descripcion` | TEXT | - |
| `categoria` | TEXT | Clasificacion |

### `calendario_tasks`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `usuario_id` | UUID FK → profiles | Asignado a |
| `titulo` | TEXT | - |
| `fecha` | DATE | - |
| `completada` | BOOLEAN | - |

### `logistica_envios`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `pedido_id` | UUID FK → pedidos_cliente | - |
| `tracking_code` | TEXT | Codigo de seguimiento |
| `estado` | TEXT | Estado del envio |
| `transportista` | TEXT | - |

### `stock_centers`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `nombre` | TEXT | - |
| `ubicacion` | TEXT | - |

### `proveedores`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `nombre` | TEXT | - |
| `contacto` | TEXT | - |
| `rubro` | TEXT | - |

---

## 5. Capa Contable Multi-Empresa

### `empresas`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `rut` | TEXT | RUT chileno |
| `razon_social` | TEXT | - |
| `giro` | TEXT | - |
| `regimen` | TEXT | PROPYME, etc. |

### `usuarios_empresas`

Tabla pivote para multi-tenancy.

| Columna | Tipo | Descripcion |
|---|---|---|
| `usuario_id` | UUID FK → profiles | - |
| `empresa_id` | UUID FK → empresas | - |
| `rol` | TEXT | Rol dentro de la empresa |

**Funcion helper**: `has_empresa_access(empresa_id)` → verifica acceso del usuario actual

### `periodos_contables`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `empresa_id` | UUID FK → empresas | - |
| `periodo` | DATE | Mes/ano |
| `ingresos_netos` | NUMERIC | - |
| `egresos_netos` | NUMERIC | - |
| `utilidad_bruta` | NUMERIC | - |
| `iva_debito` | NUMERIC | - |
| `iva_credito` | NUMERIC | - |
| `iva_pagar` | NUMERIC | - |
| `ppm_calculado` | NUMERIC | - |

### `facturas_emitidas`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `empresa_id` | UUID FK → empresas | - |
| `tercero_id` | UUID FK → terceros | Cliente/receptor |
| `numero` | TEXT | Numero de factura |
| `fecha_emision` | DATE | - |
| `monto_neto` | NUMERIC | - |
| `iva` | NUMERIC | 19% |
| `total` | NUMERIC | - |

### `gastos`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `empresa_id` | UUID FK → empresas | - |
| `categoria` | TEXT | - |
| `monto` | NUMERIC | - |
| `fecha` | DATE | - |

### `impuestos`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `empresa_id` | UUID FK → empresas | - |
| `periodo_id` | UUID FK → periodos_contables | - |
| `tipo` | TEXT | IVA, PPM, Primera Categoria, etc. |
| `monto` | NUMERIC | - |

### `terceros`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `empresa_id` | UUID FK → empresas | - |
| `rut` | TEXT | RUT chileno |
| `nombre` | TEXT | - |
| `tipo` | TEXT | cliente, proveedor, ambos |

---

## 6. Marketing y CMS

### `marketing_campaigns`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `nombre` | TEXT | - |
| `tipo` | TEXT | Tipo de campana |
| `estado` | TEXT | Activa, pausada, finalizada |
| `fecha_inicio` | DATE | - |
| `fecha_fin` | DATE | - |

### `marketing_posts`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `campana_id` | UUID FK → marketing_campaigns | - |
| `contenido` | TEXT | - |
| `red_social` | TEXT | Instagram, Facebook, etc. |
| `fecha_publicacion` | TIMESTAMPTZ | - |

### `eventos`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `titulo` | TEXT | - |
| `descripcion` | TEXT | - |
| `fecha` | TIMESTAMPTZ | - |
| `ubicacion` | TEXT | - |

### `tickets_fidelizacion`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `cliente_id` | UUID FK → clientes | - |
| `puntos` | INTEGER | - |
| `concepto` | TEXT | - |
| `fecha` | TIMESTAMPTZ | - |

### `site_content`

CMS para contenido dinamico de la landing.

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `seccion` | TEXT | Identificador de seccion |
| `clave` | TEXT | Clave del contenido |
| `contenido` | JSONB | Datos del contenido (texto, imagenes, etc.) |
| `orden` | INTEGER | Orden de visualizacion |
| `activo` | BOOLEAN | - |

**Secciones**: `servicios`, `talleres`, `colecciones`, `footer_branding`, `footer_nav`, `footer_legal`

---

## 7. Ingesta de Datos Externos

### `source_files`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `empresa_id` | UUID FK → empresas | - |
| `tipo` | TEXT | boleta, cartola, etc. |
| `archivo_url` | TEXT | URL del archivo subido |
| `estado` | TEXT | pendiente, procesado, error |

### `boletas_ingest`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `source_file_id` | UUID FK → source_files | - |
| `datos` | JSONB | Datos extraidos de la boleta |
| `procesado` | BOOLEAN | - |

### `bank_movements`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `source_file_id` | UUID FK → source_files | - |
| `fecha` | DATE | - |
| `descripcion` | TEXT | - |
| `monto` | NUMERIC | - |
| `tipo` | TEXT | credito, debito |

### `sii_sync_runs`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `empresa_id` | UUID FK → empresas | - |
| `tipo_sync` | TEXT | Tipo de sincronizacion |
| `estado` | TEXT | pendiente, exitoso, error |
| `resultado` | JSONB | - |
| `fecha` | TIMESTAMPTZ | - |

### `notification_events`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `tipo` | TEXT | Tipo de notificacion |
| `destinatario` | TEXT | - |
| `mensaje` | TEXT | - |
| `enviado` | BOOLEAN | - |
| `fecha` | TIMESTAMPTZ | - |

---

## 8. Integraciones

### `integrations`

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `slug` | TEXT | Identificador unico |
| `nombre` | TEXT | Nombre visible |
| `tipo` | TEXT | Categoria |
| `config` | JSONB | Configuracion del servicio |
| `activo` | BOOLEAN | - |

**Seeds**: `boletas`, `bancos`, `sii`, `notificaciones`

### `integration_job_runs`

Audit log de ejecuciones de integraciones.

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `integration_id` | UUID FK → integrations | - |
| `empresa_id` | UUID FK → empresas | - |
| `status` | TEXT | `queued`, `running`, `completed`, `failed` |
| `trigger_type` | TEXT | `manual`, `cron` |
| `input` | JSONB | Datos de entrada |
| `output` | JSONB | Resultado |
| `error` | TEXT | Mensaje de error si fallo |
| `started_at` | TIMESTAMPTZ | - |
| `finished_at` | TIMESTAMPTZ | - |

---

## 9. Storage Buckets

| Bucket | Publico | Acceso |
|---|---|---|
| `colmenas` | No | Apicultor propietario + gerente |
| `productos` | Si | Lectura publica, escritura tienda_admin/gerente |
| `arboles` | Si | Lectura publica |
| `fuentes` | No | Solo gerente + tienda_admin |

---

## 10. Politicas de Seguridad (RLS) — Resumen

| Tabla | Lectura | Escritura |
|---|---|---|
| `profiles` | Propio + gerente | Propio |
| `apiarios` | Apicultor propietario + gerente | Apicultor propietario + gerente |
| `colmenas` | Apicultor propietario + gerente | Apicultor propietario + gerente |
| `productos` | Publico | tienda_admin + gerente |
| `ventas` | Gerente + vendedor | Gerente + vendedor |
| `pedidos_cliente` | Cliente propietario + gerente | Sistema |
| `cashflow` | Gerente | Gerente |
| `calendario_tasks` | Propietario + gerente | Propietario |
| `logistica_envios` | Logistica + gerente | Logistica + gerente |
| `facturas_emitidas` | `has_empresa_access()` | `has_empresa_access()` con rol admin |
| `gastos` | `has_empresa_access()` | `has_empresa_access()` con rol admin |
| `marketing_*` | Marketing + gerente | Marketing + gerente |
| `site_content` | Publico | tienda_admin + gerente |

---

## 11. Diagrama de Relaciones

```
auth.users
  └── profiles (role)
        ├── apiarios (apicultor_id)
        │     └── colmenas (apiario_id)
        │           ├── inspecciones
        │           ├── varroa_records
        │           ├── peso_records
        │           └── cosechas
        │                 └── lotes
        │                       └── productos (lote_id)
        │                             └── ventas (producto_id)
        │                                   └── arboles_plantados
        ├── clientes (user_id)
        │     ├── pedidos_cliente
        │     │     └── logistica_envios
        │     ├── ventas
        │     └── tickets_fidelizacion
        ├── calendario_tasks (usuario_id)
        ├── empresas ← usuarios_empresas → profiles
        │     ├── periodos_contables
        │     ├── facturas_emitidas → terceros
        │     ├── gastos
        │     ├── impuestos
        │     └── sii_sync_runs
        └── marketing_campaigns → marketing_posts
```

---

*Este documento debe actualizarse con cada nueva migracion.*
*Fuente de verdad: `packages/database/supabase/migrations/`*
*Ultima actualizacion: Mayo 2026*
