import Link from 'next/link';
import { ArrowLeft, Leaf } from 'lucide-react';
import { listVisibleProducts } from '@/lib/shop/products';

export const metadata = {
  title: 'Catálogo · Enjambre Legado',
};

export default async function CatalogoPage() {
  let products = [] as Awaited<ReturnType<typeof listVisibleProducts>>;
  let loadError: string | null = null;
  try {
    products = await listVisibleProducts();
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Error cargando catálogo';
  }
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
        {loadError ? (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="font-medium">No se pudo cargar el catálogo.</p>
            <p className="text-sm mt-1 opacity-90">{loadError}</p>
          </div>
        ) : null}
        {products.length === 0 ? (
          <p className="text-stone-600 mb-8 max-w-2xl">
            Aún no hay productos publicados. Puedes cargarlos desde el{' '}
            <Link href="/dashboard" className="text-amber-700 font-medium underline">
              panel de administración
            </Link>
            .
          </p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-4">
            {products.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm hover:border-[#D4A017]/40 transition-colors"
              >
                <Link href={`/producto/${encodeURIComponent(p.slug)}`} className="block">
                  <p className="font-medium text-[#0A3D2F]">{p.name}</p>
                  <p className="text-sm text-stone-500 mt-1">
                    ${p.price.toLocaleString('es-CL')} {p.format ? `· ${p.format}` : ''}
                  </p>
                  <p className="text-xs text-stone-400 mt-2">
                    {p.stock == null ? 'Stock por confirmar' : p.stock > 0 ? `Stock: ${p.stock}` : 'Sin stock'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
