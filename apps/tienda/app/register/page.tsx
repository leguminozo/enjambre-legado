import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata = {
  title: 'Registro · La Obrera y el Zángano',
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="tienda-auth-page flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
