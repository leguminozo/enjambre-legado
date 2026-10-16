'use client';

import React from 'react';
import { ViewShell } from '@/components/layout/ViewShell';
import { AudiovisualIdentityWorkspace } from '@/components/marketing/AudiovisualIdentityWorkspace';

export function EstudioAudiovisualView() {
  return (
    <div className="space-y-6">
      <ViewShell
        title="Video de Identidad & Sustrato Biológico"
        subtitle="Generador audiovisual procedural multiformato (9:16, 4:5, 1:1, 16:9) sobre la física y reología del bosque de Chiloé"
      />

      <AudiovisualIdentityWorkspace />
    </div>
  );
}
