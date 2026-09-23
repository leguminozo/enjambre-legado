import { getSubscriptionDashboard, getReservasDashboard } from '@/app/actions/perfil-experiences';
import { getDirecciones } from '@/app/actions/direcciones';
import { ReposicionClient } from '@/components/perfil/reposicion-client';
import { resolveClubPlanId } from '@/lib/shop/club-cosecha';

type Props = {
  searchParams: Promise<{ plan?: string; tab?: string }>;
};

export default async function ReposicionPage({ searchParams }: Props) {
  const [data, direcciones, reservasData, params] = await Promise.all([
    getSubscriptionDashboard(),
    getDirecciones(),
    getReservasDashboard(),
    searchParams,
  ]);

  const planKey = params?.plan?.trim();
  const initialPlanId =
    planKey && data.plans.length
      ? resolveClubPlanId(planKey, data.plans)
      : null;

  const initialTab = params?.tab === 'reservas' ? 'reservas' : 'suscripcion';

  return (
    <div data-cms-section="reposicion_y_reservas">
      <ReposicionClient
        subscription={data.subscription}
        plans={data.plans}
        deliveries={data.deliveries}
        initialPlanId={initialPlanId}
        direcciones={direcciones}
        reservasData={reservasData}
        initialTab={initialTab}
      />
    </div>
  );
}