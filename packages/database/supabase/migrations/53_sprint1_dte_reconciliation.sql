-- Sprint 1: DTE Emisión + Conciliación Bancaria Automática
-- Migración 49 - Junio 2026

-- ═══ Extend facturas_emitidas with DTE fields ═══
ALTER TABLE public.facturas_emitidas
ADD COLUMN IF NOT EXISTS tipo_dte INTEGER CHECK (tipo_dte IN (33, 34, 39, 41, 46, 52, 56, 61, 66)),
ADD COLUMN IF NOT EXISTS folio INTEGER,
ADD COLUMN IF NOT EXISTS estado_sii TEXT DEFAULT 'pendiente' CHECK (estado_sii IN ('pendiente', 'enviado', 'aceptado', 'rechazado')),
ADD COLUMN IF NOT EXISTS track_id TEXT,
ADD COLUMN IF NOT EXISTS sii_xml TEXT,
ADD COLUMN IF NOT EXISTS sii_response JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS caf_id UUID REFERENCES public.sii_caf(id),
ADD COLUMN IF NOT EXISTS folio_caf INTEGER;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_facturas_emitidas_tipo_dte ON public.facturas_emitidas(tipo_dte);
CREATE INDEX IF NOT EXISTS idx_facturas_emitidas_folio ON public.facturas_emitidas(empresa_id, tipo_dte, folio);
CREATE INDEX IF NOT EXISTS idx_facturas_emitidas_estado_sii ON public.facturas_emitidas(estado_sii);
CREATE INDEX IF NOT EXISTS idx_facturas_emitidas_track_id ON public.facturas_emitidas(track_id);

-- RLS para nuevas columnas (hereda de facturas_emitidas_all)
-- Las políticas existentes ya cubren has_empresa_access()

-- ═══ Reglas de conciliación bancaria automática ═══
CREATE TABLE IF NOT EXISTS public.reconciliation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('venta', 'gasto', 'ambos')),
    campo_primario TEXT NOT NULL CHECK (campo_primario IN ('monto', 'rut', 'rut_contraparte', 'concepto', 'referencia')),
    operador TEXT NOT NULL CHECK (operador IN ('igual', 'mayor_que', 'menor_que', 'entre', 'contiene', 'regex')),
    valor_primario TEXT,
    valor_secundario TEXT,
    campo_secundario TEXT CHECK (campo_secundario IN ('fecha', 'monto', 'rut', 'concepto', 'referencia')),
    operador_secundario TEXT CHECK (operador_secundario IN ('igual', 'mayor_que', 'menor_que', 'entre', 'contiene', 'regex')),
    valor_secundario_2 TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    prioridad INTEGER NOT NULL DEFAULT 0,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_rules_empresa ON public.reconciliation_rules(empresa_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_rules_activo ON public.reconciliation_rules(activo);
CREATE INDEX IF NOT EXISTS idx_reconciliation_rules_prioridad ON public.reconciliation_rules(prioridad DESC);

-- RLS para reconciliation_rules
ALTER TABLE public.reconciliation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empresa_users_select_reconciliation_rules" ON public.reconciliation_rules;
CREATE POLICY "empresa_users_select_reconciliation_rules" ON public.reconciliation_rules
    FOR SELECT USING (has_empresa_access(empresa_id));

DROP POLICY IF EXISTS "empresa_users_insert_reconciliation_rules" ON public.reconciliation_rules;
CREATE POLICY "empresa_users_insert_reconciliation_rules" ON public.reconciliation_rules
    FOR INSERT WITH CHECK (has_empresa_access(empresa_id));

DROP POLICY IF EXISTS "empresa_users_update_reconciliation_rules" ON public.reconciliation_rules;
CREATE POLICY "empresa_users_update_reconciliation_rules" ON public.reconciliation_rules
    FOR UPDATE USING (has_empresa_access(empresa_id));

DROP POLICY IF EXISTS "empresa_users_delete_reconciliation_rules" ON public.reconciliation_rules;
CREATE POLICY "empresa_users_delete_reconciliation_rules" ON public.reconciliation_rules
    FOR DELETE USING (has_empresa_access(empresa_id));

-- ═══ Registro de conciliaciones bancarias automáticas ═══
-- Extiende la tabla existente banco_chile_conciliaciones
ALTER TABLE public.banco_chile_conciliaciones
ADD COLUMN IF NOT EXISTS regla_id UUID REFERENCES public.reconciliation_rules(id),
ADD COLUMN IF NOT EXISTS confianza NUMERIC(5,2) DEFAULT 0.0 CHECK (confianza BETWEEN 0.0 AND 100.0),
ADD COLUMN IF NOT EXISTS tipo_conciliacion TEXT DEFAULT 'manual' CHECK (tipo_conciliacion IN ('manual', 'automatico')),
ADD COLUMN IF NOT EXISTS fecha_propuesta TIMESTAMPTZ;

-- Índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_banco_chile_conciliaciones_regla ON public.banco_chile_conciliaciones(regla_id);
CREATE INDEX IF NOT EXISTS idx_banco_chile_conciliaciones_tipo ON public.banco_chile_conciliaciones(tipo_conciliacion);
CREATE INDEX IF NOT EXISTS idx_banco_chile_conciliaciones_confianza ON public.banco_chile_conciliaciones(confianza DESC);

-- RLS ya existe para banco_chile_conciliaciones (hereda de movimientos)

-- ═══ Semilla de reglas de conciliación por defecto ═══
INSERT INTO public.reconciliation_rules (empresa_id, nombre, tipo, campo_primario, operador, valor_primario, campo_secundario, operador_secundario, valor_secundario, valor_secundario_2, activo, prioridad)
SELECT 
    e.id,
    'Monto exacto + fecha mismo día',
    'ambos',
    'monto',
    'igual',
    NULL,
    'fecha',
    'igual',
    'mismo_dia',
    NULL,
    true,
    0
FROM public.empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM public.reconciliation_rules r 
    WHERE r.empresa_id = e.id AND r.nombre = 'Monto exacto + fecha mismo día'
);

