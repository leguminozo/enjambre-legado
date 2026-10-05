'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CalendarDays, Hexagon, Sprout } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { useAuthStore } from '@enjambre/auth';
import { supabase } from '@/lib/supabase';
import { HeaderEcosistema } from '@/components/apicultor/HeaderEcosistema';
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
    if (!userId) { setColmenasCount(0); return; }
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

  useEffect(() => { void cargar(); }, [cargar]);

  const firstName = fullName?.split(/\s+/)[0] || '';
  const editorial = useEditorialGreeting({ name: firstName, role: 'apicultor' });

  const tools = [
    {
      href: '/colmenas',
      icon: <Hexagon size={20} />,
      title: 'Mis colmenas',
      desc: colmenasCount !== null
        ? `${colmenasCount} colmena${colmenasCount !== 1 ? 's' : ''} activa${colmenasCount !== 1 ? 's' : ''} · fichas, apiarios y sanidad.`
        : 'Fichas, apiarios, sanidad y origen de cada núcleo.',
      primary: true,
    },
    {
      href: '/colmenas/cuaderno',
      icon: <BookOpen size={20} />,
      title: 'Cuaderno de campo',
      desc: 'Hojas, varroa, tratamientos y mapa vivo del patio.',
    },
    {
      href: '/calendario',
      icon: <CalendarDays size={20} />,
      title: 'Calendario',
      desc: 'Ciclo de temporada: inspecciones, tratamientos, recolección.',
    },
  ] as const;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Patio · operación"
        title={editorial.greeting}
        subtitle={`Tus colmenas, tu cuaderno y la bitácora de campo.${editorial.quote?.quote ? ` · ${editorial.quote.quote}` : ''}`}
        icon={<Sprout size={20} />}
      />

      {/* Pulso ambiental: luna · región · floración activa */}
      <HeaderEcosistema />

      {/* CTAs a módulos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tools.map((t) => (
          <Link
            key={`${t.href}-${t.title}`}
            href={t.href}
            className={`card p-4 border transition-colors ${
              'primary' in t && t.primary
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
    </div>
  );
}
