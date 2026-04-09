import Link from 'next/link';
import { ArrowLeft, Leaf, Trees } from 'lucide-react';

export const metadata = {
  title: 'Nuestro impacto · Enjambre Legado',
};

export default function ImpactoPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <nav className="border-b border-emerald-100 bg-white/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-[#0A3D2F] font-semibold">
          <Leaf className="w-5 h-5 text-[#D4A017]" />
          Enjambre Legado
        </Link>
        <Link href="/" className="text-sm text-stone-600 hover:text-[#0A3D2F] inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Inicio
        </Link>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-6">
          <Trees className="w-10 h-10 text-[#0A3D2F]" />
          <h1 className="text-3xl font-serif font-bold text-[#0A3D2F]">Nuestro impacto</h1>
        </div>
        <p className="text-lg text-stone-700 leading-relaxed mb-6">
          Cada compra apoya la reforestación y la trazabilidad del origen de la miel. Esta página puede enlazar a
          métricas en vivo (árboles, apiarios, kg compensados) cuando conectes datos desde tu base o CMS.
        </p>
        <div className="rounded-2xl bg-[#0A3D2F] text-white p-8">
          <p className="text-amber-200 text-sm uppercase tracking-wider font-semibold mb-2">Vista previa</p>
          <p className="text-2xl font-serif">Impacto acumulado del ecosistema Enjambre</p>
          <p className="text-white/80 mt-2">Integra aquí gráficos y storytelling desde el panel o Supabase.</p>
        </div>
      </div>
    </main>
  );
}
