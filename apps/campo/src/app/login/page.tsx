import Link from 'next/link';
import { LoginForm } from './login-form';

export const metadata = {
  title: 'Entrar · Campo',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Campo — vendedor</h1>
        <p className="text-sm text-gray-600 mb-6">Inicia sesión con tu cuenta Supabase (rol vendedor u otro permitido).</p>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/" className="underline text-[#0A3D2F]">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
