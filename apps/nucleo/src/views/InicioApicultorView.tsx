'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Hexagon, BookOpen, Mic, CalendarDays, Sprout } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { useAuthStore } from '@enjambre/auth';
import { supabase } from '@/lib/supabase';
import { RegistryAskPanel } from '@/components/apicultor/RegistryAskPanel';
import { useEditorialGreeting } from '@/lib/editorial-greeting';

/**
 * Inicio del rol apicultor (patio/operación).
 * CTAs a módulos prestados — sin panel gerencial (docs/ROLES_Y_ACCESO.md).
 */
export function InicioApicultorView() {
  const fullName = useAuthStore((s) => s.user?.full_name ?? s.user?.email ?? '');
  const userId = useAuthStore((s) => s.user?.id);
  const [colmenasCount, setColmenasCount] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    if (!userId) {
      setColmenasCount(0);
      return;
    }
    try {
      const { count, error } = await supabase
        .from('colmenas')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (!error) setColmenasCount(count ?? 0);
      else setColmenasCount(null);
    } catch {
      setColmenasCount(null);
    }
  }, [userId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const firstName = fullName?.split(/\s+/)[0] || '';
  const editorial = useEditorialGreeting({
    name: firstName,
    role: 'apicultor',
  });

  const tools = [
    {
      href: '/colmenas',
      icon: <Hexagon size={22} />,
      title: 'Mis colmenas',
      desc: 'Fichas, apiarios, sanidad y origen de cada núcleo.',
      primary: true,
    },
    {
      href: '/colmenas/cuaderno',
      icon: <BookOpen size={22} />,
      title: 'Cuaderno de campo',
      desc: 'Hojas, varroa, tratamientos y red semántica del patio.',
      primary: false,
    },
    {
      href: '/calendario',
      icon: <CalendarDays size={22} />,
      title: 'Calendario',
      desc: 'Ciclo de temporada: inspecciones, tratamientos, recolección.',
      primary: false,
    },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Patio · operación"
        greeting={editorial.greeting}
        title="Inicio"
        subtitle="Tus colmenas, tu cuaderno y la bitácora de campo — sin ruido gerencial."
        icon={<Sprout size={20} />}
      >
        {/* Pulso Fenológico: Centralizado y unificado */}
        <div className="w-full mt-3 pt-3.5 border-t border-border/40 flex flex-col items-center text-center animate-in fade-in duration-500">
          <div className="inline-flex items-center justify-center gap-2 flex-wrap px-3 py-1 rounded-full bg-surface-raised/80 border border-border/50">
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-medium inline-flex items-center gap-1.5">
              <Sprout size={11} className="text-primary" />
              {editorial.quote.context}
            </span>
            <span className="text-border/80">·</span>
            <span className="text-[11px] text-muted-foreground font-medium">
              {editorial.season.seasonName}
            </span>
          </div>
          <p className="font-display italic text-base sm:text-lg text-foreground/90 leading-snug mt-2 max-w-3xl">
            «{editorial.quote.quote}»
          </p>
        </div>
      </ViewShell>

      <div className="stats-grid">
        <div className="stat-card animate-in delay-1">
          <div className="stat-header">
            <div className="stat-icon">
              <Hexagon size={20} />
            </div>
          </div>
          <div className="stat-value">{colmenasCount === null ? '—' : colmenasCount}</div>
          <div className="stat-label">Colmenas propias</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tools.map((t) => (
          <Link
            key={`${t.href}-${t.title}`}
            href={t.href}
            className={`card p-4 border transition-colors ${
              t.primary
                ? 'border-accent/40 bg-accent/5 hover:border-accent/60'
                : 'border-border hover:border-accent/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-accent shrink-0">{t.icon}</span>
              <div className="min-w-0">
                <div className="section-title text-sm text-foreground">{t.title}</div>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* <RegistryAskPanel compact /> */}
    </div>
  );
}
