'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { resolveLocalized, type AuthSettings } from '@/lib/shop/store-chrome';
import { safeReturnPath } from '@/lib/auth/safe-return-path';

interface AuthBackButtonProps {
  auth: AuthSettings;
}

/**
 * Retorno inteligente: vuelve a la página previa (returnTo validado como
 * ruta interna) o a la tienda. Nunca atrapa al usuario.
 */
export function AuthBackButton({ auth }: AuthBackButtonProps) {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const target = safeReturnPath(searchParams.get('returnTo')) ?? '/';
  const label =
    resolveLocalized(auth.back_button_label, auth.back_button_label_en, locale) || 'Volver a la tienda';

  return (
    <Link
      href={target}
      className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-surface-raised/60 px-3.5 py-1.5 text-[0.7rem] font-medium tracking-wide text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground hover:border-border"
    >
      <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
