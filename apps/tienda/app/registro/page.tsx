import { permanentRedirect } from 'next/navigation';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegistroRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sp = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (typeof val === 'string') {
      sp.set(key, val);
    } else if (Array.isArray(val)) {
      val.forEach((v) => sp.append(key, v));
    }
  }
  const qs = sp.toString();
  const target = qs ? `/register?${qs}` : '/register';
  // 308: alias legacy de /register — consolida señales SEO (evita que Google
  // trate /registro como página indexable separada)
  permanentRedirect(target);
}