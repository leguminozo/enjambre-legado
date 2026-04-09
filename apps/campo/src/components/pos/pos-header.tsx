'use client';

import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export function PosHeader() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }: { data: { user: { email?: string | null } | null } }) => {
      setEmail(data.user?.email ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
      <nav className="flex gap-4 text-sm font-medium text-[#0A3D2F]">
        <Link href="/pos/catalogo">Catálogo</Link>
        <Link href="/pos/carrito">Carrito</Link>
        <Link href="/">Inicio</Link>
      </nav>
      <div className="flex items-center gap-3 text-sm text-gray-600">
        {email ? <span className="truncate max-w-[200px]">{email}</span> : null}
        {email ? (
          <button
            type="button"
            onClick={() => void signOut()}
            className="text-gray-900 underline"
          >
            Salir
          </button>
        ) : (
          <Link href="/login" className="underline">
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
