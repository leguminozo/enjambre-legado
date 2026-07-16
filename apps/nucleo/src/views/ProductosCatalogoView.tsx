'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';
import { ImmersiveModal } from '@enjambre/ui';
import { ProductList } from '@/components/productos/ProductList';
import { ProductForm } from '@/components/productos/ProductForm';
import type { Product } from '@/lib/product-types';
import { ViewShell } from '@/components/layout/ViewShell';

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
    <div className="space-y-6">
      <ViewShell
        eyebrow="El Enjambre"
        title="Gestión de Productos"
        subtitle="Administrá el catálogo con trazabilidad regenerativa"
        greeting="Alquimista del panal"
        icon={<Package size={20} />}
        variant="compact"
      />

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

                    nombre: selectedProduct.nombre ?? '',
                    descripcion_regenerativa: selectedProduct.descripcion_regenerativa ?? '',
                    precio: selectedProduct.precio ?? 0,
                    stock: selectedProduct.stock ?? 0,
                    formato: selectedProduct.formato ?? '',
                    visible: selectedProduct.visible ?? true,
                    trazabilidad_qr: selectedProduct.trazabilidad_qr ?? true,
                    categoria: selectedProduct.categoria ?? '',
                    tags: selectedProduct.tags ?? [],
                    descripcion_corta: selectedProduct.descripcion_corta ?? '',
                    peso_neto_g: selectedProduct.peso_neto_g ?? undefined,
                    ingredientes: selectedProduct.ingredientes ?? '',
                    origen_apicola: selectedProduct.origen_apicola ?? '',
                    lote_id: selectedProduct.lote_id ?? undefined,
                    slug: selectedProduct.slug ?? undefined,
                    video_url: selectedProduct.video_url ?? undefined,
                    fotos: selectedProduct.fotos ?? undefined,
                    sustituye_azucar_g: selectedProduct.sustituye_azucar_g ?? undefined,
                    co2_evitado_kg: selectedProduct.co2_evitado_kg ?? undefined,
                    irr_referencia: selectedProduct.irr_referencia ?? undefined,
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