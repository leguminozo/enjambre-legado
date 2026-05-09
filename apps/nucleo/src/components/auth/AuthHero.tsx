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
      { opacity: 1, duration: 1.5 }
    )
    .fromTo(titleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1 },
      '-=0.8'
    )
    .fromTo(textRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1 },
      '-=0.6'
    )
    .fromTo(buttonRef.current,
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.8 },
      '-=0.4'
    );
  }, []);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center text-center p-8 z-10 max-w-2xl"
    >
      <h1 
        ref={titleRef}
        className="text-5xl md:text-7xl font-existencial text-crema-natural mb-6 leading-tight italic"
        style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
      >
        El Bosque <br /> 
        <span className="text-oro-miel">te reconoce.</span>
      </h1>
      
      <p 
        ref={textRef}
        className="text-lg md:text-xl font-datos text-crema-natural/80 mb-10 leading-relaxed max-w-lg"
      >
        Bienvenido al núcleo digital de la regeneración biocultural. 
        Donde cada rastro cuenta, y cada abeja es un legado.
      </p>

      <button
        ref={buttonRef}
        onClick={onStart}
        className="btn btn-gold px-12 py-4 text-lg rounded-full group overflow-hidden relative"
      >
        <span className="relative z-10">Iniciar Sincronización</span>
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      </button>

      <div className="mt-12 flex gap-8 text-crema-natural/40 text-[0.65rem] tracking-[0.2em] uppercase font-datos">
        <span>Chiloé, Chile</span>
        <span>·</span>
        <span>Ecosistema Legado</span>
      </div>
    </div>
  );
}
