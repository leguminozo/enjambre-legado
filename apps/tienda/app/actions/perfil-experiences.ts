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
    rewards: (rewardsResult.data ?? []) as LoyaltyReward[],
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

  const { error } = await supabase.rpc('redeem_loyalty_reward', {
    p_user_id: user.id,
    p_reward_id: rewardId,
  })

  if (error) {
    throw new Error(error.message || 'No se pudo completar el canje')
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
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { preOrders: [], featuredProduct: null }
  }

  const [ordersResult, productResult] = await Promise.all([
    supabase
      .from('pre_orders')
      .select('id, status, quantity, created_at, producto_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('productos')
      .select('id, nombre, precio')
      .eq('visible', true)
      .ilike('nombre', '%ulmo%')
      .limit(1)
      .maybeSingle(),
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

  return {
    preOrders: (ordersResult.data ?? []) as PreOrderRow[],
    featuredProduct: featured
      ? { id: featured.id, nombre: featured.nombre, precio: Number(featured.precio) }
      : null,
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

  const { error } = await supabase.from('pre_orders').insert({
    user_id: user.id,
    producto_id: productId,
    email: user.email,
    quantity: qty,
    status: 'reserved',
  })

  if (error) {
    throw new Error('No se pudo crear la reserva')
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