'use client';

import React from 'react';
import { ImmersiveModal } from '@enjambre/ui';
import { AudiovisualIdentityWorkspace } from './AudiovisualIdentityWorkspace';
import { type SlideData } from './slide-studio-core';

export interface AudiovisualIdentityStudioModalProps {
  open: boolean;
  onClose: () => void;
  activeSlide?: SlideData;
}

export function AudiovisualIdentityStudioModal({
  open,
  onClose,
  activeSlide,
}: AudiovisualIdentityStudioModalProps) {
  if (!open) return null;

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      title="Generador Audiovisual de Identidad"
      eyebrow="SUSTRATO BIOLÓGICO · LIENZO VIVO · FINISTERRE 42°S"
      size="full"
    >
      <div className="p-4 sm:p-6 h-full">
        <AudiovisualIdentityWorkspace activeSlide={activeSlide} />
      </div>
    </ImmersiveModal>
  );
}
