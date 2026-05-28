'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, EyeOff, MoreVertical, ExternalLink, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@enjambre/ui';
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

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      alert(friendlySupabaseError(error));
    } finally {
      setLoading(false);
    }
  };

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
      alert(currentVisible ? 'Producto ocultado' : 'Producto publicado');
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert(friendlySupabaseError(error));
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
      alert('Producto eliminado');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(friendlySupabaseError(error));
    } finally {
      setDeletingId(null);
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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-2xl)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Cargando productos...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <div style={{ padding: 'var(--space-lg)', background: 'rgba(10,61,47,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(10,61,47,0.06)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Total Productos</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--bosque-ulmo)' }}>{products.length}</div>
        </div>
        <div style={{ padding: 'var(--space-lg)', background: 'rgba(10,61,47,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(10,61,47,0.06)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Visibles</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-success)' }}>{visibleCount}</div>
        </div>
        <div style={{ padding: 'var(--space-lg)', background: 'rgba(10,61,47,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(10,61,47,0.06)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Stock Total</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--oro-miel-dark)' }}>{totalStock}</div>
        </div>
        <div style={{ padding: 'var(--space-lg)', background: 'rgba(10,61,47,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(10,61,47,0.06)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Valor Inventario</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--bosque-ulmo)' }}>${totalValue.toLocaleString()}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search style={{ position: 'absolute', left: 'var(--space-md)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
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
      <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid rgba(10,61,47,0.08)', overflow: 'hidden' }}>
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
                <td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
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
                      <div style={{ width: 48, height: 48, background: 'rgba(10,61,47,0.05)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={20} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--bosque-ulmo)' }}>{product.nombre}</div>
                    {product.slug && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <ExternalLink size={10} />
                        /producto/{product.slug}
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
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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
                        onClick={() => onEdit?.(product)}
                        className="btn btn-ghost btn-sm"
                        title="Editar"
                        disabled={deletingId === product.id}
                      >
                        <Edit size={16} />
                      </button>
                      <a
                        href={product.slug ? `/producto/${product.slug}` : '#'}
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
        <div style={{ marginTop: 'var(--space-md)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          Mostrando {filteredProducts.length} de {products.length} productos
        </div>
      )}
    </div>
  );
}