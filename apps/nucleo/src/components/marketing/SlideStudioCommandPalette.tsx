'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  X,
  Layers,
  Database,
  Radio,
  Coffee,
  BookmarkPlus,
  Palette,
  Plus,
  Download,
  Copy,
  Printer,
  Calendar,
  FileDown,
  FileUp,
  Save,
  Check,
  Type,
  AlignLeft,
  Film,
} from 'lucide-react';
import { cn } from '@enjambre/ui';
import {
  type SlideBlock,
  type SlideAspectRatio,
  SLIDE_ACCENT_PALETTES,
} from './slide-studio-core';

export interface SlideStudioCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSetAspectRatio: (ratio: SlideAspectRatio) => void;
  onOpenDataInjector: () => void;
  onOpenPresenter: () => void;
  onOpenTemplateManager: () => void;
  onOpenSchedulePost: () => void;
  onOpenPrintTabletop: () => void;
  onOpenIdentityStudio?: () => void;
  onExportSinglePNG: () => void;
  onExportAllPNGs: () => void;
  onCopyCaption: () => void;
  onExportJSON: () => void;
  onImportJSON: () => void;
  onSave: () => void;
  onAddBlock: (type: SlideBlock['type']) => void;
  onSetAccentColor: (colorId: string) => void;
  onSelectSlide: (index: number) => void;
  slidesCount: number;
  currentSlideIndex: number;
}

interface CommandItem {
  id: string;
  category: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  shortcut?: string;
  badge?: string;
}

