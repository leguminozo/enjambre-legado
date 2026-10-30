'use client';

import React, { useState } from 'react';
import { ViewShell } from '@/components/layout/ViewShell';
import { SlideStudioWorkspace } from '@/components/marketing/SlideStudioWorkspace';
import { ColeccionEditorialView } from '@/components/marketing/ColeccionEditorialView';
import { type SlideData } from '@/components/marketing/slide-studio-core';

export function EstudioRrssView() {
  const [viewMode, setViewMode] = useState<'coleccion' | 'editor'>('coleccion');
  const [activeSlides, setActiveSlides] = useState<SlideData[] | undefined>(undefined);
  const [activeProjectName, setActiveProjectName] = useState<string>('');
  const [workspaceKey, setWorkspaceKey] = useState<number>(0);

  const handleCrearNueva = (slides: SlideData[], nombre: string) => {
    setActiveSlides(slides);
    setActiveProjectName(nombre);
    setWorkspaceKey((prev) => prev + 1);
    setViewMode('editor');
  };

  const handleEditarPieza = (slides: SlideData[], nombre: string) => {
    setActiveSlides(slides);
    setActiveProjectName(nombre);
    setWorkspaceKey((prev) => prev + 1);
    setViewMode('editor');
  };

  const handleVolverAColeccion = () => {
    setViewMode('coleccion');
  };

  return (
    <div className="space-y-6">
      {viewMode === 'coleccion' ? (
        <>
          <ViewShell
            title="Estudio Editorial & Kits de Entrega"
            subtitle="Colección soberana de carruseles, fichas de cata y kits impresos multiformato (4:5, 9:16, 1:1, 16:9)"
          />
          <ColeccionEditorialView
            onCrearNueva={handleCrearNueva}
            onEditarPieza={handleEditarPieza}
          />
        </>
      ) : (
        <SlideStudioWorkspace
          key={workspaceKey}
          initialSlides={activeSlides}
          initialProjectName={activeProjectName}
          onVolver={handleVolverAColeccion}
        />
      )}
    </div>
  );
}

