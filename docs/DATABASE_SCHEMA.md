# Manifiesto de Base de Datos — Esquema Canonico

> **Clase: VIVO.** Censo de migs: [`REPO_MAP.md`](./REPO_MAP.md) (354). Índice: [`README.md`](./README.md).
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
| `deletion_requested_at` | TIMESTAMPTZ | - | Solicitud ARCO de eliminación (mig 20260814210000). Pedidos y DTE no se borran (deber tributario). **Sin writer en apps aún.** |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |

**Roles validos**: `admin`, `cliente`, `creador`, `rep_ventas`, `territorial` (via migration 997)

> Roles de plataforma: `admin`, `apicultor` (patio), `territorial`, `rep_ventas`, `cliente`, `creador`. Legacy (`vendedor`, `gerente`, `logistica`, `marketing`, `tienda_admin`) → `admin` vía `LEGACY_ROLE_MAP`. Ver `docs/ROLES_Y_ACCESO.md`.

**Funciones helper** (`STABLE`, `search_path = ''`, mig. `20260814200000`):
- `jwt_app_role()` → `app_metadata.role` del JWT (plataforma). No leer `oyz_role` (comercial, hook 43).
- `current_role()` → JWT `app_metadata.role`, fallback a `profiles.role`
- `is_admin()` → JWT en el set legacy-elevado (`admin`, `gerente`, …) o `profiles.role = 'admin'`
- `is_gerente()` → alias de `is_admin()`
- `has_empresa_access(empresa_id)` → membresía en `usuarios_empresas`

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
| `recipient_user_id` | UUID FK → profiles | Destinatario in-app (mig 20260818030000). Separa "quién emitió" de "quién debe ver"; la campana filtra por esta columna (`use-in-app-notifications`). |
| `created_at` | TIMESTAMPTZ | - |

**Notas de arquitectura**: 
- Existe tabla separada `notification_queue` para encolado saliente (con attempts, status pending/processing/sent/failed, metadata, RLS solo admin).
- Existe tabla `alerts` (user_id, title, message, is_read, severity) usada por el BFF de Nucleo para notificaciones in-app de sistema (diferente de events para historial transaccional).
- RLS SELECT (mig 20260818030000): gerente/admin ven todo; usuario ve `recipient_user_id = auth.uid()` o fallback legacy `created_by`.
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

**Seeds**: `boletas`, `bancos`, `sii`, `notificaciones`, `google_ads` (mig 20260815000000; kill-switch GUI Núcleo, conversion ID público — **sin lector/toggle en apps aún**)

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
| `colmenas` | No | Propietario + admin |
| `productos` | Si | Lectura publica, escritura admin |
| `arboles` | Si | Lectura publica |
| `fuentes` | No | Solo admin |

---

## 10. Politicas de Seguridad (RLS) — Resumen

| Tabla | Lectura | Escritura |
|---|---|---|
| `profiles` | Propio + admin | Propio |
| `apiarios` | Propietario + admin | Propietario + admin |
| `colmenas` | Propietario + admin | Propietario + admin |
| `productos` | Publico | admin |
| `ventas` | admin + rep_ventas | admin + rep_ventas |
| `pedidos_cliente` | Cliente propietario + admin | Sistema |
| `cashflow` | admin | admin |
| `calendario_tasks` | Propietario + admin | Propietario |
| `logistica_envios` | admin | admin |
| `facturas_emitidas` | `has_empresa_access()` | `has_empresa_access()` con rol admin |
| `gastos` | `has_empresa_access()` | `has_empresa_access()` con rol admin |
| `marketing_*` | admin | admin |
| `site_content` | Publico | admin |

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
| `rep_id` | UUID FK → auth.users | Representante de ventas (rep_ventas) que opera |
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
| `commission_rules` | Split ALL policy | `FOR ALL USING (true)` | INSERT/UPDATE: admin; DELETE: admin |
| `commission_records` | INSERT restringido | `auth.uid() = rep_id` | Solo `service_role` o admin |
| `rep_profiles` | DELETE bloqueado | `USING (auth.uid() = user_id)` | `USING (false)` — soft-delete only |
| `rep_profiles` | INSERT añadido | — | `auth.uid() = user_id` |
| `invitation_redemptions` | INSERT restringido | `true` | `service_role` o `auth.uid() = user_id` |
| `cash_sessions` | UPDATE admin restringido | `is_admin()` | Solo si `session_status IN ('closed','reconciled')` |

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
| `commission_rules` | `has_empresa_access()` | admin | admin | admin |
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

