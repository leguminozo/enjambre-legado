'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fade out anterior
      gsap.to('.page-content', {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          // Fade in nueva
          gsap.fromTo('.page-content',
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
          );
        },
      });
    });

    return () => ctx.revert();
  }, [pathname]);

  return <div className="page-content">{children}</div>;
}