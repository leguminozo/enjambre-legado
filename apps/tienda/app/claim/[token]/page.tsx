import Link from 'next/link';
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
      <div className="min-h-[var(--vh-full)] bg-background text-foreground flex flex-col items-center justify-center gap-6 px-6 py-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
        <h1 className="font-display text-[clamp(1.75rem,6vw,2.5rem)] font-light text-balance">
          Ticket ya reclamado
        </h1>
        <p className="text-muted-foreground font-light max-w-md text-pretty">
          Este código ya ha sido procesado. Los puntos ya están en el legado de alguien.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/catalogo"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Ver catálogo
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-card/50 transition-colors"
          >
            Inicio
          </Link>
        </div>
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
