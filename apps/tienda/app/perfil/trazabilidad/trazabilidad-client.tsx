'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { BlockchainCard } from '@/components/perfil/blockchain-card';

interface TrazabilidadClientProps {
  initialLote?: string;
  anchor: any;
  error: string | null;
}

export function TrazabilidadClient({ initialLote, anchor, error }: TrazabilidadClientProps) {
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
      <div className="bg-card border border-border p-6 rounded-3xl space-y-4">
        <h2 className="text-lg font-display text-foreground">Consulta de Lote</h2>
        <p className="text-sm text-muted-foreground">
          Ingresa el Código de Trazabilidad (ID) impreso en la base de tu frasco de miel para verificar su origen criptográfico.
        </p>
        
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={loteId}
              onChange={(e) => setLoteId(e.target.value)}
              placeholder="Ej: f47ac10b-58cc-4372-a567-0e02b2c3d479"
              className="w-full bg-secondary/50 border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !loteId.trim()}
            className="bg-accent text-accent-foreground px-6 py-3 rounded-xl text-sm font-bold tracking-widest uppercase hover:shadow-glow transition-all disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center min-w-[120px]"
          >
            {isSearching ? <Loader2 size={18} className="animate-spin" /> : 'Verificar'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
          {error}
        </div>
      )}

      {anchor && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="font-display text-xl mb-4 text-foreground">Registro Inmutable</h3>
          <BlockchainCard anchor={anchor} />
        </div>
      )}
    </div>
  );
}
