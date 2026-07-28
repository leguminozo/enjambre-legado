-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 100 — Hotfix Zero-Trust: revocar grants peligrosos de RPC
-- CVE-N-001, CVE-N-002, CVE-L-013
--
-- Las siguientes funciones SECURITY DEFINER mutaban inventario o exponían
-- ventas sin validar al caller. El grant a anon/authenticated permitía que
-- un atacante sin sesión (o con cualquier sesión básica) vaciara stock,
-- inflara inventario y creara lotes fraudulentos, o brute-forceara tokens
-- de venta. Aquí se revoca el grant peligroso y se añade verificación de
-- autorización en el cuerpo de cada función.
-- ═══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- 1) decrement_stock — sólo service_role (BFF autenticado). Auth interna.
-- CVE-N-001: el grant a anon permitía vaciar inventario sin autenticación.
-- ──────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.decrement_stock(UUID, INT) FROM anon, authenticated;

-- Drop + Create (en lugar de CREATE OR REPLACE) porque la firma de retorno cambió
-- (se añadió traceability_hash). Postgres rechaza cambiar return type con OR REPLACE.
DROP FUNCTION IF EXISTS public.decrement_stock(UUID, INT);
CREATE FUNCTION public.decrement_stock(p_id UUID, p_qty INT)
RETURNS TABLE (id UUID, stock INT, lote_id UUID, kg_restante_lote DECIMAL, traceability_hash TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lote_id UUID;
  v_new_stock INT;
  v_kg_restante DECIMAL;
  v_hash TEXT;
BEGIN
  -- Zero-Trust: sólo el BFF (service_role) o un admin verificado en BD.
  IF current_setting('role', true) <> 'service_role'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller not authorized' USING ERRCODE = '42501';
  END IF;

  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'invalid qty' USING ERRCODE = '22023';
  END IF;

  UPDATE productos
  SET stock = stock - p_qty
  WHERE productos.id = p_id AND productos.stock >= p_qty
  RETURNING productos.id, productos.stock, productos.lote_id
  INTO id, v_new_stock, v_lote_id;

  IF id IS NULL THEN
    RETURN;
  END IF;

  IF v_lote_id IS NOT NULL THEN
    SELECT kg_total, blockchain_hash
    INTO v_kg_restante, v_hash
    FROM lotes
    WHERE lotes.id = v_lote_id;
  END IF;

  RETURN QUERY SELECT id, v_new_stock, v_lote_id, v_kg_restante, v_hash;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_stock(UUID, INT) TO service_role;

-- ──────────────────────────────────────────────────────────────────────────
-- 2) add_traceable_stock — sólo service_role. Auth interna + bound qty.
-- CVE-N-002: el grant a authenticated permitía inflar stock y fabricar lotes.
-- ──────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.add_traceable_stock(UUID, INT) FROM authenticated;

CREATE OR REPLACE FUNCTION public.add_traceable_stock(p_producto_id UUID, p_qty INT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_peso_neto INT;
  v_current_stock INT;
  v_new_lote_id UUID;
  v_hash TEXT;
  v_kg_agregado DECIMAL;
BEGIN
  IF current_setting('role', true) <> 'service_role'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller not authorized' USING ERRCODE = '42501';
  END IF;

  IF p_qty IS NULL OR p_qty <= 0 OR p_qty > 100000 THEN
    RAISE EXCEPTION 'invalid qty' USING ERRCODE = '22023';
  END IF;

  SELECT peso_neto_g, stock
  INTO v_peso_neto, v_current_stock
  FROM productos
  WHERE id = p_producto_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado' USING ERRCODE = 'P0002';
  END IF;

  v_hash := encode(
    digest(p_producto_id::text || now()::text || gen_random_uuid()::text, 'sha256'),
    'hex'
  );

  v_kg_agregado := (COALESCE(v_peso_neto, 0) * p_qty) / 1000.0;

  INSERT INTO lotes (kg_total, blockchain_hash, estado)
  VALUES (v_kg_agregado, v_hash, 'disponible')
  RETURNING id INTO v_new_lote_id;

  UPDATE productos
  SET stock = COALESCE(stock, 0) + p_qty,
      lote_id = v_new_lote_id
  WHERE id = p_producto_id;

  RETURN json_build_object(
    'producto_id', p_producto_id,
    'stock_anterior', v_current_stock,
    'stock_nuevo', COALESCE(v_current_stock, 0) + p_qty,
    'lote_id', v_new_lote_id,
    'traceability_hash', v_hash
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_traceable_stock(UUID, INT) TO service_role;

-- ──────────────────────────────────────────────────────────────────────────
-- 3) obtener_venta_por_claim_token — revoke anon. Brute-force de ventas.
-- CVE-L-013: el grant a anon exponía totales/items de cualquier venta.
── Sólo authenticated. (Defensa en profundidad: el token debe ser opaco más
-- adelante; aquí cerramos el vector anon inmediato.)
-- ──────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.obtener_venta_por_claim_token(UUID) FROM anon;

-- reclamar_venta_por_claim_token ya valida auth.uid() internamente;
-- dejamos su grant a authenticated (caller autenticado gana el claim).
-- Refuerzo: impedir re-claim de la misma venta por un segundo caller.
-- (La función original ya filtra claim_status='pending'.) Sin cambios.

-- ═══════════════════════════════════════════════════════════════════════════
-- Verificación post-migration (manual, opcional):
--   SELECT proname, proacl FROM pg_proc
--   WHERE proname IN ('decrement_stock','add_traceable_stock','obtener_venta_por_claim_token');
--   decrement_stock / add_traceable_stock → {=,service_role=...}
--   obtener_venta_por_claim_token → {authenticated=...,service_role=...} (sin anon)
-- ═══════════════════════════════════════════════════════════════════════════
