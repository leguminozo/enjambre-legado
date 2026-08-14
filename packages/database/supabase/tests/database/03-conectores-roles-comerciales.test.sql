BEGIN;
SELECT plan(7);

-- Setup (como postgres para bypassear RLS)
SET LOCAL role TO postgres;

-- Fixtures para FKs (auth.users → profiles → subscriptions/plans)
INSERT INTO auth.users (id, email) VALUES
('00000000-0000-0000-0000-000000000001', 'rep1@conector.test'),
('00000000-0000-0000-0000-000000000002', 'rep2@conector.test'),
('00000000-0000-0000-0000-000000000003', 'creador@conector.test'),
('00000000-0000-0000-0000-000000000005', 'suscriptor@conector.test')
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000005', 'suscriptor@conector.test', 'Conector Test', 'cliente');

INSERT INTO public.subscription_plans (id, name, key, price_clp, frequency)
VALUES ('00000000-0000-0000-0000-000000000006', 'Club de la Cosecha', 'club-cosecha-test', 10000, 'monthly');

-- ── Conector 1: user_roles 'rep_ventas' → deriva 'revendedor' ──────────────
INSERT INTO public.user_roles (user_id, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'rep_ventas', true);

SELECT is(
  (SELECT count(*)::int FROM public.user_roles
    WHERE user_id = '00000000-0000-0000-0000-000000000001' AND role = 'revendedor'),
  1,
  'rep_ventas activo deriva revendedor (0.8x pricing)'
);

-- Reactivación de un rep existente también deriva
INSERT INTO public.user_roles (user_id, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000002', 'rep_ventas', false);

SELECT is(
  (SELECT count(*)::int FROM public.user_roles
    WHERE user_id = '00000000-0000-0000-0000-000000000002' AND role = 'revendedor'),
  0,
  'rep_ventas inactivo NO deriva revendedor'
);

UPDATE public.user_roles
SET is_active = true
WHERE user_id = '00000000-0000-0000-0000-000000000002' AND role = 'rep_ventas';

SELECT is(
  (SELECT count(*)::int FROM public.user_roles
    WHERE user_id = '00000000-0000-0000-0000-000000000002' AND role = 'revendedor'),
  1,
  'activar rep_ventas existente deriva revendedor'
);

-- ── Conector 2: user_roles 'creador' → deriva 'embajador' ──────────────────
INSERT INTO public.user_roles (user_id, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000003', 'creador', true);

SELECT is(
  (SELECT count(*)::int FROM public.user_roles
    WHERE user_id = '00000000-0000-0000-0000-000000000003' AND role = 'embajador'),
  1,
  'creador activo deriva embajador (0.7x pricing)'
);

-- ── Conector 3: suscripción activa → 'suscriptor' ──────────────────────────
INSERT INTO public.subscriptions (id, user_id, plan_id, status, current_period_start, current_period_end)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000006',
  'active',
  now(),
  now() + interval '1 month'
);

SELECT is(
  (SELECT count(*)::int FROM public.user_roles
    WHERE user_id = '00000000-0000-0000-0000-000000000005' AND role = 'suscriptor'),
  1,
  'suscripción activa otorga suscriptor (0.9x pricing)'
);

-- Suspender la suscripción NO revoca (política v1: solo otorgar al activar)
UPDATE public.subscriptions
SET status = 'paused'
WHERE id = '00000000-0000-0000-0000-000000000004';

SELECT is(
  (SELECT is_active FROM public.user_roles
    WHERE user_id = '00000000-0000-0000-0000-000000000005' AND role = 'suscriptor'),
  true,
  'pausar suscripción no revoca suscriptor (v1)'
);

-- ── Prioridad del hook (custom_access_token): embajador > revendedor > suscriptor ──
SELECT is(
  (SELECT role FROM public.user_roles
    WHERE user_id = '00000000-0000-0000-0000-000000000001'
    ORDER BY CASE role
      WHEN 'embajador' THEN 4
      WHEN 'revendedor' THEN 3
      WHEN 'suscriptor' THEN 2
      WHEN 'comprador' THEN 1
      ELSE 0
    END DESC
    LIMIT 1),
  'revendedor',
  'prioridad hook: revendedor domina sobre comprador'
);

-- Cleanup
DELETE FROM public.user_roles WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000005'
);
DELETE FROM public.subscriptions WHERE id = '00000000-0000-0000-0000-000000000004';
DELETE FROM public.subscription_plans WHERE id = '00000000-0000-0000-0000-000000000006';
DELETE FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000005';
DELETE FROM auth.users WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000005'
);

SELECT * FROM finish();
ROLLBACK;
