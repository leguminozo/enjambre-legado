import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X,
  Monitor,
  Smartphone,
  Save,
  Loader2,
  Image as ImageIcon,
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

const SECTION_LABELS: Record<string, string> = {
  servicios: 'Servicios',
  talleres: 'Talleres',
  colecciones: 'Colecciones',
  footer_branding: 'Footer — Marca',
  footer_nav: 'Footer — Navegación',
  footer_legal: 'Footer — Legal',
  hero: 'Hero',
  nosotros: 'Nosotros',
  galeria: 'Galería',
  contacto: 'Contacto',
};

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

function EditableItemCard({
  item,
  activeSection,
  onUpdate,
  onDelete,
  onImageUpload,
  isUpdating,
  isDeleting,
}: {
  item: CMSContentItem;
  activeSection: string;
  onUpdate: (id: string, content: Record<string, unknown>, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onImageUpload: (file: File, fieldName: string, itemId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [localContent, setLocalContent] = useState<Record<string, unknown>>(item.content);
  const [localActive, setLocalActive] = useState(item.is_active);
  const [dirty, setDirty] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetField, setUploadTargetField] = useState<string>('');

  // Sync when prop item changes after a save or external update
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
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-surface-raised/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical size={16} className="text-muted-foreground shrink-0" />
        <ChevronDown
          size={16}
          className={`text-muted-foreground shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`}
        />
        <span className="text-sm font-medium text-foreground flex-1 truncate">
          {titleField ? String(titleField) : `Item #${item.item_order + 1}`}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleActive();
          }}
          className={`p-1.5 rounded-lg transition-colors ${
            localActive ? 'text-accent hover:bg-accent/10' : 'text-muted-foreground hover:bg-surface-raised'
          }`}
          title={localActive ? 'Ocultar en tienda' : 'Mostrar en tienda'}
        >
          {localActive ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>

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
                    className="flex w-full justify-center items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-background border border-border hover:border-accent/50 transition-colors disabled:opacity-50"
                  >
                    {uploadingField === key ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {val ? 'Cambiar imagen' : 'Subir imagen'}
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
                      className="p-2 rounded-lg border border-border hover:border-accent/50 text-muted-foreground hover:text-accent transition-colors bg-background flex items-center justify-center"
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

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              onClick={() => onDelete(item.id)}
              disabled={isDeleting}
              className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              title="Eliminar este elemento"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>

            {dirty && (
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-md disabled:opacity-50"
              >
                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Guardar Cambios
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function StoreEditorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const cms = useCMSContent();
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [iframeKey, setIframeKey] = useState(0);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newContent, setNewContent] = useState('{\n  "title": "",\n  "desc": ""\n}');

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const groupedData = cms.data?.data ?? {};
  const sectionKeys = Object.keys(groupedData).length > 0
    ? Object.keys(groupedData).sort()
    : cms.sections;

  // Function to refresh iframe
  const refreshIframe = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleUpdateItem = (id: string, content: Record<string, unknown>, isActive: boolean) => {
    cms.updateItem.mutate(
      { id, content, is_active: isActive },
      {
        onSuccess: () => {
          toast('Contenido guardado', { type: 'success' });
          refreshIframe();
        },
        onError: (err) => toast(err.message, { type: 'error' }),
      }
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
              }
            );
          }
        },
        onError: (err) => toast(err.message, { type: 'error' }),
      }
    );
  };

  const handleCreateItem = () => {
    try {
      const parsed = JSON.parse(newContent);
      cms.createItem.mutate(
        {
          section_key: activeSection as CMSSectionKey,
          content: parsed,
        },
        {
          onSuccess: () => {
            toast('Nuevo item añadido', { type: 'success' });
            setShowNewForm(false);
            setNewContent('{\n  "title": "",\n  "desc": ""\n}');
            refreshIframe();
          },
          onError: (err) => toast(err.message, { type: 'error' }),
        }
      );
    } catch {
      toast('Formato JSON inválido para la estructura inicial', { type: 'error' });
    }
  };

  const tiendaUrl = getUrlTienda();

  return (
    <div className="fixed inset-0 z-[220] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="absolute inset-0 bg-background/72 backdrop-blur-md" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Editor de tienda visual"
        className="relative z-10 flex flex-1 min-h-0 flex-col bg-background border border-border/60 shadow-2xl"
      >
      {/* Top Navigation Bar */}
      <div className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
          <div className="font-display font-medium text-lg text-foreground flex items-center gap-2">
            Editor de Tienda Visual
            {cms.isLoading && <Loader2 size={16} className="animate-spin text-accent ml-2" />}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-lg border border-border/50">
          <button
            onClick={() => setViewMode('desktop')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'desktop' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Vista Escritorio"
          >
            <Monitor size={16} />
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'mobile' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Vista Móvil"
          >
            <Smartphone size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={tiendaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            Ver sitio en vivo <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Form Editor */}
        <div className="w-[380px] shrink-0 border-r border-border bg-surface-sunken flex flex-col overflow-hidden z-10 relative">
          
          {/* Section Selector */}
          <div className="p-4 border-b border-border bg-surface shrink-0">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              Sección a Editar
            </label>
            <div className="relative">
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
                className="w-full appearance-none bg-background border border-border rounded-lg pl-3 pr-10 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {sectionKeys.map((key) => (
                  <option key={key} value={key}>
                    {SECTION_LABELS[key] ?? key}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                Elementos de {SECTION_LABELS[activeSection] ?? activeSection}
              </h3>
              <button
                onClick={() => setShowNewForm(true)}
                className="p-1.5 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors"
                title="Añadir nuevo elemento"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-4 pb-8">
              {(groupedData[activeSection] ?? []).map((item) => (
                <EditableItemCard
                  key={item.id}
                  item={item}
                  activeSection={activeSection}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  onImageUpload={handleImageUpload}
                  isUpdating={cms.updateItem.isPending}
                  isDeleting={cms.deleteItem.isPending}
                />
              ))}

              {(groupedData[activeSection] ?? []).length === 0 && !showNewForm && (
                <div className="text-center py-12 px-4 border border-dashed border-border rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">No hay elementos configurados en esta sección.</p>
                  <button
                    onClick={() => setShowNewForm(true)}
                    className="text-accent text-sm font-medium hover:underline"
                  >
                    Haz clic aquí para añadir el primero
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Area: Iframe Preview */}
        <div className="flex-1 bg-secondary/30 relative flex flex-col items-center overflow-hidden">
          {/* subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}>
          </div>

          <div className={`flex-1 w-full flex items-center justify-center p-4 lg:p-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden`}>
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
                      Verifica NEXT_PUBLIC_URL_TIENDA en tus variables de entorno.
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

      </div>
      </div>

      <ImmersiveModal
        open={showNewForm}
        onClose={() => setShowNewForm(false)}
        eyebrow="CMS"
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
              {cms.createItem.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Crear item'}
            </button>
          </>
        }
      >
        <p className="text-xs text-muted-foreground mb-3">
          Define la estructura inicial del elemento en JSON. Una vez creado, podrás editarlo visualmente.
        </p>
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          rows={8}
          className="w-full bg-background border border-border rounded-lg p-3 text-xs text-foreground font-mono resize-y focus:outline-none focus:ring-2 focus:ring-accent"
          spellCheck={false}
        />
      </ImmersiveModal>
    </div>
  );
}
