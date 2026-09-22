-- Endurece lectura pública de site_content: solo filas activas.
--
-- El preview de borradores de tienda viaja con anon key (?cms_preview=<token>
-- validado en el middleware de tienda). Esta política garantiza que, aun con
-- acceso directo a la API, solo el contenido publicado sea legible en forma
-- anónima. El editor (Núcleo) opera con service_role y no se ve afectado.

DROP POLICY IF EXISTS "Contenido público legible por todos" ON site_content;

CREATE POLICY "Contenido público legible por todos" ON site_content
  FOR SELECT USING (is_active = true);
