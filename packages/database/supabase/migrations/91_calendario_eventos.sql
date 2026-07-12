-- Eventos de calendario propios (estilo Apple Calendar): día + hora, CRUD en Núcleo.
-- Convive con eventos de dominio (ferias, cosechas, posts) que se leen read-only.

CREATE TABLE IF NOT EXISTS public.calendario_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(trim(title)) >= 1 AND char_length(title) <= 200),
  notes text,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  category text NOT NULL DEFAULT 'personal'
    CHECK (category IN (
      'personal',
      'reunion',
      'feria',
      'apicultura',
      'marketing',
      'logistica',
      'otro'
    )),
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calendario_eventos_range_chk CHECK (ends_at >= starts_at)
);

CREATE INDEX IF NOT EXISTS calendario_eventos_starts_idx
  ON public.calendario_eventos (starts_at);

CREATE INDEX IF NOT EXISTS calendario_eventos_empresa_starts_idx
  ON public.calendario_eventos (empresa_id, starts_at);

CREATE INDEX IF NOT EXISTS calendario_eventos_user_starts_idx
  ON public.calendario_eventos (user_id, starts_at);

COMMENT ON TABLE public.calendario_eventos IS
  'Eventos de agenda editables (Núcleo Calendario). Separados de eventos/ferias y registros de campo.';

ALTER TABLE public.calendario_eventos ENABLE ROW LEVEL SECURITY;

-- Lectura: autenticados (mismo patrón que otras tablas de gestión interna)
DROP POLICY IF EXISTS calendario_eventos_select ON public.calendario_eventos;
CREATE POLICY calendario_eventos_select ON public.calendario_eventos
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS calendario_eventos_insert ON public.calendario_eventos;
CREATE POLICY calendario_eventos_insert ON public.calendario_eventos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS calendario_eventos_update ON public.calendario_eventos;
CREATE POLICY calendario_eventos_update ON public.calendario_eventos
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS calendario_eventos_delete ON public.calendario_eventos;
CREATE POLICY calendario_eventos_delete ON public.calendario_eventos
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Service role full access (BFF / admin client)
DROP POLICY IF EXISTS calendario_eventos_service ON public.calendario_eventos;
CREATE POLICY calendario_eventos_service ON public.calendario_eventos
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.calendario_eventos_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calendario_eventos_updated_at ON public.calendario_eventos;
CREATE TRIGGER calendario_eventos_updated_at
  BEFORE UPDATE ON public.calendario_eventos
  FOR EACH ROW
  EXECUTE FUNCTION public.calendario_eventos_touch_updated_at();
