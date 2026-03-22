import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eureka! - Café de Especialidad en Castro, Chiloé",
  description: "Café de especialidad, Repostería de autor, Juice bar en el corazón de Castro, Chiloé. Descubre el sabor auténtico de Chiloé.",
  keywords: "café, chiloé, castro, repostería, juice bar, especialidad",
  authors: [{ name: "Eureka!" }],
  openGraph: {
    title: "Eureka! - Café de Especialidad",
    description: "Café de especialidad en el corazón de Castro, Chiloé",
    url: "https://eureka.cl",
    siteName: "Eureka!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
