'use client';

import { useEffect, useState } from 'react';
import { Smartphone, Wallet } from 'lucide-react';
import { toast } from '@enjambre/ui';
import {
  downloadApplePass,
  fetchWalletCapabilities,
  getGoogleSaveLink,
  type WalletCapabilities,
} from '@/lib/shop/wallet-api';

export function WalletButtons({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);
  const [caps, setCaps] = useState<WalletCapabilities | null>(null);

  useEffect(() => {
    void fetchWalletCapabilities().then(setCaps);
  }, []);

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

  const appleDisabled = caps !== null && !caps.apple.available;
  const googleDisabled = caps !== null && !caps.google.available;

  return (
    <div className={`flex ${compact ? 'flex-col gap-2' : 'flex-wrap gap-3'}`}>
      <button
        type="button"
        disabled={loading !== null || appleDisabled}
        onClick={() => void handleApple()}
        title={caps?.apple.reason ?? undefined}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-card/60 disabled:opacity-50"
      >
        <Smartphone size={16} />
        {loading === 'apple' ? 'Generando...' : appleDisabled ? 'Apple Wallet (próx.)' : 'Apple Wallet'}
      </button>
      <button
        type="button"
        disabled={loading !== null || googleDisabled}
        onClick={() => void handleGoogle()}
        title={caps?.google.reason ?? undefined}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-card/60 disabled:opacity-50"
      >
        <Wallet size={16} />
        {loading === 'google' ? 'Abriendo...' : googleDisabled ? 'Google Wallet (próx.)' : 'Google Wallet'}
      </button>
    </div>
  );
}