---

## 16. Batch Agosto 2026 (migs 20260814210000 → 20260822000000)

Cambios de médula posteriores al censo anterior. Verificado contra `main` el 2026-08-22.

### ARCO — Supresión (20260814210000)
- `profiles.deletion_requested_at` TIMESTAMPTZ. Marca de solicitud; ventas/DTE se conservan anonimizadas. La solicitud se registra desde Tienda y Núcleo.

### Retención de auditoría ARCO al eliminar Auth (20261102141000)
- `arco_solicitudes.user_id` y `revisado_por` son anulables y usan `ON DELETE SET NULL`.
- La solicitud queda como rastro administrativo aun cuando el perfil titular deja de existir.
- Las ejecuciones pendientes siguen exigiendo `user_id` antes de anonimizar o revocar Auth.

### Integración Google Ads (20260815000000)
- Row en `integrations` (`key='google_ads'`, disabled por defecto). Kill-switch GUI Núcleo (`admin-system.ts`, `SistemaSection.tsx`); Tienda lee estado vía `/api/integrations/status`. Cableado.

### Heal territorial signup (20260818010000)
- Trigger `trg_heal_territorial_signup_cliente` (AFTER INSERT ON auth.users): sube `cliente → territorial` solo cuando el signup trae `app_source = 'nucleo_territorial'`. SECURITY DEFINER, idempotente.

### Referral backfill (20260818020000)
- Fix de `referral_code` + backfill de datos en `profiles`. Sin cambio estructural.

### Inbox por destinatario (20260818030000)
- `notification_events.recipient_user_id` + índice parcial (`channel = 'in_app'`) + RLS SELECT nueva (ver § 7). Cableado: `packages/auth/src/use-in-app-notifications.ts`.

### Candado censo actores (20260819000000)
- Trigger `actores_registro_guard_completo`: `actores_registro.completo` solo lo escribe `service_role` (BFF `POST /actores/:id/completar-censo`). authenticated no puede autodeclararlo. Función SECURITY DEFINER con grants revocados a PUBLIC/anon/authenticated (solo corre como trigger).

### Entrelazado apiario bidireccional (20260822000001, renombrada por colisión de prefijo)
- `apiarios_registro.apiario_origen_id` UUID FK → `apiarios(id)` + `sincronizado_en`.
- `apiarios.apiario_registro_id` UUID FK → `apiarios_registro(id)`.
- Índices en ambas columnas. RLS sin cambios: el dueño sigue siendo el actor; coordenadas del registro se degradan ~1 km en capa de aplicación.
- Wiring: BFF `apps/nucleo/src/api/routes/registro-territorial.ts` + `ApiarioManager.tsx` / `apicultor-types.ts`. **En árbol de trabajo sin commitear a `main`** (migración untracked al censo).

### Unicidad origen operativo (20260822020000)
- Índice parcial único `apiarios_registro(actor_id, apiario_origen_id) WHERE apiario_origen_id IS NOT NULL`: cierra la carrera select→insert del sync BFF (duplicados bajo concurrencia). Reparación previa desliga el origen de duplicados históricos conservando el más reciente.
- El BFF trata `23505` como carrera perdida y devuelve la fila ganadora (idempotente).

### Aislamiento calendario_eventos (20260822000000)
- Reemplaza las policies de `calendario_eventos` (RLS existía desde mig 92): corrige fuga de eventos cruzados entre roles. SELECT/INSERT/UPDATE/DELETE: dueño (`auth.uid() = user_id`); admin/gerente además con `has_empresa_access(empresa_id)` o huérfanos.

