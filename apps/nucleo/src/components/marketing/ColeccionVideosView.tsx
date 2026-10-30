'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Film,
  Plus,
  Search,
  Clock,
  Play,
  Trash2,
  Copy,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  cn,
  Button,
  toast,
} from '@enjambre/ui';
import {
  type SavedVideoProject,
  type AspectRatioType,
  getSavedVideos,
  saveVideoProject,
  deleteVideoProject,
} from './saved-videos';
import { SUBSTRATE_PALETTES } from './identity-substrate-engine';

export interface ColeccionVideosViewProps {
  onNuevoVideo: () => void;
  onEditarVideo: (proyecto: SavedVideoProject) => void;
}

const MOTOR_LABELS: Record<string, string> = {
  reologia_miel: 'Reología del Néctar',
  enjambre_flujo: 'Enjambre & Pecoreo',
  geometria_panal: 'Geometría de Cera',
  lidar_fiordos: 'LiDAR de Fiordos',
  filigrana_origen: 'Filigrana de Origen',
};

export function ColeccionVideosView({
  onNuevoVideo,
  onEditarVideo,
}: ColeccionVideosViewProps) {
  const [videos, setVideos] = useState<SavedVideoProject[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroAspecto, setFiltroAspecto] = useState<string>('todos');

  useEffect(() => {
    setVideos(getSavedVideos());
  }, []);

  const videosFiltrados = useMemo(() => {
    return videos.filter((v) => {
      const coincideBusqueda =
        busqueda.trim() === '' ||
        v.title.toLowerCase().includes(busqueda.toLowerCase()) ||
        (MOTOR_LABELS[v.params.motor] || '').toLowerCase().includes(busqueda.toLowerCase());
      const coincideAspecto =
        filtroAspecto === 'todos' || v.aspect === filtroAspecto;
      return coincideBusqueda && coincideAspecto;
    });
  }, [videos, busqueda, filtroAspecto]);

  const handleEliminar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const actualizados = deleteVideoProject(id);
    setVideos(actualizados);
    toast.success('Pieza audiovisual eliminada');
  };

  const handleDuplicar = (video: SavedVideoProject, e: React.MouseEvent) => {
    e.stopPropagation();
    const copia: SavedVideoProject = {
      ...video,
      id: `vid-${Date.now()}`,
      title: `${video.title} (Copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const actualizados = saveVideoProject(copia);
    setVideos(actualizados);
    toast.success('Pieza duplicada con éxito');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header con Resumen & Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Archivo Audiovisual · RSN Trama
            </span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-light text-foreground tracking-tight">
            Colección de Piezas de Identidad
          </h2>
          <p className="text-xs text-muted-foreground max-w-xl">
            Piezas audiovisuales generadas y archivadas para redes sociales, proyecciones en ferias y pantallas territoriales.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            onClick={onNuevoVideo}
            className="btn btn-primary text-xs font-mono flex items-center gap-2 px-4 h-10 rounded-xl shadow-md"
          >
            <Plus size={15} />
            <span>Nueva Pieza</span>
          </Button>
        </div>
      </div>

      {/* 2. Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por título, lote o motor de animación…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['todos', '4:5', '9:16', '1:1', '16:9'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltroAspecto(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors shrink-0',
                filtroAspecto === f
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border/60 bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {f === 'todos' ? 'Todos' : f}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Rejilla de Tarjetas de Videos (RSN) */}
      {videosFiltrados.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/30 space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Film size={22} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-serif text-lg text-foreground">
              Sin piezas audiovisuales
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {busqueda
                ? 'No se encontraron piezas que coincidan con la búsqueda.'
                : 'Crea tu primera pieza audiovisual de identidad viva y guárdala en el archivo.'}
            </p>
          </div>
          <div>
            <Button
              type="button"
              onClick={onNuevoVideo}
              className="btn btn-primary btn-sm text-xs font-mono px-4"
            >
              <Plus size={14} className="mr-1" /> Crear Nueva Pieza
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {videosFiltrados.map((item) => {
            const pal = SUBSTRATE_PALETTES[item.params.palette] || SUBSTRATE_PALETTES.ambar;
            const motorNombre = MOTOR_LABELS[item.params.motor] || item.params.motor;
            const primaryColor = item.params.customColor || pal.primaryHex;

            return (
              <div
                key={item.id}
                onClick={() => onEditarVideo(item)}
                className="group relative rounded-2xl border border-border/70 bg-card hover:border-primary/50 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-md"
              >
                {/* Poster / Thumbnail con badge */}
                <div className="relative aspect-[16/10] bg-surface-sunken/80 border-b border-border/50 overflow-hidden flex items-center justify-center">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="w-full h-full p-4 flex flex-col justify-between relative overflow-hidden"
                      style={{
                        background: `radial-gradient(circle at 50% 50%, ${primaryColor}22 0%, #000000 100%)`,
                      }}
                    >
                      <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground uppercase">
                        <span>Chiloé 42°S</span>
                        <span className="flex items-center gap-1">
                          <span
                            className="h-2 w-2 rounded-full border border-white/20"
                            style={{ backgroundColor: primaryColor }}
                          />
                          {item.params.customColor ? 'Hex Libre' : pal.label}
                        </span>
                      </div>
                      <div className="my-auto text-center space-y-1">
                        <span className="font-serif text-lg text-foreground font-light tracking-wide block">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-primary/80">
                          {motorNombre}
                        </span>
                      </div>
                      <div className="text-[8px] font-mono text-muted-foreground/60 text-center">
                        Lienzo Procedural · {item.aspect}
                      </div>
                    </div>
                  )}

                  {/* Badges superiores flotantes */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-background/80 backdrop-blur-md border border-border text-[10px] font-mono font-bold text-foreground">
                      {item.aspect}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-background/80 backdrop-blur-md border border-border text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                      <Clock size={10} />
                      {item.durationSeconds}s
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-1.5 rounded-lg bg-background/90 backdrop-blur-md border border-border text-primary shadow-sm">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>

                {/* Contenido de la tarjeta */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-serif text-base text-foreground font-medium line-clamp-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                      <span>{motorNombre}</span>
                      <span>·</span>
                      <span className="capitalize">{item.params.camera}</span>
                    </div>
                  </div>

                  {/* Acciones de pie de tarjeta */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px] font-mono text-muted-foreground">
                    <span>
                      {new Date(item.updatedAt).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleDuplicar(item, e)}
                        className="p-1.5 rounded-md hover:bg-surface-raised hover:text-foreground text-muted-foreground transition-colors"
                        title="Duplicar pieza"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleEliminar(item.id, e)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                        title="Eliminar del archivo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
