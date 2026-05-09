'use client';

import { useCart } from '@/components/pos/cart-context';
import { Plus } from 'lucide-react';

type Props = {
  producto_id: string;
  nombre: string;
  precio: number;
};

export function AddToCartButton({ producto_id, nombre, precio }: Props) {
  const { addLine } = useCart();
  return (
    <button
      type="button"
      onClick={() => addLine({ producto_id, nombre, precio_unitario: precio })}
      className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-stone-900 border border-stone-800 px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#D4A017] hover:bg-[#D4A017] hover:text-black transition-all"
    >
      <Plus className="w-3 h-3" />
      Añadir
    </button>
  );
}

