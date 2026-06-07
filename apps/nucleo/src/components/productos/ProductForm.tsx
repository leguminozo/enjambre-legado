'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Upload, Image as ImageIcon, Trash2, Plus, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@enjambre/ui';
import { friendlySupabaseError } from '@enjambre/ui';
import { productFormSchema, type ProductFormData, PRODUCT_FORMATS, PRODUCT_CATEGORIES } from '@/lib/product-types';

interface ProductFormProps {
  initialData?: ProductFormData & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({ initialData, onSuccess, onCancel }: ProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const [imageUploading, setImageUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema) as unknown as Parameters<typeof useForm<ProductFormData>>[0]['resolver'],
    defaultValues: {
      nombre: initialData?.nombre || '',
      descripcion_regenerativa: initialData?.descripcion_regenerativa || '',
      precio: initialData?.precio || 0,
      stock: initialData?.stock || 0,
      formato: initialData?.formato || '',
      visible: initialData?.visible ?? true,
      slug: initialData?.slug || '',
      video_url: initialData?.video_url || '',
      fotos: initialData?.fotos || [],
      categoria: initialData?.categoria || '',
      tags: initialData?.tags || [],
      descripcion_corta: initialData?.descripcion_corta || '',
      peso_netos: initialData?.peso_netos || undefined,
      ingredientes: initialData?.ingredientes || '',
      origen_apicola: initialData?.origen_apicola || '',
      trazabilidad_qr: initialData?.trazabilidad_qr ?? true,
      sustituye_azucar_g: initialData?.sustituye_azucar_g || undefined,
      co2_evitado_kg: initialData?.co2_evitado_kg || undefined,
      irr_referencia: initialData?.irr_referencia || undefined,
    },
  });

  const fotos = watch('fotos') || [];
  const visible = watch('visible');
  const nombre = watch('nombre');

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageUploading(true);
    try {
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('productos').getPublicUrl(fileName);
      const currentFotos = getValues('fotos') || [];
      setValue('fotos', [...currentFotos, data.publicUrl]);
      alert('Imagen subida correctamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(friendlySupabaseError(error));
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const currentFotos = getValues('fotos') || [];
    setValue('fotos', currentFotos.filter((_, i) => i !== index));
  };

  const addTag = (tag: string) => {
    if (!tag.trim()) return;
    const currentTags = getValues('tags') || [];
    if (!currentTags.includes(tag.trim())) {
      setValue('tags', [...currentTags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = getValues('tags') || [];
    setValue('tags', currentTags.filter(t => t !== tagToRemove));
  };

  const onSubmit = async (data: ProductFormData) => {
    startTransition(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert('Debes iniciar sesión');
          return;
        }

        const payload = {
          ...data,
          slug: data.slug || generateSlug(data.nombre),
          updated_at: new Date().toISOString(),
        };

        let result;
        if (initialData?.id) {
          // Update existing product
          const { data: updated, error } = await supabase
            .from('productos')
            .update(payload)
            .eq('id', initialData.id)
            .select()
            .single();
          
          if (error) throw error;
          result = updated;
          alert('Producto actualizado correctamente');
        } else {
          // Create new product
          const { data: created, error } = await supabase
            .from('productos')
            .insert([{ ...payload, created_at: new Date().toISOString() }])
            .select()
            .single();
          
          if (error) throw error;
          result = created;
          alert('Producto creado correctamente');
        }

        onSuccess?.();
      } catch (error) {
        console.error('Error saving product:', error);
        alert(friendlySupabaseError(error));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="product-form">
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', paddingBottom: 'var(--space-md)', borderBottom: '1px solid hsl(var(--border))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            {initialData?.id ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button
            type="button"
            onClick={() => setValue('visible', !visible)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: visible ? 'var(--text-success)' : 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: 4 }}
            title={visible ? 'Visible en tienda' : 'Oculto en tienda'}
          >
            {visible ? <Eye size={18} /> : <EyeOff size={18} />}
            <span style={{ fontSize: '0.75rem' }}>{visible ? 'Visible' : 'Oculto'}</span>
          </button>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : initialData?.id ? 'Actualizar' : 'Crear Producto'}
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-xl)' }}>
        {/* Left Column - Main Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Nombre y Slug */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
              Nombre del producto *
            </label>
            <input
              {...register('nombre')}
              type="text"
              placeholder="Ej. Miel de Ulmo Premium"
              className="input-field"
              style={{ fontSize: '1rem', padding: 'var(--space-md)' }}
            />
            {errors.nombre && <span style={{ fontSize: '0.75rem', color: 'var(--text-error)' }}>{errors.nombre.message}</span>}
            
            <div style={{ marginTop: 'var(--space-xs)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Slug:</span>
              <input
                {...register('slug')}
                type="text"
                placeholder="miel-de-ulmo-premium"
                className="input-field"
                style={{ fontSize: '0.75rem', padding: 'var(--space-xs) var(--space-sm)', width: 200 }}
                onBlur={(e) => {
                  if (!e.target.value && nombre) {
                    setValue('slug', generateSlug(nombre));
                  }
                }}
              />
              <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
                obreyzangano.com/producto/
              </span>
            </div>
          </div>

          {/* Descripción Regenerativa */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
              Descripción Regenerativa *
            </label>
            <textarea
              {...register('descripcion_regenerativa')}
              placeholder="Contá la historia de este producto: origen, impacto regenerativo, árboles plantados..."
              className="input-field"
              rows={5}
              style={{ fontSize: '0.9rem', padding: 'var(--space-md)', resize: 'vertical' }}
            />
            {errors.descripcion_regenerativa && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-error)' }}>{errors.descripcion_regenerativa.message}</span>
            )}
            <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
              Esta descripción aparece en la página del producto y comunica el impacto regenerativo
            </span>
          </div>

          {/* Descripción Corta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
              Descripción Corta
            </label>
            <input
              {...register('descripcion_corta')}
              type="text"
              placeholder="Resumen para tarjetas y listados"
              className="input-field"
              style={{ fontSize: '0.9rem', padding: 'var(--space-md)' }}
            />
            <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
              Aparece en el catálogo y tarjetas de producto
            </span>
          </div>

          {/* Imágenes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
              Imágenes del Producto
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
              {fotos.map((foto, index) => (
                <div key={index} style={{ position: 'relative', width: 100, height: 100, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
                  <img src={foto} alt={`Producto ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'hsl(var(--foreground) / 0.7)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'hsl(var(--primary-foreground))' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <label
                style={{
                  width: 100,
                  height: 100,
                  border: '2px dashed hsl(var(--input))',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: imageUploading ? 'not-allowed' : 'pointer',
                  background: 'hsl(var(--accent) / 0.05)',
                  color: 'hsl(var(--muted-foreground))',
                  gap: 4,
                }}
              >
                {imageUploading ? (
                  <span style={{ fontSize: '0.7rem' }}>Subiendo...</span>
                ) : (
                  <>
                    <Upload size={20} />
                    <span style={{ fontSize: '0.7rem' }}>Subir</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={imageUploading}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
              Primera imagen será la principal. Recomendado: 1200x1200px mínimo
            </span>
          </div>

          {/* Video URL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
              Video de Trazabilidad (YouTube/Vimeo)
            </label>
            <input
              {...register('video_url')}
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              className="input-field"
              style={{ fontSize: '0.9rem', padding: 'var(--space-md)' }}
            />
            {errors.video_url && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-error)' }}>{errors.video_url.message}</span>
            )}
            <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
              Video de Cristina en la colmena o proceso de cosecha
            </span>
          </div>
        </div>

        {/* Right Column - Organization & Pricing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Organización */}
          <div style={{ padding: 'var(--space-lg)', background: 'hsl(var(--foreground) / 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border) / 0.5)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 'var(--space-md)' }}>
              Organización
            </h3>
            
            {/* Formato */}
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'hsl(var(--foreground))', display: 'block', marginBottom: 6 }}>
                Formato *
              </label>
              <select {...register('formato')} className="input-field" style={{ width: '100%' }}>
                <option value="">Seleccionar formato</option>
                {PRODUCT_FORMATS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              {errors.formato && <span style={{ fontSize: '0.75rem', color: 'var(--text-error)' }}>{errors.formato.message}</span>}
            </div>

            {/* Categoría */}
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'hsl(var(--foreground))', display: 'block', marginBottom: 6 }}>
                Categoría
              </label>
              <select {...register('categoria')} className="input-field" style={{ width: '100%' }}>
                <option value="">Seleccionar categoría</option>
                {PRODUCT_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'hsl(var(--foreground))', display: 'block', marginBottom: 6 }}>
                Tags
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                {(watch('tags') || []).map(tag => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      background: 'hsl(var(--accent) / 0.15)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      color: 'hsl(var(--accent))',
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Agregar tag (ej: monofloral, ulmo)"
                className="input-field"
                style={{ fontSize: '0.8rem', padding: 'var(--space-xs) var(--space-sm)' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>

          {/* Precio */}
          <div style={{ padding: 'var(--space-lg)', background: 'hsl(var(--foreground) / 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border) / 0.5)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 'var(--space-md)' }}>
              Precio
            </h3>
            
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'hsl(var(--foreground))', display: 'block', marginBottom: 6 }}>
                Precio CLP *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 'var(--space-md)', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>$</span>
                <input
                  {...register('precio')}
                  type="number"
                  placeholder="0"
                  className="input-field"
                  style={{ paddingLeft: '2rem', fontSize: '1.1rem', fontWeight: 600 }}
                />
              </div>
              {errors.precio && <span style={{ fontSize: '0.75rem', color: 'var(--text-error)' }}>{errors.precio.message}</span>}
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'hsl(var(--foreground))', display: 'block', marginBottom: 6 }}>
                Stock Disponible *
              </label>
              <input
                {...register('stock')}
                type="number"
                placeholder="0"
                className="input-field"
                style={{ fontSize: '0.9rem', padding: 'var(--space-md)' }}
              />
              {errors.stock && <span style={{ fontSize: '0.75rem', color: 'var(--text-error)' }}>{errors.stock.message}</span>}
            </div>
          </div>

          {/* Detalles Adicionales */}
          <div style={{ padding: 'var(--space-lg)', background: 'hsl(var(--foreground) / 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border) / 0.5)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 'var(--space-md)' }}>
              Detalles del Producto
            </h3>
            
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'hsl(var(--foreground))', display: 'block', marginBottom: 6 }}>
                Peso Neto (g)
              </label>
              <input
                {...register('peso_netos')}
                type="number"
                placeholder="500"
                className="input-field"
                style={{ fontSize: '0.9rem', padding: 'var(--space-md)' }}
              />
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'hsl(var(--foreground))', display: 'block', marginBottom: 6 }}>
                Ingredientes
              </label>
              <textarea
                {...register('ingredientes')}
                placeholder="100% miel de ulmo virgen, sin aditivos"
                className="input-field"
                rows={2}
                style={{ fontSize: '0.85rem', padding: 'var(--space-md)', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'hsl(var(--foreground))', display: 'block', marginBottom: 6 }}>
                Origen Apícola
              </label>
              <input
                {...register('origen_apicola')}
                type="text"
                placeholder="Pureo, Chiloé - Colmena Ulmo Mayor"
                className="input-field"
                style={{ fontSize: '0.85rem', padding: 'var(--space-md)' }}
              />
              <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>
                Lugar específico de cosecha
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <input
                {...register('trazabilidad_qr')}
                type="checkbox"
                id="trazabilidad_qr"
                style={{ width: 16, height: 16 }}
              />
              <label htmlFor="trazabilidad_qr" style={{ fontSize: '0.8rem', color: 'hsl(var(--foreground))' }}>
                Incluir QR de trazabilidad
              </label>
            </div>
      </div>

        {/* Métricas Científicas */}
        <div style={{ padding: 'var(--space-lg)', background: 'hsl(var(--foreground) / 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--accent) / 0.15)', marginTop: 'var(--space-lg)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--accent))', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 6 }}>
            Métricas Científicas
          </h3>
          <p style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>
            Datos visibles sutilmente en la tienda. El IRR aparece como chip cuando es mayor a 1.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'hsl(var(--foreground))', display: 'block', marginBottom: 6 }}>
                Sustituye azúcar (g)
              </label>
              <input {...register('sustituye_azucar_g')} type="number" placeholder="Ej: 25" className="input-field" style={{ fontSize: '0.9rem', padding: 'var(--space-md)' }} />
              <span style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>Gramos de azúcar refinada que este producto reemplaza</span>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'hsl(var(--foreground))', display: 'block', marginBottom: 6 }}>
                CO₂ evitado (kg)
              </label>
              <input {...register('co2_evitado_kg')} type="number" placeholder="Ej: 2.7" className="input-field" style={{ fontSize: '0.9rem', padding: 'var(--space-md)' }} />
              <span style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>kg CO₂ evitados vs azúcar refinada equivalente</span>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'hsl(var(--foreground))', display: 'block', marginBottom: 6 }}>
                IRR referencia
              </label>
              <input {...register('irr_referencia')} type="number" step="0.01" placeholder="Ej: 3.46" className="input-field" style={{ fontSize: '0.9rem', padding: 'var(--space-md)' }} />
              <span style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>IRR = CO₂ capturado / CO₂ emitido. &gt;1 = impacto positivo</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </form>
  );
}