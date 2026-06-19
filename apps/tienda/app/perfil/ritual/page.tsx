import { getSubscriptionDashboard } from '@/app/actions/perfil-experiences';
import { RitualMensualClient } from '@/components/perfil/ritual-mensual-client';

export default async function RitualMensualPage() {
  const data = await getSubscriptionDashboard();
  return (
    <RitualMensualClient subscription={data.subscription} plans={data.plans} />
  );
}