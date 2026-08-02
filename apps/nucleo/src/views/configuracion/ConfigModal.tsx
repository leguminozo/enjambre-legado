'use client';

import { ImmersiveModal } from '@enjambre/ui';
import { ConfiguracionHub } from './ConfiguracionHub';

interface ConfigModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Configuración como overlay central con opacidad sobre el fondo:
 * ImmersiveModal (xl) con el hub unificado de categorías de perfil + sistema.
 */
export function ConfigModal({ open, onClose }: ConfigModalProps) {
  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      eyebrow="Configuración"
      title="Centro de Configuración"
      size="xl"
      bodyClassName="bg-surface-sunken/30"
    >
      <ConfiguracionHub />
    </ImmersiveModal>
  );
}
