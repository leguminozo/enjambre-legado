'use client';

/**
 * Template del perfil: Next lo remonta en cada navegación entre secciones,
 * dando la transición de entrada que el layout (estable) no puede animar.
 * Fade corto — el cambio de pestaña se siente inmediato, no "congelado".
 */
export default function PerfilTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-in fade-in duration-200">{children}</div>;
}