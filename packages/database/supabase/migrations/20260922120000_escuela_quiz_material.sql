-- Escuela de venta: quiz gamificado + material gestionable desde Núcleo.
-- 1) Telemetría admite 'quiz_completado'.
-- 2) escuela_material: banco de preguntas y material (Núcleo lo edita, Campo lo
--    precarga en Dexie y rinde offline con fallback canónico).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rep_ventas_capacitacion_logs_accion_check'
  ) THEN
    ALTER TABLE public.rep_ventas_capacitacion_logs
      DROP CONSTRAINT rep_ventas_capacitacion_logs_accion_check;
  END IF;
END
$$;

ALTER TABLE public.rep_ventas_capacitacion_logs
  ADD CONSTRAINT rep_ventas_capacitacion_logs_accion_check
  CHECK (accion IN ('apertura_guia_cata', 'consulta_objecion', 'modo_atril', 'quiz_completado'));

CREATE TABLE IF NOT EXISTS public.escuela_material (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('objecion', 'guion', 'quiz_pregunta')),
  titulo TEXT NOT NULL,
  cuerpo JSONB NOT NULL DEFAULT '{}'::jsonb,
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escuela_material_tipo
  ON public.escuela_material (tipo, orden) WHERE activo = true;

ALTER TABLE public.escuela_material ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "escuela_material_read" ON public.escuela_material;
CREATE POLICY "escuela_material_read" ON public.escuela_material
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "escuela_material_admin_all" ON public.escuela_material;
CREATE POLICY "escuela_material_admin_all" ON public.escuela_material
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Banco canónico inicial del quiz (edición: Núcleo → Operadores feria → Escuela).
INSERT INTO public.escuela_material (tipo, titulo, cuerpo, orden) VALUES
  ('quiz_pregunta', 'Cristalización',
   '{"pregunta": "Un cliente dice que la miel se puso sólida. ¿Qué respondes?", "opciones": ["Es el certificado de pureza: la miel cruda siempre cristaliza", "Está vencida, hay que descartarla", "Le falta filtrado industrial", "Se guardó en un lugar muy caliente"], "correcta": 0, "explicacion": "La cristalización prueba que no fue sobrecalentada ni pasteurizada."}'::jsonb, 1),
  ('quiz_pregunta', 'Precio',
   '{"pregunta": "¿Por qué vale más que la miel de supermercado?", "opciones": ["Recolección estacional limitada de bosque nativo, sin jarabes ni trashumancia forzada", "Porque el envase es más bonito", "Porque se importa", "Porque tiene conservantes premium"], "correcta": 0, "explicacion": "Monofloral de Ulmo/Tiaca/Tepú con trazabilidad verificable."}'::jsonb, 2),
  ('quiz_pregunta', 'Pureza',
   '{"pregunta": "¿Cómo respaldas que no tiene azúcar añadida?", "opciones": ["Humedad menor a 18% y QR de trazabilidad al lote y apiario", "Por el color dorado", "Por la marca del supermercado", "No se puede respaldar"], "correcta": 0, "explicacion": "Análisis de humedad y centrifugado en frío, auditable por QR."}'::jsonb, 3),
  ('quiz_pregunta', 'Niños',
   '{"pregunta": "¿Desde qué edad la recomiendas?", "opciones": ["Desde 1 año (nunca en lactantes menores de 12 meses)", "Desde el nacimiento", "Solo adultos", "Solo mayores de 60"], "correcta": 0, "explicacion": "OMS/MINSAL: ninguna miel en menores de 12 meses."}'::jsonb, 4),
  ('quiz_pregunta', 'Conservación',
   '{"pregunta": "¿Cómo debe guardarla el cliente?", "opciones": ["Despensa fresca, seca y oscura; jamás refrigerador", "En el refrigerador", "Cerca de la cocina caliente", "En el congelador"], "correcta": 0, "explicacion": "El frío acelera cristalización áspera y absorbe olores."}'::jsonb, 5)
ON CONFLICT DO NOTHING;
