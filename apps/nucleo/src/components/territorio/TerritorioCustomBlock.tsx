import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  Info,
  ShieldAlert,
  Quote,
  Play,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import type { TerritorioSectionConfig, TerritorioCustomBlockData } from '@/lib/territorio-cms';

export interface TerritorioCustomBlockProps {
  block: TerritorioSectionConfig;
}

export function TerritorioCustomBlock({ block }: TerritorioCustomBlockProps) {
  const data: TerritorioCustomBlockData = block.customData || {
    tipo: 'texto',
    titulo: 'Bloque Territorial',
    cuerpo: 'Contenido editorial en configuración.',
  };

  const sectionId = block.id;

  switch (data.tipo) {
    case 'alerta': {
      const nivel = data.alerta_nivel || 'info';
      const borderClass =
        nivel === 'urgente'
          ? 'border-destructive/40 bg-destructive/10 text-destructive'
          : nivel === 'alerta'
            ? 'border-accent/40 bg-accent/10 text-accent-text'
            : 'border-primary/40 bg-primary/10 text-primary';

      const icon =
        nivel === 'urgente' ? (
          <ShieldAlert className="w-5 h-5 shrink-0" />
        ) : nivel === 'alerta' ? (
          <AlertTriangle className="w-5 h-5 shrink-0" />
        ) : (
          <Info className="w-5 h-5 shrink-0" />
        );

      return (
        <section
          id={sectionId}
          data-cms-section={sectionId}
          className="px-6 sm:px-10 lg:px-16 xl:px-24 py-8 sm:py-12 border-b border-border/60"
        >
          <div className="max-w-4xl mx-auto">
            <div className={`section-reveal rounded-xl border p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${borderClass}`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {icon}
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                    {data.badge || 'Aviso Territorial'}
                  </span>
                </div>
                <h3 className="font-existencial text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                  {data.titulo}
                </h3>
                {data.subtitulo && (
                  <p className="text-sm font-medium text-foreground/90">
                    {data.subtitulo}
                  </p>
                )}
                {data.cuerpo && (
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                    {data.cuerpo}
                  </p>
                )}
              </div>
              {data.cta_label && data.cta_href && (
                <Link
                  href={data.cta_href}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-95 transition-opacity shadow-sm shrink-0 active:scale-[0.99]"
                >
                  <span>{data.cta_label}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </section>
      );
    }

    case 'testimonio': {
      return (
        <section
          id={sectionId}
          data-cms-section={sectionId}
          className="bg-surface-sunken px-6 sm:px-10 lg:px-16 xl:px-24 py-16 sm:py-24 border-b border-border/60"
        >
          <div className="max-w-4xl mx-auto">
            <div className="section-reveal rounded-2xl border border-border/70 bg-card/60 p-8 sm:p-12 relative overflow-hidden shadow-lg">
              <Quote className="w-12 h-12 text-primary/20 absolute -top-2 -left-2 rotate-180 pointer-events-none" />
              {data.badge && (
                <span className="block text-xs font-mono tracking-widest text-primary uppercase mb-4">
                  {data.badge}
                </span>
              )}
              <blockquote className="relative z-10">
                <p className="font-serif italic text-lg sm:text-2xl text-foreground/90 leading-relaxed text-pretty mb-6">
                  &ldquo;{data.cuerpo || data.titulo}&rdquo;
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-border/60">
                  {data.autor_foto_url ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-border shrink-0 relative">
                      <Image
                        src={data.autor_foto_url}
                        alt={data.autor_nombre || 'Apicultor territorial'}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono font-bold text-sm shrink-0">
                      {(data.autor_nombre || 'A').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <cite className="not-italic font-existencial text-base font-semibold text-foreground block">
                      {data.autor_nombre || 'Apicultor de Chiloé'}
                    </cite>
                    <p className="text-xs text-muted-foreground">
                      {[data.autor_comuna, data.autor_detalle].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              </blockquote>
            </div>
          </div>
        </section>
      );
    }

    case 'cta': {
      return (
        <section
          id={sectionId}
          data-cms-section={sectionId}
          className="px-6 sm:px-10 lg:px-16 xl:px-24 py-16 sm:py-24 border-b border-border/60 bg-gradient-to-b from-background to-surface-sunken"
        >
          <div className="max-w-4xl mx-auto text-center">
            {data.badge && (
              <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase mb-3">
                {data.badge}
              </span>
            )}
            <h2 className="section-reveal font-existencial text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground text-balance mb-5">
              {data.titulo}
            </h2>
            {data.subtitulo && (
              <p className="section-reveal text-lg font-medium text-foreground/90 max-w-2xl mx-auto mb-3">
                {data.subtitulo}
              </p>
            )}
            {data.cuerpo && (
              <p className="section-reveal text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
                {data.cuerpo}
              </p>
            )}
            {data.cta_label && data.cta_href && (
              <div className="section-reveal flex justify-center">
                <Link
                  href={data.cta_href}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground hover:opacity-95 transition-all shadow-md active:scale-[0.99]"
                >
                  <span>{data.cta_label}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      );
    }

    case 'video': {
      return (
        <section
          id={sectionId}
          data-cms-section={sectionId}
          className="px-6 sm:px-10 lg:px-16 xl:px-24 py-16 sm:py-24 border-b border-border/60 bg-surface-sunken"
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              {data.badge && (
                <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase mb-2">
                  {data.badge}
                </span>
              )}
              <h2 className="section-reveal font-existencial text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
                {data.titulo}
              </h2>
              {data.cuerpo && (
                <p className="section-reveal text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                  {data.cuerpo}
                </p>
              )}
            </div>

            <div className="section-reveal aspect-video rounded-xl overflow-hidden border border-border/80 bg-background/80 relative shadow-xl">
              {data.video_url ? (
                <iframe
                  src={data.video_url}
                  title={data.titulo}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                    <Play className="w-7 h-7 ml-1" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Registro Audiovisual del Territorio</p>
                  <p className="text-xs text-muted-foreground mt-1">Configura la URL del video en el editor de contenido</p>
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    case 'metricas': {
      const items = [
        { valor: data.metrica_1_valor, etiqueta: data.metrica_1_etiqueta },
        { valor: data.metrica_2_valor, etiqueta: data.metrica_2_etiqueta },
        { valor: data.metrica_3_valor, etiqueta: data.metrica_3_etiqueta },
      ].filter((m) => m.valor && m.etiqueta);

      return (
        <section
          id={sectionId}
          data-cms-section={sectionId}
          className="px-6 sm:px-10 lg:px-16 xl:px-24 py-16 sm:py-20 border-b border-border/60 bg-surface-raised/40"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              {data.badge && (
                <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase mb-2">
                  {data.badge}
                </span>
              )}
              <h2 className="section-reveal font-existencial text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                {data.titulo}
              </h2>
              {data.cuerpo && (
                <p className="section-reveal text-muted-foreground text-sm sm:text-base mt-2">
                  {data.cuerpo}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="section-reveal rounded-xl border border-border/70 bg-card/60 p-6 text-center space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="font-mono text-3xl sm:text-4xl font-bold text-foreground">
                      {it.valor}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    {it.etiqueta}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case 'texto':
    default: {
      return (
        <section
          id={sectionId}
          data-cms-section={sectionId}
          className="px-6 sm:px-10 lg:px-16 xl:px-24 py-16 sm:py-24 border-b border-border/60"
        >
          <div className="max-w-3xl mx-auto">
            {data.badge && (
              <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase mb-3">
                {data.badge}
              </span>
            )}
            <h2 className="section-reveal font-existencial text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground mb-4">
              {data.titulo}
            </h2>
            {data.subtitulo && (
              <p className="section-reveal text-base sm:text-lg font-medium text-foreground/90 mb-6">
                {data.subtitulo}
              </p>
            )}
            {data.cuerpo && (
              <div className="section-reveal space-y-4 text-muted-foreground text-base leading-relaxed">
                {data.cuerpo.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }
  }
}
