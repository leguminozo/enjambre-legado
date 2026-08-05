## Reparación DESPACHO → cola de envíos operativa de la empresa

**Causa raíz**: la cola (`/dashboard` y `/envios`) filtra `logistica_envios` por `user_id = admin`, pero los envíos automáticos del checkout de Tienda llevan `user_id` = comprador (o NULL en guest). Resultado: invisibles en la cola, no actualizables, detección "ya enviado" rota (duplicados) y `venta.estado='despachado'` viola el CHECK unificado (migración 20260802110000) que no incluye ese estado.

**Dirección natural**: la cola es de la empresa (`empresa_id`), no personal (`user_id`). La tabla ya tiene `empresa_id` (migración 45) y el checkout ya lo setea.

### 1. Migración nueva `packages/database/supabase/migrations/1013_logistica_cola_empresa.sql`
- **RLS org-scoped** para `logistica_envios` (hoy solo `user_id = auth.uid() OR is_gerente()`):
  ```sql
  DROP POLICY IF EXISTS logistica_envios_p ON logistica_envios;
  CREATE POLICY logistica_envios_empresa_p ON logistica_envios
    FOR ALL
    USING (user_id = auth.uid() OR public.is_gerente() OR public.has_empresa_access(empresa_id))
    WITH CHECK (user_id = auth.uid() OR public.has_empresa_access(empresa_id));
  ```
- **Backfill**: `UPDATE logistica_envios SET empresa_id = ue.empresa_id FROM usuarios_empresas ue WHERE logistica_envios.empresa_id IS NULL AND logistica_envios.user_id = ue.user_id;` (los envíos manuales legacy del admin quedan en su empresa)
- **CHECK `ventas.estado`**: agregar `'despachado'` al CHECK unificado (la intención ya existe en `logistica.ts:262,343` y el flujo tienda lo espera; hoy fallaría en silencio)
- Índice `(empresa_id, status)` para las queries de la cola

### 2. BFF `apps/nucleo/src/api/routes/logistica.ts`
- `/dashboard` y `/envios` GET: filtro `.eq("empresa_id", empresaId)` en vez de `.eq("user_id", user.id)`
- `/dashboard`: nueva query `logistica_envios.select('venta_id').eq("empresa_id", empresaId)` → cada venta de `ventasRecientes` lleva `pendiente_envio` calculado **server-side** (verdad única, mata el bug de duplicados en cliente)
- `POST /envios`: insertar `empresa_id: empresaId`
- `PATCH` y `DELETE /envios/:id`: filtro por `empresa_id` (ya no `user_id`) → el admin puede operar los envíos automáticos de Tienda; al pasar a "En tránsito"/"Entregado" dispara `venta.estado='despachado'` (ahora válido) + `notifyShipmentDispatched` al comprador

### 3. UI `apps/nucleo/src/views/despacho/EnviosView.tsx` + `components/logistica/types.ts`
- `VentaReciente` gana `pendiente_envio?: boolean`; el check `hasEnvio` pasa a usar el flag del server (`v.pendiente_envio === false`) en vez de comparar contra la lista filtrada
- Dropdown de estados: agregar opción "Pendiente" (los automáticos nacen `pendiente`, hoy no aparece en el select)
- `EnvioComposerModal` recibe solo las ventas `pendiente_envio !== false` (no ofrecer duplicar un envío existente)
- Subtítulo de la vista: "cola operativa de la empresa" (texto)

### 4. Test nuevo `apps/nucleo/src/api/routes/__tests__/logistica.test.ts`
- Patrón `mockFrom` existente en el repo: dashboard calcula `pendiente_envio` correctamente; PATCH opera por empresa; POST setea `empresa_id`

### Verificación
- `pnpm --filter @enjambre/nucleo test` (nuevo test) y `pnpm --filter @enjambre/nucleo build`
- Sin cambios de schema de columnas → no requiere typegen (las policies no cambian `database.types.ts`)

### Notas / límites conocidos (fuera de alcance)
- El checkout guest setea `empresa_id` = primera empresa de la tabla (`.limit(1)` en `checkout-fulfill.ts:162`); si hay varias empresas, un guest podría quedar en la empresa equivocada. Se documenta, no se corrige acá.
- Los envíos con `empresa_id` y `user_id` nulos (legacy huérfano) quedan visibles solo para `is_gerente()`.