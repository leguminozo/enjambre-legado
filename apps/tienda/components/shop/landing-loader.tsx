'use client';

import React, { useEffect, useState } from 'react';

export function LandingLoader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-[#050505] z-[9999] flex flex-col items-center justify-center transition-opacity duration-[1200ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${!isVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="font-display text-2xl font-light tracking-[0.3em] text-[#c9a227] overflow-hidden">
        La Obrera y el Zángano
      </div>
      <div className="w-[1px] h-[60px] mt-8 bg-gradient-to-b from-transparent via-[#c9a227] to-transparent animate-pulse" />
    </div>
  );
}
