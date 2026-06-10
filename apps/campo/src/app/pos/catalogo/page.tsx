import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { QuickSaleButton } from './quick-sale-button';
import { Info } from 'lucide-react';
import { friendlySupabaseError } from '@enjambre/ui';

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
      <div className="p-8 bg-destructive/10 border border-destructive/30 rounded-3xl text-destructive">
        <p className="text-sm font-medium">El sistema no está configurado. Contacta al administrador.</p>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: productos, error } = await supabase
    .from('productos')
    .select('id, nombre, precio, stock, formato, visible')
    .eq('visible', true)
    .order('nombre');

  if (error) {
    return (
      <div className="p-8 bg-destructive/10 border border-destructive/30 rounded-3xl text-destructive">
        <p className="text-sm font-medium">No se pudo cargar el catálogo: {friendlySupabaseError(error)}</p>
      </div>
    );
  }

  const list = (productos ?? []) as ProductoRow[];

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-serif mb-4">Catálogo</h1>
          <p className="text-muted-foreground font-light leading-relaxed">
            Venta rápida: selecciona producto → cantidad → método de pago. Cada venta registra comisión automática.
          </p>
        </div>

        <Link
          href="/pos/carrito"
          className="text-xs uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
        >
          Carrito tradicional →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-card/30 border border-border border-dashed rounded-3xl">
            <Info className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-light uppercase tracking-widest text-xs">No hay productos disponibles.</p>
          </div>
        ) : (
        list.map((p) => (
          <div
            key={p.id}
            className="group bg-card/40 backdrop-blur-sm border border-border p-6 rounded-[32px] transition-all hover:border-primary/30 hover:bg-card/60 flex flex-col"
          >
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-serif text-xl group-hover:text-primary transition-colors">{p.nombre ?? 'Sin nombre'}</h2>
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-tighter">
                  {p.formato ?? 'Estándar'}
                </span>
              </div>

              {p.stock != null && (
                <div className="flex items-center gap-2 mb-6">
                  <div className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-success' : 'bg-destructive'}`} />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    {p.stock} unidades en stock
                  </span>
                </div>
              )}
            </div>

            <div className="mt-auto">
              <div className="flex items-baseline justify-between pt-4 border-t border-border/50">
                <span className="text-xs text-muted-foreground font-medium">Precio</span>
                <p className="text-2xl font-mono font-bold text-foreground">
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
                <QuickSaleButton
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
