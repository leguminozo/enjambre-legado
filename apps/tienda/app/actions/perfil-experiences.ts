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
      .select('ciclos_historicos, tier')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const tierDisplay = buildUnifiedTierDisplay({
    ciclosHistoricos: guardianResult.data?.ciclos_historicos ?? 0,
    loyaltyNivel: pointsResult.data?.nivel_actual,
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
    productQuery = productQuery.ilike('nombre', '%ulmo%')
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
    const { data: fallback } = await supabase
      .from('productos')
      .select('id, nombre, precio')
      .eq('visible', true)
      .order('nombre')
      .limit(1)
      .maybeSingle()
    featured = fallback
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
        body: `<p>Hola,</p><p>Tu cupo para la recolección de <strong>${productName}</strong> (Cantidad: ${qty}) ha sido registrado exitosamente en nuestro sistema.</p><p>Cuando comience la temporada de recolección en Chiloé, te contactaremos para confirmar despacho y liquidación.</p><p>¡Gracias por ser parte de la custodia de nuestro patrimonio forestal!</p>`,
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
}

export async function getReferralDashboard(): Promise<ReferralStats> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { referralUrl: getSiteUrl(), referralCount: 0, referralPurchases: 0 }
  }

  const [referralCountResult, purchasesResult] = await Promise.all([
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

  return {
    referralUrl: `${getSiteUrl()}/register?ref=${user.id}`,
    referralCount: referralCountResult.count ?? 0,
    referralPurchases: purchasesResult.count ?? 0,
  }
}