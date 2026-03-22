import React from 'react';
import { ShoppingBag, ArrowRight, ShieldCheck, Leaf } from 'lucide-react';
import Link from 'next/link';

export default function TiendaLanding() {
  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans selection:bg-[#D4A017] selection:text-white">
      {/* Navigation barebones */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Leaf className="w-6 h-6 text-[#D4A017]" />
          <span className="font-serif font-bold text-xl text-[#0A3D2F]">Enjambre Legado</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/catalogo" className="text-sm font-medium hover:text-[#D4A017] transition-colors">Catálogo</Link>
          <Link href="/impacto" className="text-sm font-medium hover:text-[#D4A017] transition-colors">Nuestro Impacto</Link>
          <Link href="/login" className="text-sm font-medium bg-[#0A3D2F] px-4 py-2 rounded-full text-white hover:bg-[#082a21] transition-colors">
            Iniciar Sesión
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4A017]/10 text-[#D4A017] text-sm font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Miel Endémica Trazable
          </div>
          <h1 className="text-5xl md:text-7xl font-serif text-[#0A3D2F] font-bold tracking-tight leading-tight">
            El sabor de la <span className="text-[#D4A017]">Regeneración</span>
          </h1>
          <p className="text-xl text-gray-600 font-light max-w-lg leading-relaxed">
            Cada frasco de miel nativa que adquieres financia directamente la reforestación del bosque chileno. Trazabilidad absoluta mediante Blockchain.
          </p>
          <div className="flex gap-4">
            <button className="px-8 py-4 bg-[#D4A017] hover:bg-[#b88a10] text-white rounded-full font-medium transition-all shadow-lg shadow-[#D4A017]/20 flex items-center gap-2">
              Ver Catálogo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 relative">
          <div className="aspect-square bg-gradient-to-tr from-[#0A3D2F]/5 to-[#D4A017]/10 rounded-[3rem] p-8 relative flex items-center justify-center">
            {/* Visual representation of a hero product */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-white/60 shadow-2xl" />
            <div className="relative z-10 w-64 h-80 bg-gradient-to-b from-amber-100 to-amber-500 rounded-2xl shadow-xl flex items-center justify-center border-4 border-white/50 overflow-hidden">
               <span className="text-amber-900 font-serif font-bold text-3xl opacity-50 absolute rotate-[-45deg] select-none">ULMO</span>
               <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-md rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-[#0A3D2F]">Néctar de Ulmo</p>
                    <p className="text-[10px] text-gray-500">Isla de Chiloé</p>
                  </div>
                  <ShoppingBag className="w-4 h-4 text-[#D4A017]" />
               </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
