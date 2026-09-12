'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, Plus, Edit, Trash2, Eye, EyeOff, ExternalLink, Package, Printer } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, toast, ViewLoading, formatMoney, DataTable, type ColumnDef } from '@enjambre/ui';
import { friendlySupabaseError } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import type { Product } from '@/lib/product-types';
import { getUrlTienda } from '@/lib/publicUrls';
import { FichaCataAtrilModal } from './FichaCataAtrilModal';

interface ProductListProps {
  onEdit?: (product: Product) => void;
  onCreateNew?: () => void;
}

/**
 * Lista de fichas de tienda. El stock se gestiona en Producción → Inventario.
 */
export function ProductList({ onEdit, onCreateNew }: ProductListProps) {
  const apiFetch = useApiFetch();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState<'all' | 'visible' | 'hidden'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cardProduct, setCardProduct] = useState<Product | null>(null);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mappedProducts = (data || []).map((p: Record<string, unknown>) => {
        const product: Product = {
          id: String(p.id),
          nombre: String(p.nombre ?? ''),
          descripcion_regenerativa: String(p.descripcion_regenerativa ?? ''),
          precio: Number(p.precio) || 0,
          stock: Number(p.stock) || 0,
          formato: String(p.formato ?? ''),
          visible: Boolean(p.visible ?? true),
          trazabilidad_qr: Boolean(p.trazabilidad_qr ?? true),
          slug: String(p.slug ?? ''),
          video_url: String(p.video_url ?? ''),
          fotos: Array.isArray(p.fotos) ? p.fotos : [],
          categoria: String(p.categoria ?? ''),
          tags: Array.isArray(p.tags) ? p.tags : [],
          descripcion_corta: String(p.descripcion_corta ?? ''),
          peso_neto_g: Number(p.peso_neto_g) || null,
          ingredientes: String(p.ingredientes ?? ''),
          origen_apicola: String(p.origen_apicola ?? ''),
          lote_id: p.lote_id ? String(p.lote_id) : null,
          co2_evitado_kg: p.co2_evitado_kg ? Number(p.co2_evitado_kg) : null,
          irr_referencia: p.irr_referencia ? Number(p.irr_referencia) : null,
          sustituye_azucar_g: p.sustituye_azucar_g ? Number(p.sustituye_azucar_g) : null,
          perfil_sensorial: (p.perfil_sensorial as Product['perfil_sensorial']) ?? null,
          created_at: p.created_at ? String(p.created_at) : null,
          updated_at: p.updated_at ? String(p.updated_at) : null,
        };
        return product;
      });
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast(friendlySupabaseError(error as { code?: string; message?: string } | null), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const toggleVisibility = async (id: string, currentVisible: boolean) => {
    try {
      const { error } = await supabase
        .from('productos')
        .update({ visible: !currentVisible })
        .eq('id', id);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, visible: !currentVisible } : p)),
      );
      toast(currentVisible ? 'Producto ocultado' : 'Producto publicado', { type: 'success' });
      // La visibilidad cambió en la tienda: invalidar ISR (fail-open).
      void apiFetch('/api/admin-system/purge-cache', { method: 'POST' }).catch(() => undefined);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast(friendlySupabaseError(error as { code?: string; message?: string } | null), { type: 'error' });
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeletingId(id);
    try {
      const { error } = await supabase.from('productos').delete().eq('id', id);

      if (error) throw error;

      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast('Producto eliminado', { type: 'success' });
      // El producto desaparece de la tienda: invalidar ISR (fail-open).
      void apiFetch('/api/admin-system/purge-cache', { method: 'POST' }).catch(() => undefined);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast(friendlySupabaseError(error as { code?: string; message?: string } | null), { type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      (product.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.descripcion_regenerativa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.formato?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterVisible === 'all'
        ? true
        : filterVisible === 'visible'
          ? product.visible
          : !product.visible;

    return matchesSearch && matchesFilter;
  });

  const visibleCount = products.filter((p) => p.visible).length;
  const tiendaUrl = getUrlTienda();

  // Columnas adaptativas: las secundarias se ocultan solas en espacio angosto
  const columns = useMemo<ColumnDef<Product>[]>(() => [
    {
      key: 'img',
      header: 'Img',
      width: 60,
      render: (product) =>
        product.fotos?.[0] ? (
          <img
            src={product.fotos[0]}
            alt={product.nombre || 'Producto'}
            style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              background: 'hsl(var(--foreground) / 0.05)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Package size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
          </div>
        ),
    },
    {
      key: 'nombre',
      header: 'Producto',
      sortable: true,
      render: (product) => (
        <div>
          <div style={{ fontWeight: 500, color: 'hsl(var(--foreground))' }}>{product.nombre}</div>
          {product.slug && (
            <div
              style={{
                fontSize: '0.75rem',
                color: 'hsl(var(--muted-foreground))',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 2,
              }}
            >
              <ExternalLink size={10} />
              <a
                href={`${tiendaUrl}/producto/${product.slug}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'inherit', textDecoration: 'none' }}
                className="hover:underline"
              >
                /producto/{product.slug}
              </a>
            </div>
          )}
        </div>
      ),
      csvValue: (p) => p.nombre ?? '',
    },
    {
      key: 'visible',
      header: 'Estado',
      sortable: true,
      render: (product) => (
        <span
          className={`badge ${product.visible ? 'badge-success' : 'badge-warning'}`}
          style={{ fontSize: '0.7rem' }}
        >
          {product.visible ? 'Visible' : 'Oculto'}
        </span>
      ),
      csvValue: (p) => (p.visible ? 'visible' : 'oculto'),
    },
    {
      key: 'precio',
      header: 'Precio',
      sortable: true,
      align: 'right',
      render: (product) => (
        <span style={{ fontWeight: 600 }} className="tabular-nums">
          {formatMoney(product.precio || 0)}
        </span>
      ),
      csvValue: (p) => String(p.precio),
    },
    {
      key: 'formato',
      header: 'Formato',
      sortable: true,
      hideBelow: 560,
      render: (product) => <span style={{ fontSize: '0.85rem' }}>{product.formato}</span>,
      csvValue: (p) => p.formato ?? '',
    },
    {
      key: 'created_at',
      header: 'Creado',
      sortable: true,
      hideBelow: 420,
      render: (product) => (
        <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
          {product.created_at ? new Date(product.created_at).toLocaleDateString('es-CL') : '—'}
        </span>
      ),
      csvValue: (p) => p.created_at ?? '',
    },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      width: 165,
      render: (product) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
          <button
            onClick={() => setCardProduct(product)}
            className="btn btn-ghost btn-sm"
            title="Ficha de atril / mostrador (imprimir)"
            disabled={deletingId === product.id}
          >
            <Printer size={16} />
          </button>
          <button
            onClick={() => toggleVisibility(product.id, Boolean(product.visible))}
            className="btn btn-ghost btn-sm"
            title={product.visible ? 'Ocultar' : 'Publicar'}
            disabled={deletingId === product.id}
          >
            {product.visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            onClick={() => onEdit?.(product)}
            className="btn btn-ghost btn-sm"
            title="Editar ficha"
            disabled={deletingId === product.id}
          >
            <Edit size={16} />
          </button>
          <a
            href={product.slug ? `${tiendaUrl}/producto/${product.slug}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            title="Ver en tienda"
            style={{
              pointerEvents: product.slug ? 'auto' : 'none',
              opacity: product.slug ? 1 : 0.5,
            }}
          >
            <ExternalLink size={16} />
          </a>
          <button
            onClick={() => deleteProduct(product.id)}
            className="btn btn-ghost btn-sm"
            title="Eliminar"
            disabled={deletingId === product.id}
            style={{
              color: 'var(--text-error)',
              opacity: deletingId === product.id ? 0.5 : 1,
            }}
          >
            {deletingId === product.id ? (
              <span style={{ fontSize: '0.7rem' }}>...</span>
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      ),
    },
  ], [deletingId, onEdit, tiendaUrl, toggleVisibility, deleteProduct]);

  if (loading) {
    return <ViewLoading variant="view" label="Productos" hideLabel />;
  }

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-lg)',
            background: 'hsl(var(--foreground) / 0.02)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsl(var(--border) / 0.5)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>
            Fichas de catálogo
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            {products.length}
          </div>
        </div>
        <div
          style={{
            padding: 'var(--space-lg)',
            background: 'hsl(var(--foreground) / 0.02)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsl(var(--border) / 0.5)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>
            Visibles en tienda
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-success)' }}>
            {visibleCount}
          </div>
        </div>
        <div
          style={{
            padding: 'var(--space-lg)',
            background: 'hsl(var(--primary) / 0.06)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsl(var(--primary) / 0.2)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>
            Stock y reposición
          </div>
          <Link
            href="/produccion/inventario"
            className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1 mt-1"
          >
            Ir a Inventario →
          </Link>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-md)',
          gap: 'var(--space-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search
              style={{
                position: 'absolute',
                left: 'var(--space-md)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--muted-foreground))',
              }}
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>
          <select
            value={filterVisible}
            onChange={(e) => setFilterVisible(e.target.value as typeof filterVisible)}
            className="input-field w-full"
            style={{ width: 'auto' }}
          >
            <option value="all">Todos</option>
            <option value="visible">Visibles</option>
            <option value="hidden">Ocultos</option>
          </select>
        </div>
        <Button onClick={onCreateNew}>
          <Plus size={18} style={{ marginRight: 8 }} />
          Nuevo Producto
        </Button>
      </div>

      <DataTable<Product>
        columns={columns}
        rows={filteredProducts}
        getId={(p) => p.id}
        sortable
        exportable
        columnsControl
        storageKey="catalogo-productos"
        fullscreen
        fullscreenLabel="Catálogo de productos"
        exportFilename="catalogo-productos"
        emptyState={
          <div style={{ textAlign: 'center' }}>
            <Package size={48} style={{ margin: '0 auto var(--space-md)', opacity: 0.3 }} />
            <div>No hay productos que coincidan con tu búsqueda</div>
          </div>
        }
      />

      {filteredProducts.length > 0 && (
        <div
          style={{
            marginTop: 'var(--space-md)',
            fontSize: '0.75rem',
            color: 'hsl(var(--muted-foreground))',
            textAlign: 'right',
          }}
        >
          Mostrando {filteredProducts.length} de {products.length} productos
        </div>
      )}

      {cardProduct && (
        <FichaCataAtrilModal
          open={Boolean(cardProduct)}
          onClose={() => setCardProduct(null)}
          product={cardProduct}
        />
      )}
    </div>
  );
}
