'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  BookmarkPlus,
  Layers,
  Sparkles,
  Coffee,
  Building2,
  Trees,
  Tent,
  FileText,
  Trash2,
  Copy,
  Upload,
  Download,
  Check,
  Search,
  ExternalLink,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { toast, cn } from '@enjambre/ui';
import {
  type SlideData,
  type SlideAspectRatio,
  PRESET_MANIFIESTO,
  PRESET_ULMO_ESTACIONAL,
  PRESET_KIT_CAFETERIA,
  PRESET_CLUB_LEGADO,
} from './slide-studio-core';
import { type UserTemplate, type TemplateCategory } from './use-slide-studio';

export interface AdminKitTemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customTemplates: UserTemplate[];
  activeSlidesCount: number;
  currentAspectRatio: SlideAspectRatio;
  onSaveAsTemplate: (name: string, category: TemplateCategory, description?: string) => void;
  onLoadTemplate: (slides: SlideData[], name: string) => void;
  onOverwriteTemplate: (templateId: string) => void;
  onDuplicateTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onExportTemplates: () => void;
  onImportTemplates: (file: File) => Promise<void>;
}

const CATEGORY_META: Record<
  TemplateCategory,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; description: string }
> = {
  borrador: {
    label: 'Borradores de Trabajo',
    icon: Clock,
    description: 'Instantáneas y versiones de trabajo en curso para continuar editando.',
  },
  cafeteria: {
    label: 'Cafeterías de Especialidad',
    icon: Coffee,
    description: 'Kits de activación, láminas A6 de mesa, maridaje barista y QR ST-CATA.',
  },
  hotel: {
    label: 'Hoteles de Autor',
    icon: Building2,
    description: 'Amenities 40g, monografías bilingües y pasaportes de habitación.',
  },
  club: {
    label: 'Club Legado del Bosque',
    icon: Trees,
    description: 'Membresías libres, retorno de frascos y reserva de microlotes.',
  },
  feria: {
    label: 'Ferias & Degustación',
    icon: Tent,
    description: 'POS Campo, fichas de cata rápida y pasaportes de lote en vivo.',
  },
  institucional: {
    label: 'Institucional & Manifiesto',
    icon: FileText,
    description: 'Pilares de marca, biomasa protegida y oráculo bioclimático.',
  },
  general: {
    label: 'General / Personalizado',
    icon: Layers,
    description: 'Plantillas y formatos libres creados por el administrador.',
  },
};

