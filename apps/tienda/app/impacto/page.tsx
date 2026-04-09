import Link from 'next/link';
import { Trees } from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';

export const metadata = {
  title: 'Legado del bosque',
};

export default function ImpactoPage() {
  return (
    <>
      <ShopHeader />
      <main className="min-h-[60vh] bg-gradient-to-b from-cream-100 via-cream-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mb-8 flex items-center gap-3">
            <Trees className="h-10 w-10 text-bosque-900" aria-hidden />
            <h1 className="font-display text-3xl font-semibold text-bosque-950 sm:text-4xl">
              Legado del bosque
            </h1>
          </div>
          <p className="text-lg leading-relaxed text-bosque-800/85">
            Cada compra apoya la regeneración del territorio y la trazabilidad del origen de la miel. Esta
            página puede enlazar a métricas en vivo (árboles, apiarios, compensaciones) cuando conectes datos
            desde tu base o CMS.
          </p>
          <div className="mt-10 rounded-2xl bg-bosque-900 p-8 text-cream-50 shadow-xl shadow-bosque-900/20">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-miel-300">Vista previa</p>
            <p className="mt-2 font-display text-2xl">Impacto acumulado del ecosistema</p>
            <p className="mt-3 text-sm text-cream-200/90">
              Integra aquí gráficos y storytelling desde el panel o Supabase.
            </p>
          </div>
          <Link
            href="/catalogo"
            className="mt-10 inline-flex text-sm font-semibold text-miel-800 underline underline-offset-2 hover:text-miel-700"
          >
            ← Volver a creaciones
          </Link>
        </div>
      </main>
      <ShopFooter />
    </>
  );
}
