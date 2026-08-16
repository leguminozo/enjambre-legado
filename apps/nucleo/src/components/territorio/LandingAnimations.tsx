'use client';

import React, { useEffect, useRef } from 'react';
import { useLegacyDevice } from '@enjambre/ui';

interface LandingAnimationsProps {
  children: React.ReactNode;
}

/**
 * Orquestador de animaciones GSAP para la landing pública del territorio.
 * Implementa dynamic imports para no contaminar el SSR ni sobrecargar dispositivos legacy.
 * Degrada a render estático instantáneo con prefers-reduced-motion o dispositivos <= 2GB RAM.
 */
export function LandingAnimations({ children }: LandingAnimationsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { legacy, motionReduced } = useLegacyDevice();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const revealAll = () => {
      if (!container) return;
      container.querySelectorAll<HTMLElement>('.gsap-hidden').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      // Fallback para contadores si GSAP no corrió
      container.querySelectorAll<HTMLElement>('.counter-value').forEach((el) => {
        const target = parseInt(el.dataset.target || '0', 10);
        if (target > 0) {
          el.textContent = target.toLocaleString('es-CL');
        }
      });
    };

    // Dispositivos legacy o preferencia de movimiento reducido: visualización directa
    if (legacy || motionReduced) {
      revealAll();
      return;
    }

    let ctx: ReturnType<typeof import('gsap')['gsap']['context']> | undefined;
    let cancelled = false;
    const safety = window.setTimeout(revealAll, 3000);

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      .then(([gsapMod, scrollTriggerMod]) => {
        if (cancelled || !container) return;

        const gsap = gsapMod.gsap;
        const ScrollTrigger = scrollTriggerMod.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        ctx = gsap.context(() => {
          // 1. Hero timeline: Kicker, Título, Bajada, CTAs
          const heroTl = gsap.timeline({
            defaults: { ease: 'power3.out' },
            onComplete: () => {
              // Limpiar transforms para no afectar rendering de stacking contexts
              gsap.set('#hero .hero-anim-item', { clearProps: 'transform,opacity' });
            },
          });

          heroTl
            .fromTo(
              '#hero .hero-kicker',
              { opacity: 0, y: 16 },
              { opacity: 1, y: 0, duration: 0.8, delay: 0.1 }
            )
            .fromTo(
              '#hero .hero-title-line',
              { opacity: 0, y: 28 },
              { opacity: 1, y: 0, duration: 1, stagger: 0.12 },
              '-=0.6'
            )
            .fromTo(
              '#hero .hero-body',
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.8 },
              '-=0.7'
            )
            .fromTo(
              '#hero .hero-cta',
              { opacity: 0, y: 16 },
              { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 },
              '-=0.6'
            )
            .fromTo(
              '#hero .hero-map-panel',
              { opacity: 0, scale: 0.98, y: 24 },
              { opacity: 1, scale: 1, y: 0, duration: 1.1, ease: 'power2.out' },
              '-=0.9'
            );

          // 2. Counters animation
          const counterElements = container.querySelectorAll<HTMLElement>('.counter-value');
          if (counterElements.length > 0) {
            ScrollTrigger.create({
              trigger: '#hero',
              start: 'top 80%',
              once: true,
              onEnter: () => {
                counterElements.forEach((counter) => {
                  const targetStr = counter.getAttribute('data-target') ?? '0';
                  const target = parseFloat(targetStr);
                  if (isNaN(target) || target <= 0) return;

                  gsap.fromTo(
                    counter,
                    { innerHTML: 0 },
                    {
                      innerHTML: target,
                      duration: 1.8,
                      ease: 'power2.out',
                      snap: { innerHTML: 1 },
                      onUpdate: function () {
                        const val = Math.round(Number(this.targets()[0].innerHTML));
                        counter.innerHTML = val.toLocaleString('es-CL');
                      },
                    }
                  );
                });
              },
            });
          }

          // 3. ScrollTrigger para secciones generales
          const sectionIds = ['#privacy', '#why', '#how', '#origin', '#faq', '#close'];
          sectionIds.forEach((secId) => {
            const sectionEl = container.querySelector(secId);
            if (!sectionEl) return;

            gsap.fromTo(
              sectionEl.querySelectorAll('.section-reveal'),
              { opacity: 0, y: 32 },
              {
                scrollTrigger: {
                  trigger: sectionEl,
                  start: 'top 85%',
                  once: true,
                },
                opacity: 1,
                y: 0,
                duration: 0.9,
                stagger: 0.14,
                ease: 'power3.out',
                clearProps: 'transform,opacity',
              }
            );
          });

          // 4. Stagger especial para items de "Por qué" y "Cómo"
          const whyItems = container.querySelectorAll('.why-item');
          if (whyItems.length > 0) {
            gsap.fromTo(
              whyItems,
              { opacity: 0, y: 28 },
              {
                scrollTrigger: {
                  trigger: '#why',
                  start: 'top 80%',
                  once: true,
                },
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out',
                clearProps: 'transform,opacity',
              }
            );
          }

          const howSteps = container.querySelectorAll('.how-step');
          if (howSteps.length > 0) {
            gsap.fromTo(
              howSteps,
              { opacity: 0, y: 24 },
              {
                scrollTrigger: {
                  trigger: '#how',
                  start: 'top 80%',
                  once: true,
                },
                opacity: 1,
                y: 0,
                duration: 0.75,
                stagger: 0.12,
                ease: 'power3.out',
                clearProps: 'transform,opacity',
              }
            );
          }

          // Refresco de scroll triggers tras pintura inicial
          ScrollTrigger.refresh();
        }, container);
      })
      .catch(() => {
        revealAll();
      });

    return () => {
      cancelled = true;
      window.clearTimeout(safety);
      ctx?.revert();
    };
  }, [legacy, motionReduced]);

  return (
    <div ref={containerRef} className="w-full">
      {children}
    </div>
  );
}
