'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import esMessages from '../messages/es.json';
import enMessages from '../messages/en.json';

type Locale = 'es' | 'en';

type Messages = typeof esMessages;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const messages: Record<Locale, Messages> = {
  es: esMessages,
  en: enMessages,
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('locale') as Locale;
      if (saved && (saved === 'es' || saved === 'en')) return saved;
      const browserLang = navigator.language.split('-')[0] as Locale;
      if (browserLang === 'es' || browserLang === 'en') return browserLang;
    }
    return 'es';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale);
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = messages[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
