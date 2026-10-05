'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from '@enjambre/ui';
import {
  type SlideData,
  type SlideBlock,
  type BrandViolation,
  PRESET_MANIFIESTO,
  ARSENAL_EDITORIAL,
  checkBrandCompliance,
  renderSlideToCanvas,
} from './slide-studio-core';

export type SlideStudioTab = 'editor' | 'arsenal' | 'preview';

export interface UseSlideStudioOptions {
  initialSlides?: SlideData[];
}

export function useSlideStudio(options?: UseSlideStudioOptions) {
  const [slides, setSlides] = useState<SlideData[]>(options?.initialSlides ?? PRESET_MANIFIESTO);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<SlideStudioTab>('editor');
  const [arsenalCategoryFilter, setArsenalCategoryFilter] = useState<string>('todos');
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // Detección segura en cliente de Web Share API con soporte para archivos
  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const dummyFile = new File([''], 'test.png', { type: 'image/png' });
        if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [dummyFile] })) {
          setCanShare(true);
        } else {
          setCanShare(true); // Soporte básico de share
        }
      } catch {
        setCanShare(false);
      }
    }
  }, []);

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

  const addBlockToActiveSlide = useCallback(
    (type: SlideBlock['type']) => {
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
      toast.success(`Bloque ${type} agregado a la lámina.`);
    },
    [activeSlide.blocks, updateActiveSlide],
  );

  const handleAddBlankSlide = useCallback(() => {
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
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideIndex(slides.length);
  }, [slides.length]);

  const handleDuplicateSlide = useCallback(() => {
    const clone: SlideData = {
      ...activeSlide,
      id: `slide-copy-${Date.now()}`,
      blocks: (activeSlide.blocks || []).map((b) => ({
        ...b,
        id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      })),
    };
    setSlides((prev) => {
      const updated = [...prev];
      updated.splice(activeSlideIndex + 1, 0, clone);
      return updated;
    });
    setActiveSlideIndex(activeSlideIndex + 1);
  }, [activeSlide, activeSlideIndex]);

  const handleDeleteSlide = useCallback(() => {
    if (slides.length <= 1) {
      toast.error('El carrusel debe contener al menos 1 lámina.');
      return;
    }
    setSlides((prev) => prev.filter((_, idx) => idx !== activeSlideIndex));
    setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
  }, [slides.length, activeSlideIndex]);

  const handleMoveSlide = useCallback(
    (direction: 'left' | 'right') => {
      const targetIdx = direction === 'left' ? activeSlideIndex - 1 : activeSlideIndex + 1;
      if (targetIdx < 0 || targetIdx >= slides.length) return;
      setSlides((prev) => {
        const updated = [...prev];
        const temp = updated[activeSlideIndex];
        updated[activeSlideIndex] = updated[targetIdx];
        updated[targetIdx] = temp;
        return updated;
      });
      setActiveSlideIndex(targetIdx);
    },
    [activeSlideIndex, slides.length],
  );

  const handleInsertArsenalBlock = useCallback(
    (asset: (typeof ARSENAL_EDITORIAL)[number]) => {
      const clonedBlock = JSON.parse(JSON.stringify(asset.block)) as SlideBlock;
      clonedBlock.id = `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const currentBlocks = activeSlide.blocks || [];
      updateActiveSlide({ blocks: [...currentBlocks, clonedBlock] });
      toast.success(`Activo "${asset.titulo}" insertado en la lámina.`);
    },
    [activeSlide.blocks, updateActiveSlide],
  );

  const handleCreateSlideFromArsenal = useCallback(
    (asset: (typeof ARSENAL_EDITORIAL)[number]) => {
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
      setSlides((prev) => [...prev, newSlide]);
      setActiveSlideIndex(slides.length);
      setActiveTab('editor');
      toast.success(`Nueva lámina creada con "${asset.titulo}".`);
    },
    [slides.length],
  );

  const handleLoadPreset = useCallback((preset: SlideData[], name: string) => {
    setSlides(preset);
    setActiveSlideIndex(0);
    toast.success(`Plantilla cargada: ${name}`);
  }, []);

  // Exportar lámina individual vía Web Share API o Descarga directa
  const handleExportSinglePNG = useCallback(
    async (preferShare = false) => {
      try {
        setIsExporting(true);
        const canvas = await renderSlideToCanvas(activeSlide, activeSlideIndex + 1, slides.length);

        canvas.toBlob(async (blob) => {
          if (!blob) {
            toast.error('Error al generar la imagen de la lámina.');
            setIsExporting(false);
            return;
          }

          const filename = `oyz_slide_${String(activeSlideIndex + 1).padStart(2, '0')}.png`;

          // Intentar Web Share si se solicita o está disponible en móvil
          if (preferShare && typeof navigator !== 'undefined' && navigator.share) {
            try {
              const file = new File([blob], filename, { type: 'image/png' });
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                  title: activeSlide.title || 'Lámina Editorial',
                  text: activeSlide.subtitle || 'Origen Soberano · Chiloé 42°S',
                  files: [file],
                });
                setIsExporting(false);
                toast.success('Lámina compartida exitosamente.');
                return;
              }
            } catch (shareErr) {
              if (shareErr instanceof Error && shareErr.name === 'AbortError') {
                setIsExporting(false);
                return; // Usuario canceló el share sheet
              }
              // Fallback a descarga si falla la API
            }
          }

          // Descarga directa tradicional
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
          setIsExporting(false);
          toast.success(`Lámina ${activeSlideIndex + 1} exportada en 1080 × 1350 px.`);
        }, 'image/png');
      } catch {
        setIsExporting(false);
        toast.error('No se pudo procesar la exportación gráfica.');
      }
    },
    [activeSlide, activeSlideIndex, slides.length],
  );

  // Exportar todas las láminas secuencialmente
  const handleExportAllPNGs = useCallback(async () => {
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
            setTimeout(resolve, 320);
          }, 'image/png');
        });
      }
      setIsExporting(false);
      toast.success(`Carrusel completo (${slides.length} láminas) exportado.`);
    } catch {
      setIsExporting(false);
      toast.error('Error durante la descarga del carrusel.');
    }
  }, [slides]);

  // Copiar Caption para Instagram/X
  const handleCopyCaption = useCallback(() => {
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
  }, []);

  const filteredArsenal = useMemo(() => {
    if (arsenalCategoryFilter === 'todos') return ARSENAL_EDITORIAL;
    return ARSENAL_EDITORIAL.filter((a) => a.categoria === arsenalCategoryFilter);
  }, [arsenalCategoryFilter]);

  return {
    slides,
    setSlides,
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
    updateActiveSlide,
    updateBlock,
    removeBlock,
    moveBlock,
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
  };
}
