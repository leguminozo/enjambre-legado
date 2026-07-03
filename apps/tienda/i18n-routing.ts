import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // v1 producción: solo ES hasta migrar rutas bajo [locale]/
  locales: ['es'],
  defaultLocale: 'es',
  localePrefix: 'as-needed',
  pathnames: {
    '/': '/',
    '/catalogo': {
      es: '/catalogo',
      en: '/catalog'
    },
    '/nosotros': {
      es: '/nosotros',
      en: '/about'
    },
    '/ciencia': {
      es: '/ciencia',
      en: '/science'
    },
    '/experiencias': {
      es: '/experiencias',
      en: '/experiences'
    },
    '/galeria': {
      es: '/galeria',
      en: '/gallery'
    },
    '/contacto': {
      es: '/contacto',
      en: '/contact'
    },
    '/terminos': {
      es: '/terminos',
      en: '/terms'
    },
    '/privacidad': {
      es: '/privacidad',
      en: '/privacy'
    },
    '/cookies': {
      es: '/cookies',
      en: '/cookies'
    },
    '/login': {
      es: '/login',
      en: '/login'
    },
    '/register': {
      es: '/register',
      en: '/register'
    },
    '/checkout': {
      es: '/checkout',
      en: '/checkout'
    },
    '/carrito': {
      es: '/carrito',
      en: '/cart'
    },
    '/perfil': {
      es: '/perfil',
      en: '/profile'
    },
    '/producto': {
      es: '/producto',
      en: '/product'
    },
    '/origen': {
      es: '/origen',
      en: '/origin'
    },
    '/garantia': {
      es: '/garantia',
      en: '/guarantee'
    },
    '/reembolso': {
      es: '/reembolso',
      en: '/refund'
    },
    '/cancelacion': {
      es: '/cancelacion',
      en: '/cancellation'
    },
    '/reclamar': {
      es: '/reclamar',
      en: '/claim'
    },
    '/envio': {
      es: '/envio',
      en: '/shipping'
    }
  }
});

export type Locale = (typeof routing.locales)[number];
export type Pathnames = keyof typeof routing.pathnames;