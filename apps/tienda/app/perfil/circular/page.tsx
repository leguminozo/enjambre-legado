import { getReferralDashboard } from '@/app/actions/perfil-experiences';
import { CircularReferralClient } from '@/components/perfil/circular-referral-client';

export default async function CircularColmenaPage() {
  const stats = await getReferralDashboard();
  return <CircularReferralClient stats={stats} />;
}