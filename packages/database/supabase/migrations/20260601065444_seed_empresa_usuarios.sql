-- Seed: Create default empresa and link existing users
-- This fixes 403 errors on all has_empresa_access() RLS policies

INSERT INTO empresas (id, rut, razon_social, giro, email)
VALUES (
  'b1e2f3a4-5678-9abc-def0-1234567890ab',
  '76.543.210-K',
  'Enjambre Legado SpA',
  'Apicultura regenerativa',
  'contacto@enjambrelegado.cl'
)
ON CONFLICT (id) DO NOTHING;

-- Map profile.role → usuarios_empresas.rol (owner, contador, operador, lectura)
INSERT INTO usuarios_empresas (user_id, empresa_id, rol)
SELECT
  p.id,
  'b1e2f3a4-5678-9abc-def0-1234567890ab'::uuid,
  CASE
    WHEN p.role IN ('gerente', 'tienda_admin') THEN 'owner'
    WHEN p.role = 'vendedor' THEN 'operador'
    ELSE 'operador'
  END
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios_empresas ue WHERE ue.user_id = p.id
)
ON CONFLICT DO NOTHING;
