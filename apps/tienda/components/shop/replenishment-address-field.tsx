'use client';

import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

type ReplenishmentAddressFieldProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function ReplenishmentAddressField({
  value,
  onChange,
  className,
}: ReplenishmentAddressFieldProps) {
  const t = useTranslations('perfil.reposicion');

  return (
    <section className={className}>
      <h4 className="tienda-replenishment-section-label">
        <span className="inline-flex items-center gap-2">
          <MapPin size={14} className="text-accent" />
          {t('destination')}
        </span>
      </h4>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={t('addressPlaceholder')}
        className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30"
      />
    </section>
  );
}