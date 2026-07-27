import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface AuthHeroProps {
  onStart: () => void;
}

export function AuthHero({ onStart }: AuthHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(containerRef.current, 
      { opacity: 0 }, 
      { opacity: 1, duration: 1 }
    )
    .fromTo(titleRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 },
      '-=0.5'
    )
    .fromTo(textRef.current,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 },
      '-=0.6'
    )
    .fromTo(buttonRef.current,
      { scale: 0.95, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6 },
      '-=0.6'
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center text-center px-6 py-10 sm:p-8 z-10 max-w-2xl pt-[max(2.5rem,env(safe-area-inset-top))]"
    >
      <h1
        ref={titleRef}
        className="font-existencial text-primary-foreground mb-6 italic m-0 text-balance text-[clamp(2.25rem,10vw,4.5rem)] leading-[1.05]"
        style={{ textShadow: '0 4px 30px hsl(var(--background) / 0.6)' }}
      >
        El Bosque <br />
        <span className="text-accent">te reconoce.</span>
      </h1>

      <p
        ref={textRef}
        className="text-base sm:text-xl font-datos text-primary-foreground mb-10 max-w-lg m-0 text-pretty leading-relaxed opacity-70"
      >
        Bienvenido al núcleo digital de la regeneración biocultural.
        Donde cada rastro cuenta, y cada abeja es un legado.
      </p>

      <button
        ref={buttonRef}
        type="button"
        onClick={onStart}
        className="btn btn-gold min-h-12 px-10 sm:px-12 py-4 rounded-full text-base font-bold"
      >
        Iniciar Sincronización
      </button>
    </div>
  );
}
