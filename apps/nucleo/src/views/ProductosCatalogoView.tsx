'use client';

import { useState } from 'react';
import { ImmersiveModal } from '@enjambre/ui';
import { ProductList } from '@/components/productos/ProductList';
import { ProductForm } from '@/components/productos/ProductForm';
import type { Product } from '@/lib/product-types';

export function ProductosCatalogoView() {
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
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--bosque-ulmo)',
            marginBottom: 'var(--space-xs)',
          }}
        >
          Gestión de Productos
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Administra el catálogo de tu tienda. Creá, editá y organizá tus productos con trazabilidad
          regenerativa.
        </p>
      </div>

      {view === 'list' && <ProductList onEdit={handleEdit} onCreateNew={handleCreateNew} />}

      <ImmersiveModal
        open={view === 'create' || view === 'edit'}
        onClose={handleCancel}
        eyebrow="Productos"
        title={view === 'edit' ? 'Editar producto' : 'Nuevo producto'}
        size="xl"
        bodyClassName="!p-0"
      >
        <div className="p-5 sm:p-6">
          <ProductForm
            initialData={
              selectedProduct
                ? {
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
                  }
                : undefined
            }
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </ImmersiveModal>
    </div>
  );
}