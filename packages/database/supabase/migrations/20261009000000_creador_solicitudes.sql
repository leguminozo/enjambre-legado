-- P0 Postulación de embajadores: cola de solicitudes + RLS.
-- El alta efectiva a `creadores` la ejecuta admin desde Núcleo
-- (insert directo con RLS "Admins gestionan creadores" + rpc generar_codigo_creador).

CREATE TABLE IF NOT EXISTS public.creador_solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_publico TEXT NOT NULL CHECK (char_length(nombre_publico) >= 2),
  plataforma TEXT NOT NULL CHECK (plataforma IN ('instagram', 'tiktok', 'youtube', 'blog', 'podcast', 'otro')),
  plataforma_url TEXT,
  nicho TEXT,
  seguidores_aprox INTEGER NOT NULL DEFAULT 0 CHECK (seguidores_aprox >= 0),
  bio TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  notas TEXT,
  revisado_por UUID REFERENCES auth.users(id),
  revisado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creador_solicitudes_estado ON public.creador_solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_creador_solicitudes_user ON public.creador_solicitudes(user_id);

ALTER TABLE public.creador_solicitudes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios ven su propia solicitud" ON public.creador_solicitudes;
CREATE POLICY "Usuarios ven su propia solicitud" ON public.creador_solicitudes
  FOR SELECT USING ((auth.uid() = user_id) OR public.is_admin());

DROP POLICY IF EXISTS "Usuarios crean su propia solicitud" ON public.creador_solicitudes;
CREATE POLICY "Usuarios crean su propia solicitud" ON public.creador_solicitudes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios actualizan su solicitud" ON public.creador_solicitudes;
CREATE POLICY "Usuarios actualizan su solicitud" ON public.creador_solicitudes
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND estado = 'pendiente');

DROP POLICY IF EXISTS "Admins gestionan solicitudes" ON public.creador_solicitudes;
CREATE POLICY "Admins gestionan solicitudes" ON public.creador_solicitudes
  FOR ALL USING (public.is_admin());
