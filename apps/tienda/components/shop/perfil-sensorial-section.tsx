'use client';

interface PerfilSensorialProps {
  productName: string;
}

export function PerfilSensorialSection({ productName }: PerfilSensorialProps) {
  // Dimensiones canónicas de cata sensorial
  const PERFIL_METRICS = [
    { label: 'Intensidad en Paladar', izq: 'Suave & Floral', der: 'Robusto & Boscoso', score: 78 },
    { label: 'Perfil Dulzor / Acidez', izq: 'Dulzor Cálido', der: 'Acidez Silvestre', score: 62 },
    { label: 'Textura & Cristalización', izq: 'Líquida / Ámbar', der: 'Cremosa / Untable', score: 85 },
  ];

  const NOTAS_POPULARES = [
    'Flor de Ulmo', 'Corteza de Tiaca', 'Avellana Tostada', 'Notas Balsámicas', 'Caramelo Crudo'
  ];

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
        Promedio de percepciones sensoriales levantadas en vivo mediante el ritual de cata digital en cafeterías y hoteles aliados para <strong className="text-foreground">{productName}</strong>.
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
          Notas de Sabor Más Percibidas
        </p>
        <div className="flex flex-wrap gap-2">
          {NOTAS_POPULARES.map((nota) => (
            <span
              key={nota}
              className="px-3 py-1 rounded-full border border-border/80 bg-background text-xs text-foreground font-medium"
            >
              {nota}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
