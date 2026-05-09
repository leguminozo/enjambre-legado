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
      className="flex flex-col items-center justify-center text-center p-8 z-10 max-w-2xl"
    >
      <h1 
        ref={titleRef}
        className="text-7xl font-existencial text-crema-natural mb-6 italic m-0"
        style={{ textShadow: '0 4px 30px rgba(0,0,0,0.6)', lineHeight: 1, fontSize: '4.5rem' }}
      >
        El Bosque <br /> 
        <span className="text-oro-miel">te reconoce.</span>
      </h1>
      
      <p 
        ref={textRef}
        className="text-xl font-datos text-crema-natural mb-10 max-w-lg m-0"
        style={{ opacity: 0.7, lineHeight: 1.6 }}
      >
        Bienvenido al núcleo digital de la regeneración biocultural. 
        Donde cada rastro cuenta, y cada abeja es un legado.
      </p>

      <button
        ref={buttonRef}
        onClick={onStart}
        className="btn btn-gold px-12 py-4 rounded-full"
        style={{ fontSize: '1.1rem', fontWeight: 700 }}
      >
        Iniciar Sincronización
      </button>
    </div>
  );
}
