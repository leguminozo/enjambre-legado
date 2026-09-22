import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/Providers";
import { VercelInsights } from "@/components/VercelInsights";
import { ThemeInitScript, LegacyBrowserPolyfills, LegacyDeviceDetect, ErrorRevealHarness, NavigationProgressBar, RegisterServiceWorker } from "@enjambre/ui";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans-body",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

/** Debe coincidir con Providers → ThemeProvider */
const NUCLEO_THEME_KEY = "enjambre-nucleo-theme";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.registroapicolachiloe.me';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Registro Apícola de Chiloé",
    template: "%s · Registro Apícola de Chiloé",
  },
  description: "Censo territorial y defensa de zonas de pecoreo en el archipiélago de Chiloé",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", type: "image/png" },
      { url: "/icons/icon-192.svg", type: "image/svg+xml" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "Registro Apícola de Chiloé",
    description: "Censo territorial y defensa de zonas de pecoreo en el archipiélago de Chiloé",
    siteName: "Registro Apícola de Chiloé",
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Registro Apícola de Chiloé",
    description: "Censo territorial y defensa de zonas de pecoreo en el archipiélago de Chiloé",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Registro Apícola",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Permitir zoom (accesibilidad); no bloquear maximumScale en admin
  viewportFit: "cover",
  themeColor: "#0A3D2F",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <head>
        {/* Antes de los chunks de Next (async): polyfills Safari/iOS 15 + tier legacy (data-legacy) + harness de diagnóstico.
            El harness solo en dev/preview: en producción molesta al operador (basura visual). */}
        <LegacyBrowserPolyfills />
        <LegacyDeviceDetect />
        {process.env.VERCEL_ENV !== 'production' && <ErrorRevealHarness />}
      </head>
      <body
        className={`${sans.className} bg-background text-foreground antialiased`}
        suppressHydrationWarning
      >
        {/* Antes de React: alinea class light/dark y evita #418 */}
        <RegisterServiceWorker />
        <ThemeInitScript
          storageKey={NUCLEO_THEME_KEY}
          defaultTheme="dark"
          enableSystem
        />
        <NavigationProgressBar />
        <Providers>
          {children}
        </Providers>
        <VercelInsights />
      </body>
    </html>
  );
}
