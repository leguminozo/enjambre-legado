'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Smartphone, Wallet } from 'lucide-react';
import { QRCode, toast } from '@enjambre/ui';
import {
  downloadApplePass,
  fetchWalletCapabilities,
  getGoogleSaveLink,
  type WalletCapabilities,
} from '@/lib/shop/wallet-api';
import { billeteraPath, resolveWalletHost, type WalletHost } from '@/lib/shop/wallet-device';

export function WalletButtons({ compact = false }: { compact?: boolean }) {
  const [host, setHost] = useState<WalletHost | null>(null);
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);
  const [caps, setCaps] = useState<WalletCapabilities | null>(null);
  const [copied, setCopied] = useState(false);

  const installUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${billeteraPath()}`;
  }, []);

  useEffect(() => {
    const resolved = resolveWalletHost(navigator.userAgent);
    setHost(resolved);
  }, []);

  useEffect(() => {
    if (host !== 'ios' && host !== 'android') return;
    void fetchWalletCapabilities().then(setCaps);
  }, [host]);

  const handleApple = async () => {
    if (caps && !caps.apple.available) {
      toast(caps.apple.reason ?? 'Apple Wallet próximamente', { type: 'info' });
      return;
    }
    setLoading('apple');
    try {
      const result = await downloadApplePass();
      if (!result.ok) {
        toast(result.message ?? 'No disponible', { type: 'error' });
        return;
      }
      if (result.message) toast(result.message, { type: 'success' });
    } finally {
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    if (caps && !caps.google.available) {
      toast(caps.google.reason ?? 'Google Wallet próximamente', { type: 'info' });
      return;
    }
    setLoading('google');
    try {
      const result = await getGoogleSaveLink();
      if (!result.ok) {
        toast(result.message ?? 'No disponible', { type: 'error' });
        return;
      }
      if (result.message) toast(result.message, { type: 'info' });
    } finally {
      setLoading(null);
    }
  };

  const copyLink = async () => {
    if (!installUrl) return;
    try {
      await navigator.clipboard.writeText(installUrl);
      setCopied(true);
      toast('Enlace copiado. Ábrelo en el teléfono.', { type: 'success' });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('No se pudo copiar el enlace', { type: 'error' });
    }
  };

  const [showDesktopModal, setShowDesktopModal] = useState(false);

  if (host === null) {
    return <div className={compact ? 'h-11' : 'h-24'} aria-hidden />;
  }

  if (host === 'desktop') {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowDesktopModal(true)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface-raised px-5 py-2.5 text-sm font-medium text-foreground hover:bg-card/80 transition-colors shadow-sm"
        >
          <Smartphone size={16} className="text-accent" />
          <span>Guardar en Apple / Google Wallet</span>
        </button>

        {showDesktopModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-modal-title"
          >
            <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 sm:p-8 text-center shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setShowDesktopModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-sunken transition-colors"
                aria-label="Cerrar ventana"
              >
                <span className="text-lg leading-none">✕</span>
              </button>

              <div className="mx-auto w-12 h-12 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                <Smartphone size={22} />
              </div>

              <div className="space-y-1.5">
                <h3 id="wallet-modal-title" className="font-display text-2xl text-foreground font-light">
                  Lleva tu Pase al Teléfono
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Apunta con la cámara de tu iPhone o Android para abrir tu Billetera y agregar la Tarjeta Obrera con un toque.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white shadow-inner inline-block mx-auto">
                {installUrl ? (
                  <QRCode
                    value={installUrl}
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    className="border-none bg-transparent p-0"
                  />
                ) : null}
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-card/60 transition-colors"
                >
                  {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
                  <span>{copied ? 'Enlace copiado' : 'Copiar enlace al portapapeles'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDesktopModal(false)}
                  className="w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  const appleDisabled = caps !== null && !caps.apple.available;
  const googleDisabled = caps !== null && !caps.google.available;
  const showApple = host === 'ios';
  const showGoogle = host === 'android';

  return (
    <div className={`flex ${compact ? 'flex-col gap-2' : 'flex-wrap gap-3'}`}>
      {showApple ? (
        <button
          type="button"
          disabled={loading !== null || appleDisabled}
          onClick={() => void handleApple()}
          title={caps?.apple.reason ?? undefined}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-card/60 disabled:opacity-50"
        >
          <Smartphone size={16} />
          {loading === 'apple' ? 'Generando...' : appleDisabled ? 'Apple Wallet (próx.)' : 'Añadir a Apple Wallet'}
        </button>
      ) : null}
      {showGoogle ? (
        <button
          type="button"
          disabled={loading !== null || googleDisabled}
          onClick={() => void handleGoogle()}
          title={caps?.google.reason ?? undefined}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-card/60 disabled:opacity-50"
        >
          <Wallet size={16} />
          {loading === 'google' ? 'Abriendo...' : googleDisabled ? 'Google Wallet (próx.)' : 'Añadir a Google Wallet'}
        </button>
      ) : null}
    </div>
  );
}
