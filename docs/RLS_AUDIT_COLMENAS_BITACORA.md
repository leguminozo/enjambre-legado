# Auditoría RLS — colmenas, inspecciones y bitácora

**Fecha:** 2026-08-10  
**Alcance:** aislamiento owner vs admin para el rol patio (`apicultor`) y admin compartido.  
**Conclusión:** las políticas actuales **ya** son owner-based + bypass admin (`is_gerente()` ≡ `is_admin()`). No hace falta relajar RLS para habilitar patio; hace falta **RoleKey + BFF + shell** sin elevar a admin.

---

## 1. Helpers de rol (DB)

| Función | Definición efectiva | Fuente |
|---------|---------------------|--------|
| `is_admin()` | `profiles.role = 'admin'` | mig 39 |
| `is_gerente()` | alias de `is_admin()` | mig `20260808020000` (antes solo admin en 39) |
| `current_role()` | `profiles.role` del `auth.uid()` | mig 01 |

**Implicación:** un usuario con `role = apicultor` **no** pasa `is_gerente()` / `is_admin()`. Solo ve filas con `user_id = auth.uid()` (o relaciones equivalentes). Correcto para patio.

---

## 2. Colmenas y registros de campo

### Políticas vigentes (cadena 01 → 40 → 1010)

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `colmenas` | owner **o** gerente | owner **o** gerente | owner **o** gerente | owner **o** gerente (1010 relajó delete) |
| `inspecciones` | owner **o** gerente | owner **o** gerente | owner **o** gerente | owner **o** gerente (1010) |
| `varroa_records` | idem | idem | idem | idem (1010) |
| `peso_records` | idem | idem | idem | idem (1010) |
| `apiarios` | owner/created_by **o** gerente | mutate owner **o** gerente | | |

**Nota mig 01:** `colmenas_select` original permitía `apiario_id IS NULL` a cualquiera autenticado. La mig **40** endureció a `user_id = auth.uid() OR is_gerente()` y es la referencia vigente.

**Aislamiento A vs B:** apicultor A no puede SELECT/UPDATE/DELETE colmena de B salvo que `is_gerente()`. Admin (`role=admin`) ve todo vía bypass.

---

## 3. Bitácora (mig 1006) y red semántica (1010)

| Tabla | Política | Regla |
|-------|----------|--------|
| `sesiones_bitacora` | `sesiones_own` | FOR ALL: `user_id = auth.uid() OR is_gerente()` |
| `voice_inspection_captures` | `captures_own` | idem |
| `inspeccion_cuadros` | `cuadros_own` | owner o gerente (+ path por inspección) |
| `reina_history` | `reina_history_own` | idem |
| `tratamientos` | `tratamientos_own` | idem |
| `muestras` | `muestras_own` | idem |
| `cuaderno_nodos` / `cuaderno_aristas` | `*_own` | idem (1010) |

Todas con RLS enabled. Escritura prevista vía BFF con JWT de usuario (`createSupabaseUserClient`) → RLS aplica.

---

## 4. BFF / shell (estado post PR2–PR4)

| Capa | Estado |
|------|--------|
| `bitacoraRoutes.use` | `requireProfileRole("admin", "apicultor")` ✅ |
| Queries bitácora | `.eq("user_id", user.id)` en listados (admin global = futuro) |
| Cliente Supabase | JWT usuario (no service role) ✅ |
| UI `/colmenas` | `ROUTE_ROLE_GUARDS`: admin + apicultor ✅ |
| CHECK `profiles.role` | mig `20260811000000` incluye `apicultor` (aplicar en entorno) |
| Invitaciones patio | crear-cuenta + canje → `profiles.role=apicultor` ✅ |

RLS owner ya filtraba; el corte shell+BFF cierra el agujero menú-sin-authz.

---

## 5. Gaps residuales

1. **Admin en BFF bitácora** no lista capturas ajenas (siempre filtra `user_id`); curaduría global = fase bitácora.
2. **Service role** en otras rutas: no usar para bitácora/colmenas de patio sin filtro de ownership.
3. **Migraciones** `20260811000000` / `20260811010000` deben aplicarse en Supabase remoto antes de crear usuarios patio en prod.
4. **Filas históricas:** mig 39 pasó `apicultor` → `admin`. No auto-degradar; nuevos patio solo por invitación.
5. **PR5 (territorial oleada 2a):** menús por `territorial_rol` aún no implementados (homogéneo hoy).

---

## 6. Criterios de prueba (aislamiento)

Mínimo (unit/integration + smoke manual o e2e):

1. Usuario A (`apicultor`) SELECT colmena con `user_id = A` → OK.
2. Usuario A SELECT colmena con `user_id = B` → 0 filas (RLS).
3. Usuario admin SELECT colmena B → OK.
4. Usuario A POST `/api/bitacora/sesiones` → 201; row `user_id = A`.
5. Usuario `cliente` / `territorial` → 403 en bitácora BFF.
6. Usuario A no entra `/editor-tienda` ni `/contable` (guards).

---

## 7. Decisión de implementación

| Acción | ¿Necesaria? |
|--------|-------------|
| Reescribir políticas colmenas/bitácora | **No** (ya owner-based) |
| Ampliar CHECK + RoleKey + guards + BFF | **Sí** (este corte) |
| Feature flag shell | Opcional si se prefiere deploy gradual; D8 prefiere corte atómico |

Documentado para no reabrir “¿falta RLS?” en cada PR de menú.
