'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Download,
  Share2,
  Copy,
  Check,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Layers,
  AlertTriangle,
  Eye,
  BookOpen,
  Wrench,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Palette,
  AlignLeft,
  AlignCenter,
  Type,
  Save,
  X,
  Radio,
  Database,
  QrCode,
  FileDown,
  FileUp,
  BookmarkPlus,
  Calendar,
  Printer,
  Coffee,
  Command,
  Search,
  Minimize2,
  Maximize2,
  ArrowRightLeft,
} from 'lucide-react';
import { cn, toast } from '@enjambre/ui';
import {
  type SlideData,
  type SlideBlock,
  type BrandViolation,
  type SlideTitleSize,
  type SlideAlignment,
  type SlideAspectRatio,
  PRESET_MANIFIESTO,
  PRESET_ULMO_ESTACIONAL,
  PRESET_KIT_CAFETERIA,
  PRESET_CLUB_LEGADO,
  ARSENAL_EDITORIAL,
  SLIDE_ACCENT_PALETTES,
} from './slide-studio-core';
import { useSlideStudio, type SavedDraft, type UserTemplate } from './use-slide-studio';
import { SlidePreviewCard } from './SlidePreviewCard';
import { SlideBlockEditor } from './SlideBlockEditor';
import { LivePresenterKioskModal } from './LivePresenterKioskModal';
import { HardDataInjectorModal } from './HardDataInjectorModal';
import { AdminKitTemplateManagerModal } from './AdminKitTemplateManagerModal';
import { ScheduleMarketingPostModal } from './ScheduleMarketingPostModal';
import { TabletopPrintModal } from './TabletopPrintModal';
import { SlideStudioCommandPalette } from './SlideStudioCommandPalette';

const MODULAR_BLOCK_TYPES = [
  {
    type: 'paragraph' as const,
    label: 'Párrafo',
    symbol: '¶',
    desc: 'Texto libre con encabezado Mono y nota de cierre',
    accent: false,
  },
  {
    type: 'items' as const,
    label: 'Criterios',
    symbol: '✓',
    desc: 'Estándares de calidad o especificaciones técnicas',
    accent: false,
  },
  {
    type: 'metrics' as const,
    label: 'Métricas',
    symbol: '◈',
    desc: 'Indicadores numéricos, porcentajes y tolerancias de lote',
    accent: false,
  },
  {
    type: 'comparison' as const,
    label: 'Fases',
    symbol: '⟳',
    desc: 'Secuencia cronológica (Floración → Recolección)',
    accent: false,
  },
  {
    type: 'portal' as const,
    label: 'Portal',
    symbol: '⊡',
    desc: 'Llamado a la acción con enlace directo o contacto',
    accent: false,
  },
  {
    type: 'quote' as const,
    label: 'Axioma',
    symbol: '«',
    desc: 'Declaración doctrinaria corta en Garamond',
    accent: false,
  },
  {
    type: 'qr_code' as const,
    label: 'QR Soberano',
    symbol: '▣',
    desc: 'Código QR verificable hacia el certificado de origen',
    accent: true,
  },
  {
    type: 'sensorial' as const,
    label: 'Sensorial & Cata',
    symbol: '◉',
    desc: 'Perfil organoléptico, notas de cata y botánica',
    accent: true,
  },
];

function getBlockTypeInfo(type: SlideBlock['type']) {
  switch (type) {
    case 'paragraph':
      return { symbol: '¶', label: 'Párrafo' };
    case 'items':
      return { symbol: '✓', label: 'Criterios' };
    case 'metrics':
      return { symbol: '◈', label: 'Métricas' };
    case 'comparison':
      return { symbol: '⟳', label: 'Fases' };
    case 'portal':
      return { symbol: '⊡', label: 'Portal' };
    case 'quote':
      return { symbol: '«', label: 'Axioma' };
    case 'qr_code':
      return { symbol: '▣', label: 'QR Soberano' };
    case 'sensorial':
      return { symbol: '◉', label: 'Sensorial & Cata' };
    default:
      return { symbol: '▪', label: type };
  }
}

function getBlockSummary(block: SlideBlock): string {
  switch (block.type) {
    case 'paragraph':
      return block.header || block.lines.find((l) => Boolean(l.trim())) || 'Texto libre';
    case 'items':
      return block.items[0]?.title ? `${block.items[0].title} (+${block.items.length})` : `${block.items.length} criterios`;
    case 'metrics':
      return block.items[0] ? `${block.items[0].label}: ${block.items[0].value}` : `${block.items.length} métricas`;
    case 'comparison':
      return `${block.left.title || 'Fase A'} // ${block.right.title || 'Fase B'}`;
    case 'portal':
      return block.subtitle || block.url || 'Portal soberano';
    case 'quote':
      return block.quote ? `«${block.quote.slice(0, 32)}...»` : 'Axioma doctrinario';
    case 'qr_code':
      return block.title || block.url || 'Código QR';
    case 'sensorial':
      return block.pairingNote || block.crystallization || 'Perfil sensorial de cata';
    default:
      return '';
  }
}

export interface SlideStudioWorkspaceProps {
  initialSlides?: SlideData[];
  className?: string;
}

