'use client';

import { useState } from 'react';
import { Map, ToggleLeft, ToggleRight } from 'lucide-react';
import { TerritorioUsuarioPanel } from '@/components/apicultor/TerritorioUsuarioPanel';
import type { PerfilFragmentProps } from './constants';

export function TerritorioSection({ actor, saving, joinRegistroTerritorial, updateConsentimiento }: PerfilFragmentProps) {
  const [joinRol, setJoinRol] = useState('api_residente');
  const [joinComuna, setJoinComuna] = useState('');

  return (
    <div className="bg-card border border-border rounded-2xl p-6 animate-in">
      <div className="flex items-center gap-2 text-accent mb-6">
        <Map size={18} />
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Territorio y Privacidad</h3>
      </div>

      {!actor ? (
        <div className="text-center py-12 text-muted-foreground text-sm space-y-6">
          <div>
            <Map size={48} className="mx-auto opacity-30 mb-3 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">No estás inscrito en el Registro Territorial</p>
            <p className="max-w-sm mx-auto mt-2">
              Únete para declarar tus predios, apiarios, y participar en la red colaborativa de alertas tempranas.
            </p>
          </div>
          <div className="max-w-xs mx-auto text-left space-y-4 bg-secondary/30 p-4 rounded-xl border border-border/50">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                Tu Rol Principal en el Territorio
              </label>
              <select
                value={joinRol}
                onChange={(e) => setJoinRol(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="api_residente">Apicultor Residente</option>
                <option value="api_trashumante">Apicultor Trashumante</option>
                <option value="api_mixto">Apicultor Mixto</option>
                <option value="prop_facilitador">Propietario / Facilitador de Predio</option>
                <option value="agri_fitosanitario">Agricultor (Fitosanitario)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                Comuna Base
              </label>
              <input
                type="text"
                placeholder="Ej. Ancud"
                value={joinComuna}
                onChange={(e) => setJoinComuna(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <button
              type="button"
              onClick={() => joinRegistroTerritorial(joinRol, joinComuna)}
              disabled={!joinComuna || saving}
              className="w-full btn btn-gold min-h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-bold disabled:opacity-50"
            >
              Unirme al Registro
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-secondary/30 border border-border/50 rounded-xl space-y-2">
            <p className="font-semibold text-foreground text-sm flex items-center justify-between">
              Registro Territorial Activo
              <span className="badge badge-success px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">Activo</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">ID Actor: {actor.id}</p>
            <p className="text-xs text-muted-foreground">Rol registrado: {actor.rol}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Control de Privacidad y Visibilidad</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Tú decides qué datos quieres compartir con la comunidad de Enjambre Legado.
            </p>

            <div className="space-y-3">
              {[
                {
                  key: 'mapa_comunitario',
                  label: 'Aparecer en el Mapa Comunitario',
                  desc: 'Permite que otros actores vean la ubicación aproximada de tus predios o apiarios.',
                },
                {
                  key: 'alertas_fitosanitarias',
                  label: 'Recibir Alertas Fitosanitarias',
                  desc: 'Usa tu ubicación para notificarte de aplicaciones fitosanitarias cercanas.',
                },
              ].map((item) => {
                const isEnabled = actor.consentimientos?.[item.key as keyof typeof actor.consentimientos];
                return (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-secondary/20 border border-border/50 rounded-xl">
                    <div className="pr-4">
                      <p className="font-medium text-foreground text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateConsentimiento(item.key as keyof typeof actor.consentimientos, !isEnabled)}
                      className={`transition-colors flex-shrink-0 ${isEnabled ? 'text-accent' : 'text-muted-foreground/50 hover:text-muted-foreground'}`}
                    >
                      {isEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <TerritorioUsuarioPanel />
          </div>
        </div>
      )}
    </div>
  );
}
