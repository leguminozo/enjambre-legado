'use client';

import React from 'react';
import { ImmersiveModal } from '@enjambre/ui';
import { type SlideData, type SlideBlock } from './slide-studio-core';
import { SlideStudioWorkspace } from './SlideStudioWorkspace';

export type { SlideData, SlideBlock };

export interface SocialSlideStudioModalProps {
  open: boolean;
  onClose: () => void;
}

export function SocialSlideStudioModal({ open, onClose }: SocialSlideStudioModalProps) {
  if (!open) return null;

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      title="Estudio Editorial & Kits de Entrega"
      eyebrow="MULTIFORMATO · FEED · STORIES · MESA"
      size="full"
    >
      <SlideStudioWorkspace />
    </ImmersiveModal>
  );
}
