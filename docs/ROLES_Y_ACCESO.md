# Roles y acceso — Enjambre Legado

**Fuente de verdad de producto:** plan maestro v2 (roles, apps y bitácora).  
**Código canónico de plataforma:** `packages/auth/src/role-redirect.ts`  
**Shell Núcleo:** `apps/nucleo/src/config/sidebar-config.ts`  
**BFF:** `requireProfileRole(...)` en `apps/nucleo/src/api/lib/middleware.ts`

---

## 1. Dos ejes (no mezclar)

### Eje A — `profiles.role` (plataforma / `RoleKey`)

| RoleKey | Significado | App home |
|---------|-------------|----------|
| `admin` | Dueño/operador del negocio; datos compartidos multi-correo | Núcleo `/inicio` |
| `apicultor` | Operador de **patio** (colmenas, cuaderno, bitácora propias) | Núcleo `/inicio` (CTAs patio) |
| `territorial` | Red / censo / instituciones (Chiloé) | Núcleo `/inicio` (shell territorial) |
| `rep_ventas` | Revendedor feria | **Campo** `/pos` |
| `cliente` | Consumidor | **Tienda** `/catalogo` |
| `creador` | Creador de producto | **Tienda** `/perfil/creador` |

**Legacy (JWT o filas antiguas):** `gerente`, `vendedor`, `logistica`, `marketing`, `tienda_admin` → se normalizan a `admin` vía `LEGACY_ROLE_MAP`.

**`apicultor` ya no es legacy → admin.** Es RoleKey de primera clase (allowlist de patio). Migración 39 consolidó filas históricas a `admin`; los apicultores de operación nuevos se crean por invitación con `role = apicultor`.

### Eje B — `territorial_rol` (solo si `role = territorial`)

Valores de signup/BFF (ejemplos): `api_residente`, `api_trashumante`, `api_mixto`, `prop_facilitador`, `agri_*`, `comercial_acopio`, `tecnico_inspector`, `institucion_publica`.

- Filtra menú y escrituras de censo **después** de que el platform role sea `territorial`.
- No sustituye a `profiles.role`.

---

## 2. Frontera: dos “apicultores”

| Tipo | Platform role | territorial_rol | Menú |
|------|---------------|-----------------|------|
| Red / censo | `territorial` | `api_*` | Censo, mapa, consentimientos, mis-planes |
| Patio / operación | `apicultor` | (no requerido) | Colmenas, cuaderno, bitácora, sanidad propia |

**Reglas v1:**

1. Un usuario tiene **un** `profiles.role` primario.
2. Promoción red → patio: solo admin (invitación o promover actor).
3. No dual-role automático.
4. Si alguien necesita ambos mundos: cuentas separadas o promoción manual (documentado, no automatizado).

---

## 3. Capas de autorización (todas deben alinear)

```
profiles.role
  ├─► middleware  ROUTE_ROLE_GUARDS + isRouteAllowed
  ├─► shell       ROLE_VISIBLE_KEYS (sidebar / bottom nav)
  ├─► redirect    getRoleRedirectPath (nucleo | tienda)
  ├─► BFF         requireProfileRole(...)
  └─► RLS         owner (user_id = auth.uid()) | is_gerente()/is_admin()
```

**Anti-patrones:**

| Anti-patrón | Por qué falla |
|-------------|----------------|
| Menú sin BFF/RLS | Superficie UI sin datos o con fuga |
| Elevación `apicultor → admin` en LEGACY_ROLE_MAP | Patio ve contable/editor-tienda |
| Confundir Campo (POS) con bitácora | Dominios offline distintos (`CampoPOSDatabase` ≠ `NucleoBitacoraDB`) |
| Tratar `territorial_rol` como RoleKey | Rompe guards y redirects |
| Auto-degradar roles legacy en masa | Pierde admins reales sin auditoría |

---

## 4. Matriz de módulos (Núcleo)

### Admin — `all`

Todo el sidebar, editor-tienda, contable, SII, CRM, feria, invitaciones, bitácora global (evolución).

### Apicultor de patio (allowlist)

| Ruta / módulo | Acceso | Notas |
|---------------|--------|--------|
| `/colmenas`, ficha | Sí | RLS: solo filas propias; admin ve todo vía `is_gerente` |
| `/colmenas/cuaderno` + bitácora API | Sí | Core patio |
| Sanidad en ficha | Sí | Varroa, tratamientos, muestras propias |
| `/calendario` | Sí | Uso apícola |
| `/configuracion` | Sí | Tabs filtrados (perfil/seguridad; sin sistema admin) — UI en PR3 |
| `/perfil` | Sí | |
| Editor tienda, contable, SII, banco, CRM, pipeline, monitor feria | **No** | |
| `/mapa` global admin | No | |

