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
      toast('Enlace copiado. Abrilo en el teléfono.', { type: 'success' });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('No se pudo copiar el enlace', { type: 'error' });
    }
  };

  if (host === null) {
    return <div className={compact ? 'h-11' : 'h-24'} aria-hidden />;
  }

  if (host === 'desktop') {
    const qrSize = compact ? 128 : 168;
    return (
      <div
        className={`rounded-2xl border border-border bg-card/40 ${compact ? 'p-4' : 'p-5'} space-y-3`}
      >
        <p className="text-sm text-foreground font-medium">Llevá la Tarjeta Obrera al teléfono</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          En el computador no se instala Wallet. Escaneá el QR o copiá el enlace y abrilo en el
          móvil: ahí sí se crea la tarjeta.
        </p>
        {installUrl ? (
          <QRCode value={installUrl} size={qrSize} className="mx-auto border-none bg-transparent p-0" />
        ) : null}
        <button
          type="button"
          onClick={() => void copyLink()}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-card/60"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copiado' : 'Copiar enlace'}
        </button>
      </div>
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
