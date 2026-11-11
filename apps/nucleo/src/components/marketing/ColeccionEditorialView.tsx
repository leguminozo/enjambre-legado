'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  Clock,
  ArrowRight,
  Copy,
  Trash2,
  Coffee,
  BookmarkPlus,
  BookOpen,
  ChevronDown,
  LayoutTemplate,
  FileText,
  FilePlus2,
} from 'lucide-react';
import {
  cn,
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  toast,
} from '@enjambre/ui';
import {
  type SlideData,
  type SlideAspectRatio,
  PRESET_MANIFIESTO,
  PRESET_ULMO_ESTACIONAL,
  PRESET_KIT_CAFETERIA,
  PRESET_CLUB_LEGADO,
  PRESET_STAND_FERIA,
  SLIDE_THEMES,
  SLIDE_ACCENT_PALETTES,
} from './slide-studio-core';
import {
  STORAGE_KEY_TEMPLATES,
  type UserTemplate,
  type TemplateCategory,
} from './use-slide-studio';

export interface ColeccionEditorialViewProps {
  onCrearNueva: (slides: SlideData[], nombre: string) => void;
  onEditarPieza: (slides: SlideData[], nombre: string, templateId?: string) => void;
}

export const BLANK_NEUTRAL_SLIDES: SlideData[] = [
  {
    id: 'slide-neutral-1',
    badge: 'EDITORIAL',
    title: 'Nueva Pieza Editorial',
    subtitle: '',
    kickerLeft: 'CHILOÉ 42°S // ORIGEN PURO',
    kickerRight: 'EDICIÓN TERRITORIAL',
    footerLeft: 'obrerayzangano.cl',
    footerRight: 'SELLO DE AUTENTICIDAD DIGITAL',
    theme: 'obsidiana',
    accentColor: 'oro',
    fontFamily: 'cormorant',
    titleSize: 'normal',
    titleWeight: 'light',
    aspectRatio: '4:5',
    blocks: [],
  },
];

const PRESETS_CANONICOS: Array<{
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  slides: SlideData[];
  aspectRatio: SlideAspectRatio;
}> = [
  {
    id: 'preset-manifiesto',
    name: 'Manifiesto de Origen y Biocultura',
    category: 'institucional',
    description: 'Declaración de principios, bosque nativo de Chiloé y soberanía apícola.',
    slides: PRESET_MANIFIESTO,
    aspectRatio: '4:5',
  },
  {
    id: 'preset-kit-cafeteria',
    name: 'Kit Cafetería & Maridaje Barista',
    category: 'cafeteria',
    description: 'Fichas de mesa, perfiles de extracción de café y maridaje con néctar de Ulmo.',
    slides: PRESET_KIT_CAFETERIA,
    aspectRatio: '4:5',
  },
  {
    id: 'preset-ulmo-estacional',
    name: 'Ficha de Lote Ulmo Estacional 2026',
    category: 'institucional',
    description: 'Trazabilidad de recolección, perfil de floración y laboratorio de humedad.',
    slides: PRESET_ULMO_ESTACIONAL,
    aspectRatio: '4:5',
  },
  {
    id: 'preset-club-legado',
    name: 'Club Legado del Bosque',
    category: 'club',
    description: 'Propuesta para guardianes, beneficios de reposición periódica y canjes.',
    slides: PRESET_CLUB_LEGADO,
    aspectRatio: '4:5',
  },
  {
    id: 'preset-stand-feria',
    name: 'Ficha de Stand y Degustación en Feria',
    category: 'feria',
    description: 'Protocolo de cata sensorial para revendedores y operadores de punto de venta.',
    slides: PRESET_STAND_FERIA,
    aspectRatio: '4:5',
  },
];

export interface NuevaPiezaEditorialDropdownProps {
  onCrearNueva: (slides: SlideData[], nombre: string) => void;
  className?: string;
}

