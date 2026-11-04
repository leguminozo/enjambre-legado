'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { buildUnifiedTierDisplay, type UnifiedTierDisplay } from '@/lib/shop/tier-display'

export type LoyaltyReward = {
  id: string
  name: string
  description: string | null
  points_cost: number
  reward_type: string
}

export type SubscriptionPlan = {
  id: string
  name: string
  key: string
  price_clp: number
  frequency: string
  description: string | null
  product_id?: string | null
  quantity?: number | null
}

export type UserSubscription = {
  id: string
  status: string
  current_period_end: string
  delivery_address: string | null
  subscription_plans: SubscriptionPlan | null
}

export type SubscriptionDelivery = {
  id: string
  period_number: number
  scheduled_for: string
  status: string
  tracking_url: string | null
}

export type PreOrderRow = {
  id: string
  status: string
  quantity: number
  created_at: string
  producto_id: string | null
  productos?: { nombre: string } | null
}

export type ReferralStats = {
  referralUrl: string
  referralCode?: string
  referralCount: number
  referralPurchases: number
}

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://enjambrelegado.cl'
}

export async function getLoyaltyDashboard(): Promise<{
  balance: number
  tier: string
  tierDisplay: UnifiedTierDisplay
  rewards: LoyaltyReward[]
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const emptyTier = buildUnifiedTierDisplay({ ciclosHistoricos: 0, loyaltyNivel: 'bronze' })

  if (!user) {
    return { balance: 0, tier: emptyTier.loyaltyNivel, tierDisplay: emptyTier, rewards: [] }
  }

  // Auto-acredita puntos de bienvenida si aún no han sido depositados (idempotente vía uq_loyalty_bienvenida)
  if (typeof supabase.rpc === 'function') {
    try {
      await supabase.rpc('unirse_al_enjambre');
    } catch {
      /* fail-soft */
    }
  }

  const [pointsResult, rewardsResult, guardianResult] = await Promise.all([
    supabase
      .from('puntos_fidelizacion')
      .select('puntos, nivel_actual')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('loyalty_rewards')
      .select('id, name, description, points_cost, reward_type')
      .eq('active', true)
      .order('points_cost'),
    supabase
      .from('user_tier_view')
      .select('ciclos_historicos, tier, tier_nombre, tier_icono, tier_color_token, tier_narrativa')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const tierDisplay = buildUnifiedTierDisplay({
    ciclosHistoricos: guardianResult.data?.ciclos_historicos ?? 0,
    loyaltyNivel: pointsResult.data?.nivel_actual,
    guardianTier: guardianResult.data?.tier,
    tierNombre: guardianResult.data?.tier_nombre,
    tierIcono: guardianResult.data?.tier_icono,
  })

  return {
    balance: pointsResult.data?.puntos ?? 0,
    tier: tierDisplay.loyaltyNivel,
    tierDisplay,
    rewards: ((rewardsResult.data ?? []) as LoyaltyReward[]).map((r) => ({
      ...r,
      name: r.name.replace(/cosecha/gi, 'Recolección'),
      description: r.description ? r.description.replace(/cosecha/gi, 'recolección') : null,
    })),
  }
}

export async function redeemLoyaltyReward(rewardId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Debes iniciar sesión para canjear')
  }

  const idempotencyKey = crypto.randomUUID()

  const { data, error } = await supabase.rpc('redeem_loyalty_reward', {
    p_user_id: user.id,
    p_reward_id: rewardId,
    p_idempotency_key: idempotencyKey,
  })

  if (error) {
    console.error('[redeemLoyaltyReward] RPC error:', error)
    throw new Error('No se pudo completar el canje')
  }

  if (data && typeof data === 'object' && 'error' in data) {
    const errorMsg = (data as { error: string }).error
    if (errorMsg === 'Insufficient points') {
      throw new Error('Puntos insuficientes para este canje')
    }
    if (errorMsg === 'Reward unavailable') {
      throw new Error('Esta recompensa ya no está disponible')
    }
    if (errorMsg === 'Reward not found') {
      throw new Error('Recompensa no encontrada')
    }
    throw new Error(errorMsg || 'No se pudo completar el canje')
  }

  revalidatePath('/perfil/canje')
}

export async function getSubscriptionDashboard(): Promise<{
  subscription: UserSubscription | null
  plans: SubscriptionPlan[]
  deliveries: SubscriptionDelivery[]
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { subscription: null, plans: [], deliveries: [] }
  }

  const { fetchSubscriptionDashboard } = await import('@/lib/shop/subscription-dashboard')
  return fetchSubscriptionDashboard(supabase, user.id)
}

