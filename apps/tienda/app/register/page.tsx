import { Suspense } from 'react';
import { ViewLoading } from '@enjambre/ui';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata = {
  title: 'Registro · La Obrera y el Zángano',
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="tienda-auth-page flex items-center justify-center">
          <ViewLoading variant="inline" hideLabel />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
