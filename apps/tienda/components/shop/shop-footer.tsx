'use client';

import Link from 'next/link';
import { Instagram, Facebook, Youtube, Twitter, Send } from 'lucide-react';

const DEFAULT_NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/catalogo', label: 'Creaciones' },
  { href: '/experiencias', label: 'Experiencias' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/galeria', label: 'Galería' },
  { href: '/contacto', label: 'Contacto' },
];

const DEFAULT_LEGAL = [
  { href: '/privacidad', label: 'Política de privacidad' },
  { href: '/terminos', label: 'Términos del servicio' },
  { href: '/cancelacion', label: 'Política de cancelación' },
  { href: '/envio', label: 'Política de envío' },
  { href: '/reembolso', label: 'Política de reembolso' },
];

const SOCIAL_LINKS = [
  { href: '#', icon: Facebook, label: 'Facebook' },
  { href: 'https://instagram.com/laobrerayelzangano', icon: Instagram, label: 'Instagram' },
  { 
    href: '#', 
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    ), 
    label: 'TikTok' 
  },
  { href: '#', icon: Twitter, label: 'X' },
  { href: '#', icon: Youtube, label: 'YouTube' },
];

type ShopFooterProps = {
  data?: {
    branding?: { tagline: string; email: string };
    nav?: Array<{ label: string; href: string }>;
    legal?: Array<{ label: string; href: string }>;
  };
};

export function ShopFooter({ data }: ShopFooterProps = {}) {
  const branding = data?.branding || { tagline: '¡Seamos Legado! Luce saludable. Sé parte del cambio.', email: 'hola@obrerayzangano.com' };
  const nav = data?.nav && data.nav.length > 0 ? data.nav : DEFAULT_NAV;
  const legal = data?.legal && data.legal.length > 0 ? data.legal : DEFAULT_LEGAL;

  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-24 pb-12">
      <div className="mx-auto max-w-7xl px-6">
        {/* TOP: Branding & Navigation */}
        <div className="flex flex-col items-center text-center mb-20">
          <Link href="/" className="group mb-12">
            <div className="flex flex-col items-center">
              <span className="font-display text-2xl tracking-[0.4em] uppercase text-[#f5f0e8] group-hover:text-[#c9a227] transition-colors">
                La Obrera
              </span>
              <span className="text-[0.7rem] tracking-[0.5em] uppercase text-[#c9a227] -mt-1 font-light">
                y el Zángano
              </span>
            </div>
          </Link>

          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-16">
            {nav.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[0.65rem] uppercase tracking-[0.3em] text-[#8a8279] hover:text-[#c9a227] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <h3 className="font-display italic text-2xl md:text-3xl text-[#f5f0e8] max-w-2xl leading-relaxed mb-4">
            "{branding.tagline}"
          </h3>
        </div>

        {/* MIDDLE: Social & Newsletter */}
        <div className="grid lg:grid-cols-2 gap-20 items-start border-y border-white/5 py-20 mb-12">
          {/* Social Section */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <p className="text-sm text-[#8a8279] mb-8 max-w-xs leading-relaxed">
              Síguenos desde tu entorno digital favorito. Accederás solo a lo esencial. ¡Sé parte de la experiencia completa!
            </p>
            <div className="flex gap-6">
              {SOCIAL_LINKS.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-[#8a8279] hover:text-[#c9a227] hover:border-[#c9a227] transition-all"
                  aria-label={social.label}
                >
                  <social.icon />
                </Link>
              ))}
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="flex flex-col">
            <p className="text-sm font-display italic text-[#c9a227] mb-2">Únete al Club Legado del Bosque:</p>
            <p className="text-sm text-[#8a8279] mb-8 leading-relaxed">
              Suscríbete para no perderte novedades, consejos del néctar y regalos únicos que endulzarán tu existencia.
            </p>
            <form className="relative max-w-md group" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <label htmlFor="email-footer" className="text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] mb-2 block">
                    Tu correo electrónico
                  </label>
                  <input
                    id="email-footer"
                    type="email"
                    placeholder="Ingresa tu e-mail y únete al Legado del Bosque"
                    className="w-full bg-transparent border-b border-white/10 py-4 pr-12 text-[#f5f0e8] placeholder:text-[#8a8279]/50 focus:outline-none focus:border-[#c9a227] transition-colors text-sm"
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-[#0a3d2f] hover:bg-[#126b52] text-white py-4 px-8 rounded-full text-[0.7rem] uppercase tracking-[0.3em] font-medium transition-all flex items-center justify-center gap-3 self-center lg:self-start mt-4"
                >
                  Enviar información <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* BOTTOM: Legal & Copyright */}
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between pt-8 text-[0.65rem] tracking-[0.1em] text-[#8a8279]">
          <p className="order-2 md:order-1">© {new Date().getFullYear()} La Obrera y el Zángano. Todos los derechos reservados.</p>
          
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 order-1 md:order-2">
            {legal.map((link) => (
              <Link 
                key={link.label} 
                href={link.href}
                className="hover:text-[#c9a227] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
