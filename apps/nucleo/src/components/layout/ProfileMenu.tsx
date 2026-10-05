'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, Crown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@enjambre/ui';
import { useAuthStore } from '@enjambre/auth';
import { ConfigModal } from '@/views/configuracion/ConfigModal';
import type { Section } from '@/views/configuracion/constants';

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
 * - Header con nombre de usuario y correo
 * - Actualizar plan (/mis-planes)
 * - Configuración (modal general con selector de tema integrado)
 * - Cerrar sesión
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
  const [initialSection, setInitialSection] = useState<Section | undefined>(undefined);

  const handleLogout = async () => {
    setMenuOpen(false);
    onNavigate?.();
    await signOut();
    window.location.href = '/login';
  };

  const handlePlanes = () => {
    setMenuOpen(false);
    onNavigate?.();
    router.push('/mis-planes');
  };

  const openConfig = (sec?: Section) => {
    setMenuOpen(false);
    setInitialSection(sec);
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
          {userEmail && (
            <p className="text-xs text-muted-foreground truncate mt-0.5 leading-tight">
              {userEmail}
            </p>
          )}
          {userRole && (
            <div className="mt-1.5 flex items-center">
              <span className="inline-flex items-center rounded-md bg-surface-raised px-2 py-0.5 text-[0.68rem] font-medium tracking-wide text-foreground/80 border border-border/60">
                {userRole === 'admin'
                  ? 'Administrador'
                  : userRole === 'territorial'
                  ? 'Territorio'
                  : userRole === 'apicultor'
                  ? 'Patio Apícola'
                  : userRole === 'operador'
                  ? 'Operador'
                  : userRole === 'colaborador'
                  ? 'Colaborador'
                  : userRole}
              </span>
            </div>
          )}
        </div>

        {(userRole === 'territorial' || userRole === 'apicultor') && (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              handlePlanes();
            }}
            className="gap-2.5 cursor-pointer"
          >
            <Crown size={16} className="text-muted-foreground shrink-0" />
            Actualizar plan
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            openConfig();
          }}
          className="gap-2.5 cursor-pointer"
        >
          <Settings size={16} className="text-muted-foreground shrink-0" />
          Configuración
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          destructive
          onSelect={(e) => {
            e.preventDefault();
            void handleLogout();
          }}
          className="gap-2.5 cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut size={16} className="shrink-0" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenu>

      <ConfigModal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        initialSection={initialSection}
      />
    </>
  );
}
