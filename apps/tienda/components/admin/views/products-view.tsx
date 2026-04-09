'use client';

import { FileText, Package, Plus, Search } from 'lucide-react';
import { createClient as createSupabaseClient } from '@/utils/supabase/client';
import { useEffect, useMemo, useState } from 'react';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(
    amount,
  );
}

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
    const res = await fetch('/api/admin/products', { cache: 'no-store' });
    const json = (await res.json()) as { data?: ProductRow[]; error?: string };
    if (!res.ok) {
      setError(json.error || 'Error cargando productos');
      setLoading(false);
      return;
    }
    setRows(json.data ?? []);
    setLoading(false);
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
  };

  const submitForm = async () => {
    setSaving(true);
    setError(null);
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
    if (!res.ok) {
      setError(json.error || 'Error guardando producto');
      setSaving(false);
      return;
    }
    await loadProducts();
    resetForm();
    setSaving(false);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    const supabase = createSupabaseClient();
    const path = `productos/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const { error: uploadError } = await supabase.storage.from('productos').upload(path, file, {
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('productos').getPublicUrl(path);
    setForm((prev) => ({ ...prev, fotos: [...prev.fotos, data.publicUrl] }));
    setUploading(false);
  };

  const importCsv = async (file: File) => {
    setImporting(true);
    setError(null);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/products/import', {
      method: 'POST',
      body: fd,
    });
    const json = (await res.json()) as { error?: string; imported?: number };
    if (!res.ok) {
      setError(json.error || 'Error importando CSV');
      setImporting(false);
      return;
    }
    await loadProducts();
    setImporting(false);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600">Gestión real conectada a Supabase</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary inline-flex items-center" disabled>
            <FileText className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <label className="btn-secondary inline-flex items-center cursor-pointer">
            <Package className="h-4 w-4 mr-2" />
            {importing ? 'Importando...' : 'Importar CSV'}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importCsv(file);
              }}
            />
          </label>
          <button type="button" className="btn-primary inline-flex items-center" onClick={resetForm}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar producto
          </button>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {selectedId ? 'Editar producto' : 'Nuevo producto'}
        </h2>
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}
        <div className="grid md:grid-cols-2 gap-3">
          <input
            className="input-field"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
          />
          <input
            className="input-field"
            placeholder="Formato (ej: 500g)"
            value={form.formato}
            onChange={(e) => setForm((prev) => ({ ...prev, formato: e.target.value }))}
          />
          <input
            className="input-field"
            type="number"
            placeholder="Precio"
            value={form.precio}
            onChange={(e) => setForm((prev) => ({ ...prev, precio: Number(e.target.value) }))}
          />
          <input
            className="input-field"
            type="number"
            placeholder="Stock"
            value={form.stock}
            onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
          />
          <textarea
            className="input-field md:col-span-2 min-h-24"
            placeholder="Descripción regenerativa"
            value={form.descripcion_regenerativa}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, descripcion_regenerativa: e.target.value }))
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="visible"
            type="checkbox"
            checked={form.visible}
            onChange={(e) => setForm((prev) => ({ ...prev, visible: e.target.checked }))}
          />
          <label htmlFor="visible" className="text-sm text-gray-700">
            Visible en catálogo
          </label>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Fotos</p>
          <div className="flex flex-wrap gap-2">
            {form.fotos.map((url) => (
              <div key={url} className="px-2 py-1 rounded bg-gray-100 text-xs flex items-center gap-2">
                <a href={url} target="_blank" rel="noreferrer" className="underline">
                  foto
                </a>
                <button
                  type="button"
                  className="text-red-600"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, fotos: prev.fotos.filter((x) => x !== url) }))
                  }
                >
                  quitar
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              className="input-field flex-1 min-w-[220px]"
              placeholder="https://.../imagen.jpg"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (!photoUrl.trim()) return;
                setForm((prev) => ({ ...prev, fotos: [...prev.fotos, photoUrl.trim()] }));
                setPhotoUrl('');
              }}
            >
              Agregar URL
            </button>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadFile(file);
              }}
            />
          </div>
          {uploading ? <p className="text-xs text-gray-500">Subiendo imagen...</p> : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={() => void submitForm()}
            disabled={saving || !form.nombre.trim()}
          >
            {saving ? 'Guardando...' : selectedId ? 'Guardar cambios' : 'Crear producto'}
          </button>
          {selectedId ? (
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancelar edición
            </button>
          ) : null}
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar productos…"
              className="input-field pl-9 w-full"
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="table-header">Producto</th>
                <th className="table-header">Slug</th>
                <th className="table-header">Precio</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td className="table-cell text-gray-500" colSpan={6}>
                    Cargando productos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="table-cell text-gray-500" colSpan={6}>
                    Sin resultados
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                <tr key={p.id}>
                  <td className="table-cell font-medium">{p.nombre}</td>
                  <td className="table-cell text-gray-500">{p.slug || '-'}</td>
                  <td className="table-cell">{formatCurrency(p.precio)}</td>
                  <td className="table-cell">
                    <span
                      className={`status-badge ${p.visible ? 'status-active' : 'status-draft'}`}
                    >
                      {p.visible ? 'Activo' : 'Oculto'}
                    </span>
                  </td>
                  <td className="table-cell">
                    {(p.stock ?? 0) === 0 ? (
                      <span className="text-red-600 font-medium">0 en existencias</span>
                    ) : (
                      <span className="text-green-700">{p.stock ?? 0} en existencias</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <button type="button" className="btn-secondary" onClick={() => selectForEdit(p)}>
                      Editar
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
