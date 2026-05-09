import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { AddToCartButton } from './add-to-cart-button';
import { Search, Info } from 'lucide-react';

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
      <div className="p-8 bg-red-950/20 border border-red-900/30 rounded-3xl text-red-400">
        <p className="text-sm font-medium">Supabase no está configurado. Revisa variables de entorno.</p>
      </div>
    );
  }

  const { data: productos, error } = await supabase
    .from('productos')
    .select('id, nombre, precio, stock, formato, visible')
    .eq('visible', true)
    .order('nombre');

  if (error) {
    return (
      <div className="p-8 bg-red-950/20 border border-red-900/30 rounded-3xl text-red-400">
        <p className="text-sm font-medium">No se pudo cargar el catálogo: {error.message}</p>
      </div>
    );
  }

  const list = (productos ?? []) as ProductoRow[];

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-serif mb-4">Catálogo</h1>
          <p className="text-stone-500 font-light leading-relaxed">
            Selecciona los productos para la activación. Cada venta genera un QR dinámico para fidelización.
          </p>
        </div>
        
        <div className="relative group min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 group-focus-within:text-[#D4A017] transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar producto..."
            className="w-full bg-stone-900/50 border border-stone-800 rounded-full pl-12 pr-6 py-3 text-sm focus:border-[#D4A017] outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-stone-900/30 border border-stone-800 border-dashed rounded-3xl">
            <Info className="w-8 h-8 text-stone-700 mx-auto mb-3" />
            <p className="text-stone-500 font-light uppercase tracking-widest text-xs">No hay productos disponibles.</p>
          </div>
        ) : (
          list.map((p) => (
            <div
              key={p.id}
              className="group bg-stone-900/40 backdrop-blur-sm border border-stone-800 p-6 rounded-[32px] transition-all hover:border-[#D4A017]/30 hover:bg-stone-900/60 flex flex-col"
            >
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="font-serif text-xl group-hover:text-[#D4A017] transition-colors">{p.nombre ?? 'Sin nombre'}</h2>
                  <span className="bg-[#D4A017]/10 text-[#D4A017] text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-tighter">
                    {p.formato ?? 'Estándar'}
                  </span>
                </div>
                
                {p.stock != null && (
                  <div className="flex items-center gap-2 mb-6">
                    <div className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">
                      {p.stock} unidades en stock
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <div className="flex items-baseline justify-between pt-4 border-t border-stone-800/50">
                  <span className="text-xs text-stone-600 font-medium">Precio</span>
                  <p className="text-2xl font-mono font-bold text-white">
                    {p.precio != null
                      ? new Intl.NumberFormat('es-CL', {
                          style: 'currency',
                          currency: 'CLP',
                          minimumFractionDigits: 0,
                        }).format(p.precio)
                      : '—'}
                  </p>
                </div>
                
                {p.precio != null && p.id ? (
                  <AddToCartButton
                    producto_id={p.id}
                    nombre={p.nombre ?? 'Producto'}
                    precio={p.precio}
                  />
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

