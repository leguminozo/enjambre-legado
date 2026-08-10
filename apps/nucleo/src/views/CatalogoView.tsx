'use client';

import { useState } from 'react';
import { Package, Plus, Tags } from 'lucide-react';
import { ImmersiveModal, Button } from '@enjambre/ui';
import { ProductList } from '@/components/productos/ProductList';
import { ProductForm } from '@/components/productos/ProductForm';
import { TaxonomiasPanel } from '@/components/productos/TaxonomiasPanel';
import type { Product } from '@/lib/product-types';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';

type CatalogoTab = 'productos' | 'taxonomias';

export function CatalogoView() {
  const [tab, setTab] = useState<CatalogoTab>('productos');
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
        eyebrow="Mercado"
        title="Productos"
        subtitle="Fichas de tienda: nombre, foto, descripción y precio. El stock se carga en Producción → Inventario."
        icon={<Package size={20} />}
        variant="compact"
        actions={
          tab === 'productos' && view === 'list' ? (
            <Button type="button" onClick={handleCreateNew} className="inline-flex items-center gap-2 min-h-11">
              <Plus size={18} />
              Nuevo Producto
            </Button>
          ) : undefined
        }
      />

      <ResponsiveTabBar
        layoutId="catalogo-tabs"
        tabs={[
          { id: 'productos', label: 'Productos', icon: <Package size={18} /> },
          { id: 'taxonomias', label: 'Formatos y Categorías', icon: <Tags size={18} /> },
        ]}
        activeId={tab}
        onChange={(id) => setTab(id as CatalogoTab)}
      />

      {tab === 'productos' && view === 'list' && <ProductList onEdit={handleEdit} onCreateNew={handleCreateNew} />}
      {tab === 'taxonomias' && <TaxonomiasPanel />}

      <ImmersiveModal
        open={view === 'create' || view === 'edit'}
        onClose={handleCancel}
        eyebrow="Catálogo"
        title={view === 'edit' ? 'Editar producto' : 'Nuevo producto'}
        size="xl"
        bodyClassName="!p-0"
      >
        <div className="p-5 sm:p-6">
          <ProductForm
            initialData={
              selectedProduct
                ? {
                    id: selectedProduct.id,
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
