import { createClient } from '@/utils/supabase/server';
import { fetchWalletSnapshot } from '@/lib/shop/wallet-api';
import { getLoyaltyDashboard, getReferralDashboard } from '@/app/actions/perfil-experiences';
import { getDirecciones } from '@/app/actions/direcciones';
import { BilleteraClient } from '@/components/perfil/billetera-client';

export const metadata = {
  title: 'Billetera & Beneficios | La Obrera y el Zángano',
  description: 'Pase digital, sellos por producto, catálogo de canje por puntos y gestión de pagos.',
};

type BilleteraPageProps = {
  searchParams?: Promise<{ modal?: string }>;
};

export default async function BilleteraPage({ searchParams }: BilleteraPageProps = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;

  // Concurrencia I/O: snapshot de billetera, loyalty, referidos, direcciones, estado de suscripción y params en paralelo
  const [initialSnapshot, loyalty, referral, direcciones, { data: activeSub }, resolvedParams] = await Promise.all([
    user && token
      ? fetchWalletSnapshot(token).catch(() => null)
      : Promise.resolve(null),
    getLoyaltyDashboard(),
    getReferralDashboard(),
    getDirecciones(),
    user
      ? supabase
          .from('subscriptions')
          .select('id, status, flow_inscription_token, flow_inscription_buy_order')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    searchParams ? searchParams.catch(() => undefined) : Promise.resolve(undefined),
  ]);

  const hasPaymentMethod = Boolean(activeSub?.flow_inscription_token || activeSub?.id);
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const initialOpenModal = resolvedParams?.modal === 'canje';

  return (
    <BilleteraClient
      initialSnapshot={initialSnapshot}
      loyalty={loyalty}
      referral={referral}
      initialDirecciones={direcciones}
      hasPaymentMethod={hasPaymentMethod}
      userName={userName}
      initialOpenModal={initialOpenModal}
    />
  );
}
