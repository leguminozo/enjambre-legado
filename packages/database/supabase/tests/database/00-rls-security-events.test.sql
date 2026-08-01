BEGIN;
SELECT plan(6);

-- 1. Preparar un usuario anon (sin auth.uid())
-- Intentar SELECT en security_events (debe fallar devolviendo 0)
SET LOCAL role TO anon;
SET LOCAL request.jwt.claim.sub TO '';
SET LOCAL request.jwt.claim.role TO 'anon';

SELECT is(
    (SELECT count(*)::int FROM public.security_events),
    0,
    'Anon no debe poder leer security_events'
);

-- Intentar INSERT pre-auth (login_failed) - debe ser exitoso
SELECT lives_ok(
    $$ INSERT INTO public.security_events (event_type, email, app_source) VALUES ('login_failed', 'test@anon.com', 'tienda') $$,
    'Anon puede insertar un evento pre-auth (login_failed)'
);

-- Intentar INSERT de otro evento (session_revoked) - debe fallar por policy
SELECT throws_ok(
    $$ INSERT INTO public.security_events (event_type, email, app_source) VALUES ('session_revoked', 'test@anon.com', 'tienda') $$,
    'new row violates row-level security policy for table "security_events"',
    'Anon NO puede insertar eventos que no sean pre-auth'
);

-- 2. Preparar un usuario autenticado normal (cliente)
-- En pgTAP se simula así:
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO '11111111-1111-1111-1111-111111111111';
SET LOCAL request.jwt.claim.role TO 'authenticated';

SELECT is(
    (SELECT count(*)::int FROM public.security_events),
    0,
    'Cliente normal no debe poder leer security_events'
);

SELECT lives_ok(
    $$ INSERT INTO public.security_events (event_type, email, app_source) VALUES ('session_revoked', 'cliente@test.com', 'campo') $$,
    'Cliente puede insertar su propio evento de seguridad'
);

-- 3. Preparar un usuario admin
-- Necesitamos insertar un perfil admin primero para que is_admin() devuelva true
-- Volvemos a postgres temporalmente para bypassear RLS y crear el setup
SET LOCAL role TO postgres;
INSERT INTO auth.users (id, email) VALUES ('22222222-2222-2222-2222-222222222222', 'admin@admin.com') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, role) VALUES ('22222222-2222-2222-2222-222222222222', 'admin@admin.com', 'Admin', 'admin') ON CONFLICT (id) DO UPDATE SET role = 'admin';

SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO '22222222-2222-2222-2222-222222222222';
SET LOCAL request.jwt.claim.role TO 'authenticated';

-- Ahora el admin debería poder leer las filas (al menos las 2 que insertamos)
SELECT ok(
    (SELECT count(*)::int FROM public.security_events) >= 2,
    'Admin debe poder leer todos los security_events'
);

SELECT * FROM finish();
ROLLBACK;
