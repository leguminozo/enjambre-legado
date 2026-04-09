'use client';

import { useCart } from '@/components/pos/cart-context';

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
      className="mt-2 w-full rounded-lg bg-[#0A3D2F] px-3 py-2 text-sm font-medium text-white hover:bg-[#082a22]"
    >
      Añadir al carrito
    </button>
  );
}
