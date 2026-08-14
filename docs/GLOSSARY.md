# Glosario

> **Clase: VIVO.** Palabras que, si se mezclan, producen código en el app equivocado.
> Índice: [`README.md`](./README.md). Roles: [`ROLES_Y_ACCESO.md`](./ROLES_Y_ACCESO.md).

## Producto / territorio

| Término | Es | No es |
|---|---|---|
| **Enjambre Legado** | Nombre del sistema operativo (monorepo). | Una sola app. |
| **OYZ / La Obrera y el Zángano** | Marca comercial D2C. | El repo entero. |
| **Néctar (flujo)** | Cosecha → lote → frasco → venta → impacto → contable. Constitución § III. | Un microservicio. |
| **Guardian** | Cliente registrado con ciclos, puntos, wallet, reseña profunda. | Un `profiles.role`. El rol es `cliente`. |
| **Patio** | Operación apícola (colmenas, bitácora, registro). Rol `apicultor`. Vive en **Núcleo**. | Campo. |
| **Campo** | App POS de feria / `rep_ventas`. Dexie. [`CAMPO_OFFLINE.md`](./CAMPO_OFFLINE.md). | Patio, bitácora, censo. |
| **Feria** | Evento presencial + consignación. Contrato de feria ≠ `profiles.role`. | Un rol de plataforma. |
| **Chiloé / territorial** | Censo, mapa, trashumancia. Rol `territorial`. [`NUCLEO_CHILOE.md`](./NUCLEO_CHILOE.md). | POS. |
| **EIRL** | Capa contable chilena absorbida en Núcleo (`views/eirl/`). | Una app. `apps/eirl` no existe. |
| **Creador** | Rol + portal de códigos/comisiones de contenido. | Admin. |
| **Colmena / lote / frasco** | Origen → transformación → SKU. Trazabilidad. | Sinónimos entre sí. |

## Identidad

| Término | Dónde | Significa |
|---|---|---|
| `profiles.role` | Tabla + JWT `app_metadata.role` (trigger 996) | Plataforma: `admin`, `apicultor`, `territorial`, `rep_ventas`, `cliente`, `creador`. |
| `oyz_role` | JWT `app_metadata.oyz_role` (hook 43) | Comercial apilable: comprador / suscriptor / revendedor / embajador. **Nunca** admin. |
| `user_roles` | Tabla | Esos roles comerciales. |
| `user_metadata` | Auth, cliente puede escribirlo | **No** es fuente de rol. |
| `LEGACY_ROLE_MAP` | `@enjambre/auth/role-redirect` | `gerente`, `vendedor`, … → `admin`. `apicultor` no. |
| `empresa_id` / `has_empresa_access()` | Multi-tenant contable | Aislamiento por empresa. Un proyecto Supabase, N empresas. |

## Dinero y fiscal

| Término | Es |
|---|---|
| **BFF** | Hono en Núcleo (`/api/[[...routes]]`). Único plano de writes caros (pagos, DTE, caja). |
| **Flow / Transbank** | Providers. `PAYMENT_PROVIDER`. Checkout **no** vive en Tienda. [`MONEY_PATH.md`](./MONEY_PATH.md). |
| **SumUp** | Terminal POS. Credenciales en UI Núcleo (cifradas), no solo env. |
| **DTE** | Documento tributario electrónico (33, 34, 39, 61…). |
| **CAF** | Folios SII. Sin CAF, boleta fail-closed. |
| **F29 / F22 / PPM / RCV** | Formularios e informes SII. `@enjambre/contable` + `@enjambre/fiscal`. |
| **Boleta 39** | Boleta a consumidor. `SII_AUTO_EMIT_BOLETA=true` en fulfill. |
| **Hold de stock** | Reserva en checkout web. El POS offline puede **sobregirar** (`decrement_stock_force`). |

## Plataforma

| Término | Es |
|---|---|
| **Hobby / Free** | Vercel Hobby + 1 proyecto Supabase Free. Cuotas = ley (§ II.6). Hobby es non-commercial. |
| **Fluid Compute** | Runtime Vercel actual. No es “una Lambda por request 2019”. |
| **Data API** | supabase-js HTTP. Default. No hay `DATABASE_URL` en funciones. |
| **ISR vs `ƒ`** | Catálogo declara `revalidate`; `layout` llama `headers()` → casi todo sale dinámico. |
| **cdn-image-loader** | `<Image>` no usa el optimizer de Vercel. |
| **Kill switch** | Env que apaga un plano: `AI_ENABLED=false`, no emitir boleta, etc. |

Si un término no está aquí y se usa en 2+ specs, agrégalo en el mismo PR que lo introduce.
