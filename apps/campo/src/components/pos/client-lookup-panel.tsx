'use client';

import { useState, useEffect, useRef } from 'react';
import { useCashSession } from './cash-context';
import { HexagonLoader } from '@enjambre/ui';
import { UserPlus, Search, X, Check } from 'lucide-react';

export function ClientLookupPanel() {
  const { selectedClient, isNewClient, setSelectedClient, setIsNewClient, searchClients } = useCashSession();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchClients>>>([]);
  const [searching, setSearching] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const r = await searchClients(query);
      setResults(r);
      setSearching(false);
    }, 300);
  }, [query, searchClients]);

  if (!expanded && !selectedClient && !isNewClient) {
    return (
      <div className="card-glow p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Cliente</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setIsNewClient(true); setExpanded(false); }}
            className="text-[10px] uppercase tracking-widest text-primary hover:underline"
          >
            Nuevo
          </button>
          <button
            onClick={() => setExpanded(true)}
            className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Buscar
          </button>
        </div>
      </div>
    );
  }

  if (selectedClient) {
    return (
      <div className="card-glow p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{selectedClient.full_name || 'Sin nombre'}</p>
            <p className="text-[10px] text-muted-foreground">{selectedClient.email || 'Sin email'}</p>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">Recurrente</span>
        </div>
        <button onClick={() => setSelectedClient(null)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (isNewClient) {
    return (
      <div className="card-glow p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
          <UserPlus className="w-4 h-4 text-warning" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Cliente nuevo</p>
            <p className="text-[10px] text-muted-foreground">Se aplicará comisión base (sin loyalty)</p>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-warning bg-warning/10 px-2 py-0.5 rounded-full">Nuevo</span>
        </div>
        <button onClick={() => setIsNewClient(false)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="card-glow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Buscar cliente</span>
        <button onClick={() => { setExpanded(false); setQuery(''); }} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre o email..."
          autoFocus
          className="w-full bg-background/40 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <HexagonLoader size="sm" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => { setSelectedClient(r); setExpanded(false); setQuery(''); }}
              className="w-full text-left p-3 rounded-lg hover:bg-foreground/5 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{r.full_name || 'Sin nombre'}</p>
                <p className="text-[10px] text-muted-foreground">{r.email || r.phone || 'Sin contacto'}</p>
              </div>
              <span className="text-[9px] text-primary">Seleccionar</span>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !searching && results.length === 0 && (
        <div className="flex items-center justify-between py-2">
          <p className="text-xs text-muted-foreground">Sin resultados</p>
          <button
            onClick={() => { setIsNewClient(true); setExpanded(false); setQuery(''); }}
            className="text-xs text-primary hover:underline"
          >
            Registrar como nuevo
          </button>
        </div>
      )}
    </div>
  );
}
