BEGIN;
SELECT plan(8);

-- 1. Setup inicial (como postgres para bypassear RLS y crear data de prueba)
SET LOCAL role TO postgres;

-- Insertar dos usuarios normales y un admin
INSERT INTO auth.users (id, email) VALUES 
('11111111-1111-1111-1111-111111111111', 'user1@test.com'),
('22222222-2222-2222-2222-222222222222', 'user2@test.com'),
('33333333-3333-3333-3333-333333333333', 'admin@test.com')
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role) VALUES 
('11111111-1111-1111-1111-111111111111', 'user1@test.com', 'User 1', 'cliente'),
('22222222-2222-2222-2222-222222222222', 'user2@test.com', 'User 2', 'cliente'),
('33333333-3333-3333-3333-333333333333', 'admin@test.com', 'Admin', 'admin')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- 2. Testear accesos como user 1 (cliente)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO '11111111-1111-1111-1111-111111111111';
SET LOCAL request.jwt.claim.role TO 'authenticated';

SELECT is(
    (SELECT count(*)::int FROM public.profiles),
    1,
    'Cliente normal solo debe ver su propio perfil'
);

SELECT is(
    (SELECT id FROM public.profiles LIMIT 1),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'El perfil visible es el suyo propio'
);

-- Intentar actualizar nombre (debe funcionar)
SELECT lives_ok(
    $$ UPDATE public.profiles SET full_name = 'User 1 Modificado' WHERE id = '11111111-1111-1111-1111-111111111111' $$,
    'Cliente puede actualizar su propio full_name'
);

-- Intentar actualizar ROL a admin (Zero Trust Trigger debe bloquearlo)
SELECT throws_ok(
    $$ UPDATE public.profiles SET role = 'admin' WHERE id = '11111111-1111-1111-1111-111111111111' $$,
    'ROLE_IMMUTABLE',
    'Cliente NO puede escalar sus privilegios modificando su rol'
);

-- Intentar actualizar perfil de otro (RLS lo oculta)
UPDATE public.profiles SET full_name = 'Hacked' WHERE id = '22222222-2222-2222-2222-222222222222';
-- Verificamos volviendo a postgres temporalmente que NO se modificó
SET LOCAL role TO postgres;
SELECT is(
    (SELECT full_name FROM public.profiles WHERE id = '22222222-2222-2222-2222-222222222222'),
    'User 2',
    'Cliente NO pudo modificar el perfil de otro usuario (RLS invisible)'
);

-- 3. Testear accesos como admin
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO '33333333-3333-3333-3333-333333333333';
SET LOCAL request.jwt.claim.role TO 'authenticated';

SELECT ok(
    (SELECT count(*)::int FROM public.profiles) >= 3,
    'Admin debe poder ver todos los perfiles'
);

-- Intentar actualizar rol de otro usuario (como admin, debe poder)
SELECT lives_ok(
    $$ UPDATE public.profiles SET role = 'rep_ventas' WHERE id = '11111111-1111-1111-1111-111111111111' $$,
    'Admin sí puede actualizar roles de otros usuarios'
);

-- Validar is_admin() interno
SELECT is(
    public.is_admin(),
    true,
    'Función is_admin() retorna true correctamente para admin'
);

SELECT * FROM finish();
ROLLBACK;
