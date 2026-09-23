'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { resolveLocalized, type FooterSocialItem, alignToClass } from '@/lib/shop/store-chrome';
import { createClient } from '@/utils/supabase/client';
import { friendlySupabaseError } from '@enjambre/ui';

import { useAuth } from '@/components/providers/auth-context';

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
  const { user, isAuthenticated } = useAuth();
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

  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
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

    // 1. Respaldo previo en CRM mediante endpoint interno para cero pérdida de leads
    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, hp: honeypot }),
      });
    } catch {
      // Fail-soft: no bloquear si el endpoint de CRM falla
    }

    // 2. Disparar signInWithOtp con enlace hacia /perfil/enjambre
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
    <footer
      data-cms-section="footer_settings"
      className="tienda-shop-footer bg-background pt-20 sm:pt-24 md:pt-32 pb-[max(3rem,calc(var(--safe-bottom)+1.5rem))]"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        {/* Marca & Logotipo */}
        <Link href="/" className="group inline-flex flex-col items-center gap-4 mb-6">
          <div
            className={
              footer.logo_layout === 'inline'
                ? 'flex flex-row items-center justify-center gap-3'
                : 'flex flex-col items-center justify-center gap-3'
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
                    maxWidth: brand.logo_max_width_px > 0 ? `${brand.logo_max_width_px}px` : '240px',
                    width: 'auto',
                  } as React.CSSProperties
                }
                className="h-[var(--footer-logo-h-mobile)] md:h-[var(--footer-logo-h-desktop)] object-contain"
              />
            ) : null}
            <div className="flex flex-col items-center text-center">
              <span
                className="font-display text-2xl uppercase text-foreground group-hover:text-accent transition-colors"
                style={{ letterSpacing: `${footer.brand_tracking_em}em` }}
              >
                {brandLine1}
              </span>
              {(showFooterTaglineMobile || showFooterTaglineDesktop) && brandLine2 ? (
                <span
                  className={`text-[0.7rem] uppercase text-accent-text -mt-1 font-light ${
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

        {/* Punto de origen territorial */}
        <div className="inline-flex items-center gap-2 text-[0.72rem] tracking-[0.1em] text-muted-foreground/80 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-accent/80 animate-pulse" aria-hidden="true" />
          <span>Pureo, Queilen · Archipiélago de Chiloé</span>
        </div>

        {/* Redes sociales */}
        {footer.show_social && footerSocial.length > 0 ? (
          <div className="flex gap-3 sm:gap-4 mb-10 flex-wrap justify-center">
            {footerSocial.map((social) => (
              <Link
                key={social.label + social.href}
                href={resolveSocialHref(social)}
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

        {/* Introducción / Manifiesto editorial */}
        <p
          className={`text-xs sm:text-sm text-muted-foreground max-w-lg leading-relaxed mb-16 sm:mb-20 whitespace-pre-line text-center ${alignToClass(
            footer.text_align,
          )}`}
        >
          {resolveLocalized(footer.intro, footer.intro_en, locale)}
        </p>

        {/* Bloque Club Legado / Newsletter */}
        {footer.show_newsletter ? (
          isAuthenticated && user ? (
            <div className="w-full max-w-md mx-auto mb-20 sm:mb-24 rounded-2xl border border-accent/30 bg-surface-raised/30 p-6 sm:p-7 text-center">
              <span className="text-[0.65rem] uppercase tracking-[0.25em] text-accent-text font-medium block mb-2">
                Membresía Activa
              </span>
              <h4 className="font-display text-lg sm:text-xl text-foreground font-normal mb-2 leading-snug">
                Hola, {user.name}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                Ya eres parte de la Comunidad del Enjambre. Tienes acceso preferente a asignaciones de recolección y puntos vigentes en tu pasaporte.
              </p>
              <Link
                href="/perfil/enjambre"
                className="inline-flex min-h-[42px] items-center justify-center px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-[0.68rem] uppercase tracking-[0.25em] font-medium transition-all"
              >
                Ver mi Pasaporte & Puntos &rarr;
              </Link>
            </div>
          ) : (
            <div className="w-full max-w-md mx-auto mb-20 sm:mb-24">
              <span className="text-[0.65rem] uppercase tracking-[0.25em] text-accent-text font-medium block mb-2 text-center">
                Membresía & Origen
              </span>
              {resolveLocalized(footer.newsletter_title, footer.newsletter_title_en, locale) ? (
                <p className="text-base sm:text-lg text-foreground mb-3 text-center font-medium">
                  {resolveLocalized(footer.newsletter_title, footer.newsletter_title_en, locale)}
                </p>
              ) : null}
              {resolveLocalized(footer.newsletter_desc, footer.newsletter_desc_en, locale) ? (
                <p
                  className={`text-xs sm:text-sm text-muted-foreground mb-8 text-center leading-relaxed whitespace-pre-line ${alignToClass(
                    footer.text_align,
                  )}`}
                >
                  {resolveLocalized(footer.newsletter_desc, footer.newsletter_desc_en, locale)}
                </p>
              ) : null}

              {joinState === 'sent' ? (
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-center">
                  <p className="text-xs text-accent-text leading-relaxed font-medium mb-2">
                    ¡Revisa tu correo! Te enviamos tu vínculo de bienvenida al Enjambre.
                  </p>
                  <Link
                    href="/perfil/enjambre"
                    className="inline-flex min-h-[36px] items-center text-[0.68rem] uppercase tracking-[0.25em] text-accent-text hover:text-foreground transition-colors font-medium"
                  >
                    Ver beneficios del Enjambre &rarr;
                  </Link>
                </div>
              ) : (
                <form className="flex flex-col gap-3.5 relative" onSubmit={handleJoinEnjambre}>
                  {/* Honeypot anti-bot oculto */}
                  <input
                    type="text"
                    name="hp_field"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    className="absolute opacity-0 pointer-events-none -z-10 h-0 w-0"
                    aria-hidden="true"
                  />

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
                      ) || 'tu@correo.com — Activar cuenta y puntos'
                    }
                    className="w-full min-h-[46px] bg-background border border-border rounded-xl py-3 px-4 text-base md:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors text-center"
                  />
                  <button
                    type="submit"
                    disabled={joinState === 'sending'}
                    className="w-full sm:w-auto min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-8 rounded-full text-[0.7rem] uppercase tracking-[0.25em] font-medium transition-all flex items-center justify-center gap-2.5 self-center disabled:opacity-60"
                  >
                    {joinState === 'sending' ? 'Enviando…' : 'Unirme al Enjambre'} <Send size={13} />
                  </button>
                  {joinState === 'error' && joinError ? (
                    <p className="text-xs text-destructive text-center" role="alert">
                      {joinError}
                    </p>
                  ) : null}
                  <p className="text-[0.65rem] text-muted-foreground/70 text-center leading-relaxed">
                    Sin contraseñas · Vínculo seguro directo a tu correo
                  </p>
                </form>
              )}
            </div>
          )
        ) : null}

        {/* Separador único y limpio antes del bloque legal */}
        <div className="w-full border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          {footer.show_legal ? (
            <nav
              aria-label="Enlaces legales"
              className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-[0.68rem] tracking-[0.05em] text-muted-foreground"
            >
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="inline-flex min-h-[36px] items-center hover:text-accent transition-colors px-1"
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
