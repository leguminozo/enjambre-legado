'use server';

import { createClient } from '@/utils/supabase/server';

export interface SavePushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  topics?: string[];
  userAgent?: string;
}

const FALLBACK_VAPID_PUBLIC_KEY =
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

export async function getVapidPublicKeyAction(): Promise<string> {
  return (
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    process.env.VAPID_PUBLIC_KEY ||
    FALLBACK_VAPID_PUBLIC_KEY
  );
}

export async function saveWebPushSubscription(
  input: SavePushSubscriptionInput,
): Promise<{ success: boolean; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || null;
  const topics = input.topics || ['general'];

  // Intentar mediante la función RPC segura
  const { data, error } = await supabase.rpc('save_push_subscription', {
    p_endpoint: input.endpoint,
    p_p256dh: input.p256dh,
    p_auth: input.auth,
    p_app_source: 'tienda',
    p_user_agent: input.userAgent || null,
    p_topics: topics,
  });

  if (error) {
    // Fallback con inserción directa
    const { data: upsertData, error: upsertError } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
          app_source: 'tienda',
          user_agent: input.userAgent || null,
          topics,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' },
      )
      .select('id')
      .maybeSingle();

    if (upsertError) {
      throw new Error(`Error al guardar suscripción: ${upsertError.message}`);
    }

    return { success: true, id: upsertData?.id };
  }

  const result = data as { subscription_id?: string } | null;
  return { success: true, id: result?.subscription_id };
}

export async function removeWebPushSubscription(
  endpoint: string,
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint);

  if (error) {
    throw new Error(`Error al eliminar suscripción: ${error.message}`);
  }

  return { success: true };
}
