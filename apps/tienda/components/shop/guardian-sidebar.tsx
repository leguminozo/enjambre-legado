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
  user: unknown;
  isOpen: boolean;
  onClose: () => void;
}

export function GuardianSidebar({ user, isOpen, onClose }: GuardianSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const userData = user as Record<string, unknown> | null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[70] w-72
        bg-card border-r border-border
        transform transition-transform duration-500 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-border flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-display font-bold text-lg">
                E
              </div>
              <div className="flex flex-col">
                <span className="text-foreground font-display text-sm tracking-tight leading-none">Enjambre</span>
                <span className="text-accent text-[0.5rem] uppercase tracking-[0.3em] font-bold mt-1">Legado</span>
              </div>
            </Link>
            <button className="lg:hidden text-muted-foreground" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            <p className="px-4 text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground mb-6 font-bold">Identidad Guardiana</p>
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
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}
                  `}
                >
                  <Icon size={18} className={active ? 'text-accent' : 'text-muted-foreground group-hover:text-accent transition-colors'} />
                  <span className="text-[0.7rem] uppercase tracking-[0.2em] font-medium">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border bg-secondary/30">
            <div className="flex items-center gap-4 p-4 bg-background/40 rounded-2xl border border-border">
              <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/20 flex items-center justify-center shrink-0">
                <User size={16} className="text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[0.7rem] font-bold text-foreground truncate tracking-wide">
                  {(userData?.full_name as string) || 'Guardián'}
                </p>
                <p className="text-[0.6rem] uppercase tracking-widest text-accent font-semibold mt-0.5">
                  Protector del Bosque
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                title="Desvincular Legado"
              >
                <LogOut size={16} />
              </button>
            </div>

            <div className="mt-6 px-4 pb-2 text-center">
              <p className="text-[0.5rem] uppercase tracking-[0.3em] text-muted-foreground">Vanguardia Activa · v1.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
