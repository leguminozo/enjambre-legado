import { Suspense } from 'react';
import { AuthPageLoading } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Iniciar sesión · Enjambre Legado',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthPageLoading label="Inicio de sesión" />}>
      <LoginForm />
    </Suspense>
  );
}
