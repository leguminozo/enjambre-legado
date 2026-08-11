-- =============================================================================
-- Consolidación de duplicación — vínculos + reutilización de módulos existentes
--
-- Resultado de la auditoría profunda (docs/MICROCANALES_CIENCIA_Y_GOBERNANZA.md
-- § «Mapa de reutilización»). Decisiones:
--
--   Fase A — VÍNCULOS (FK opcionales que unen módulos sin romper nada):
--     · infusion_materias_primas.ingredient_id → ingredients (costeo compartido)
--     · infusion_proveedores.tercero_id → terceros (maestro de proveedores)
--     · fid_clientes.user_id → auth.users (puente con profiles/guardian_stamps)
--     · b2b_puntos_venta.participante_contrato_id → participante_contrato
--       (el vendedor de campo con contrato de feria = dueño de un punto del
--       microcanal — la pieza que permite que el POS de campo registre
--       fidelización del microcanal)
--
--   Fase B — RETRIBUCIÓN AL POR MAYOR: el motor de reglas se consolida en
--     `commission_rules` (rule_type 'mayorista', parameter JSONB). El LEDGER
--     `fid_retribuciones` SE QUEDA: `incentivo_ledger` exige user_id NOT NULL
--     (revendedores sin cuenta) y monto >= 0 (contra-asientos negativos) —
--     consolidar el ledger requeriría relajar 4 constraints de un sistema vivo
--     de incentivos; se documenta como proyecto de unificación de ledgers.
--     `fid_retribucion_tiers` también se queda (estatus aspiracional, no
--     retribución monetaria; candidato futuro niveles_fidelizacion).
--
--   Fase C — TAREAS: `crm_tareas` se generaliza (ref_tipo/ref_id/asignado/
--     evidencia) y ABSORBE `infusion_tareas` (ref_tipo='infusion'). El CRM
--     existente queda intacto (filtra por lead_id).
--
--   Fase D — RESEÑAS DE REVENDEDORES: se consolidan en `resenas_producto`
--     (modo 'revendedor', producto_id nullable, revendedor_id) — reutiliza la
--     moderación existente. La RPC moderar_resena_producto solo otorga ciclos
--     para modo='guardian', así que 'revendedor' no recibe incentivos.
-- =============================================================================

-- ── Fase A: vínculos ─────────────────────────────────────────────────────────
ALTER TABLE public.infusion_materias_primas
  ADD COLUMN IF NOT EXISTS ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_infusion_materias_primas_ingredient
  ON public.infusion_materias_primas (ingredient_id);

