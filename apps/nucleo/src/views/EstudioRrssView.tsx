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
  ExternalLink,
} from 'lucide-react';
import { toast, cn } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import {
  type SlideData,
  type SlideBlock,
  type BrandViolation,
  PRESET_MANIFIESTO,
  PRESET_ULMO_ESTACIONAL,
  ARSENAL_EDITORIAL,
  checkBrandCompliance,
  renderSlideToCanvas,
} from '@/components/marketing/slide-studio-core';
import { SlidePreviewCard } from '@/components/marketing/SlidePreviewCard';

export function EstudioRrssView() {
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

  // Actualizador inmutable de la lámina activa
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

  // Manejo de bloques de la lámina activa
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
          lines: [
            'Enunciado fáctico comprobable.',
            'Detalle analítico de extracción en frío.',
          ],
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
    toast.success(`Bloque ${type} agregado a la lámina.`);
  };

  // Acciones sobre láminas
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
      blocks: (activeSlide.blocks || []).map((b) => ({ ...b, id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` })),
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

  // Inyección desde el Arsenal de Marca (Mina de Oro)
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

  // Exportar PNG individual
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
      toast.error('No se pudo procesar la exportación gráfica.');
    }
  };

  // Exportar todas las láminas
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

  // Copiar Caption para Instagram/X
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

  return (
    <div className="space-y-6 animate-in">
      {/* Cabecera del módulo */}
      <ViewShell
        title="Estudio RRSS"
        subtitle="Entorno editorial para construcción abstracta de láminas 4:5 (1080×1350 px) y exportación directa"
      />

      {/* Barra de presets y acciones principales */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-mono text-muted-foreground mr-1">
            Plantillas:
          </span>
          <button
            type="button"
            className="btn btn-outline btn-xs h-8 px-3"
            onClick={() => {
              setSlides(PRESET_MANIFIESTO);
              setActiveSlideIndex(0);
              toast.success('Preset: Manifiesto Científico (6 láminas) cargado.');
            }}
          >
            Manifiesto Científico (6)
          </button>
          <button
            type="button"
            className="btn btn-outline btn-xs h-8 px-3"
            onClick={() => {
              setSlides(PRESET_ULMO_ESTACIONAL);
              setActiveSlideIndex(0);
              toast.success('Preset: Recolección Ulmo (3 láminas) cargado.');
            }}
          >
            Recolección Ulmo (3)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm flex items-center gap-1.5"
            onClick={handleCopyCaption}
          >
            {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            Copiar Caption
          </button>
          <button
            type="button"
            disabled={isExporting}
            className="btn btn-outline btn-sm flex items-center gap-1.5"
            onClick={handleExportSinglePNG}
          >
            <Download size={14} />
            Lámina Actual (PNG)
          </button>
          <button
            type="button"
            disabled={isExporting}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            onClick={handleExportAllPNGs}
          >
            <Layers size={14} />
            {isExporting ? 'Generando...' : `Carrusel Completo (${slides.length})`}
          </button>
        </div>
      </div>

      {/* Alerta de Marca Silenciosa (SOLO se muestra si hay infracción real) */}
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

      {/* Secuencia de Láminas (Filmstrip) */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
            Secuencia del Carrusel ({slides.length} láminas)
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={activeSlideIndex === 0}
              onClick={() => handleMoveSlide('left')}
              className="btn btn-ghost btn-xs h-7 px-2"
              title="Mover lámina a la izquierda"
            >
              <ArrowLeft size={13} />
            </button>
            <button
              type="button"
              disabled={activeSlideIndex === slides.length - 1}
              onClick={() => handleMoveSlide('right')}
              className="btn btn-ghost btn-xs h-7 px-2"
              title="Mover lámina a la derecha"
            >
              <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={handleDuplicateSlide}
              className="btn btn-ghost btn-xs h-7 px-2"
              title="Duplicar lámina actual"
            >
              <Copy size={13} />
            </button>
            <button
              type="button"
              disabled={slides.length <= 1}
              onClick={handleDeleteSlide}
              className="btn btn-ghost btn-xs h-7 px-2 text-destructive hover:text-destructive"
              title="Eliminar lámina actual"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {slides.map((s, idx) => (
            <button
              key={s.id || idx}
              type="button"
              onClick={() => setActiveSlideIndex(idx)}
              className={cn(
                'px-3.5 py-2 rounded-xl border text-xs font-mono transition-all shrink-0 flex items-center gap-2',
                activeSlideIndex === idx
                  ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/10'
                  : 'border-border bg-card hover:bg-surface-raised text-muted-foreground',
              )}
            >
              <span className="font-bold">{String(idx + 1).padStart(2, '0')}</span>
              <span className="text-[10px] opacity-75 truncate max-w-[100px]">
                {s.kickerLeft || 'Lámina'}
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={handleAddBlankSlide}
            className="px-3 py-2 rounded-xl border border-dashed border-border hover:border-primary/50 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Plus size={13} />
            <span>Añadir Lámina</span>
          </button>
        </div>
      </div>

      {/* Área de trabajo en 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.18fr_0.82fr] gap-6 items-start">
        {/* Columna Izquierda: Tabs de Herramientas vs Arsenal */}
        <div className="space-y-4">
          {/* Navegación por Pestañas */}
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors',
                activeTab === 'editor'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Wrench size={14} />
              Editor de Lámina (Picos y Clavos)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('arsenal')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors',
                activeTab === 'arsenal'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <BookOpen size={14} />
              Arsenal de Marca (Mina de Oro)
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/20 text-primary">
                {ARSENAL_EDITORIAL.length}
              </span>
            </button>
          </div>

          {/* TAB 1: EDITOR DE LÁMINA */}
          {activeTab === 'editor' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Encabezados y Metadatos */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <span className="text-xs uppercase tracking-wider font-mono text-muted-foreground block font-semibold">
                  1. Encabezados & Metadatos
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                      Kicker Izquierdo (Categoría / Cuenca)
                    </label>
                    <input
                      type="text"
                      className="input-field w-full text-xs font-mono"
                      value={activeSlide.kickerLeft}
                      onChange={(e) => updateActiveSlide({ kickerLeft: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                      Kicker Derecho (Anclaje Histórico)
                    </label>
                    <input
                      type="text"
                      className="input-field w-full text-xs font-mono"
                      value={activeSlide.kickerRight}
                      onChange={(e) => updateActiveSlide({ kickerRight: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                    Insignia Superior (Badge)
                  </label>
                  <input
                    type="text"
                    className="input-field w-full text-xs font-mono"
                    value={activeSlide.badge}
                    onChange={(e) => updateActiveSlide({ badge: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                    Título Principal (Cormorant Garamond)
                  </label>
                  <textarea
                    rows={2}
                    className="input-field w-full text-sm font-existencial"
                    value={activeSlide.title}
                    onChange={(e) => updateActiveSlide({ title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                    Subtítulo / Bajada Descriptiva
                  </label>
                  <input
                    type="text"
                    className="input-field w-full text-xs"
                    value={activeSlide.subtitle ?? ''}
                    onChange={(e) => updateActiveSlide({ subtitle: e.target.value })}
                  />
                </div>
              </div>

              {/* Bloques Modulares Activos */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-mono text-muted-foreground block font-semibold">
                    2. Bloques Modulares ({activeSlide.blocks?.length || 0})
                  </span>
                </div>

                {/* Lista de bloques editables */}
                <div className="space-y-4">
                  {activeSlide.blocks && activeSlide.blocks.length > 0 ? (
                    activeSlide.blocks.map((block: SlideBlock, blockIdx: number) => (
                      <div
                        key={block.id}
                        className="rounded-xl border border-border bg-surface-sunken/40 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                          <span className="text-xs font-mono uppercase text-primary font-semibold flex items-center gap-1.5">
                            Bloque {String(blockIdx + 1).padStart(2, '0')}: {block.type}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={blockIdx === 0}
                              onClick={() => moveBlock(blockIdx, 'up')}
                              className="btn btn-ghost btn-xs h-6 w-6 p-0"
                              title="Subir bloque"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={blockIdx === activeSlide.blocks.length - 1}
                              onClick={() => moveBlock(blockIdx, 'down')}
                              className="btn btn-ghost btn-xs h-6 w-6 p-0"
                              title="Bajar bloque"
                            >
                              <ChevronDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeBlock(block.id)}
                              className="btn btn-ghost btn-xs h-6 w-6 p-0 text-destructive hover:text-destructive"
                              title="Eliminar bloque"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Editor de campos según el tipo de bloque */}
                        <BlockEditor block={block} onChange={(ub) => updateBlock(block.id, ub)} />
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                      No hay bloques en esta lámina. Usa los botones de abajo para añadir uno.
                    </div>
                  )}
                </div>

                {/* Barra de adición de nuevos bloques (Picos y Clavos) */}
                <div className="pt-2">
                  <span className="text-[11px] font-mono text-muted-foreground uppercase block mb-2">
                    + Añadir Bloque Modular:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('paragraph')}
                      className="btn btn-outline btn-xs h-8 text-[11px] flex items-center gap-1.5 justify-start"
                    >
                      <Plus size={12} /> Párrafo / Manifiesto
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('items')}
                      className="btn btn-outline btn-xs h-8 text-[11px] flex items-center gap-1.5 justify-start"
                    >
                      <Plus size={12} /> Lista de Criterios
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('metrics')}
                      className="btn btn-outline btn-xs h-8 text-[11px] flex items-center gap-1.5 justify-start"
                    >
                      <Plus size={12} /> Métricas de Lab
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('comparison')}
                      className="btn btn-outline btn-xs h-8 text-[11px] flex items-center gap-1.5 justify-start"
                    >
                      <Plus size={12} /> Comparativa (Fases)
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('portal')}
                      className="btn btn-outline btn-xs h-8 text-[11px] flex items-center gap-1.5 justify-start"
                    >
                      <Plus size={12} /> Portal Soberano
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('quote')}
                      className="btn btn-outline btn-xs h-8 text-[11px] flex items-center gap-1.5 justify-start"
                    >
                      <Plus size={12} /> Cita / Axioma
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ARSENAL DE MARCA (MINA DE ORO) */}
          {activeTab === 'arsenal' && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider font-mono text-muted-foreground block font-semibold">
                  Arsenal Canónico de Marca
                </span>
                <p className="text-xs text-muted-foreground">
                  Fragmentos y declaraciones ontológicas pre-auditadas. Inserta bloques directamente en la lámina activa o crea nuevas láminas.
                </p>
              </div>

              {/* Filtros de categoría */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['todos', 'doctrina', 'laboratorio', 'botanica', 'fases', 'portal'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setArsenalCategoryFilter(cat)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-mono uppercase transition-colors',
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
                {filteredArsenal.map((asset) => (
                  <div
                    key={asset.id}
                    className="p-3.5 rounded-xl border border-border bg-surface-sunken/40 space-y-2 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        {asset.titulo}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        {asset.categoria}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">{asset.descripcion}</p>

                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleInsertArsenalBlock(asset)}
                        className="btn btn-outline btn-xs h-7 text-xs flex items-center gap-1.5"
                      >
                        <Plus size={12} /> Insertar en Lámina Actual
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreateSlideFromArsenal(asset)}
                        className="btn btn-primary btn-xs h-7 text-xs flex items-center gap-1.5"
                      >
                        <Sparkles size={12} /> + Crear Nueva Lámina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Vista Previa Fija en Vivo (4:5) */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-primary" />
                <span className="text-xs uppercase tracking-widest font-mono text-muted-foreground">
                  Vista Previa en Vivo (4:5)
                </span>
              </div>
              <span className="text-[11px] font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                {String(activeSlideIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
            </div>

            {/* Lienzo visual DOM 4:5 compartido */}
            <div className="flex items-center justify-center py-2">
              <SlidePreviewCard
                slide={activeSlide}
                index={activeSlideIndex}
                total={slides.length}
              />
            </div>

            {/* Ficha técnica compacta */}
            <div className="pt-2 border-t border-border/60 text-[11px] font-mono text-muted-foreground flex justify-between">
              <span>Resolución: 1080 × 1350 px</span>
              <span>Proporción: 4:5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponente Editor de Bloque
function BlockEditor({
  block,
  onChange,
}: {
  block: SlideBlock;
  onChange: (b: SlideBlock) => void;
}) {
  switch (block.type) {
    case 'paragraph':
      return (
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-mono text-muted-foreground block mb-0.5">
              Encabezado del Párrafo (Mono)
            </label>
            <input
              type="text"
              className="input-field w-full text-xs font-mono"
              value={block.header ?? ''}
              onChange={(e) => onChange({ ...block, header: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted-foreground block mb-0.5">
              Líneas del Párrafo (un renglón por línea)
            </label>
            <textarea
              rows={4}
              className="input-field w-full text-xs"
              value={block.lines.join('\n')}
              onChange={(e) => onChange({ ...block, lines: e.target.value.split('\n') })}
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted-foreground block mb-0.5">
              Nota de Cierre / Flecha
            </label>
            <input
              type="text"
              className="input-field w-full text-xs font-mono"
              value={block.accentNote ?? ''}
              onChange={(e) => onChange({ ...block, accentNote: e.target.value })}
            />
          </div>
        </div>
      );

    case 'items':
      return (
        <div className="space-y-2">
          <div className="space-y-2">
            {block.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Título (ej. DESDE 2004)"
                  className="input-field w-full text-xs font-mono"
                  value={item.title}
                  onChange={(e) => {
                    const next = [...block.items];
                    next[idx] = { ...next[idx], title: e.target.value };
                    onChange({ ...block, items: next });
                  }}
                />
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Descripción"
                    className="input-field w-full text-xs"
                    value={item.desc}
                    onChange={(e) => {
                      const next = [...block.items];
                      next[idx] = { ...next[idx], desc: e.target.value };
                      onChange({ ...block, items: next });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = block.items.filter((_, i) => i !== idx);
                      onChange({ ...block, items: next });
                    }}
                    className="btn btn-ghost btn-xs text-destructive p-1"
                    title="Eliminar ítem"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...block,
                items: [...block.items, { title: 'NUEVO CRITERIO', desc: 'Descripción del criterio' }],
              })
            }
            className="btn btn-outline btn-xs h-7 text-[11px] flex items-center gap-1"
          >
            <Plus size={11} /> Añadir Ítem
          </button>
        </div>
      );

    case 'metrics':
      return (
        <div className="space-y-2">
          <div className="space-y-2">
            {block.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Parámetro (ej. TEMPERATURA)"
                  className="input-field w-full text-xs font-mono"
                  value={item.label}
                  onChange={(e) => {
                    const next = [...block.items];
                    next[idx] = { ...next[idx], label: e.target.value };
                    onChange({ ...block, items: next });
                  }}
                />
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Valor analítico"
                    className="input-field w-full text-xs"
                    value={item.value}
                    onChange={(e) => {
                      const next = [...block.items];
                      next[idx] = { ...next[idx], value: e.target.value };
                      onChange({ ...block, items: next });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = block.items.filter((_, i) => i !== idx);
                      onChange({ ...block, items: next });
                    }}
                    className="btn btn-ghost btn-xs text-destructive p-1"
                    title="Eliminar métrica"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...block,
                items: [...block.items, { label: 'PARÁMETRO', value: 'Valor de laboratorio' }],
              })
            }
            className="btn btn-outline btn-xs h-7 text-[11px] flex items-center gap-1"
          >
            <Plus size={11} /> Añadir Parámetro
          </button>
        </div>
      );

    case 'comparison':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Panel Izquierdo */}
            <div className="p-3 rounded-lg border border-border bg-card space-y-2">
              <span className="text-[10px] font-mono text-primary block font-semibold">
                Panel Izquierdo
              </span>
              <input
                type="text"
                placeholder="Tag (ej. [ESTADO 01])"
                className="input-field w-full text-xs font-mono"
                value={block.left.tag}
                onChange={(e) =>
                  onChange({ ...block, left: { ...block.left, tag: e.target.value } })
                }
              />
              <input
                type="text"
                placeholder="Título"
                className="input-field w-full text-xs font-existencial"
                value={block.left.title}
                onChange={(e) =>
                  onChange({ ...block, left: { ...block.left, title: e.target.value } })
                }
              />
              <textarea
                rows={3}
                placeholder="Líneas descriptivas"
                className="input-field w-full text-xs"
                value={block.left.lines.join('\n')}
                onChange={(e) =>
                  onChange({ ...block, left: { ...block.left, lines: e.target.value.split('\n') } })
                }
              />
            </div>

            {/* Panel Derecho */}
            <div className="p-3 rounded-lg border border-border bg-card space-y-2">
              <span className="text-[10px] font-mono text-primary block font-semibold">
                Panel Derecho
              </span>
              <input
                type="text"
                placeholder="Tag (ej. [ESTADO 02])"
                className="input-field w-full text-xs font-mono"
                value={block.right.tag}
                onChange={(e) =>
                  onChange({ ...block, right: { ...block.right, tag: e.target.value } })
                }
              />
              <input
                type="text"
                placeholder="Título"
                className="input-field w-full text-xs font-existencial"
                value={block.right.title}
                onChange={(e) =>
                  onChange({ ...block, right: { ...block.right, title: e.target.value } })
                }
              />
              <textarea
                rows={3}
                placeholder="Líneas descriptivas"
                className="input-field w-full text-xs"
                value={block.right.lines.join('\n')}
                onChange={(e) =>
                  onChange({ ...block, right: { ...block.right, lines: e.target.value.split('\n') } })
                }
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted-foreground block mb-0.5">
              Nota Compartida al Pie
            </label>
            <input
              type="text"
              className="input-field w-full text-xs font-mono"
              value={block.sharedNote ?? ''}
              onChange={(e) => onChange({ ...block, sharedNote: e.target.value })}
            />
          </div>
        </div>
      );

    case 'portal':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="URL (obrerayzangano.cl)"
              className="input-field w-full text-xs font-mono"
              value={block.url}
              onChange={(e) => onChange({ ...block, url: e.target.value })}
            />
            <input
              type="text"
              placeholder="Subtítulo del portal"
              className="input-field w-full text-xs"
              value={block.subtitle}
              onChange={(e) => onChange({ ...block, subtitle: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted-foreground block mb-0.5">
              Puntos del portal (uno por línea)
            </label>
            <textarea
              rows={3}
              className="input-field w-full text-xs"
              value={block.bullets.join('\n')}
              onChange={(e) => onChange({ ...block, bullets: e.target.value.split('\n') })}
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted-foreground block mb-0.5">
              Llamado al pie
            </label>
            <input
              type="text"
              className="input-field w-full text-xs font-mono"
              value={block.callNote ?? ''}
              onChange={(e) => onChange({ ...block, callNote: e.target.value })}
            />
          </div>
        </div>
      );

    case 'quote':
      return (
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-mono text-muted-foreground block mb-0.5">
              Cita Textual
            </label>
            <textarea
              rows={3}
              className="input-field w-full text-xs font-existencial"
              value={block.quote}
              onChange={(e) => onChange({ ...block, quote: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted-foreground block mb-0.5">
              Atribución
            </label>
            <input
              type="text"
              className="input-field w-full text-xs font-mono"
              value={block.attribution ?? ''}
              onChange={(e) => onChange({ ...block, attribution: e.target.value })}
            />
          </div>
        </div>
      );
  }
}