export function AdminKitTemplateManagerModal({
  isOpen,
  onClose,
  customTemplates,
  activeSlidesCount,
  currentAspectRatio,
  onSaveAsTemplate,
  onLoadTemplate,
  onOverwriteTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onExportTemplates,
  onImportTemplates,
}: AdminKitTemplateManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'save' | 'library' | 'export_import'>('library');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<TemplateCategory>('cafeteria');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!newTemplateName.trim()) {
      toast.error('Ingresa un nombre para la plantilla o kit.');
      return;
    }
    onSaveAsTemplate(newTemplateName.trim(), newTemplateCategory, newTemplateDesc.trim());
    setNewTemplateName('');
    setNewTemplateDesc('');
    setActiveTab('library');
  };

  const filteredTemplates = customTemplates.filter((t) => {
    const matchesCategory = categoryFilter === 'todos' || t.category === categoryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[92vh] flex flex-col justify-between">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <BookmarkPlus size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm sm:text-base text-foreground">
                  Gestor Integral de Kits & Borradores de Entrega
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-primary/10 text-primary border border-primary/20">
                  {customTemplates.length} Guardados
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                Centraliza kits comerciales para aliados, pasaportes de lote y borradores de trabajo guardados.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost h-8 w-8 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="Cerrar gestor de plantillas"
          >
            <X size={16} />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex items-center gap-1.5 border-b border-border/60 pb-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={cn(
              'btn btn-sm h-8 px-3 text-xs flex items-center gap-1.5 font-mono rounded-lg transition-colors',
              activeTab === 'library'
                ? 'btn-primary shadow-sm'
                : 'btn-ghost text-muted-foreground hover:text-foreground',
            )}
          >
            <Layers size={14} /> Biblioteca de Kits ({customTemplates.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('save')}
            className={cn(
              'btn btn-sm h-8 px-3 text-xs flex items-center gap-1.5 font-mono rounded-lg transition-colors',
              activeTab === 'save'
                ? 'btn-primary shadow-sm'
                : 'btn-ghost text-muted-foreground hover:text-foreground',
            )}
          >
            <BookmarkPlus size={14} /> + Guardar Carrusel como Kit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export_import')}
            className={cn(
              'btn btn-sm h-8 px-3 text-xs flex items-center gap-1.5 font-mono rounded-lg transition-colors',
              activeTab === 'export_import'
                ? 'btn-primary shadow-sm'
                : 'btn-ghost text-muted-foreground hover:text-foreground',
            )}
          >
            <Download size={14} /> Importar / Exportar Kits
          </button>
        </div>

        {/* Contenido Dinámico */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[300px]">
          {/* TAB 1: BIBLIOTECA DE KITS */}
          {activeTab === 'library' && (
            <div className="space-y-3.5">
              {/* Barra de Filtros y Búsqueda */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {(['todos', 'borrador', 'cafeteria', 'hotel', 'club', 'feria', 'institucional'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={cn(
                        'px-2.5 py-1 text-[11px] font-mono rounded-lg shrink-0 transition-colors border',
                        categoryFilter === cat
                          ? 'bg-primary text-primary-foreground border-primary font-semibold'
                          : 'border-border/60 bg-surface-sunken/40 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {cat === 'todos' ? 'Todos' : CATEGORY_META[cat].label.split(' ')[0]}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-48 shrink-0">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar kit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field w-full pl-8 pr-2 py-1 text-xs font-mono h-7"
                  />
                </div>
              </div>

              {/* Lista de Kits Personalizados */}
              {filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredTemplates.map((tmpl) => {
                    const catKey = (tmpl.category || 'general') as TemplateCategory;
                    const meta = CATEGORY_META[catKey] || CATEGORY_META.general;
                    const IconComp = meta.icon;

                    return (
                      <div
                        key={tmpl.id}
                        className="p-3 rounded-xl border border-border bg-surface-sunken/40 hover:border-primary/40 transition-all flex flex-col justify-between space-y-2.5 group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20">
                              <IconComp size={11} />
                              {meta.label}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {tmpl.slidesCount} láminas · {tmpl.aspectRatio || '4:5'}
                            </span>
                          </div>

                          <h4 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                            {tmpl.name}
                          </h4>

                          {tmpl.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                              {tmpl.description}
                            </p>
                          )}
                          <p className="text-[9px] font-mono text-muted-foreground/70 mt-1">
                            Guardada: {tmpl.updatedAt || tmpl.createdAt}
                          </p>
                        </div>

                        {/* Acciones del Kit */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/40 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onLoadTemplate(tmpl.slides, tmpl.name);
                              onClose();
                            }}
                            className="btn btn-primary btn-xs h-7 px-2.5 text-[11px] font-mono flex items-center gap-1 shadow-sm"
                            title="Cargar este kit en el estudio editorial"
                          >
                            <span>Cargar Kit</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onOverwriteTemplate(tmpl.id)}
                              className="btn btn-ghost btn-xs h-7 px-2 text-[10px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 border border-border/60"
                              title="Sobrescribir esta plantilla con las láminas activas del carrusel"
                            >
                              <RefreshCw size={11} />
                              <span className="hidden sm:inline">Actualizar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDuplicateTemplate(tmpl.id)}
                              className="btn btn-ghost btn-xs h-7 w-7 p-0 text-muted-foreground hover:text-foreground border border-border/60 flex items-center justify-center"
                              title="Duplicar kit"
                            >
                              <Copy size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTemplate(tmpl.id)}
                              className="btn btn-ghost btn-xs h-7 w-7 p-0 text-muted-foreground hover:text-destructive border border-border/60 flex items-center justify-center"
                              title="Eliminar kit"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border bg-surface-sunken/20 space-y-2">
                  <BookmarkPlus size={24} className="mx-auto text-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground">No hay kits guardados con este filtro</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    Puedes guardar tu carrusel activo de {activeSlidesCount} láminas como un nuevo kit editable para cafeterías, hoteles o el club.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('save')}
                    className="btn btn-primary btn-xs h-7 px-3 font-mono text-xs mt-2"
                  >
                    + Guardar Carrusel Activo
                  </button>
                </div>
              )}

              {/* Kits Fundacionales de Fábrica (Listos para clonar o cargar) */}
              <div className="pt-3 border-t border-border/60 space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground block">
                  Kits Fundacionales del Sistema (Listos para usar o clonar)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onLoadTemplate(PRESET_KIT_CAFETERIA, 'Kit Cafetería: Maridaje & Mesa (3)');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg border border-border/60 bg-surface-sunken/40 hover:border-primary/50 text-left transition-colors"
                  >
                    <p className="text-[11px] font-semibold text-foreground truncate">Kit Cafeterías (3)</p>
                    <p className="text-[9px] font-mono text-muted-foreground">Barismo & QR Mesa</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLoadTemplate(PRESET_CLUB_LEGADO, 'Club Legado del Bosque (3)');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg border border-border/60 bg-surface-sunken/40 hover:border-primary/50 text-left transition-colors"
                  >
                    <p className="text-[11px] font-semibold text-foreground truncate">Club Legado (3)</p>
                    <p className="text-[9px] font-mono text-muted-foreground">Membresía & Envases</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLoadTemplate(PRESET_ULMO_ESTACIONAL, 'Recolección Ulmo (3)');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg border border-border/60 bg-surface-sunken/40 hover:border-primary/50 text-left transition-colors"
                  >
                    <p className="text-[11px] font-semibold text-foreground truncate">Recolección Ulmo (3)</p>
                    <p className="text-[9px] font-mono text-muted-foreground">Monografía de Origen</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLoadTemplate(PRESET_MANIFIESTO, 'Manifiesto Científico (6)');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg border border-border/60 bg-surface-sunken/40 hover:border-primary/50 text-left transition-colors"
                  >
                    <p className="text-[11px] font-semibold text-foreground truncate">Manifiesto (6)</p>
                    <p className="text-[9px] font-mono text-muted-foreground">Biomasa & Laboratorio</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GUARDAR CARRUSEL COMO KIT */}
          {activeTab === 'save' && (
            <div className="space-y-4 p-4 rounded-xl border border-border bg-surface-sunken/40">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Guardar Carrusel Activo como Kit de Marca
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  Empaqueta las {activeSlidesCount} láminas actuales ({currentAspectRatio}) con sus textos, bloques modulares, perfiles sensoriales y códigos QR para usarlas o distribuirlas cuando quieras.
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase block mb-1">
                    Nombre del Kit / Plantilla *
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Kit Barista Cafetería de Especialidad (3)"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="input-field w-full text-xs"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground uppercase block mb-1">
                    Segmento / Categoría de Destino *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Object.keys(CATEGORY_META) as TemplateCategory[]).map((catKey) => {
                      const item = CATEGORY_META[catKey];
                      const IconComp = item.icon;
                      const isSelected = newTemplateCategory === catKey;

                      return (
                        <div
                          key={catKey}
                          onClick={() => setNewTemplateCategory(catKey)}
                          className={cn(
                            'p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2',
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40'
                              : 'border-border/60 bg-card hover:border-primary/30',
                          )}
                        >
                          <div className={cn('p-1.5 rounded-lg mt-0.5', isSelected ? 'bg-primary text-primary-foreground' : 'bg-surface-sunken text-muted-foreground')}>
                            <IconComp size={13} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground">{item.label}</p>
                            <p className="text-[10px] text-muted-foreground font-sans line-clamp-1">{item.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground uppercase block mb-1">
                    Instrucciones u Objetivo Operativo (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ej. Imprimir o proyectar en barra para maridaje con café de filtro Chemex o V60."
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    className="input-field w-full text-xs font-sans"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className="btn btn-outline btn-sm text-xs px-3"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!newTemplateName.trim()}
                  className="btn btn-primary btn-sm text-xs px-4 flex items-center gap-1.5 shadow-sm"
                >
                  <BookmarkPlus size={14} />
                  <span>Guardar Kit en la Biblioteca</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: IMPORTAR / EXPORTAR KITS */}
          {activeTab === 'export_import' && (
            <div className="space-y-4 p-4 rounded-xl border border-border bg-surface-sunken/40">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Respaldo y Transferencia de Kits Editoriales
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  Exporta tu biblioteca completa de kits a un archivo JSON soberano para transferirlo a otro operador o restaurarlo en el futuro.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center gap-2 text-primary font-mono text-xs font-semibold">
                    <Download size={16} />
                    <span>EXPORTAR BIBLIOTECA (.JSON)</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Descarga un archivo con las {customTemplates.length} plantillas personalizadas guardadas actualmente en este navegador.
                  </p>
                  <button
                    type="button"
                    onClick={onExportTemplates}
                    disabled={customTemplates.length === 0}
                    className="btn btn-outline btn-sm w-full text-xs flex items-center justify-center gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                  >
                    <Download size={14} />
                    <span>Descargar Archivo JSON</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center gap-2 text-primary font-mono text-xs font-semibold">
                    <Upload size={16} />
                    <span>IMPORTAR KITS (.JSON)</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Carga un archivo exportado previamente. Se fusionará de forma segura con tus kits existentes sin sobrescribir nombres idénticos.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await onImportTemplates(file);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        setActiveTab('library');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-primary btn-sm w-full text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Upload size={14} />
                    <span>Seleccionar Archivo JSON</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between shrink-0">
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm text-xs px-4">
            Cerrar
          </button>
          <span className="text-[11px] font-mono text-muted-foreground">
            Láminas activas en lienzo: {activeSlidesCount} ({currentAspectRatio})
          </span>
        </div>
      </div>
    </div>
  );
}
