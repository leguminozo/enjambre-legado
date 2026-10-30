'use client';

import React, { useState } from 'react';
import { ViewShell } from '@/components/layout/ViewShell';
import { AudiovisualIdentityWorkspace } from '@/components/marketing/AudiovisualIdentityWorkspace';
import { ColeccionVideosView } from '@/components/marketing/ColeccionVideosView';
import { type SavedVideoProject } from '@/components/marketing/saved-videos';

export function EstudioAudiovisualView() {
  const [viewMode, setViewMode] = useState<'coleccion' | 'editor'>('coleccion');
  const [selectedProject, setSelectedProject] = useState<SavedVideoProject | null>(null);

  const handleNuevoVideo = () => {
    setSelectedProject(null);
    setViewMode('editor');
  };

  const handleEditarVideo = (proyecto: SavedVideoProject) => {
    setSelectedProject(proyecto);
    setViewMode('editor');
  };

  const handleVolverColeccion = () => {
    setSelectedProject(null);
    setViewMode('coleccion');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {viewMode === 'coleccion' ? (
        <>
          <ViewShell
            title="Video de Identidad & Archivo Audiovisual"
            subtitle="Colección de piezas archivadas y generador procedural para difusión pública"
          />
          <ColeccionVideosView
            onNuevoVideo={handleNuevoVideo}
            onEditarVideo={handleEditarVideo}
          />
        </>
      ) : (
        <AudiovisualIdentityWorkspace
          initialProject={selectedProject}
          onVolver={handleVolverColeccion}
          onGuardadoExitoso={() => {
            // Se mantiene en el editor para seguir ajustando
          }}
        />
      )}
    </div>
  );
}
