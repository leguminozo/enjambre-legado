import { getSubscriptionDashboard } from '@/app/actions/perfil-experiences';
import { ReposicionClient } from '@/components/perfil/reposicion-client';
import { resolveClubPlanId } from '@/lib/shop/club-cosecha';

type Props = {
  searchParams?: Promise<{ plan?: string }> | { plan?: string };
};

export default async function ReposicionPage({ searchParams }: Props) {
  const data = await getSubscriptionDashboard();
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const planKey = params?.plan?.trim();
  const initialPlanId =
    planKey && data.plans.length
      ? resolveClubPlanId(planKey, data.plans)
      : null;

  return (
    <ReposicionClient
      subscription={data.subscription}
      plans={data.plans}
      deliveries={data.deliveries}
      initialPlanId={initialPlanId}
    />
  );
}