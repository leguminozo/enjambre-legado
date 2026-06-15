'use client';

import { useState } from 'react';
import { Package, Plus, Tag } from 'lucide-react';
import { ProductList } from '@/components/productos/ProductList';
import { ProductForm } from '@/components/productos/ProductForm';
import type { Product } from '@/lib/product-types';

export default function CatalogoPage() {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleCreateNew = () => {
    setSelectedProduct(null);
    setView('create');
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setView('edit');
  };

  const handleSuccess = () => {
    setView('list');
    setSelectedProduct(null);
  };

  const handleCancel = () => {
    setView('list');
    setSelectedProduct(null);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--bosque-ulmo)', marginBottom: 'var(--space-xs)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <Package size={28} />
              Catálogo de Productos
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Administrá el catálogo de tu tienda. Creá, editá y organizá tus productos con trazabilidad regenerativa.
            </p>
          </div>
          {view === 'list' && (
            <button onClick={handleCreateNew} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={18} />
              Nuevo Producto
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {view === 'list' && (
        <ProductList onEdit={handleEdit} onCreateNew={handleCreateNew} />
      )}

      {(view === 'create' || view === 'edit') && (
        <div className="bg-card border border-border/50" style={{ padding: 'var(--space-xl)', borderRadius: 'var(--radius-md)' }}>
          <ProductForm
            initialData={selectedProduct ? {
              ...selectedProduct,
              visible: selectedProduct.visible ?? true,
              trazabilidad_qr: selectedProduct.trazabilidad_qr ?? true,
              categoria: selectedProduct.categoria ?? '',
              tags: selectedProduct.tags ?? [],
              descripcion_corta: selectedProduct.descripcion_corta ?? '',
              peso_neto_g: selectedProduct.peso_neto_g ?? undefined,
              ingredientes: selectedProduct.ingredientes ?? '',
              origen_apicola: selectedProduct.origen_apicola ?? '',
              lote_id: selectedProduct.lote_id ?? undefined,
            } : undefined}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      )}
    </div>
  );
}