export function SlideStudioWorkspace({ initialSlides, className }: SlideStudioWorkspaceProps) {
  const [isPresenterOpen, setIsPresenterOpen] = useState(false);
  const [isDataInjectorOpen, setIsDataInjectorOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [isSchedulePostOpen, setIsSchedulePostOpen] = useState(false);
  const [isPrintTabletopOpen, setIsPrintTabletopOpen] = useState(false);
  const [b2bPartnerName, setB2bPartnerName] = useState('');
  const [isB2bPopoverOpen, setIsB2bPopoverOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [arsenalSearchQuery, setArsenalSearchQuery] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    slides,
    aspectRatio,
    setAspectRatio,
    activeSlide,
    activeSlideIndex,
    setActiveSlideIndex,
    activeTab,
    setActiveTab,
    arsenalCategoryFilter,
    setArsenalCategoryFilter,
    filteredArsenal,
    brandIssues,
    isExporting,
    isCopied,
    canShare,
    hasUnsavedChanges,
    lastSavedAt,
    isSaving,
    customTemplates,
    saveChanges,
    saveCurrentAsTemplate,
    updateCustomTemplate,
    overwriteTemplateWithCurrentSlides,
    duplicateCustomTemplate,
    deleteCustomTemplate,
    exportAllTemplatesJSON,
    importTemplatesJSON,
    exportCarouselJSON,
    importCarouselJSON,
    updateActiveSlide,
    updateBlock,
    removeBlock,
    moveBlock,
    duplicateBlock,
    moveBlockToSlide,
    addBlockToActiveSlide,
    handleAddBlankSlide,
    handleDuplicateSlide,
    handleDeleteSlide,
    handleMoveSlide,
    handleInsertArsenalBlock,
    handleCreateSlideFromArsenal,
    handleLoadPreset,
    handleExportSinglePNG,
    handleExportAllPNGs,
    handleCopyCaption,
    applyFooterLeftToAllSlides,
    applyStyleToAllSlides,
    setSlides,
  } = useSlideStudio({ initialSlides });

  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});
  const toggleBlockCollapse = (id: string) => {
    setCollapsedBlocks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Atajo global ⌘K / Ctrl+K para Paleta de Comandos
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Navegación bidireccional: clic en elemento del preview salta al formulario y hace focus con feedback visual
  const handleSelectFieldFromPreview = (fieldId: string) => {
    if (activeTab !== 'editor') {
      setActiveTab('editor');
    }
    setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if ('focus' in el && typeof el.focus === 'function') {
          el.focus();
        }
        el.classList.add('ring-2', 'ring-primary', 'transition-all');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-primary');
        }, 1400);
      }
    }, 60);
  };

  // Filtrado compuesto del arsenal canónico (categoría + búsqueda semántica)
  const searchFilteredArsenal = useMemo(() => {
    const q = arsenalSearchQuery.toLowerCase().trim();
    return filteredArsenal.filter((item) => {
      if (!q) return true;
      return (
        item.titulo.toLowerCase().includes(q) ||
        item.descripcion.toLowerCase().includes(q) ||
        item.categoria.toLowerCase().includes(q)
      );
    });
  }, [filteredArsenal, arsenalSearchQuery]);

  const applyPartnerCoBranding = (partner: string) => {
    const clean = partner.trim();
    setB2bPartnerName(clean);
    if (!clean) return;
    setSlides((prev) =>
      prev.map((s) => ({
        ...s,
        kickerLeft: `ALIANZA // ${clean.toUpperCase()}`,
        footerLeft: `obrerayzangano.cl // ${clean}`,
      })),
    );
    toast.success(`Co-branding aplicado para "${clean}".`);
  };

  return (
    <div className={cn('space-y-5 animate-in relative pb-16 lg:pb-0', className)}>
      {/* 1. Barra de Herramientas y Acciones Principales con Jerarquía Estructurada */}
      <div className="rounded-2xl border border-border bg-card/60 p-3.5 sm:p-4 space-y-3.5">
        {/* Tier 1: Plantillas, Formatos & Comando Rápido */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-border/50">
          {/* Plantillas Canónicas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider shrink-0 mr-1">
              Plantillas:
            </span>
            <button
              type="button"
              className="btn btn-outline btn-xs h-7 px-2.5 rounded-lg text-xs shrink-0 whitespace-nowrap"
              onClick={() => handleLoadPreset(PRESET_MANIFIESTO, 'Manifiesto Científico (6)')}
            >
              Manifiesto (6)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-xs h-7 px-2.5 rounded-lg text-xs shrink-0 whitespace-nowrap"
              onClick={() => handleLoadPreset(PRESET_ULMO_ESTACIONAL, 'Recolección Ulmo (3)')}
            >
              Recolección Ulmo (3)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-xs h-7 px-2.5 rounded-lg text-xs shrink-0 whitespace-nowrap border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => handleLoadPreset(PRESET_KIT_CAFETERIA, 'Kit Cafetería: Maridaje & Mesa (3)')}
            >
              Kit Cafetería (3)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-xs h-7 px-2.5 rounded-lg text-xs shrink-0 whitespace-nowrap border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => handleLoadPreset(PRESET_CLUB_LEGADO, 'Club Legado del Bosque (3)')}
            >
              Club Legado (3)
            </button>

            <div className="h-4 w-px bg-border/60 mx-1 shrink-0" />

            <button
              type="button"
              onClick={() => setTemplateModalOpen(true)}
              className="btn btn-outline btn-xs h-7 px-2.5 rounded-lg text-xs font-mono shrink-0 flex items-center gap-1.5 border-primary/40 text-primary hover:bg-primary/10 shadow-sm"
              title="Abrir gestor integral de kits comerciales y borradores de trabajo"
            >
              <BookmarkPlus size={13} />
              <span>Kits & Borradores{customTemplates.length > 0 ? ` (${customTemplates.length})` : ''}</span>
            </button>
          </div>

          {/* Formato Editorial & Command Palette */}
          <div className="flex items-center gap-2">
            {/* Segmented Control de Formatos */}
            <div className="flex items-center p-0.5 rounded-lg border border-border bg-surface-sunken">
              {(['4:5', '9:16', '1:1'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-mono rounded-md transition-colors',
                    aspectRatio === ratio
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  title={`Formato ${ratio}`}
                >
                  {ratio === '4:5' ? '4:5 Feed' : ratio === '9:16' ? '9:16 Stories' : '1:1 Cuadrado'}
                </button>
              ))}
            </div>

            {/* Acceso a Paleta de Comandos ⌘K */}
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="btn btn-outline btn-xs h-8 px-2.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border-border hover:border-primary/40 text-muted-foreground hover:text-foreground shadow-sm"
              title="Abrir paleta de comandos rápidos (Atajo: ⌘K / Ctrl+K)"
            >
              <Command size={13} className="text-primary" />
              <span className="hidden sm:inline">Comandos</span>
              <kbd className="hidden sm:inline-block text-[10px] font-mono px-1 rounded bg-surface-sunken border border-border text-muted-foreground">
                ⌘K
              </kbd>
            </button>
          </div>
        </div>

        {/* Tier 2: Herramientas Operativas, Inteligencia y Entrega */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Grupo Inteligencia & Modos */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Inyector de Datos Duros */}
            <button
              type="button"
              onClick={() => setIsDataInjectorOpen(true)}
              className="btn btn-outline btn-sm h-8 px-2.5 text-xs flex items-center gap-1.5 border-primary/40 text-primary hover:bg-primary/10 shadow-sm"
              title="Conectar y volcar datos puros de Lotes, Fenología o Códigos QR"
            >
              <Database size={13} />
              <span>Datos Duros</span>
              <span className="text-[10px] font-mono px-1 rounded bg-primary/20 text-primary font-bold">✦</span>
            </button>

            {/* Modo Sala / Kiosk Live */}
            <button
              type="button"
              onClick={() => setIsPresenterOpen(true)}
              className="btn btn-outline btn-sm h-8 px-2.5 text-xs flex items-center gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 shadow-sm"
              title="Abrir entorno vivo de presentación y cata en pantalla completa"
            >
              <Radio size={13} className="animate-pulse" />
              <span>Modo Sala</span>
            </button>

            {/* Aliado B2B Co-Branding */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsB2bPopoverOpen(!isB2bPopoverOpen)}
                className={cn(
                  'btn btn-outline btn-sm h-8 px-2.5 text-xs flex items-center gap-1.5 shadow-sm',
                  b2bPartnerName
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
                title="Aplicar co-branding con una cafetería, hotel o aliado B2B"
              >
                <Coffee size={13} />
                <span>Aliado B2B</span>
                {b2bPartnerName && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </button>

              {isB2bPopoverOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-72 p-3 rounded-2xl border border-border bg-card shadow-xl z-30 space-y-2.5 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                    <span className="font-mono text-[11px] font-semibold text-foreground">
                      Co-Branding con Aliado B2B
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsB2bPopoverOpen(false)}
                      className="text-muted-foreground hover:text-foreground p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Estampa el nombre de la cafetería u hotel en los encabezados de todas las láminas y en los códigos QR.
                  </p>
                  <input
                    type="text"
                    value={b2bPartnerName}
                    onChange={(e) => setB2bPartnerName(e.target.value)}
                    placeholder="ej. Tostaduría Austral"
                    className="input-field w-full text-xs font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        applyPartnerCoBranding(b2bPartnerName);
                        setIsB2bPopoverOpen(false);
                      }
                    }}
                  />
                  <div className="flex justify-between items-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        applyPartnerCoBranding('');
                        setIsB2bPopoverOpen(false);
                      }}
                      className="text-[10px] font-mono text-muted-foreground hover:text-destructive"
                    >
                      Limpiar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        applyPartnerCoBranding(b2bPartnerName);
                        setIsB2bPopoverOpen(false);
                      }}
                      className="btn btn-primary btn-xs text-[10px] px-3 font-mono"
                    >
                      Aplicar a Todas
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Guardar Cambios con 1 Solo Clic */}
            <button
              type="button"
              onClick={() => saveChanges()}
              disabled={isSaving}
              className={cn(
                'btn btn-sm h-8 px-3 text-xs flex items-center gap-1.5 transition-all shadow-sm',
                hasUnsavedChanges
                  ? 'btn-primary font-semibold ring-2 ring-primary/30'
                  : 'btn-outline border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20',
              )}
              title="Guardar cambios en el navegador (Atajo: Cmd+S / Ctrl+S)"
            >
              {isSaving ? (
                <span>Guardando...</span>
              ) : hasUnsavedChanges ? (
                <>
                  <Save size={13} />
                  <span>Guardar Cambios</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                </>
              ) : (
                <>
                  <Check size={13} className="text-emerald-400" />
                  <span>Guardado {lastSavedAt ? `(${lastSavedAt})` : ''}</span>
                </>
              )}
            </button>
          </div>

          {/* Grupo Acciones de Difusión & Exportación */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Input oculto para importación JSON */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void importCarouselJSON(file);
                  e.target.value = '';
                }
              }}
            />

            {/* Micro-acciones editoriales */}
            <button
              type="button"
              className="btn btn-ghost btn-sm h-8 px-2 text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleCopyCaption}
              title="Copiar texto editorial para redes"
            >
              {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span className="hidden sm:inline">Copiar</span> Caption
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm h-8 px-2.5 text-xs flex items-center gap-1.5 border-border text-muted-foreground hover:text-foreground"
              onClick={() => setIsPrintTabletopOpen(true)}
              title="Exportar o imprimir ficha para acrílico de mesa o barra barista (PDF 300 DPI)"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Imprimir</span> Ficha
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm h-8 px-2.5 text-xs flex items-center gap-1.5 border-border text-muted-foreground hover:text-foreground"
              onClick={() => setIsSchedulePostOpen(true)}
              title="Agendar publicación en el calendario de marketing de Núcleo"
            >
              <Calendar size={13} />
              <span className="hidden sm:inline">Agendar</span> Post
            </button>

            {/* Archivo JSON Soberano */}
            <div className="flex items-center rounded-lg border border-border bg-surface-sunken/60 p-0.5">
              <button
                type="button"
                onClick={() => exportCarouselJSON()}
                className="btn btn-ghost btn-sm h-7 px-2 text-xs flex items-center gap-1"
                title="Exportar carrusel como archivo JSON soberano descargable"
              >
                <FileDown size={13} className="text-primary" />
                <span className="hidden md:inline">JSON</span>
              </button>
              <div className="h-3.5 w-px bg-border/80" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-ghost btn-sm h-7 px-2 text-xs flex items-center gap-1"
                title="Cargar archivo JSON de carrusel"
              >
                <FileUp size={13} />
                <span className="hidden md:inline">Cargar</span>
              </button>
            </div>

            {canShare ? (
              <button
                type="button"
                disabled={isExporting}
                className="btn btn-outline btn-sm h-8 px-2.5 text-xs flex items-center gap-1.5"
                onClick={() => handleExportSinglePNG(true)}
                title="Compartir o guardar en dispositivo"
              >
                <Share2 size={13} />
                <span>Compartir</span>
              </button>
            ) : null}

            <div className="h-4 w-px bg-border/60 mx-0.5" />

            {/* Acciones Primarias de Exportación */}
            <button
              type="button"
              disabled={isExporting}
              className="btn btn-outline btn-sm h-8 px-3 text-xs flex items-center gap-1.5"
              onClick={() => handleExportSinglePNG(false)}
              title="Descargar lámina actual en PNG"
            >
              <Download size={13} />
              <span>Lámina PNG</span>
            </button>

            <button
              type="button"
              disabled={isExporting}
              className="btn btn-primary btn-sm h-8 px-3 text-xs flex items-center gap-1.5 font-semibold shadow-sm"
              onClick={handleExportAllPNGs}
              title="Exportar todas las láminas del carrusel"
            >
              <Layers size={13} />
              <span>{isExporting ? 'Generando...' : `Todo (${slides.length})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Alertas de Estándar Editorial (Silenciosas, solo si hay infracción real) */}
      {brandIssues.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <AlertTriangle size={14} className="shrink-0" />
            <span>Ajuste editorial sugerido ({brandIssues.length})</span>
          </div>
          <div className="space-y-1">
            {brandIssues.map((issue: BrandViolation, idx: number) => (
              <div key={idx} className="text-[11px] text-amber-200/90 pl-5">
                • <strong className="font-medium">{issue.message}</strong> 👉 {issue.correction}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Secuencia de Láminas (Filmstrip Táctil) */}
      <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground truncate">
            Carrusel ({slides.length} láminas)
          </label>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              disabled={activeSlideIndex === 0}
              onClick={() => handleMoveSlide('left')}
              className="btn btn-ghost h-9 w-9 sm:h-7 sm:w-7 p-0 flex items-center justify-center"
              title="Mover lámina a la izquierda"
              aria-label="Mover lámina a la izquierda"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              type="button"
              disabled={activeSlideIndex === slides.length - 1}
              onClick={() => handleMoveSlide('right')}
              className="btn btn-ghost h-9 w-9 sm:h-7 sm:w-7 p-0 flex items-center justify-center"
              title="Mover lámina a la derecha"
              aria-label="Mover lámina a la derecha"
            >
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={handleDuplicateSlide}
              className="btn btn-ghost h-9 w-9 sm:h-7 sm:w-7 p-0 flex items-center justify-center"
              title="Duplicar lámina actual"
              aria-label="Duplicar lámina actual"
            >
              <Copy size={14} />
            </button>
            <button
              type="button"
              disabled={slides.length <= 1}
              onClick={handleDeleteSlide}
              className="btn btn-ghost h-9 w-9 sm:h-7 sm:w-7 p-0 text-destructive hover:bg-destructive/10 flex items-center justify-center"
              title="Eliminar lámina actual"
              aria-label="Eliminar lámina actual"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Carrusel Deslizable */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5">
          {slides.map((s, idx) => (
            <button
              key={s.id || idx}
              type="button"
              onClick={() => setActiveSlideIndex(idx)}
              className={cn(
                'min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-mono transition-all shrink-0 flex items-center gap-2',
                activeSlideIndex === idx
                  ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/10'
                  : 'border-border bg-card hover:bg-surface-raised text-muted-foreground',
              )}
            >
              <span className="font-bold">{String(idx + 1).padStart(2, '0')}</span>
              <span className="text-[11px] opacity-75 truncate max-w-[100px]">
                {s.kickerLeft || 'Lámina'}
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={handleAddBlankSlide}
            className="min-h-[38px] px-3 py-1.5 rounded-xl border border-dashed border-border hover:border-primary/50 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Añadir</span>
          </button>
        </div>
      </div>

      {/* 4. Selector de Pestañas (Desktop & Móvil) */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors shrink-0',
            activeTab === 'editor'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Wrench size={14} />
          <span>Editor de Lámina</span>
        </button>

        {/* Pestaña de Vista Previa (Visible solo en dispositivos móviles/tablets `< lg`) */}
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={cn(
            'lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors shrink-0',
            activeTab === 'preview'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Eye size={14} />
          <span>Vista Previa ({aspectRatio})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('arsenal')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors shrink-0',
            activeTab === 'arsenal'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <BookOpen size={14} />
          <span>Arsenal de Marca</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">
            {ARSENAL_EDITORIAL.length}
          </span>
        </button>

        {/* Inyector de Datos Duros como Ciudadano de Primer Nivel */}
        <button
          type="button"
          onClick={() => setIsDataInjectorOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors shrink-0 text-primary hover:bg-primary/10 border border-primary/30"
          title="Inyectar datos de Lotes reales, Perfiles Sensoriales y Fenología"
        >
          <Database size={14} />
          <span>Inyector de Datos</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/20 text-primary font-bold">
            ✦
          </span>
        </button>
      </div>

      {/* 5. Área de Trabajo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.18fr_0.82fr] gap-6 items-start">
        {/* Columna Principal / Editor & Arsenal */}
        <div className="space-y-4">
          {/* TAB: EDITOR */}
          {activeTab !== 'arsenal' && (
            <div className={cn('space-y-5 animate-in fade-in duration-150', activeTab === 'preview' ? 'hidden lg:block' : '')}>
              {/* Encabezados y Metadatos */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-foreground font-semibold block">
                      1. Aristas & Metadatos de la Lámina
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Parámetros de cabecera y anclaje editorial
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-primary/90 bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                    Lámina {String(activeSlideIndex + 1).padStart(2, '0')} de {String(slides.length).padStart(2, '0')}
                  </span>
                </div>

                {/* Aristas Superiores (Kickers) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="field-kickerLeft" className="text-xs font-mono text-foreground font-medium block">
                      Arista superior izquierda
                    </label>
                    <span className="text-[11px] text-muted-foreground block mb-1">
                      Cuenca, origen o categoría del producto
                    </span>
                    <input
                      id="field-kickerLeft"
                      type="text"
                      placeholder="ej. REGISTRO BOTÁNICO // SELVA VALDIVIANA"
                      className="input-field w-full text-base md:text-xs font-mono"
                      value={activeSlide.kickerLeft}
                      onChange={(e) => updateActiveSlide({ kickerLeft: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="field-kickerRight" className="text-xs font-mono text-foreground font-medium block">
                      Arista superior derecha
                    </label>
                    <span className="text-[11px] text-muted-foreground block mb-1">
                      Anclaje geográfico o coordenada territorial
                    </span>
                    <input
                      id="field-kickerRight"
                      type="text"
                      placeholder="ej. PARALELO 42°S"
                      className="input-field w-full text-base md:text-xs font-mono"
                      value={activeSlide.kickerRight}
                      onChange={(e) => updateActiveSlide({ kickerRight: e.target.value })}
                    />
                  </div>
                </div>

                {/* Insignia Superior (Badge) */}
                <div>
                  <label htmlFor="field-badge" className="text-xs font-mono text-foreground font-medium block">
                    Insignia superior
                  </label>
                  <span className="text-[11px] text-muted-foreground block mb-1">
                    Sello de autenticidad digital o estatus del lote
                  </span>
                  <input
                    id="field-badge"
                    type="text"
                    placeholder="ej. DOCUMENTO DE ORIGEN // SELVA VALDIVIANA"
                    className="input-field w-full text-base md:text-xs font-mono"
                    value={activeSlide.badge}
                    onChange={(e) => updateActiveSlide({ badge: e.target.value })}
                  />
                </div>

                {/* Título Principal */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <label htmlFor="field-title" className="text-xs font-mono text-foreground font-medium block">
                        Título principal (Cormorant Garamond)
                      </label>
                      <span className="text-[11px] text-muted-foreground block">
                        Mensaje nuclear en tipografía existencial
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-primary/70">
                      Doble Enter (↵↵) para nuevo párrafo
                    </span>
                  </div>
                  <textarea
                    id="field-title"
                    rows={3}
                    placeholder="Escribe el título... Puedes presionar doble Enter para separar párrafos."
                    className="input-field w-full text-base md:text-sm font-existencial leading-snug"
                    value={activeSlide.title}
                    onChange={(e) => updateActiveSlide({ title: e.target.value })}
                  />
                </div>

                {/* Subtítulo / Bajada Descriptiva */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <label htmlFor="field-subtitle" className="text-xs font-mono text-foreground font-medium block">
                        Subtítulo o bajada descriptiva
                      </label>
                      <span className="text-[11px] text-muted-foreground block">
                        Argumento biológico o contexto complementario
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-primary/70">
                      Doble Enter (↵↵) para nuevo párrafo
                    </span>
                  </div>
                  <textarea
                    id="field-subtitle"
                    rows={2}
                    placeholder="Bajada descriptiva... Soporta doble Enter para párrafos."
                    className="input-field w-full text-base md:text-xs leading-relaxed"
                    value={activeSlide.subtitle ?? ''}
                    onChange={(e) => updateActiveSlide({ subtitle: e.target.value })}
                  />
                </div>

                {/* Estilos Visuales: Paleta de Color, Escala y Alineación */}
                <div className="pt-2 border-t border-border/60 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-mono text-foreground font-medium flex items-center gap-1.5">
                        <Palette size={13} className="text-primary" />
                        Color de acento & diagramación
                      </span>
                      <span className="text-[11px] text-muted-foreground block">
                        Identidad cromática de la lámina
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        applyStyleToAllSlides({
                          accentColor: activeSlide.accentColor || 'oro',
                          titleSize: activeSlide.titleSize || 'normal',
                          alignment: activeSlide.alignment || 'left',
                        })
                      }
                      className="text-[11px] font-mono text-primary hover:underline flex items-center gap-1.5 transition-colors"
                      title="Propagar esta paleta, tamaño y alineación a todas las láminas del carrusel"
                    >
                      <Layers size={13} />
                      <span>Propagar estilo a todo el carrusel</span>
                    </button>
                  </div>

                  {/* Selector de Paletas */}
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase block mb-1.5">
                      Paleta de Color de Origen
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.values(SLIDE_ACCENT_PALETTES).map((p) => {
                        const isSelected = (activeSlide.accentColor || 'oro') === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => updateActiveSlide({ accentColor: p.id })}
                            className={cn(
                              'px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 transition-all',
                              isSelected
                                ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-sm'
                                : 'border-border bg-card hover:bg-surface-raised text-muted-foreground',
                            )}
                          >
                            <span
                              className="h-3 w-3 rounded-full shrink-0 border border-black/20"
                              style={{ backgroundColor: p.hex }}
                            />
                            <span>{p.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Escala de Título & Alineación */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-xs font-mono text-muted-foreground uppercase block mb-1.5 flex items-center gap-1">
                        <Type size={12} /> Escala del Título
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: 'compact', label: 'Compacto' },
                          { id: 'normal', label: 'Estándar' },
                          { id: 'large', label: 'Imponente' },
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => updateActiveSlide({ titleSize: s.id as SlideTitleSize })}
                            className={cn(
                              'py-1.5 px-2 rounded-lg border text-xs font-mono text-center transition-all',
                              (activeSlide.titleSize || 'normal') === s.id
                                ? 'border-primary bg-primary/10 text-primary font-semibold'
                                : 'border-border bg-card text-muted-foreground hover:bg-surface-raised',
                            )}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-muted-foreground uppercase block mb-1.5 flex items-center gap-1">
                        <AlignLeft size={12} /> Alineación de Texto
                      </label>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { id: 'left', label: 'Izquierda', icon: AlignLeft },
                          { id: 'center', label: 'Centrado', icon: AlignCenter },
                        ].map((a) => {
                          const IconComp = a.icon;
                          const isSelected = (activeSlide.alignment || 'left') === a.id;
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => updateActiveSlide({ alignment: a.id as SlideAlignment })}
                              className={cn(
                                'py-1.5 px-2 rounded-lg border text-xs font-mono flex items-center justify-center gap-1.5 transition-all',
                                isSelected
                                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                                  : 'border-border bg-card text-muted-foreground hover:bg-surface-raised',
                              )}
                            >
                              <IconComp size={13} />
                              <span>{a.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aristas Inferiores (Pie de Lámina) */}
                <div className="pt-2 border-t border-border/60 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs font-mono text-foreground font-medium block">
                        Aristas inferiores (Pie de lámina)
                      </span>
                      <span className="text-[11px] text-muted-foreground block">
                        Firma institucional y numeración territorial
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => applyFooterLeftToAllSlides(activeSlide.footerLeft || 'obrerayzangano.cl')}
                      className="text-[11px] font-mono text-primary hover:underline flex items-center gap-1.5 transition-colors"
                      title="Propagar este pie izquierdo a todas las láminas del carrusel"
                    >
                      <Layers size={13} />
                      <span>Propagar pie a todo el carrusel</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="field-footerLeft" className="text-xs font-mono text-foreground font-medium block">
                        Arista inferior izquierda
                      </label>
                      <span className="text-[11px] text-muted-foreground block mb-1">
                        Firma digital, dominio o enlace verificado
                      </span>
                      <input
                        id="field-footerLeft"
                        type="text"
                        className="input-field w-full text-base md:text-xs font-mono"
                        placeholder="obrerayzangano.cl"
                        value={activeSlide.footerLeft ?? ''}
                        onChange={(e) => updateActiveSlide({ footerLeft: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="field-footerRight" className="text-xs font-mono text-foreground font-medium block">
                        Arista inferior derecha
                      </label>
                      <span className="text-[11px] text-muted-foreground block mb-1">
                        Numeración automática o código de lote
                      </span>
                      <input
                        id="field-footerRight"
                        type="text"
                        className="input-field w-full text-base md:text-xs font-mono"
                        placeholder="[Automático: 01 // 06]"
                        value={activeSlide.footerRight ?? ''}
                        onChange={(e) => updateActiveSlide({ footerRight: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloques Modulares */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-foreground font-semibold block">
                      2. Bloques Modulares ({activeSlide.blocks?.length || 0})
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Composición modular apilable y reordenable
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {activeSlide.blocks && activeSlide.blocks.length > 0 ? (
                    activeSlide.blocks.map((block: SlideBlock, blockIdx: number) => (
                      <div
                        key={block.id}
                        id={`block-${block.id}`}
                        className="rounded-xl border border-border bg-surface-sunken/40 p-3.5 sm:p-4 space-y-3 transition-all"
                      >
                        {/* Cabecera del Bloque con Controles Táctiles y Acciones Rápidas */}
                        {(() => {
                          const typeInfo = getBlockTypeInfo(block.type);
                          const isCollapsed = Boolean(collapsedBlocks[block.id]);
                          return (
                            <>
                              <div className="flex items-center justify-between border-b border-border/60 pb-2.5 gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="px-2 py-0.5 rounded-md bg-surface-sunken border border-border/70 text-[11px] font-mono font-semibold text-primary flex items-center gap-1.5 shrink-0">
                                    <span className="text-primary/70">{typeInfo.symbol}</span>
                                    <span>
                                      {String(blockIdx + 1).padStart(2, '0')}: {typeInfo.label}
                                    </span>
                                  </span>
                                  {isCollapsed && (
                                    <span
                                      onClick={() => toggleBlockCollapse(block.id)}
                                      className="text-[11px] font-mono text-muted-foreground truncate cursor-pointer hover:text-foreground transition-colors"
                                      title="Clic para expandir este bloque"
                                    >
                                      {getBlockSummary(block)}
                                    </span>
                                  )}
                                </div>

                                {/* Barra de Acción Rápida Pro (Figma / Notion) */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Grupo de Movimiento / Reordenación */}
                                  <div className="flex items-center rounded-lg border border-border/80 bg-surface-sunken p-0.5 shadow-sm">
                                    <button
                                      type="button"
                                      disabled={blockIdx === 0}
                                      onClick={() => moveBlock(blockIdx, 'up')}
                                      className={cn(
                                        'h-7 w-7 rounded-md flex items-center justify-center transition-all',
                                        blockIdx === 0
                                          ? 'opacity-30 cursor-not-allowed text-muted-foreground'
                                          : 'text-foreground hover:text-primary hover:bg-surface-raised active:scale-95',
                                      )}
                                      title="Subir bloque"
                                      aria-label="Subir bloque"
                                    >
                                      <ChevronUp size={15} />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={blockIdx === activeSlide.blocks.length - 1}
                                      onClick={() => moveBlock(blockIdx, 'down')}
                                      className={cn(
                                        'h-7 w-7 rounded-md flex items-center justify-center transition-all',
                                        blockIdx === activeSlide.blocks.length - 1
                                          ? 'opacity-30 cursor-not-allowed text-muted-foreground'
                                          : 'text-foreground hover:text-primary hover:bg-surface-raised active:scale-95',
                                      )}
                                      title="Bajar bloque"
                                      aria-label="Bajar bloque"
                                    >
                                      <ChevronDown size={15} />
                                    </button>
                                  </div>

                                  {/* Grupo de Operaciones: Duplicar, Transferir & Colapsar */}
                                  <div className="flex items-center rounded-lg border border-border/80 bg-surface-sunken p-0.5 shadow-sm">
                                    <button
                                      type="button"
                                      onClick={() => duplicateBlock(block.id)}
                                      className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-surface-raised active:scale-95 transition-all"
                                      title="Duplicar bloque (Clonar con todo su contenido)"
                                      aria-label="Duplicar bloque"
                                    >
                                      <Copy size={13} />
                                    </button>

                                    {slides.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextIndex =
                                            activeSlideIndex === slides.length - 1 ? 0 : activeSlideIndex + 1;
                                          moveBlockToSlide(block.id, nextIndex);
                                        }}
                                        className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-surface-raised active:scale-95 transition-all"
                                        title={`Mover a lámina ${
                                          activeSlideIndex === slides.length - 1 ? 1 : activeSlideIndex + 2
                                        }`}
                                        aria-label="Transferir a otra lámina"
                                      >
                                        <ArrowRightLeft size={13} />
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => toggleBlockCollapse(block.id)}
                                      className={cn(
                                        'h-7 w-7 rounded-md flex items-center justify-center transition-all',
                                        isCollapsed
                                          ? 'text-primary bg-primary/20'
                                          : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised active:scale-95',
                                      )}
                                      title={isCollapsed ? 'Expandir contenido del bloque' : 'Minimizar bloque'}
                                      aria-label={isCollapsed ? 'Expandir bloque' : 'Minimizar bloque'}
                                    >
                                      {isCollapsed ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
                                    </button>
                                  </div>

                                  {/* Botón Eliminar */}
                                  <button
                                    type="button"
                                    onClick={() => removeBlock(block.id)}
                                    className="h-7 w-7 rounded-lg border border-border/80 bg-surface-sunken flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 active:scale-95 transition-all shadow-sm"
                                    title="Eliminar este bloque"
                                    aria-label="Eliminar bloque"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>

                              {/* Cuerpo del Bloque: Editor Completo o Resumen Colapsado */}
                              {!isCollapsed ? (
                                <SlideBlockEditor
                                  block={block}
                                  onChange={(updated) => updateBlock(block.id, updated)}
                                />
                              ) : (
                                <div
                                  onClick={() => toggleBlockCollapse(block.id)}
                                  className="py-2 px-3 rounded-lg bg-surface-sunken/40 border border-border/40 text-xs text-muted-foreground flex items-center justify-between cursor-pointer hover:text-foreground hover:bg-surface-sunken/80 transition-colors"
                                >
                                  <span className="font-mono text-[11px] truncate">{getBlockSummary(block)}</span>
                                  <span className="text-[10px] font-mono text-primary flex items-center gap-1 shrink-0">
                                    <Maximize2 size={11} /> Expandir
                                  </span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                      Lámina sin bloques modulares. Selecciona un bloque a continuación para comenzar.
                    </div>
                  )}
                </div>

                {/* Catálogo de adición guiada de bloques */}
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <span className="text-xs font-mono text-muted-foreground uppercase block font-medium">
                    + Añadir Bloque Modular:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MODULAR_BLOCK_TYPES.map((bt) => (
                      <button
                        key={bt.type}
                        type="button"
                        onClick={() => addBlockToActiveSlide(bt.type)}
                        className={cn(
                          'p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 group',
                          bt.accent
                            ? 'border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50'
                            : 'border-border bg-card hover:bg-surface-raised hover:border-primary/30',
                        )}
                        title={bt.desc}
                      >
                        <span
                          className={cn(
                            'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 border transition-colors',
                            bt.accent
                              ? 'border-primary/40 bg-primary/20 text-primary'
                              : 'border-border bg-surface-sunken text-muted-foreground group-hover:text-primary group-hover:border-primary/30',
                          )}
                        >
                          {bt.symbol}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-foreground block group-hover:text-primary transition-colors">
                            + {bt.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                            {bt.desc}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ARSENAL DE MARCA */}
          {activeTab === 'arsenal' && (
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider font-mono text-muted-foreground block font-semibold">
                  Arsenal Canónico de Marca
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Fragmentos y declaraciones ontológicas pre-auditadas. Inserta bloques directamente en la lámina activa o crea nuevas láminas.
                </p>
              </div>

              {/* Buscador de Fragmentos */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar en el arsenal por concepto, doctrina, norma de laboratorio..."
                  value={arsenalSearchQuery}
                  onChange={(e) => setArsenalSearchQuery(e.target.value)}
                  className="input-field w-full pl-8 text-xs font-mono"
                />
              </div>

              {/* Filtros de Categoría */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['todos', 'doctrina', 'laboratorio', 'botanica', 'fases', 'portal'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setArsenalCategoryFilter(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-colors',
                      arsenalCategoryFilter === cat
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'bg-surface-sunken hover:bg-surface-raised text-muted-foreground',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid de Activos */}
              <div className="space-y-3 pt-2">
                {searchFilteredArsenal.length === 0 ? (
                  <div className="p-8 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                    No se encontraron fragmentos para el filtro actual.
                  </div>
                ) : (
                  searchFilteredArsenal.map((asset) => (
                    <div
                      key={asset.id}
                      className="p-3.5 rounded-xl border border-border bg-surface-sunken/40 space-y-2 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {asset.titulo}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                          {asset.categoria}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">{asset.descripcion}</p>

                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        {/* CTA Primario: Insertar en Lámina */}
                        <button
                          type="button"
                          onClick={() => handleInsertArsenalBlock(asset)}
                          className="btn btn-primary btn-xs h-9 sm:h-7 text-xs flex items-center gap-1.5 font-semibold shadow-sm"
                          title="Insertar este fragmento como bloque en la lámina activa"
                        >
                          <Plus size={13} />
                          <span>Insertar en Lámina</span>
                        </button>
                        {/* CTA Secundario: Crear Lámina Dedicada */}
                        <button
                          type="button"
                          onClick={() => handleCreateSlideFromArsenal(asset)}
                          className="btn btn-outline btn-xs h-9 sm:h-7 text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                          title="Crear una nueva lámina dedicada con este fragmento canónico"
                        >
                          <Sparkles size={13} />
                          <span>+ Crear Lámina</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: VISTA PREVIA (EN PANTALLA COMPLETA MÓVIL) */}
          {activeTab === 'preview' && (
            <div className="lg:hidden space-y-4 animate-in fade-in duration-150">
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-primary" />
                    <span className="text-xs uppercase tracking-widest font-mono text-muted-foreground">
                      Vista Previa en Vivo ({aspectRatio})
                    </span>
                  </div>
                  <span className="text-xs font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                    {String(activeSlideIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center justify-center py-1">
                  <SlidePreviewCard
                    slide={activeSlide}
                    index={activeSlideIndex}
                    total={slides.length}
                    aspectRatio={aspectRatio}
                    onSelectField={handleSelectFieldFromPreview}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  {canShare ? (
                    <button
                      type="button"
                      disabled={isExporting}
                      className="btn btn-primary h-11 text-xs flex items-center justify-center gap-2"
                      onClick={() => handleExportSinglePNG(true)}
                    >
                      <Share2 size={15} /> Compartir
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={isExporting}
                    className="btn btn-outline h-11 text-xs flex items-center justify-center gap-2"
                    onClick={() => handleExportSinglePNG(false)}
                  >
                    <Download size={15} /> Descargar PNG
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Vista Previa Fija en Vivo (Desktop `>= lg`) con Enlace Interactivo */}
        <div className="hidden lg:block space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-primary" />
                <span className="text-xs uppercase tracking-widest font-mono text-muted-foreground">
                  Vista Previa en Vivo ({aspectRatio})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground border border-border/80 px-2 py-0.5 rounded">
                  Clic para editar ↖
                </span>
                <span className="text-[11px] font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                  {String(activeSlideIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Lienzo visual DOM con navegación interactiva */}
            <div className="flex items-center justify-center py-2">
              <SlidePreviewCard
                slide={activeSlide}
                index={activeSlideIndex}
                total={slides.length}
                aspectRatio={aspectRatio}
                onSelectField={handleSelectFieldFromPreview}
              />
            </div>

            {/* Ficha técnica compacta */}
            <div className="pt-2 border-t border-border/60 text-xs font-mono text-muted-foreground flex justify-between">
              <span>Resolución: {aspectRatio === '9:16' ? '1080 × 1920' : aspectRatio === '1:1' ? '1080 × 1080' : '1080 × 1350'} px</span>
              <span>Proporción: {aspectRatio}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón Flotante Quick Peek en Móvil (Permite saltar entre Editor y Preview con un solo tap) */}
      <div className="lg:hidden fixed bottom-6 right-4 z-40">
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'preview' ? 'editor' : 'preview')}
          className="btn btn-primary h-12 px-4 rounded-full shadow-2xl flex items-center gap-2 text-xs font-semibold"
          aria-label={activeTab === 'preview' ? 'Volver al editor' : 'Previsualizar lámina 4:5'}
        >
          {activeTab === 'preview' ? (
            <>
              <Wrench size={16} />
              <span>Editar</span>
            </>
          ) : (
            <>
              <Eye size={16} />
              <span>Ver Lámina (4:5)</span>
            </>
          )}
        </button>
      </div>

      {/* Entorno Vivo de Presentación y Kiosk de Sala (Fullscreen) */}
      <LivePresenterKioskModal
        isOpen={isPresenterOpen}
        onClose={() => setIsPresenterOpen(false)}
        slides={slides}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
      />

      {/* Inyector de Datos Duros y Lotes Reales de Núcleo */}
      <HardDataInjectorModal
        isOpen={isDataInjectorOpen}
        onClose={() => setIsDataInjectorOpen(false)}
        activeSlide={activeSlide}
        onInject={(updatedSlide, newBlocks) => {
          updateActiveSlide({
            ...updatedSlide,
            blocks: newBlocks ? [...activeSlide.blocks, ...newBlocks] : activeSlide.blocks,
          });
        }}
      />

      {/* 8. Gestor Avanzado de Kits y Plantillas de Entrega */}
      <AdminKitTemplateManagerModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        customTemplates={customTemplates}
        activeSlidesCount={slides.length}
        currentAspectRatio={aspectRatio}
        onSaveAsTemplate={(name, category, description) => saveCurrentAsTemplate(name, category, description)}
        onLoadTemplate={(loadedSlides, name) => handleLoadPreset(loadedSlides, name)}
        onOverwriteTemplate={(tmplId) => overwriteTemplateWithCurrentSlides(tmplId)}
        onDuplicateTemplate={(tmplId) => duplicateCustomTemplate(tmplId)}
        onDeleteTemplate={(tmplId) => deleteCustomTemplate(tmplId)}
        onExportTemplates={() => exportAllTemplatesJSON()}
        onImportTemplates={async (file) => importTemplatesJSON(file)}
      />

      {/* 9. Modal para Agendar en Calendario de Marketing */}
      <ScheduleMarketingPostModal
        isOpen={isSchedulePostOpen}
        onClose={() => setIsSchedulePostOpen(false)}
        slides={slides}
      />

      {/* 10. Modal para Impresión de Fichas de Mesa (Acrílicos / PDF 300 DPI) */}
      <TabletopPrintModal
        isOpen={isPrintTabletopOpen}
        onClose={() => setIsPrintTabletopOpen(false)}
        activeSlide={activeSlide}
        partnerName={b2bPartnerName}
      />

      {/* 11. Paleta de Comandos Global (⌘K) inspirada en Linear */}
      <SlideStudioCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSetAspectRatio={setAspectRatio}
        onOpenDataInjector={() => setIsDataInjectorOpen(true)}
        onOpenPresenter={() => setIsPresenterOpen(true)}
        onOpenTemplateManager={() => setTemplateModalOpen(true)}
        onOpenSchedulePost={() => setIsSchedulePostOpen(true)}
        onOpenPrintTabletop={() => setIsPrintTabletopOpen(true)}
        onExportSinglePNG={() => handleExportSinglePNG(false)}
        onExportAllPNGs={handleExportAllPNGs}
        onCopyCaption={handleCopyCaption}
        onExportJSON={exportCarouselJSON}
        onImportJSON={() => fileInputRef.current?.click()}
        onSave={saveChanges}
        onAddBlock={addBlockToActiveSlide}
        onSetAccentColor={(c) => updateActiveSlide({ accentColor: c })}
        onSelectSlide={setActiveSlideIndex}
        slidesCount={slides.length}
        currentSlideIndex={activeSlideIndex}
      />
    </div>
  );
}
