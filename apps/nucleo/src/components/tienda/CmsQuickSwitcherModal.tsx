'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ExternalLink, CornerDownLeft, Sparkles, AlertCircle } from 'lucide-react';
import { ImmersiveModal } from '@enjambre/ui';
import {
  PAGE_WORKSPACE_DEFS,
  PAGE_WORKSPACE_ORDER,
  HOME_SECTION_KEYS,
  type PageWorkspaceId,
} from '@/lib/editor-tienda-sections';

interface QuickSectionItem {
  id: string;
  sectionKey: string;
  label: string;
  hint: string;
  workspaceLabel: string;
  previewPath: string;
  hasDraft?: boolean;
}

interface CmsQuickSwitcherModalProps {
  open: boolean;
  onClose: () => void;
  onSelectSection: (sectionKey: string) => void;
  draftSectionKeys?: Set<string>;
}

export function CmsQuickSwitcherModal({
  open,
  onClose,
  onSelectSection,
  draftSectionKeys = new Set(),
}: CmsQuickSwitcherModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Construir catálogo plano de todas las secciones accesibles
  const allSections = useMemo<QuickSectionItem[]>(() => {
    const list: QuickSectionItem[] = [];

    // 1. Registro Territorial y otros Workspaces
    for (const wsId of PAGE_WORKSPACE_ORDER) {
      const def = PAGE_WORKSPACE_DEFS[wsId];
      if (!def) continue;
      for (const node of def.nodes) {
        list.push({
          id: `${wsId}-${node.id}`,
          sectionKey: node.sectionKey,
          label: node.label,
          hint: def.hint,
          workspaceLabel: def.label,
          previewPath: node.previewPath,
          hasDraft: draftSectionKeys.has(node.sectionKey),
        });
      }
    }

    // 2. Home nodes principales
    for (const key of HOME_SECTION_KEYS) {
      if (!list.some((i) => i.sectionKey === key)) {
        list.push({
          id: `home-${key}`,
          sectionKey: key,
          label: key.replace(/_/g, ' '),
          hint: 'Bloque del Home principal',
          workspaceLabel: 'Inicio (Home)',
          previewPath: '/',
          hasDraft: draftSectionKeys.has(key),
        });
      }
    }

    return list;
  }, [draftSectionKeys]);

  // Filtrado reactivo en tiempo real
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allSections;
    return allSections.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.workspaceLabel.toLowerCase().includes(q) ||
        item.sectionKey.toLowerCase().includes(q) ||
        item.hint.toLowerCase().includes(q),
    );
  }, [allSections, query]);

  // Reset del índice al buscar
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Foco automático en el input al abrir
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filtered.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filtered[selectedIndex];
      if (target) {
        onSelectSection(target.sectionKey);
        onClose();
      }
    }
  };

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      eyebrow="Navegación Rápida · CMS"
      title="Saltar a Sección (⌘K)"
      size="md"
    >
      <div className="space-y-3" onKeyDown={handleKeyDown}>
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe para buscar... (ej: 'hero', 'faq', 'despacho', 'carta')"
            className="w-full min-h-12 rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent shadow-inner"
          />
          <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-surface-raised border border-border rounded">
            ESC para salir
          </kbd>
        </div>

        {/* Lista de resultados */}
        <div className="max-h-[55vh] overflow-y-auto space-y-1 pr-1 scrollbar-none">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs space-y-1">
              <AlertCircle size={20} className="mx-auto text-muted-foreground/50 mb-1" />
              <p>No se encontraron secciones para &quot;{query}&quot;</p>
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectSection(item.sectionKey);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-accent/60 bg-accent/10 shadow-xs'
                      : 'border-border/50 bg-background/60 hover:bg-surface-raised/60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {item.label}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground shrink-0">
                        {item.workspaceLabel}
                      </span>
                      {item.hasDraft ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                          borrador
                        </span>
                      ) : null}
                    </div>
                    {item.hint ? (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {item.hint}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
                    {item.previewPath ? (
                      <span className="text-[11px] font-mono opacity-60 hidden md:inline">
                        {item.previewPath}
                      </span>
                    ) : null}
                    {isSelected ? (
                      <CornerDownLeft size={14} className="text-accent" />
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Atajos de ayuda al pie */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>↑↓ Navegar</span>
            <span>↵ Abrir sección</span>
          </div>
          <span>{filtered.length} secciones disponibles</span>
        </div>
      </div>
    </ImmersiveModal>
  );
}
