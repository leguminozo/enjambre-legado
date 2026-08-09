-- =============================================================================
-- Semana 0 — P0 Seguridad del Registro Territorial Apícola de Chiloé.
--
-- 1. alertas_en_radio: gate de sesión + REVOKE/GRANT de EXECUTE. Era
--    SECURITY DEFINER con EXECUTE por defecto a PUBLIC → cualquier anónimo
--    podía invocarla y leer filas completas de alertas activas (incl.
--    confirmaciones con actor_id) saltándose RLS. Patrón de
--    992_zero_trust_revoke_rpc_grants. Firma, nombres de parámetros (el BFF
--    llama con named args p_lat/p_lng/p_radio) y cuerpo haversine quedan
--    idénticos a 991.
--
-- 2. Decisión de gobernanza C (documentada en /carta):
--    - predios_facilitadores: lectura comunitaria exige consentimiento
--      mapa_comunitario del actor dueño (bien privado ofrecido
--      voluntariamente) — misma escalera que apiarios_registro (1004).
--    - apiarios_externos: SIN gate deliberado. La transparencia del
--      trashumante declarado es condición de la declaración (lógica de la
--      ordenanza de Panguipulli: avisar es el precio de entrada al
--      territorio). Un gate por consentimiento haría invisible a un
--      trashumante que cumple la ordenanza pero no consiente el mapa →
--      agujero en la Defensa Territorial.
--
-- 3. is_gerente() → alias de is_admin(): la migración 39 ya las hizo
--    funcionalmente idénticas (ambas checan role='admin'). El alias evita
--    que una futura redefinición de is_gerente() cambie en silencio las
--    políticas de las ~17 migraciones que la usan.
--
-- 4. Consentimientos con evidencia temporal (Ley 21.719): consentimientos_at
--    y consentimientos_version. Sin backfill de consentimientos_at: no se
--    puede saber cuándo consintieron los actores existentes (NULL es honesto).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. alertas_en_radio — gate + revoke/grants (preservando 991)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.alertas_en_radio(
  p_lat   DOUBLE PRECISION,
  p_lng   DOUBLE PRECISION,
  p_radio DOUBLE PRECISION DEFAULT 5
)
RETURNS SETOF public.alertas_fitosanitarias
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Gate: sin sesión no hay filas (defensa en profundidad; el REVOKE ya
  -- impide que anon siquiera ejecute).
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.alertas_fitosanitarias
  WHERE estado = 'activa'
    AND lat_aproximada IS NOT NULL
    AND lng_aproximada IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(p_lat)) * cos(radians(lat_aproximada)) *
        cos(radians(lng_aproximada) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(lat_aproximada))
      )
    ) <= p_radio
  ORDER BY fecha_programada ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.alertas_en_radio(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.alertas_en_radio(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2. RLS comunitaria — decisión C (ver /carta)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "predios_community_read" ON public.predios_facilitadores;
CREATE POLICY "predios_community_read" ON public.predios_facilitadores
  FOR SELECT USING (
    activo = true
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.actores_registro a
      WHERE a.id = actor_id
        AND a.consentimientos->>'mapa_comunitario' = 'true'
    )
  );

-- apiarios_ext_community_read: se mantiene como en 991 por la decisión C
-- (transparencia del trashumante = condición de la declaración).

-- -----------------------------------------------------------------------------
-- 3. is_gerente() → alias de is_admin()
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_gerente()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin();
$$;

-- TODO (próxima migración de seguridad): reemplazar los usos restantes de
-- is_gerente() por is_admin() en las políticas que la usan (01, 06, 35, 40,
-- 54, 991, 994, 1010, 1011, 1013, 1014 y migraciones 2026*).

-- -----------------------------------------------------------------------------
-- 4. get_ecosystem_metrics — contador público real
--    Era SECURITY INVOKER y la landing de tienda la llamaba con cliente anon
--    → RLS bloqueaba colmenas/apiarios y el contador público mostraba 0.
--    Solo agrega conteos (sin datos de usuario), seguro como DEFINER.
-- -----------------------------------------------------------------------------
ALTER FUNCTION public.get_ecosystem_metrics() SECURITY DEFINER;
REVOKE EXECUTE ON FUNCTION public.get_ecosystem_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ecosystem_metrics() TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 5. Consentimientos con evidencia temporal (Ley 21.719)
-- -----------------------------------------------------------------------------
ALTER TABLE public.actores_registro
  ADD COLUMN IF NOT EXISTS consentimientos_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consentimientos_version TEXT DEFAULT '2026-08';

-- -----------------------------------------------------------------------------
-- 6. Configuración del censo (fecha de cierre real en DB — el badge del hero
--    deja de ser texto muerto) y RPC pública de agregados (Semana 1-2).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.config_censo (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  cierre DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed: cierre del censo 2026-2027 = 31 de octubre, sincronizado con la
-- actualización anual obligatoria ante el SAG (Res. Exenta 8.196/2015).
-- ON CONFLICT DO NOTHING: no pisa un cierre cambiado por la administración.
INSERT INTO public.config_censo (id, cierre)
VALUES (1, '2026-10-31')
ON CONFLICT (id) DO NOTHING;

-- RPC pública del contador: solo 4 agregados + fecha de cierre. NUNCA filas
-- crudas (sin nombres, sin coordenadas). SECURITY DEFINER con EXECUTE solo
-- para anon/authenticated/service_role → la defensa en profundidad del
-- anonimizado vive en la DB, no solo en la capa BFF (gap §3.6 de la auditoría).
CREATE OR REPLACE FUNCTION public.censo_stats_public()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'actores_activos',      (SELECT COUNT(*) FROM public.actores_registro WHERE estado = 'activo'),
    'comunas',              (SELECT COUNT(DISTINCT comuna) FROM public.actores_registro WHERE estado = 'activo'),
    'apiarios_activos',     (SELECT COUNT(*) FROM public.apiarios_registro WHERE activo = true),
    'colmenas_registradas', (SELECT COALESCE(SUM(n_colmenas), 0)::bigint FROM public.apiarios_registro WHERE activo = true),
    'cierre',               (SELECT cierre::text FROM public.config_censo WHERE id = 1)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.censo_stats_public() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.censo_stats_public() TO anon, authenticated, service_role;
