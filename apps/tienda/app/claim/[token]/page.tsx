import { createClient } from '@/utils/supabase/server';
import { ClaimClient } from './claim-client';
import { notFound } from 'next/navigation';

interface ClaimPageProps {
  params: Promise<{ token: string }>;
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Fetch minimal sale info to show the user what they are claiming
  // We use the anon client, but we need a policy to allow selecting by token if pending
  const { data: venta, error } = await supabase
    .from('ventas')
    .select('id, total, items, claim_status')
    .eq('claim_token', token)
    .single();

  if (error || !venta) {
    return notFound();
  }

  if (venta.claim_status === 'claimed') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-serif mb-4">Ticket ya reclamado</h1>
        <p className="text-stone-400 font-light max-w-md">Este código ya ha sido procesado. Los puntos ya están en el legado de alguien.</p>
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
