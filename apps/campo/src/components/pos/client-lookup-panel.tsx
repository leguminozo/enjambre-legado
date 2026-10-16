'use client';

import { useState, useEffect, useRef } from 'react';
import { useCashSession } from './cash-context';
import { HexagonLoader, toast, friendlyError } from '@enjambre/ui';
import { UserPlus, Search, X, Check } from 'lucide-react';

export function ClientLookupPanel() {
  const { selectedClient, isNewClient, setSelectedClient, setIsNewClient, searchClients, createClient } = useCashSession();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchClients>>>([]);
  const [searching, setSearching] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast('Ingresa el nombre del cliente', { type: 'error' });
      return;
    }
    setCreating(true);
    try {
      await createClient({
        name: newName.trim(),
        telefono: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
      });
      toast('Cliente registrado y asociado', { type: 'success' });
      setShowCreateForm(false);
      setExpanded(false);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
    } catch (err) {
      toast(friendlyError(err, 'No se pudo registrar el cliente'), { type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  if (showCreateForm) {
    return (
      <form onSubmit={handleCreateSubmit} className="card-glow p-4 space-y-3 animate-in fade-in duration-300">
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">Registro Express de Cliente</span>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm(false)}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="Cerrar registro"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej. Valentina Solar"
              autoFocus
              className="w-full min-h-11 bg-background/50 border border-border rounded-xl px-3 py-2 text-base md:text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block mb-1">
              WhatsApp / Celular (para comprobante)
            </label>
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+56 9 8765 4321"
              className="w-full min-h-11 bg-background/50 border border-border rounded-xl px-3 py-2 text-base md:text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block mb-1">
              Email (opcional)
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="cliente@ejemplo.com"
              className="w-full min-h-11 bg-background/50 border border-border rounded-xl px-3 py-2 text-base md:text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground leading-tight pt-1">
          Los datos se registran con autorización del cliente para el envío de su comprobante y pasaporte digital (Ley N° 21.719).
        </p>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => setShowCreateForm(false)}
            className="flex-1 min-h-11 rounded-xl border border-border text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="flex-1 min-h-11 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? <HexagonLoader size="sm" /> : 'Registrar y Asociar'}
          </button>
        </div>
      </form>
    );
  }

  if (!expanded && !selectedClient && !isNewClient) {
    return (
      <div className="card-glow p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Cliente</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setShowCreateForm(true); setExpanded(false); }}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary/30 px-3 text-[10px] uppercase tracking-widest text-primary hover:bg-primary/10 transition-colors font-medium"
          >
            + Nuevo
          </button>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-3 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
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
            <p className="text-[10px] text-muted-foreground">{selectedClient.phone || selectedClient.email || 'Sin contacto directo'}</p>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">Asociado</span>
        </div>
        <button
          type="button"
          onClick={() => setSelectedClient(null)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="Quitar cliente"
        >
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
            <p className="text-sm font-bold text-foreground">Cliente sin registrar</p>
            <p className="text-[10px] text-muted-foreground">Venta rápida anónima</p>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-warning bg-warning/10 px-2 py-0.5 rounded-full">Anónimo</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => { setIsNewClient(false); setShowCreateForm(true); }}
            className="text-[10px] text-primary underline px-2 py-1"
          >
            Registrar datos
          </button>
          <button
            type="button"
            onClick={() => setIsNewClient(false)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="Cancelar cliente anónimo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-glow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Buscar cliente</span>
        <button
          type="button"
          onClick={() => { setExpanded(false); setQuery(''); }}
          className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="Cerrar búsqueda"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre, teléfono o email..."
          autoFocus
          className="w-full min-h-11 bg-background/40 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
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
              type="button"
              onClick={() => { setSelectedClient(r); setExpanded(false); setQuery(''); }}
              className="w-full min-h-11 text-left p-3 rounded-lg hover:bg-foreground/5 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{r.full_name || 'Sin nombre'}</p>
                <p className="text-[10px] text-muted-foreground">{r.phone || r.email || 'Sin contacto'}</p>
              </div>
              <span className="text-[9px] text-primary font-bold">Seleccionar</span>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !searching && results.length === 0 && (
        <div className="flex items-center justify-between py-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground">Sin resultados</p>
          <button
            type="button"
            onClick={() => { setShowCreateForm(true); setNewName(query); setExpanded(false); setQuery(''); }}
            className="inline-flex min-h-11 items-center rounded-lg border border-primary/30 px-3 text-xs text-primary hover:bg-primary/10 transition-colors font-medium"
          >
            + Registrar &quot;{query}&quot;
          </button>
        </div>
      )}
    </div>
  );
}
