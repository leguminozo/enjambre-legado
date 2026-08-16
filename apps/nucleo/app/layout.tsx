import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/Providers";
import { VercelInsights } from "@/components/VercelInsights";
import { ThemeInitScript, LegacyBrowserPolyfills, LegacyDeviceDetect, ErrorRevealHarness, NavigationProgressBar } from "@enjambre/ui";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans-body",
  weight: ["300", "400", "500", "600", "700"],
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

export const metadata: Metadata = {
  title: "Enjambre Legado · Núcleo",
  description: "Plataforma central de apicultura regenerativa — Centro de mando unificado",
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Núcleo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Permitir zoom (accesibilidad); no bloquear maximumScale en admin
  viewportFit: "cover",
  themeColor: "#0A3D2F",
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
