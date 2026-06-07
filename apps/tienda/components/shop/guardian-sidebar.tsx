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
  User,
  Repeat,
  Users,
  Gem,
  Bell
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import type { TiendaUserProfile } from '@/lib/shop/user-profile';

const navSections = [
  {
    title: 'Identidad Guardiana',
    links: [
      { href: '/perfil', label: 'El Legado', icon: Shield },
      { href: '/perfil/pasaporte', label: 'Pasaporte Colmena', icon: Compass },
    ],
  },
  {
    title: 'Comercio Ritual',
    links: [
      { href: '/perfil/ritual', label: 'Ritual Mensual', icon: Repeat },
      { href: '/perfil/reservas', label: 'Reserva Cosecha', icon: Calendar },
      { href: '/perfil/pedidos', label: 'Historial Ritual', icon: ShoppingBag },
    ],
  },
  {
    title: 'Red Biocultural',
    links: [
      { href: '/perfil/circular', label: 'Circular Colmena', icon: Users },
      { href: '/perfil/canje', label: 'Canje Impacto', icon: Gem },
      { href: '/perfil/alertas', label: 'Alertas Floración', icon: Bell },
    ],
  },
  {
    title: 'Ajustes',
    links: [
      { href: '/perfil/ajustes', label: 'Ajustes Guardián', icon: Settings },
    ],
  },
];

interface GuardianSidebarProps {
  user: TiendaUserProfile | null;
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
        <div className="p-4 lg:p-6 border-b border-border flex items-center justify-between shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-display font-bold text-sm">
              E
            </div>
            <div className="flex flex-col">
              <span className="text-foreground font-display text-xs tracking-tight leading-none">Enjambre</span>
              <span className="text-accent text-[0.45rem] uppercase tracking-[0.3em] font-bold mt-1">Legado</span>
            </div>
          </Link>
          <button className="lg:hidden text-muted-foreground" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-3 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 text-[0.5rem] uppercase tracking-[0.3em] text-muted-foreground mb-1.5 font-bold">{section.title}</p>
              <div className="space-y-0.5">
                {section.links.map((link) => {
                  const active = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group
                        ${active
                          ? 'bg-accent/10 text-accent'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}
                      `}
                    >
                      <Icon size={15} className={active ? 'text-accent' : 'text-muted-foreground group-hover:text-accent transition-colors shrink-0'} />
                      <span className="text-[0.65rem] uppercase tracking-[0.15em] font-medium">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border bg-secondary/30 shrink-0">
          <div className="flex items-center gap-3 p-3 bg-background/40 rounded-xl border border-border">
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/20 flex items-center justify-center shrink-0">
              <User size={14} className="text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[0.65rem] font-bold text-foreground truncate tracking-wide">
                {user?.full_name || 'Guardián'}
              </p>
              <p className="text-[0.5rem] uppercase tracking-widest text-accent font-semibold">
                Protector del Bosque
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
              title="Desvincular Legado"
            >
              <LogOut size={14} />
            </button>
          </div>

          <div className="mt-2 text-center">
            <p className="text-[0.45rem] uppercase tracking-[0.3em] text-muted-foreground">Vanguardia Activa · v1.0</p>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}
