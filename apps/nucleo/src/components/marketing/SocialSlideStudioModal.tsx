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
      title="Estudio Editorial RRSS"
      eyebrow="FORMATO 4:5 (1080×1350 PX)"
      size="full"
    >
      <SlideStudioWorkspace />
    </ImmersiveModal>
  );
}
