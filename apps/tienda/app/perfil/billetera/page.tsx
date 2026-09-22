import { createClient } from '@/utils/supabase/server';
import { fetchWalletSnapshot } from '@/lib/shop/wallet-api';
import { getLoyaltyDashboard, getReferralDashboard } from '@/app/actions/perfil-experiences';
import { BilleteraClient } from '@/components/perfil/billetera-client';

export const metadata = {
  title: 'Billetera & Beneficios | La Obrera y el Zángano',
  description: 'Pase digital, sellos por producto, catálogo de canje por puntos y gestión de pagos.',
};

export default async function BilleteraPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let initialSnapshot = null;
  if (session?.access_token) {
    try {
      initialSnapshot = await fetchWalletSnapshot(session.access_token);
    } catch {
      // Fail-soft: fallback a carga en cliente
    }
  }

  const [loyalty, referral] = await Promise.all([
    getLoyaltyDashboard(),
    getReferralDashboard(),
  ]);

  return (
    <BilleteraClient
      initialSnapshot={initialSnapshot}
      loyalty={loyalty}
      referral={referral}
    />
  );
}
