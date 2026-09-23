'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, QrCode, X, Activity, MapPin, Zap } from 'lucide-react';
import { BlockchainCard } from '@/components/perfil/blockchain-card';
import type { BlockchainAnchor } from '@/components/perfil/blockchain-card';
import type { ColmenaLiveData } from './page';
import { QrCameraScanner } from '@/components/shop/qr-camera-scanner';

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
  hiveData?: ColmenaLiveData | null;
}

export function TrazabilidadClient({
  initialLote,
  anchor,
  error,
  userLotes = [],
  hiveData,
}: TrazabilidadClientProps) {
  const router = useRouter();
  const [loteId, setLoteId] = useState(initialLote ?? '');
  const [isSearching, setIsSearching] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    setIsSearching(false);
  }, [anchor, error, initialLote]);

  const executeSearch = (targetCode: string) => {
    const clean = targetCode.trim();
    if (!clean) return;
    setIsSearching(true);
    router.push(`/perfil/trazabilidad?lote=${encodeURIComponent(clean)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(loteId);
  };

  const handleQrScan = (code: string) => {
    if (!code) return;
    setShowScanner(false);

    // Feedback táctil instantáneo en dispositivos móviles
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(60);
      } catch {
        // Silencioso en navegadores sin soporte
      }
    }

    // Extraer lote de URLs comunes (/lote/, ?lote=, ?code=) o código plano
    let extracted = code.trim();
    try {
      const url = new URL(extracted);
      const match = url.pathname.match(/\/lote\/([^/?#]+)/i);
      if (match) {
        extracted = match[1];
      } else if (url.searchParams.get('lote')) {
        extracted = url.searchParams.get('lote')!;
      } else if (url.searchParams.get('code')) {
        extracted = url.searchParams.get('code')!;
      } else {
        const segments = url.pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
          extracted = segments[segments.length - 1];
        }
      }
    } catch {
      // Código plano
    }
    setLoteId(extracted);
    executeSearch(extracted);
  };

  return (
    <div className="w-full space-y-10">
      {/* ── 1. CÁMARA Y ESCÁNER QR INTEGRADO ── */}
      {showScanner && (
        <div className="bg-card border border-accent/40 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <QrCode size={18} className="text-accent" />
              <h3 className="font-display text-lg text-foreground">
                Escaneo de Frasco con Cámara
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowScanner(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
              aria-label="Cerrar escáner"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Apunta la cámara al código QR impreso en el sello o en la base de tu frasco de miel.
          </p>
          <div className="max-w-md mx-auto overflow-hidden rounded-2xl border border-border">
            <QrCameraScanner
              onScan={handleQrScan}
            />
          </div>
        </div>
      )}

      {/* ── 2. BUSCADOR DE ORIGEN & ACCIÓN DE ESCANEAR ── */}
      <div className="bg-card border border-border/80 p-6 sm:p-8 rounded-3xl space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-display text-foreground">
              Verificación de Origen y Autenticidad
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Ingresa el código identificador de tu frasco o escanea su QR con tu cámara.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowScanner((prev) => !prev)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-accent/40 bg-accent/10 text-accent-text hover:bg-accent/20 text-xs font-mono uppercase tracking-wider transition-colors shrink-0"
          >
            <QrCode size={16} />
            <span>{showScanner ? 'Ocultar Cámara' : 'Escanear con Cámara'}</span>
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={loteId}
              onChange={(e) => setLoteId(e.target.value)}
              placeholder="Ej: OYZ-LOTE-04"
              className="w-full bg-surface-sunken/60 border border-border rounded-xl py-3 pl-12 pr-4 text-base md:text-sm text-foreground focus:outline-none focus:border-accent transition-colors font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !loteId.trim()}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl text-xs font-bold tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center min-w-[120px]"
          >
            {isSearching ? <Loader2 size={16} className="animate-spin" /> : 'Verificar'}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
          <span>Lote de muestra verificado:</span>
          <button
            type="button"
            onClick={() => {
              setLoteId('OYZ-LOTE-04');
              executeSearch('OYZ-LOTE-04');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-accent/10 text-accent-text hover:bg-accent/20 transition-colors border border-accent/20"
          >
            OYZ-LOTE-04
          </button>
        </div>
      </div>

      {/* ── 3. LOTES ADQUIRIDOS POR EL USUARIO ── */}
      {userLotes.length > 0 ? (
        <div className="bg-card border border-border/70 p-6 sm:p-7 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-display text-foreground">Tus Lotes Adquiridos</h3>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              {userLotes.length} en historial de compra
            </span>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {userLotes.map((item) => {
              const isCurrent = (initialLote ?? '').toLowerCase() === item.lote.toLowerCase();
              return (
                <button
                  key={item.lote}
                  type="button"
                  onClick={() => {
                    setLoteId(item.lote);
                    executeSearch(item.lote);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'bg-accent/15 border-accent/50 shadow-sm'
                      : 'bg-surface-sunken/40 border-border/70 hover:border-accent/40 hover:bg-surface-raised/40'
                  }`}
                >
                  <p className="text-xs font-medium text-foreground truncate">{item.productoNombre}</p>
                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <span className="font-mono text-[10px] text-accent-text truncate">
                      {item.lote.slice(0, 16)}...
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{item.fecha}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-surface-sunken/30 border border-border/50 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            Los frascos que adquieras en la tienda o ferias se vincularán automáticamente aquí para consulta directa.
          </p>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 shrink-0">
            0 lotes vinculados
          </span>
        </div>
      )}

      {/* ── 4. ERROR SI NO SE ENCONTRÓ EL LOTE ── */}
      {error && (
        <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
          {error}
        </div>
      )}

      {/* ── 5. CERTIFICADO DEL LOTE CONSULTADO ── */}
      {anchor && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h3 className="font-display text-2xl text-foreground font-light">
            Certificado de Origen Verificado
          </h3>
          <BlockchainCard anchor={anchor} />
        </div>
      )}

      {/* ── 6. TELEMETRÍA DE COLMENA VIVA (CENTINELA O SUSCRIPTOR) ── */}
      {hiveData && (
        <div className="bg-card border border-border/70 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-accent-text font-bold block mb-1">
                {hiveData.isLinked ? 'Colmena Vinculada a Tu Cuenta' : 'Colmena Centinela de Muestra'}
              </span>
              <h3 className="font-display text-2xl sm:text-3xl text-foreground font-light">
                {hiveData.name}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-xs text-accent-text font-mono">
                <Activity size={13} />
                <span>{hiveData.health === 'optimal' ? 'Ritmo Vital Estable' : 'En Observación'}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface-sunken/40 border border-border/60">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-mono">
                Ubicación
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-sm font-medium text-foreground">
                <MapPin size={14} className="text-accent shrink-0" />
                <span className="truncate">{hiveData.sector}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-sunken/40 border border-border/60">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-mono">
                Floración Dominante
              </span>
              <p className="mt-1 text-sm font-medium text-foreground truncate">
                {hiveData.floracion}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-sunken/40 border border-border/60">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-mono">
                Peso Registrado
              </span>
              <p className="mt-1 text-sm font-medium text-foreground">
                {hiveData.peso_kg} kg
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-sunken/30 border border-border/50 space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-mono">
              Bitácora de Campo en Chiloé
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed italic font-display text-sm">
              &ldquo;{hiveData.notes}&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