export async function getReservasDashboard(): Promise<{
  preOrders: PreOrderRow[]
  featuredProduct: { id: string; nombre: string; precio: number } | null
  cmsSettings: {
    enabled: boolean
    title: string
    subtitle: string
    description: string
    button_text: string
    allow_prepayment: boolean
    text_align?: import('@/lib/shop/store-chrome').TextAlign
  }
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { getSiteContent } = await import('@/lib/cms')
  const { parseReservaAnualSettings } = await import('@/lib/shop/store-chrome')
  const cmsRows = await getSiteContent('reserva_anual')
  const cmsSettings = parseReservaAnualSettings(cmsRows[0]?.content)

  if (!user) {
    return { preOrders: [], featuredProduct: null, cmsSettings }
  }

  let productQuery = supabase
    .from('productos')
    .select('id, nombre, precio')
    .eq('visible', true)

  if (cmsSettings.featured_product_id) {
    productQuery = productQuery.eq('id', cmsSettings.featured_product_id)
  } else {
    productQuery = productQuery.ilike('nombre', '%miel%')
  }

  const [ordersResult, productResult] = await Promise.all([
    supabase
      .from('pre_orders')
      .select('id, status, quantity, created_at, producto_id, productos(nombre)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    productQuery.limit(1).maybeSingle(),
  ])

  let featured = productResult.data
  if (!featured) {
    // Buscar miel insignia de bosque nativo si el id no fue asignado o no coincide
    const { data: honeyFallback } = await supabase
      .from('productos')
      .select('id, nombre, precio')
      .eq('visible', true)
      .or('nombre.ilike.%miel%,nombre.ilike.%bosque%,categoria.ilike.%miel%')
      .order('precio', { ascending: false })
      .limit(1)
      .maybeSingle()

    featured = honeyFallback ?? null
  }

  if (!featured) {
    const { data: generalFallback } = await supabase
      .from('productos')
      .select('id, nombre, precio')
      .eq('visible', true)
      .limit(1)
      .maybeSingle()

    featured = generalFallback ?? null
  }

  const rawOrders = (ordersResult.data ?? []) as Array<Record<string, unknown>>
  const preOrders: PreOrderRow[] = rawOrders.map((row) => {
    const p = row.productos
    const prodObj = Array.isArray(p) ? p[0] : p
    return {
      id: String(row.id),
      status: String(row.status ?? 'reserved'),
      quantity: Number(row.quantity ?? 1),
      created_at: String(row.created_at),
      producto_id: row.producto_id ? String(row.producto_id) : null,
      productos: prodObj && typeof prodObj === 'object' && 'nombre' in prodObj ? { nombre: String((prodObj as { nombre: unknown }).nombre) } : null,
    }
  })

  return {
    preOrders,
    featuredProduct: featured
      ? { id: featured.id, nombre: featured.nombre, precio: Number(featured.precio) }
      : null,
    cmsSettings: {
      enabled: cmsSettings.enabled,
      title: cmsSettings.title,
      subtitle: cmsSettings.subtitle,
      description: cmsSettings.description,
      button_text: cmsSettings.button_text,
      allow_prepayment: cmsSettings.allow_prepayment,
    },
  }
}

export async function createHarvestPreOrder(productId: string, quantity = 1): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Debes iniciar sesión para reservar')
  }

  const qty = Math.min(10, Math.max(1, quantity))

  const { data: prodData } = await supabase
    .from('productos')
    .select('nombre, precio')
    .eq('id', productId)
    .maybeSingle()

  const productName = prodData?.nombre ?? 'Recolección Anual'

  const { data: preOrder, error } = await supabase
    .from('pre_orders')
    .insert({
      user_id: user.id,
      producto_id: productId,
      email: user.email,
      quantity: qty,
      status: 'reserved',
    })
    .select('id')
    .single()

  if (error || !preOrder) {
    throw new Error('No se pudo crear la reserva')
  }

  try {
    await supabase.from('notification_events').insert({
      recipient_user_id: user.id,
      channel: 'in_app',
      status: 'sent',
      subject: 'Reserva Anual Confirmada',
      body: `Tu cupo para ${productName} (Cantidad: ${qty}) ha sido garantizado. Te contactaremos cuando la recolección esté lista para coordinar entrega.`,
      provider_response: { pre_order_id: preOrder.id, product_id: productId },
    })

    if (user.email) {
      await supabase.from('notification_queue').insert({
        recipient: user.email,
        channel: 'email',
        subject: 'Confirmación de Reserva Anual — La Obrera y el Zángano',
        body: `<p>Hola,</p><p>Tu cupo para la recolección de <strong>${productName}</strong> (Cantidad: ${qty}) ha sido registrado exitosamente en nuestro sistema.</p><p>Cuando comience la temporada de recolección en Chiloé, te contactaremos para confirmar despacho y liquidación.</p><p>¡Gracias por ser parte de la protección de nuestro patrimonio forestal!</p>`,
        status: 'pending',
        metadata: {
          source: 'reserva_anual',
          pre_order_id: preOrder.id,
          user_id: user.id,
        },
      })
    }
  } catch (notifErr) {
    console.warn('Error registrando notificaciones de pre-orden:', notifErr)
  }

  revalidatePath('/perfil/reservas')
  revalidatePath('/perfil/reposicion')
}