### Territorial (oleada 2a · PR5)

Fuente de sub-rol en sesión: `AuthUser.territorial_rol` =
`actores_registro.rol` (SoT) → fallback `user_metadata.territorial_rol`.

| Familia | Sub-roles | Menú shell |
|---------|-----------|------------|
| **api** | `api_residente`, `api_trashumante`, `api_mixto` | inicio, territorio, mis-planes, fenología |
| **institucion** | `institucion_publica` | inicio, territorio, censo comunal, fenología |
| **mínimo** | sin rol / 2b (`tecnico_*`, `agri_*`, …) | inicio + territorio (inscripción) |

Código: `apps/nucleo/src/lib/territorial-rol.ts` + `getSidebarGroupsForRole(role, { territorialRol })`.

### Bitácora patio (PR6)

| Pieza | Estado |
|-------|--------|
| Offline Dexie `NucleoBitacoraDB` | Sesiones + capturas + cola |
| Banner global sync | `BitacoraSyncBanner` en shell (admin/apicultor) |
| Voz → cola → upload audio | `RecorderVoz` + `useBitacoraSyncEngine` |
| **Transcript manual (sin STT)** | Opción B en `RecorderVoz` → `enqueueTranscriptManual` → estado `transcrito` |
| Curaduría | `CuraduriaBitacoraPanel` en cuaderno |

STT server-side sigue opcional (no bloquea el patio).

### Campo / Tienda

Sin cambio de dominio. Bitácora de patio **nunca** en Campo.

---

## 5. Admin multi-correo

- Varios `profiles.role = admin` en la misma empresa/tenant.
- Datos de negocio compartidos; preferencias UI por `user_id`.
- Una tienda / un CMS (no multi-tienda por admin en este plan).

---

## 6. Backfill y legacy

1. Listar `profiles` con roles legacy residuales (si quedan tras mig 39).
2. Criterios “es admin de negocio”: uso de contable/CMS/SII/editor.
3. Criterios “es patio”: solo colmenas/inspecciones propias.
4. Promoción/degradación **manual o script dry-run**, nunca silent.
5. Nuevos patio: solo invitación admin (`role = apicultor`).

### Paths de alta (PR4)

| Path | Cómo | Resultado |
|------|------|-----------|
| **Crear cuenta directa** | Admin → Invitaciones → Crear cuenta → rol `apicultor` | `POST /api/admin/crear-cuenta`; `profiles.role=apicultor`; membresía empresa; home `/inicio` patio |
| **Código de invitación** | Admin genera código con rol `apicultor`; usuario autenticado canjea | `canjear_codigo_invitacion` escribe `profiles.role` (prioridad admin→apicultor→territorial→…) |
| **Signup público Núcleo** | Sheet territorial (`app_source=nucleo_territorial`) | Solo `territorial` (red/censo) — **no** crea patio |

No self-serve patio en v1. Frontera: no usar “Apicultor” como label de territorial.

Código: `apps/nucleo/src/lib/invitation-roles.ts`, `InvitacionesPanel`, `admin-identidades.ts`, mig `20260811010000_invitation_platform_roles.sql`.

---

## 7. Inventario código ↔ guards (smoke)

| Rol | Shell Núcleo | Redirect típico (nucleo) |
|-----|--------------|---------------------------|
| admin | menú completo | `/inicio` |
| apicultor | inicio, colmenas, cuaderno, calendario patio, config | `/inicio` |
| territorial | inicio, territorio, fenología | `/inicio` |
| rep_ventas | vacío (sale a Campo) | URL Campo `/pos` |
| cliente / creador | vacío (sale a Tienda) | Tienda catálogo / creador |

Tests de regresión:

- `packages/auth/src/role-redirect-guards.test.ts`
- `apps/nucleo/src/__tests__/auth-integration.test.ts`
- `apps/nucleo/src/config/__tests__/sidebar-config.test.ts`

---

## 8. Referencias

- `docs/BITACORA_APICOLA.md` — dominio bitácora / offline patio  
- `docs/NUCLEO_CHILOE.md` — registro territorial  
- `docs/RLS_AUDIT_COLMENAS_BITACORA.md` — ownership RLS patio  
- Migraciones: `39_admin_role_consolidation.sql`, `997_territorial_role.sql`, `1006_bitacora_apicola.sql`, `1010_cuaderno_crud.sql`, `*_apicultor_platform_role.sql`