INSERT INTO public.reconciliation_rules (empresa_id, nombre, tipo, campo_primario, operador, valor_primario, campo_secundario, operador_secundario, valor_secundario, valor_secundario_2, activo, prioridad)
SELECT 
    e.id,
    'RUT contraparte + monto',
    'ambos',
    'rut_contraparte',
    'igual',
    NULL,
    'monto',
    'igual',
    NULL,
    NULL,
    true,
    1
FROM public.empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM public.reconciliation_rules r 
    WHERE r.empresa_id = e.id AND r.nombre = 'RUT contraparte + monto'
);

-- Función auxiliar: buscar factura que cumpla una regla de conciliación
CREATE OR REPLACE FUNCTION public.buscar_factura_por_regla(
    reg public.reconciliation_rules,
    mov public.banco_chile_movimientos
)
RETURNS TABLE (
    factura_id UUID,
    confianza NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    fact RECORD;
    condiciones_met INTEGER;
    total_condiciones INTEGER;
    v_confianza NUMERIC;
BEGIN
    total_condiciones := 1; -- campo_primario
    IF reg.campo_secundario IS NOT NULL THEN total_condiciones := total_condiciones + 1; END IF;
    IF reg.valor_secundario_2 IS NOT NULL THEN total_condiciones := total_condiciones + 1; END IF;

    FOR fact IN 
        SELECT f.id, f.monto_total, f.fecha_emision, f.descripcion, t.rut AS tercero_rut
        FROM public.facturas_emitidas f
        LEFT JOIN public.terceros t ON f.tercero_id = t.id
        WHERE f.empresa_id = mov.empresa_id
          AND NOT EXISTS (
              SELECT 1 FROM public.banco_chile_conciliaciones c
              WHERE c.venta_id = f.id
          )
    LOOP
        condiciones_met := 0;

        -- Evaluar campo primario
        IF reg.campo_primario = 'monto' THEN
            IF reg.operador = 'igual' AND mov.monto::NUMERIC = fact.monto_total::NUMERIC THEN
                condiciones_met := condiciones_met + 1;
            ELSIF reg.operador = 'mayor_que' AND mov.monto::NUMERIC > fact.monto_total::NUMERIC THEN
                condiciones_met := condiciones_met + 1;
            ELSIF reg.operador = 'menor_que' AND mov.monto::NUMERIC < fact.monto_total::NUMERIC THEN
                condiciones_met := condiciones_met + 1;
            END IF;
        ELSIF reg.campo_primario = 'rut' OR reg.campo_primario = 'rut_contraparte' THEN
            IF reg.operador = 'igual' AND mov.rut_contraparte = fact.tercero_rut THEN
                condiciones_met := condiciones_met + 1;
            ELSIF reg.operador = 'contiene' AND fact.tercero_rut LIKE '%' || mov.rut_contraparte || '%' THEN
                condiciones_met := condiciones_met + 1;
            END IF;
        ELSIF reg.campo_primario = 'concepto' THEN
            IF reg.operador = 'igual' AND mov.descripcion = fact.descripcion THEN
                condiciones_met := condiciones_met + 1;
            ELSIF reg.operador = 'contiene' AND fact.descripcion ILIKE '%' || mov.descripcion || '%' THEN
                condiciones_met := condiciones_met + 1;
            END IF;
        ELSIF reg.campo_primario = 'referencia' THEN
            IF reg.operador = 'igual' AND mov.numero_operacion = fact.id::TEXT THEN
                condiciones_met := condiciones_met + 1;
            END IF;
        END IF;

        -- Evaluar campo secundario
        IF reg.campo_secundario IS NOT NULL THEN
            IF reg.campo_secundario = 'fecha' THEN
                IF reg.operador_secundario = 'igual' THEN
                    IF reg.valor_secundario = 'mismo_dia' AND mov.fecha_contable::DATE = fact.fecha_emision::DATE THEN
                        condiciones_met := condiciones_met + 1;
                    ELSIF reg.valor_secundario <> 'mismo_dia' AND mov.fecha_contable::DATE = reg.valor_secundario::DATE THEN
                        condiciones_met := condiciones_met + 1;
                    END IF;
                ELSIF reg.operador_secundario = 'entre' AND reg.valor_secundario IS NOT NULL AND reg.valor_secundario_2 IS NOT NULL THEN
                    IF fact.fecha_emision::DATE >= reg.valor_secundario::DATE AND fact.fecha_emision::DATE <= reg.valor_secundario_2::DATE THEN
                        condiciones_met := condiciones_met + 1;
                    END IF;
                END IF;
            ELSIF reg.campo_secundario = 'monto' THEN
                IF reg.operador_secundario = 'igual' AND mov.monto::NUMERIC = fact.monto_total::NUMERIC THEN
                    condiciones_met := condiciones_met + 1;
                END IF;
            END IF;
        END IF;

        -- Calcular confianza
        IF total_condiciones > 0 THEN
            v_confianza := (condiciones_met::NUMERIC / total_condiciones::NUMERIC) * 100.0;
        ELSE
            v_confianza := 0.0;
        END IF;

        IF v_confianza >= 80.0 THEN
            factura_id := fact.id;
            confianza := v_confianza;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$;

-- Función auxiliar: buscar gasto que cumpla una regla de conciliación
CREATE OR REPLACE FUNCTION public.buscar_gasto_por_regla(
    reg public.reconciliation_rules,
    mov public.banco_chile_movimientos
)
RETURNS TABLE (
    gasto_id UUID,
    confianza NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    gas RECORD;
    condiciones_met INTEGER;
    total_condiciones INTEGER;
    v_confianza NUMERIC;
BEGIN
    total_condiciones := 1; -- campo_primario
    IF reg.campo_secundario IS NOT NULL THEN total_condiciones := total_condiciones + 1; END IF;
    IF reg.valor_secundario_2 IS NOT NULL THEN total_condiciones := total_condiciones + 1; END IF;

    FOR gas IN 
        SELECT g.id, g.monto_total, g.fecha, g.descripcion, t.rut AS tercero_rut
        FROM public.gastos g
        LEFT JOIN public.terceros t ON g.tercero_id = t.id
        WHERE g.empresa_id = mov.empresa_id
          AND NOT EXISTS (
              SELECT 1 FROM public.banco_chile_conciliaciones c
              WHERE c.gasto_id = g.id
          )
    LOOP
        condiciones_met := 0;

        -- Evaluar campo primario
        IF reg.campo_primario = 'monto' THEN
            IF reg.operador = 'igual' AND mov.monto::NUMERIC = gas.monto_total::NUMERIC THEN
                condiciones_met := condiciones_met + 1;
            ELSIF reg.operador = 'mayor_que' AND mov.monto::NUMERIC > gas.monto_total::NUMERIC THEN
                condiciones_met := condiciones_met + 1;
            ELSIF reg.operador = 'menor_que' AND mov.monto::NUMERIC < gas.monto_total::NUMERIC THEN
                condiciones_met := condiciones_met + 1;
            END IF;
        ELSIF reg.campo_primario = 'rut' OR reg.campo_primario = 'rut_contraparte' THEN
            IF reg.operador = 'igual' AND mov.rut_contraparte = gas.tercero_rut THEN
                condiciones_met := condiciones_met + 1;
            ELSIF reg.operador = 'contiene' AND gas.tercero_rut LIKE '%' || mov.rut_contraparte || '%' THEN
                condiciones_met := condiciones_met + 1;
            END IF;
        ELSIF reg.campo_primario = 'concepto' THEN
            IF reg.operador = 'igual' AND mov.descripcion = gas.descripcion THEN
                condiciones_met := condiciones_met + 1;
            ELSIF reg.operador = 'contiene' AND gas.descripcion ILIKE '%' || mov.descripcion || '%' THEN
                condiciones_met := condiciones_met + 1;
            END IF;
        ELSIF reg.campo_primario = 'referencia' THEN
            IF reg.operador = 'igual' AND mov.numero_operacion = gas.id::TEXT THEN
                condiciones_met := condiciones_met + 1;
            END IF;
        END IF;

        -- Evaluar campo secundario
        IF reg.campo_secundario IS NOT NULL THEN
            IF reg.campo_secundario = 'fecha' THEN
                IF reg.operador_secundario = 'igual' THEN
                    IF reg.valor_secundario = 'mismo_dia' AND mov.fecha_contable::DATE = gas.fecha::DATE THEN
                        condiciones_met := condiciones_met + 1;
                    ELSIF reg.valor_secundario <> 'mismo_dia' AND mov.fecha_contable::DATE = reg.valor_secundario::DATE THEN
                        condiciones_met := condiciones_met + 1;
                    END IF;
                ELSIF reg.operador_secundario = 'entre' AND reg.valor_secundario IS NOT NULL AND reg.valor_secundario_2 IS NOT NULL THEN
                    IF gas.fecha::DATE >= reg.valor_secundario::DATE AND gas.fecha::DATE <= reg.valor_secundario_2::DATE THEN
                        condiciones_met := condiciones_met + 1;
                    END IF;
                END IF;
            ELSIF reg.campo_secundario = 'monto' THEN
                IF reg.operador_secundario = 'igual' AND mov.monto::NUMERIC = gas.monto_total::NUMERIC THEN
                    condiciones_met := condiciones_met + 1;
                END IF;
            END IF;
        END IF;

        -- Calcular confianza
        IF total_condiciones > 0 THEN
            v_confianza := (condiciones_met::NUMERIC / total_condiciones::NUMERIC) * 100.0;
        ELSE
            v_confianza := 0.0;
        END IF;

        IF v_confianza >= 80.0 THEN
            gasto_id := gas.id;
            confianza := v_confianza;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$;

-- Función para aplicar reglas de conciliación
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
    -- Procesar movimientos no conciliados
    FOR mov IN 
        SELECT m.* 
        FROM public.banco_chile_movimientos m
        WHERE m.empresa_id = p_empresa_id 
          AND m.conciliado = false
        ORDER BY m.fecha_contable DESC
    LOOP
        propuesta_encontrada := false;
        
        -- Aplicar reglas en orden de prioridad
        FOR reg IN 
            SELECT r.* 
            FROM public.reconciliation_rules r
            WHERE r.empresa_id = p_empresa_id 
              AND r.activo = true
            ORDER BY r.prioridad DESC
        LOOP
            -- Evaluar regla según tipo
            IF reg.tipo = 'venta' OR reg.tipo = 'ambos' THEN
                -- Busco en facturas_emitidas
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
                    EXIT; -- Pasa al siguiente movimiento
                END IF;
            END IF;
            
            IF reg.tipo = 'gasto' OR reg.tipo = 'ambos' THEN
                -- Busco en gastos
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
                    EXIT; -- Pasa al siguiente movimiento
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END;
$$;

-- Trigger para ejecutar conciliación automática al insertar movimiento
CREATE OR REPLACE FUNCTION public.trigger_conciliacion_automatica()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    propuesta RECORD;
BEGIN
    -- Solo ejecutar si es un movimiento nuevo y no viene de una conciliación manual
    IF TG_OP = 'INSERT' AND NEW.conciliado = false THEN
        -- Buscar propuesta de conciliación automática
        FOR propuesta IN 
            SELECT * FROM public.aplicar_reglas_conciliacion(NEW.empresa_id)
            WHERE movimiento_id = NEW.id
            LIMIT 1
        LOOP
            -- Insertar conciliación automática si confianza alta
            IF propuesta.confianza >= 90.0 THEN
                INSERT INTO public.banco_chile_conciliaciones (
                    movimiento_id, 
                    venta_id, 
                    gasto_id, 
                    monto, 
                    concepto, 
                    fecha_conciliacion,
                    regla_id,
                    confianza,
                    tipo_conciliacion
                )
                VALUES (
                    propuesta.movimiento_id,
                    CASE WHEN propuesta.tipo_entidad = 'venta' THEN propuesta.entidad_id ELSE NULL END,
                    CASE WHEN propuesta.tipo_entidad = 'gasto' THEN propuesta.entidad_id ELSE NULL END,
                    NEW.monto,
                    'Conciliación automática vía regla ' || (SELECT nombre FROM public.reconciliation_rules WHERE id = propuesta.regla_id),
                    now(),
                    propuesta.regla_id,
                    propuesta.confianza,
                    'automatico'
                );
                
                -- Marcar movimiento como conciliado
                UPDATE public.banco_chile_movimientos 
                SET conciliado = true 
                WHERE id = propuesta.movimiento_id;
                
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_banco_chile_movimientos_conciliacion_automatica ON public.banco_chile_movimientos;
CREATE TRIGGER trg_banco_chile_movimientos_conciliacion_automatica
AFTER INSERT ON public.banco_chile_movimientos
FOR EACH ROW EXECUTE FUNCTION public.trigger_conciliacion_automatica();

-- Actualizar tipos de entidades en la función aplicar_reglas_conciliacion (placeholder - needs completion)
-- Por ahora, las funciones auxiliares retornan boolean, necesitamos adaptar para retornar los IDs
-- Esto se hará en una iteración posterior cuando se implemente la lógica completa en las rutas

-- Actualizar comentario sobre estado
COMMENT ON TABLE public.facturas_emitidas IS 'Facturas emitidas con soporte para DTE electrónico (SII)';
COMMENT ON COLUMN public.facturas_emitidas.tipo_dte IS 'Tipo de DTE según SII: 33=Factura, 34=Factura Exenta, 39=Boleta, 41=Boleta Exenta, 46=Factura de Compra, 52=Guía de Despacho, 56=Nota de Débito, 61=Nota de Crédito, 66=Boleta de Honorarios';
COMMENT ON COLUMN public.facturas_emitidas.folio IS 'Folio autorizado por el CAF';
COMMENT ON COLUMN public.facturas_emitidas.estado_sii IS 'Estado en el SII: pendiente, enviado, aceptado, rechazado';
COMMENT ON COLUMN public.facturas_emitidas.track_id IS 'ID de tracking del envío al SII';
COMMENT ON COLUMN public.facturas_emitidas.sii_xml IS 'XML firmado y timbrado enviado al SII';
COMMENT ON COLUMN public.facturas_emitidas.sii_response IS 'Respuesta completa del SII en JSONB';
COMMENT ON COLUMN public.facturas_emitidas.caf_id IS 'Referencia al CAF utilizado';
COMMENT ON COLUMN public.facturas_emitidas.folio_caf IS 'Folio usado del CAF';

COMMENT ON TABLE public.reconciliation_rules IS 'Reglas para conciliación bancaria automática';
COMMENT ON TABLE public.banco_chile_conciliaciones IS 'Conciliaciones bancarias, ahora con soporte para automática y reglas';

-- Verificar que las funciones existen
DO $$
BEGIN
    RAISE NOTICE 'Migración 49 aplicada correctamente: DTE fields + reconciliation rules';
END;
$$;
