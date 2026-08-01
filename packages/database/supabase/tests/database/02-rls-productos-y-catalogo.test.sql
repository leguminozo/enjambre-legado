BEGIN;
SELECT plan(6);

-- 1. Setup inicial
SET LOCAL role TO postgres;

-- Insertar roles de prueba
INSERT INTO auth.users (id, email) VALUES 
('44444444-4444-4444-4444-444444444444', 'cliente@test.com'),
('55555555-5555-5555-5555-555555555555', 'admin2@test.com')
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role) VALUES 
('44444444-4444-4444-4444-444444444444', 'cliente@test.com', 'Cliente Catálogo', 'cliente'),
('55555555-5555-5555-5555-555555555555', 'admin2@test.com', 'Admin Catálogo', 'admin')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Insertar producto de prueba
INSERT INTO public.productos (id, nombre, precio, stock, visible) VALUES
('66666666-6666-6666-6666-666666666666', 'Miel de Ulmo Test', 10000, 50, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Testear accesos como anon
SET LOCAL role TO anon;
SET LOCAL request.jwt.claim.sub TO '';
SET LOCAL request.jwt.claim.role TO 'anon';

SELECT ok(
    (SELECT count(*)::int FROM public.productos) > 0,
    'Anon puede leer (SELECT) productos del catálogo'
);

SELECT throws_ok(
    $$ INSERT INTO public.productos (id, nombre, precio) VALUES ('77777777-7777-7777-7777-777777777777', 'Hack Producto', 1) $$,
    'new row violates row-level security policy for table "productos"',
    'Anon NO puede insertar productos'
);

-- 3. Testear accesos como cliente
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO '44444444-4444-4444-4444-444444444444';
SET LOCAL request.jwt.claim.role TO 'authenticated';

SELECT ok(
    (SELECT count(*)::int FROM public.productos) > 0,
    'Cliente autenticado puede leer el catálogo'
);

SELECT throws_ok(
    $$ UPDATE public.productos SET precio = 1 WHERE id = '66666666-6666-6666-6666-666666666666' $$,
    'new row violates row-level security policy for table "productos"',
    'Cliente NO puede modificar (UPDATE) precios del catálogo'
);

-- 4. Testear accesos como admin
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO '55555555-5555-5555-5555-555555555555';
SET LOCAL request.jwt.claim.role TO 'authenticated';

SELECT lives_ok(
    $$ UPDATE public.productos SET precio = 12000 WHERE id = '66666666-6666-6666-6666-666666666666' $$,
    'Admin puede actualizar productos'
);

SELECT lives_ok(
    $$ INSERT INTO public.productos (id, nombre, precio) VALUES ('77777777-7777-7777-7777-777777777777', 'Miel Nueva Admin', 15000) $$,
    'Admin puede insertar nuevos productos'
);

SELECT * FROM finish();
ROLLBACK;
