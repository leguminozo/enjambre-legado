'use client';

import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { GuardianSidebar } from '@/components/shop/guardian-sidebar';
import { BeeCanvas } from '@/components/shop/bee-canvas';

interface PerfilLayoutClientProps {
  children: React.ReactNode;
  user: any;
}

export function PerfilLayoutClient({ children, user }: PerfilLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex w-full min-h-screen overflow-hidden relative">
      <BeeCanvas />
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#050505] opacity-90 pointer-events-none z-0" />
      
      <GuardianSidebar 
        user={user} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-6 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#c9a227] rounded-lg flex items-center justify-center text-black font-display font-bold text-lg">
              E
            </div>
            <span className="text-[#f5f0e8] font-display text-sm tracking-tight">Mi Legado</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="text-[#8a8279] hover:text-[#c9a227] transition-colors"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-5xl mx-auto py-12 lg:py-20 px-6 lg:px-12 w-full animate-in">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}
