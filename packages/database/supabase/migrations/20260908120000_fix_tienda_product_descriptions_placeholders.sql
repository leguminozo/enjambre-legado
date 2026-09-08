-- Critiquito blocker: replace keyboard-mash / placeholder product descriptions.
-- Copy from existing brand sources (llms.txt / collections i18n / Nosotros) — no invented claims.
-- Idempotent with fix/tienda-storefront-p0 description UPDATE; safe if both land.

UPDATE productos
SET descripcion_regenerativa = CASE slug
  WHEN 'miel-virgen' THEN
    'Miel virgen en panal, sellada como sale de la colmena. Pureza del néctar del bosque nativo de Chiloé, sin intervenciones.'
  WHEN 'crema-de-miel-y0r3' THEN
    'Crema de miel ulmo-tepú en frasco de mesa. Dulzura boscosa para tus preparaciones y cada cucharada — Tesoros del Colmenar.'
  WHEN 'crema-de-miel' THEN
    'Crema de miel ulmo-tepú en formato mayor. Reserva del bosque para el ritual cotidiano — Reservas del Bosque.'
  WHEN 'sachet-de-miel-con-avellanas' THEN
    'Sachet de 15 g de crema de miel con avellana, para llevar. Gotas de Néctar del bosque nativo de Chiloé.'
  WHEN 'sachet' THEN
    'Sachet de 15 g de crema de miel ulmo-tepú. Formato mínimo para llevar, regalar o probar — Gotas de Néctar.'
  WHEN 'crema-de-miel-con-polen-4crg' THEN
    'Sachet de 15 g de crema de miel con polen. Dosis individual del bosque nativo de Chiloé — Gotas de Néctar.'
  WHEN 'esencia-de-canelo' THEN
    'Esencia de canelo del bosque nativo de Chiloé. Extracción cuidada del territorio, con la misma trazabilidad de nuestras mieles.'
  ELSE descripcion_regenerativa
END
WHERE slug IN (
  'miel-virgen',
  'crema-de-miel-y0r3',
  'crema-de-miel',
  'sachet-de-miel-con-avellanas',
  'sachet',
  'crema-de-miel-con-polen-4crg',
  'esencia-de-canelo'
)
AND (
  descripcion_regenerativa IS NULL
  OR btrim(descripcion_regenerativa) = ''
  OR length(btrim(descripcion_regenerativa)) < 24
  OR descripcion_regenerativa ~* '^(asdf|qwer|zxcv|lorem|test|xxx|bla|asd|qwe|tyguh|ugyv|knjb|blabla|masld|asdad)'
  OR descripcion_regenerativa ~* 'mejor\s+miel\s+de\s+l\s+mundo'
);
