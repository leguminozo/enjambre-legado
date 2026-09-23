'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { resolveLocalized, type FooterSocialItem, alignToClass } from '@/lib/shop/store-chrome';
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
      { href: '/contacto', label: 'Contacto & Ubicación' },
    ],
  },
  {
    title: 'Alianzas & Negocios',
    links: [
      { href: '/alianzas/cafeterias', label: 'Cafeterías de Especialidad' },
      { href: '/alianzas/hoteles', label: 'Hoteles & Amenities' },
      { href: '/alianzas/tiendas-gourmet', label: 'Tiendas Gourmet' },
      { href: '/alianzas/ferias', label: 'Ferias & Eventos' },
      { href: '/alianzas/revendedores', label: 'Programa Revendedores' },
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
  const { footer, footerSocial, brand, contact } = useStoreChrome();
  const logoSrc = (brand.logo_footer_url || brand.logo_url || '').trim();
  const logoFooterHeightMobile =
    brand.logo_footer_height_mobile_px ||
    Math.min(brand.logo_footer_height_desktop_px || brand.logo_footer_height_px, 36);
  const logoFooterHeightDesktop =
    brand.logo_footer_height_desktop_px || brand.logo_footer_height_px;

  const brandLine1 = brand.brand_name?.trim() || footer.brand_line1?.trim() || 'La Obrera';
  const brandLine2 = brand.brand_tagline?.trim() || footer.brand_line2?.trim() || 'y el Zángano';
  const hasCustomFooterTagline = Boolean(!brand.brand_tagline?.trim() && footer.brand_line2?.trim());
  const showFooterTaglineMobile = hasCustomFooterTagline || brand.brand_tagline_show_mobile !== false;
  const showFooterTaglineDesktop = hasCustomFooterTagline || brand.brand_tagline_show_desktop !== false;

  const cleanPhone = contact?.whatsapp_e164?.replace(/\D/g, '');
  const resolveSocialHref = (social: FooterSocialItem) => {
    if (social.network === 'whatsapp' && cleanPhone) {
      return `https://wa.me/${cleanPhone}`;
    }
    return social.href;
  };

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

  // "Únete al Enjambre": patrón de claim seguro — enlace directo sin
  // contraseña; Supabase crea la cuenta si no existe y el perfil nace con rol
  // cliente (handle_new_user). Al entrar, /perfil/enjambre acredita el bonus.
  async function handleJoinEnjambre(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value || joinState === 'sending') return;

    setJoinState('sending');
    setJoinError(null);

    const redirectUrl = new URL('/auth/callback', window.location.origin);
    redirectUrl.searchParams.set('next', '/perfil/enjambre?origen=footer_club');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: {
        emailRedirectTo: redirectUrl.toString(),
        data: {
          origen_registro: 'footer_club_legado',
        },
      },
    });

    if (error) {
      setJoinState('error');
      setJoinError(friendlySupabaseError(error));
      return;
    }

    setJoinState('sent');
  }

  return (
    <footer className="tienda-shop-footer bg-background pt-16 sm:pt-20 md:pt-24 pb-[max(3rem,calc(var(--safe-bottom)+1rem))]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Distribución arquitectónica de espacios (Grid de hasta 12 columnas) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 lg:gap-12">
          {/* Columna 1: Marca, Manifiesto y Redes */}
          <div
            className={`flex flex-col items-center text-center md:items-start md:text-left ${
              footer.show_newsletter
                ? 'md:col-span-5 lg:col-span-4'
                : 'md:col-span-5 lg:col-span-5'
            }`}
          >
            <Link href="/" className="group inline-flex flex-col items-center md:items-start gap-3 mb-4">
              <div
                className={
                  footer.logo_layout === 'inline'
                    ? 'flex flex-row items-center justify-center md:justify-start gap-3'
                    : 'flex flex-col items-center md:items-start justify-center gap-2'
                }
              >
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt=""
                    style={
                      {
                        '--footer-logo-h-mobile': `${logoFooterHeightMobile}px`,
                        '--footer-logo-h-desktop': `${logoFooterHeightDesktop}px`,
                        maxWidth: brand.logo_max_width_px > 0 ? `${brand.logo_max_width_px}px` : '220px',
                        width: 'auto',
                      } as React.CSSProperties
                    }
                    className="h-[var(--footer-logo-h-mobile)] md:h-[var(--footer-logo-h-desktop)] object-contain"
                  />
                ) : null}
                <div className="flex flex-col items-center md:items-start">
                  <span
                    className="font-display text-2xl uppercase text-foreground group-hover:text-accent transition-colors"
                    style={{ letterSpacing: `${footer.brand_tracking_em}em` }}
                  >
                    {brandLine1}
                  </span>
                  {(showFooterTaglineMobile || showFooterTaglineDesktop) && brandLine2 ? (
                    <span
                      className={`text-[0.7rem] uppercase text-accent-text -mt-0.5 font-light ${
                        !showFooterTaglineMobile
                          ? 'hidden md:inline-block'
                          : !showFooterTaglineDesktop
                            ? 'inline-block md:hidden'
                            : 'inline-block'
                      }`}
                      style={{ letterSpacing: `${footer.brand_tracking_em + 0.1}em` }}
                    >
                      {brandLine2}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>

            <p
              className={`text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mb-6 whitespace-pre-line ${alignToClass(
                footer.text_align,
              )}`}
            >
              {resolveLocalized(footer.intro, footer.intro_en, locale)}
            </p>

            {footer.show_social && footerSocial.length > 0 ? (
              <div className="flex gap-2.5 sm:gap-3 flex-wrap justify-center md:justify-start mb-6">
                {footerSocial.map((social) => (
                  <Link
                    key={social.label + social.href}
                    href={resolveSocialHref(social)}
                    className="min-h-10 min-w-10 h-10 w-10 rounded-full border border-border/70 bg-surface-raised/20 flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent hover:bg-surface-raised/40 transition-all"
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SocialIcon network={social.network} />
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="inline-flex items-center gap-2 text-[0.7rem] tracking-[0.08em] text-muted-foreground/80">
              <span className="w-1.5 h-1.5 rounded-full bg-accent/80 animate-pulse" aria-hidden="true" />
              <span>Pureo, Queilen · Archipiélago de Chiloé</span>
            </div>
          </div>

          {/* Columnas 2 y 3: Navegación Ecosistema y Alianzas */}
          <div
            className={`grid grid-cols-2 gap-6 sm:gap-8 ${
              footer.show_newsletter
                ? 'md:col-span-7 lg:col-span-5'
                : 'md:col-span-7 lg:col-span-7'
            }`}
          >
            {navColumns.map((col) => (
              <div key={col.title} className="flex flex-col">
                <span className="text-[0.68rem] uppercase tracking-[0.25em] text-accent-text font-medium mb-4 sm:mb-5">
                  {col.title}
                </span>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-flex min-h-[30px] items-center text-xs sm:text-[0.82rem] text-muted-foreground hover:text-foreground transition-colors leading-snug"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Columna 4: Membresía & Club (Newsletter) */}
          {footer.show_newsletter ? (
            <div className="md:col-span-12 lg:col-span-3">
              <div className="rounded-2xl border border-border/60 bg-surface-raised/30 p-5 sm:p-6 flex flex-col justify-between h-full">
                <div>
                  <span className="text-[0.62rem] uppercase tracking-[0.25em] text-accent-text font-medium block mb-1.5">
                    Membresía & Origen
                  </span>
                  <h4 className="font-display italic text-lg sm:text-xl text-foreground font-normal mb-2 leading-snug">
                    {resolveLocalized(footer.newsletter_title, footer.newsletter_title_en, locale) ||
                      'Únete al Enjambre'}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-5">
                    {resolveLocalized(footer.newsletter_desc, footer.newsletter_desc_en, locale) ||
                      'Deja tu correo y recibe tu vínculo al Enjambre: asignaciones de recolección, floraciones vivas y beneficios exclusivos.'}
                  </p>
                </div>

                {joinState === 'sent' ? (
                  <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-center">
                    <p className="text-xs text-accent-text leading-relaxed font-medium mb-2">
                      ¡Revisa tu correo! Te enviamos tu vínculo al Enjambre.
                    </p>
                    <Link
                      href="/perfil/enjambre"
                      className="inline-flex min-h-[36px] items-center text-[0.68rem] uppercase tracking-[0.25em] text-accent-text hover:text-foreground transition-colors font-medium"
                    >
                      Ver beneficios del Enjambre &rarr;
                    </Link>
                  </div>
                ) : (
                  <form className="flex flex-col gap-2.5" onSubmit={handleJoinEnjambre}>
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
                      className="w-full min-h-[42px] bg-background/80 border border-border rounded-xl py-2 px-3.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={joinState === 'sending'}
                      className="w-full min-h-[42px] bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-xl text-[0.68rem] uppercase tracking-[0.25em] font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {joinState === 'sending' ? 'Enviando…' : 'Unirme al Enjambre'} <Send size={12} />
                    </button>
                    {joinState === 'error' && joinError ? (
                      <p className="text-xs text-destructive text-center" role="alert">
                        {joinError}
                      </p>
                    ) : null}
                    <p className="text-[0.62rem] text-muted-foreground/60 text-center leading-relaxed">
                      Sin contraseñas · Vínculo seguro directo a tu correo
                    </p>
                  </form>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Separador único y limpio solicitado por el usuario antes del bloque legal */}
        <div className="border-t border-border mt-14 sm:mt-16 pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {footer.show_legal ? (
            <nav
              aria-label="Enlaces legales"
              className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-[0.68rem] tracking-[0.05em] text-muted-foreground"
            >
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="inline-flex min-h-[36px] items-center hover:text-accent transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : (
            <div />
          )}

          <p className="text-[0.68rem] tracking-[0.05em] text-muted-foreground/80 text-center md:text-right shrink-0">
            &copy; {new Date().getFullYear()} {brandLine1} {brandLine2}.{' '}
            {footer.copyright_suffix}
          </p>
        </div>
      </div>
    </footer>
  );
}
