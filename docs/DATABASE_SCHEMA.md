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

**Roles validos**: `admin`, `cliente`, `creador`, `rep_ventas`

> Los roles granulares anteriores (`apicultor`, `vendedor`, `gerente`, `logistica`, `marketing`, `tienda_admin`) fueron consolidados en `admin` via migration 39. Existe `LEGACY_ROLE_MAP` para compatibilidad.

**Funciones helper**:
- `current_role()` → retorna el `role` del `auth.uid()` actual
- `is_admin()` → booleano si el usuario es admin
- `is_gerente()` → booleano si el usuario es gerente (ahora mapea a `role = 'admin'` tras consolidacion)
- `has_empresa_access(empresa_id)` → verifica acceso del usuario actual a una empresa

---

## 2. Estructura Apicola

### `apiarios`

Ubicaciones geograficas de las colmenas. Usa **PostGIS**.

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | Identificador unico |
| `nombre` | TEXT | Nombre del apiario |
| `ubicacion` | GEOGRAPHY(Point) | Coordenadas para mapas |
| `lat` | DOUBLE PRECISION | Latitud decimal (compatibilidad) |
| `lng` | DOUBLE PRECISION | Longitud decimal (compatibilidad) |
| `sector` | TEXT | Descripcion del entorno (bosque, pradera, etc.) |
| `created_by` | UUID FK → profiles | Creador original (legacy) |
| `user_id` | UUID FK → auth.users | Propietario normalizado (migration 20250614) |

**RLS Policies** (migration 20250614):
- SELECT: `user_id = auth.uid() OR created_by = auth.uid() OR public.is_admin()`
- INSERT: `user_id = auth.uid() OR created_by = auth.uid() OR public.is_admin()`
- UPDATE: `user_id = auth.uid() OR created_by = auth.uid() OR public.is_admin()`
- DELETE: `user_id = auth.uid() OR created_by = auth.uid() OR public.is_admin()`

**Nota**: Columna `user_id` agregada en migration 20250614 para normalizar ownership con `arboles_plantados`. Ambas columnas (`user_id` y `created_by`) son soportadas durante transición.

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

### `notification_events` (Historial de eventos enviados / log de entregas)

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | - |
| `channel` | TEXT | email \| whatsapp \| push \| system |
| `recipient` | TEXT | Destinatario (email, whatsapp number, user id, etc.) |
| `subject` | TEXT | Asunto (para email) |
| `body` | TEXT | Contenido del mensaje |
| `status` | TEXT | sent \| error |
| `provider_response` | JSONB | Respuesta del proveedor (Resend, Twilio, etc.) o error |
| `created_by` | UUID FK → profiles | Quién originó el evento (para RLS) |
| `created_at` | TIMESTAMPTZ | - |

