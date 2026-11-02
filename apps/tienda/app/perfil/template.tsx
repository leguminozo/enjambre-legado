'use client';

/**
 * Template del perfil: Next lo remonta en cada navegación entre secciones,
 * dando la transición de entrada que el layout (estable) no puede animar.
 * Fade corto y optimizado — el cambio de pestaña se siente inmediato y fluido.
 */
export default function PerfilTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in duration-200 motion-reduce:animate-none">
      {children}
    </div>
  );
}