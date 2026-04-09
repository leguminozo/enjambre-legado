import Link from 'next/link';
import { ArrowLeft, Leaf } from 'lucide-react';

export const metadata = {
  title: 'Catálogo · Enjambre Legado',
};

export default function CatalogoPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <nav className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-[#0A3D2F] font-semibold">
          <Leaf className="w-5 h-5 text-[#D4A017]" />
          Enjambre Legado
        </Link>
        <Link href="/" className="text-sm text-stone-600 hover:text-[#0A3D2F] inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Inicio
        </Link>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-serif font-bold text-[#0A3D2F] mb-4">Catálogo</h1>
        <p className="text-stone-600 mb-8 max-w-2xl">
          Aquí conectarás productos reales desde Supabase u otro backend. Mientras tanto, usa el{' '}
          <Link href="/dashboard" className="text-amber-700 font-medium underline">
            panel de administración
          </Link>{' '}
          para gestionar el catálogo cuando integres la API.
        </p>
        <ul className="grid sm:grid-cols-2 gap-4">
          {['Miel de Ulmo 500g', 'Miel de Tiaca 250g', 'Pack Regalo Bosque'].map((name) => (
            <li
              key={name}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-[#D4A017]/40 transition-colors"
            >
              <p className="font-medium text-[#0A3D2F]">{name}</p>
              <p className="text-sm text-stone-500 mt-1">Próximamente · stock y precio en vivo</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
