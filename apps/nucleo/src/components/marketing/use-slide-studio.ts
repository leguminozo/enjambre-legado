'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from '@enjambre/ui';
import {
  type SlideData,
  type SlideBlock,
  type BrandViolation,
  type SlideTitleSize,
  type SlideAlignment,
  PRESET_MANIFIESTO,
  ARSENAL_EDITORIAL,
  checkBrandCompliance,
  renderSlideToCanvas,
} from './slide-studio-core';

export const STORAGE_KEY_CURRENT = 'enj_slide_studio_current_v1';
export const STORAGE_KEY_DRAFTS = 'enj_slide_studio_drafts_v1';

export type SlideStudioTab = 'editor' | 'arsenal' | 'preview';

export interface SavedDraft {
  id: string;
  name: string;
  updatedAt: string;
  slidesCount: number;
  slides: SlideData[];
}

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

  // Estados de persistencia y guardado
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);

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

  // Carga inicial desde localStorage de borradores y sesión activa
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const rawDrafts = localStorage.getItem(STORAGE_KEY_DRAFTS);
      if (rawDrafts) {
        const parsedDrafts = JSON.parse(rawDrafts) as SavedDraft[];
        if (Array.isArray(parsedDrafts)) {
          setSavedDrafts(parsedDrafts);
        }
      }

      // Si no se pasaron láminas iniciales explícitas por props, recuperar el borrador activo guardado
      if (!options?.initialSlides) {
        const rawCurrent = localStorage.getItem(STORAGE_KEY_CURRENT);
        if (rawCurrent) {
          const parsedCurrent = JSON.parse(rawCurrent) as { updatedAt: string; slides: SlideData[] };
          if (Array.isArray(parsedCurrent.slides) && parsedCurrent.slides.length > 0) {
            setSlides(parsedCurrent.slides);
            if (parsedCurrent.updatedAt) {
              const date = new Date(parsedCurrent.updatedAt);
              setLastSavedAt(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
          }
        }
      }
    } catch {
      // Ignorar fallback si falla lectura local
    }
  }, [options?.initialSlides]);

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
      setHasUnsavedChanges(true);
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
      footerRight: '',
    };
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideIndex(slides.length);
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
  }, [activeSlide, activeSlideIndex]);

  const handleDeleteSlide = useCallback(() => {
    if (slides.length <= 1) {
      toast.error('El carrusel debe contener al menos 1 lámina.');
      return;
    }
    setSlides((prev) => prev.filter((_, idx) => idx !== activeSlideIndex));
    setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
    setHasUnsavedChanges(true);
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
      setHasUnsavedChanges(true);
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
      setHasUnsavedChanges(true);
      toast.success(`Nueva lámina creada con "${asset.titulo}".`);
    },
    [slides.length],
  );

  const handleLoadPreset = useCallback((preset: SlideData[], name: string) => {
    setSlides(preset);
    setActiveSlideIndex(0);
    setHasUnsavedChanges(true);
    toast.success(`Plantilla cargada: ${name}`);
  }, []);

  const applyFooterLeftToAllSlides = useCallback((footerText: string) => {
    setSlides((prev) => prev.map((s) => ({ ...s, footerLeft: footerText })));
    setHasUnsavedChanges(true);
    toast.success('Pie izquierdo actualizado en todas las láminas del carrusel.');
  }, []);

  const applyStyleToAllSlides = useCallback(
    (style: { accentColor?: string; titleSize?: SlideTitleSize; alignment?: SlideAlignment }) => {
      setSlides((prev) =>
        prev.map((s) => ({
          ...s,
          ...(style.accentColor !== undefined ? { accentColor: style.accentColor } : {}),
          ...(style.titleSize !== undefined ? { titleSize: style.titleSize } : {}),
          ...(style.alignment !== undefined ? { alignment: style.alignment } : {}),
        })),
      );
      setHasUnsavedChanges(true);
      toast.success('Estilo visual aplicado a todas las láminas.');
    },
    [],
  );

  // Guardar cambios con 1 solo clic / atajo
  const saveChanges = useCallback(
    (customName?: string) => {
      try {
        setIsSaving(true);
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // 1. Guardar estado activo en localStorage
        localStorage.setItem(
          STORAGE_KEY_CURRENT,
          JSON.stringify({
            updatedAt: now.toISOString(),
            slides,
          }),
        );

        // 2. Archivar en historial de borradores
        const draftTitle =
          customName?.trim() ||
          activeSlide.title?.trim().slice(0, 36) ||
          `Carrusel (${slides.length} láminas)`;

        const newDraft: SavedDraft = {
          id: `draft_${Date.now()}`,
          name: draftTitle,
          updatedAt: `${now.toLocaleDateString([], { day: '2-digit', month: 'short' })} ${timeStr}`,
          slidesCount: slides.length,
          slides,
        };

        setSavedDrafts((prev) => {
          const filtered = prev.filter((d) => d.name !== draftTitle);
          const updated = [newDraft, ...filtered].slice(0, 12);
          localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(updated));
          return updated;
        });

        setHasUnsavedChanges(false);
        setLastSavedAt(timeStr);
        setIsSaving(false);
        toast.success(`Cambios guardados (${timeStr}).`);
      } catch {
        setIsSaving(false);
        toast.error('No se pudo guardar en el navegador.');
      }
    },
    [slides, activeSlide.title],
  );

  // Cargar un borrador guardado
  const loadSavedDraft = useCallback((draft: SavedDraft) => {
    setSlides(draft.slides);
    setActiveSlideIndex(0);
    setHasUnsavedChanges(false);
    setLastSavedAt(draft.updatedAt);
    try {
      localStorage.setItem(
        STORAGE_KEY_CURRENT,
        JSON.stringify({
          updatedAt: new Date().toISOString(),
          slides: draft.slides,
        }),
      );
    } catch {
      // Ignorar fallback
    }
    toast.success(`Borrador "${draft.name}" restaurado.`);
  }, []);

  // Eliminar un borrador
  const deleteSavedDraft = useCallback((draftId: string) => {
    setSavedDrafts((prev) => {
      const updated = prev.filter((d) => d.id !== draftId);
      try {
        localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(updated));
      } catch {
        // Ignorar
      }
      return updated;
    });
    toast.success('Borrador eliminado.');
  }, []);

  // Atajo de teclado universal Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveChanges();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveChanges]);

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
    hasUnsavedChanges,
    lastSavedAt,
    isSaving,
    savedDrafts,
    saveChanges,
    loadSavedDraft,
    deleteSavedDraft,
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
    applyFooterLeftToAllSlides,
    applyStyleToAllSlides,
  };
}
