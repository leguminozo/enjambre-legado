'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export function AuthNavTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams?.toString() ?? '';
  const search = qs ? `?${qs}` : '';

  const isRegister = pathname?.includes('/register');
  const isLogin = !isRegister;

  return (
    <nav
      className="mt-8 inline-flex items-center gap-1 rounded-full border border-border/60 bg-surface-raised/70 backdrop-blur-md p-1"
      aria-label="Acceso"
    >
      <Link
        href={`/login${search}`}
        className={`inline-flex min-h-10 items-center px-5 rounded-full text-[0.7rem] uppercase tracking-[0.2em] transition-all ${
          isLogin
            ? 'bg-background text-foreground shadow-sm font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Iniciar sesión
      </Link>
      <Link
        href={`/register${search}`}
        className={`inline-flex min-h-10 items-center px-5 rounded-full text-[0.7rem] uppercase tracking-[0.2em] transition-all ${
          isRegister
            ? 'bg-background text-foreground shadow-sm font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Crear cuenta
      </Link>
    </nav>
  );
}
