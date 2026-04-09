import React from 'react';
import { ShoppingBag, Star, Zap, ScanLine } from 'lucide-react';
import Link from 'next/link';

export default function CampoLanding() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-100 via-gray-50 to-stone-100 text-gray-900 selection:bg-[#0A3D2F] selection:text-white pb-20">
      <section className="relative pt-28 pb-16 px-6 sm:px-12 lg:px-24 flex flex-col items-center text-center overflow-hidden">
        <p className="text-xs uppercase tracking-[0.2em] text-[#0A3D2F]/80 font-medium mb-4">
          Enjambre Legado · Campo
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl text-gray-900 leading-[1.1]">
          Terminal de ventas y <br className="hidden sm:block" />
          <span className="text-[#0A3D2F]">fidelización cíclica</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl font-normal leading-relaxed">
          Punto de venta pensado para ferias, eventos y locales. Fidelidad, trazabilidad y stock
          alineado con la tienda web.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full justify-center max-w-lg mb-16">
          <Link
            href="/login"
            className="inline-flex justify-center items-center gap-2 w-full sm:w-auto px-8 py-4 bg-[#0A3D2F] hover:bg-[#082a22] text-white rounded-2xl font-semibold shadow-lg shadow-[#0A3D2F]/25 transition-colors"
          >
            Abrir terminal (POS)
            <Zap className="w-4 h-4 shrink-0" aria-hidden />
          </Link>
          <Link
            href="/pos/catalogo"
            className="inline-flex justify-center items-center w-full sm:w-auto px-6 py-4 rounded-2xl border-2 border-gray-300 bg-white/80 text-[#0A3D2F] font-medium hover:border-[#0A3D2F]/40 transition-colors"
          >
            Ver catálogo
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-6xl text-left">
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col">
            <Zap className="w-8 h-8 text-[#D4A017] mb-3" aria-hidden />
            <h2 className="font-bold text-lg mb-2">Offline first</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Opera sin conexión en ferias; sincroniza cuando vuelva la señal.
            </p>
          </div>
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col">
            <Star className="w-8 h-8 text-[#D4A017] mb-3" aria-hidden />
            <h2 className="font-bold text-lg mb-2">Puntos guardián</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Cada compra suma tickets canjeables por productos físicos.
            </p>
          </div>
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col">
            <ScanLine className="w-8 h-8 text-[#0A3D2F] mb-3" aria-hidden />
            <h2 className="font-bold text-lg mb-2">Escáner de impacto</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              QR de producto: origen del apiario y árboles plantados.
            </p>
          </div>
          <div className="bg-white/90 backdrop-blur p-6 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col">
            <ShoppingBag className="w-8 h-8 text-[#0A3D2F] mb-3" aria-hidden />
            <h2 className="font-bold text-lg mb-2">Stock vinculado</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ventas coherentes con el stock central y la tienda web.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
