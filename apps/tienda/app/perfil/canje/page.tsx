import Link from 'next/link';
import { getLoyaltyDashboard } from '@/app/actions/perfil-experiences';
import { CanjeImpactoClient } from '@/components/perfil/canje-impacto-client';

export default async function CanjeImpactoPage() {
  const data = await getLoyaltyDashboard();
  return (
    <div className="space-y-16">
      <CanjeImpactoClient
        balance={data.balance}
        tier={data.tier}
        tierDisplay={data.tierDisplay}
        rewards={data.rewards}
      />
      <p className="text-sm text-muted-foreground">
        Las rutas de sello (sachet, frasco, recolección) viven en la{' '}
        <Link href="/perfil/billetera" className="text-accent-text underline underline-offset-4">
          Billetera
        </Link>
        .
      </p>
    </div>
  );
}