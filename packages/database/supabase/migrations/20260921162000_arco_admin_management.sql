CREATE TABLE IF NOT EXISTS public.arco_solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('supresion', 'portabilidad', 'rectificacion', 'oposicion')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'ejecutada', 'rechazada', 'cancelada')),
  motivo TEXT,
  -- Ley 21.719 requires response within 30 days
  fecha_limite TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  revisado_por UUID REFERENCES public.profiles(id),
  notas_admin TEXT,
  datos_exportados BOOLEAN DEFAULT false,
  ejecutada_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arco_solicitudes_user ON public.arco_solicitudes(user_id);
CREATE INDEX IF NOT EXISTS idx_arco_solicitudes_estado ON public.arco_solicitudes(estado) WHERE estado IN ('pendiente', 'en_revision');

ALTER TABLE public.arco_solicitudes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "arco_admin_all" ON public.arco_solicitudes FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "arco_read_own" ON public.arco_solicitudes FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.trg_arco_auto_solicitud()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.deletion_requested_at IS NOT NULL AND (OLD.deletion_requested_at IS NULL) THEN
    INSERT INTO public.arco_solicitudes (user_id, tipo, motivo)
    VALUES (NEW.id, 'supresion', 'Solicitud automática del titular')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_arco_solicitud_auto ON public.profiles;
CREATE TRIGGER trg_arco_solicitud_auto
  AFTER UPDATE OF deletion_requested_at ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_arco_auto_solicitud();

INSERT INTO public.arco_solicitudes (user_id, tipo, motivo, created_at)
SELECT id, 'supresion', 'Solicitud registrada antes de formalizar el flujo', deletion_requested_at
FROM public.profiles
WHERE deletion_requested_at IS NOT NULL
ON CONFLICT DO NOTHING;
