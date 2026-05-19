'use client';

import { FileText, Plus, Search, Edit3, Trash2, Loader2, ChevronDown, ChevronRight, Eye, EyeOff, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type ContentItem = {
  id: string;
  section_key: string;
  item_order: number;
  content: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type GroupedSection = {
  key: string;
  items: ContentItem[];
  expanded: boolean;
};

const SECTION_LABELS: Record<string, string> = {
  servicios: 'Servicios',
  talleres: 'Talleres',
  colecciones: 'Colecciones',
  footer_branding: 'Footer — Marca',
  footer_nav: 'Footer — Navegación',
  footer_legal: 'Footer — Legal',
  privacidad: 'Legal — Privacidad',
  terminos: 'Legal — Términos',
  cancelacion: 'Legal — Cancelación',
  envio: 'Legal — Envío',
  reembolso: 'Legal — Reembolso',
};

export function ContentView() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({
    section_key: '',
    item_order: 0,
    content: '{}',
    is_active: true,
  });

  const loadContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/content', { cache: 'no-store' });
      const json = (await res.json()) as { data?: ContentItem[]; error?: string };
      if (!res.ok) throw new Error(json.error || 'Error cargando contenido');
      setItems(json.data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error cargando contenido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadContent();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, ContentItem[]>();
    for (const item of items) {
      const existing = map.get(item.section_key) ?? [];
      existing.push(item);
      map.set(item.section_key, existing);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return grouped;
    return grouped.filter(([key, items]) => {
      const keyMatch = key.toLowerCase().includes(s);
      const contentMatch = items.some((i) => JSON.stringify(i.content).toLowerCase().includes(s));
      return keyMatch || contentMatch;
    });
  }, [q, grouped]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const startEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setEditContent(JSON.stringify(item.content, null, 2));
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(editContent);
      } catch {
        setError('JSON inválido. Revisá la sintaxis.');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content: parsed }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Error guardando');

      setEditingId(null);
      await loadContent();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: ContentItem) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Error cambiando estado');
      await loadContent();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error cambiando estado');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Error eliminando');
      await loadContent();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error eliminando');
    } finally {
      setSaving(false);
    }
  };

  const createItem = async () => {
    setSaving(true);
    setError(null);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(newForm.content);
      } catch {
        setError('JSON inválido en el contenido.');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_key: newForm.section_key.trim(),
          item_order: newForm.item_order,
          content: parsed,
          is_active: newForm.is_active,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Error creando contenido');

      setShowNewForm(false);
      setNewForm({ section_key: '', item_order: 0, content: '{}', is_active: true });
      await loadContent();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creando contenido');
    } finally {
      setSaving(false);
    }
  };

  const sectionLabel = (key: string) => SECTION_LABELS[key] ?? key;

  return (
    <div className="space-y-12 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <FileText size={20} />
            </div>
            <h1 className="font-display text-4xl font-light tracking-tight text-foreground">Contenido CMS</h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">Gestión de secciones y contenido del sitio</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="px-6 py-3 rounded-full bg-secondary border border-border text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground hover:bg-secondary/80 transition-all"
            onClick={loadContent}
          >
            Sincronizar
          </button>
          <button
            type="button"
            className="px-6 py-3 rounded-full bg-accent text-accent-foreground text-[0.65rem] uppercase tracking-[0.2em] font-bold hover:scale-105 transition-all shadow-glow"
            onClick={() => setShowNewForm(!showNewForm)}
          >
            <Plus className="inline-block mr-2 h-4 w-4" /> Nuevo Item
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          {error}
        </div>
      )}

      {showNewForm && (
        <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl space-y-6">
          <h2 className="font-display text-2xl text-foreground">Nuevo Item de Contenido</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">Section Key</label>
              <input
                className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-accent transition-all"
                placeholder="Ej: servicios, talleres, hero..."
                value={newForm.section_key}
                onChange={(e) => setNewForm((p) => ({ ...p, section_key: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">Orden</label>
              <input
                className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-accent transition-all"
                type="number"
                value={newForm.item_order}
                onChange={(e) => setNewForm((p) => ({ ...p, item_order: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">Contenido (JSON)</label>
            <textarea
              className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-accent transition-all min-h-[200px] resize-y font-mono"
              placeholder='{"title": "Mi Título", "desc": "Descripción"}'
              value={newForm.content}
              onChange={(e) => setNewForm((p) => ({ ...p, content: e.target.value }))}
            />
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              className="flex-1 py-4 bg-accent text-accent-foreground text-[0.7rem] uppercase tracking-[0.3em] font-bold rounded-xl hover:shadow-glow transition-all disabled:opacity-50"
              onClick={() => void createItem()}
              disabled={saving || !newForm.section_key.trim()}
            >
              {saving ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Crear Item'}
            </button>
            <button
              type="button"
              className="p-4 bg-secondary border border-border text-muted-foreground rounded-xl hover:text-foreground transition-colors"
              onClick={() => setShowNewForm(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-transparent blur-2xl opacity-20 pointer-events-none" />
        <div className="relative bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-display text-xl text-foreground">Secciones del Sitio</h3>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar contenido..."
                className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-full text-xs text-foreground focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>

          <div className="divide-y divide-border/50">
            {loading ? (
              <div className="px-8 py-20 text-center text-muted-foreground italic">
                <Loader2 className="animate-spin mx-auto mb-4" size={24} />
                Cargando contenido...
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-8 py-20 text-center text-muted-foreground italic">
                No se encontró contenido.
              </div>
            ) : (
              filtered.map(([sectionKey, sectionItems]) => {
                const isExpanded = expandedSections[sectionKey] ?? false;
                return (
                  <div key={sectionKey}>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-8 py-5 hover:bg-secondary/30 transition-colors"
                      onClick={() => toggleSection(sectionKey)}
                    >
                      <div className="flex items-center gap-4">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium text-foreground">{sectionLabel(sectionKey)}</span>
                        <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                          {sectionKey}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[0.65rem] text-muted-foreground">
                          {sectionItems.length} item{sectionItems.length !== 1 ? 's' : ''}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full ${sectionItems.every((i) => i.is_active) ? 'bg-accent' : 'bg-destructive/50'}`} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="bg-secondary/20 px-8 pb-6 space-y-4">
                        {sectionItems.map((item) => (
                          <div key={item.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                                  Orden: {item.item_order}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => void toggleActive(item)}
                                  className="flex items-center gap-1.5"
                                  title={item.is_active ? 'Ocultar' : 'Mostrar'}
                                >
                                  {item.is_active ? (
                                    <Eye className="h-3.5 w-3.5 text-accent" />
                                  ) : (
                                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <span className={`text-[0.6rem] uppercase tracking-widest font-semibold ${item.is_active ? 'text-accent' : 'text-muted-foreground'}`}>
                                    {item.is_active ? 'Activo' : 'Inactivo'}
                                  </span>
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="p-2 text-muted-foreground hover:text-accent transition-colors"
                                  onClick={() => startEdit(item)}
                                  title="Editar"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                                  onClick={() => void deleteItem(item.id)}
                                  title="Eliminar"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {editingId === item.id ? (
                              <div className="space-y-3">
                                <textarea
                                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-xs text-foreground focus:outline-none focus:border-accent transition-all min-h-[160px] resize-y font-mono"
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                />
                                <div className="flex gap-3">
                                  <button
                                    type="button"
                                    className="px-5 py-2.5 bg-accent text-accent-foreground text-[0.65rem] uppercase tracking-[0.2em] font-bold rounded-lg hover:shadow-glow transition-all disabled:opacity-50"
                                    onClick={() => void saveEdit(item.id)}
                                    disabled={saving}
                                  >
                                    {saving ? <Loader2 className="animate-spin" size={14} /> : <Save className="inline-block mr-1.5" size={14} />}
                                    Guardar
                                  </button>
                                  <button
                                    type="button"
                                    className="px-5 py-2.5 bg-secondary border border-border text-muted-foreground text-[0.65rem] uppercase tracking-[0.2em] rounded-lg hover:text-foreground transition-colors"
                                    onClick={() => setEditingId(null)}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <pre className="text-xs text-muted-foreground bg-secondary rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-words">
                                {JSON.stringify(item.content, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
