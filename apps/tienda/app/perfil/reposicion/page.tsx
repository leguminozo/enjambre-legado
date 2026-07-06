import { getSubscriptionDashboard } from '@/app/actions/perfil-experiences';
import { ReposicionClient } from '@/components/perfil/reposicion-client';

export default async function ReposicionPage() {
  const data = await getSubscriptionDashboard();
  return (
    <ReposicionClient
      subscription={data.subscription}
      plans={data.plans}
      deliveries={data.deliveries}
    />
  );
}