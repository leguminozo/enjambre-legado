import { Suspense } from 'react';
import { ViewLoading } from '@enjambre/ui';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Iniciar sesión · Enjambre Legado',
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="tienda-auth-page flex items-center justify-center">
          <ViewLoading variant="inline" hideLabel />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