export function SlideStudioCommandPalette({
  isOpen,
  onClose,
  onSetAspectRatio,
  onOpenDataInjector,
  onOpenPresenter,
  onOpenTemplateManager,
  onOpenSchedulePost,
  onOpenPrintTabletop,
  onOpenIdentityStudio,
  onExportSinglePNG,
  onExportAllPNGs,
  onCopyCaption,
  onExportJSON,
  onImportJSON,
  onSave,
  onAddBlock,
  onSetAccentColor,
  onSelectSlide,
  slidesCount,
  currentSlideIndex,
}: SlideStudioCommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    // 1. Acciones Principales y Guardado
    {
      id: 'save-changes',
      category: 'General',
      label: 'Guardar Cambios en Navegador',
      description: 'Persistir estado actual del carrusel en almacenamiento local',
      icon: Save,
      shortcut: '⌘S',
      action: () => {
        onSave();
        onClose();
      },
    },
    {
      id: 'open-identity-studio',
      category: 'Audiovisual & Sustrato',
      label: 'Generador Audiovisual de Identidad',
      description: 'Crear videos de marca y fotogramas con el sustrato biológico de OYZ',
      icon: Film,
      badge: '60 FPS',
      action: () => {
        onClose();
        onOpenIdentityStudio?.();
      },
    },
    {
      id: 'open-data-injector',
      category: 'Inteligencia & Datos',
      label: 'Inyector Dinámico de Datos Duros',
      description: 'Conectar lotes reales, perfiles sensoriales y datos fenológicos',
      icon: Database,
      badge: '✦ Núcleo',
      action: () => {
        onClose();
        onOpenDataInjector();
      },
    },
    {
      id: 'open-presenter',
      category: 'Modo de Sala',
      label: 'Modo Sala / Kiosk Live Fullscreen',
      description: 'Abrir entorno vivo interactivo para cata o presentación en sala',
      icon: Radio,
      badge: 'En Vivo',
      action: () => {
        onClose();
        onOpenPresenter();
      },
    },
    {
      id: 'open-template-manager',
      category: 'Plantillas',
      label: 'Gestor de Kits & Borradores',
      description: 'Administrar plantillas comerciales para cafeterías, hoteles y ferias',
      icon: BookmarkPlus,
      action: () => {
        onClose();
        onOpenTemplateManager();
      },
    },

    // 2. Formato & Proporción
    {
      id: 'ratio-4-5',
      category: 'Formato',
      label: 'Cambiar a Formato 4:5 Feed',
      description: 'Resolución 1080 × 1350 px optimizada para publicación en feed',
      icon: Layers,
      action: () => {
        onSetAspectRatio('4:5');
        onClose();
      },
    },
    {
      id: 'ratio-9-16',
      category: 'Formato',
      label: 'Cambiar a Formato 9:16 Stories',
      description: 'Resolución 1080 × 1920 px optimizada para historias y vertical',
      icon: Layers,
      action: () => {
        onSetAspectRatio('9:16');
        onClose();
      },
    },
    {
      id: 'ratio-1-1',
      category: 'Formato',
      label: 'Cambiar a Formato 1:1 Cuadrado',
      description: 'Resolución 1080 × 1080 px para formatos estándar',
      icon: Layers,
      action: () => {
        onSetAspectRatio('1:1');
        onClose();
      },
    },
    {
      id: 'ratio-16-9',
      category: 'Formato',
      label: 'Cambiar a Formato 16:9 Pantalla / Presentación',
      description: 'Resolución 1920 × 1080 px para pantallas de sala, cafeterías y keynote',
      icon: Layers,
      action: () => {
        onSetAspectRatio('16:9');
        onClose();
      },
    },

    // 3. Añadir Bloques Modulares
    {
      id: 'block-paragraph',
      category: 'Bloques Modulares',
      label: '+ Añadir Bloque: Párrafo',
      description: 'Texto estructurado con encabezado Mono y nota de cierre',
      icon: Plus,
      action: () => {
        onAddBlock('paragraph');
        onClose();
      },
    },
    {
      id: 'block-items',
      category: 'Bloques Modulares',
      label: '+ Añadir Bloque: Criterios',
      description: 'Lista de estándares de calidad o especificaciones técnicas',
      icon: Plus,
      action: () => {
        onAddBlock('items');
        onClose();
      },
    },
    {
      id: 'block-metrics',
      category: 'Bloques Modulares',
      label: '+ Añadir Bloque: Métricas',
      description: 'Indicadores numéricos, porcentajes y tolerancias de lote',
      icon: Plus,
      action: () => {
        onAddBlock('metrics');
        onClose();
      },
    },
    {
      id: 'block-comparison',
      category: 'Bloques Modulares',
      label: '+ Añadir Bloque: Fases',
      description: 'Secuencia temporal de recolección y maduración biológica',
      icon: Plus,
      action: () => {
        onAddBlock('comparison');
        onClose();
      },
    },
    {
      id: 'block-portal',
      category: 'Bloques Modulares',
      label: '+ Añadir Bloque: Portal',
      description: 'Llamado a la acción con enlace directo o punto de contacto',
      icon: Plus,
      action: () => {
        onAddBlock('portal');
        onClose();
      },
    },
    {
      id: 'block-quote',
      category: 'Bloques Modulares',
      label: '+ Añadir Bloque: Axioma',
      description: 'Declaración o axioma territorial destacado',
      icon: Plus,
      action: () => {
        onAddBlock('quote');
        onClose();
      },
    },
    {
      id: 'block-qr',
      category: 'Bloques Modulares',
      label: '+ Añadir Bloque: QR Soberano',
      description: 'Código QR verificable hacia el certificado de origen',
      icon: Plus,
      action: () => {
        onAddBlock('qr_code');
        onClose();
      },
    },
    {
      id: 'block-sensorial',
      category: 'Bloques Modulares',
      label: '+ Añadir Bloque: Sensorial & Cata',
      description: 'Perfil organoléptico, notas de cata y constantes físicas',
      icon: Plus,
      action: () => {
        onAddBlock('sensorial');
        onClose();
      },
    },

    // 4. Paletas de Color
    ...Object.values(SLIDE_ACCENT_PALETTES).map((p) => ({
      id: `palette-${p.id}`,
      category: 'Paleta de Acento',
      label: `Aplicar Paleta: ${p.label}`,
      description: `Cambiar acento visual a ${p.label} (${p.hex})`,
      icon: Palette,
      action: () => {
        onSetAccentColor(p.id);
        onClose();
      },
    })),

    // 5. Exportación & Entrega
    {
      id: 'export-single-png',
      category: 'Exportación',
      label: 'Descargar Lámina Actual en PNG',
      description: 'Exportar imagen de alta definición de la lámina visible',
      icon: Download,
      action: () => {
        onClose();
        onExportSinglePNG();
      },
    },
    {
      id: 'export-all-png',
      category: 'Exportación',
      label: `Exportar Todo el Carrusel (${slidesCount} Láminas)`,
      description: 'Generar y descargar paquete completo de imágenes PNG',
      icon: Layers,
      badge: 'Completo',
      action: () => {
        onClose();
        onExportAllPNGs();
      },
    },
    {
      id: 'copy-caption',
      category: 'Publicación',
      label: 'Copiar Caption Editorial para Redes',
      description: 'Copiar al portapapeles el texto del post formateado',
      icon: Copy,
      action: () => {
        onClose();
        onCopyCaption();
      },
    },
    {
      id: 'print-tabletop',
      category: 'Entrega Física',
      label: 'Imprimir Ficha de Mesa / PDF 300 DPI',
      description: 'Generar ficha imprimible para acrílicos de mesa o barra barista',
      icon: Printer,
      action: () => {
        onClose();
        onOpenPrintTabletop();
      },
    },
    {
      id: 'schedule-post',
      category: 'Publicación',
      label: 'Agendar en Calendario de Marketing',
      description: 'Planificar fecha de salida en la cronología de Núcleo',
      icon: Calendar,
      action: () => {
        onClose();
        onOpenSchedulePost();
      },
    },
    {
      id: 'export-json',
      category: 'Archivo Soberano',
      label: 'Exportar Carrusel como JSON Soberano',
      description: 'Descargar archivo de respaldo reproducible del carrusel',
      icon: FileDown,
      action: () => {
        onClose();
        onExportJSON();
      },
    },
    {
      id: 'import-json',
      category: 'Archivo Soberano',
      label: 'Cargar Archivo JSON de Carrusel',
      description: 'Restaurar carrusel desde un archivo local guardado',
      icon: FileUp,
      action: () => {
        onClose();
        onImportJSON();
      },
    },
  ];

  // Filtro
  const filtered = commands.filter((cmd) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  // Manejo de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < filtered.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  // Asegurar scroll visible al elemento seleccionado
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de Comandos del Estudio Editorial"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de búsqueda */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-surface-sunken/40">
          <Search size={18} className="text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Escribe un comando o busca una acción... (ej. exportar, 9:16, bloque, paleta)"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-sans"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-raised border border-border text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Lista de comandos */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-1 flex-1 divide-y divide-border/20">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No se encontraron comandos para &ldquo;{search}&rdquo;.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              const IconComp = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between gap-3 transition-colors',
                    isSelected
                      ? 'bg-primary/10 text-foreground font-medium'
                      : 'hover:bg-surface-raised text-muted-foreground hover:text-foreground',
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors',
                        isSelected
                          ? 'border-primary/40 bg-primary/20 text-primary'
                          : 'border-border bg-surface-sunken text-muted-foreground',
                      )}
                    >
                      <IconComp size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">{cmd.label}</span>
                        {cmd.badge && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/20 text-primary font-semibold shrink-0">
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{cmd.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground/60 hidden sm:inline">
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-raised border border-border text-primary font-semibold">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer con atajos de navegación */}
        <div className="px-4 py-2 border-t border-border bg-surface-sunken/40 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-surface-raised border border-border">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 rounded bg-surface-raised border border-border">↓</kbd> Navegar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-raised border border-border">↵</kbd> Ejecutar
            </span>
          </div>
          <span>
            Lámina {currentSlideIndex + 1} de {slidesCount}
          </span>
        </div>
      </div>
    </div>
  );
}
