import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { AddToCartButton } from './add-to-cart-button';

type ProductoRow = {
  id: string;
  nombre: string | null;
  precio: number | null;
  stock: number | null;
  formato: string | null;
  visible: boolean | null;
};

export const metadata = {
  title: 'Catálogo · POS Campo',
};

export default async function CatalogoPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <p className="text-sm text-amber-800">
        Supabase no está configurado. Revisa variables en Vercel o <Link href="/setup-error">esta guía</Link>.
      </p>
    );
  }

  const { data: productos, error } = await supabase
    .from('productos')
    .select('id, nombre, precio, stock, formato, visible')
    .eq('visible', true)
    .order('nombre');

  if (error) {
    return <p className="text-sm text-red-700">No se pudo cargar el catálogo: {error.message}</p>;
  }

  const list = (productos ?? []) as ProductoRow[];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Catálogo</h1>
      <p className="text-sm text-gray-600 mb-6">
        Productos visibles desde Supabase. Inicia sesión como vendedor para registrar ventas en{' '}
        <Link href="/pos/carrito" className="underline text-[#0A3D2F]">
          Carrito
        </Link>
        .
      </p>
      <ul className="space-y-4">
        {list.length === 0 ? (
          <li className="text-sm text-gray-500">No hay productos visibles.</li>
        ) : (
          list.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <h2 className="font-medium">{p.nombre ?? 'Sin nombre'}</h2>
                  {p.formato ? (
                    <p className="text-xs text-gray-500 mt-1">{p.formato}</p>
                  ) : null}
                  {p.stock != null ? (
                    <p className="text-xs text-gray-500">Stock: {p.stock}</p>
                  ) : null}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold">
                    {p.precio != null
                      ? new Intl.NumberFormat('es-CL', {
                          style: 'currency',
                          currency: 'CLP',
                          minimumFractionDigits: 0,
                        }).format(p.precio)
                      : '—'}
                  </p>
                  {p.precio != null && p.id ? (
                    <AddToCartButton
                      producto_id={p.id}
                      nombre={p.nombre ?? 'Producto'}
                      precio={p.precio}
                    />
                  ) : null}
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