### Puentes de entrelazado (20260822010000)
- `apiarios_externos.apiario_operativo_id` FK → `apiarios` + `apiarios.origen_externo_id` FK → `apiarios_externos`: trashumancia materializada conoce su operativo y viceversa.
- `calendario_tasks.colmena_id` UUID FK → `colmenas` (el TEXT libre queda para legado).
- `cosechas.lote_id`: deja de ser UUID suelto; FK real → `lotes(id)` con reparación previa de huérfanos.

### Unicidad de origen operativo (20260822020000)
- Reparación de duplicados históricos en `apiarios_registro` (conserva la fila más reciente por origen).
- Índice único parcial `(actor_id, apiario_origen_id)` WHERE `apiario_origen_id IS NOT NULL` — cierra la carrera del sync; el BFF responde 23505 devolviendo la fila ganadora.

### Integración de herramientas internas (20260822020000-b)
- `colmenas.production_total` pasa a ser derivado: trigger `trg_cosechas_production_total` (AFTER INSERT/UPDATE/DELETE de `cosechas`) + backfill con `SUM(kg)`. Se eliminaron los writes manuales de la app.
- `colmenas.last_inspection` lo mantiene el trigger `trg_inspecciones_last_inspection` (solo avanza hacia adelante; cubre todas las vías de alta de inspecciones). Se removieron los updates manuales en `ApiarioManager` y `bitacora.ts`.
- `costos_colmena` materializada en el repo (antes tabla fantasma solo en DB viva): RLS por dueño vía `colmenas.user_id`, índice único `colmena_id`, y BFF `GET/PATCH /api/bitacora/costos`. `produccion_kg` no es editable: lo deriva el ledger de cosechas.
- `varroa_metodos` catálogo (`lavado_alcohol`, `caida_natural`, `co2`) con normalización de variantes históricas en `varroa_records.method`.

### Snapshot de impacto público (20260822030000)
- `impacto_publico`: los agregados del open-book DEJAN de leerse en vivo desde `arboles_plantados` con service_role en ruta anónima. Se congela un snapshot versionado (publicación = acto admin `POST /api/impacto/publicar`).
- RLS: lectura solo `publicado = true` y `auth.role() = 'authenticated'` (nunca anónima); escritura solo `is_admin()`.
- Ruta `/impacto` y sus APIs exigen sesión (middleware `publicRoutes` sin `/impacto`); el BFF solo toca datos vivos en el acto de publicar.

### Snapshot de impacto público — servido desde TIENDA (20260822030000)
- La página open-book vive ahora en la tienda (`apps/tienda/app/impacto`, ruta con sesión, noindex) y en Núcleo solo queda el vínculo de Regeneración hacia la tienda.
- `impacto_publico` (snapshot, RLS: lectura `publicado=true` + `authenticated`; escritura `is_admin()`): la lectura pública jamás toca `arboles_plantados`; `POST /api/impacto` (tienda, staff) es el único acto que agrega y congela.
- Metodología versionada en paquete compartido `@enjambre/impacto` (coeficientes/fórmulas/IRR) — fuente única para Núcleo y Tienda.

### Integración de herramientas internas (20260822025000)
- `colmenas.production_total` pasa a ser **derivado** de `SUM(cosechas.kg)` (trigger `sync_colmena_production_total`).
- `colmenas.last_inspection` se mantiene desde inspecciones (todas las vías).
- `costos_colmena` definida en repo con RLS (antes solo en BD viva).
- Catálogo de métodos de monitoreo de varroa + normalización de variantes.

### Impacto público snapshot (20260822030000)
- `impacto_publico`: agregados versionados (open-book) publicados por acción admin (`publicado=true`); lectura exige sesión `authenticated`, nunca anónima ni service_role en ruta pública.

### Normalización post-repaso (20260823000000)
- Índice `idx_cosechas_lote_id` (FK nueva sin índice → seq scan).
- Policies legacy de `apiarios` eliminadas ("Users can view/insert/update/delete own apiarios" — redundantes con las canónicas, sin bypass admin).
- `apiarios_insert` unificado a `is_gerente()` (coherencia; el remoto NO tiene `created_by`, la mig 20250614 cayó en la rama user_id-only).
- `updated_at` + trigger `set_updated_at()` en `apiarios`, `colmenas`, `calendario_tasks` (backfill desde `created_at`).