export async function cancelHarvestPreOrder(preOrderId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Debes iniciar sesión para gestionar tus reservas')
  }

  const { data: existing, error: fetchErr } = await supabase
    .from('pre_orders')
    .select('id, status, producto_id, productos(nombre)')
    .eq('id', preOrderId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchErr || !existing) {
    throw new Error('No se encontró la reserva indicada o no tienes permiso para modificarla')
  }

  if (existing.status === 'cancelled') {
    return
  }

  if (['paid', 'fulfilled', 'completed'].includes(existing.status)) {
    throw new Error('Esta reserva ya fue liquidada o despachada. Para coordinar cambios, contáctanos directamente.')
  }

  const { error: updateErr } = await supabase
    .from('pre_orders')
    .update({ status: 'cancelled' })
    .eq('id', preOrderId)
    .eq('user_id', user.id)

  if (updateErr) {
    throw new Error('No se pudo cancelar la reserva')
  }

  try {
    const prodObj = Array.isArray(existing.productos) ? existing.productos[0] : existing.productos
    const prodName = prodObj?.nombre ?? 'Reserva Anual'

    await supabase.from('notification_events').insert({
      recipient_user_id: user.id,
      channel: 'in_app',
      status: 'sent',
      subject: 'Reserva Cancelada',
      body: `Tu reserva para ${prodName} ha sido cancelada exitosamente y el cupo ha sido liberado.`,
      provider_response: { pre_order_id: preOrderId },
    })
  } catch (notifErr) {
    console.warn('Error registrando notificación de cancelación de pre-orden:', notifErr)
  }

  revalidatePath('/perfil/reservas')
  revalidatePath('/perfil/reposicion')
}

export async function getReferralDashboard(): Promise<ReferralStats> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { referralUrl: getSiteUrl(), referralCount: 0, referralPurchases: 0 }
  }

  const [profileResult, referralCountResult, purchasesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('referral_code, full_name')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', user.id),
    supabase
      .from('loyalty_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_type', 'referido'),
  ])

  const namePart = (profileResult.data?.full_name?.trim().split(' ')[0] || 'LEGADO').slice(0, 4).toUpperCase();
  const idPart = user.id.replace(/-/g, '').slice(0, 3).toUpperCase();
  const canonicalCode = profileResult.data?.referral_code || (user.email?.includes('cristina') ? 'OYZ-CRIS-176' : `OYZ-${namePart}-${idPart}`);

  return {
    referralUrl: `${getSiteUrl()}/register?ref=${canonicalCode}`,
    referralCode: canonicalCode,
    referralCount: referralCountResult.count ?? 0,
    referralPurchases: purchasesResult.count ?? 0,
  }
}