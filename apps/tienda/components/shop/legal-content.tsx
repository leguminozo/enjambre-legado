'use client';

import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { GrainOverlay } from '@/components/shop/grain-overlay';

interface LegalContentProps {
  title: string;
  content: string;
  lastUpdated?: string;
}

export function LegalContent({ title, content, lastUpdated }: LegalContentProps) {
  return (
    <StoreShell>
      <GrainOverlay />
      <ShopHeader />
      
      <main className="py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <span className="text-[0.7rem] tracking-[0.4em] uppercase text-[#c9a227] mb-4 block">Legal</span>
          <h1 className="font-display text-4xl md:text-6xl font-light text-[#f5f0e8] mb-12">{title}</h1>
          
          {lastUpdated && (
            <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#8a8279] mb-12">
              Última actualización: {lastUpdated}
            </p>
          )}
          
          <div className="prose prose-invert prose-gold max-w-none">
            <div 
              className="text-[#8a8279] leading-relaxed space-y-6 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
