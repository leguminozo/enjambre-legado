'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Stamp, Plus, Trash2, Edit2, Check, X, ShieldAlert } from 'lucide-react';
import { toast, ViewLoading, Badge } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface StampProgram {
  id: string;
  producto_id: string;
  nombre: string;
  unidades_requeridas: number;
  unidad_gratis: number;
  activo: boolean;
  canales: string[];
  wallet_label: string | null;
  bonus_resena: boolean;
  productos?: { id: string; nombre: string; precio: number } | null;
}

interface ProductoCatalogItem {
  id: string;
  nombre: string;
  precio: number;
}

export function GuardianStampsAdminPanel() {
  const apiFetch = useApiFetch();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formProductoId, setFormProductoId] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formRequeridas, setFormRequeridas] = useState(10);
  const [formGratis, setFormGratis] = useState(1);
  const [formWalletLabel, setFormWalletLabel] = useState('');
  const [formBonusResena, setFormBonusResena] = useState(true);

  const programsQuery = useQuery<{ data: StampProgram[] }>({
    queryKey: ['enjambre', 'guardian-stamps'],
    queryFn: async () => {
      const res = await apiFetch('/api/enjambre/guardian-stamps');
      if (!res.ok) throw new Error('Error al cargar programas de sellos');
      return res.json();
    },
  });

  const productsQuery = useQuery<{ data: ProductoCatalogItem[] }>({
    queryKey: ['catalogo', 'productos-summary'],
    queryFn: async () => {
      const res = await apiFetch('/api/catalogo/productos?limit=100');
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const programs = programsQuery.data?.data ?? [];
  const products = productsQuery.data?.data ?? [];

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormProductoId(products[0]?.id || '');
    setFormNombre('Tarjeta de Sellos');
    setFormRequeridas(10);
    setFormGratis(1);
    setFormWalletLabel('Miel de Autor');
    setFormBonusResena(true);
  };

  const handleStartEdit = (p: StampProgram) => {
    setEditingId(p.id);
    setIsCreating(false);
    setFormProductoId(p.producto_id);
    setFormNombre(p.nombre);
    setFormRequeridas(p.unidades_requeridas);
    setFormGratis(p.unidad_gratis);
    setFormWalletLabel(p.wallet_label || '');
    setFormBonusResena(p.bonus_resena);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formProductoId) {
      toast('Selecciona un producto para el programa', { type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        producto_id: formProductoId,
        nombre: formNombre.trim() || 'Tarjeta de Sellos',
        unidades_requeridas: Number(formRequeridas),
        unidad_gratis: Number(formGratis),
        wallet_label: formWalletLabel.trim() || null,
        bonus_resena: formBonusResena,
      };

      const endpoint = editingId
        ? `/api/enjambre/guardian-stamps/${editingId}`
        : '/api/enjambre/guardian-stamps';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Error al guardar');
      }

      toast('Programa de sellos guardado', { type: 'success' });
      handleCancel();
      programsQuery.refetch();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al guardar', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (p: StampProgram) => {
    try {
      const res = await apiFetch(`/api/enjambre/guardian-stamps/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !p.activo }),
      });
      if (!res.ok) throw new Error('Error al actualizar estado');
      toast(p.activo ? 'Programa desactivado' : 'Programa activado', { type: 'info' });
      programsQuery.refetch();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al cambiar estado', { type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro de eliminar este programa de sellos?')) return;
    try {
      const res = await apiFetch(`/api/enjambre/guardian-stamps/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      toast('Programa eliminado', { type: 'success' });
      programsQuery.refetch();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al eliminar', { type: 'error' });
    }
  };

  if (programsQuery.isLoading) {
    return <ViewLoading variant="inline" label="Programas de Sellos D2C" />;
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stamp size={16} className="text-accent-text" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-foreground">
            Sellos por Formato / Tarjeta Obrera (D2C)
          </h3>
        </div>
        {!isCreating && !editingId && (
          <button
            type="button"
            onClick={handleStartCreate}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3.5 text-xs text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Plus size={13} />
            <span>Nuevo Programa</span>
          </button>
        )}
      </div>
      <p className="mb-6 text-xs text-muted-foreground leading-relaxed">
        Configura los sellos por formato de producto (ej. 10 sachets → 1 gratis, 6 frascos 150g → 1 gratis). La billetera del comprador y Apple/Google Wallet consumen estos programas para acreditar sellos y bonificaciones de reseña.
      </p>

      {/* Formulario de Creación / Edición */}
      {(isCreating || editingId) && (
        <div className="mb-6 rounded-xl border border-accent/40 bg-surface-raised/80 p-4 space-y-4">
          <h4 className="text-xs font-semibold text-foreground tracking-wide uppercase">
            {editingId ? 'Editar Programa de Sellos' : 'Crear Programa de Sellos'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[0.65rem] text-muted-foreground block mb-1">Producto</label>
              <select
                value={formProductoId}
                onChange={(e) => setFormProductoId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:border-accent"
              >
                <option value="">Selecciona producto…</option>
                {products.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[0.65rem] text-muted-foreground block mb-1">Nombre Comercial</label>
              <input
                type="text"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="Ej. Tarjeta Sachets 15g"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[0.65rem] text-muted-foreground block mb-1">Unidades Requeridas (X)</label>
              <input
                type="number"
                min={1}
                value={formRequeridas}
                onChange={(e) => setFormRequeridas(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-foreground focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[0.65rem] text-muted-foreground block mb-1">Unidades de Regalo (Y)</label>
              <input
                type="number"
                min={1}
                value={formGratis}
                onChange={(e) => setFormGratis(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-foreground focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[0.65rem] text-muted-foreground block mb-1">Etiqueta en Wallet</label>
              <input
                type="text"
                value={formWalletLabel}
                onChange={(e) => setFormWalletLabel(e.target.value)}
                placeholder="Ej. Sachet 15g"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="bonus_resena"
                checked={formBonusResena}
                onChange={(e) => setFormBonusResena(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="bonus_resena" className="text-xs text-foreground">
                Premio +1 sello al aprobar reseña sensorial
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-accent bg-accent/20 px-5 text-xs uppercase font-semibold text-accent-text hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
            >
              <Check size={14} />
              <span>{saving ? 'Guardando…' : 'Guardar Programa'}</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-background px-4 text-xs text-muted-foreground hover:bg-surface-raised transition-colors"
            >
              <X size={14} />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      )}

      {/* Lista de programas */}
      {programs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          No hay programas de sellos registrados. Crea el primero arriba.
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map((p) => (
            <div
              key={p.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-background p-3.5"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{p.nombre}</span>
                  <Badge variant={p.activo ? 'success' : 'outline'}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                  {p.bonus_resena && (
                    <Badge variant="outline" className="text-[10px]">
                      +1 Sello x Reseña
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Compra {p.unidades_requeridas} unidades → {p.unidad_gratis} gratis · Producto:{' '}
                  <span className="text-foreground font-medium">
                    {p.productos?.nombre || p.producto_id}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleActive(p)}
                  className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {p.activo ? 'Pausar' : 'Activar'}
                </button>
                <button
                  type="button"
                  onClick={() => handleStartEdit(p)}
                  aria-label={`Editar programa ${p.nombre}`}
                  className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  aria-label={`Eliminar programa ${p.nombre}`}
                  className="rounded-lg border border-destructive/20 bg-destructive/10 p-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
