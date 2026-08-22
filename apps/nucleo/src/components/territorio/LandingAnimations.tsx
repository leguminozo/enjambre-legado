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
              const animItems = container.querySelectorAll('.hero-anim-item');
              if (animItems.length > 0) {
                gsap.set(animItems, { clearProps: 'transform,opacity' });
              }
            },
          });

          const kickers = container.querySelectorAll('.hero-kicker');
          if (kickers.length > 0) {
            heroTl.fromTo(kickers, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.1 });
          }

          const titleLines = container.querySelectorAll('.hero-title-line');
          if (titleLines.length > 0) {
            heroTl.fromTo(titleLines, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, '-=0.6');
          }

          const bodies = container.querySelectorAll('.hero-body');
          if (bodies.length > 0) {
            heroTl.fromTo(bodies, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.7');
          }

          const ctas = container.querySelectorAll('.hero-cta');
          if (ctas.length > 0) {
            heroTl.fromTo(ctas, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, '-=0.6');
          }

          const mapPanels = container.querySelectorAll('.hero-map-panel');
          if (mapPanels.length > 0) {
            heroTl.fromTo(mapPanels, { opacity: 0, scale: 0.98, y: 24 }, { opacity: 1, scale: 1, y: 0, duration: 1.1, ease: 'power2.out' }, '-=0.9');
          }

          // 2. Counters animation
          const counterElements = container.querySelectorAll<HTMLElement>('.counter-value');
          if (counterElements.length > 0) {
            const heroEl = container.querySelector('#hero') || container;
            ScrollTrigger.create({
              trigger: heroEl,
              start: 'top 80%',
              once: true,
              onEnter: () => {
                counterElements.forEach((counter) => {
                  const targetStr = counter.getAttribute('data-target') ?? '0';
                  const target = parseFloat(targetStr);
                  if (isNaN(target) || target <= 0) return;

                  const proxy = { n: 0 };
                  gsap.to(proxy, {
                    n: target,
                    duration: 1.8,
                    ease: 'power2.out',
                    onUpdate: () => {
                      counter.textContent = Math.round(proxy.n).toLocaleString('es-CL');
                    },
                  });
                });
              },
            });
          }

          // 3. ScrollTrigger para secciones generales
          const sectionIds = ['#privacy', '#why', '#how', '#origin', '#institucional', '#faq', '#close'];
          sectionIds.forEach((secId) => {
            const sectionEl = container.querySelector(secId);
            if (!sectionEl) return;

            const reveals = sectionEl.querySelectorAll('.section-reveal');
            if (reveals.length > 0) {
              gsap.fromTo(
                reveals,
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
            }
          });

          // 4. Stagger especial para items de "Por qué" y "Cómo"
          const whyEl = container.querySelector('#why');
          const whyItems = container.querySelectorAll('.why-item');
          if (whyEl && whyItems.length > 0) {
            gsap.fromTo(
              whyItems,
              { opacity: 0, y: 28 },
              {
                scrollTrigger: {
                  trigger: whyEl,
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

          const howEl = container.querySelector('#how');
          const howSteps = container.querySelectorAll('.how-step');
          if (howEl && howSteps.length > 0) {
            gsap.fromTo(
              howSteps,
              { opacity: 0, y: 24 },
              {
                scrollTrigger: {
                  trigger: howEl,
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
