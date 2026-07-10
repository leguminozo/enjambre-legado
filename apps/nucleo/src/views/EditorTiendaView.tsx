'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X,
  Monitor,
  Smartphone,
  Save,
  Loader2,
  Upload,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { toast, ImmersiveModal } from '@enjambre/ui';
import { useCMSContent, type CMSSectionKey, type CMSContentItem } from '@/hooks/use-cms-content';
import { getUrlTienda } from '@/lib/publicUrls';

// ── Constants ──────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  servicios: 'Servicios',
  talleres: 'Talleres',
  colecciones: 'Colecciones',
  footer_branding: 'Footer — Marca',
  footer_nav: 'Footer — Nav',
  footer_legal: 'Footer — Legal',
  hero: 'Hero',
  nosotros: 'Nosotros',
  galeria: 'Galería',
  contacto: 'Contacto',
};

/**
 * Plantillas JSON iniciales por sección.
 * 'colecciones' incluye 'image' para que EditableItemCard muestre el uploader.
 */
const SECTION_TEMPLATES: Record<string, Record<string, unknown>> = {
  colecciones: { kicker: '', title: '', desc: '', href: '/catalogo', image: '' },
  servicios: { num: '', title: '', desc: '' },
  talleres: { date: '', title: '', desc: '', action: '' },
  footer_nav: { label: '', href: '/' },
  footer_legal: { label: '', href: '/' },
  hero: { title: '', subtitle: '', cta: '' },
  nosotros: { title: '', desc: '', image: '' },
  galeria: { src: '', alt: '' },
  contacto: { title: '', desc: '', email: '' },
  footer_branding: { tagline: '', email: '' },
};

// ── ContentFieldEditor ─────────────────────────────────────────────────────

