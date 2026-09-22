'use client';

import React from 'react';
import { EnjambreAuthProvider } from '@enjambre/auth';

export interface CampoAuthProviderProps {
  children: React.ReactNode;
}

export function CampoAuthProvider({ children }: CampoAuthProviderProps) {
  return (
    <EnjambreAuthProvider appSource="campo" enablePwaPersistence={true} enableLifecycleSync={true}>
      {children}
    </EnjambreAuthProvider>
  );
}