ALTER TABLE public.infusion_proveedores
  ADD COLUMN IF NOT EXISTS tercero_id UUID REFERENCES public.terceros(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_infusion_proveedores_tercero
  ON public.infusion_proveedores (tercero_id);

ALTER TABLE public.fid_clientes
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_fid_clientes_user ON public.fid_clientes (user_id);

ALTER TABLE public.b2b_puntos_venta
  ADD COLUMN IF NOT EXISTS participante_contrato_id UUID REFERENCES public.participante_contrato(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_b2b_puntos_venta_contrato
  ON public.b2b_puntos_venta (participante_contrato_id);

-- ── Fase B: reglas de retribución → commission_rules ─────────────────────────
-- Empresa de la marca: la primera existente o una single-brand propia.
DO $$
DECLARE
  v_empresa UUID;
BEGIN
  SELECT id INTO v_empresa FROM public.empresas ORDER BY created_at LIMIT 1;
  IF v_empresa IS NULL THEN
    INSERT INTO public.empresas (rut, razon_social, giro)
    VALUES ('SINGLE-BRAND', 'Obrera y Zángano', 'Producción apícola artesanal')
    RETURNING id INTO v_empresa;
  END IF;
  PERFORM set_config('oyz.empresa_id', v_empresa::text, false);
END $$;

-- CHECK de commission_rules: + 'mayorista' (manteniendo los históricos)
ALTER TABLE public.commission_rules DROP CONSTRAINT IF EXISTS commission_rules_rule_type_check;
ALTER TABLE public.commission_rules
  ADD CONSTRAINT commission_rules_rule_type_check
  CHECK (rule_type IN ('base', 'volume_threshold', 'loyalty', 'streak', 'channel_rate', 'tier_bonus', 'mayorista'));

-- Migrar reglas del microcanal al motor genérico (parameter JSONB)
INSERT INTO public.commission_rules (empresa_id, rule_type, name, parameter, active, priority)
SELECT
  current_setting('oyz.empresa_id')::uuid,
  'mayorista',
  r.nombre,
  jsonb_build_object(
    'tipo_original', r.tipo,
    'valor', r.valor,
    'umbral_min_clp', r.umbral_min_clp,
    'umbral_max_clp', r.umbral_max_clp,
    'dias_max', r.dias_max,
    'skus_min', r.skus_min
  ),
  r.activo,
  r.sort_order
FROM public.fid_retribucion_reglas r;

-- Reglas visibles = confianza (el portal/revendedor puede ver los % sin tocar el sistema de comisiones)
DROP POLICY IF EXISTS commission_rules_mayorista_select ON public.commission_rules;
CREATE POLICY commission_rules_mayorista_select ON public.commission_rules
  FOR SELECT USING (rule_type = 'mayorista');

DROP TABLE public.fid_retribucion_reglas;

-- ── Fase C: crm_tareas generalizada absorbe infusion_tareas ──────────────────
ALTER TABLE public.crm_tareas
  ADD COLUMN IF NOT EXISTS ref_tipo TEXT,
  ADD COLUMN IF NOT EXISTS ref_id TEXT,
  ADD COLUMN IF NOT EXISTS asignado_nombre TEXT,
  ADD COLUMN IF NOT EXISTS equipo_id UUID REFERENCES public.infusion_equipo(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS evidencia_path TEXT,
  ADD COLUMN IF NOT EXISTS completada_por TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.crm_tareas ALTER COLUMN fecha_vencimiento DROP NOT NULL;

ALTER TABLE public.crm_tareas DROP CONSTRAINT IF EXISTS crm_tareas_estado_check;
ALTER TABLE public.crm_tareas
  ADD CONSTRAINT crm_tareas_estado_check
  CHECK (estado IN ('pendiente', 'en_proceso', 'completada', 'cancelada'));

ALTER TABLE public.crm_tareas DROP CONSTRAINT IF EXISTS crm_tareas_tipo_check;
ALTER TABLE public.crm_tareas
  ADD CONSTRAINT crm_tareas_tipo_check
  CHECK (tipo IN ('llamada', 'email', 'reunion', 'visita', 'otro', 'produccion'));

-- Migrar tareas de producción (ref_tipo='infusion'; ref_id = lote de la etapa)
INSERT INTO public.crm_tareas (
  lead_id, empresa_id, vendedor_id, titulo, descripcion, tipo, fecha_vencimiento,
  prioridad, estado, completada_at, metadata, created_at, updated_at,
  ref_tipo, ref_id, asignado_nombre, equipo_id, evidencia_path, completada_por, user_id
)
SELECT
  NULL, NULL, NULL, t.tipo, t.notas, 'produccion', t.fecha_vencimiento,
  t.prioridad, t.estado, t.completada_at,
  jsonb_build_object(
    'lote_entrada_id', t.lote_entrada_id,
    'lote_deshidratado_id', t.lote_deshidratado_id,
    'lote_produccion_id', t.lote_produccion_id
  ),
  t.created_at, t.updated_at,
  'infusion',
  COALESCE(t.lote_entrada_id, t.lote_deshidratado_id, t.lote_produccion_id)::text,
  NULL, t.equipo_id, t.evidencia_path, t.completada_por, t.user_id
FROM public.infusion_tareas t;

-- RLS: tareas de producción accesibles a cualquier autenticado (delegación);
-- las del CRM siguen con has_empresa_access. Las policies se combinan con OR.
DROP POLICY IF EXISTS crm_tareas_produccion_p ON public.crm_tareas;
CREATE POLICY crm_tareas_produccion_p ON public.crm_tareas
  FOR ALL USING (ref_tipo = 'infusion' AND auth.uid() IS NOT NULL)
  WITH CHECK (ref_tipo = 'infusion' AND auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_crm_tareas_ref ON public.crm_tareas (ref_tipo, ref_id);

DROP TABLE public.infusion_tareas;

-- ── Fase D: reseñas de revendedores → resenas_producto ───────────────────────
ALTER TABLE public.resenas_producto ALTER COLUMN producto_id DROP NOT NULL;

ALTER TABLE public.resenas_producto DROP CONSTRAINT IF EXISTS resenas_producto_modo_check;
ALTER TABLE public.resenas_producto
  ADD CONSTRAINT resenas_producto_modo_check
  CHECK (modo IN ('anonima', 'guardian', 'revendedor'));

ALTER TABLE public.resenas_producto
  ADD COLUMN IF NOT EXISTS revendedor_id UUID REFERENCES public.b2b_revendedores(id) ON DELETE SET NULL;

-- Migrar (producto_id NULL: las reseñas de revendedor NO aparecen en tienda — son para el portal)
INSERT INTO public.resenas_producto (
  producto_id, modo, estado, rating, comentario_corto, display_name,
  revendedor_id, created_at, updated_at
)
SELECT NULL, 'revendedor', r.estado, r.rating, r.texto, rv.nombre,
       r.revendedor_id, r.created_at, r.updated_at
FROM public.b2b_resenas_revendedor r
JOIN public.b2b_revendedores rv ON rv.id = r.revendedor_id;

CREATE INDEX IF NOT EXISTS idx_resenas_producto_revendedor
  ON public.resenas_producto (revendedor_id);

DROP TABLE public.b2b_resenas_revendedor;
