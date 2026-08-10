'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ThemeToggle,
} from '@enjambre/ui';
import { useAuthStore } from '@enjambre/auth';
import { ConfigModal } from '@/views/configuracion/ConfigModal';

type ProfileMenuProps = {
  /** Trigger visual: botón de avatar o icono del rail */
  trigger: React.ReactNode;
  userName: string;
  userEmail?: string;
  userRole?: string;
  /** Dirección del menú (sidebar footer = top; rail = right) */
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  /** Tras cerrar sesión o abrir config (p. ej. cerrar drawer móvil) */
  onNavigate?: () => void;
  className?: string;
};

/**
 * Menú compacto de cuenta (inspirado en Trama):
 * clic en perfil → panel chico; Configuración abre el hub grande.
 */
export function ProfileMenu({
  trigger,
  userName,
  userEmail,
  userRole,
  side = 'top',
  align = 'start',
  onNavigate,
  className,
}: ProfileMenuProps) {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const [menuOpen, setMenuOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    onNavigate?.();
    await signOut();
    router.push('/login');
  };

  const openConfig = () => {
    setMenuOpen(false);
    onNavigate?.();
    // Pequeño delay para que el dropdown cierre sin pelear el focus trap
    window.setTimeout(() => setConfigOpen(true), 80);
  };

  return (
    <>
      <DropdownMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        side={side}
        align={align}
        sideOffset={10}
        className={className ?? 'w-56 p-1.5'}
        trigger={trigger}
      >
        <div className="px-3 py-2.5 border-b border-border/60 mb-1">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">
            {userName || 'Usuario'}
          </p>
          {(userEmail || userRole) && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5 leading-tight">
              {userEmail || userRole}
            </p>
          )}
        </div>

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            openConfig();
          }}
          className="gap-2.5 cursor-pointer"
        >
          <Settings size={16} className="text-muted-foreground shrink-0" />
          Configuración y perfil
        </DropdownMenuItem>

        <div
          className="flex items-center justify-between gap-2 px-3 py-2 min-h-11 rounded-md"
          onPointerDown={(e) => e.preventDefault()}
        >
          <span className="text-sm text-foreground">Tema</span>
          <ThemeToggle size={16} className="text-muted-foreground hover:text-accent" />
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          destructive
          onSelect={(e) => {
            e.preventDefault();
            void handleLogout();
          }}
          className="gap-2.5 cursor-pointer"
        >
          <LogOut size={16} className="shrink-0" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenu>

      <ConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
    </>
  );
}