function ContentFieldEditor({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: string;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  if (typeof value === 'string') {
    if (fieldKey.includes('desc') || fieldKey.includes('description') || fieldKey.includes('text')) {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-surface-sunken border border-border rounded-lg p-3 text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-accent"
        />
      );
    }
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      />
    );
  }

  if (typeof value === 'number') {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      />
    );
  }

  if (typeof value === 'boolean') {
    return (
      <button
        onClick={() => onChange(!value)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          value
            ? 'bg-accent/20 text-accent border border-accent'
            : 'bg-surface-sunken border border-border text-muted-foreground'
        }`}
      >
        {value ? 'Sí' : 'No'}
      </button>
    );
  }

  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
    />
  );
}

// ── EditableItemCard ───────────────────────────────────────────────────────

interface EditableItemCardProps {
  item: CMSContentItem;
  activeSection: string;
  onUpdate: (id: string, content: Record<string, unknown>, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onImageUpload: (file: File, fieldName: string, itemId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function EditableItemCard({
  item,
  activeSection,
  onUpdate,
  onDelete,
  onImageUpload,
  isUpdating,
  isDeleting,
}: EditableItemCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [localContent, setLocalContent] = useState<Record<string, unknown>>(item.content);
  const [localActive, setLocalActive] = useState(item.is_active);
  const [dirty, setDirty] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetField, setUploadTargetField] = useState<string>('');

  useEffect(() => {
    setLocalContent(item.content);
    setLocalActive(item.is_active);
    setDirty(false);
    setUploadingField(null);
  }, [item]);

  const handleFieldChange = useCallback((key: string, val: unknown) => {
    setLocalContent((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
  }, []);

  const handleSave = () => {
    onUpdate(item.id, localContent, localActive);
  };

  const handleToggleActive = () => {
    setLocalActive(!localActive);
    setDirty(true);
  };

  const handleImageClick = (fieldName: string) => {
    setUploadTargetField(fieldName);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetField) return;
    setUploadingField(uploadTargetField);
    onImageUpload(file, uploadTargetField, item.id);
    e.target.value = '';
  };

  const titleField = localContent.title ?? localContent.label ?? localContent.kicker ?? null;

  const isImageField = (key: string) =>
    key.toLowerCase().includes('image') ||
    key.toLowerCase().includes('img') ||
    key.toLowerCase().includes('foto') ||
    key.toLowerCase().includes('icon') ||
    key.toLowerCase().includes('src');

  return (
    <div className={`bg-surface rounded-xl border border-border overflow-hidden transition-all ${!localActive ? 'opacity-60' : ''}`}>
      {/* Card Header — always visible, touch-friendly */}
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-surface-raised/50 active:bg-surface-raised transition-colors select-none min-h-[52px]"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical size={15} className="text-muted-foreground shrink-0" />
        <ChevronDown
          size={15}
          className={`text-muted-foreground shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`}
        />
        <span className="text-sm font-medium text-foreground flex-1 truncate">
          {titleField ? String(titleField) : `Item #${item.item_order + 1}`}
        </span>

        {/* Controls always visible on mobile */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleToggleActive}
            className={`p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
              localActive ? 'text-accent hover:bg-accent/10' : 'text-muted-foreground hover:bg-surface-raised'
            }`}
            title={localActive ? 'Ocultar en tienda' : 'Mostrar en tienda'}
          >
            {localActive ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            disabled={isDeleting}
            className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Eliminar"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-4 space-y-4 border-t border-border pt-3 bg-surface-sunken">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {Object.entries(localContent).map(([key, val]) => (
            <div key={key} className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {key}
              </label>
              {isImageField(key) ? (
                <div className="space-y-2">
                  {val && typeof val === 'string' && val.startsWith('http') ? (
                    <img
                      src={val}
                      alt={key}
                      className="w-full h-32 object-cover rounded-lg border border-border bg-background"
                    />
                  ) : null}
                  <button
                    onClick={() => handleImageClick(key)}
                    disabled={uploadingField === key}
                    className="flex w-full justify-center items-center gap-2 px-3 py-3 rounded-lg text-xs font-medium bg-background border border-dashed border-accent/40 hover:border-accent transition-colors disabled:opacity-50 min-h-[44px]"
                  >
                    {uploadingField === key ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {val && typeof val === 'string' && val.startsWith('http')
                      ? 'Cambiar imagen'
                      : 'Subir imagen'}
                  </button>
                </div>
              ) : key === 'href' || key === 'action' ? (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <ContentFieldEditor fieldKey={key} value={val} onChange={(v) => handleFieldChange(key, v)} />
                  </div>
                  {typeof val === 'string' && val.startsWith('/') && (
                    <a
                      href={`${getUrlTienda()}${val}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-border hover:border-accent/50 text-muted-foreground hover:text-accent transition-colors bg-background flex items-center justify-center min-w-[40px]"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ) : (
                <ContentFieldEditor fieldKey={key} value={val} onChange={(v) => handleFieldChange(key, v)} />
              )}
            </div>
          ))}

          {/* Save button — sticky feel, always visible if dirty */}
          {dirty && (
            <div className="pt-3 border-t border-border">
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-md disabled:opacity-50 min-h-[44px]"
              >
                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Guardar cambios
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SectionNav — pills on mobile, select on desktop ────────────────────────

interface SectionNavProps {
  sectionKeys: string[];
  activeSection: string;
  onSelect: (key: string) => void;
}

function SectionNav({ sectionKeys, activeSection, onSelect }: SectionNavProps) {
  return (
    <>
      {/* Mobile: horizontal scrollable pills */}
      <div className="md:hidden flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none -mx-4">
        {sectionKeys.map((key) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              activeSection === key
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'bg-surface-raised text-muted-foreground hover:text-foreground'
            }`}
          >
            {SECTION_LABELS[key] ?? key}
          </button>
        ))}
      </div>

      {/* Desktop: compact select dropdown */}
      <div className="hidden md:block">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
          Sección
        </label>
        <div className="relative">
          <select
            value={activeSection}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full appearance-none bg-background border border-border rounded-lg pl-3 pr-10 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {sectionKeys.map((key) => (
              <option key={key} value={key}>
                {SECTION_LABELS[key] ?? key}
              </option>
            ))}
          </select>
          <ChevronDown size={15} className="absolute right-3 top-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>
    </>
  );
}

// ── ItemsPanel ─────────────────────────────────────────────────────────────

interface ItemsPanelProps {
  items: CMSContentItem[];
  activeSection: string;
  onUpdate: (id: string, content: Record<string, unknown>, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onImageUpload: (file: File, fieldName: string, itemId: string) => void;
  onAddNew: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function ItemsPanel({
  items,
  activeSection,
  onUpdate,
  onDelete,
  onImageUpload,
  onAddNew,
  isUpdating,
  isDeleting,
}: ItemsPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">
          {SECTION_LABELS[activeSection] ?? activeSection}
        </h3>
        <button
          onClick={onAddNew}
          className="flex items-center gap-1.5 px-3 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors text-xs font-medium min-h-[36px]"
        >
          <Plus size={14} />
          Añadir
        </button>
      </div>

      <div className="space-y-3 pb-8">
        {items.map((item) => (
          <EditableItemCard
            key={item.id}
            item={item}
            activeSection={activeSection}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onImageUpload={onImageUpload}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
          />
        ))}

        {items.length === 0 && (
          <div className="text-center py-12 px-4 border border-dashed border-border rounded-xl">
            <p className="text-sm text-muted-foreground mb-3">
              Sin elementos en esta sección.
            </p>
            <button
              onClick={onAddNew}
              className="text-accent text-sm font-medium hover:underline"
            >
              Añadir el primero
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── EditorTiendaView (main) ────────────────────────────────────────────────

export function EditorTiendaView() {
  const cms = useCMSContent();
  const [activeSection, setActiveSection] = useState<string>('colecciones');
  const [iframeKey, setIframeKey] = useState(0);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showNewForm, setShowNewForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Derive default JSON from section template
  const defaultTemplate = SECTION_TEMPLATES[activeSection] ?? { title: '', desc: '' };
  const [newContent, setNewContent] = useState<Record<string, unknown>>(defaultTemplate);

  // Update template when section changes
  useEffect(() => {
    const template = SECTION_TEMPLATES[activeSection] ?? { title: '', desc: '' };
    setNewContent(template);
  }, [activeSection]);

  // Detect mobile
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const groupedData = cms.data?.data ?? {};
  const sectionKeys = Object.keys(groupedData).length > 0
    ? Object.keys(groupedData).sort()
    : [...cms.sections];

  const currentItems = groupedData[activeSection] ?? [];

  const refreshIframe = () => setIframeKey((prev) => prev + 1);

  const handleUpdateItem = (id: string, content: Record<string, unknown>, isActive: boolean) => {
    cms.updateItem.mutate(
      { id, content, is_active: isActive },
      {
        onSuccess: () => {
          toast('Contenido guardado', { type: 'success' });
          refreshIframe();
        },
        onError: (err) => toast(err.message, { type: 'error' }),
      },
    );
  };

  const handleDeleteItem = (id: string) => {
    cms.deleteItem.mutate(id, {
      onSuccess: () => {
        toast('Item eliminado', { type: 'success' });
        refreshIframe();
      },
      onError: (err) => toast(err.message, { type: 'error' }),
    });
  };

  const handleImageUpload = (file: File, fieldName: string, itemId: string) => {
    const sectionKey = activeSection as CMSSectionKey;
    cms.uploadImage.mutate(
      { file, sectionKey, fieldName },
      {
        onSuccess: (result) => {
          const currentItem = groupedData[activeSection]?.find((i) => i.id === itemId);
          if (currentItem) {
            const updatedContent = { ...currentItem.content, [fieldName]: result.publicUrl };
            cms.updateItem.mutate(
              { id: itemId, content: updatedContent },
              {
                onSuccess: () => {
                  toast('Imagen actualizada', { type: 'success' });
                  refreshIframe();
                },
                onError: (err) => toast(err.message, { type: 'error' }),
              },
            );
          }
        },
        onError: (err) => toast(err.message, { type: 'error' }),
      },
    );
  };

  const handleCreateItem = () => {
    try {
      cms.createItem.mutate(
        { section_key: activeSection as CMSSectionKey, content: newContent },
        {
          onSuccess: () => {
            toast('Elemento añadido', { type: 'success' });
            setShowNewForm(false);
            refreshIframe();
          },
          onError: (err) => toast(err.message, { type: 'error' }),
        },
      );
    } catch {
      toast('Error al crear elemento', { type: 'error' });
    }
  };

  const tiendaUrl = getUrlTienda();

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-120px)] -mt-2 mb-4 mx-0 lg:-mx-4 bg-background border border-border rounded-xl overflow-hidden shadow-lg relative z-10 animate-in fade-in zoom-in-95 duration-300">
      {/* ── Top bar ── */}
      <div className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 shrink-0 shadow-sm z-10 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display font-medium text-base text-foreground truncate">
            Editor de Tienda
          </span>
          {cms.isLoading && <Loader2 size={14} className="animate-spin text-accent shrink-0" />}
        </div>

        {/* Desktop: view mode toggle */}
        <div className="hidden md:flex items-center gap-2 bg-secondary/50 p-1 rounded-lg border border-border/50">
          <button
            onClick={() => setViewMode('desktop')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'desktop' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Vista Escritorio"
          >
            <Monitor size={15} />
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'mobile' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Vista Móvil"
          >
            <Smartphone size={15} />
          </button>
        </div>

        {/* Mobile: link to live site instead of iframe */}
        <div className="md:hidden">
          {tiendaUrl && (
            <a
              href={tiendaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
            >
              Ver tienda <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Desktop: live site link */}
        <div className="hidden md:flex items-center gap-3">
          {tiendaUrl && (
            <a
              href={tiendaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              Ver en vivo <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── MOBILE layout: single column ── */}
        {isMobile && (
          <div className="flex-1 flex flex-col overflow-hidden bg-surface-sunken">
            {/* Section nav pills */}
            <div className="px-4 pt-3 pb-2 bg-surface border-b border-border shrink-0">
              <SectionNav
                sectionKeys={sectionKeys}
                activeSection={activeSection}
                onSelect={setActiveSection}
              />
            </div>

            {/* Items */}
            <ItemsPanel
              items={currentItems}
              activeSection={activeSection}
              onUpdate={handleUpdateItem}
              onDelete={handleDeleteItem}
              onImageUpload={handleImageUpload}
              onAddNew={() => setShowNewForm(true)}
              isUpdating={cms.updateItem.isPending}
              isDeleting={cms.deleteItem.isPending}
            />
          </div>
        )}

        {/* ── DESKTOP layout: sidebar + iframe ── */}
        {!isMobile && (
          <>
            {/* Left sidebar */}
            <div className="w-[360px] shrink-0 border-r border-border bg-surface-sunken flex flex-col overflow-hidden">
              {/* Section selector */}
              <div className="p-4 border-b border-border bg-surface shrink-0">
                <SectionNav
                  sectionKeys={sectionKeys}
                  activeSection={activeSection}
                  onSelect={setActiveSection}
                />
              </div>

              {/* Items list */}
              <ItemsPanel
                items={currentItems}
                activeSection={activeSection}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
                onImageUpload={handleImageUpload}
                onAddNew={() => setShowNewForm(true)}
                isUpdating={cms.updateItem.isPending}
                isDeleting={cms.deleteItem.isPending}
              />
            </div>

            {/* Right: iframe preview */}
            <div className="flex-1 bg-secondary/30 relative flex flex-col items-center overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                }}
              />

              <div className="flex-1 w-full flex items-center justify-center p-4 lg:p-8 overflow-hidden">
                <div
                  className={`relative bg-background border border-border shadow-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    viewMode === 'mobile'
                      ? 'w-[375px] h-[812px] rounded-[3rem] ring-8 ring-surface-raised ring-offset-2 ring-offset-background'
                      : 'w-full h-full rounded-xl'
                  }`}
                >
                  {viewMode === 'mobile' && (
                    <div className="absolute top-0 inset-x-0 h-6 bg-surface-raised z-20 flex justify-center items-center rounded-t-[3rem]">
                      <div className="w-16 h-1.5 bg-border rounded-full" />
                    </div>
                  )}

                  {!tiendaUrl ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-sunken">
                      <div className="text-center space-y-2">
                        <Monitor size={48} className="mx-auto text-muted-foreground opacity-50" />
                        <p className="text-sm font-medium text-muted-foreground">
                          URL de Tienda no configurada
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          Verifica NEXT_PUBLIC_URL_TIENDA en .env
                        </p>
                      </div>
                    </div>
                  ) : (
                    <iframe
                      key={iframeKey}
                      src={tiendaUrl}
                      title="Vista Previa de Tienda"
                      className={`w-full h-full border-none bg-background ${viewMode === 'mobile' ? 'pt-6' : ''}`}
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Add new item modal ── */}
      <ImmersiveModal
        open={showNewForm}
        onClose={() => setShowNewForm(false)}
        eyebrow={SECTION_LABELS[activeSection] ?? activeSection}
        title="Añadir elemento"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="btn btn-outline btn-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateItem}
              disabled={cms.createItem.isPending}
              className="btn btn-primary btn-sm"
            >
              {cms.createItem.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Crear'}
            </button>
          </>
        }
      >
        <p className="text-xs text-muted-foreground mb-3">
          Completa los campos a continuación para añadir un nuevo elemento. Los campos con <code className="text-accent">image</code> o <code className="text-accent">src</code> permitirán subir fotos luego.
        </p>
        <div className="space-y-4">
          {Object.entries(newContent).map(([key, val]) => (
            <div key={key} className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {key}
              </label>
              <ContentFieldEditor
                fieldKey={key}
                value={val}
                onChange={(v) => setNewContent((prev) => ({ ...prev, [key]: v }))}
              />
            </div>
          ))}
        </div>
      </ImmersiveModal>
    </div>
  );
}
