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
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;

  // Concurrencia I/O: snapshot de billetera, loyalty y referidos en paralelo
  const [initialSnapshot, loyalty, referral] = await Promise.all([
    user && token
      ? fetchWalletSnapshot(token).catch(() => null)
      : Promise.resolve(null),
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
