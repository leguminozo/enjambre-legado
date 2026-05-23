import type { Metadata, Viewport } from "next";
import "@/index.css";
import { Providers } from "@/providers/Providers";

export const metadata: Metadata = {
  title: "Enjambre Legado · Núcleo",
  description: "Plataforma central de apicultura regenerativa — Centro de mando unificado",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0A3D2F",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <Providers session={null}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
