-- =============================================================================
-- Migration 20260923140000: Sincronización CMS Newsletter Membresía & CRM Link
-- 1. Actualiza el contenido de footer_settings en site_content con el nuevo relato
--    transparente de activación de cuenta sin contraseñas y puntos de bienvenida.
-- 2. Conecta la RPC unirse_al_enjambre() con la tabla clientes (CRM) para que cada
--    miembro que active sus puntos quede registrado como cliente activo en Núcleo.
-- =============================================================================

-- 1. Actualizar site_content para footer_settings
UPDATE public.site_content
SET content = content || jsonb_build_object(
  'newsletter_title', 'Activa tu Membresía & Puntos de Bienvenida',
  'newsletter_title_en', 'Activate your Membership & Welcome Points',
  'newsletter_desc', 'Ingresa tu correo para activar tu cuenta de cliente sin contraseñas y recibir 100 puntos de bienvenida en tu billetera digital. Accederás a asignaciones de recolección y novedades directas del bosque.',
  'newsletter_desc_en', 'Enter your email to activate your passwordless member account and receive 100 welcome points in your digital wallet. Access exclusive harvest allocations and direct forest updates.',
  'newsletter_placeholder', 'tu@correo.com — Activar cuenta y puntos',
  'newsletter_placeholder_en', 'your@email.com — Activate account & points'
),
updated_at = NOW()
WHERE section_key = 'footer_settings';

-- 2. Mejorar unirse_al_enjambre para vincular con CRM (clientes)
CREATE OR REPLACE FUNCTION public.unirse_al_enjambre()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_full_name text;
  v_puntos integer;
  v_empresa_id uuid;
  v_saldo_nuevo integer;
  v_balance integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'unauthenticated');
  END IF;

  -- Obtener email y nombre del usuario autenticado
  SELECT email, raw_user_meta_data->>'full_name'
  INTO v_user_email, v_full_name
  FROM auth.users
  WHERE id = v_user_id;

  -- Puntos de bienvenida desde la config central (fallback 100 si falta).
  SELECT valor_numerico::int INTO v_puntos
  FROM public.beneficios_enjambre
  WHERE clave = 'welcome_points';
  IF v_puntos IS NULL THEN
    v_puntos := 100;
  END IF;

  -- INSERT primero: el índice único parcial serializa la unión.
  INSERT INTO public.loyalty_transactions
    (user_id, action_type, points, balance_after, source_id, description)
  VALUES
    (v_user_id, 'bienvenida', v_puntos, 0, 'footer_enjambre', 'Bienvenida: unión al Enjambre')
  ON CONFLICT DO NOTHING
  RETURNING balance_after INTO v_balance;

  IF v_balance IS NULL THEN
    -- Ya miembro: devolver saldo actual sin duplicar transacción de bienvenida.
    SELECT COALESCE(SUM(puntos), 0)::int INTO v_balance
    FROM public.puntos_fidelizacion
    WHERE user_id = v_user_id;

    -- Asegurar vinculación en clientes aunque ya fuera miembro
    IF v_user_email IS NOT NULL THEN
      UPDATE public.clientes
      SET profile_id = v_user_id,
          status = 'activo',
          ultimo_contacto = NOW()
      WHERE email = v_user_email;
    END IF;

    RETURN jsonb_build_object('status', 'already_member', 'puntos', v_balance);
  END IF;

  -- Empresa default (mismo patrón que checkout de núcleo); NULL aborta.
  SELECT id INTO v_empresa_id
  FROM public.empresas
  ORDER BY created_at
  LIMIT 1;

  IF v_empresa_id IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'empresa_no_configurada');
  END IF;

  PERFORM public.agregar_puntos_usuario(
    v_user_id, v_empresa_id, v_puntos, NULL, 'bienvenida_enjambre',
    jsonb_build_object('origen', 'footer_enjambre')
  );

  SELECT COALESCE(SUM(puntos), 0)::int INTO v_saldo_nuevo
  FROM public.puntos_fidelizacion
  WHERE user_id = v_user_id;

  UPDATE public.loyalty_transactions
  SET balance_after = v_saldo_nuevo
  WHERE user_id = v_user_id AND action_type = 'bienvenida';

  -- Vincular o insertar en CRM (clientes) para visibilidad en Núcleo
  IF v_user_email IS NOT NULL THEN
    UPDATE public.clientes
    SET profile_id = v_user_id,
        status = 'activo',
        ultimo_contacto = NOW()
    WHERE email = v_user_email;

    IF NOT FOUND THEN
      INSERT INTO public.clientes (
        user_id, profile_id, name, email, type, status, fuente, notes
      ) VALUES (
        v_user_id,
        v_user_id,
        COALESCE(v_full_name, split_part(v_user_email, '@', 1)),
        v_user_email,
        'D2C',
        'activo',
        'web',
        'Membresía Enjambre activada desde el pie de página'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN jsonb_build_object('status', 'joined', 'puntos', v_saldo_nuevo);
END;
$$;
