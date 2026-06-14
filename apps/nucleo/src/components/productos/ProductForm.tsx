'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Upload, Image as ImageIcon, Trash2, Plus, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, toast } from '@enjambre/ui';
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

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema) as never,
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = form;

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

    const file = files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxBytes = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast('Solo se permiten imágenes (JPEG, PNG, WEBP, GIF)', { type: 'error' });
      return;
    }
    if (file.size > maxBytes) {
      toast('El archivo supera el tamaño máximo permitido (5MB)', { type: 'error' });
      return;
    }

    setImageUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('productos').getPublicUrl(fileName);
      const currentFotos = getValues('fotos') || [];
      setValue('fotos', [...currentFotos, data.publicUrl]);
      toast('Imagen subida correctamente', { type: 'success' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast(friendlySupabaseError(error as { code?: string; message?: string } | null), { type: 'error' });
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
          toast('Debes iniciar sesión', { type: 'error' });
          return;
        }

        const payload = {
          ...data,
          slug: data.slug || generateSlug(data.nombre),
          updated_at: new Date().toISOString(),
        };

        let result;
        if (initialData?.id) {
          const { data: updated, error } = await supabase
            .from('productos')
            .update(payload)
            .eq('id', initialData.id)
            .select()
            .single();

          if (error) throw error;
          result = updated;
          toast('Producto actualizado correctamente', { type: 'success' });
        } else {
          const { data: created, error } = await supabase
            .from('productos')
            .insert([{ ...payload, created_at: new Date().toISOString() }])
            .select()
            .single();

          if (error) throw error;
          result = created;
          toast('Producto creado correctamente', { type: 'success' });
        }

        onSuccess?.();
      } catch (error) {
        console.error('Error saving product:', error);
        toast(friendlySupabaseError(error as { code?: string; message?: string } | null), { type: 'error' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="product-form">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            {initialData?.id ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button
            type="button"
            onClick={() => setValue('visible', !visible)}
            className={`flex items-center gap-1 bg-transparent border-none cursor-pointer text-xs ${visible ? 'text-success' : 'text-muted-foreground'}`}
            title={visible ? 'Visible en tienda' : 'Oculto en tienda'}
          >
            {visible ? <Eye size={18} /> : <EyeOff size={18} />}
            <span className="text-xs">{visible ? 'Visible' : 'Oculto'}</span>
          </button>
        </div>
        <div className="flex gap-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Nombre del producto *
            </label>
            <input
              {...register('nombre')}
              type="text"
              placeholder="Ej. Miel de Ulmo Premium"
              className="input-field text-base p-4"
            />
            {errors.nombre && <span className="text-xs text-destructive">{errors.nombre.message}</span>}

            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Slug:</span>
              <input
                {...register('slug')}
                type="text"
                placeholder="miel-de-ulmo-premium"
                className="input-field text-xs px-2 py-1 w-[200px]"
                onBlur={(e) => {
                  if (!e.target.value && nombre) {
                    setValue('slug', generateSlug(nombre));
                  }
                }}
              />
              <span className="text-[0.7rem] text-muted-foreground">
                obreyzangano.com/producto/
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Descripción Regenerativa *
            </label>
            <textarea
              {...register('descripcion_regenerativa')}
              placeholder="Contá la historia de este producto: origen, impacto regenerativo, árboles plantados..."
              className="input-field text-[0.9rem] p-4 resize-y"
              rows={5}
            />
            {errors.descripcion_regenerativa && (
              <span className="text-xs text-destructive">{errors.descripcion_regenerativa.message}</span>
            )}
            <span className="text-[0.7rem] text-muted-foreground">
              Esta descripción aparece en la página del producto y comunica el impacto regenerativo
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Descripción Corta
            </label>
            <input
              {...register('descripcion_corta')}
              type="text"
              placeholder="Resumen para tarjetas y listados"
              className="input-field text-[0.9rem] p-4"
            />
            <span className="text-[0.7rem] text-muted-foreground">
              Aparece en el catálogo y tarjetas de producto
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Imágenes del Producto
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {fotos.map((foto, index) => (
                <div key={index} className="relative w-[100px] h-[100px] rounded-sm overflow-hidden border border-border">
                  <img src={foto} alt={`Producto ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-foreground/70 border-none rounded-full w-6 h-6 flex items-center justify-center cursor-pointer text-primary-foreground"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <label
                className={`w-[100px] h-[100px] border-2 border-dashed border-input rounded-sm flex flex-col items-center justify-center bg-accent/5 text-muted-foreground gap-1 ${imageUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {imageUploading ? (
                  <span className="text-[0.7rem]">Subiendo...</span>
                ) : (
                  <>
                    <Upload size={20} />
                    <span className="text-[0.7rem]">Subir</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={imageUploading}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-[0.7rem] text-muted-foreground">
              Primera imagen será la principal. Recomendado: 1200x1200px mínimo
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Video de Trazabilidad (YouTube/Vimeo)
            </label>
            <input
              {...register('video_url')}
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              className="input-field text-[0.9rem] p-4"
            />
            {errors.video_url && (
              <span className="text-xs text-destructive">{errors.video_url.message}</span>
            )}
            <span className="text-[0.7rem] text-muted-foreground">
              Video de Cristina en la colmena o proceso de cosecha
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="p-6 bg-foreground/[0.02] rounded-md border border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Organización
            </h3>

            <div className="mb-4">
              <label className="text-[0.8rem] font-medium text-foreground block mb-1.5">
                Formato *
              </label>
              <select {...register('formato')} className="input-field w-full">
                <option value="">Seleccionar formato</option>
                {PRODUCT_FORMATS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              {errors.formato && <span className="text-xs text-destructive">{errors.formato.message}</span>}
            </div>

            <div className="mb-4">
              <label className="text-[0.8rem] font-medium text-foreground block mb-1.5">
                Categoría
              </label>
              <select {...register('categoria')} className="input-field w-full">
                <option value="">Seleccionar categoría</option>
                {PRODUCT_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[0.8rem] font-medium text-foreground block mb-1.5">
                Tags
              </label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {(watch('tags') || []).map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/15 rounded-sm text-xs text-accent"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="bg-transparent border-none cursor-pointer p-0 text-inherit"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Agregar tag (ej: monofloral, ulmo)"
                className="input-field text-[0.8rem] px-2 py-1"
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

          <div className="p-6 bg-foreground/[0.02] rounded-md border border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Precio
            </h3>

            <div className="mb-4">
              <label className="text-[0.8rem] font-medium text-foreground block mb-1.5">
                Precio CLP *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[0.9rem]">$</span>
                <input
                  {...register('precio')}
                  type="number"
                  placeholder="0"
                  className="input-field pl-8 text-lg font-semibold"
                />
              </div>
              {errors.precio && <span className="text-xs text-destructive">{errors.precio.message}</span>}
            </div>

            <div>
              <label className="text-[0.8rem] font-medium text-foreground block mb-1.5">
                Stock Disponible *
              </label>
              <input
                {...register('stock')}
                type="number"
                placeholder="0"
                className="input-field text-[0.9rem] p-4"
              />
              {errors.stock && <span className="text-xs text-destructive">{errors.stock.message}</span>}
            </div>
          </div>

          <div className="p-6 bg-foreground/[0.02] rounded-md border border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Detalles del Producto
            </h3>

            <div className="mb-4">
              <label className="text-[0.8rem] font-medium text-foreground block mb-1.5">
                Peso Neto (g)
              </label>
              <input
                {...register('peso_netos')}
                type="number"
                placeholder="500"
                className="input-field text-[0.9rem] p-4"
              />
            </div>

            <div className="mb-4">
              <label className="text-[0.8rem] font-medium text-foreground block mb-1.5">
                Ingredientes
              </label>
              <textarea
                {...register('ingredientes')}
                placeholder="100% miel de ulmo virgen, sin aditivos"
                className="input-field text-[0.85rem] p-4 resize-y"
                rows={2}
              />
            </div>

            <div className="mb-4">
              <label className="text-[0.8rem] font-medium text-foreground block mb-1.5">
                Origen Apícola
              </label>
              <input
                {...register('origen_apicola')}
                type="text"
                placeholder="Pureo, Chiloé - Colmena Ulmo Mayor"
                className="input-field text-[0.85rem] p-4"
              />
              <span className="text-[0.7rem] text-muted-foreground">
                Lugar específico de cosecha
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                {...register('trazabilidad_qr')}
                type="checkbox"
                id="trazabilidad_qr"
                className="w-4 h-4"
              />
              <label htmlFor="trazabilidad_qr" className="text-[0.8rem] text-foreground">
                Incluir QR de trazabilidad
              </label>
            </div>
          </div>

          <div className="p-6 bg-foreground/[0.02] rounded-md border border-accent/15 mt-6">
            <h3 className="text-sm font-semibold text-accent mb-4 flex items-center gap-1.5">
              Métricas Científicas
            </h3>
            <p className="text-[0.7rem] text-muted-foreground mb-4">
              Datos visibles sutilmente en la tienda. El IRR aparece como chip cuando es mayor a 1.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[0.8rem] font-medium text-foreground block mb-1.5">
                  Sustituye azúcar (g)
                </label>
                <input {...register('sustituye_azucar_g')} type="number" placeholder="Ej: 25" className="input-field text-[0.9rem] p-4" />
                <span className="text-[0.65rem] text-muted-foreground">Gramos de azúcar refinada que este producto reemplaza</span>
              </div>
              <div>
                <label className="text-[0.8rem] font-medium text-foreground block mb-1.5">
                  CO₂ evitado (kg)
                </label>
                <input {...register('co2_evitado_kg')} type="number" placeholder="Ej: 2.7" className="input-field text-[0.9rem] p-4" />
                <span className="text-[0.65rem] text-muted-foreground">kg CO₂ evitados vs azúcar refinada equivalente</span>
              </div>
              <div>
                <label className="text-[0.8rem] font-medium text-foreground block mb-1.5">
                  IRR referencia
                </label>
                <input {...register('irr_referencia')} type="number" step="0.01" placeholder="Ej: 3.46" className="input-field text-[0.9rem] p-4" />
                <span className="text-[0.65rem] text-muted-foreground">IRR = CO₂ capturado / CO₂ emitido. &gt;1 = impacto positivo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
