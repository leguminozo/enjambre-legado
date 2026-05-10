'use client';

import Link from 'next/link';
import { FileText, Package, Plus, Search, Edit3, Trash2, Eye, EyeOff, Loader2, ChevronRight } from 'lucide-react';
import { createClient as createSupabaseClient } from '@/utils/supabase/client';
import { formatCLP } from '@/lib/shop/format';
import { useEffect, useMemo, useState } from 'react';

type ProductRow = {
  id: string;
  slug: string | null;
  nombre: string;
  descripcion_regenerativa: string | null;
  precio: number;
  stock: number | null;
  formato: string | null;
  fotos: string[] | null;
  visible: boolean;
};

export function ProductsView() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    descripcion_regenerativa: '',
    precio: 0,
    stock: 0,
    formato: '',
    visible: true,
    fotos: [] as string[],
  });

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/products', { cache: 'no-store' });
      const json = (await res.json()) as { data?: ProductRow[]; error?: string };
      if (!res.ok) throw new Error(json.error || 'Error cargando productos');
      setRows(json.data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const resetForm = () => {
    setSelectedId(null);
    setForm({
      nombre: '',
      descripcion_regenerativa: '',
      precio: 0,
      stock: 0,
      formato: '',
      visible: true,
      fotos: [],
    });
    setPhotoUrl('');
  };

  const selectForEdit = (row: ProductRow) => {
    setSelectedId(row.id);
    setForm({
      nombre: row.nombre ?? '',
      descripcion_regenerativa: row.descripcion_regenerativa ?? '',
      precio: row.precio ?? 0,
      stock: row.stock ?? 0,
      formato: row.formato ?? '',
      visible: row.visible ?? true,
      fotos: row.fotos ?? [],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitForm = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...(selectedId ? { id: selectedId } : {}),
        nombre: form.nombre,
        descripcion_regenerativa: form.descripcion_regenerativa || null,
        precio: Number(form.precio),
        stock: Number.isFinite(Number(form.stock)) ? Number(form.stock) : null,
        formato: form.formato || null,
        visible: form.visible,
        fotos: form.fotos,
      };
      const res = await fetch('/api/admin/products', {
        method: selectedId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'Error guardando producto');

      await loadProducts();
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error guardando producto');
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (p) =>
        p.nombre.toLowerCase().includes(s) ||
        (p.slug ?? '').toLowerCase().includes(s) ||
        (p.formato ?? '').toLowerCase().includes(s),
    );
  }, [q, rows]);

  return (
    <div className="space-y-12 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Package size={20} />
            </div>
            <h1 className="font-display text-4xl font-light tracking-tight text-foreground">Catálogo Maestro</h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">Gestión operativa de la vitrina biocultural</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="px-6 py-3 rounded-full bg-secondary border border-border text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground hover:bg-secondary/80 transition-all"
            onClick={loadProducts}
          >
            Sincronizar
          </button>
          <button
            type="button"
            className="px-6 py-3 rounded-full bg-accent text-accent-foreground text-[0.65rem] uppercase tracking-[0.2em] font-bold hover:scale-105 transition-all shadow-glow"
            onClick={resetForm}
          >
            <Plus className="inline-block mr-2 h-4 w-4" /> Nuevo Producto
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-transparent blur-2xl opacity-20 pointer-events-none" />
        <div className="relative bg-card border border-border rounded-3xl p-8 lg:p-12 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-display text-2xl text-foreground">
              {selectedId ? 'Refinar Producto' : 'Crear Legado'}
            </h2>
            {selectedId && (
              <span className="text-[0.6rem] uppercase tracking-widest text-accent px-3 py-1 bg-accent/10 rounded-full border border-accent/20">Modo Edición</span>
            )}
          </div>

          {error && (
            <div className="mb-8 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">Nombre del Producto</label>
                  <input
                    className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-accent transition-all"
                    placeholder="Ej: Miel de Ulmo Virgen"
                    value={form.nombre}
                    onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">Formato / Presentación</label>
                  <input
                    className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-accent transition-all"
                    placeholder="Ej: 500g / Sachets"
                    value={form.formato}
                    onChange={(e) => setForm((prev) => ({ ...prev, formato: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">Relato Regenerativo (Descripción)</label>
                <textarea
                  className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-accent transition-all min-h-[160px] resize-none"
                  placeholder="Describe el origen y las notas de este producto..."
                  value={form.descripcion_regenerativa}
                  onChange={(e) => setForm((prev) => ({ ...prev, descripcion_regenerativa: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">Precio (CLP)</label>
                  <input
                    className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-accent transition-all"
                    type="number"
                    value={form.precio}
                    onChange={(e) => setForm((prev) => ({ ...prev, precio: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">Stock Actual</label>
                  <input
                    className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-accent transition-all"
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-secondary border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[0.65rem] uppercase tracking-[0.1em] text-foreground">Visibilidad en tienda</span>
                  <button
                    type="button"
                    onClick={() => setForm(p => ({...p, visible: !p.visible}))}
                    className={`w-10 h-5 rounded-full transition-all relative ${form.visible ? 'bg-accent' : 'bg-secondary'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-foreground rounded-full transition-all ${form.visible ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                <p className="text-[0.6rem] text-muted-foreground">Define si este producto aparecerá en el catálogo público para clientes.</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  className="flex-1 py-4 bg-accent text-accent-foreground text-[0.7rem] uppercase tracking-[0.3em] font-bold rounded-xl hover:shadow-glow transition-all disabled:opacity-50"
                  onClick={() => void submitForm()}
                  disabled={saving || !form.nombre.trim()}
                >
                  {saving ? <Loader2 className="animate-spin mx-auto" size={18} /> : selectedId ? 'Guardar Cambios' : 'Lanzar Producto'}
                </button>
                {selectedId && (
                  <button type="button" className="p-4 bg-secondary border border-border text-muted-foreground rounded-xl hover:text-foreground transition-colors" onClick={resetForm}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-display text-xl text-foreground">Inventario Operativo</h3>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o formato..."
              className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-full text-xs text-foreground focus:outline-none focus:border-accent/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground font-medium">Producto</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground font-medium">Precio</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground font-medium">Estado</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground font-medium text-right">Stock</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td className="px-8 py-20 text-center text-muted-foreground italic" colSpan={5}>
                    Sincronizando catálogo...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-8 py-20 text-center text-muted-foreground italic" colSpan={5}>
                    No se encontraron productos en esta zona del bosque.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{p.nombre}</span>
                        <span className="text-[0.65rem] text-muted-foreground">{p.formato || 'Sin formato'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm text-accent font-medium">{formatCLP(p.precio)}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${p.visible ? 'bg-accent' : 'bg-destructive/50'}`} />
                        <span className={`text-[0.65rem] uppercase tracking-widest font-semibold ${p.visible ? 'text-accent' : 'text-muted-foreground'}`}>
                          {p.visible ? 'Activo' : 'Oculto'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className={`text-sm font-medium ${(p.stock ?? 0) <= 5 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {p.stock ?? 0} <span className="text-[0.65rem] opacity-50 ml-1 uppercase">unid</span>
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg text-xs text-muted-foreground hover:text-accent hover:border-accent/30 transition-all"
                        onClick={() => selectForEdit(p)}
                      >
                        <Edit3 size={14} /> Gestionar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
