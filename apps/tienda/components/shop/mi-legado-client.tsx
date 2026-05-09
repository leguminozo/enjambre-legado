'use client';

import React, { useEffect } from 'react';
import { gsap } from 'gsap';

interface MiLegadoClientProps {
  user: any;
  tierData: {
    tier: string;
    ciclos_historicos: number;
  } | null;
  hiveData: {
    name: string;
    estado: string;
    peso_kg: number;
  } | null;
}

export function MiLegadoClient({ user, tierData, hiveData }: MiLegadoClientProps) {
  useEffect(() => {
    // Animation: Gradual reveal
    gsap.from('.vanguard-data', {
      opacity: 0,
      y: 20,
      duration: 2,
      stagger: 0.3,
      ease: 'power2.out'
    });
  }, []);

  return (
    <div className="w-full">
      <div className="relative mb-20">

      <div className="relative z-10 max-w-2xl w-full">
        <div className="text-center mb-16">
          <span className="vanguard-data block text-[0.7rem] tracking-[0.5em] uppercase text-[#c9a227] mb-6">
            Mi Legado
          </span>
          <h1 className="vanguard-data font-display text-5xl md:text-7xl font-light text-[#f5f0e8] mb-4">
            {user?.full_name || 'Guardián del Bosque'}
          </h1>
          <p className="vanguard-data font-display italic text-xl text-[#8a8279]">
            {tierData?.tier || 'OBRERA'} · {tierData?.ciclos_historicos || 0} Ciclos Acumulados
          </p>
        </div>

        <div className="space-y-24 mt-20">
          {/* Colmena Vinculada */}
          <div className="vanguard-data border-t border-white/5 pt-12">
            <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-[#c9a227] mb-8">Estado de tu Colmena</span>
            {hiveData ? (
              <div className="flex flex-col md:flex-row justify-between items-baseline gap-8">
                <div>
                  <h3 className="font-display text-3xl font-light mb-2">{hiveData.name}</h3>
                  <p className="text-sm text-[#8a8279]">Sector Pureo · {hiveData.estado === 'optima' ? 'Ritmo Vital Estable' : 'Atención Requerida'}</p>
                </div>
                <div className="text-right">
                  <span className="block font-display italic text-4xl text-[#f5f0e8]">{hiveData.peso_kg || '--'} kg</span>
                  <span className="text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279]">Peso Actual</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#8a8279] italic">
                Aún no has vinculado tu legado a una colmena específica. 
                Explora las suscripciones para iniciar el vínculo.
              </p>
            )}
          </div>

          {/* Créditos Ecosistémicos */}
          <div className="vanguard-data border-t border-white/5 pt-12">
            <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-[#c9a227] mb-8">Territorio Consolidado</span>
            <div className="flex items-baseline gap-4">
              <span className="font-display text-5xl text-[#f5f0e8]">{user?.arboles_personal || 0}</span>
              <span className="text-lg font-display italic text-[#8a8279]">m² de bosque nativo bajo tu custodia</span>
            </div>
            <p className="text-xs text-[#8a8279] mt-6 max-w-sm leading-relaxed">
              Cada ciclo acumulado acerca tu legado a la consolidación de nuevas coordenadas en el Sector Pureo.
            </p>
          </div>

          {/* Próxima Cosecha */}
          <div className="vanguard-data border-t border-white/5 pt-12">
            <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-[#c9a227] mb-8">Ventana de Cosecha</span>
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-center md:text-left">
                <h3 className="font-display text-2xl font-light mb-2">Expectativa Ritual</h3>
                <p className="text-sm text-[#8a8279]">La naturaleza dicta el tiempo. Estimado: Julio 2026.</p>
              </div>
              <button className="px-8 py-4 border border-[#c9a227] text-[#c9a227] text-[0.7rem] uppercase tracking-[0.3em] hover:bg-[#c9a227] hover:text-black transition-all duration-700">
                Reservar Cupo
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
