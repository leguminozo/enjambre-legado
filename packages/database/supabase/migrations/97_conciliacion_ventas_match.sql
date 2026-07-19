-- 97: Conciliación banco ↔ ventas (checkout/POS) además de facturas_emitidas
-- Motor legacy solo buscaba DTE; go-live necesita match de ventas paid.

CREATE OR REPLACE FUNCTION public.buscar_venta_por_regla(
    reg public.reconciliation_rules,
    mov public.banco_chile_movimientos
)
RETURNS TABLE (
    venta_id UUID,
    confianza NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    ven RECORD;
    condiciones_met INTEGER;
    total_condiciones INTEGER;
    v_confianza NUMERIC;
    v_monto NUMERIC;
BEGIN
    total_condiciones := 1;
    IF reg.campo_secundario IS NOT NULL THEN
        total_condiciones := total_condiciones + 1;
    END IF;

    FOR ven IN
        SELECT
            v.id,
            v.total::NUMERIC AS monto_total,
            v.created_at AS fecha_emision,
            COALESCE(v.buy_order, v.id::TEXT) AS descripcion
        FROM public.ventas v
        WHERE v.empresa_id = mov.empresa_id
          AND COALESCE(v.estado, '') = 'paid'
          AND COALESCE(v.conciliado, false) = false
          AND NOT EXISTS (
              SELECT 1
              FROM public.banco_chile_conciliaciones c
              WHERE c.venta_id = v.id
          )
    LOOP
        condiciones_met := 0;
        v_monto := ven.monto_total;

        IF reg.campo_primario = 'monto' THEN
            IF reg.operador = 'igual' AND mov.monto::NUMERIC = v_monto THEN
                condiciones_met := condiciones_met + 1;
            ELSIF reg.operador = 'mayor_que' AND mov.monto::NUMERIC > v_monto THEN
                condiciones_met := condiciones_met + 1;
            ELSIF reg.operador = 'menor_que' AND mov.monto::NUMERIC < v_monto THEN
                condiciones_met := condiciones_met + 1;
            END IF;
        ELSIF reg.campo_primario = 'concepto' THEN
            IF reg.operador = 'igual' AND mov.descripcion = ven.descripcion THEN
                condiciones_met := condiciones_met + 1;
            ELSIF reg.operador = 'contiene'
                  AND ven.descripcion ILIKE '%' || COALESCE(mov.descripcion, '') || '%' THEN
                condiciones_met := condiciones_met + 1;
            END IF;
        ELSIF reg.campo_primario = 'referencia' THEN
            IF reg.operador = 'igual'
               AND (
                 mov.numero_operacion = ven.id::TEXT
                 OR mov.numero_operacion = ven.descripcion
                 OR mov.descripcion ILIKE '%' || ven.descripcion || '%'
               ) THEN
                condiciones_met := condiciones_met + 1;
            END IF;
        ELSIF reg.campo_primario IN ('rut', 'rut_contraparte') THEN
            -- ventas sin RUT contraparte: no suma condición (confianza baja)
            NULL;
        END IF;

        IF reg.campo_secundario IS NOT NULL THEN
            IF reg.campo_secundario = 'fecha' THEN
                IF reg.operador_secundario = 'igual' THEN
                    IF reg.valor_secundario = 'mismo_dia'
                       AND mov.fecha_contable::DATE = ven.fecha_emision::DATE THEN
                        condiciones_met := condiciones_met + 1;
                    ELSIF reg.valor_secundario IS NOT NULL
                          AND reg.valor_secundario <> 'mismo_dia'
                          AND mov.fecha_contable::DATE = reg.valor_secundario::DATE THEN
                        condiciones_met := condiciones_met + 1;
                    END IF;
                ELSIF reg.operador_secundario = 'entre'
                      AND reg.valor_secundario IS NOT NULL
                      AND reg.valor_secundario_2 IS NOT NULL THEN
                    IF ven.fecha_emision::DATE >= reg.valor_secundario::DATE
                       AND ven.fecha_emision::DATE <= reg.valor_secundario_2::DATE THEN
                        condiciones_met := condiciones_met + 1;
                    END IF;
                END IF;
            ELSIF reg.campo_secundario = 'monto' THEN
                IF reg.operador_secundario = 'igual' AND mov.monto::NUMERIC = v_monto THEN
                    condiciones_met := condiciones_met + 1;
                END IF;
            END IF;
        END IF;

        IF total_condiciones > 0 THEN
            v_confianza := (condiciones_met::NUMERIC / total_condiciones::NUMERIC) * 100.0;
        ELSE
            v_confianza := 0.0;
        END IF;

        -- Slightly prefer factura matches elsewhere; ventas need ≥80 too
        IF v_confianza >= 80.0 THEN
            venta_id := ven.id;
            confianza := v_confianza;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.aplicar_reglas_conciliacion(
    p_empresa_id UUID
)
RETURNS TABLE (
    movimiento_id UUID,
    propuesta_id UUID,
    tipo_entidad TEXT,
    entidad_id UUID,
    confianza NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    reg RECORD;
    mov RECORD;
    prop RECORD;
    propuesta_encontrada BOOLEAN;
BEGIN
    FOR mov IN
        SELECT m.*
        FROM public.banco_chile_movimientos m
        WHERE m.empresa_id = p_empresa_id
          AND m.conciliado = false
        ORDER BY m.fecha_contable DESC
    LOOP
        propuesta_encontrada := false;

        FOR reg IN
            SELECT r.*
            FROM public.reconciliation_rules r
            WHERE r.empresa_id = p_empresa_id
              AND r.activo = true
            ORDER BY r.prioridad DESC
        LOOP
            IF reg.tipo = 'venta' OR reg.tipo = 'ambos' THEN
                -- 1) DTE / facturas emitidas
                FOR prop IN
                    SELECT * FROM public.buscar_factura_por_regla(reg, mov)
                    ORDER BY confianza DESC
                    LIMIT 1
                LOOP
                    movimiento_id := mov.id;
                    propuesta_id := reg.id;
                    tipo_entidad := 'venta';
                    entidad_id := prop.factura_id;
                    confianza := prop.confianza;
                    propuesta_encontrada := true;
                    RETURN NEXT;
                END LOOP;

                IF propuesta_encontrada THEN
                    EXIT;
                END IF;

                -- 2) Fallback go-live: ventas paid (checkout web / POS)
                FOR prop IN
                    SELECT * FROM public.buscar_venta_por_regla(reg, mov)
                    ORDER BY confianza DESC
                    LIMIT 1
                LOOP
                    movimiento_id := mov.id;
                    propuesta_id := reg.id;
                    tipo_entidad := 'venta';
                    entidad_id := prop.venta_id;
                    confianza := prop.confianza;
                    propuesta_encontrada := true;
                    RETURN NEXT;
                END LOOP;

                IF propuesta_encontrada THEN
                    EXIT;
                END IF;
            END IF;

            IF reg.tipo = 'gasto' OR reg.tipo = 'ambos' THEN
                FOR prop IN
                    SELECT * FROM public.buscar_gasto_por_regla(reg, mov)
                    ORDER BY confianza DESC
                    LIMIT 1
                LOOP
                    movimiento_id := mov.id;
                    propuesta_id := reg.id;
                    tipo_entidad := 'gasto';
                    entidad_id := prop.gasto_id;
                    confianza := prop.confianza;
                    propuesta_encontrada := true;
                    RETURN NEXT;
                END LOOP;

                IF propuesta_encontrada THEN
                    EXIT;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.buscar_venta_por_regla IS
  'Match banco_chile_movimientos → ventas paid (checkout/POS) for conciliación go-live';
COMMENT ON FUNCTION public.aplicar_reglas_conciliacion IS
  'Propuestas: facturas_emitidas → ventas paid → gastos; tenant p_empresa_id';