### Entrelazado estructural (20260823010000/20000/30000)
- **`apiarios_registro.n_colmenas` en vivo**: trigger `trg_apiario_registro_n_colmenas` en colmenas (INSERT/UPDATE/DELETE de `apiario_id`) refresca el conteo + `sincronizado_en` del registro vinculado. Fix 20000: cubre desvinculación (UPDATE→NULL). Fix 30000: CHECK `n_colmenas > 0` relajado a `>= 0` (un apiario puede quedar legítimamente sin colmenas).
- **`apiarios_registro.predio_id`** FK → `predios_facilitadores` + índice: un apiario residente puede declararse en un predio. BFF: POST/PATCH /apiarios y sync-desde-operativo aceptan `predio_id` (validado propiedad del actor). GET /predios devuelve `apiarios_acogidos`.
- **`calendario_tasks.alerta_id`** FK → `alertas_fitosanitarias` + índice único parcial `(user_id, alerta_id, colmena_id)` WHERE alerta_id NOT NULL: idempotencia del acuse. Fix en BFF: las tareas de resguardo se crean por **colmena real** de cada apiario (antes insertaba apiario_id en colmena_id → FK fallaba silencioso). CalendarioCiclico muestra meses con tareas fuera de temporada.
- Completar censo: sella `nivel_acreditacion='base'` formal + notificación in-app (campana).
- Índice `alertas_fitosanitarias(zona)` + `config_censo.created_at`.

### SAG histórico + acopio + credencial derivada (20260823040000)
- **`sag_declaraciones`**: histórico de declaraciones SAG (actor_id, periodo, n_colmenas declaradas vs vivas, estado borrador/presentada/rechazada, presentado_en). RLS owner/gerente. El PDF deja de ser desechable: hay rastro de presentación.
- **`acopio_declaraciones`**: intención de acopio por temporada (volumen_kg, zona, estado propuesta/confirmada/cancelada). RLS por actor. Habilita el sub-rol `comercial_acopio` (familia de menú + gate + alta).
- **RPC `evaluar_nivel_acreditacion(actor_id)`**: credencial DERIVADA — base (censo completo) → trazable (≥1 apiario activo + ≥1 cosecha vía apiario_origen_id) → comprometido (+ consentimiento mapa_comunitario). referente queda solo-admin. BFF: POST `/actores/:id/recalcular-credencial`.
- BFF: GET/POST `/declaraciones-sag`, PATCH `/declaraciones-sag/:id`, GET/POST `/acopio`, PATCH `/acopio/:id`; trashumancia→calendario (POST /apiarios-externos crea tarea categoría transhumancia); carve-out `tecnico_inspector` para POST /alertas.

### Credencial automática + eventos ARCO (20260823050000)
- **Triggers de recálculo de credencial**: `trg_credencial_cosecha` (INSERT/UPDATE/DELETE en cosechas → resuelve actor vía colmena→apiario→registro), `trg_credencial_apiario_registro` (activo/origen) y `trg_credencial_consentimiento` (BEFORE UPDATE de consentimientos). Nunca degradan a `referente`.
- **CHECK de `security_events` ampliado**: + `censo_completado`, `arco_solicitado` (y `signup_trigger_error` que faltaba en el type TS). Completar censo loguea `censo_completado`; la solicitud ARCO loguea `arco_solicitado`.
- **ARCO operable**: POST `/arco/solicitar-eliminacion` (idempotente, marca `profiles.deletion_requested_at`) + GET `/arco/estado`; UI en Configuración → Datos Personales (confirmación explícita, nota de deber tributario).

