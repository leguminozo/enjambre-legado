import { Suspense } from 'react';
import { AuthPageLoading } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata = {
  title: 'Registro · La Obrera y el Zángano',
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthPageLoading label="Registro" />}>
      <RegisterForm />
    </Suspense>
  );
}
