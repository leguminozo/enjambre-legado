'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Bell,
  Database,
  Construction,
  Palette,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Upload,
  Loader2,
  ChevronDown,
  ChevronRight,
  Save,
  ExternalLink,
} from 'lucide-react';
import { useTheme, type Theme } from '@enjambre/ui';
import { toast } from '@enjambre/ui';
import { useCMSContent, type CMSSectionKey, type CMSContentItem } from '@/lib/use-cms-content';
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

const SECTION_ICONS: Record<string, string> = {
  servicios: 'briefcase',
  talleres: 'calendar',
  colecciones: 'layers',
  footer_branding: 'tag',
  footer_nav: 'navigation',
  footer_legal: 'scale',
  hero: 'sparkles',
  nosotros: 'users',
  galeria: 'image',
  contacto: 'mail',
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

function ItemCard({
  item,
  onUpdate,
  onDelete,
  onImageUpload,
  isUpdating,
  isDeleting,
}: {
  item: CMSContentItem;
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

  const handleFieldChange = useCallback((key: string, val: unknown) => {
    setLocalContent((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
  }, []);

  const handleSave = () => {
    onUpdate(item.id, localContent, localActive);
    setDirty(false);
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
    <div className={`bg-surface-sunken rounded-xl border border-border overflow-hidden transition-all ${!localActive ? 'opacity-60' : ''}`}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-raised/50 transition-colors"
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
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {Object.entries(localContent).map(([key, val]) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {key}
              </label>
              {isImageField(key) ? (
                <div className="space-y-2">
                  {val && typeof val === 'string' && val.startsWith('http') ? (
                    <img
                      src={val}
                      alt={key}
                      className="w-32 h-20 object-cover rounded-lg border border-border"
                    />
                  ) : null}
                  <button
                    onClick={() => handleImageClick(key)}
                    disabled={uploadingField === key}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-surface border border-border hover:border-accent/50 transition-colors disabled:opacity-50"
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
                      className="p-2 rounded-lg border border-border hover:border-accent/50 text-muted-foreground hover:text-accent transition-colors"
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

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => onDelete(item.id)}
              disabled={isDeleting}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Eliminar
            </button>

            {dirty && (
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Guardar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ConfiguracionView() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const cms = useCMSContent();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newContent, setNewContent] = useState('{\n  "title": "",\n  "desc": ""\n}');

  const themes: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun size={18} />, label: 'Claro' },
    { value: 'dark', icon: <Moon size={18} />, label: 'Oscuro' },
    { value: 'system', icon: <Monitor size={18} />, label: 'Sistema' },
  ];

  const groupedData = cms.data?.data ?? {};
  const sectionKeys = Object.keys(groupedData).length > 0
    ? Object.keys(groupedData).sort()
    : cms.sections;

  const handleUpdateItem = (id: string, content: Record<string, unknown>, isActive: boolean) => {
    cms.updateItem.mutate(
      { id, content, is_active: isActive },
      {
        onSuccess: () => toast('Contenido actualizado', { type: 'success' }),
        onError: (err) => toast(err.message, { type: 'error' }),
      }
    );
  };

  const handleDeleteItem = (id: string) => {
    cms.deleteItem.mutate(id, {
      onSuccess: () => toast('Item eliminado', { type: 'success' }),
      onError: (err) => toast(err.message, { type: 'error' }),
    });
  };

  const handleImageUpload = (file: File, fieldName: string, itemId: string) => {
    const sectionKey = (activeSection ?? 'hero') as CMSSectionKey;
    cms.uploadImage.mutate(
      { file, sectionKey, fieldName },
      {
        onSuccess: (result) => {
          const currentItem = groupedData[activeSection ?? '']?.find((i) => i.id === itemId);
          if (currentItem) {
            const updatedContent = { ...currentItem.content, [fieldName]: result.publicUrl };
            cms.updateItem.mutate(
              { id: itemId, content: updatedContent },
              {
                onSuccess: () => toast('Imagen subida y guardada', { type: 'success' }),
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
    if (!activeSection) return;
    try {
      const parsed = JSON.parse(newContent);
      cms.createItem.mutate(
        {
          section_key: activeSection as CMSSectionKey,
          content: parsed,
        },
        {
          onSuccess: () => {
            toast('Item creado', { type: 'success' });
            setShowNewForm(false);
            setNewContent('{\n  "title": "",\n  "desc": ""\n}');
          },
          onError: (err) => toast(err.message, { type: 'error' }),
        }
      );
    } catch {
      toast('JSON inválido — revisa el formato', { type: 'error' });
    }
  };

  return (
    <div className="space-y-8 animate-in">
      <div className="hero-banner">
        <h1 className="hero-title">Configuración</h1>
        <p className="hero-subtitle">Personaliza tu experiencia y el contenido de la tienda</p>
      </div>

      <div className="max-w-4xl space-y-8">
        <section className="space-y-6 bg-surface p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 text-accent">
            {resolvedTheme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
            <h3 className="text-sm font-bold uppercase tracking-widest">Apariencia</h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  theme === t.value
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-secondary hover:border-accent/50'
                }`}
              >
                {t.icon}
                <span className="text-xs uppercase tracking-widest">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6 bg-surface p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 text-accent">
            <Palette size={18} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Contenido de la Tienda</h3>
          </div>

          <p className="text-xs text-muted-foreground">
            Edita los textos e imágenes que se muestran en la tienda pública. Los cambios se reflejan en tiempo real.
          </p>

          {cms.isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-accent" />
            </div>
          )}

          {cms.error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive text-destructive text-sm">
              Error al cargar contenido: {cms.error.message}
            </div>
          )}

          {!cms.isLoading && !cms.error && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {sectionKeys.map((key) => {
                  const count = groupedData[key]?.length ?? 0;
                  const isActive = activeSection === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveSection(isActive ? null : key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-surface-sunken border border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'
                      }`}
                    >
                      {SECTION_LABELS[key] ?? key}
                      {count > 0 && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          isActive ? 'bg-accent-foreground/20' : 'bg-surface-raised'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {activeSection && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">
                      {SECTION_LABELS[activeSection] ?? activeSection}
                    </h4>
                    <button
                      onClick={() => setShowNewForm(!showNewForm)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                    >
                      <Plus size={14} />
                      Nuevo item
                    </button>
                  </div>

                  {showNewForm && (
                    <div className="bg-surface-sunken rounded-xl border border-border p-4 space-y-3">
                      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Contenido (JSON)
                      </label>
                      <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        rows={6}
                        className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground font-mono resize-y focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowNewForm(false)}
                          className="px-3 py-2 rounded-lg text-xs font-medium border border-border hover:border-accent/50 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleCreateItem}
                          disabled={cms.createItem.isPending}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
                        >
                          {cms.createItem.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                          Crear
                        </button>
                      </div>
                    </div>
                  )}

                  {(groupedData[activeSection] ?? []).map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                      onImageUpload={handleImageUpload}
                      isUpdating={cms.updateItem.isPending}
                      isDeleting={cms.deleteItem.isPending}
                    />
                  ))}

                  {(groupedData[activeSection] ?? []).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No hay items en esta sección. Crea uno nuevo.
                    </div>
                  )}
                </div>
              )}

              {!activeSection && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Selecciona una sección para editar su contenido
                </div>
              )}
            </div>
          )}
        </section>

        <section className="space-y-6 bg-surface p-6 rounded-2xl border border-border opacity-60">
          <div className="flex items-center gap-3 text-accent">
            <Bell size={18} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Notificaciones</h3>
            <span className="text-xs text-muted-foreground">(en desarrollo)</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div>
              <p className="text-sm font-medium">Notificaciones push</p>
              <p className="text-xs text-muted-foreground">Funcionalidad en desarrollo. Las alertas se muestran en el panel principal.</p>
            </div>
            <Construction size={18} className="text-muted-foreground" />
          </div>
        </section>

        <section className="space-y-6 bg-surface p-6 rounded-2xl border border-border opacity-60">
          <div className="flex items-center gap-3 text-accent">
            <Database size={18} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Datos</h3>
            <span className="text-xs text-muted-foreground">(en desarrollo)</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
            <div>
              <p className="text-sm font-medium">Sincronización automática</p>
              <p className="text-xs text-muted-foreground">La sincronización se gestiona automáticamente vía Supabase Realtime.</p>
            </div>
            <Construction size={18} className="text-muted-foreground" />
          </div>
        </section>
      </div>
    </div>
  );
}
