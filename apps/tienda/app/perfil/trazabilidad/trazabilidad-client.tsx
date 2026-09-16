'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { BlockchainCard } from '@/components/perfil/blockchain-card';
import type { BlockchainAnchor } from '@/components/perfil/blockchain-card';

export type UserLoteItem = {
  lote: string;
  productoNombre: string;
  fecha: string;
};

interface TrazabilidadClientProps {
  initialLote?: string;
  anchor: BlockchainAnchor | null;
  error: string | null;
  userLotes?: UserLoteItem[];
}

export function TrazabilidadClient({ initialLote, anchor, error, userLotes = [] }: TrazabilidadClientProps) {
  const router = useRouter();
  const [loteId, setLoteId] = useState(initialLote ?? '');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsSearching(false);
  }, [anchor, error, initialLote]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteId.trim()) return;
    
    setIsSearching(true);
    router.push(`/perfil/trazabilidad?lote=${encodeURIComponent(loteId.trim())}`);
  };

  return (
    <div className="space-y-8">
      {userLotes.length > 0 && (
        <div className="bg-card/70 border border-border p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display text-foreground">Tus Lotes Adquiridos</h2>
            <span className="text-[10px] font-mono text-accent-text uppercase tracking-wider">
              {userLotes.length} {userLotes.length === 1 ? 'lote' : 'lotes'} en historial
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {userLotes.map((item) => {
              const isCurrent = (initialLote ?? '').toLowerCase() === item.lote.toLowerCase();
              return (
                <button
                  key={item.lote}
                  type="button"
                  onClick={() => {
                    setLoteId(item.lote);
                    router.push(`/perfil/trazabilidad?lote=${encodeURIComponent(item.lote)}`);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'bg-accent/15 border-accent/40 shadow-sm'
                      : 'bg-secondary/40 border-border/70 hover:border-accent/30 hover:bg-secondary/70'
                  }`}
                >
                  <p className="text-xs font-medium text-foreground truncate">{item.productoNombre}</p>
                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <span className="font-mono text-[10px] text-accent-text truncate">
                      {item.lote.slice(0, 18)}...
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{item.fecha}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-card border border-border p-6 rounded-3xl space-y-4">
        <h2 className="text-lg font-display text-foreground">Verificación de Origen y Autenticidad</h2>
        <p className="text-sm text-muted-foreground">
          Ingresa el Código de Trazabilidad impreso en la base de tu frasco de miel para verificar su origen, coordenadas del apiario y certificación digital.
        </p>
        
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={loteId}
              onChange={(e) => setLoteId(e.target.value)}
              placeholder="Ej: OYZ-LOTE-04"
              className="w-full bg-secondary/50 border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-accent transition-colors font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !loteId.trim()}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold tracking-widest uppercase hover:shadow-glow transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center min-w-[120px]"
          >
            {isSearching ? <Loader2 size={18} className="animate-spin" /> : 'Verificar'}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
          <span>O prueba con el lote de muestra verificado:</span>
          <button
            type="button"
            onClick={() => {
              setLoteId('OYZ-LOTE-04');
              setIsSearching(true);
              router.push('/perfil/trazabilidad?lote=OYZ-LOTE-04');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-accent/15 text-accent-text hover:bg-accent/25 transition-colors border border-accent/30"
          >
            OYZ-LOTE-04
          </button>
        </div>
      </div>

      {error && (
        <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
          {error}
        </div>
      )}

      {anchor && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="font-display text-xl mb-4 text-foreground">Pasaporte de Origen</h3>
          <BlockchainCard anchor={anchor} />
        </div>
      )}
    </div>
  );
}
