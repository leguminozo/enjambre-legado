'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Download,
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
} from 'lucide-react';
import { ImmersiveModal, toast, cn } from '@enjambre/ui';
import {
  type SlideData,
  type SlideBlock,
  type BrandViolation,
  PRESET_MANIFIESTO,
  PRESET_ULMO_ESTACIONAL,
  ARSENAL_EDITORIAL,
  checkBrandCompliance,
  renderSlideToCanvas,
} from './slide-studio-core';
import { SlidePreviewCard } from './SlidePreviewCard';

export type { SlideData, SlideBlock };

export interface SocialSlideStudioModalProps {
  open: boolean;
  onClose: () => void;
}

export function SocialSlideStudioModal({ open, onClose }: SocialSlideStudioModalProps) {
  const [slides, setSlides] = useState<SlideData[]>(PRESET_MANIFIESTO);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'editor' | 'arsenal'>('editor');
  const [arsenalCategoryFilter, setArsenalCategoryFilter] = useState<string>('todos');
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const activeSlide = slides[activeSlideIndex] ?? slides[0];

  // Reglas de marca: Silencioso. Solo alertas activas si hay infracciones.
  const brandIssues = useMemo(() => {
    return checkBrandCompliance(activeSlide);
  }, [activeSlide]);

  const updateActiveSlide = useCallback(
    (partial: Partial<SlideData>) => {
      setSlides((prev) => {
        const updated = [...prev];
        if (!updated[activeSlideIndex]) return prev;
        updated[activeSlideIndex] = { ...updated[activeSlideIndex], ...partial };
        return updated;
      });
    },
    [activeSlideIndex],
  );

  const updateBlock = useCallback(
    (blockId: string, updatedBlock: SlideBlock) => {
      const currentBlocks = activeSlide.blocks || [];
      const nextBlocks = currentBlocks.map((b) => (b.id === blockId ? updatedBlock : b));
      updateActiveSlide({ blocks: nextBlocks });
    },
    [activeSlide.blocks, updateActiveSlide],
  );

  const removeBlock = useCallback(
    (blockId: string) => {
      const currentBlocks = activeSlide.blocks || [];
      const nextBlocks = currentBlocks.filter((b) => b.id !== blockId);
      updateActiveSlide({ blocks: nextBlocks });
    },
    [activeSlide.blocks, updateActiveSlide],
  );

  const moveBlock = useCallback(
    (blockIndex: number, direction: 'up' | 'down') => {
      const currentBlocks = [...(activeSlide.blocks || [])];
      const targetIdx = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
      if (targetIdx < 0 || targetIdx >= currentBlocks.length) return;
      const temp = currentBlocks[blockIndex];
      currentBlocks[blockIndex] = currentBlocks[targetIdx];
      currentBlocks[targetIdx] = temp;
      updateActiveSlide({ blocks: currentBlocks });
    },
    [activeSlide.blocks, updateActiveSlide],
  );

  const addBlockToActiveSlide = (type: SlideBlock['type']) => {
    let newBlock: SlideBlock;
    const blockId = `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    switch (type) {
      case 'paragraph':
        newBlock = {
          id: blockId,
          type: 'paragraph',
          header: 'ESTÁNDAR DE EXTRACCIÓN SOBERANA',
          lines: ['Enunciado fáctico comprobable.', 'Detalle analítico de extracción en frío.'],
          accentNote: 'Registro de origen. ->',
        };
        break;
      case 'items':
        newBlock = {
          id: blockId,
          type: 'items',
          items: [
            { title: 'CRITERIO 01', desc: 'Descripción del primer pilar o especie botánica.' },
            { title: 'CRITERIO 02', desc: 'Descripción del segundo pilar o especie botánica.' },
          ],
        };
        break;
      case 'metrics':
        newBlock = {
          id: blockId,
          type: 'metrics',
          items: [
            { label: 'PARÁMETRO 01', value: 'Valor analítico medido según norma Codex.' },
            { label: 'PARÁMETRO 02', value: 'Valor de laboratorio verificado.' },
          ],
        };
        break;
      case 'comparison':
        newBlock = {
          id: blockId,
          type: 'comparison',
          left: {
            tag: '[ESTADO 01]',
            title: 'MIEL CRUDA',
            subtitle: 'Floración Estacional',
            lines: ['Centrifugado en frío.', 'Cristalización espontánea.'],
          },
          right: {
            tag: '[ESTADO 02]',
            title: 'CREMA DE MIEL',
            subtitle: 'Batido en Frío 48h',
            lines: ['Micro-cristalización dirigida.', 'Estructura untuosa permanente.'],
          },
          sharedNote: 'AMBAS PRESENTACIONES MANTIENEN SU FIRMA ENZIMÁTICA INTACTA',
        };
        break;
      case 'portal':
        newBlock = {
          id: blockId,
          type: 'portal',
          url: 'obrerayzangano.cl',
          subtitle: 'Tienda oficial y biblioteca botánica abierta.',
          bullets: [
            'Monografías botánicas de cada floración nativa.',
            'Trazabilidad por código de lote.',
          ],
          callNote: 'ENLACE DIRECTO EN LA BIOGRAFÍA ->',
        };
        break;
      case 'quote':
        newBlock = {
          id: blockId,
          type: 'quote',
          quote: 'La miel cruda es la memoria biológica y química del bosque nativo.',
          attribution: 'Registro Territorial de Chiloé',
        };
        break;
    }

    const currentBlocks = activeSlide.blocks || [];
    updateActiveSlide({ blocks: [...currentBlocks, newBlock] });
    toast.success(`Bloque ${type} agregado.`);
  };

  const handleAddBlankSlide = () => {
    const newSlide: SlideData = {
      id: `slide-${Date.now()}`,
      badge: 'NUEVA LÁMINA EDITORIAL',
      kickerLeft: 'ORIGEN SOBERANO',
      kickerRight: 'CHILOÉ · 42°S',
      title: 'Título de la nueva lámina editorial.',
      subtitle: 'Bajada descriptiva en tipografía Cormorant Garamond.',
      blocks: [
        {
          id: `b_${Date.now()}`,
          type: 'paragraph',
          header: 'ESTÁNDAR DE ORIGEN',
          lines: ['Enunciado fáctico comprobable de la maestría apícola.'],
        },
      ],
      footerLeft: 'obrerayzangano.cl',
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  const handleDuplicateSlide = () => {
    const clone: SlideData = {
      ...activeSlide,
      id: `slide-copy-${Date.now()}`,
      blocks: (activeSlide.blocks || []).map((b) => ({
        ...b,
        id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      })),
    };
    const updated = [...slides];
    updated.splice(activeSlideIndex + 1, 0, clone);
    setSlides(updated);
    setActiveSlideIndex(activeSlideIndex + 1);
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) {
      toast.error('El carrusel debe contener al menos 1 lámina.');
      return;
    }
    const updated = slides.filter((_, idx) => idx !== activeSlideIndex);
    setSlides(updated);
    setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
  };

  const handleMoveSlide = (direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? activeSlideIndex - 1 : activeSlideIndex + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;
    const updated = [...slides];
    const temp = updated[activeSlideIndex];
    updated[activeSlideIndex] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSlides(updated);
    setActiveSlideIndex(targetIdx);
  };

  const handleInsertArsenalBlock = (asset: (typeof ARSENAL_EDITORIAL)[number]) => {
    const clonedBlock = JSON.parse(JSON.stringify(asset.block)) as SlideBlock;
    clonedBlock.id = `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const currentBlocks = activeSlide.blocks || [];
    updateActiveSlide({ blocks: [...currentBlocks, clonedBlock] });
    toast.success(`Activo "${asset.titulo}" insertado en la lámina.`);
  };

  const handleCreateSlideFromArsenal = (asset: (typeof ARSENAL_EDITORIAL)[number]) => {
    const newSlide: SlideData = {
      id: `slide-arsenal-${Date.now()}`,
      kickerLeft: asset.kickerLeft,
      kickerRight: asset.kickerRight,
      badge: asset.badge,
      title: asset.tituloSlide,
      subtitle: asset.subtituloSlide,
      blocks: [JSON.parse(JSON.stringify(asset.block))],
      footerLeft: 'obrerayzangano.cl',
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
    setActiveTab('editor');
    toast.success(`Nueva lámina creada con "${asset.titulo}".`);
  };

  const handleExportSinglePNG = async () => {
    try {
      setIsExporting(true);
      const canvas = await renderSlideToCanvas(activeSlide, activeSlideIndex + 1, slides.length);
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Error al generar la imagen de la lámina.');
          setIsExporting(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `oyz_slide_${String(activeSlideIndex + 1).padStart(2, '0')}.png`;
        link.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        toast.success(`Lámina ${activeSlideIndex + 1} exportada en 1080 × 1350 px.`);
      }, 'image/png');
    } catch {
      setIsExporting(false);
      toast.error('No se pudo procesar la exportación.');
    }
  };

  const handleExportAllPNGs = async () => {
    try {
      setIsExporting(true);
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const canvas = await renderSlideToCanvas(slide, i + 1, slides.length);
        await new Promise<void>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `oyz_slide_${String(i + 1).padStart(2, '0')}.png`;
              link.click();
              URL.revokeObjectURL(url);
            }
            setTimeout(resolve, 300);
          }, 'image/png');
        });
      }
      setIsExporting(false);
      toast.success(`Carrusel completo (${slides.length} láminas) exportado.`);
    } catch {
      setIsExporting(false);
      toast.error('Error durante la descarga del carrusel.');
    }
  };

  const handleCopyCaption = () => {
    const caption = [
      'La miel cruda no es un producto estandarizado: es la memoria biológica y química del bosque nativo de Chiloé.',
      '',
      'Desde 2004 en el paralelo 42° Sur, documentamos y analizamos cada recolección estacional bajo normas auditables de pureza:',
      '• 0% pasteurización térmica (< 35 °C en todo el ciclo).',
      '• Actividad enzimática (diastasa e invertasa) intacta certificada por laboratorio.',
      '• Filtrado mecánico grueso que retiene cera virgen y polen nativo.',
      '• Trazabilidad por código de lote y balance de cuenca forestal.',
      '',
      'En obrerayzangano.cl puedes acceder al registro analítico completo, monografías botánicas y a la asignación de Miel Cruda y Crema de Miel batida en frío.',
      '',
      '#LaObreraYElZangano #Chiloe #MielCruda #PurezaDeOrigen #SelvaValdiviana #EstandarDeOrigen',
    ].join('\n');

    navigator.clipboard.writeText(caption);
    setIsCopied(true);
    toast.success('Caption editorial copiado.');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const filteredArsenal = useMemo(() => {
    if (arsenalCategoryFilter === 'todos') return ARSENAL_EDITORIAL;
    return ARSENAL_EDITORIAL.filter((a) => a.categoria === arsenalCategoryFilter);
  }, [arsenalCategoryFilter]);

  if (!open) return null;

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      title="Estudio Editorial RRSS"
      eyebrow="FORMATO 4:5 (1080×1350 PX)"
      size="full"
    >
      <div className="space-y-6">

        {/* Barra superior de presets y acciones */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-border bg-card/60">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-mono text-muted-foreground mr-1">
              Plantillas:
            </span>
            <button
              type="button"
              className="btn btn-outline btn-xs h-7 px-2.5 text-xs"
              onClick={() => {
                setSlides(PRESET_MANIFIESTO);
                setActiveSlideIndex(0);
                toast.success('Preset Manifiesto cargado.');
              }}
            >
              Manifiesto (6)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-xs h-7 px-2.5 text-xs"
              onClick={() => {
                setSlides(PRESET_ULMO_ESTACIONAL);
                setActiveSlideIndex(0);
                toast.success('Preset Ulmo cargado.');
              }}
            >
              Ulmo (3)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-xs h-7 text-xs flex items-center gap-1.5"
              onClick={handleCopyCaption}
            >
              {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              Caption
            </button>
            <button
              type="button"
              disabled={isExporting}
              className="btn btn-outline btn-xs h-7 text-xs flex items-center gap-1.5"
              onClick={handleExportSinglePNG}
            >
              <Download size={13} />
              PNG Actual
            </button>
            <button
              type="button"
              disabled={isExporting}
              className="btn btn-primary btn-xs h-7 text-xs flex items-center gap-1.5"
              onClick={handleExportAllPNGs}
            >
              <Layers size={13} />
              {isExporting ? 'Generando...' : `Todo (${slides.length})`}
            </button>
          </div>
        </div>

        {/* Alerta de Marca Silenciosa */}
        {brandIssues.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1 text-xs">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <AlertTriangle size={14} />
              <span>Ajuste editorial sugerido ({brandIssues.length})</span>
            </div>
            {brandIssues.map((issue: BrandViolation, idx: number) => (
              <div key={idx} className="text-[11px] text-amber-200/90 pl-5">
                • {issue.message} 👉 {issue.correction}
              </div>
            ))}
          </div>
        )}

        {/* Secuencia filmstrip */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 border-b border-border/60">
          <div className="flex items-center gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => setActiveSlideIndex(idx)}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-xs font-mono transition-all shrink-0 flex items-center gap-1.5',
                  activeSlideIndex === idx
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border bg-card text-muted-foreground',
                )}
              >
                <span>{String(idx + 1).padStart(2, '0')}</span>
                <span className="text-[10px] opacity-75 truncate max-w-[80px]">
                  {s.kickerLeft || 'Lámina'}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={handleAddBlankSlide}
              className="px-2.5 py-1.5 rounded-lg border border-dashed border-border text-xs font-mono text-muted-foreground hover:text-foreground shrink-0 flex items-center gap-1"
            >
              <Plus size={12} />
              <span>Nueva</span>
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              disabled={activeSlideIndex === 0}
              onClick={() => handleMoveSlide('left')}
              className="btn btn-ghost btn-xs h-7 w-7 p-0"
            >
              <ArrowLeft size={13} />
            </button>
            <button
              type="button"
              disabled={activeSlideIndex === slides.length - 1}
              onClick={() => handleMoveSlide('right')}
              className="btn btn-ghost btn-xs h-7 w-7 p-0"
            >
              <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={handleDuplicateSlide}
              className="btn btn-ghost btn-xs h-7 w-7 p-0"
            >
              <Copy size={13} />
            </button>
            <button
              type="button"
              disabled={slides.length <= 1}
              onClick={handleDeleteSlide}
              className="btn btn-ghost btn-xs h-7 w-7 p-0 text-destructive"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Editor vs Arsenal y Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                  activeTab === 'editor'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Wrench size={13} />
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('arsenal')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                  activeTab === 'arsenal'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <BookOpen size={13} />
                Arsenal ({ARSENAL_EDITORIAL.length})
              </button>
            </div>

            {activeTab === 'editor' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Kicker Izq"
                      className="input-field w-full text-xs font-mono"
                      value={activeSlide.kickerLeft}
                      onChange={(e) => updateActiveSlide({ kickerLeft: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Kicker Der"
                      className="input-field w-full text-xs font-mono"
                      value={activeSlide.kickerRight}
                      onChange={(e) => updateActiveSlide({ kickerRight: e.target.value })}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Badge"
                    className="input-field w-full text-xs font-mono"
                    value={activeSlide.badge}
                    onChange={(e) => updateActiveSlide({ badge: e.target.value })}
                  />
                  <textarea
                    rows={2}
                    placeholder="Título"
                    className="input-field w-full text-sm font-existencial"
                    value={activeSlide.title}
                    onChange={(e) => updateActiveSlide({ title: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Subtítulo"
                    className="input-field w-full text-xs"
                    value={activeSlide.subtitle ?? ''}
                    onChange={(e) => updateActiveSlide({ subtitle: e.target.value })}
                  />
                </div>

                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <span className="text-xs uppercase font-mono text-muted-foreground block font-semibold">
                    Bloques Modulares ({activeSlide.blocks?.length || 0})
                  </span>

                  <div className="space-y-3">
                    {activeSlide.blocks?.map((block, idx) => (
                      <div
                        key={block.id}
                        className="p-3 rounded-lg border border-border bg-surface-sunken/40 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-primary font-semibold">
                            {idx + 1}. {block.type}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveBlock(idx, 'up')}
                              className="btn btn-ghost btn-xs h-5 w-5 p-0"
                            >
                              <ChevronUp size={11} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === (activeSlide.blocks?.length || 1) - 1}
                              onClick={() => moveBlock(idx, 'down')}
                              className="btn btn-ghost btn-xs h-5 w-5 p-0"
                            >
                              <ChevronDown size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeBlock(block.id)}
                              className="btn btn-ghost btn-xs h-5 w-5 p-0 text-destructive"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Edición básica por tipo */}
                        {block.type === 'paragraph' && (
                          <textarea
                            rows={3}
                            className="input-field w-full text-xs"
                            value={block.lines.join('\n')}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                ...block,
                                lines: e.target.value.split('\n'),
                              })
                            }
                          />
                        )}
                        {block.type === 'portal' && (
                          <input
                            type="text"
                            className="input-field w-full text-xs font-mono"
                            value={block.url}
                            onChange={(e) =>
                              updateBlock(block.id, { ...block, url: e.target.value })
                            }
                          />
                        )}
                        {block.type === 'quote' && (
                          <input
                            type="text"
                            className="input-field w-full text-xs font-existencial"
                            value={block.quote}
                            onChange={(e) =>
                              updateBlock(block.id, { ...block, quote: e.target.value })
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('paragraph')}
                      className="btn btn-outline btn-xs h-7 text-[11px]"
                    >
                      + Párrafo
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('items')}
                      className="btn btn-outline btn-xs h-7 text-[11px]"
                    >
                      + Lista
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('metrics')}
                      className="btn btn-outline btn-xs h-7 text-[11px]"
                    >
                      + Métricas
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('comparison')}
                      className="btn btn-outline btn-xs h-7 text-[11px]"
                    >
                      + Fases
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('portal')}
                      className="btn btn-outline btn-xs h-7 text-[11px]"
                    >
                      + Portal
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('quote')}
                      className="btn btn-outline btn-xs h-7 text-[11px]"
                    >
                      + Cita
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'arsenal' && (
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex flex-wrap gap-1">
                  {['todos', 'doctrina', 'laboratorio', 'botanica', 'fases', 'portal'].map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setArsenalCategoryFilter(cat)}
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-mono uppercase',
                          arsenalCategoryFilter === cat
                            ? 'bg-primary text-primary-foreground font-semibold'
                            : 'bg-surface-sunken text-muted-foreground',
                        )}
                      >
                        {cat}
                      </button>
                    ),
                  )}
                </div>

                <div className="space-y-2 pt-1 max-h-[360px] overflow-y-auto">
                  {filteredArsenal.map((asset) => (
                    <div
                      key={asset.id}
                      className="p-2.5 rounded-lg border border-border bg-surface-sunken/40 space-y-1.5"
                    >
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span>{asset.titulo}</span>
                        <span className="text-[9px] font-mono uppercase text-primary">
                          {asset.categoria}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{asset.descripcion}</p>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleInsertArsenalBlock(asset)}
                          className="btn btn-outline btn-xs h-6 text-[10px]"
                        >
                          Insertar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateSlideFromArsenal(asset)}
                          className="btn btn-primary btn-xs h-6 text-[10px]"
                        >
                          + Lámina
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center p-2">
            <SlidePreviewCard
              slide={activeSlide}
              index={activeSlideIndex}
              total={slides.length}
            />
          </div>
        </div>
      </div>
    </ImmersiveModal>
  );
}
