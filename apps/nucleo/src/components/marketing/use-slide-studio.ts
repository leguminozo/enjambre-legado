'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from '@enjambre/ui';
import {
  type SlideData,
  type SlideBlock,
  type BrandViolation,
  type SlideTitleSize,
  type SlideTitleWeight,
  type SlideAlignment,
  type SlideAspectRatio,
  type SlideFontFamily,
  type SlideTheme,
  PRESET_MANIFIESTO,
  ARSENAL_EDITORIAL,
  checkBrandCompliance,
  renderSlideToCanvas,
  generateCarouselCaption,
  createEmptyBlock,
} from './slide-studio-core';

export const STORAGE_KEY_CURRENT = 'enj_slide_studio_current_v1';
export const STORAGE_KEY_DRAFTS = 'enj_slide_studio_drafts_v1';
export const STORAGE_KEY_TEMPLATES = 'enj_slide_studio_templates_v1';

export type SlideStudioTab = 'editor' | 'arsenal' | 'preview';

export interface SavedDraft {
  id: string;
  name: string;
  updatedAt: string;
  slidesCount: number;
  slides: SlideData[];
  aspectRatio?: SlideAspectRatio;
}

export type TemplateCategory = 'borrador' | 'cafeteria' | 'hotel' | 'club' | 'feria' | 'institucional' | 'general';

export interface UserTemplate {
  id: string;
  name: string;
  category?: TemplateCategory;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  slidesCount: number;
  slides: SlideData[];
  aspectRatio?: SlideAspectRatio;
}

export interface UseSlideStudioOptions {
  initialSlides?: SlideData[];
}

