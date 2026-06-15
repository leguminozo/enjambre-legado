'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, EyeOff, MoreVertical, ExternalLink, Package, PlusSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, toast } from '@enjambre/ui';
import { friendlySupabaseError } from '@enjambre/ui';
import type { Product } from '@/lib/product-types';

interface ProductListProps {
  onEdit?: (product: Product) => void;
  onCreateNew?: () => void;
}

export function ProductList({ onEdit, onCreateNew }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState<'all' | 'visible' | 'hidden'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refillProduct, setRefillProduct] = useState<Product | null>(null);
  const [refillAmount, setRefillAmount] = useState<number>(0);
  const [isRefilling, setIsRefilling] = useState(false);

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
          peso_neto_g: Number(p.peso_neto_g) || undefined,
          ingredientes: String(p.ingredientes ?? ''),
          origen_apicola: String(p.origen_apicola ?? ''),
          lote_id: p.lote_id ? String(p.lote_id) : undefined,
          created_at: String(p.created_at ?? ''),
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
    loadProducts();
  }, []);

  const toggleVisibility = async (id: string, currentVisible: boolean) => {
    try {
      const { error } = await supabase
        .from('productos')
        .update({ visible: !currentVisible })
        .eq('id', id);

      if (error) throw error;
      
      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, visible: !currentVisible } : p
      ));
      toast(currentVisible ? 'Producto ocultado' : 'Producto publicado', { type: 'success' });
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
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setProducts(prev => prev.filter(p => p.id !== id));
      toast('Producto eliminado', { type: 'success' });
    } catch (error) {
console.error('Error deleting product:', error);
		toast(friendlySupabaseError(error as { code?: string; message?: string } | null), { type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefillSubmit = async () => {
    if (!refillProduct || refillAmount <= 0) return;
    setIsRefilling(true);
    try {
      const res = await fetch('/api/produccion/add-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          producto_id: refillProduct.id,
          cantidad: refillAmount
        })
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error agregando stock');
      
      toast(`Stock actualizado. Hash: ${json.data.traceability_hash.substring(0, 8)}...`, { type: 'success' });
      
      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === refillProduct.id ? { ...p, stock: (p.stock || 0) + refillAmount, lote_id: json.data.lote_id } : p
      ));
      
      setRefillProduct(null);
      setRefillAmount(0);
    } catch (error: any) {
      console.error('Error refilling stock:', error);
      toast(error.message, { type: 'error' });
    } finally {
      setIsRefilling(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.descripcion_regenerativa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.formato?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterVisible === 'all' 
      ? true 
      : filterVisible === 'visible' 
        ? product.visible 
        : !product.visible;

    return matchesSearch && matchesFilter;
  });

  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const visibleCount = products.filter(p => p.visible).length;
  const totalValue = products.reduce((sum, p) => sum + (p.precio || 0) * (p.stock || 0), 0);
  const tiendaUrl = process.env.NEXT_PUBLIC_URL_TIENDA || 'http://localhost:3001';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-2xl)' }}>
        <div style={{ color: 'hsl(var(--muted-foreground))' }}>Cargando productos...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <div style={{ padding: 'var(--space-lg)', background: 'hsl(var(--foreground) / 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border) / 0.5)' }}>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Total Productos</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>{products.length}</div>
        </div>
        <div style={{ padding: 'var(--space-lg)', background: 'hsl(var(--foreground) / 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border) / 0.5)' }}>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Visibles</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-success)' }}>{visibleCount}</div>
        </div>
        <div style={{ padding: 'var(--space-lg)', background: 'hsl(var(--foreground) / 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border) / 0.5)' }}>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Stock Total</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--accent))' }}>{totalStock}</div>
        </div>
        <div style={{ padding: 'var(--space-lg)', background: 'hsl(var(--foreground) / 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border) / 0.5)' }}>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Valor Inventario</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>${totalValue.toLocaleString()}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search style={{ position: 'absolute', left: 'var(--space-md)', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} size={18} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>
          <select
            value={filterVisible}
            onChange={(e) => setFilterVisible(e.target.value as typeof filterVisible)}
            className="input-field"
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

      {/* Table */}
      <div style={{ background: 'hsl(var(--card))', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border))', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Img</th>
              <th>Producto</th>
              <th>Estado</th>
              <th>Stock</th>
              <th>Precio</th>
              <th>Formato</th>
              <th>Creado</th>
              <th style={{ width: 120, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'hsl(var(--muted-foreground))' }}>
                  <Package size={48} style={{ margin: '0 auto var(--space-md)', opacity: 0.3 }} />
                  <div>No hay productos que coincidan con tu búsqueda</div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.fotos?.[0] ? (
                      <img
                        src={product.fotos[0]}
                        alt={product.nombre}
                        style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: 48, height: 48, background: 'hsl(var(--foreground) / 0.05)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'hsl(var(--foreground))' }}>{product.nombre}</div>
                    {product.slug && (
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <ExternalLink size={10} />
                        <a href={`${tiendaUrl}/producto/${product.slug}`} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }} className="hover:underline">
                          /producto/{product.slug}
                        </a>
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${product.visible ? 'badge-success' : 'badge-warning'}`}
                      style={{ fontSize: '0.7rem' }}
                    >
                      {product.visible ? 'Visible' : 'Oculto'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500 }}>{product.stock}</span>
                    {product.stock === 0 && (
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-error)' }}>Agotado</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>${product.precio.toLocaleString()}</td>
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>{product.formato}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>
                    {new Date(product.created_at).toLocaleDateString('es-CL')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                      <button
                        onClick={() => toggleVisibility(product.id, product.visible)}
                        className="btn btn-ghost btn-sm"
                        title={product.visible ? 'Ocultar' : 'Publicar'}
                        disabled={deletingId === product.id}
                      >
                        {product.visible ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => { setRefillProduct(product); setRefillAmount(10); }}
                        className="btn btn-ghost btn-sm"
                        title="Relleno Rápido de Stock"
                        disabled={deletingId === product.id}
                        style={{ color: 'var(--text-success)' }}
                      >
                        <PlusSquare size={16} />
                      </button>
                      <button
                        onClick={() => onEdit?.(product)}
                        className="btn btn-ghost btn-sm"
                        title="Editar"
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
                        style={{ pointerEvents: product.slug ? 'auto' : 'none', opacity: product.slug ? 1 : 0.5 }}
                      >
                        <ExternalLink size={16} />
                      </a>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="btn btn-ghost btn-sm"
                        title="Eliminar"
                        disabled={deletingId === product.id}
                        style={{ color: 'var(--text-error)', opacity: deletingId === product.id ? 0.5 : 1 }}
                      >
                        {deletingId === product.id ? (
                          <span style={{ fontSize: '0.7rem' }}>...</span>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      {filteredProducts.length > 0 && (
        <div style={{ marginTop: 'var(--space-md)', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', textAlign: 'right' }}>
          Mostrando {filteredProducts.length} de {products.length} productos
        </div>
      )}

      {/* Refill Modal */}
      {refillProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--card)', padding: 'var(--space-xl)', borderRadius: 'var(--radius-md)', width: '100%', maxWidth: 400, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
              Relleno Rápido: {refillProduct.nombre}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
              Ingresa la cantidad de unidades nuevas. Esto generará un nuevo Lote y Hash de Trazabilidad digital automáticamente.
            </p>
            
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 'var(--space-xs)' }}>Cantidad a sumar</label>
              <input 
                type="number" 
                className="input-field w-full" 
                value={refillAmount} 
                onChange={(e) => setRefillAmount(parseInt(e.target.value) || 0)}
                min="1"
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setRefillProduct(null)} disabled={isRefilling}>
                Cancelar
              </Button>
              <Button onClick={handleRefillSubmit} disabled={isRefilling || refillAmount <= 0}>
                {isRefilling ? 'Generando...' : 'Confirmar Trazabilidad'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}