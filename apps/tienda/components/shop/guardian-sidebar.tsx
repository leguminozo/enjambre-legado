'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Shield, 
  Compass, 
  Calendar, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  X,
  User
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

const navLinks = [
  { href: '/perfil', label: 'El Legado', icon: Shield },
  { href: '/perfil/pasaporte', label: 'Pasaporte Colmena', icon: Compass },
  { href: '/perfil/reservas', label: 'Reserva Cosecha', icon: Calendar },
  { href: '/perfil/pedidos', label: 'Historial Ritual', icon: ShoppingBag },
  { href: '/perfil/ajustes', label: 'Ajustes Guardián', icon: Settings },
];

interface GuardianSidebarProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export function GuardianSidebar({ user, isOpen, onClose }: GuardianSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[70] w-72 
        bg-[#0a0a0a] border-r border-white/5
        transform transition-transform duration-500 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Brand/Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#c9a227] rounded-lg flex items-center justify-center text-black font-display font-bold text-lg">
                E
              </div>
              <div className="flex flex-col">
                <span className="text-[#f5f0e8] font-display text-sm tracking-tight leading-none">Enjambre</span>
                <span className="text-[#c9a227] text-[0.5rem] uppercase tracking-[0.3em] font-bold mt-1">Legado</span>
              </div>
            </Link>
            <button className="lg:hidden text-[#8a8279]" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            <p className="px-4 text-[0.6rem] uppercase tracking-[0.3em] text-[#4a4a4a] mb-6 font-bold">Identidad Guardiana</p>
            {navLinks.map((link) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group
                    ${active 
                      ? 'bg-[#c9a227]/10 text-[#c9a227]' 
                      : 'text-[#8a8279] hover:text-[#f5f0e8] hover:bg-white/5'}
                  `}
                >
                  <Icon size={18} className={active ? 'text-[#c9a227]' : 'text-[#4a4a4a] group-hover:text-[#c9a227] transition-colors'} />
                  <span className="text-[0.7rem] uppercase tracking-[0.2em] font-medium">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Card */}
          <div className="p-4 border-t border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-full bg-[#c9a227]/20 border border-[#c9a227]/20 flex items-center justify-center shrink-0">
                <User size={16} className="text-[#c9a227]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[0.7rem] font-bold text-[#f5f0e8] truncate tracking-wide">
                  {user?.full_name || 'Guardián'}
                </p>
                <p className="text-[0.6rem] uppercase tracking-widest text-[#c9a227] font-semibold mt-0.5">
                  Protector del Bosque
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-[#4a4a4a] hover:text-red-400 transition-colors"
                title="Desvincular Legado"
              >
                <LogOut size={16} />
              </button>
            </div>
            
            <div className="mt-6 px-4 pb-2 text-center">
              <p className="text-[0.5rem] uppercase tracking-[0.3em] text-[#333]">Vanguardia Activa · v1.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
