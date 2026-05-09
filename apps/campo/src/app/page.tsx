import React from 'react';
import { Zap, ScanLine, ShoppingCart, Award } from 'lucide-react';
import Link from 'next/link';

function CampoLanding() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-[#D4A017] selection:text-black pb-20 font-sans">
      <section className="relative pt-32 pb-20 px-6 sm:px-12 lg:px-24 flex flex-col items-center text-center overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#D4A017]/10 blur-[120px] -z-10" />

        <p className="text-xs uppercase tracking-[0.4em] text-[#D4A017] font-bold mb-6">
          Enjambre Legado · Terminal de Activación
        </p>
        
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif mb-8 max-w-5xl leading-[1.05] tracking-tight">
          Vanguardia en <br />
          <span className="italic text-[#D4A017]">experiencia de marca</span>
        </h1>

        <p className="text-xl sm:text-2xl text-stone-400 mb-12 max-w-3xl font-light leading-relaxed">
          Transforma cada transacción en una conexión profunda. POS diseñado para ferias, 
          pop-ups y eventos de lujo. Frictionless loyalty mediante QR dinámico.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full justify-center max-w-lg mb-20">
          <Link
            href="/pos"
            className="inline-flex justify-center items-center gap-3 w-full sm:w-auto px-10 py-5 bg-[#D4A017] hover:bg-[#b88a14] text-black rounded-full font-bold shadow-2xl shadow-[#D4A017]/20 transition-all transform hover:scale-105"
          >
            Abrir POS
            <Zap className="w-5 h-5 fill-current" aria-hidden />
          </Link>
          <Link
            href="/pos/catalogo"
            className="inline-flex justify-center items-center w-full sm:w-auto px-8 py-5 rounded-full border border-stone-800 bg-stone-900/50 text-stone-300 font-medium hover:bg-stone-800 transition-all"
          >
            Ver Catálogo
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl text-left">
          <div className="bg-stone-900/40 backdrop-blur-xl p-8 rounded-3xl border border-stone-800/50 shadow-2xl group hover:border-[#D4A017]/30 transition-all">
            <ShoppingCart className="w-10 h-10 text-[#D4A017] mb-6 group-hover:scale-110 transition-transform" aria-hidden />
            <h2 className="font-serif text-2xl mb-3">Venta Frictionless</h2>
            <p className="text-stone-400 leading-relaxed font-light">
              Interfaz táctil ultra-rápida optimizada para flujos de alta demanda en ferias y eventos.
            </p>
          </div>
          
          <div className="bg-stone-900/40 backdrop-blur-xl p-8 rounded-3xl border border-stone-800/50 shadow-2xl group hover:border-[#D4A017]/30 transition-all">
            <ScanLine className="w-10 h-10 text-[#D4A017] mb-6 group-hover:scale-110 transition-transform" aria-hidden />
            <h2 className="font-serif text-2xl mb-3">Loyalty por QR</h2>
            <p className="text-stone-400 leading-relaxed font-light">
              Cada boleta genera un QR único. El cliente escanea, reclama sus puntos y se vincula a OYZ al instante.
            </p>
          </div>

          <div className="bg-stone-900/40 backdrop-blur-xl p-8 rounded-3xl border border-stone-800/50 shadow-2xl group hover:border-[#D4A017]/30 transition-all">
            <Award className="w-10 h-10 text-[#D4A017] mb-6 group-hover:scale-110 transition-transform" aria-hidden />
            <h2 className="font-serif text-2xl mb-3">Impacto Biocultural</h2>
            <p className="text-stone-400 leading-relaxed font-light">
              Trazabilidad inmediata: el cliente descubre el apiario de origen y los árboles plantados con su compra.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CampoLanding;