**Notas de arquitectura**: 
- Existe tabla separada `notification_queue` para encolado saliente (con attempts, status pending/processing/sent/failed, metadata, RLS solo admin/gerente).
- Existe tabla `alerts` (user_id, title, message, is_read, severity) usada por el BFF de Nucleo para notificaciones in-app de sistema (diferente de events para historial transaccional).
- Ramificación: Dos fuentes de "in-app" (alerts vs events) + bypass directo desde cliente en tienda pueden afectar consistencia, RLS y mantenimiento a largo plazo. Ver análisis en MASTER_PLAN.

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
│ └── colmenas (apiario_id)
│ ├── inspecciones
│ ├── varroa_records
│ ├── peso_records
│ └── cosechas
│ └── lotes
│ └── productos (lote_id)
│ └── ventas (producto_id, channel, cash_session_id)
│ ├── arboles_plantados
│ └── commission_records (venta_id, rep_id, tier_multiplier, channel_rate)
├── rep_profiles (user_id, tier_override, tier_promoted_at)
│ └── cash_sessions (rep_id, empresa_id)
├── clientes (user_id)
│ ├── pedidos_cliente
│ │ └── logistica_envios
│ ├── ventas
│ └── tickets_fidelizacion
├── calendario_tasks (usuario_id)
├── empresas ← usuarios_empresas → profiles
│ ├── periodos_contables
│ ├── facturas_emitidas → terceros
│ ├── gastos
│ ├── impuestos
│ ├── sii_sync_runs
│ ├── commission_rules (rule_type: base|channel_rate|volume_threshold|loyalty|streak|tier_bonus)
│ ├── invitation_codes → invitation_redemptions
│ └── cash_sessions
└── marketing_campaigns → marketing_posts
```

---

*Este documento debe actualizarse con cada nueva migracion.*
*Fuente de verdad: `packages/database/supabase/migrations/`*
*Ultima actualizacion: Junio 2026 — Migrations 28–38*

---

## 12. Cierres de Caja · Comisiones · Invitaciones (Migration 28)

> Documentación detallada: `docs/CIERRES_CAJA_COMISIONES.md`

### `cash_sessions`

Sesión diaria de caja. Una por rep por día de operación.

| Columna | Tipo | Descripcion |
|---|---|---|
| `id` | UUID PK | |
| `empresa_id` | UUID FK → empresas | Multi-tenant |
| `rep_id` | UUID FK → auth.users | Vendedor que opera |
| `opened_at` | TIMESTAMPTZ | Timestamp apertura |
| `closed_at` | TIMESTAMPTZ | Timestamp cierre |
| `opening_cash` | NUMERIC(19,4) | Efectivo declarado al abrir |
| `closing_cash_counted` | NUMERIC(19,4) | Efectivo físico contado al cerrar |
| `closing_cash_expected` | NUMERIC GENERATED | Calculado: opening + ventas efectivo |
| `cash_difference` | NUMERIC GENERATED | Delta: contado - esperado (trazado) |
| `session_status` | TEXT | `open` → `closed` → `reconciled` |
| `reconciled_by` | UUID FK | Admin que confirma |

### `rep_profiles`

Extensión de auth.users para reps de ventas.

| Columna | Tipo | Descripcion |
|---|---|---|
| `user_id` | UUID UNIQUE FK → auth.users | |
| `empresa_id` | UUID FK → empresas | |
| `display_name` | TEXT | Nombre visible |
| `commission_tier` | TEXT | `base`, `senior`, `elite`, `legend` |
| `tier_override` | TEXT | Override manual admin (null = automático) |
| `tier_promoted_at` | TIMESTAMPTZ | Último ascenso automático |
| `fixed_monthly` | NUMERIC(19,4) | Monto fijo honorarios |
| `total_commissions_earned` | NUMERIC | Acumulado histórico |
| `total_commissions_paid` | NUMERIC | Ya pagado |
| `current_streak_days` | INT | Racha actual |
| `best_streak_days` | INT | Mejor racha |
| `active` | BOOLEAN | Admin puede desactivar |

### `commission_rules`

Reglas de comisión configurables por empresa.

| Columna | Tipo | Descripcion |
|---|---|---|
| `empresa_id` | UUID FK → empresas | |
| `rule_type` | TEXT | `base`, `channel_rate`, `volume_threshold`, `loyalty`, `streak`, `tier_bonus` |
| `name` | TEXT | Nombre visible |
| `parameter` | JSONB | Config flexible |
| `active` | BOOLEAN | |
| `priority` | INT | Orden de evaluación |

### `commission_records` (Ledger Inmutable)

| Columna | Tipo | Descripcion |
|---|---|---|
| `empresa_id` | UUID FK | |
| `session_id` | UUID FK → cash_sessions | |
| `venta_id` | UUID FK → ventas | |
| `rep_id` | UUID FK → auth.users | |
| `base_commission` | NUMERIC | % de la venta |
| `volume_multiplier` | NUMERIC | ×1.0–×1.6 |
| `loyalty_bonus` | NUMERIC | Cliente recurrente |
| `streak_bonus` | NUMERIC | Racha de días |
| `total_commission` | NUMERIC | Suma final |
| `tier_multiplier` | NUMERIC DEFAULT 1.0 | ×1.0–×1.3 según tier |
| `channel_rate` | NUMERIC | % comisión por canal (si aplica) |
| `paid` | BOOLEAN | Pendiente → pagado |

### `invitation_codes`

Códigos de invitación para onboarding de nuevos usuarios.

| Columna | Tipo | Descripcion |
|---|---|---|
| `empresa_id` | UUID FK → empresas | |
| `code` | TEXT UNIQUE | 8 chars autogenerado |
| `created_by` | UUID FK → auth.users | Admin creador |
| `roles` | TEXT[] | Roles asignados al canjear |
| `tools` | JSONB | Herramientas habilitadas |
| `max_uses` | INT | Límite (null = ilimitado) |
| `current_uses` | INT | Contador automático |
| `expires_at` | TIMESTAMPTZ | Expiración opcional |
| `active` | BOOLEAN | |

### `invitation_redemptions`

Audit trail de canjes de códigos.

| Columna | Tipo | Descripcion |
|---|---|---|
| `invitation_id` | UUID FK → invitation_codes | |
| `user_id` | UUID FK → auth.users | |
| `redeemed_at` | TIMESTAMPTZ | |
| `roles_assigned` | TEXT[] | Snapshot al momento del canje |
| `tools_assigned` | JSONB | Snapshot |

### Extensiones a `ventas` (Migration 28)

| Columna | Tipo | Descripcion |
|---|---|---|
| `cash_session_id` | UUID FK → cash_sessions | Linkeo a sesión de caja |
| `channel` | TEXT | `feria`, `delivery`, `local`, `corporativo`, `web`, `referido` |
| `is_new_client` | BOOLEAN | Para comisión de fidelización |
| `rep_commission_base` | NUMERIC | Comisión base |
| `rep_commission_multiplier` | NUMERIC | Multiplicador aplicado |
| `rep_commission_loyalty` | NUMERIC | Bonus fidelización |
| `rep_commission_total` | NUMERIC | Comisión total |

### Vistas Nuevas

| Vista | Descripcion |
|---|---|
| `rep_session_summary_view` | Resumen de sesión: transacciones, revenue, comisiones, diferencia de caja |
| `rep_performance_view` | Performance del rep: stats lifetime, balance pendiente, streak |

### Funciones Nuevas

| Funcion | Descripcion |
|---|---|
| `generar_codigo_invitacion(empresa_id)` | Genera código único de 8 chars |
| `canjear_codigo_invitacion(code, user_id)` | Valida, asigna roles, crea rep_profile |
| `calcular_comision_venta(venta_id, empresa_id)` | Motor de comisiones: base×vol_mult + loyalty + streak, × tier_multiplier, channel_rate lookup |
| `actualizar_streak_rep(rep_id)` | Actualiza racha al cerrar sesión |
| `evaluar_tier_rep(p_user_id)` | Evaluación automática de tier (solo sube, nunca baja) |
| `tier_progress_rep(p_user_id)` | Progreso hacia siguiente tier (ventas, revenue, streak, clientes) |
| `weekly_leaderboard(p_empresa_id)` | Top 20 reps por comisiones semanales (lunes→domingo) |

### Funciones Detalladas

#### `calcular_comision_venta(venta_id, empresa_id)` (Migrations 28→31)

Fórmula final:

```
total = ((base_rate × volume_mult) + loyalty_bonus + streak_bonus) × tier_multiplier
```

- `base_rate`: si existe `channel_rate` para el canal → usa ese; si no → base rate global
- `volume_mult`: $0–49K→×1.0, $50K–99K→×1.2, $100K–199K→×1.4, ≥$200K→×1.6
- `loyalty_bonus`: 3% si cliente recurrente (`is_new_client = false`)
- `streak_bonus`: 7d→$5K, 14d→$15K, 30d→$50K
- `tier_multiplier`: base=1.0, senior=1.1, elite=1.2, legend=1.3 (desde `commission_rules` tipo `tier_bonus`)
- `channel_rate`: feria=10%, delivery=8%, local=10%, corporativo=12%, referido=9%, web=7% (desde `commission_rules` tipo `channel_rate`)

#### `evaluar_tier_rep(p_user_id)` (Migration 29)

Evaluación automática de tier. **Solo sube, nunca baja.** Si `tier_override` no es NULL, usa ese valor en vez del calculado.

| Tier | Ventas | Revenue | Streak | Clientes |
|---|---|---|---|---|
| base → senior | ≥30 | ≥$1M | — | — |
| senior → elite | ≥100 | ≥$5M | ≥14d | — |
| elite → legend | ≥250 | ≥$15M | ≥30d | ≥20 |

#### `tier_progress_rep(p_user_id)` (Migration 29)

Retorna JSONB con métricas actuales y umbrales del siguiente tier:

```json
{
  "current_tier": "senior",
  "next_tier": "elite",
  "ventas": { "current": 65, "required": 100 },
  "revenue": { "current": 3200000, "required": 5000000 },
  "streak": { "current": 8, "required": 14 },
  "clients": { "current": null, "required": null },
  "progress_pct": 65.0
}
```

#### `weekly_leaderboard(p_empresa_id)` (Migration 33)

`SECURITY DEFINER STABLE`. Retorna top 20 reps por comisiones de la semana actual (lunes→domingo). Columnas: `rep_id`, `display_name`, `total_commissions`, `total_ventas`, `commission_tier`.

### Triggers

| Trigger | Tabla | Evento | Descripcion |
|---|---|---|---|
| `on_venta_insert_commission` | ventas | AFTER INSERT | Ejecuta `calcular_comision_venta()` + inserta en `commission_records` |
| `on_cash_session_close_streak` | cash_sessions | AFTER UPDATE (closed) | Ejecuta `actualizar_streak_rep()` |
| `on_rep_profile_tier_check` | rep_profiles | AFTER UPDATE | Ejecuta `evaluar_tier_rep()` si cambian métricas relevantes |

---

## 13. Tier Automático · Channel Rate · RLS Hardening · Leaderboard (Migrations 29–33)

### Migration 29: `rep_tier_auto_evaluation`

- Columnas nuevas en `rep_profiles`: `tier_override` (TEXT nullable), `tier_promoted_at` (TIMESTAMPTZ nullable)
- Función `evaluar_tier_rep()`: evaluación automática, solo sube, respeta `tier_override`
- Función `tier_progress_rep()`: métricas de progreso hacia siguiente tier
- Trigger `on_rep_profile_tier_check`: re-evaluación automática al actualizar métricas

### Migration 30: `tier_bonus_commission`

- Columna `tier_multiplier` en `commission_records` (NUMERIC DEFAULT 1.0)
- `calcular_comision_venta()` reescrita: multiplica total por tier_multiplier
- Seed `commission_rules` tipo `tier_bonus`: base=1.0, senior=1.1, elite=1.2, legend=1.3

### Migration 31: `channel_rate_commissions`

- Columna `channel_rate` en `commission_records` (NUMERIC nullable)
- `calcular_comision_venta()` actualizada: lookup channel_rate desde `commission_rules`
- Seed `commission_rules` tipo `channel_rate`: feria=10%, delivery=8%, local=10%, corporativo=12%, referido=9%, web=7%

### Migration 32: `rls_hardening`

6 parches RLS:

| Tabla | Cambio | Antes | Después |
|---|---|---|---|
| `commission_rules` | Split ALL policy | `FOR ALL USING (true)` | INSERT/UPDATE: admin; DELETE: solo gerente |
| `commission_records` | INSERT restringido | `auth.uid() = rep_id` | Solo `service_role` o admin |
| `rep_profiles` | DELETE bloqueado | `USING (auth.uid() = user_id)` | `USING (false)` — soft-delete only |
| `rep_profiles` | INSERT añadido | — | `auth.uid() = user_id` |
| `invitation_redemptions` | INSERT restringido | `true` | `service_role` o `auth.uid() = user_id` |
| `cash_sessions` | UPDATE admin restringido | `is_gerente()` | Solo si `session_status IN ('closed','reconciled')` |

### Migration 33: `weekly_leaderboard`

- Función `weekly_leaderboard(p_empresa_id)`: SECURITY DEFINER STABLE, top 20 reps
- Ventana: semana actual (lunes 00:00 → domingo 23:59 America/Santiago)
- Ordenado por `total_commissions DESC`

---

## 14. RLS Completo — Post-Hardening (Migration 32)

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `cash_sessions` | rep propio + admin | rep (abrir) | rep (propios, open) + admin (closed/reconciled) | — |
| `rep_profiles` | propio + admin | propio (auth.uid() = user_id) | propio (activo) + admin | bloqueado (soft-delete) |
| `commission_rules` | `has_empresa_access()` | admin (gerente/tienda_admin) | admin | solo gerente |
| `commission_records` | rep propio + admin | service_role / admin | admin (paid/paid_at) | bloqueado |
| `invitation_codes` | admin | admin | admin | admin |
| `invitation_redemptions` | admin | service_role / auth.uid() = user_id | — | — |

---

## 15. Checkout Sessions (Migration 38)

### `checkout_sessions`

Sesiones de checkout persistentes para el flujo de pago web (Transbank + Flow.cl). Reemplaza el Map en memoria que se perdía en cold starts de Vercel.

| Columna | Tipo | Restriccion | Descripcion |
|---|---|---|---|
| `id` | UUID PK | DEFAULT gen_random_uuid() | Identificador unico |
| `buy_order` | TEXT | UNIQUE NOT NULL | Orden de compra (ej: `ORD-1718000000000`) |
| `session_id` | TEXT | NOT NULL | ID de sesion del provider |
| `provider` | TEXT | NOT NULL, CHECK IN ('transbank','flow') | Pasarela de pago |
| `cart` | JSONB | NOT NULL | Carrito verificado (productos, precios, cantidades) |
| `total` | INTEGER | NOT NULL, CHECK > 0 | Total en CLP verificado server-side |
| `shipping` | JSONB | — | Datos de envio |
| `status` | TEXT | NOT NULL, DEFAULT 'pending', CHECK IN ('pending','completed','expired') | Estado de la sesion |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Timestamp de creacion |
| `completed_at` | TIMESTAMPTZ | — | Timestamp cuando se completo el pago |

**Indices**: `idx_checkout_sessions_buy_order` (buy_order), `idx_checkout_sessions_status` parcial (status = 'pending')

**Funciones**:
- `expire_checkout_sessions()` — Marca como 'expired' las sesiones pending > 30 min

**RLS**: Solo `service_role` tiene acceso completo. `authenticated` y `anon` no tienen permisos. Las operaciones de checkout usan `createAdminClient()` (service_role).

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `checkout_sessions` | service_role | service_role | service_role | service_role |
