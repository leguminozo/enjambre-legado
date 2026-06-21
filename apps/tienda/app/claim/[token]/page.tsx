import { createClient } from '@/utils/supabase/server';
import { ClaimClient } from './claim-client';
import { notFound } from 'next/navigation';

interface ClaimPageProps {
  params: Promise<{ token: string }>;
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: ventaRaw, error } = await supabase.rpc('obtener_venta_por_claim_token', {
    p_token: token,
  });

  const venta = ventaRaw as { id?: string; total?: number; items?: unknown; claim_status?: string } | null;

  if (error || !venta?.id) {
    return notFound();
  }

  if (venta.claim_status === 'claimed') {
    return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-display mb-4">Ticket ya reclamado</h1>
      <p className="text-muted-foreground font-light max-w-md">Este código ya ha sido procesado. Los puntos ya están en el legado de alguien.</p>
      </div>
    );
  }

  // Get current user session
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ClaimClient 
      token={token} 
      venta={venta} 
      initialUser={user}
    />
  );
}
