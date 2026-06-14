'use client';

import { useI18n } from '@/lib/i18n-context';
import { Languages } from 'lucide-react';

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-surface-sunken border border-border hover:border-accent/50 transition-colors"
      aria-label={`Cambiar idioma a ${locale === 'es' ? 'Inglés' : 'Español'}`}
    >
      <Languages size={14} />
      <span className="uppercase">{locale}</span>
    </button>
  );
}
