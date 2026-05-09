# Manifiesto de Base de Datos (Esquema Canónico)

Este documento detalla las tablas principales y la lógica de datos de **Enjambre Legado**.

## 1. Núcleo de Identidad (`profiles`)
La tabla maestra que define quién es quién en el ecosistema.

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | UUID | Referencia a `auth.users`. |
| `role` | Enum | `apicultor`, `vendedor`, `gerente`, `logistica`, `marketing`, `cliente`, `tienda_admin`. |
| `full_name` | Text | Nombre completo para visualización. |
| `nivel_guardian` | Text | Nivel en el programa de fidelización. |

---

## 2. Estructura Apícola
Gestiona el origen físico del néctar.

### `apiarios`
Ubicaciones geográficas de las colmenas. Utiliza **PostGIS**.
- `ubicacion`: Point (geography) para mapas.
- `sector`: Descripción del entorno (bosque, pradera, etc.).

### `colmenas`
La unidad de producción básica.
- `estado`: `optima`, `atencion`, `riesgo`.
- `blockchain_hash`: Identificador único para trazabilidad.
- `lote_activo`: Vínculo con la producción actual.

### `cosechas` y `lotes`
- Una `cosecha` pertenece a una colmena en una fecha dada.
- Un `lote` agrupa múltiples cosechas para su procesamiento y venta.

---

## 3. Capa Comercial (`productos`, `ventas`)

### `productos`
Los ítems listados en la tienda.
- `descripcion_regenerativa`: Texto enfocado en el impacto ambiental.
- `lote_id`: Referencia al lote de origen (transparencia total).
- `visible`: Flag para control de catálogo.

### `ventas`
Registra las transacciones.
- `origen`: `web`, `feria`, `local`.
- `arboles_plantados_por_pedido`: Cálculo del impacto ambiental directo.

---

## 4. Gestión Contable y Operativa
- `cashflow`: Registros mensuales de ingresos y egresos.
- `calendario_tasks`: Gestión de tareas semanales por usuario.
- `logistica_envios`: Seguimiento de pedidos con `tracking_code`.

---

## 5. Políticas de Seguridad (RLS)
- **Lectura de Productos**: Pública para todos.
- **Escritura de Productos**: Restringida a `tienda_admin` y `gerente`.
- **Datos de Campo**: Solo visibles para el `apicultor` que los creó o el `gerente`.
- **Ventas**: Los clientes solo ven sus propias compras.
