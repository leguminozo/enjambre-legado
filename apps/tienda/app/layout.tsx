import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';
import type { Metadata, Viewport } from 'next';
import {
  organizationJsonLd,
  webSiteJsonLd,
  mergeJsonLd,
} from '@/lib/shop/json-ld';
import { JsonLd } from '@/components/ui/JsonLd';
import { VercelInsights } from '@/components/VercelInsights';
import { ConsentProvider } from '@/components/shop/consent/consent-provider';
import { ConsentBanner } from '@/components/shop/consent/consent-banner';
import { MetaPixelLoader } from '@/components/shop/meta-pixel';
import { GoogleAdsLoader } from '@/components/shop/google-ads';
import { LegacyBrowserPolyfills, LegacyDeviceDetect, ErrorRevealHarness, NavigationProgressBar } from '@enjambre/ui';
import { loadHeaderMenu } from '@/lib/shop/load-header-menu';
import { loadStoreChrome } from '@/lib/shop/load-store-chrome';
import { buildGoogleFontsHref, themeToCssVars, typographyToCssVars } from '@/lib/shop/store-chrome';
import { isCmsPreviewRequest } from '@/lib/cms';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A3D2F',
  interactiveWidget: 'resizes-content',
};

export async function generateMetadata(): Promise<Metadata> {
  const storeChrome = await loadStoreChrome({ draft: await isCmsPreviewRequest() });
  const { seo, brand } = storeChrome;
  const ogImage = seo.og_image_url || brand.og_image_url || undefined;
  const favicon = brand.favicon_url || '/icons/icon-192.svg';

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: seo.default_title,
      template: seo.title_template || '%s · La Obrera y el Zángano',
    },
    description: seo.default_description,
    manifest: '/manifest.webmanifest',
    icons: {
      icon: favicon,
      apple: '/icons/apple-touch-icon.png',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'La Obrera',
    },
    openGraph: {
      siteName: seo.site_name,
      title: seo.default_title,
      description: seo.default_description,
      url: SITE_URL,
      type: 'website',
      locale: 'es_CL',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.default_title,
      description: seo.default_description,
      site: seo.twitter_handle || undefined,
      images: ogImage ? [ogImage] : undefined,
    },
    // Sin hreflang: no existe ruta /en real; ambas URLs apuntaban a la misma
    // página, señal contradictoria que Google ignora. Si algún día hay versión
    // EN real, volver a `alternates.languages` con rutas distintas.
    alternates: {
      canonical: SITE_URL,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const isDraft = await isCmsPreviewRequest();
  const [headerMenu, storeChrome] = await Promise.all([
    loadHeaderMenu({ draft: isDraft }),
    loadStoreChrome({ draft: isDraft }),
  ]);
  // Align with ThemeProvider storageKey + defaults (evita React #418 class mismatch)
  const forceDark = storeChrome.theme.force_dark_public;
  const rawDefault = storeChrome.theme.default_theme ?? 'dark';
  const themeScript = `(function(){try{var isP=window.location.pathname.indexOf('/perfil')===0;var f=${JSON.stringify(forceDark ? 'dark' : null)};if(isP)f=null;var t=f||localStorage.getItem('enjambre-theme')||${JSON.stringify(rawDefault)};if(t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t!=='light'&&t!=='dark'){t='dark'}var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);r.style.colorScheme=t}catch(e){document.documentElement.classList.add('dark')}})()`;
  const rootJsonLd = mergeJsonLd([organizationJsonLd(), webSiteJsonLd()]);
  const favicon = storeChrome.brand.favicon_url || '/icons/icon-192.svg';
  const htmlClass = forceDark || storeChrome.theme.default_theme !== 'light' ? 'dark' : 'light';
  // Tipografía + acento CMS inyectados server-side: cero FOUT y cero flash de color
  const chromeVars = {
    ...typographyToCssVars(storeChrome.typography),
    ...themeToCssVars(storeChrome.theme),
  };
  const chromeStyle = `:root{${Object.entries(chromeVars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')}}`;

  return (
    <html lang={locale} className={htmlClass} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href={buildGoogleFontsHref(storeChrome.typography)}
        />
        <style dangerouslySetInnerHTML={{ __html: chromeStyle }} />
        <link rel="icon" href={favicon} />
        {/* Always inject — CSP allows unsafe-inline */}
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        {/* Compat Safari/iOS 15 + tier legacy (data-legacy/data-motion) + diagnóstico en pantalla (solo dev/preview, no en producción) */}
        <LegacyBrowserPolyfills />
        <LegacyDeviceDetect />
        {process.env.VERCEL_ENV !== 'production' && (
          <ErrorRevealHarness />
        )}
        <JsonLd data={rootJsonLd} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <NavigationProgressBar />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <RegisterServiceWorker />
          {/* Consentimiento envuelve a toda la app: banner + pixel + facade de tracking */}
          <ConsentProvider>
            <AppProviders
              headerSettings={headerMenu.settings}
              headerItems={headerMenu.items}
              storeChrome={storeChrome}
            >
              {children}
            </AppProviders>
            <ConsentBanner />
            <MetaPixelLoader />
            <GoogleAdsLoader />
          </ConsentProvider>
        </NextIntlClientProvider>
        <VercelInsights />
      </body>
    </html>
  );
}
