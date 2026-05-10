'use client';

import React, { useEffect } from 'react';
import { gsap } from 'gsap';

interface MiLegadoClientProps {
  user: unknown;
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
  const userData = user as Record<string, unknown> | null;

  useEffect(() => {
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
            <span className="vanguard-data block text-[0.7rem] tracking-[0.5em] uppercase text-accent mb-6">
              Mi Legado
            </span>
            <h1 className="vanguard-data font-display text-5xl md:text-7xl font-light text-foreground mb-4">
              {(userData?.full_name as string) || 'Guardián del Bosque'}
            </h1>
            <p className="vanguard-data font-display italic text-xl text-muted-foreground">
              {tierData?.tier || 'OBRERA'} · {tierData?.ciclos_historicos || 0} Ciclos Acumulados
            </p>
          </div>

          <div className="space-y-24 mt-20">
            <div className="vanguard-data border-t border-border pt-12">
              <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-accent mb-8">Estado de tu Colmena</span>
              {hiveData ? (
                <div className="flex flex-col md:flex-row justify-between items-baseline gap-8">
                  <div>
                    <h3 className="font-display text-3xl font-light mb-2">{hiveData.name}</h3>
                    <p className="text-sm text-muted-foreground">Sector Pureo · {hiveData.estado === 'optima' ? 'Ritmo Vital Estable' : 'Atención Requerida'}</p>
                  </div>
                  <div className="text-right">
                    <span className="block font-display italic text-4xl text-foreground">{hiveData.peso_kg || '--'} kg</span>
                    <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Peso Actual</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Aún no has vinculado tu legado a una colmena específica.
                  Explora las suscripciones para iniciar el vínculo.
                </p>
              )}
            </div>

            <div className="vanguard-data border-t border-border pt-12">
              <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-accent mb-8">Territorio Consolidado</span>
              <div className="flex items-baseline gap-4">
                <span className="font-display text-5xl text-foreground">{(userData?.arboles_personal as number) || 0}</span>
                <span className="text-lg font-display italic text-muted-foreground">m² de bosque nativo bajo tu custodia</span>
              </div>
              <p className="text-xs text-muted-foreground mt-6 max-w-sm leading-relaxed">
                Cada ciclo acumulado acerca tu legado a la consolidación de nuevas coordenadas en el Sector Pureo.
              </p>
            </div>

            <div className="vanguard-data border-t border-border pt-12">
              <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-accent mb-8">Ventana de Cosecha</span>
              <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                  <h3 className="font-display text-2xl font-light mb-2">Expectativa Ritual</h3>
                  <p className="text-sm text-muted-foreground">La naturaleza dicta el tiempo. Estimado: Julio 2026.</p>
                </div>
                <button className="px-8 py-4 border border-accent text-accent text-[0.7rem] uppercase tracking-[0.3em] hover:bg-accent hover:text-accent-foreground transition-all duration-700">
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
