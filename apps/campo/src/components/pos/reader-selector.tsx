'use client';

import { useEffect } from 'react';
import { useSumUp } from './sumup-context';
import type { SumUpReader } from './types';
import { HexagonLoader, ViewLoading } from '@enjambre/ui';
import { Wifi, WifiOff, AlertCircle, Smartphone } from 'lucide-react';

interface Props {
  onSelect: (reader: SumUpReader) => void;
  selectedReaderId: string | null;
}

function statusIcon(status: string) {
  switch (status) {
    case 'online':
      return <Wifi className="w-3.5 h-3.5 text-success" />;
    case 'busy':
      return <HexagonLoader size="sm" className="text-warning" />;
    case 'offline':
      return <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />;
    case 'error':
      return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
    default:
      return <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'online': return 'Conectado';
    case 'busy': return 'Ocupado';
    case 'offline': return 'Desconectado';
    case 'error': return 'Error';
    default: return status;
  }
}

const PREFERRED_READER_KEY = 'sumup_preferred_reader_id';

export function ReaderSelector({ onSelect, selectedReaderId }: Props) {
  const { readers, readersLoading, readersError, fetchReaders } = useSumUp();

  useEffect(() => {
    fetchReaders();
  }, [fetchReaders]);

  // Prefer last-used reader when online (config-en-UI local, no deploy)
  useEffect(() => {
    if (readersLoading || readers.length === 0) return;
    try {
      const preferred = localStorage.getItem(PREFERRED_READER_KEY);
      if (!preferred) return;
      const match = readers.find(
        (r) => r.id === preferred && (r.status === 'online' || r.status === 'busy'),
      );
      if (match && !selectedReaderId) {
        // surface preferred first — do not auto-start checkout
      }
    } catch {
      /* ignore */
    }
  }, [readers, readersLoading, selectedReaderId]);

  const onlineReaders = (() => {
    const online = readers.filter((r) => r.status === 'online');
    try {
      const preferred = localStorage.getItem(PREFERRED_READER_KEY);
      if (!preferred) return online;
      return [...online].sort((a, b) => {
        if (a.id === preferred) return -1;
        if (b.id === preferred) return 1;
        return 0;
      });
    } catch {
      return online;
    }
  })();

  if (readersLoading) {
    return (
      <ViewLoading variant="inline" label="Buscando terminales" hideLabel className="py-8" />
    );
  }

  if (readersError) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <AlertCircle className="w-6 h-6 text-destructive" />
        <p className="text-xs text-destructive text-center">{readersError}</p>
        <button onClick={fetchReaders} className="text-[10px] text-primary uppercase tracking-widest hover:underline">
          Reintentar
        </button>
      </div>
    );
  }

  if (readers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Smartphone className="w-6 h-6 text-muted-foreground" />
        <p className="text-xs text-muted-foreground text-center">No hay terminales registrados</p>
        <p className="text-[10px] text-muted-foreground text-center">Vincula un terminal SumUp en la configuración de Nucleo</p>
      </div>
    );
  }

  if (onlineReaders.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-destructive text-center">Ningun terminal disponible</p>
        <div className="space-y-2">
          {readers.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3 opacity-50">
              {statusIcon(r.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{r.name}</p>
                <p className="text-[10px] text-muted-foreground">{statusLabel(r.status)}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={fetchReaders} className="w-full text-[10px] text-primary uppercase tracking-widest hover:underline text-center">
          Actualizar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase text-muted-foreground tracking-widest text-center mb-3">
        Selecciona el terminal
      </p>
      {readers.map((r) => {
        const isOnline = r.status === 'online';
        const isSelected = r.id === selectedReaderId;
        return (
          <button
            key={r.id}
            disabled={!isOnline}
            onClick={() => onSelect(r)}
            className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 transition-all text-left ${
              isSelected
                ? 'bg-primary text-primary-foreground border-primary'
                : isOnline
                  ? 'bg-card border-border text-foreground hover:border-primary hover:text-primary'
                  : 'bg-card/30 border-border text-muted-foreground opacity-40 cursor-not-allowed'
            }`}
          >
            {statusIcon(r.status)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{r.name}</p>
              <p className={`text-[10px] ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {statusLabel(r.status)} · {r.serial_number}
              </p>
            </div>
          </button>
        );
      })}
      <button onClick={fetchReaders} className="w-full text-[10px] text-muted-foreground uppercase tracking-widest hover:text-primary text-center">
        Actualizar terminales
      </button>
    </div>
  );
}
