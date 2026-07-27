'use client';

import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { GrainOverlay } from '@/components/shop/grain-overlay';
import { useEffect, useState } from 'react';

interface LegalContentProps {
  title: string;
  content: string;
  lastUpdated?: string;
}

export function LegalContent({ title, content, lastUpdated }: LegalContentProps) {
  const [sanitized, setSanitized] = useState<string | null>(null);

  useEffect(() => {
    void import('dompurify').then((DOMPurify) => {
      setSanitized(DOMPurify.default.sanitize(content));
    });
  }, [content]);

  return (
    <StoreShell>
      <GrainOverlay />
      <ShopHeader />

      <main className="px-4 sm:px-6 pt-[max(7rem,calc(env(safe-area-inset-top)+5.5rem))] pb-16 md:py-32">
        <div className="max-w-3xl mx-auto">
          <span className="text-[0.7rem] tracking-[0.4em] uppercase text-accent mb-4 block">Legal</span>
          <h1 className="font-display text-[clamp(1.75rem,6vw,3.75rem)] md:text-6xl font-light text-foreground mb-8 md:mb-12 text-balance">
            {title}
          </h1>

          {lastUpdated && (
            <p className="text-[0.65rem] tracking-[0.2em] uppercase text-muted-foreground mb-8 md:mb-12">
              Última actualización: {lastUpdated}
            </p>
          )}

          <div className="prose prose-invert prose-gold max-w-none">
          <div
            className="text-muted-foreground leading-relaxed space-y-6 whitespace-pre-wrap text-pretty"
            dangerouslySetInnerHTML={{ __html: sanitized ?? '' }}
          />
          </div>
        </div>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
