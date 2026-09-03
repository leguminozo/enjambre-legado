'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  MapPin,
  BellRing,
  Sprout,
  ChevronRight,
  ChevronDown,
  X,
  Compass,
  CheckCircle2,
} from 'lucide-react';

interface BienvenidaTerritorialCardProps {
  nombreActor?: string | null;
  rolLabel?: string | null;
  comuna?: string | null;
  completo?: boolean;
  ctaHref: string;
}

const STORAGE_KEY = 'enj_welcome_territorial_dismissed';

export function BienvenidaTerritorialCard({
  nombreActor,
  rolLabel,
  comuna,
  completo = false,
  ctaHref,
}: BienvenidaTerritorialCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showFullGuide, setShowFullGuide] = useState(!completo);

  useEffect(() => {
    setMounted(true);
    if (completo) {
      setShowFullGuide(false);
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'true' && completo) {
        setDismissed(true);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [completo]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore
    }
  };

  const handleRestore = () => {
    setDismissed(false);
    setShowFullGuide(true);
  };

  if (!mounted) return null;

  if (dismissed) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-border/60 bg-surface-raised/40 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Compass size={15} className="text-primary" />
          <span>Guía de inicio en el Registro Territorial Apícola</span>
        </div>
        <button
          type="button"
          onClick={handleRestore}
          className="text-foreground hover:text-primary transition-colors font-medium underline underline-offset-4"
        >
          Ver guía y pilares
        </button>
      </div>
    );
  }

  const pilares = [
    {
      step: '1',
      title: 'Identidad y Censo',
      desc: 'Declara tu rol y comuna para integrar la red oficial de Chiloé.',
      href: ctaHref,
      done: completo,
      icon: <ShieldCheck size={16} />,
    },
    {
      step: '2',
      title: 'Apiarios y Pecoreo',
      desc: 'Registra tus puntos de vuelo para activar el radio de protección comunitaria.',
      href: '/territorio/mapa',
      done: Boolean(comuna),
      icon: <MapPin size={16} />,
    },
    {
      step: '3',
      title: 'Alertas a 3 km',
      desc: 'Notificaciones fitosanitarias preventivas entre vecinos apicultores y agricultores.',
      href: '/territorio/alertas',
      done: false,
      icon: <BellRing size={16} />,
    },
    {
      step: '4',
      title: 'Oráculo Fenológico',
      desc: 'Sincroniza tus manejos con la floración nativa de Ulmo, Tiaca, Notro y Tepú.',
      href: '/fenologia',
      done: false,
      icon: <Sprout size={16} />,
    },
  ];

  return (
    <section
      aria-label="Bienvenida al Registro Territorial Apícola"
      className="card relative overflow-hidden p-5 sm:p-6 border border-primary/20 bg-gradient-to-b from-surface-raised via-card to-background rounded-2xl shadow-sm space-y-5"
    >
      {/* Luz ambiental sutil */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl"
        aria-hidden
      />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-primary/10 text-primary border border-primary/20">
              <Sparkles size={13} />
              Guía de Inicio Territorial
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-normal text-foreground tracking-tight">
            {completo ? 'Pilares de la Red Territorial' : 'Primeros pasos en la Red Territorial'}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl text-pretty">
            {completo
              ? 'Accede a los 4 ejes comunitarios para resguardar la abeja, monitorear floraciones y coordinar con el archipiélago.'
              : 'Plataforma comunitaria para resguardar la abeja, declarar tus apiarios y coordinar alertas preventivas en Chiloé.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors shrink-0"
          title="Ocultar bienvenida"
          aria-label="Ocultar bienvenida"
        >
          <X size={18} />
        </button>
      </div>

      {showFullGuide ? (
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {pilares.map((p) => (
              <Link
                key={p.step}
                href={p.href}
                className="group flex flex-col justify-between p-3.5 rounded-xl border border-border/80 bg-surface-raised/60 hover:bg-surface-raised hover:border-primary/40 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-mono font-medium">
                      {p.step}
                    </span>
                    <span className="text-muted-foreground/60 group-hover:text-primary transition-colors">
                      {p.done ? <CheckCircle2 size={16} className="text-success" /> : p.icon}
                    </span>
                  </div>
                  <div className="font-medium text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors">
                    {p.title}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] font-medium text-primary uppercase tracking-wider">
                  <span>{p.done ? 'Completado' : 'Configurar'}</span>
                  <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
            <div className="text-xs text-muted-foreground">
              {completo ? (
                <span className="text-success inline-flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  Censo inicial completado con éxito
                </span>
              ) : (
                <span>Primer paso recomendado: completar los datos básicos de tu censo territorial.</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFullGuide(false)}
                className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md transition-colors"
              >
                Minimizar pilares
              </button>
              <Link
                href={ctaHref}
                className="btn btn-primary btn-sm inline-flex items-center gap-1 text-xs"
              >
                {completo ? 'Ver mi ficha territorial' : 'Comenzar censo ahora'}
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
          <button
            type="button"
            onClick={() => setShowFullGuide(true)}
            className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
          >
            <ChevronDown size={14} />
            Ver los 4 pilares de la Red Territorial
          </button>
          <Link
            href={ctaHref}
            className="text-foreground hover:text-primary transition-colors font-medium inline-flex items-center gap-1"
          >
            Ir a mi censo <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </section>
  );
}
