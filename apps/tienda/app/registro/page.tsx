import { redirect } from 'next/navigation';

type PageProps = {
  searchParams: Promise<{ ref?: string }>;
};

export default async function RegistroRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ref = params.ref?.trim();
  const target = ref ? `/register?ref=${encodeURIComponent(ref)}` : '/register';
  redirect(target);
}