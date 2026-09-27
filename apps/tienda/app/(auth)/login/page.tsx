import { LoginForm } from '@/components/auth/login-form';
import { isCmsPreviewRequest } from '@/lib/cms';
import { loadStoreChrome } from '@/lib/shop/load-store-chrome';

export const metadata = {
  title: 'Iniciar sesión · La Obrera y el Zángano',
};

export default async function LoginPage() {
  const chrome = await loadStoreChrome({ draft: await isCmsPreviewRequest() });
  return <LoginForm auth={chrome.auth} />;
}