export function useSlideStudio(options?: UseSlideStudioOptions) {
  const [slides, setSlides] = useState<SlideData[]>(options?.initialSlides ?? PRESET_MANIFIESTO);
  const [aspectRatio, setAspectRatio] = useState<SlideAspectRatio>('4:5');
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
  const [customTemplates, setCustomTemplates] = useState<UserTemplate[]>([]);

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

  // Carga inicial desde localStorage de borradores, plantillas y sesión activa
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      let initialTemplates: UserTemplate[] = [];
      const rawTemplates = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      if (rawTemplates) {
        try {
          const parsed = JSON.parse(rawTemplates) as UserTemplate[];
          if (Array.isArray(parsed)) {
            initialTemplates = parsed;
          }
        } catch {
          // ignore
        }
      }

      // Migrar borradores históricos si no existen en templates
      const rawDrafts = localStorage.getItem(STORAGE_KEY_DRAFTS);
      if (rawDrafts) {
        try {
          const parsedDrafts = JSON.parse(rawDrafts) as SavedDraft[];
          if (Array.isArray(parsedDrafts)) {
            const existingIds = new Set(initialTemplates.map((t) => t.id));
            const existingNames = new Set(initialTemplates.map((t) => t.name.toLowerCase()));
            const migrated: UserTemplate[] = parsedDrafts
              .filter((d) => !existingIds.has(d.id) && !existingNames.has(d.name.toLowerCase()))
              .map((d) => ({
                id: d.id,
                name: d.name,
                category: 'borrador' as TemplateCategory,
                description: 'Borrador de trabajo archivado',
                createdAt: d.updatedAt,
                updatedAt: d.updatedAt,
                slidesCount: d.slidesCount,
                slides: d.slides,
                aspectRatio: d.aspectRatio,
              }));
            if (migrated.length > 0) {
              initialTemplates = [...initialTemplates, ...migrated];
              localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(initialTemplates));
            }
            setSavedDrafts(parsedDrafts);
          }
        } catch {
          // ignore
        }
      }

      setCustomTemplates(initialTemplates);

      // Si no se pasaron láminas iniciales explícitas por props, recuperar el borrador activo guardado
      if (!options?.initialSlides) {
        const rawCurrent = localStorage.getItem(STORAGE_KEY_CURRENT);
        if (rawCurrent) {
          const parsedCurrent = JSON.parse(rawCurrent) as {
            updatedAt: string;
            slides: SlideData[];
            aspectRatio?: SlideAspectRatio;
          };
          if (Array.isArray(parsedCurrent.slides) && parsedCurrent.slides.length > 0) {
            setSlides(parsedCurrent.slides);
            if (parsedCurrent.aspectRatio) {
              setAspectRatio(parsedCurrent.aspectRatio);
            }
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

  const duplicateBlock = useCallback(
    (blockId: string) => {
      const currentBlocks = activeSlide.blocks || [];
      const index = currentBlocks.findIndex((b) => b.id === blockId);
      if (index === -1) return;
      const original = currentBlocks[index];
      const clone: SlideBlock = JSON.parse(JSON.stringify(original));
      clone.id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const nextBlocks = [...currentBlocks];
      nextBlocks.splice(index + 1, 0, clone);
      updateActiveSlide({ blocks: nextBlocks });
      toast.success(`Bloque "${original.type}" duplicado.`);
    },
    [activeSlide.blocks, updateActiveSlide],
  );

  const moveBlockToSlide = useCallback(
    (blockId: string, targetSlideIndex: number) => {
      if (targetSlideIndex < 0 || targetSlideIndex >= slides.length || targetSlideIndex === activeSlideIndex) return;
      const currentBlocks = activeSlide.blocks || [];
      const blockToMove = currentBlocks.find((b) => b.id === blockId);
      if (!blockToMove) return;

      const remainingBlocks = currentBlocks.filter((b) => b.id !== blockId);
      const targetSlide = slides[targetSlideIndex];
      const targetBlocks = [...(targetSlide.blocks || []), blockToMove];

      setSlides((prev) =>
        prev.map((s, idx) => {
          if (idx === activeSlideIndex) {
            return { ...s, blocks: remainingBlocks };
          }
          if (idx === targetSlideIndex) {
            return { ...s, blocks: targetBlocks };
          }
          return s;
        }),
      );
      setHasUnsavedChanges(true);
      toast.success(`Bloque transferido a lámina ${targetSlideIndex + 1}.`);
    },
    [activeSlide.blocks, activeSlideIndex, slides],
  );

  const addBlockToActiveSlide = useCallback(
    (type: SlideBlock['type']) => {
      const newBlock = createEmptyBlock(
        type,
        activeSlide.footerLeft || 'obrerayzangano.cl',
      );

      const currentBlocks = activeSlide.blocks || [];
      updateActiveSlide({ blocks: [...currentBlocks, newBlock] });
      toast.success(`Bloque ${type} agregado a la lámina.`);
    },
    [activeSlide.blocks, activeSlide.footerLeft, updateActiveSlide],
  );

  const handleAddBlankSlide = useCallback(() => {
    const newSlide: SlideData = {
      id: `slide-${Date.now()}`,
      badge: 'NUEVA LÁMINA EDITORIAL',
      kickerLeft: 'ORIGEN SOBERANO',
      kickerRight: 'CHILOÉ · 42°S',
      title: 'Título de la nueva lámina editorial.',
      subtitle: 'Bajada descriptiva o argumento territorial.',
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
    (style: {
      accentColor?: string;
      fontFamily?: SlideFontFamily;
      theme?: SlideTheme;
      titleSize?: SlideTitleSize;
      titleWeight?: SlideTitleWeight;
      titleItalic?: boolean;
      alignment?: SlideAlignment;
      cleanFrame?: boolean;
      hideDividers?: boolean;
    }) => {
      setSlides((prev) =>
        prev.map((s) => ({
          ...s,
          ...(style.accentColor !== undefined ? { accentColor: style.accentColor } : {}),
          ...(style.fontFamily !== undefined ? { fontFamily: style.fontFamily } : {}),
          ...(style.theme !== undefined ? { theme: style.theme } : {}),
          ...(style.titleSize !== undefined ? { titleSize: style.titleSize } : {}),
          ...(style.titleWeight !== undefined ? { titleWeight: style.titleWeight } : {}),
          ...(style.titleItalic !== undefined ? { titleItalic: style.titleItalic } : {}),
          ...(style.alignment !== undefined ? { alignment: style.alignment } : {}),
          ...(style.cleanFrame !== undefined ? { cleanFrame: style.cleanFrame } : {}),
          ...(style.hideDividers !== undefined ? { hideDividers: style.hideDividers } : {}),
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
            aspectRatio,
          }),
        );

        // 2. Archivar en historial de borradores y plantillas unificadas
        const draftTitle =
          customName?.trim() ||
          activeSlide.title?.trim().slice(0, 36) ||
          `Carrusel (${slides.length} láminas)`;

        const dateStr = now.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
        const newDraft: SavedDraft = {
          id: `draft_${Date.now()}`,
          name: draftTitle,
          updatedAt: `${now.toLocaleDateString([], { day: '2-digit', month: 'short' })} ${timeStr}`,
          slidesCount: slides.length,
          slides,
          aspectRatio,
        };

        const newTemplate: UserTemplate = {
          id: `tmpl_${Date.now()}`,
          name: draftTitle,
          category: 'borrador',
          description: `Borrador guardado a las ${timeStr}`,
          createdAt: dateStr,
          updatedAt: dateStr,
          slidesCount: slides.length,
          slides,
          aspectRatio,
        };

        setCustomTemplates((prev) => {
          const filtered = prev.filter((t) => t.name.toLowerCase() !== draftTitle.toLowerCase());
          const updated = [newTemplate, ...filtered].slice(0, 50);
          try {
            localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });

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
    [slides, activeSlide.title, aspectRatio],
  );

  // Cargar un borrador guardado
  const loadSavedDraft = useCallback((draft: SavedDraft) => {
    setSlides(draft.slides);
    if (draft.aspectRatio) {
      setAspectRatio(draft.aspectRatio);
    }
    setActiveSlideIndex(0);
    setHasUnsavedChanges(false);
    setLastSavedAt(draft.updatedAt);
    try {
      localStorage.setItem(
        STORAGE_KEY_CURRENT,
        JSON.stringify({
          updatedAt: new Date().toISOString(),
          slides: draft.slides,
          aspectRatio: draft.aspectRatio ?? '4:5',
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

  // Guardar carrusel actual como Plantilla Personalizada
  const saveCurrentAsTemplate = useCallback(
    (templateName: string, category: TemplateCategory = 'general', description?: string) => {
      const cleanName = templateName.trim();
      if (!cleanName) {
        toast.error('Ingresa un nombre para la plantilla.');
        return;
      }
      const now = new Date();
      const dateStr = now.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
      const newTemplate: UserTemplate = {
        id: `tmpl_${Date.now()}`,
        name: cleanName,
        category,
        description: description?.trim() || undefined,
        createdAt: dateStr,
        updatedAt: dateStr,
        slidesCount: slides.length,
        slides,
        aspectRatio,
      };

      setCustomTemplates((prev) => {
        const filtered = prev.filter((t) => t.name.toLowerCase() !== cleanName.toLowerCase());
        const updated = [newTemplate, ...filtered].slice(0, 50);
        try {
          localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated));
        } catch {
          // Ignorar
        }
        return updated;
      });

      toast.success(`Plantilla "${cleanName}" guardada en la biblioteca del estudio.`);
    },
    [slides, aspectRatio],
  );

  // Actualizar metadatos de una plantilla existente
  const updateCustomTemplate = useCallback((templateId: string, updates: Partial<UserTemplate>) => {
    setCustomTemplates((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== templateId) return t;
        return {
          ...t,
          ...updates,
          updatedAt: new Date().toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }),
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated));
      } catch {
        // Ignorar
      }
      return updated;
    });
    toast.success('Plantilla actualizada.');
  }, []);

  // Sobrescribir una plantilla existente con las láminas actuales
  const overwriteTemplateWithCurrentSlides = useCallback(
    (templateId: string) => {
      setCustomTemplates((prev) => {
        const target = prev.find((t) => t.id === templateId);
        if (!target) return prev;
        const now = new Date();
        const dateStr = now.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
        const updated = prev.map((t) => {
          if (t.id !== templateId) return t;
          return {
            ...t,
            slides,
            slidesCount: slides.length,
            aspectRatio,
            updatedAt: dateStr,
          };
        });
        try {
          localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated));
        } catch {
          // Ignorar
        }
        toast.success(`Plantilla "${target.name}" actualizada con las ${slides.length} láminas actuales.`);
        return updated;
      });
    },
    [slides, aspectRatio],
  );

  // Duplicar una plantilla existente
  const duplicateCustomTemplate = useCallback((templateId: string) => {
    setCustomTemplates((prev) => {
      const target = prev.find((t) => t.id === templateId);
      if (!target) return prev;
      const clone: UserTemplate = {
        ...target,
        id: `tmpl_${Date.now()}`,
        name: `${target.name} (Copia)`,
        createdAt: new Date().toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }),
        slides: JSON.parse(JSON.stringify(target.slides)) as SlideData[],
      };
      const updated = [clone, ...prev].slice(0, 50);
      try {
        localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated));
      } catch {
        // Ignorar
      }
      toast.success(`Plantilla duplicada como "${clone.name}".`);
      return updated;
    });
  }, []);

  // Eliminar plantilla personalizada
  const deleteCustomTemplate = useCallback((templateId: string) => {
    setCustomTemplates((prev) => {
      const updated = prev.filter((t) => t.id !== templateId);
      try {
        localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated));
      } catch {
        // Ignorar
      }
      return updated;
    });
    toast.success('Plantilla eliminada.');
  }, []);

  // Exportar todas las plantillas como archivo JSON
  const exportAllTemplatesJSON = useCallback(() => {
    try {
      const payload = {
        schema: 'enjambre.slide-studio.templates.v1',
        exportedAt: new Date().toISOString(),
        templatesCount: customTemplates.length,
        templates: customTemplates,
      };
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `plantillas_estudio_legado_${new Date().toISOString().slice(0, 10)}.json`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`Biblioteca de plantillas exportada (${customTemplates.length} plantillas).`);
    } catch {
      toast.error('Error al exportar plantillas.');
    }
  }, [customTemplates]);

  // Importar plantillas desde archivo JSON
  const importTemplatesJSON = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      let imported: UserTemplate[] = [];

      if (parsed && typeof parsed === 'object') {
        if ('templates' in parsed && Array.isArray((parsed as { templates: unknown }).templates)) {
          imported = (parsed as { templates: UserTemplate[] }).templates;
        } else if (Array.isArray(parsed)) {
          imported = parsed as UserTemplate[];
        }
      }

      if (imported.length === 0) {
        toast.error('El archivo no contiene plantillas válidas.');
        return;
      }

      setCustomTemplates((prev) => {
        // Merge evitando duplicados por nombre
        const existingNames = new Set(prev.map((t) => t.name.toLowerCase()));
        const toAdd = imported.filter((t) => t.name && !existingNames.has(t.name.toLowerCase()));
        const updated = [...toAdd, ...prev].slice(0, 50);
        try {
          localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated));
        } catch {
          // Ignorar
        }
        toast.success(`Se importaron ${toAdd.length} plantillas nuevas con éxito.`);
        return updated;
      });
    } catch {
      toast.error('Error al leer el archivo JSON de plantillas.');
    }
  }, []);

  // Exportar carrusel actual como archivo JSON limpio
  const exportCarouselJSON = useCallback(
    (customName?: string) => {
      try {
        const rawTitle = customName?.trim() || activeSlide.title?.trim() || 'carrusel_soberano';
        const sanitizedTitle = rawTitle.slice(0, 32).replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_');

        const payload = {
          schema: 'enjambre.slide-studio.v1',
          name: customName?.trim() || activeSlide.title?.trim() || 'Carrusel Soberano',
          exportedAt: new Date().toISOString(),
          aspectRatio,
          slidesCount: slides.length,
          slides,
        };

        const jsonStr = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const filename = `${sanitizedTitle.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.json`;
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        toast.success(`Archivo "${filename}" descargado.`);
      } catch {
        toast.error('Error al exportar archivo JSON.');
      }
    },
    [slides, activeSlide.title, aspectRatio],
  );

  // Importar carrusel desde archivo JSON
  const importCarouselJSON = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      let importedSlides: SlideData[] | null = null;
      let importedRatio: SlideAspectRatio | undefined;
      let carouselName = file.name.replace(/\.[^/.]+$/, '');

      if (parsed && typeof parsed === 'object') {
        if ('slides' in parsed && Array.isArray((parsed as { slides: unknown }).slides)) {
          importedSlides = (parsed as { slides: SlideData[] }).slides;
          if ('aspectRatio' in parsed && typeof (parsed as { aspectRatio: unknown }).aspectRatio === 'string') {
            const r = (parsed as { aspectRatio: string }).aspectRatio;
            if (r === '4:5' || r === '9:16' || r === '1:1') {
              importedRatio = r;
            }
          }
          if ('name' in parsed && typeof (parsed as { name: unknown }).name === 'string') {
            carouselName = (parsed as { name: string }).name;
          }
        } else if (Array.isArray(parsed)) {
          importedSlides = parsed as SlideData[];
        }
      }

      if (!importedSlides || importedSlides.length === 0) {
        toast.error('El archivo JSON no contiene láminas válidas.');
        return;
      }

      // Validación básica de campos requeridos
      const valid = importedSlides.every(
        (s) => s && typeof s === 'object' && 'id' in s && 'blocks' in s && Array.isArray(s.blocks),
      );
      if (!valid) {
        toast.error('El formato de las láminas no es compatible con el estudio.');
        return;
      }

      setSlides(importedSlides);
      if (importedRatio) {
        setAspectRatio(importedRatio);
      }
      setActiveSlideIndex(0);
      setHasUnsavedChanges(true);
      toast.success(`Carrusel "${carouselName}" cargado (${importedSlides.length} láminas).`);
    } catch {
      toast.error('Error al leer o interpretar el archivo JSON.');
    }
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
        const canvas = await renderSlideToCanvas(activeSlide, activeSlideIndex + 1, slides.length, {
          aspectRatio,
        });

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
          const dimLabel =
            aspectRatio === '16:9'
              ? '1920 × 1080'
              : aspectRatio === '9:16'
              ? '1080 × 1920'
              : aspectRatio === '1:1'
              ? '1080 × 1080'
              : '1080 × 1350';
          toast.success(`Lámina ${activeSlideIndex + 1} exportada en ${dimLabel} px.`);
        }, 'image/png');
      } catch {
        setIsExporting(false);
        toast.error('No se pudo procesar la exportación gráfica.');
      }
    },
    [activeSlide, activeSlideIndex, slides.length, aspectRatio],
  );

  // Exportar todas las láminas secuencialmente
  const handleExportAllPNGs = useCallback(async () => {
    try {
      setIsExporting(true);
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const canvas = await renderSlideToCanvas(slide, i + 1, slides.length, { aspectRatio });
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
  }, [slides, aspectRatio]);

  // Copiar Caption para Instagram/X dinámicamente desde el contenido del carrusel
  const handleCopyCaption = useCallback(() => {
    const caption = generateCarouselCaption(slides);
    if (!caption) {
      toast.error('No hay contenido suficiente para generar el caption.');
      return;
    }

    navigator.clipboard.writeText(caption);
    setIsCopied(true);
    toast.success('Caption editorial copiado.');
    setTimeout(() => setIsCopied(false), 2500);
  }, [slides]);

  const filteredArsenal = useMemo(() => {
    if (arsenalCategoryFilter === 'todos') return ARSENAL_EDITORIAL;
    return ARSENAL_EDITORIAL.filter((a) => a.categoria === arsenalCategoryFilter);
  }, [arsenalCategoryFilter]);

  return {
    slides,
    setSlides,
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
    savedDrafts,
    customTemplates,
    saveChanges,
    loadSavedDraft,
    deleteSavedDraft,
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
  };
}
