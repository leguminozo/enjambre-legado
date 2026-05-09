import React from 'react';
import { Settings, User, Mail, Shield, Bell } from 'lucide-react';

export default function AjustesPage() {
  return (
    <div className="space-y-16 animate-in">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#c9a227]/10 flex items-center justify-center text-[#c9a227]">
            <Settings size={20} />
          </div>
          <h1 className="font-display text-4xl font-light text-[#f5f0e8]">Ajustes Guardián</h1>
        </div>
        <p className="text-[#8a8279] text-sm tracking-wide">Gestiona tu identidad y coordenadas en el ecosistema</p>
      </div>

      <div className="max-w-2xl space-y-12">
        {/* Identidad */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 text-[#c9a227]">
            <User size={18} />
            <h3 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">Identidad Pública</h3>
          </div>
          
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-[0.6rem] uppercase tracking-[0.2em] text-[#4a4a4a] ml-1">Nombre Completo</label>
              <input 
                type="text" 
                placeholder="Ej: Gabriel Miranda"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-[#f5f0e8] focus:outline-none focus:border-[#c9a227] transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[0.6rem] uppercase tracking-[0.2em] text-[#4a4a4a] ml-1">Correo Electrónico</label>
              <input 
                type="email" 
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-[#4a4a4a] cursor-not-allowed"
                placeholder="guardian@bosque.cl"
              />
            </div>
          </div>
        </section>

        {/* Notificaciones */}
        <section className="space-y-8 border-t border-white/5 pt-12">
          <div className="flex items-center gap-3 text-[#c9a227]">
            <Bell size={18} />
            <h3 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">Comunicaciones del Bosque</h3>
          </div>
          
          <div className="space-y-4">
             <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div>
                   <p className="text-sm text-[#f5f0e8] mb-1">Avisos de Floración</p>
                   <p className="text-[0.6rem] text-[#8a8279] uppercase tracking-widest">Recibe alertas sobre el estado de tu colmena</p>
                </div>
                <div className="w-10 h-5 bg-[#c9a227] rounded-full relative">
                   <div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full" />
                </div>
             </div>
             <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div>
                   <p className="text-sm text-[#f5f0e8] mb-1">Ritual de Cosecha</p>
                   <p className="text-[0.6rem] text-[#8a8279] uppercase tracking-widest">Aviso prioritario para reservas de lotes</p>
                </div>
                <div className="w-10 h-5 bg-[#c9a227] rounded-full relative">
                   <div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full" />
                </div>
             </div>
          </div>
        </section>

        <button className="px-10 py-4 bg-[#c9a227] text-black text-[0.7rem] uppercase tracking-[0.4em] font-bold rounded-xl hover:shadow-[0_10px_20px_rgba(201,162,39,0.3)] transition-all">
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
