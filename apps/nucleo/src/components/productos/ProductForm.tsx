'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Upload, Image as ImageIcon, Trash2, Plus, ExternalLink, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '@/lib/supabase';
import { Button, toast, slugify, MoneyInput, getCurrencyDefinition } from '@enjambre/ui';
import { friendlySupabaseError } from '@enjambre/ui';
import { productFormSchema, type ProductFormData, DEFAULT_PRODUCT_FORMATS, DEFAULT_PRODUCT_CATEGORIES } from '@/lib/product-types';
import { useProductTaxonomies } from '@/hooks/use-product-taxonomies';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { processImage } from '@/lib/process-image';

interface ProductFormProps {
  initialData?: ProductFormData & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
  /**
   * catalog: ficha de tienda (stock no se edita aquí).
   * inventory: edición desde Inventario — stock editable para reformular tras incidentes.
   */
  variant?: 'catalog' | 'inventory';
}

export function ProductForm({
  initialData,
  onSuccess,
  onCancel,
  variant = 'catalog',
}: ProductFormProps) {
  const fromInventory = variant === 'inventory';
  const apiFetch = useApiFetch();
  const [isPending, startTransition] = useTransition();
  const [imageUploading, setImageUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lotes, setLotes] = useState<{ id: string; nombre_lote?: string | null; blockchain_hash?: string | null }[]>([]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('lotes')
        .select('id, nombre_lote, blockchain_hash')
        .order('created_at', { ascending: false });
      if (data) setLotes(data);
    })();
  }, []);

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
      peso_neto_g: initialData?.peso_neto_g || undefined,
      ingredientes: initialData?.ingredientes || '',
      origen_apicola: initialData?.origen_apicola || '',
      trazabilidad_qr: initialData?.trazabilidad_qr ?? true,
      sustituye_azucar_g: initialData?.sustituye_azucar_g || undefined,
      co2_evitado_kg: initialData?.co2_evitado_kg || undefined,
      irr_referencia: initialData?.irr_referencia || undefined,
      lote_id: initialData?.lote_id || undefined,
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
  const precio = watch('precio');
  const stock = watch('stock');
  const currencyDef = getCurrencyDefinition();

  // Taxonomías gestionables (Mercado → Productos → Formatos y Categorías).
  // Fallback a los DEFAULT_* mientras carga o si la tabla aún no existe.
  const { data: taxonomies } = useProductTaxonomies();
  const formatOptions = taxonomies?.formats ?? DEFAULT_PRODUCT_FORMATS;
  const categoryOptions = taxonomies?.categories ?? DEFAULT_PRODUCT_CATEGORIES;

  // Al editar un producto cuyo valor ya no está activo (desactivado/renombrado
  // en el panel), se agrega como opción para no perder el valor guardado.
  const formatoActual = watch('formato');
  const categoriaActual = watch('categoria');
  const formatOptionsForSelect = formatOptions.some((f) => f.value === formatoActual)
    ? formatOptions
    : formatoActual
      ? [...formatOptions, { value: formatoActual, label: formatoActual }]
      : formatOptions;
  const categoryOptionsForSelect = categoryOptions.some((c) => c.value === categoriaActual)
    ? categoryOptions
    : categoriaActual
      ? [...categoryOptions, { value: categoriaActual, label: categoriaActual }]
      : categoryOptions;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxBytes = 5 * 1024 * 1024; // 5MB

    const validFiles = Array.from(files).filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast(`El archivo ${file.name} no es una imagen válida`, { type: 'error' });
        return false;
      }
      if (file.size > maxBytes) {
        toast(`El archivo ${file.name} supera el tamaño máximo (5MB)`, { type: 'error' });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setImageUploading(true);
    try {
      const uploadPromises = validFiles.map(async (originalFile) => {
        // Optimizar: max 1200px + WEBP 80% (pipeline compartido con logo/CMS)
        const file = await processImage(originalFile, { maxSize: 1200, quality: 0.8 });

        const fileName = `${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage
          .from('productos')
          .upload(fileName, file, {
            upsert: true,
            contentType: 'image/webp',
            cacheControl: '31536000',
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('productos').getPublicUrl(fileName);
        return data.publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const currentFotos = getValues('fotos') || [];
      setValue('fotos', [...currentFotos, ...uploadedUrls]);
      toast(uploadedUrls.length === 1 ? 'Imagen subida correctamente' : `${uploadedUrls.length} imágenes subidas correctamente`, { type: 'success' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast(friendlySupabaseError(error as { code?: string; message?: string } | null), { type: 'error' });
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const currentFotos = getValues('fotos') || [];
    setValue('fotos', currentFotos.filter((_, i) => i !== index));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const currentFotos = getValues('fotos') || [];
    const newFotos = Array.from(currentFotos);
    const [reorderedItem] = newFotos.splice(result.source.index, 1);
    newFotos.splice(result.destination.index, 0, reorderedItem);
    setValue('fotos', newFotos);
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast('Debes iniciar sesión', { type: 'error' });
          return;
        }

        let finalSlug = data.slug ? slugify(data.slug) : slugify(data.nombre);
        
        // Ensure slug uniqueness
        const { data: existingProd } = await supabase
          .from('productos')
          .select('id')
          .eq('slug', finalSlug)
          .maybeSingle();

        if (existingProd && existingProd.id !== initialData?.id) {
          finalSlug = `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`;
        }

        const payload = {
          ...data,
          slug: finalSlug,
          lote_id: data.lote_id || null,
          updated_at: new Date().toISOString(),
        };

        // Remove derived scientific metrics
        delete payload.sustituye_azucar_g;
        delete payload.co2_evitado_kg;
        delete payload.irr_referencia;

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

        // El catálogo cambió (precio/fotos/visible/stock): invalidar ISR de la
        // tienda. Fail-open: nunca bloquea el guardado.
        void apiFetch('/api/admin-system/purge-cache', { method: 'POST' }).catch(() => undefined);

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
                    setValue('slug', slugify(nombre));
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
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-foreground">
                Imágenes del Producto
              </label>
              {fotos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  aria-expanded={showPreview}
                  className="inline-flex items-center gap-1.5 min-h-11 px-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Eye size={14} />
                  {showPreview ? 'Ocultar vista previa' : 'Vista previa'}
                </button>
              )}
            </div>
            {showPreview && fotos[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fotos[0]}
                alt="Vista previa del producto"
                className="w-full max-h-72 object-contain rounded-md border border-border bg-card"
              />
            )}
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="fotos-droppable" direction="horizontal">
                {(provided) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef} 
                    className="flex flex-wrap gap-2 mb-2"
                  >
                    {fotos.map((foto, index) => (
                      <Draggable key={foto} draggableId={foto} index={index}>
                        {(provided) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="relative w-[100px] h-[100px] rounded-sm overflow-hidden border border-border bg-card group"
                          >
                            <img src={foto} alt={`Producto ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />
                            {index === 0 && (
                              <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold shadow-sm pointer-events-none">Principal</span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              aria-label="Quitar imagen"
                              className="absolute top-0.5 right-0.5 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-foreground/70 border-none cursor-pointer text-primary-foreground hover:bg-destructive transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
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
                        multiple
                        onChange={handleImageUpload}
                        disabled={imageUploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <span className="text-[0.7rem] text-muted-foreground">
              Primera imagen será la principal. Recomendado: 1200x1200px mínimo
            </span>
          </div>

          <div className="border border-border rounded-md overflow-hidden bg-foreground/[0.01] mt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-4 text-sm font-medium text-foreground hover:bg-foreground/[0.02] transition-colors"
            >
              Opciones Avanzadas de Producto
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showAdvanced && (
              <div className="p-4 border-t border-border flex flex-col gap-6">
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
                    Video de Cristina en la colmena o proceso de recolección
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">
                    Ingredientes
                  </label>
                  <textarea
                    {...register('ingredientes')}
                    placeholder="100% miel de ulmo virgen, sin aditivos"
                    className="input-field text-[0.85rem] p-4 resize-y"
                    rows={2}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">
                    Origen Apícola
                  </label>
                  <input
                    {...register('origen_apicola')}
                    type="text"
                    placeholder="Pureo, Chiloé - Colmena Ulmo Mayor"
                    className="input-field text-[0.85rem] p-4"
                  />
                  <span className="text-[0.7rem] text-muted-foreground">
                    Lugar específico de cosecha (opcional si ya está en descripción)
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    {...register('trazabilidad_qr')}
                    type="checkbox"
                    id="trazabilidad_qr"
                    className="w-4 h-4"
                  />
                  <label htmlFor="trazabilidad_qr" className="text-[0.8rem] text-foreground">
                    Incluir QR de trazabilidad en la vista del producto
                  </label>
                </div>
              </div>
            )}
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
                {formatOptionsForSelect.map(f => (
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
                {categoryOptionsForSelect.map(c => (
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
              Comercial & Operaciones
            </h3>

            <div className="mb-4">
              <label className="text-[0.8rem] font-medium text-foreground block mb-1.5">
                Precio ({currencyDef.code}) *
              </label>
              <MoneyInput
                value={precio ?? 0}
                onValueChange={(v) => setValue('precio', v, { shouldValidate: true, shouldDirty: true })}
                className="text-lg"
                aria-label={`Precio en ${currencyDef.label}`}
              />
              <span className="text-[0.65rem] text-muted-foreground mt-1.5 block">
                Escribí solo números: 8 → 80 → 800 → 8.000 (formato {currencyDef.label}).
              </span>
              {errors.precio && <span className="text-xs text-destructive">{errors.precio.message}</span>}
            </div>

            {fromInventory ? (
              <div className="mb-4 rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-2">
                <label className="text-[0.8rem] font-medium text-foreground block">
                  Stock actual (reformular)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  className="input-field text-lg font-semibold tabular-nums"
                  value={stock ?? 0}
                  onChange={(e) =>
                    setValue('stock', Math.max(0, parseInt(e.target.value, 10) || 0), {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  aria-label="Stock en unidades"
                />
                <p className="text-[0.65rem] text-muted-foreground">
                  Ajuste absoluto de unidades (p. ej. merma, corrección de conteo o incidente).
                  Para sumar stock de producción usá “Cargar stock” en la lista.
                </p>
                {errors.stock && (
                  <span className="text-xs text-destructive">{errors.stock.message}</span>
                )}
              </div>
            ) : (
              <>
                <input type="hidden" {...register('stock')} />
                <p className="mb-4 text-xs text-muted-foreground rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                  El stock no se edita en Productos. Carga y reposición de unidades:{" "}
                  <a
                    href="/produccion/inventario"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Producción → Inventario
                  </a>
                  .
                </p>
              </>
            )}

            <div className="mb-4">
              <label className="text-[0.8rem] font-medium text-foreground block mb-1.5 flex items-center justify-between">
                <span>Peso Neto (g)</span>
              </label>
              <input
                {...register('peso_neto_g')}
                type="number"
                placeholder="Ej: 500"
                className="input-field text-[0.9rem] p-4"
              />
              <span className="text-[0.65rem] text-muted-foreground mt-1 block">
                Requerido para descontar kg del lote al vender.
              </span>
            </div>

            <div>
              <label className="text-[0.8rem] font-medium text-foreground block mb-1.5">
                Lote Asignado
              </label>
              <select {...register('lote_id')} className="input-field w-full">
                <option value="">Sin lote asignado</option>
                {lotes.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.nombre_lote || (l.blockchain_hash ? `Hash: ${l.blockchain_hash.slice(0, 8)}...` : `Lote: ${l.id.slice(0, 8)}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
