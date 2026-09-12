'use client';

import { UtensilsCrossed, Clock } from 'lucide-react';
import type { ShopProduct } from '@/lib/shop/products';

export interface PerfilSensorialSectionProps {
  productName: string;
  perfilSensorial?: ShopProduct['perfil_sensorial'];
}

export function PerfilSensorialSection({
  productName,
  perfilSensorial,
}: PerfilSensorialSectionProps) {
  // Dimensiones canónicas de cata sensorial
  const PERFIL_METRICS = [
    {
      label: 'Intensidad en Paladar',
      izq: perfilSensorial?.descriptores_intensidad?.izq ?? 'Suave & Floral',
      der: perfilSensorial?.descriptores_intensidad?.der ?? 'Robusto & Boscoso',
      score: perfilSensorial?.intensidad ?? 78,
    },
    {
      label: 'Perfil Dulzor / Acidez',
      izq: perfilSensorial?.descriptores_dulzor?.izq ?? 'Dulzor Cálido',
      der: perfilSensorial?.descriptores_dulzor?.der ?? 'Acidez Silvestre',
      score: perfilSensorial?.dulzor_acidez ?? 62,
    },
    {
      label: 'Textura & Cristalización',
      izq: perfilSensorial?.descriptores_textura?.izq ?? 'Líquida / Ámbar',
      der: perfilSensorial?.descriptores_textura?.der ?? 'Cremosa / Untable',
      score: perfilSensorial?.textura ?? 85,
    },
  ];

  const notasAromaticas =
    perfilSensorial?.notas_aromaticas && perfilSensorial.notas_aromaticas.length > 0
      ? perfilSensorial.notas_aromaticas
      : ['Flor de Ulmo', 'Corteza de Tiaca', 'Avellana Tostada', 'Notas Balsámicas', 'Caramelo Crudo'];

  const maridajes = perfilSensorial?.maridajes ?? [];

  return (
    <section className="rounded-3xl border border-border bg-card/40 p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/50">
        <div>
          <p className="text-editorial-xs uppercase tracking-[0.25em] text-primary font-medium">
            Trazabilidad Organoléptica
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground mt-1">
            Perfil Sensorial de Cata
          </h2>
        </div>
        <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
          Verificado en Puntos de Venta
        </span>
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
        Promedio de percepciones sensoriales y calibración canónica de cata de origen para{' '}
        <strong className="text-foreground">{productName}</strong>.
      </p>

      <div className="space-y-6 bg-surface-sunken/40 rounded-2xl p-5 border border-border/40">
        {PERFIL_METRICS.map((metric) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>{metric.izq}</span>
              <span className="text-foreground font-semibold">{metric.label}</span>
              <span>{metric.der}</span>
            </div>
            <div className="h-2 w-full bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${metric.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">
          Notas Organolépticas de Cata
        </p>
        <div className="flex flex-wrap gap-2">
          {notasAromaticas.map((nota) => (
            <span
              key={nota}
              className="px-3 py-1 rounded-full border border-border/80 bg-background text-xs text-foreground font-medium"
            >
              {nota}
            </span>
          ))}
        </div>
      </div>

      {maridajes.length > 0 && (
        <div className="pt-2 border-t border-border/40 space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
            <UtensilsCrossed size={14} className="text-primary" />
            <span>Maridajes Recomendados por el Sommelier</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {maridajes.map((m, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-surface-sunken/60 border border-border/40 space-y-0.5"
              >
                <p className="text-xs font-bold text-foreground">{m.titulo}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{m.detalle}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {perfilSensorial?.momento_consumo && (
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={14} className="text-primary shrink-0" />
          <span>
            <strong className="text-foreground">Momento sugerido:</strong> {perfilSensorial.momento_consumo}
          </span>
        </div>
      )}
    </section>
  );
}
