import React from 'react';
import { ShoppingBag, Star, Zap, ScanLine } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export default async function CampoLanding() {
  const supabase = await createClient();
  const { data: todos, error: todosError } = await supabase.from('todos').select();

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-[#0A3D2F] selection:text-white pb-20">
      {todosError ? (
        <p className="mx-auto max-w-3xl px-6 pt-6 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg py-3">
          Supabase conectado. La tabla <code className="font-mono">todos</code> no existe o no hay
          permisos: {todosError.message}
        </p>
      ) : todos && todos.length > 0 ? (
        <section className="mx-auto max-w-3xl px-6 pt-8">
          <p className="text-sm text-gray-600 mb-2">Ejemplo SSR (tabla todos):</p>
          <ul className="list-disc pl-6 text-sm">
            {todos.map((todo: { id: number | string; name?: string }) => (
              <li key={String(todo.id)}>{todo.name ?? String(todo.id)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="relative pt-32 pb-20 px-6 sm:px-12 lg:px-24 flex flex-col items-center text-center overflow-hidden">
        <h1 className="text-5xl md:text-7xl font-sans font-extrabold tracking-tight mb-6 max-w-4xl text-gray-900">
          Terminal de Ventas y <br className="hidden md:block" />
          <span className="text-[#0A3D2F]">Fidelización Cíclica</span>
        </h1>

        <p className="text-xl text-gray-500 mb-10 max-w-2xl font-light leading-relaxed">
          Punto de venta Offline-First diseñado para ferias, eventos y locales. Asigna beneficios de
          fidelidad y escanea el origen de la miel en un solo toque.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md mb-20">
          <Link href="/login" className="w-full">
            <button className="w-full px-8 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-medium transition-all duration-300 shadow-xl shadow-gray-900/20 active:scale-95 flex justify-center items-center gap-2 group">
              Abrir Terminal (POS)
              <Zap className="w-4 h-4" />
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <Zap className="w-8 h-8 text-[#D4A017] mb-4" />
            <h3 className="font-bold text-lg mb-2">Offline First</h3>
            <p className="text-sm text-gray-500">
              Opera sin conexión a internet durante ferias completas. Sincroniza al volver a tener
              señal.
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <Star className="w-8 h-8 text-[#D4A017] mb-4" />
            <h3 className="font-bold text-lg mb-2">Puntos Guardián</h3>
            <p className="text-sm text-gray-500">
              Cada compra suma Tickets que los clientes canjean posteriormente por productos físicos.
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <ScanLine className="w-8 h-8 text-[#0A3D2F] mb-4" />
            <h3 className="font-bold text-lg mb-2">Escáner de Impacto</h3>
            <p className="text-sm text-gray-500">
              Lee el QR del producto para mostrar su apiario de origen y árboles plantados
              (Trazabilidad).
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <ShoppingBag className="w-8 h-8 text-[#0A3D2F] mb-4" />
            <h3 className="font-bold text-lg mb-2">Stock Vinculado</h3>
            <p className="text-sm text-gray-500">
              Toda transacción afecta el stock central y unifica las métricas de ingresos con la
              Tienda Web.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
