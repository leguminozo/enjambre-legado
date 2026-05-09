import React from 'react';
import { Calendar, Leaf, ArrowRight, Info } from 'lucide-react';

export default function ReservasPage() {
  return (
    <div className="space-y-16 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#c9a227]/10 flex items-center justify-center text-[#c9a227]">
              <Calendar size={20} />
            </div>
            <h1 className="font-display text-4xl font-light text-[#f5f0e8]">Reserva de Cosecha</h1>
          </div>
          <p className="text-[#8a8279] text-sm tracking-wide">Asegura tu parte del legado antes de que la naturaleza lo entregue</p>
        </div>
        
        <div className="px-6 py-2 bg-[#c9a227]/10 border border-[#c9a227]/20 rounded-full">
           <span className="text-[0.6rem] uppercase tracking-[0.3em] text-[#c9a227] font-bold">Temporada 2026 Abierta</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Reservation Card */}
        <div className="lg:col-span-2 p-10 rounded-3xl bg-[#0a0a0a] border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
             <Leaf size={200} className="text-[#c9a227]" />
          </div>

          <div className="relative z-10">
            <h3 className="font-display text-3xl text-[#f5f0e8] mb-6">Miel de Ulmo Virgen · Batch #2026-A</h3>
            <p className="text-sm text-[#8a8279] leading-relaxed mb-10 max-w-xl">
              Este batch proviene exclusivamente del Sector Pureo, con una floración de Ulmo tardía que promete 
              notas cremosas y una pureza del 98%. Al reservar hoy, financias directamente el mantenimiento 
              biocultural de las colmenas durante el invierno.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
               <div>
                  <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-[#4a4a4a] mb-2">Entrega Estimada</span>
                  <span className="text-xl font-display text-[#f5f0e8]">Julio 2026</span>
               </div>
               <div>
                  <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-[#4a4a4a] mb-2">Cupos Disponibles</span>
                  <span className="text-xl font-display text-[#c9a227]">42 / 100</span>
               </div>
               <div>
                  <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-[#4a4a4a] mb-2">Valor Reserva</span>
                  <span className="text-xl font-display text-[#f5f0e8]">$12.000 <span className="text-[0.6rem] text-[#8a8279] italic">/ kg</span></span>
               </div>
            </div>

            <button className="w-full md:w-auto px-12 py-5 bg-[#c9a227] text-black text-[0.7rem] uppercase tracking-[0.4em] font-bold rounded-xl hover:shadow-[0_10px_30px_rgba(201,162,39,0.3)] transition-all flex items-center justify-center gap-3">
              Garantizar Mi Cupo <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-6 text-[#c9a227]">
              <Info size={18} />
              <h4 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">Cómo funciona</h4>
            </div>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[0.6rem] text-[#c9a227] shrink-0">1</span>
                <p className="text-xs text-[#8a8279] leading-relaxed">Pagas el valor de reserva ahora para asegurar tu batch.</p>
              </li>
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[0.6rem] text-[#c9a227] shrink-0">2</span>
                <p className="text-xs text-[#8a8279] leading-relaxed">Monitoreas el progreso de la floración desde tu Pasaporte.</p>
              </li>
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[0.6rem] text-[#c9a227] shrink-0">3</span>
                <p className="text-xs text-[#8a8279] leading-relaxed">Liquidamos el saldo restante 15 días antes del despacho.</p>
              </li>
            </ul>
          </div>
          
          <div className="p-8 rounded-3xl border border-white/5 flex items-center gap-4 group cursor-pointer hover:bg-white/[0.02] transition-all">
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#8a8279] group-hover:text-[#c9a227] transition-colors">
                <Leaf size={18} />
             </div>
             <div className="flex-1">
                <p className="text-[0.65rem] uppercase tracking-widest text-[#f5f0e8] mb-1">Impacto Indirecto</p>
                <p className="text-[0.6rem] text-[#4a4a4a]">Esta reserva protege 15m² adicionales de bosque.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
