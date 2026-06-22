'use client';

import { useState } from 'react';
import { Smartphone, Wallet } from 'lucide-react';
import { toast } from '@enjambre/ui';
import { downloadApplePass, getGoogleSaveLink } from '@/lib/shop/wallet-api';

export function WalletButtons({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);

  const handleApple = async () => {
    setLoading('apple');
    try {
      const result = await downloadApplePass();
      if (!result.ok) {
        toast(result.message ?? 'Error', { type: 'error' });
        return;
      }
      if (result.message) toast(result.message, { type: 'success' });
    } finally {
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setLoading('google');
    try {
      const result = await getGoogleSaveLink();
      if (!result.ok) {
        toast(result.message ?? 'Error', { type: 'error' });
        return;
      }
      if (result.message) toast(result.message, { type: 'info' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={`flex ${compact ? 'flex-col gap-2' : 'flex-wrap gap-3'}`}>
      <button
        type="button"
        disabled={loading !== null}
        onClick={() => void handleApple()}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-card/60 disabled:opacity-50"
      >
        <Smartphone size={16} />
        {loading === 'apple' ? 'Generando...' : 'Apple Wallet'}
      </button>
      <button
        type="button"
        disabled={loading !== null}
        onClick={() => void handleGoogle()}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-card/60 disabled:opacity-50"
      >
        <Wallet size={16} />
        {loading === 'google' ? 'Abriendo...' : 'Google Wallet'}
      </button>
    </div>
  );
}