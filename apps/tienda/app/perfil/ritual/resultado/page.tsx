import { redirect } from 'next/navigation';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RitualResultadoLegacyRedirect({ searchParams }: PageProps) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === 'string') qs.set(key, value);
    else if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
  }
  const query = qs.toString();
  redirect(`/perfil/reposicion/resultado${query ? `?${query}` : ''}`);
}