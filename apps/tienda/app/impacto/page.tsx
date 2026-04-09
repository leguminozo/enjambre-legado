import Link from 'next/link';
import { Trees } from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';

export const metadata = {
  title: 'Legado del bosque',
};

export default function ImpactoPage() {
  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[60vh] bg-[#050505]">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mb-8 flex items-center gap-3">
            <Trees className="h-10 w-10 text-[#c9a227]" aria-hidden />
            <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Legado del bosque
            </h1>
          </div>
          <p className="text-lg leading-relaxed text-zinc-400">
            Cada compra apoya la regeneración del territorio y la trazabilidad del origen de la miel. Esta
            página puede enlazar a métricas en vivo cuando conectes datos desde el panel o Supabase.
          </p>
          <div className="mt-10 rounded-xl border border-white/10 bg-zinc-900/50 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a227]">Vista previa</p>
            <p className="mt-2 font-display text-2xl text-white">Impacto acumulado del ecosistema</p>
            <p className="mt-3 text-sm text-zinc-500">
              Integra aquí gráficos y storytelling desde el panel o Supabase.
            </p>
          </div>
          <Link
            href="/catalogo"
            className="mt-10 inline-flex text-sm font-semibold text-[#e8c547] underline underline-offset-2 hover:text-[#f0d060]"
          >
            ← Volver a creaciones
          </Link>
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
