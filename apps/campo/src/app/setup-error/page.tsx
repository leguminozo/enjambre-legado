import Link from 'next/link';

export const metadata = {
  title: 'Configuración · Campo',
};

export default function SetupErrorPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-lg rounded-2xl border border-border bg-surface-raised p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground mb-2">Sistema no configurado</h1>
        <p className="text-muted-foreground text-sm mb-6">
          El proyecto <strong>Campo</strong> requiere variables de configuración para funcionar.
          Sin ellas no hay datos ni sesión disponible.
        </p>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-2 mb-6">
          <li>
            <code className="bg-surface-sunken px-1 rounded">URL del servicio</code>
          </li>
          <li>
            <code className="bg-surface-sunken px-1 rounded">Clave pública</code>
          </li>
        </ul>
        <p className="text-sm text-muted-foreground mb-4">
          Tras guardar las variables en <strong>Configuración → Variables de entorno</strong>, vuelve a desplegar.
        </p>
        <Link href="/" className="text-sm font-medium text-primary underline">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
