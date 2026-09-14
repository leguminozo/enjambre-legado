'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { resolveLocalized, type FooterSocialItem } from '@/lib/shop/store-chrome';
import { createClient } from '@/utils/supabase/client';
import { friendlySupabaseError } from '@enjambre/ui';

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function IconTikTok() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function SocialIcon({ network }: { network: FooterSocialItem['network'] }) {
  switch (network) {
    case 'whatsapp':
      return <IconWhatsApp />;
    case 'instagram':
      return <IconInstagram />;
    case 'facebook':
      return <IconFacebook />;
    case 'tiktok':
      return <IconTikTok />;
    case 'x':
      return <IconX />;
    case 'youtube':
      return <IconYouTube />;
    default:
      return <IconInstagram />;
  }
}

const NAV_COLUMNS = [
  {
    title: 'Ecosistema',
    links: [
      { href: '/club-legado-del-bosque', label: 'Club Legado del Bosque' },
      { href: '/experiencias', label: 'Experiencias & Talleres' },
      { href: '/origen', label: 'Origen & Floraciones' },
      { href: '/qr-scan', label: 'Escáner de Trazabilidad' },
    ],
  },
  {
    title: 'Alianzas & Negocios',
    links: [
      { href: '/para/cafeterias', label: 'Cafeterías de Especialidad' },
      { href: '/para/hoteles', label: 'Hoteles & Amenities' },
      { href: '/para/tiendas-gourmet', label: 'Tiendas Gourmet' },
      { href: '/para/ferias', label: 'Ferias & Eventos' },
      { href: '/para/revendedores', label: 'Programa Revendedores' },
    ],
  },
];

const LEGAL_LINKS = [
  { href: '/terminos', label: 'Términos del servicio' },
  { href: '/privacidad', label: 'Política de privacidad' },
  { href: '/cookies', label: 'Política de cookies' },
  { href: '/cancelacion', label: 'Política de cancelación' },
  { href: '/envio', label: 'Política de envío' },
  { href: '/reembolso', label: 'Política de reembolso' },
  { href: '/garantia', label: 'Política de garantía' },
];