export function NuevaPiezaEditorialDropdown({
  onCrearNueva,
  className,
}: NuevaPiezaEditorialDropdownProps) {
  return (
    <DropdownMenu
      trigger={
        <Button className={cn("btn btn-primary text-xs font-mono flex items-center gap-2 px-4 h-10 rounded-xl shadow-md", className)}>
          <Plus size={15} />
          <span>Nueva Pieza</span>
          <ChevronDown size={13} className="opacity-70 ml-0.5" />
        </Button>
      }
    >
      <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
        Creación de Lámina
      </div>
      <DropdownMenuItem onSelect={() => onCrearNueva(BLANK_NEUTRAL_SLIDES, 'Lienzo Limpio')}>
        <div className="flex items-center gap-2 py-1">
          <FilePlus2 size={15} className="text-primary" />
          <div className="flex flex-col">
            <span className="font-medium text-foreground">Lienzo Limpio (Neutral)</span>
            <span className="text-[10px] text-muted-foreground">
              Sin textos de relleno · Construye modularmente
            </span>
          </div>
        </div>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
        Desde Plantillas Canónicas
      </div>
      {PRESETS_CANONICOS.map((preset) => (
        <DropdownMenuItem
          key={preset.id}
          onSelect={() => onCrearNueva(preset.slides, preset.name)}
        >
          <div className="flex items-center gap-2 py-1">
            <BookOpen size={14} className="text-muted-foreground" />
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-foreground truncate">{preset.name}</span>
              <span className="text-[10px] text-muted-foreground">
                {preset.slides.length} láminas · {preset.aspectRatio}
              </span>
            </div>
          </div>
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  );
}

export function ColeccionEditorialView({
  onCrearNueva,
  onEditarPieza,
}: ColeccionEditorialViewProps) {
  const [customTemplates, setCustomTemplates] = useState<UserTemplate[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroAspecto, setFiltroAspecto] = useState<string>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');

  // Cargar plantillas desde localStorage
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCustomTemplates(parsed);
        }
      }
    } catch {
      // Ignorar
    }
  }, []);

  // Piezas combinadas: plantillas de usuario primero + presets canónicos
  const todasLasPiezas = useMemo(() => {
    const customComoCards = customTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category || 'borrador',
      description: t.description || 'Pieza creada en el estudio editorial',
      slides: t.slides,
      slidesCount: t.slidesCount || t.slides.length,
      aspectRatio: t.aspectRatio || t.slides[0]?.aspectRatio || '4:5',
      updatedAt: t.updatedAt || t.createdAt,
      isCustom: true,
    }));

    const presetsComoCards = PRESETS_CANONICOS.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      slides: p.slides,
      slidesCount: p.slides.length,
      aspectRatio: p.aspectRatio,
      updatedAt: 'Oficial',
      isCustom: false,
    }));

    return [...customComoCards, ...presetsComoCards];
  }, [customTemplates]);

  const piezasFiltradas = useMemo(() => {
    return todasLasPiezas.filter((p) => {
      const q = busqueda.trim().toLowerCase();
      const coincideBusqueda =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      const coincideAspecto =
        filtroAspecto === 'todos' || p.aspectRatio === filtroAspecto;

      const coincideCategoria =
        filtroCategoria === 'todos' || p.category === filtroCategoria;

      return coincideBusqueda && coincideAspecto && coincideCategoria;
    });
  }, [todasLasPiezas, busqueda, filtroAspecto, filtroCategoria]);

  const handleEliminarCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated));
    } catch {
      // Ignorar
    }
    toast.success('Pieza eliminada del archivo.');
  };

  const handleDuplicar = (pieza: (typeof todasLasPiezas)[number], e: React.MouseEvent) => {
    e.stopPropagation();
    const clon: UserTemplate = {
      id: `tmpl_${Date.now()}`,
      name: `${pieza.name} (Copia)`,
      category: pieza.category,
      description: pieza.description,
      createdAt: new Date().toLocaleDateString('es-CL'),
      updatedAt: new Date().toLocaleDateString('es-CL'),
      slidesCount: pieza.slides.length,
      slides: JSON.parse(JSON.stringify(pieza.slides)),
      aspectRatio: pieza.aspectRatio,
    };
    const updated = [clon, ...customTemplates];
    setCustomTemplates(updated);
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated));
    } catch {
      // Ignorar
    }
    toast.success('Pieza duplicada.');
  };

  return (
    <div className="space-y-6">
      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por título, temática o categoría…"
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
              {f === 'todos' ? 'Todos los formatos' : f}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Rejilla de Tarjetas Editoriales */}
      {piezasFiltradas.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/30 space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <LayoutTemplate size={22} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-serif text-lg text-foreground">
              Sin piezas coincidentes
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No se encontraron piezas con ese filtro. Puedes crear una lámina limpia o cargar una plantilla canónica.
            </p>
          </div>
          <div>
            <Button
              type="button"
              onClick={() => onCrearNueva(BLANK_NEUTRAL_SLIDES, 'Lienzo Limpio')}
              className="btn btn-primary btn-sm text-xs font-mono px-4"
            >
              <Plus size={14} className="mr-1" /> Crear Lámina Limpia
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {piezasFiltradas.map((pieza) => {
            const firstSlide = pieza.slides[0] || BLANK_NEUTRAL_SLIDES[0];
            const themeKey = firstSlide.theme || 'obsidiana';
            const themeConfig = SLIDE_THEMES[themeKey] || SLIDE_THEMES.obsidiana;
            const accentConfig =
              SLIDE_ACCENT_PALETTES[firstSlide.accentColor || 'oro'] || SLIDE_ACCENT_PALETTES.oro;

            return (
              <div
                key={pieza.id}
                onClick={() => onEditarPieza(pieza.slides, pieza.name, pieza.isCustom ? pieza.id : undefined)}
                className="group relative rounded-2xl border border-border/70 bg-card hover:border-primary/50 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-md"
              >
                {/* Visual Preview / Thumbnail simulado */}
                <div
                  className="relative aspect-[16/10] border-b border-border/50 overflow-hidden flex flex-col justify-between p-4 select-none"
                  style={{
                    backgroundColor: themeConfig.bgHex,
                    color: themeConfig.textPrimaryHex,
                  }}
                >
                  {/* Kicker Superior */}
                  <div className="flex justify-between items-center text-[8.5px] font-mono tracking-widest uppercase opacity-80">
                    <span style={{ color: accentConfig.hex }}>
                      {firstSlide.kickerLeft || 'CHILOÉ 42°S'}
                    </span>
                    <span>
                      {pieza.slidesCount > 1 ? `${pieza.slidesCount} láminas` : pieza.aspectRatio}
                    </span>
                  </div>

                  {/* Título en tipografía Cormorant */}
                  <div className="my-auto text-center space-y-1 px-2">
                    <h4
                      className="font-serif text-base sm:text-lg leading-tight line-clamp-2 font-light tracking-tight"
                      style={{ color: accentConfig.hex }}
                    >
                      {firstSlide.title || pieza.name}
                    </h4>
                    {firstSlide.subtitle && (
                      <p className="text-[10px] opacity-75 line-clamp-1 font-sans">
                        {firstSlide.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Badges Flotantes Inferiores */}
                  <div className="flex justify-between items-center text-[8.5px] font-mono border-t border-white/10 pt-2 opacity-70">
                    <span>{firstSlide.footerLeft || 'obrerayzangano.cl'}</span>
                    <span className="flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full border border-black/30"
                        style={{ backgroundColor: accentConfig.hex }}
                      />
                      {themeConfig.label}
                    </span>
                  </div>

                  {/* Badges superiores flotantes */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90">
                    <span className="px-2 py-0.5 rounded-md bg-background/80 backdrop-blur-md border border-border text-[9px] font-mono font-bold text-foreground">
                      {pieza.aspectRatio}
                    </span>
                  </div>
                </div>

                {/* Contenido descriptivo */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="font-serif text-base text-foreground font-medium line-clamp-1 group-hover:text-primary transition-colors">
                      {pieza.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {pieza.description}
                    </p>
                  </div>

                  {/* Acciones de pie de tarjeta */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px] font-mono text-muted-foreground">
                    <span className="capitalize">{pieza.updatedAt}</span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleDuplicar(pieza, e)}
                        className="p-1.5 rounded-md hover:bg-surface-raised hover:text-foreground text-muted-foreground transition-colors"
                        title="Duplicar pieza"
                      >
                        <Copy size={12} />
                      </button>
                      {pieza.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleEliminarCustom(pieza.id, e)}
                          className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                          title="Eliminar del archivo"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
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
