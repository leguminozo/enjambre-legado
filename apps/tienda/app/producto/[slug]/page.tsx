import Link from 'next/link';
import { ArrowLeft, Leaf } from 'lucide-react';
import { getProductBySlugOrId } from '@/lib/shop/products';
import { AddToCartButton } from './ui';

export default async function ProductoPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  let product = null as Awaited<ReturnType<typeof getProductBySlugOrId>>;
  let loadError: string | null = null;
  try {
    product = await getProductBySlugOrId(slug);
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Error cargando producto';
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-stone-50">
        <nav className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#0A3D2F] font-semibold">
            <Leaf className="w-5 h-5 text-[#D4A017]" />
            Enjambre Legado
          </Link>
          <Link
            href="/catalogo"
            className="text-sm text-stone-600 hover:text-[#0A3D2F] inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al catálogo
          </Link>
        </nav>
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="text-2xl font-serif font-bold text-[#0A3D2F]">No se pudo cargar el producto</h1>
          <p className="text-stone-600 mt-2">{loadError}</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-stone-50">
        <nav className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#0A3D2F] font-semibold">
            <Leaf className="w-5 h-5 text-[#D4A017]" />
            Enjambre Legado
          </Link>
          <Link
            href="/catalogo"
            className="text-sm text-stone-600 hover:text-[#0A3D2F] inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al catálogo
          </Link>
        </nav>
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="text-2xl font-serif font-bold text-[#0A3D2F]">Producto no encontrado</h1>
          <p className="text-stone-600 mt-2">Revisa el enlace o vuelve al catálogo.</p>
        </div>
      </main>
    );
  }

  const photo = product.photos[0];

  return (
    <main className="min-h-screen bg-stone-50">
      <nav className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-[#0A3D2F] font-semibold">
          <Leaf className="w-5 h-5 text-[#D4A017]" />
          Enjambre Legado
        </Link>
        <Link
          href="/catalogo"
          className="text-sm text-stone-600 hover:text-[#0A3D2F] inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Catálogo
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10">
        <div className="rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          {photo ? (
            // next/image se puede agregar después; mantenemos simple para empezar.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={product.name} className="w-full h-full object-cover aspect-square" />
          ) : (
            <div className="aspect-square grid place-items-center text-stone-400">
              Sin foto
            </div>
          )}
        </div>

        <div>
          <h1 className="text-4xl font-serif font-bold text-[#0A3D2F]">{product.name}</h1>
          <p className="text-stone-600 mt-2">
            ${product.price.toLocaleString('es-CL')} {product.format ? `· ${product.format}` : ''}
          </p>

          {product.description ? (
            <p className="text-stone-700 mt-6 leading-relaxed whitespace-pre-line">{product.description}</p>
          ) : null}

          <div className="mt-8 flex items-center gap-3">
            <AddToCartButton product={product} />
            <span className="text-sm text-stone-500">
              {product.stock == null ? 'Stock por confirmar' : product.stock > 0 ? `Stock: ${product.stock}` : 'Sin stock'}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}

