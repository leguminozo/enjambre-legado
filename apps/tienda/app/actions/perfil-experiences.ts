'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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
  subscription_plans: SubscriptionPlan | null
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
  rewards: LoyaltyReward[]
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { balance: 0, tier: 'polinizador', rewards: [] }
  }

  const [pointsResult, rewardsResult] = await Promise.all([
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
  ])

  return {
    balance: pointsResult.data?.puntos ?? 0,
    tier: pointsResult.data?.nivel_actual ?? 'polinizador',
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
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { subscription: null, plans: [] }
  }

  const [subscriptionResult, plansResult] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('id, status, current_period_end, subscription_plans(id, name, key, price_clp, frequency, description)')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('subscription_plans')
      .select('id, name, key, price_clp, frequency, description')
      .eq('active', true)
      .order('price_clp'),
  ])

  const rawSub = subscriptionResult.data as {
    id: string
    status: string
    current_period_end: string
    subscription_plans: SubscriptionPlan | SubscriptionPlan[] | null
  } | null

  const planJoin = rawSub?.subscription_plans
  const normalizedPlan = Array.isArray(planJoin) ? planJoin[0] ?? null : planJoin ?? null

  return {
    subscription: rawSub
      ? {
          id: rawSub.id,
          status: rawSub.status,
          current_period_end: rawSub.current_period_end,
          subscription_plans: normalizedPlan,
        }
      : null,
    plans: (plansResult.data ?? []) as SubscriptionPlan[],
  }
}

/** @deprecated Use Flow checkout via RitualMensualClient */
export async function subscribeToPlan(_planId: string): Promise<void> {
  throw new Error('El ritual requiere pago. Usa el flujo de checkout en la página del ritual.')
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