export function ShopFooter() {
  const locale = useLocale();
  const { footer, footerSocial, brand } = useStoreChrome();
  const logoSrc = (brand.logo_footer_url || brand.logo_url || '').trim();
  const logoFooterHeight = brand.logo_footer_height_px || brand.logo_height_px || 48;

  const col1Title =
    resolveLocalized(footer.col1_title, footer.col1_title_en, locale) ||
    NAV_COLUMNS[0].title;
  const col2Title =
    resolveLocalized(footer.col2_title, footer.col2_title_en, locale) ||
    NAV_COLUMNS[1].title;

  const navColumns = [
    { title: col1Title, links: NAV_COLUMNS[0].links },
    { title: col2Title, links: NAV_COLUMNS[1].links },
  ];

  const [email, setEmail] = useState('');
  const [joinState, setJoinState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [joinError, setJoinError] = useState<string | null>(null);

  // "Únete al Enjambre": mismo patrón que el claim de QR — magic link sin
  // contraseña; Supabase crea la cuenta si no existe y el perfil nace con rol
  // cliente (handle_new_user). Al entrar, /perfil/enjambre acredita el bonus.
  async function handleJoinEnjambre(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value || joinState === 'sending') return;

    setJoinState('sending');
    setJoinError(null);

    const redirectUrl = new URL('/auth/callback', window.location.origin);
    redirectUrl.searchParams.set('next', '/perfil/enjambre');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: { emailRedirectTo: redirectUrl.toString() },
    });

    if (error) {
      setJoinError(friendlySupabaseError(error));
      setJoinState('error');
    } else {
      setJoinState('sent');
    }
  }

  return (
    <footer className="tienda-shop-footer bg-background border-t border-border pt-16 sm:pt-20 md:pt-24 pb-[max(3rem,calc(var(--safe-bottom)+1rem))]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-14 md:mb-20">
          <Link href="/" className="group mb-8 md:mb-12 inline-flex min-h-11 flex-col items-center">
            <div className="flex flex-col items-center gap-3">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt=""
                  style={{
                    height: `${logoFooterHeight}px`,
                    maxWidth: brand.logo_max_width_px > 0 ? `${brand.logo_max_width_px}px` : '220px',
                    width: 'auto',
                  }}
                  className="object-contain"
                />
              ) : null}
              <div className="flex flex-col items-center">
                <span
                  className="font-display text-2xl uppercase text-foreground group-hover:text-accent transition-colors"
                  style={{ letterSpacing: `${footer.brand_tracking_em}em` }}
                >
                  {footer.brand_line1}
                </span>
                <span
                  className="text-[0.7rem] uppercase text-accent-text -mt-1 font-light"
                  style={{ letterSpacing: `${footer.brand_tracking_em + 0.1}em` }}
                >
                  {footer.brand_line2}
                </span>
              </div>
            </div>
          </Link>

          {footer.show_social && footerSocial.length > 0 ? (
            <div className="flex gap-3 sm:gap-4 mb-12 flex-wrap justify-center">
              {footerSocial.map((social) => (
                <Link
                  key={social.label + social.href}
                  href={social.href}
                  className="min-h-11 min-w-11 h-11 w-11 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent transition-all"
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SocialIcon network={social.network} />
                </Link>
              ))}
            </div>
          ) : null}

          <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-12">
            {resolveLocalized(footer.intro, footer.intro_en, locale)}
          </p>
        </div>

        {footer.show_newsletter ? (
          <div className="max-w-md mx-auto mb-20">
            <p className="text-sm font-display italic text-accent-text mb-4 text-center">
              {resolveLocalized(footer.newsletter_title, footer.newsletter_title_en, locale) ||
                'Únete al Enjambre'}
            </p>
            <p className="text-sm text-muted-foreground mb-8 text-center leading-relaxed">
              {resolveLocalized(footer.newsletter_desc, footer.newsletter_desc_en, locale) ||
                'Deja tu correo y recibe tu vínculo al Enjambre: puntos de bienvenida, recolecciones exclusivas y los beneficios de la Red Biocultural. Sin compromisos.'}
            </p>
            {joinState === 'sent' ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm text-accent-text leading-relaxed">
                  ¡Revisa tu correo! Te enviamos tu vínculo al Enjambre.
                </p>
                <Link
                  href="/perfil/enjambre"
                  className="inline-flex min-h-11 items-center text-[0.7rem] uppercase tracking-[0.3em] text-accent-text hover:text-foreground transition-colors"
                >
                  Ver beneficios del Enjambre
                </Link>
              </div>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={handleJoinEnjambre}>
                <input
                  id="newsletter-email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    resolveLocalized(
                      footer.newsletter_placeholder,
                      footer.newsletter_placeholder_en,
                      locale,
                    ) || 'tu@correo.com'
                  }
                  className="w-full min-h-11 bg-transparent border border-border rounded-lg py-4 px-6 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors text-sm"
                />
                <button
                  type="submit"
                  disabled={joinState === 'sending'}
                  className="min-h-11 bg-primary hover:bg-primary/90 text-primary-foreground py-4 px-8 rounded-full text-[0.7rem] uppercase tracking-[0.3em] font-medium transition-all flex items-center justify-center gap-3 self-center disabled:opacity-60"
                >
                  {joinState === 'sending' ? 'Enviando…' : 'Unirme al Enjambre'} <Send size={14} />
                </button>
                {joinState === 'error' && joinError ? (
                  <p className="text-xs text-destructive text-center" role="alert">
                    {joinError}
                  </p>
                ) : null}
                <p className="text-[0.6rem] text-muted-foreground/70 text-center leading-relaxed">
                  Sin compromisos: el vínculo activa tus beneficios cuando quieras entrar.
                </p>
              </form>
            )}
          </div>
        ) : null}

        {/* Navegación estructurada horizontal y centrada */}
        <nav
          aria-label="Enlaces del pie de página"
          className="py-8 sm:py-10 border-t border-border flex flex-col items-center gap-4 sm:gap-5 text-center max-w-5xl mx-auto"
        >
          {navColumns.map((col) => (
            <div
              key={col.title}
              className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1.5 sm:gap-4"
            >
              <span className="text-[0.65rem] uppercase tracking-[0.25em] text-accent-text font-medium sm:shrink-0">
                {col.title}
              </span>
              <span className="hidden sm:inline text-border/60 text-xs select-none" aria-hidden="true">
                |
              </span>
              <ul className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-1">
                {col.links.map((link, idx) => (
                  <li key={link.href} className="inline-flex items-center gap-x-3 sm:gap-x-4">
                    <Link
                      href={link.href}
                      className="inline-flex min-h-[32px] sm:min-h-[36px] items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                    {idx < col.links.length - 1 && (
                      <span className="text-border/40 text-[0.65rem] select-none" aria-hidden="true">
                        ·
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>



        {footer.show_legal ? (
          <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-4 pt-6 text-[0.6rem] sm:text-[0.65rem] tracking-[0.08em] sm:tracking-[0.1em] text-muted-foreground border-t border-border">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="inline-flex min-h-[44px] items-center hover:text-accent transition-colors px-1"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}

        <p className="text-[0.65rem] tracking-[0.1em] text-muted-foreground text-center mt-8">
          &copy; {new Date().getFullYear()} {footer.brand_line1} {footer.brand_line2}.{' '}
          {footer.copyright_suffix}
        </p>
      </div>
    </footer>
  );
}
