-- =============================================================================
-- Fase 2 — Tareas + Equipo + Foto de evidencia (módulo Infusiones)
--
-- Delegación formal: cada paso de producción (recolección, deshidratado,
-- molienda, mezcla, dosificado, envasado) puede convertirse en una tarea
-- asignable a un miembro del equipo con rol de operación. La foto de evidencia
-- del pesaje habilita la validación remota: quien delega ve el registro sin
-- estar presente.
--
-- Decisiones de diseño:
--   · `infusion_equipo` es un catálogo liviano (sin tocar auth/profiles):
--     los delegados pueden no tener cuenta todavía. El rol `dosificador`
--     reserva el paso `dosificado` (validado en el BFF).
--   · `infusion_tareas` clona el patrón de `crm_tareas` (estado/prioridad/
--     vencimiento) agregando `en_proceso`, y referencia lotes de forma
--     OPCIONAL: una tarea de recolección puede crearse antes de que exista
--     el lote de entrada.
--   · `completada_at`/`completada_por` los setea el servidor al pasar a
--     `completada` (no se confía en el cliente).
--   · Evidencia: bucket PRIVADO `infusiones-evidencias` (patrón
--     certificados-sanitarios: owner escribe, owner/admin leen); en la tabla
--     se guarda el path y el BFF firma URLs al leer.
-- =============================================================================

-- ── Equipo (catálogo de personas) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.infusion_equipo (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT NOT NULL,
  rol_operacion TEXT NOT NULL DEFAULT 'operario'
                CHECK (rol_operacion IN ('operario', 'dosificador')),
  activa        BOOLEAN NOT NULL DEFAULT true,  -- soft delete
  notas         TEXT,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_infusion_equipo_nombre
  ON public.infusion_equipo (nombre);

COMMENT ON TABLE public.infusion_equipo IS
  'Equipo de producción Infusiones: personas a quienes delegar pasos (catálogo liviano, sin cuenta de auth requerida).';
COMMENT ON COLUMN public.infusion_equipo.rol_operacion IS
  'Rol de operación. El paso "dosificado" queda reservado a miembros con rol dosificador (validado en el BFF).';

-- ── Tareas ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.infusion_tareas (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo                  TEXT NOT NULL
                        CHECK (tipo IN ('recoleccion', 'deshidratado', 'molienda', 'mezcla', 'dosificado', 'envasado')),
  -- Referencia opcional: una tarea puede crearse antes de que exista el lote.
  lote_entrada_id       UUID REFERENCES public.infusion_lotes_entrada(id) ON DELETE SET NULL,
  lote_deshidratado_id  UUID REFERENCES public.infusion_lotes_deshidratado(id) ON DELETE SET NULL,
  lote_produccion_id    UUID REFERENCES public.infusion_lotes_produccion(id) ON DELETE SET NULL,
  equipo_id             UUID REFERENCES public.infusion_equipo(id) ON DELETE SET NULL,
  estado                TEXT NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente', 'en_proceso', 'completada')),
  fecha_vencimiento     DATE,
  prioridad             TEXT NOT NULL DEFAULT 'media'
                        CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  evidencia_path        TEXT,  -- path en bucket privado infusiones-evidencias
  completada_at         TIMESTAMPTZ,  -- server-set al pasar a completada
  completada_por        TEXT,
  notas                 TEXT,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_infusion_tareas_estado_vencimiento
  ON public.infusion_tareas (estado, fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_infusion_tareas_equipo
  ON public.infusion_tareas (equipo_id);
CREATE INDEX IF NOT EXISTS idx_infusion_tareas_tipo
  ON public.infusion_tareas (tipo);

COMMENT ON TABLE public.infusion_tareas IS
  'Tareas de producción por paso, asignables a miembros del equipo, con foto de evidencia del pesaje para validación remota.';
COMMENT ON COLUMN public.infusion_tareas.evidencia_path IS
  'Path del objeto en el bucket privado infusiones-evidencias (el BFF firma la URL al leer).';

-- ── Bucket de evidencias (privado) ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'infusiones-evidencias', 'infusiones-evidencias', false,
  52428800,  -- 50 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Patrón certificados-sanitarios: quien sube es owner; owner y admin leen.
DROP POLICY IF EXISTS storage_infusiones_evidencias_read ON storage.objects;
CREATE POLICY storage_infusiones_evidencias_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'infusiones-evidencias'
    AND (owner = auth.uid() OR public.is_admin())
  );

DROP POLICY IF EXISTS storage_infusiones_evidencias_insert ON storage.objects;
CREATE POLICY storage_infusiones_evidencias_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'infusiones-evidencias'
    AND owner = auth.uid()
  );

DROP POLICY IF EXISTS storage_infusiones_evidencias_update ON storage.objects;
CREATE POLICY storage_infusiones_evidencias_update ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'infusiones-evidencias'
    AND (owner = auth.uid() OR public.is_admin())
  ) WITH CHECK (bucket_id = 'infusiones-evidencias');

DROP POLICY IF EXISTS storage_infusiones_evidencias_delete ON storage.objects;
CREATE POLICY storage_infusiones_evidencias_delete ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'infusiones-evidencias'
    AND (owner = auth.uid() OR public.is_admin())
  );

-- ── updated_at (función compartida definida en 991) ──────────────────────────
DROP TRIGGER IF EXISTS infusion_equipo_updated_at ON public.infusion_equipo;
CREATE TRIGGER infusion_equipo_updated_at
  BEFORE UPDATE ON public.infusion_equipo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS infusion_tareas_updated_at ON public.infusion_tareas;
CREATE TRIGGER infusion_tareas_updated_at
  BEFORE UPDATE ON public.infusion_tareas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── RLS (patrón uniforme del módulo: dueño o admin/gerente) ──────────────────
ALTER TABLE public.infusion_equipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infusion_tareas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS infusion_equipo_own_p ON public.infusion_equipo;
CREATE POLICY infusion_equipo_own_p ON public.infusion_equipo
  FOR ALL
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_gerente())
  WITH CHECK (user_id = auth.uid() OR public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS infusion_tareas_own_p ON public.infusion_tareas;
CREATE POLICY infusion_tareas_own_p ON public.infusion_tareas
  FOR ALL
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_gerente())
  WITH CHECK (user_id = auth.uid() OR public.is_admin() OR public.is_gerente());
