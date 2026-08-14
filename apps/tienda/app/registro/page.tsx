import { permanentRedirect } from 'next/navigation';

type PageProps = {
  searchParams: Promise<{ ref?: string }>;
};

export default async function RegistroRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ref = params.ref?.trim();
  const target = ref ? `/register?ref=${encodeURIComponent(ref)}` : '/register';
  // 308: alias legacy de /register — consolida señales SEO (evita que Google
  // trate /registro como página indexable separada)
  permanentRedirect(target);
}