import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata = {
  title: 'Registro · La Obrera y el Zángano',
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <RegisterForm />
    </Suspense>
  );
}
