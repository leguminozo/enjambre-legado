'use client';

import React from 'react';
import { ImmersiveModal } from '@enjambre/ui';
import {
  type SlideLayoutType,
  type SlideData,
  type TitleScale,
  type GoldNugget,
} from './slide-studio-core';
import { SlideStudioWorkbench } from './SlideStudioWorkbench';

export type { SlideLayoutType, SlideData, TitleScale, GoldNugget };

export interface SocialSlideStudioModalProps {
  open: boolean;
  onClose: () => void;
}

export function SocialSlideStudioModal({ open, onClose }: SocialSlideStudioModalProps) {
  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      eyebrow="ESTUDIO EDITORIAL RRSS"
      title="La Obrera y el Zángano // Creador de Láminas 4:5"
      size="xl"
    >
      <div className="p-1 sm:p-3">
        <SlideStudioWorkbench isModal />
      </div>
    </ImmersiveModal>
  );
}
