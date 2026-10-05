'use client';

import React from 'react';
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
} from 'lucide-react';
import { cn } from '@enjambre/ui';
import {
  type SlideData,
  type SlideBlock,
  type BrandViolation,
  PRESET_MANIFIESTO,
  PRESET_ULMO_ESTACIONAL,
  ARSENAL_EDITORIAL,
} from './slide-studio-core';
import { useSlideStudio } from './use-slide-studio';
import { SlidePreviewCard } from './SlidePreviewCard';
import { SlideBlockEditor } from './SlideBlockEditor';

export interface SlideStudioWorkspaceProps {
  initialSlides?: SlideData[];
  className?: string;
}

export function SlideStudioWorkspace({ initialSlides, className }: SlideStudioWorkspaceProps) {
  const {
    slides,
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
    applyFooterLeftToAllSlides,
  } = useSlideStudio({ initialSlides });

  return (
    <div className={cn('space-y-5 animate-in relative pb-16 lg:pb-0', className)}>
      {/* 1. Barra de Herramientas y Acciones Principales */}
      <div className="rounded-2xl border border-border bg-card/60 p-3.5 sm:p-4 space-y-3">
        {/* Fila de Plantillas */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs uppercase tracking-wider font-mono text-muted-foreground shrink-0">
              Plantillas:
            </span>
            <button
              type="button"
              className="btn btn-outline btn-xs h-8 px-3 rounded-lg text-xs shrink-0 whitespace-nowrap"
              onClick={() => handleLoadPreset(PRESET_MANIFIESTO, 'Manifiesto Científico (6)')}
            >
              Manifiesto (6)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-xs h-8 px-3 rounded-lg text-xs shrink-0 whitespace-nowrap"
              onClick={() => handleLoadPreset(PRESET_ULMO_ESTACIONAL, 'Recolección Ulmo (3)')}
            >
              Recolección Ulmo (3)
            </button>
          </div>

          {/* Acciones Rápidas */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-ghost btn-sm h-9 px-3 text-xs flex items-center gap-1.5"
              onClick={handleCopyCaption}
              title="Copiar texto editorial para redes"
            >
              {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span className="hidden sm:inline">Copiar</span> Caption
            </button>

            {canShare ? (
              <button
                type="button"
                disabled={isExporting}
                className="btn btn-outline btn-sm h-9 px-3 text-xs flex items-center gap-1.5"
                onClick={() => handleExportSinglePNG(true)}
                title="Compartir o guardar en dispositivo"
              >
                <Share2 size={14} />
                <span>Compartir</span>
              </button>
            ) : null}

            <button
              type="button"
              disabled={isExporting}
              className="btn btn-outline btn-sm h-9 px-3 text-xs flex items-center gap-1.5"
              onClick={() => handleExportSinglePNG(false)}
              title="Descargar lámina actual en PNG"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Lámina</span> PNG
            </button>

            <button
              type="button"
              disabled={isExporting}
              className="btn btn-primary btn-sm h-9 px-3 text-xs flex items-center gap-1.5"
              onClick={handleExportAllPNGs}
              title="Exportar todas las láminas del carrusel"
            >
              <Layers size={14} />
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

      {/* 4. Selector de Pestañas (Modo Móvil en `< lg` / Tabs de herramientas en desktop) */}
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
          Editor de Lámina
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
          Vista Previa (4:5)
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
          Arsenal de Marca
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">
            {ARSENAL_EDITORIAL.length}
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
                  <span className="text-xs uppercase tracking-wider font-mono text-muted-foreground block font-semibold">
                    1. Aristas & Metadatos de la Lámina
                  </span>
                  <span className="text-[11px] font-mono text-primary/80">
                    Lámina {String(activeSlideIndex + 1).padStart(2, '0')} de {String(slides.length).padStart(2, '0')}
                  </span>
                </div>

                {/* Aristas Superiores (Kickers) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase block mb-1">
                      ↖ Arista Sup. Izquierda (Cuenca / Categoría)
                    </label>
                    <input
                      type="text"
                      className="input-field w-full text-base md:text-xs font-mono"
                      value={activeSlide.kickerLeft}
                      onChange={(e) => updateActiveSlide({ kickerLeft: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase block mb-1">
                      ↗ Arista Sup. Derecha (Anclaje / Coordenada)
                    </label>
                    <input
                      type="text"
                      className="input-field w-full text-base md:text-xs font-mono"
                      value={activeSlide.kickerRight}
                      onChange={(e) => updateActiveSlide({ kickerRight: e.target.value })}
                    />
                  </div>
                </div>

                {/* Insignia Superior (Badge) */}
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase block mb-1">
                    Insignia Superior (Badge)
                  </label>
                  <input
                    type="text"
                    className="input-field w-full text-base md:text-xs font-mono"
                    value={activeSlide.badge}
                    onChange={(e) => updateActiveSlide({ badge: e.target.value })}
                  />
                </div>

                {/* Título Principal */}
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase block mb-1">
                    Título Principal (Cormorant Garamond)
                  </label>
                  <textarea
                    rows={2}
                    className="input-field w-full text-base md:text-sm font-existencial leading-snug"
                    value={activeSlide.title}
                    onChange={(e) => updateActiveSlide({ title: e.target.value })}
                  />
                </div>

                {/* Subtítulo / Bajada Descriptiva */}
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase block mb-1">
                    Subtítulo / Bajada Descriptiva
                  </label>
                  <input
                    type="text"
                    className="input-field w-full text-base md:text-xs"
                    value={activeSlide.subtitle ?? ''}
                    onChange={(e) => updateActiveSlide({ subtitle: e.target.value })}
                  />
                </div>

                {/* Aristas Inferiores (Pie de Lámina) */}
                <div className="pt-2 border-t border-border/60 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] uppercase tracking-wider font-mono text-muted-foreground font-semibold">
                      Aristas Inferiores (Pie de Página)
                    </span>
                    <button
                      type="button"
                      onClick={() => applyFooterLeftToAllSlides(activeSlide.footerLeft || 'obrerayzangano.cl')}
                      className="text-[11px] font-mono text-primary hover:underline flex items-center gap-1 transition-colors"
                      title="Propagar este pie izquierdo a todas las láminas del carrusel"
                    >
                      Copiar pie a todo el carrusel ⮞
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-mono text-muted-foreground uppercase block mb-1">
                        ↙ Arista Inf. Izquierda (URL / Dominio / Firma)
                      </label>
                      <input
                        type="text"
                        className="input-field w-full text-base md:text-xs font-mono"
                        placeholder="obrerayzangano.cl"
                        value={activeSlide.footerLeft ?? ''}
                        onChange={(e) => updateActiveSlide({ footerLeft: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-muted-foreground uppercase block mb-1">
                        ↘ Arista Inf. Derecha (Personalizado / Contador)
                      </label>
                      <input
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
                <span className="text-xs uppercase tracking-wider font-mono text-muted-foreground block font-semibold">
                  2. Bloques Modulares ({activeSlide.blocks?.length || 0})
                </span>

                <div className="space-y-4">
                  {activeSlide.blocks && activeSlide.blocks.length > 0 ? (
                    activeSlide.blocks.map((block: SlideBlock, blockIdx: number) => (
                      <div
                        key={block.id}
                        className="rounded-xl border border-border bg-surface-sunken/40 p-3.5 sm:p-4 space-y-3"
                      >
                        {/* Cabecera del Bloque con Controles Táctiles */}
                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                          <span className="text-xs font-mono uppercase text-primary font-semibold flex items-center gap-1.5">
                            Bloque {String(blockIdx + 1).padStart(2, '0')}: {block.type}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={blockIdx === 0}
                              onClick={() => moveBlock(blockIdx, 'up')}
                              className="btn btn-ghost h-9 w-9 sm:h-7 sm:w-7 p-0 flex items-center justify-center"
                              title="Subir bloque"
                              aria-label="Subir bloque"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              type="button"
                              disabled={blockIdx === activeSlide.blocks.length - 1}
                              onClick={() => moveBlock(blockIdx, 'down')}
                              className="btn btn-ghost h-9 w-9 sm:h-7 sm:w-7 p-0 flex items-center justify-center"
                              title="Bajar bloque"
                              aria-label="Bajar bloque"
                            >
                              <ChevronDown size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeBlock(block.id)}
                              className="btn btn-ghost h-9 w-9 sm:h-7 sm:w-7 p-0 text-destructive hover:bg-destructive/10 flex items-center justify-center"
                              title="Eliminar bloque"
                              aria-label="Eliminar bloque"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Editor de campos atómico con escala anti-zoom */}
                        <SlideBlockEditor
                          block={block}
                          onChange={(updated) => updateBlock(block.id, updated)}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                      Lámina sin bloques modulares. Añade uno a continuación.
                    </div>
                  )}
                </div>

                {/* Botones de adición rápida de bloques */}
                <div className="pt-2">
                  <span className="text-xs font-mono text-muted-foreground uppercase block mb-2 font-medium">
                    + Añadir Bloque Modular:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('paragraph')}
                      className="btn btn-outline btn-sm h-10 sm:h-8 text-xs flex items-center gap-1.5 justify-start px-2.5"
                    >
                      <Plus size={13} /> Párrafo
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('items')}
                      className="btn btn-outline btn-sm h-10 sm:h-8 text-xs flex items-center gap-1.5 justify-start px-2.5"
                    >
                      <Plus size={13} /> Criterios
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('metrics')}
                      className="btn btn-outline btn-sm h-10 sm:h-8 text-xs flex items-center gap-1.5 justify-start px-2.5"
                    >
                      <Plus size={13} /> Métricas
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('comparison')}
                      className="btn btn-outline btn-sm h-10 sm:h-8 text-xs flex items-center gap-1.5 justify-start px-2.5"
                    >
                      <Plus size={13} /> Fases
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('portal')}
                      className="btn btn-outline btn-sm h-10 sm:h-8 text-xs flex items-center gap-1.5 justify-start px-2.5"
                    >
                      <Plus size={13} /> Portal
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlockToActiveSlide('quote')}
                      className="btn btn-outline btn-sm h-10 sm:h-8 text-xs flex items-center gap-1.5 justify-start px-2.5"
                    >
                      <Plus size={13} /> Axioma
                    </button>
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
                {filteredArsenal.map((asset) => (
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
                      <button
                        type="button"
                        onClick={() => handleInsertArsenalBlock(asset)}
                        className="btn btn-outline btn-xs h-9 sm:h-7 text-xs flex items-center gap-1.5"
                      >
                        <Plus size={13} /> Insertar en Lámina
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCreateSlideFromArsenal(asset)}
                        className="btn btn-primary btn-xs h-9 sm:h-7 text-xs flex items-center gap-1.5"
                      >
                        <Sparkles size={13} /> + Crear Lámina
                      </button>
                    </div>
                  </div>
                ))}
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
                      Vista Previa en Vivo (4:5)
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

        {/* Columna Derecha: Vista Previa Fija en Vivo (Desktop `>= lg`) */}
        <div className="hidden lg:block space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
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

            {/* Lienzo visual DOM 4:5 */}
            <div className="flex items-center justify-center py-2">
              <SlidePreviewCard
                slide={activeSlide}
                index={activeSlideIndex}
                total={slides.length}
              />
            </div>

            {/* Ficha técnica compacta */}
            <div className="pt-2 border-t border-border/60 text-xs font-mono text-muted-foreground flex justify-between">
              <span>Resolución: 1080 × 1350 px</span>
              <span>Proporción: 4:5</span>
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
    </div>
  );
}
