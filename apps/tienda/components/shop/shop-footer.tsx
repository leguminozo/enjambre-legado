'use client';

import Link from 'next/link';
import { Send } from 'lucide-react';

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

const SOCIAL_LINKS = [
  { href: 'https://wa.me/56940831358', icon: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ), label: 'WhatsApp' },
  { href: 'https://instagram.com/obrera_y_zangano', icon: IconInstagram, label: 'Instagram' },
  { href: 'https://www.facebook.com/ObreraZangano/', icon: IconFacebook, label: 'Facebook' },
  { href: 'https://www.tiktok.com/@obrera_y_zangano', icon: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  ), label: 'TikTok' },
  { href: 'https://x.com/obrerayzangano', icon: IconX, label: 'X' },
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
return (
<footer className="bg-background border-t border-border pt-24 pb-12">
<div className="mx-auto max-w-7xl px-6">
<div className="flex flex-col items-center text-center mb-20">
<Link href="/" className="group mb-12">
<div className="flex flex-col items-center">
<span className="font-display text-2xl tracking-[0.4em] uppercase text-foreground group-hover:text-accent transition-colors">
La Obrera
</span>
<span className="text-[0.7rem] tracking-[0.5em] uppercase text-accent -mt-1 font-light">
y el Zángano
</span>
</div>
</Link>

<div className="flex gap-6 mb-12">
{SOCIAL_LINKS.map((social) => (
<Link
key={social.label}
href={social.href}
className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent transition-all"
aria-label={social.label}
>
<social.icon />
</Link>
))}
</div>

<p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-12">
Síguenos desde tu entorno digital favorito. Accederás solo a lo esencial. ¡Sé parte de la experiencia completa!
</p>
</div>

<div className="max-w-md mx-auto mb-20">
<p className="text-sm font-display italic text-accent mb-4 text-center">
Únete al Club Legado del Bosque:
</p>
<p className="text-sm text-muted-foreground mb-8 text-center leading-relaxed">
Suscríbete para no perderte novedades, consejos del néctar y regalos únicos que endulzarán tu existencia.
</p>
<form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
<input
type="email"
placeholder="Ingresa tu e-mail y únete al Legado del Bosque"
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

<p className="text-[0.65rem] tracking-[0.1em] text-muted-foreground text-center mt-8">
&copy; {new Date().getFullYear()} La Obrera y el Zángano. Todos los derechos reservados.
</p>
</div>
</footer>
);
}
