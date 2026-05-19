import Link from 'next/link';

export const metadata = {
  title: 'Configuración · Campo',
};

export default function SetupErrorPage() {
  return (
    <main className="min-h-screen bg-amber-50 flex items-center justify-center px-6">
      <div className="max-w-lg rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Sistema no configurado</h1>
        <p className="text-gray-600 text-sm mb-6">
          El proyecto <strong>Campo</strong> requiere variables de configuración para funcionar.
          Sin ellas no hay datos ni sesión disponible.
        </p>
        <ul className="text-sm text-gray-700 list-disc pl-5 space-y-2 mb-6">
          <li>
            <code className="bg-gray-100 px-1 rounded">URL del servicio</code>
          </li>
          <li>
            <code className="bg-gray-100 px-1 rounded">Clave pública</code>
          </li>
        </ul>
        <p className="text-sm text-gray-600 mb-4">
          Tras guardar las variables en <strong>Configuración → Variables de entorno</strong>, vuelve a desplegar.
        </p>
        <Link href="/" className="text-sm font-medium text-bosque underline">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
