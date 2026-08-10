'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { ImmersiveModal, ThemeToggle, Button } from '@enjambre/ui';
import { useAuthStore } from '@enjambre/auth';
import { ConfiguracionHub } from './ConfiguracionHub';

interface ConfigModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Configuración central: hub de perfil/sistema + cerrar sesión + tema.
 * Se abre desde el botón de perfil en sidebar / rail.
 */
export function ConfigModal({ open, onClose }: ConfigModalProps) {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);

  const handleLogout = async () => {
    onClose();
    await signOut();
    router.push('/login');
  };

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      eyebrow="Cuenta"
      title="Configuración"
      size="xl"
      bodyClassName="bg-surface-sunken/30"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Tema</span>
            <ThemeToggle size={18} className="text-muted-foreground hover:text-accent" />
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleLogout()}
              className="gap-2"
            >
              <LogOut size={16} />
              Cerrar sesión
            </Button>
          </div>
        </div>
      }
    >
      <ConfiguracionHub />
    </ImmersiveModal>
  );
}
