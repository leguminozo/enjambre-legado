'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import {
  isCampaignBannerActive,
  resolveLocalized,
  type CampaignPlacement,
} from '@/lib/shop/store-chrome';

function placementForPath(pathname: string): CampaignPlacement[] {
  const p = pathname.replace(/^\/(es|en)/, '') || '/';
  if (p === '/' || p === '') return ['home', 'global'];
  if (p.startsWith('/catalogo') || p.startsWith('/producto')) return ['catalog', 'global'];
  if (p.startsWith('/carrito') || p.startsWith('/checkout')) return ['cart', 'global'];
  return ['global'];
}

export function CampaignBanners() {
  const locale = useLocale();
  const pathname = usePathname() || '/';
  const { campaignBanners, announcement } = useStoreChrome();
  const allowed = placementForPath(pathname);
  const path = (pathname ?? '').replace(/^\/(es|en)/, '') || '/';
  const isHome = path === '/';

  const active = campaignBanners.filter((b) => {
    if (!isCampaignBannerActive(b) || !allowed.includes(b.placement)) return false;
    // En home la barra superior (TextCarousel) ya es el canal promo;
    // no apilar banners home/global encima y duplicar mensajes (p.ej. envío gratis).
    if (isHome && announcement.enabled && (b.placement === 'home' || b.placement === 'global')) {
      return false;
    }
    return true;
  });

  if (active.length === 0) return null;

  return (
    <div className="space-y-2 px-4 pt-3 sm:px-6">
      {active.map((banner, i) => (
        <div
          key={`${banner.title}-${i}`}
          className="mx-auto flex max-w-6xl flex-col gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="font-display text-base text-foreground sm:text-lg">
              {resolveLocalized(banner.title, banner.title_en, locale)}
            </p>
            {banner.body ? (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {resolveLocalized(banner.body, banner.body_en, locale)}
              </p>
            ) : null}
          </div>
          {banner.href ? (
            <Link
              href={banner.href}
              className="shrink-0 self-start rounded-full bg-accent px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-wider text-accent-foreground hover:opacity-90 sm:self-center"
            >
              {resolveLocalized(banner.cta_label, banner.cta_label_en, locale)}
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}