### Fix RLS suscriptor (20260823060000 — renombrada desde 1008 por colisión)
- `1008_fix_suscriptor_rls.sql` compartía versión con `1008_colmena_provenance.sql` → **nunca se aplicó al remoto**: los suscriptores del Club de la Cosecha no podían leer sus colmenas/apiarios vinculados. Renombrada a `20260823060000` y aplicada.
- Policies nuevas en prod: `colmenas_suscriptor_select` (colmenas en `suscriptor_config.user_id`) y `apiarios_suscriptor_select` (apiarios de esas colmenas).

### Sincronización de Esquema Local ↔ Producción & Migraciones Aplicadas (2026-09-08)
- **Desincronizaciones resueltas**:
  - `arboles_plantados`: en producción la tabla cuenta con `id, especie, cantidad, fecha, sector, lat, lng, co2_ton, status, created_at, user_id` (sin `apiario_id` ni `lote_id`). Se eliminaron los índices fallidos sobre columnas inexistentes y se indexó `(status)` y `(fecha)`.
  - `actores_registro`: corregido en `20260831000000` el predicado `estado = 'activo'` (no existía columna booleana `activo`).
  - `ventas_pendientes_logistica`: corregido en `20260831120000` el JOIN `ventas.cliente_id = clientes.id` (text) y `clientes.user_id = profiles.id` (uuid), evitando el error `text = uuid`.
  - `bitacora_eventos` / `bitacora_colmena_snapshots`: corregidas políticas RLS en `20260831162800` y `20260831164700` alineadas con el esquema real de `apiarios` y `colmenas` (que usan `user_id`, sin `empresa_id` ni `owner_id`).
  - Restauradas localmente las migraciones históricas `1001_cms_content_locale.sql` y `20260823060000_fix_suscriptor_rls.sql`, logrando paridad 100% en `supabase migration list`.

### Optimización de Rendimiento — Entrelazado & Monorepo (20260908120000)
- **Entrelazado territorial y grafo**:
  - Índices `colmenas(apiario_id)` y `cosechas(colmena_id)` eliminan escaneos secuenciales (Seq Scan) en `sync_apiario_registro_n_colmenas()` y `evaluar_nivel_acreditacion()`.
  - Índices `cuaderno_aristas(target_id)` y `cuaderno_aristas(relacion)` optimizan recorridos del grafo de entrelazado.
- **Claves foráneas y sanidad**: índices en `inspecciones(colmena_id)`, `varroa_records(colmena_id)`, `peso_records(colmena_id)`, `arboles_plantados(status)`, `arboles_plantados(fecha)`, `notification_queue(status, created_at)` y `notification_events(created_by)`.
- **Lecturas públicas Tienda / CMS**: índice compuesto `site_content(section_key, is_active, item_order)` optimiza las más de 56.000 consultas repetidas en catálogo/landing.
- **Badges v2**: índices parciales para los contadores de `get_sidebar_badges()` (`destilaciones`, `crm_leads`, `participante_evento`, `invitation_codes`, `creadores`, `participante_arqueo`).
- **Podado de `supabase_realtime`**: de 24 tablas se redujo a las 3 estrictamente permitidas (`carrito_items`, `notification_events`, `ventas`), frenando de raíz el loop de decodificación lógica de WAL en disco.
- **Mantenimiento**: limpieza de refresh tokens revocados de más de 7 días y `VACUUM ANALYZE` ejecutado en `realtime.subscription`, `auth.refresh_tokens`, `site_content`, `arboles_plantados`, `colmenas`, `cosechas`, `cuaderno_aristas` y `cuaderno_nodos`.

### Gramaje Base en Formatos Comerciales (20260908140000)
- **Columna `peso_neto_g` en `product_formats`**: Añadida columna `INT DEFAULT 0` con comentario explicativo.
- **Poblado canónico de gramajes**:
  - `500g` → 500 g
  - `250g` → 250 g
  - `1kg` → 1000 g
  - `30x15g` → 450 g
  - `10x15g` → 150 g
  - `Panal` → 200 g
  - `Cofre` / `Kit` → 0 g
- **Vínculo operacional**: Al seleccionar el formato en productos de Núcleo, se deduce automáticamente el peso neto para calcular la deducción proporcional del lote a granel (regla `46_stock_lote_sync.sql`).



