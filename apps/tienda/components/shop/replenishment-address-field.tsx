'use client';

import Link from 'next/link';
import { MapPin, ExternalLink, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ClienteDireccion } from '@/lib/shop/direcciones-schema';

type ReplenishmentAddressFieldProps = {
  value: string;
  onChange: (value: string) => void;
  direcciones?: ClienteDireccion[];
  className?: string;
};

export function ReplenishmentAddressField({
  value,
  onChange,
  direcciones = [],
  className,
}: ReplenishmentAddressFieldProps) {
  const t = useTranslations('perfil.reposicion');

  const formatDireccion = (d: ClienteDireccion) => {
    return [d.direccion, d.comuna, d.ciudad, d.region].filter(Boolean).join(', ');
  };

  const handleSelectDireccion = (d: ClienteDireccion) => {
    onChange(formatDireccion(d));
  };

  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="tienda-replenishment-section-label">
          <span className="inline-flex items-center gap-2">
            <MapPin size={14} className="text-accent" />
            {t('destination')}
          </span>
        </h4>
        <Link
          href="/perfil/billetera"
          className="text-xs text-accent-text hover:underline inline-flex items-center gap-1 font-medium"
        >
          <span>Libreta en Billetera</span>
          <ExternalLink size={12} />
        </Link>
      </div>

      {direcciones.length > 0 && (
        <div className="mb-3 space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
            Seleccionar desde tus direcciones guardadas:
          </span>
          <div className="grid sm:grid-cols-2 gap-2">
            {direcciones.map((d) => {
              const formatted = formatDireccion(d);
              const isSelected =
                value.trim().length > 0 &&
                value.trim().toLowerCase().includes(d.direccion.trim().toLowerCase());

              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleSelectDireccion(d)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'border-accent bg-accent/10 text-foreground ring-1 ring-accent/30'
                      : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-border/80'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground truncate">
                        {d.etiqueta || 'Dirección'}
                      </span>
                      {d.es_predeterminada && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent/20 text-accent-text font-bold uppercase">
                          Predeterminada
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{formatted}</p>
                  </div>
                  {isSelected && <Check size={14} className="text-accent shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={t('addressPlaceholder')}
        className="mt-1 w-full min-h-11 rounded-xl border border-border bg-background px-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30"
      />
    </section>
  );
}