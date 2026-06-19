'use client';

import React, { useState } from 'react';
import { Users, ArrowRight, Share2 } from 'lucide-react';
import { toast } from '@enjambre/ui';
import type { ReferralStats } from '@/app/actions/perfil-experiences';

export function CircularReferralClient({ stats }: { stats: ReferralStats }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(stats.referralUrl);
      setCopied(true);
      toast('Enlace copiado', { type: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('No se pudo copiar el enlace', { type: 'error' });
    }
  };

  return (
    <div className="space-y-16 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Users size={20} />
            </div>
            <h1 className="font-display text-4xl font-light text-foreground">Circular Colmena</h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">
            Invita guardianes y fortalece la red biocultural
          </p>
        </div>
      </div>

      <div className="p-10 rounded-3xl bg-card border border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Share2 size={200} className="text-accent" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <h3 className="font-display text-3xl text-foreground mb-6">Tu enlace de invitación</h3>
          <p className="text-sm text-muted-foreground mb-8">
            Comparte este enlace con futuros guardianes. Cada referido exitoso suma impacto a tu
            colmena.
          </p>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border mb-8">
            <code className="text-xs text-accent font-mono flex-1 truncate">{stats.referralUrl}</code>
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 bg-accent text-accent-foreground text-[0.6rem] uppercase tracking-[0.2em] font-bold rounded-lg"
            >
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Referidos registrados
              </span>
              <span className="text-xl font-display text-foreground">{stats.referralCount}</span>
            </div>
            <div>
              <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Compras referidas
              </span>
              <span className="text-xl font-display text-accent">{stats.referralPurchases}</span>
            </div>
          </div>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Únete al Legado: ${stats.referralUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex px-12 py-5 bg-accent text-accent-foreground text-[0.7rem] uppercase tracking-[0.4em] font-bold rounded-xl items-center gap-3"
          >
            Compartir <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}