import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Iniciar sesión · Enjambre Legado',
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="tienda-auth-page flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
