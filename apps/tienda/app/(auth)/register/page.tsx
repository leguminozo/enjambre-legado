import { RegisterForm } from '@/components/auth/register-form';
import { isCmsPreviewRequest } from '@/lib/cms';
import { loadStoreChrome } from '@/lib/shop/load-store-chrome';

export const metadata = {
  title: 'Registro · La Obrera y el Zángano',
};

export default async function RegisterPage() {
  const chrome = await loadStoreChrome({ draft: await isCmsPreviewRequest() });
  return <RegisterForm auth={chrome.auth} />;
}