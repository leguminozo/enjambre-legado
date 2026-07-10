'use client';

import Link from 'next/link';
import { Send } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { resolveLocalized, type FooterSocialItem } from '@/lib/shop/store-chrome';

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
  const { footer, footerSocial, brand } = useStoreChrome();
  const logoSrc = brand.logo_footer_url || brand.logo_url || '/icons/icon-192.svg';

  return (
    <footer className="bg-background border-t border-border pt-24 pb-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center text-center mb-20">
          <Link href="/" className="group mb-12">
            <div className="flex flex-col items-center gap-3">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
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
                  className="text-[0.7rem] uppercase text-accent -mt-1 font-light"
                  style={{ letterSpacing: `${footer.brand_tracking_em + 0.1}em` }}
                >
                  {footer.brand_line2}
                </span>
              </div>
            </div>
          </Link>

          {footer.show_social && footerSocial.length > 0 ? (
            <div className="flex gap-6 mb-12 flex-wrap justify-center">
              {footerSocial.map((social) => (
                <Link
                  key={social.label + social.href}
                  href={social.href}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent transition-all"
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
            <p className="text-sm font-display italic text-accent mb-4 text-center">
              {resolveLocalized(footer.newsletter_title, footer.newsletter_title_en, locale)}
            </p>
            <p className="text-sm text-muted-foreground mb-8 text-center leading-relaxed">
              {resolveLocalized(footer.newsletter_desc, footer.newsletter_desc_en, locale)}
            </p>
            <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                placeholder={resolveLocalized(
                  footer.newsletter_placeholder,
                  footer.newsletter_placeholder_en,
                  locale,
                )}
                className="w-full bg-transparent border border-border rounded-lg py-4 px-6 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent transition-colors text-sm"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground py-4 px-8 rounded-full text-[0.7rem] uppercase tracking-[0.3em] font-medium transition-all flex items-center justify-center gap-3 self-center"
              >
                Enviar información <Send size={14} />
              </button>
            </form>
          </div>
        ) : null}

        {footer.show_legal ? (
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 pt-8 text-[0.65rem] tracking-[0.1em] text-muted-foreground border-t border-border">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-accent transition-colors"
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
