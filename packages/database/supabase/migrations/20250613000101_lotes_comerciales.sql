-- Migración 101: Sprint 3 - Lotes Comerciales y Trazabilidad Pública
-- Extiende la tabla de lotes para soportar el QR público y análisis de laboratorio

ALTER TABLE public.lotes 
  ADD COLUMN actor_id UUID REFERENCES public.actores_registro(id) ON DELETE SET NULL,
  ADD COLUMN variedad_floral TEXT,
  ADD COLUMN metodo_extraccion TEXT CHECK (metodo_extraccion IN ('manual', 'centrifugo', 'prensado', 'otro')),
  ADD COLUMN analisis_humedad NUMERIC,
  ADD COLUMN analisis_hmf NUMERIC,
  ADD COLUMN lab_nombre TEXT,
  ADD COLUMN lab_fecha DATE,
  ADD COLUMN canal_destino TEXT CHECK (canal_destino IN ('individual', 'colectivo', 'acopio', 'interno')),
  ADD COLUMN relato_publico TEXT,
  ADD COLUMN publico BOOLEAN DEFAULT false;

-- RLS: Los lotes públicos pueden ser leídos por cualquiera
-- Primero aseguramos que RLS está habilitado (debería estarlo desde migraciones anteriores, pero reforzamos)
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública: cualquiera puede leer si publico = true
CREATE POLICY "Lotes públicos son visibles para todos"
  ON public.lotes FOR SELECT
  USING (publico = true);

-- Las políticas existentes para propietarios/administradores deberían mantenerse intactas
-- (Suponemos que en migraciones base ya existe RLS para dueños o admins)
