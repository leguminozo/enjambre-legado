import Link from 'next/link';

export const metadata = {
  title: 'Configuración · Campo',
};

export default function SetupErrorPage() {
  return (
    <main className="min-h-screen bg-amber-50 flex items-center justify-center px-6">
      <div className="max-w-lg rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Supabase no configurado</h1>
        <p className="text-gray-600 text-sm mb-6">
          En Vercel, el proyecto <strong>Campo</strong> debe definir las variables públicas de Supabase.
          Si faltan, el sitio ya no falla con 500 en middleware, pero no hay datos ni sesión hasta
          configurarlas.
        </p>
        <ul className="text-sm text-gray-700 list-disc pl-5 space-y-2 mb-6">
          <li>
            <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code>
          </li>
          <li>
            <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY</code>{' '}
            o <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          </li>
        </ul>
        <p className="text-sm text-gray-600 mb-4">
          Tras guardarlas en <strong>Settings → Environment Variables</strong>, haz un redeploy.
        </p>
        <Link href="/" className="text-sm font-medium text-[#0A3D2F] underline">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
