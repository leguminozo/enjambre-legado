'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Upload, Image as ImageIcon, Trash2, Plus, ExternalLink, Eye, EyeOff, ChevronDown, ChevronUp, Scale, Info, CheckCircle2, AlertTriangle, Layers, Tag as TagIcon, Compass, UtensilsCrossed, Sparkles, Package, Edit3 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '@/lib/supabase';
import { Button, toast, slugify, MoneyInput, getCurrencyDefinition, formatMoney } from '@enjambre/ui';
import { friendlySupabaseError, friendlyError } from '@enjambre/ui';
import {
  productFormSchema,
  type ProductFormData,
  type PerfilSensorial,
  DEFAULT_PRODUCT_FORMATS,
  DEFAULT_PRODUCT_CATEGORIES,
  DEFAULT_SENSORY_FAMILIES,
  extractGramajeFromFormato,
  PRODUCT_TAGS,
  PRODUCT_CHANNELS,
  CATEGORIAS_SENSORIALES,
  FORTIFICANTES_CANONICOS,
  FORTIFICANTES_LABELS,
  PARES_SEMANTICOS_POR_CATEGORIA,
  type CategoriaSensorial,
  type FortificanteCanonico,
  type ProductoVariante,
} from '@/lib/product-types';
import { useProductTaxonomies } from '@/hooks/use-product-taxonomies';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { processImage } from '@/lib/process-image';
import { getUrlTienda } from '@/lib/publicUrls';

interface ProductFormProps {
  initialData?: Omit<ProductFormData, 'tipo_sensorial'> & { id?: string; tipo_sensorial?: CategoriaSensorial };
  onSuccess?: () => void;
  onCancel?: () => void;
  /**
   * catalog: ficha de tienda (stock no se edita aquí).
   * inventory: edición desde Inventario — stock editable para reformular tras incidentes.
   */
  variant?: 'catalog' | 'inventory';
}

interface LoteRow {
  id: string;
  nombre_lote?: string | null;
  blockchain_hash?: string | null;
  kg_total?: number | null;
  variedad_floral?: string | null;
  publico?: boolean | null;
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
  const [showSensorial, setShowSensorial] = useState(false);
  const [availableChips, setAvailableChips] = useState<string[]>([]);
  const [newCustomNota, setNewCustomNota] = useState('');
  const [newMaridajeTitulo, setNewMaridajeTitulo] = useState('');
  const [newMaridajeDetalle, setNewMaridajeDetalle] = useState('');
  const [lotes, setLotes] = useState<LoteRow[]>([]);
  const [variantes, setVariantes] = useState<ProductoVariante[]>([]);
  const [loadingVariantes, setLoadingVariantes] = useState(false);
  const [showVariantes, setShowVariantes] = useState(false);
  const [editingVariante, setEditingVariante] = useState<ProductoVariante | null>(null);
  const [varianteFormOpen, setVarianteFormOpen] = useState(false);
  const [varianteSku, setVarianteSku] = useState('');
  const [varianteNombre, setVarianteNombre] = useState('');
  const [varianteTipo, setVarianteTipo] = useState<'formato' | 'fortificacion' | 'edicion_especial' | 'pack'>('fortificacion');
  const [varianteFortificante, setVarianteFortificante] = useState<FortificanteCanonico>('polen_floral');
  const [variantePeso, setVariantePeso] = useState<number | ''>(250);
  const [variantePrecio, setVariantePrecio] = useState<number | ''>('');
  const [varianteStock, setVarianteStock] = useState<number | ''>(0);
  const [savingVariante, setSavingVariante] = useState(false);

  const loadVariantes = async () => {
    if (!initialData?.id) return;
    setLoadingVariantes(true);
    try {
      const res = await apiFetch(
        `/api/variantes?producto_id=${initialData.id}&solo_activas=false`,
      );
      if (res.ok) {
        const json = (await res.json()) as { data?: ProductoVariante[] };
        if (json.data) {
          setVariantes(json.data);
        }
      }
    } catch (err) {
      console.error('Error fetching variantes:', err);
    } finally {
      setLoadingVariantes(false);
    }
  };

  useEffect(() => {
    if (initialData?.id) {
      void loadVariantes();
    }
  }, [initialData?.id]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('lotes')
        .select('id, nombre_lote, blockchain_hash, kg_total, variedad_floral, publico')
        .order('created_at', { ascending: false });
      if (data) setLotes(data as LoteRow[]);

      const { data: chipsData } = await (supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (col: string, val: boolean) => {
              order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Array<{ chip?: string }> | null }>;
            };
          };
        };
      })
        .from('perc_chip_catalogos')
        .select('chip')
        .eq('activo', true)
        .order('sort_order', { ascending: true });

      if (chipsData && Array.isArray(chipsData)) {
        const mapped = chipsData
          .map((c: { chip?: string }) => c.chip)
          .filter((chip): chip is string => typeof chip === 'string' && chip.length > 0);
        if (mapped.length > 0) {
          setAvailableChips(mapped);
        }
      }
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
      channels: initialData?.channels && initialData.channels.length > 0 ? initialData.channels : ['tienda', 'campo'],
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
      tipo_sensorial:
        ((initialData as unknown as { tipo_sensorial?: CategoriaSensorial })?.tipo_sensorial) ||
        (initialData?.categoria?.toLowerCase().includes('infusion') ? 'infusion' : 'miel'),
      perfil_sensorial: initialData?.perfil_sensorial || {
        intensidad: 75,
        dulzor_acidez: 60,
        textura: 85,
        notas_aromaticas: [],
        maridajes: [],
        momento_consumo: '',
      },
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        nombre: initialData.nombre || '',
        descripcion_regenerativa: initialData.descripcion_regenerativa || '',
        precio: initialData.precio || 0,
        stock: initialData.stock || 0,
        formato: initialData.formato || '',
        visible: initialData.visible ?? true,
        channels: initialData.channels && initialData.channels.length > 0 ? initialData.channels : ['tienda', 'campo'],
        slug: initialData.slug || '',
        video_url: initialData.video_url || '',
        fotos: initialData.fotos || [],
        categoria: initialData.categoria || '',
        tags: initialData.tags || [],
        descripcion_corta: initialData.descripcion_corta || '',
        peso_neto_g: initialData.peso_neto_g || undefined,
        ingredientes: initialData.ingredientes || '',
        origen_apicola: initialData.origen_apicola || '',
        trazabilidad_qr: initialData.trazabilidad_qr ?? true,
        sustituye_azucar_g: initialData.sustituye_azucar_g || undefined,
        co2_evitado_kg: initialData.co2_evitado_kg || undefined,
        irr_referencia: initialData.irr_referencia || undefined,
        lote_id: initialData.lote_id || undefined,
        tipo_sensorial:
          ((initialData as unknown as { tipo_sensorial?: CategoriaSensorial })?.tipo_sensorial) ||
          (initialData.categoria?.toLowerCase().includes('infusion') ? 'infusion' : 'miel'),
        perfil_sensorial: initialData.perfil_sensorial || {
          intensidad: 75,
          dulzor_acidez: 60,
          textura: 85,
          notas_aromaticas: [],
          maridajes: [],
          momento_consumo: '',
        },
      });
    }
  }, [initialData, form]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    setError,
    clearErrors,
  } = form;

  const channels = watch('channels') || ['tienda', 'campo'];

  const toggleChannel = (chId: string) => {
    const exists = channels.includes(chId);
    if (exists && channels.length === 1) {
      toast('El producto debe estar en al menos un canal', { type: 'error' });
      return;
    }
    const next = exists ? channels.filter((c) => c !== chId) : [...channels, chId];
    setValue('channels', next, { shouldValidate: true, shouldDirty: true });
  };

  const perfilSensorial = watch('perfil_sensorial') || {
    intensidad: 75,
    dulzor_acidez: 60,
    textura: 85,
    notas_aromaticas: [],
    maridajes: [],
    momento_consumo: '',
  };

  const toggleNotaAromatica = (chip: string) => {
    const currentNotas = perfilSensorial.notas_aromaticas || [];
    const exists = currentNotas.includes(chip);
    const nextNotas = exists ? currentNotas.filter((c) => c !== chip) : [...currentNotas, chip];
    setValue('perfil_sensorial.notas_aromaticas', nextNotas, { shouldDirty: true });
  };

  const addCustomNota = () => {
    if (!newCustomNota.trim()) return;
    const currentNotas = perfilSensorial.notas_aromaticas || [];
    if (!currentNotas.includes(newCustomNota.trim())) {
      setValue('perfil_sensorial.notas_aromaticas', [...currentNotas, newCustomNota.trim()], { shouldDirty: true });
    }
    setNewCustomNota('');
  };

  const removeNotaAromatica = (notaToRemove: string) => {
    const currentNotas = perfilSensorial.notas_aromaticas || [];
    setValue('perfil_sensorial.notas_aromaticas', currentNotas.filter((n) => n !== notaToRemove), { shouldDirty: true });
  };

  const addMaridaje = () => {
    if (!newMaridajeTitulo.trim()) return;
    const currentMaridajes = perfilSensorial.maridajes || [];
    setValue('perfil_sensorial.maridajes', [
      ...currentMaridajes,
      { titulo: newMaridajeTitulo.trim(), detalle: newMaridajeDetalle.trim() },
    ], { shouldDirty: true });
    setNewMaridajeTitulo('');
    setNewMaridajeDetalle('');
  };

  const removeMaridaje = (index: number) => {
    const currentMaridajes = perfilSensorial.maridajes || [];
    setValue('perfil_sensorial.maridajes', currentMaridajes.filter((_, i) => i !== index), { shouldDirty: true });
  };

  const openNewVarianteForm = () => {
    setEditingVariante(null);
    setVarianteSku('');
    setVarianteNombre('');
    setVarianteTipo('fortificacion');
    setVarianteFortificante('polen_floral');
    setVariantePeso(watch('peso_neto_g') || 250);
    setVariantePrecio('');
    setVarianteStock(0);
    setVarianteFormOpen(true);
  };

  const openEditVarianteForm = (v: ProductoVariante) => {
    setEditingVariante(v);
    setVarianteSku(v.sku);
    setVarianteNombre(v.nombre_variante);
    setVarianteTipo((v.tipo_variante as 'formato' | 'fortificacion' | 'edicion_especial' | 'pack') || 'fortificacion');
    setVarianteFortificante((v.ingrediente_fortificante as FortificanteCanonico) || 'polen_floral');
    setVariantePeso(v.peso_neto_g ?? '');
    setVariantePrecio(v.precio_override ?? '');
    setVarianteStock(v.stock ?? 0);
    setVarianteFormOpen(true);
  };

  const handleSaveVariante = async () => {
    if (!initialData?.id) return;
    if (!varianteSku.trim() || !varianteNombre.trim()) {
      toast('SKU y nombre de la variante son obligatorios', { type: 'error' });
      return;
    }
    setSavingVariante(true);
    try {
      const payload = {
        producto_id: initialData.id,
        sku: varianteSku.trim().toUpperCase(),
        nombre_variante: varianteNombre.trim(),
        tipo_variante: varianteTipo,
        ingrediente_fortificante: varianteTipo === 'fortificacion' ? varianteFortificante : null,
        peso_neto_g: variantePeso === '' ? null : Number(variantePeso),
        precio_override: variantePrecio === '' ? null : Number(variantePrecio),
        stock: varianteStock === '' ? 0 : Number(varianteStock),
        activo: true,
      };

      const res = editingVariante?.id
        ? await apiFetch(`/api/variantes/${editingVariante.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await apiFetch('/api/variantes', {
            method: 'POST',
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const errData = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(errData?.message || 'No se pudo guardar la variante');
      }

      toast(
        editingVariante?.id ? 'Variante actualizada correctamente' : 'Variante creada correctamente',
        { type: 'success' },
      );

      setVarianteFormOpen(false);
      setEditingVariante(null);
      await loadVariantes();
    } catch (err) {
      console.error('Error saving variante:', err);
      toast(friendlyError(err, 'Error al guardar variante'), { type: 'error' });
    } finally {
      setSavingVariante(false);
    }
  };

  const handleToggleVarianteActivo = async (v: ProductoVariante) => {
    if (!v.id) return;
    try {
      const res = await apiFetch(`/api/variantes/${v.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ activo: !v.activo }),
      });
      if (!res.ok) {
        const errData = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(errData?.message || 'No se pudo cambiar el estado');
      }
      toast(v.activo ? 'Variante desactivada' : 'Variante activada', { type: 'success' });
      await loadVariantes();
    } catch (err) {
      toast(friendlyError(err, 'Error al cambiar estado de variante'), { type: 'error' });
    }
  };

  const handleDeleteVariante = async (v: ProductoVariante) => {
    if (!v.id) return;
    try {
      const res = await apiFetch(`/api/variantes/${v.id}?hard=true`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(errData?.message || 'No se pudo eliminar la variante');
      }
      toast('Variante eliminada', { type: 'success' });
      await loadVariantes();
    } catch (err) {
      toast(friendlyError(err, 'Error al eliminar variante'), { type: 'error' });
    }
  };

  const fotos = watch('fotos') || [];
  const visible = watch('visible');
  const nombre = watch('nombre');
  const precio = watch('precio');
  const stock = watch('stock');
  const currencyDef = getCurrencyDefinition();
  const tiendaUrl = getUrlTienda();
  const tiendaHost = (() => {
    try {
      return new URL(tiendaUrl).host;
    } catch {
      return 'obrerayzangano.cl';
    }
  })();

  // Taxonomías gestionables (Mercado → Taxonomías).
  // Fallback a los DEFAULT_* mientras carga o si la tabla aún no existe.
  const { data: taxonomies } = useProductTaxonomies();
  const formatOptions = taxonomies?.formats ?? DEFAULT_PRODUCT_FORMATS;
  const categoryOptions = taxonomies?.categories ?? DEFAULT_PRODUCT_CATEGORIES;
  const sensoryFamilyOptions = taxonomies?.sensoryFamilies ?? DEFAULT_SENSORY_FAMILIES;

  // Al editar un producto cuyo valor ya no está activo (desactivado/renombrado
  // en el panel), se agrega como opción para no perder el valor guardado.
  const formatoActual = watch('formato');
  const categoriaActual = watch('categoria');
  const tipoSensorialActual = watch('tipo_sensorial') || 'miel';
  const pesoNeto = watch('peso_neto_g');
  const loteIdActual = watch('lote_id');
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
  const sensoryFamilyOptionsForSelect = sensoryFamilyOptions.some((s) => s.value === tipoSensorialActual)
    ? sensoryFamilyOptions
    : tipoSensorialActual
      ? [...sensoryFamilyOptions, { value: tipoSensorialActual, label: tipoSensorialActual, description: '' }]
      : sensoryFamilyOptions;

  const matchedFormat = formatOptionsForSelect.find((f) => f.value === formatoActual);
  const loteSeleccionado = lotes.find((l) => l.id === loteIdActual);

  const handleFormatoChange = (nuevoFormato: string) => {
    setValue('formato', nuevoFormato, { shouldValidate: true, shouldDirty: true });
    const opt = formatOptionsForSelect.find((f) => f.value === nuevoFormato);
    const gramajeSugerido = opt?.peso_neto_g ?? extractGramajeFromFormato(nuevoFormato);
    if (typeof gramajeSugerido === 'number' && gramajeSugerido > 0) {
      setValue('peso_neto_g', gramajeSugerido, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxBytes = 50 * 1024 * 1024; // 50MB

    const validFiles = Array.from(files).filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast(`El archivo ${file.name} no es una imagen válida`, { type: 'error' });
        return false;
      }
      if (file.size > maxBytes) {
        toast(`El archivo ${file.name} supera el tamaño máximo (50MB)`, { type: 'error' });
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

        let finalSlug = data.slug?.trim() ? slugify(data.slug) : slugify(data.nombre);
        if (!finalSlug) {
          setError('slug', { type: 'manual', message: 'El producto debe tener un nombre o slug válido' });
          toast('El producto debe tener un nombre o slug válido', { type: 'error' });
          return;
        }

        // Ensure slug uniqueness
        let { data: existingProd } = await supabase
          .from('productos')
          .select('id, nombre')
          .eq('slug', finalSlug)
          .maybeSingle();

        // Si no se especificó un slug manual y el generado choca con otro producto,
        // intentar con formato (ej: crema-de-miel-250g) antes de arrojar error.
        if (existingProd && existingProd.id !== initialData?.id && !data.slug?.trim() && data.formato?.trim()) {
          const fallbackWithFormat = `${finalSlug}-${slugify(data.formato)}`;
          const { data: existingWithFormat } = await supabase
            .from('productos')
            .select('id')
            .eq('slug', fallbackWithFormat)
            .maybeSingle();

          if (!existingWithFormat || existingWithFormat.id === initialData?.id) {
            finalSlug = fallbackWithFormat;
            existingProd = null;
          }
        }

        if (existingProd && existingProd.id !== initialData?.id) {
          const hint = data.formato ? `${finalSlug}-${slugify(data.formato)}` : `${finalSlug}-2`;
          setError('slug', {
            type: 'manual',
            message: `El slug "${finalSlug}" ya está en uso por "${existingProd.nombre || 'otro producto'}". Elige uno distinto (ej: ${hint}).`,
          });
          toast(`El slug "${finalSlug}" ya está en uso por otro producto.`, { type: 'error' });
          return;
        }

        // Sincronizar métricas territoriales de impacto a partir del peso neto en gramos
        // (Alimentan el trigger trigger_compute_footprint en public.ventas)
        const pesoKg = (Number(data.peso_neto_g) || 0) / 1000;
        const payload: Record<string, unknown> = {
          ...data,
          slug: finalSlug,
          lote_id: data.lote_id && String(data.lote_id).trim() ? String(data.lote_id).trim() : null,
          video_url: data.video_url && String(data.video_url).trim() ? String(data.video_url).trim() : null,
          co2_evitado_kg: Number(data.peso_neto_g) > 0 ? Number((pesoKg * 2.4).toFixed(2)) : null,
          sustituye_azucar_g: Number(data.peso_neto_g) > 0 ? Number(data.peso_neto_g) : null,
          updated_at: new Date().toISOString(),
        };

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

  const onFormError = (formErrors: Record<string, unknown>) => {
    console.warn('[ProductForm] Validation errors:', formErrors);
    const errKeys = Object.keys(formErrors);
    if (errKeys.length > 0) {
      const firstKey = errKeys[0];
      const firstErr = formErrors[firstKey] as { message?: string } | undefined;
      const message = firstErr?.message ? String(firstErr.message) : `Campo incompleto o inválido: ${firstKey}`;
      toast(message, { type: 'error' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)} className="product-form">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Estado en catálogo:
          </span>
          <button
            type="button"
            onClick={() => setValue('visible', !visible)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
              visible
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15'
                : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted/60'
            }`}
            title={visible ? 'Visible en tienda' : 'Oculto en tienda'}
          >
            {visible ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>{visible ? 'Visible' : 'Oculto'}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
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
                className="input-field px-2 py-1 w-[200px]"
                onBlur={(e) => {
                  if (!e.target.value && nombre) {
                    setValue('slug', slugify(nombre));
                    clearErrors('slug');
                  }
                }}
              />
              <span className="text-[0.7rem] text-muted-foreground">
                {tiendaHost}/producto/
              </span>
            </div>
            {errors.slug && <span className="text-xs text-destructive">{errors.slug.message}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Descripción Regenerativa *
            </label>
            <textarea
              {...register('descripcion_regenerativa')}
              placeholder="Cuenta la historia de este producto: origen, impacto regenerativo, árboles plantados..."
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

          <div className="flex flex-col gap-2 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span>Escuela de Venta: Pitch Consultivo & Argumentario (Campo POS)</span>
              </label>
              <span className="text-[10px] font-mono text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full">
                Sincronización POS
              </span>
            </div>
            <input
              {...register('descripcion_corta')}
              type="text"
              placeholder="Pitch de 2 frases para tarjetas y Escuela de Venta en Campo POS"
              className="input-field text-[0.9rem] p-4 bg-background"
            />
            <span className="text-[0.7rem] text-muted-foreground">
              Alimenta directamente la <strong>Guía de Cata y Escuela de Venta</strong> en Campo POS. Brinda al equipo de venta las frases maestras para transmitir el valor de origen y la maestría territorial ante clientes exigentes.
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
                  {errors.video_url?.message && (
                    <span className="text-xs text-destructive">{String(errors.video_url.message)}</span>
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
                    Lugar específico de recolección (opcional si ya está en descripción)
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

          {/* Perfil Sensorial & Organoléptico Canónico */}
          <div className="border border-border rounded-md overflow-hidden bg-foreground/[0.01] mt-2">
            <button
              type="button"
              onClick={() => setShowSensorial(!showSensorial)}
              className="w-full flex items-center justify-between p-4 text-sm font-medium text-foreground hover:bg-foreground/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-primary" />
                <span>Perfil Sensorial & Organoléptico (Cata de Origen)</span>
              </div>
              {showSensorial ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showSensorial && (
              <div className="p-5 border-t border-border flex flex-col gap-6 bg-surface-sunken/30">
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-start gap-2.5">
                  <Info size={16} className="text-primary shrink-0 mt-0.5" />
                  <span>
                    Estos valores calibran la ficha sensorial canónica del producto. Se exhiben públicamente en el PDP de la tienda y en la Escuela de Venta de Campo POS.
                  </span>
                </div>

                {/* Selector de Familia Sensorial de Cata */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                      Familia Sensorial de Cata & Reseñas
                    </label>
                    <a
                      href="/catalogo/taxonomias"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[0.68rem] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 underline-offset-2 hover:underline"
                      title="Gestionar familias sensoriales en Núcleo"
                    >
                      Gestionar familias <ExternalLink size={10} />
                    </a>
                  </div>
                  {errors.tipo_sensorial && (
                    <span className="text-xs text-destructive font-medium block">
                      {errors.tipo_sensorial.message}
                    </span>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {sensoryFamilyOptionsForSelect.map((cat) => {
                      const isSelected = tipoSensorialActual === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setValue('tipo_sensorial', cat.value, { shouldDirty: true, shouldValidate: true })}
                          className={`p-2.5 rounded-lg border text-left transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40'
                              : 'border-border/60 bg-card hover:border-border text-muted-foreground'
                          }`}
                        >
                          <p className="text-xs font-bold text-foreground">{cat.label}</p>
                          {cat.description ? <p className="text-[10px] text-muted-foreground mt-0.5">{cat.description}</p> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Métricas Organolépticas de Cata adaptativas */}
                {(() => {
                  const currentTipo = (watch('tipo_sensorial') || 'miel') as CategoriaSensorial;
                  const pairs = PARES_SEMANTICOS_POR_CATEGORIA[currentTipo] || PARES_SEMANTICOS_POR_CATEGORIA.miel;
                  return (
                    <div className="space-y-5">
                      {/* Dimensión 1 */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-muted-foreground">{pairs[0]?.izq ?? 'Suave'}</span>
                          <span className="text-foreground font-bold">
                            {pairs[0]?.par ?? 'Intensidad'}: {perfilSensorial.intensidad ?? 75}%
                          </span>
                          <span className="text-muted-foreground">{pairs[0]?.der ?? 'Intenso'}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={perfilSensorial.intensidad ?? 75}
                          onChange={(e) =>
                            setValue('perfil_sensorial.intensidad', Number(e.target.value), {
                              shouldDirty: true,
                            })
                          }
                          className="w-full accent-primary h-2 bg-border rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Dimensión 2 */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-muted-foreground">{pairs[1]?.izq ?? 'Equilibrado'}</span>
                          <span className="text-foreground font-bold">
                            {pairs[1]?.par ?? 'Balance'}: {perfilSensorial.dulzor_acidez ?? 60}%
                          </span>
                          <span className="text-muted-foreground">{pairs[1]?.der ?? 'Marcado'}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={perfilSensorial.dulzor_acidez ?? 60}
                          onChange={(e) =>
                            setValue('perfil_sensorial.dulzor_acidez', Number(e.target.value), {
                              shouldDirty: true,
                            })
                          }
                          className="w-full accent-primary h-2 bg-border rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Dimensión 3 */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-muted-foreground">{pairs[2]?.izq ?? 'Fluido'}</span>
                          <span className="text-foreground font-bold">
                            {pairs[2]?.par ?? 'Textura'}: {perfilSensorial.textura ?? 85}%
                          </span>
                          <span className="text-muted-foreground">{pairs[2]?.der ?? 'Denso'}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={perfilSensorial.textura ?? 85}
                          onChange={(e) =>
                            setValue('perfil_sensorial.textura', Number(e.target.value), {
                              shouldDirty: true,
                            })
                          }
                          className="w-full accent-primary h-2 bg-border rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Notas Aromáticas & Chips */}
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                    Notas Organolépticas & Aromas Dominantes
                  </label>

                  {/* Chips seleccionados */}
                  <div className="flex flex-wrap gap-1.5 min-h-8 p-2 rounded-lg bg-card border border-border">
                    {(perfilSensorial.notas_aromaticas || []).length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">
                        Sin notas asignadas. Selecciona del catálogo abajo o escribe una nueva.
                      </span>
                    ) : (
                      perfilSensorial.notas_aromaticas.map((nota) => (
                        <span
                          key={nota}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 border border-primary/30 text-primary"
                        >
                          {nota}
                          <button
                            type="button"
                            onClick={() => removeNotaAromatica(nota)}
                            className="hover:text-destructive transition-colors ml-0.5"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Input nota personalizada */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCustomNota}
                      onChange={(e) => setNewCustomNota(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomNota();
                        }
                      }}
                      placeholder="Agregar nota personalizada (ej. Caramelo Crudo)"
                      className="input-field p-2.5 flex-1"
                    />
                    <button
                      type="button"
                      onClick={addCustomNota}
                      className="px-3 py-2 bg-surface-raised border border-border text-xs font-semibold rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Sugerencias de perc_chip_catalogos */}
                  {availableChips.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        Sugerencias del Catálogo de Cata:
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {availableChips.map((chip) => {
                          const isSelected = (perfilSensorial.notas_aromaticas || []).includes(chip);
                          return (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => toggleNotaAromatica(chip)}
                              className={`px-2 py-0.5 rounded-full text-[11px] transition-all ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground font-semibold'
                                  : 'bg-card border border-border/70 text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {chip}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Maridajes Recomendados */}
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <UtensilsCrossed size={14} className="text-primary" />
                    <span>Maridajes Recomendados & Sugerencias de Consumo</span>
                  </label>

                  {/* Lista de maridajes */}
                  <div className="space-y-2">
                    {(perfilSensorial.maridajes || []).map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between p-2.5 rounded-lg bg-card border border-border text-xs gap-3"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground">{m.titulo}</p>
                          <p className="text-muted-foreground">{m.detalle}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMaridaje(idx)}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Formulario nuevo maridaje */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newMaridajeTitulo}
                      onChange={(e) => setNewMaridajeTitulo(e.target.value)}
                      placeholder="Elemento (ej. Quesos Azules)"
                      className="input-field p-2.5"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMaridajeDetalle}
                        onChange={(e) => setNewMaridajeDetalle(e.target.value)}
                        placeholder="Detalle (ej. Contraste salino intenso)"
                        className="input-field p-2.5 flex-1"
                      />
                      <button
                        type="button"
                        onClick={addMaridaje}
                        className="px-3 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                        title="Añadir maridaje"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Momento de Consumo */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                    Momento de Consumo Sugerido
                  </label>
                  <input
                    type="text"
                    value={perfilSensorial.momento_consumo || ''}
                    onChange={(e) =>
                      setValue('perfil_sensorial.momento_consumo', e.target.value, {
                        shouldDirty: true,
                      })
                    }
                    placeholder="ej. Desayuno gourmet, cata con quesos de autor, pre-entreno natural"
                    className="input-field p-2.5"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Variantes & Fortificaciones de Producto */}
          <div className="border border-border rounded-md overflow-hidden bg-foreground/[0.01] mt-2">
            <button
              type="button"
              onClick={() => setShowVariantes(!showVariantes)}
              className="w-full flex items-center justify-between p-4 text-sm font-medium text-foreground hover:bg-foreground/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <span>Variantes & Fortificaciones de Producto</span>
                {variantes.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    {variantes.length} {variantes.length === 1 ? 'variante' : 'variantes'}
                  </span>
                )}
              </div>
              {showVariantes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showVariantes && (
              <div className="p-5 border-t border-border flex flex-col gap-4 bg-surface-sunken/30">
                {!initialData?.id ? (
                  <div className="p-4 rounded-lg bg-card border border-border text-center space-y-2">
                    <Package className="w-8 h-8 text-muted-foreground mx-auto stroke-[1.5]" />
                    <p className="text-xs text-muted-foreground">
                      Guarda el producto base por primera vez para habilitar la calibración de variantes y fortificaciones específicas.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Catálogo de Variantes & Fortificaciones
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Variaciones de peso, infusiones botánicas o packs calibrados para catas y reseñas.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={openNewVarianteForm}
                        className="inline-flex items-center gap-1.5 text-xs"
                      >
                        <Plus size={14} /> Nueva Variante
                      </Button>
                    </div>

                    {/* Formulario Inline de Variante (Creación / Edición) */}
                    {varianteFormOpen && (
                      <div className="p-4 rounded-xl border border-primary/30 bg-card space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                            <Sparkles size={13} />
                            {editingVariante ? 'Editar Variante' : 'Nueva Variante / Fortificación'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVarianteFormOpen(false)}
                            className="text-muted-foreground hover:text-foreground text-xs"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="font-semibold text-foreground block mb-1">SKU Identificador *</label>
                            <input
                              type="text"
                              value={varianteSku}
                              onChange={(e) => setVarianteSku(e.target.value.toUpperCase())}
                              placeholder="ej. CREMA-POLEN-250G"
                              className="input-field p-2 font-mono text-xs w-full"
                            />
                          </div>

                          <div>
                            <label className="font-semibold text-foreground block mb-1">Nombre Descriptivo *</label>
                            <input
                              type="text"
                              value={varianteNombre}
                              onChange={(e) => setVarianteNombre(e.target.value)}
                              placeholder="ej. Crema con Polen Floral (250g)"
                              className="input-field p-2 text-xs w-full"
                            />
                          </div>

                          <div>
                            <label className="font-semibold text-foreground block mb-1">Tipo de Variante</label>
                            <select
                              value={varianteTipo}
                              onChange={(e) => setVarianteTipo(e.target.value as 'formato' | 'fortificacion' | 'edicion_especial' | 'pack')}
                              className="input-field p-2 text-xs w-full"
                            >
                              <option value="fortificacion">Fortificación / Inclusión Botánica</option>
                              <option value="formato">Formato / Volumen (Gramaje)</option>
                              <option value="edicion_especial">Edición Especial</option>
                              <option value="pack">Pack / Degustación</option>
                            </select>
                          </div>

                          {varianteTipo === 'fortificacion' && (
                            <div>
                              <label className="font-semibold text-foreground block mb-1">Ingrediente Fortificante</label>
                              <select
                                value={varianteFortificante}
                                onChange={(e) => setVarianteFortificante(e.target.value as FortificanteCanonico)}
                                className="input-field p-2 text-xs w-full"
                              >
                                {FORTIFICANTES_CANONICOS.map((f) => (
                                  <option key={f} value={f}>
                                    {FORTIFICANTES_LABELS[f]}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="font-semibold text-foreground block mb-1">Peso Neto (g)</label>
                            <input
                              type="number"
                              value={variantePeso}
                              onChange={(e) => setVariantePeso(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="250"
                              className="input-field p-2 text-xs w-full"
                            />
                          </div>

                          <div>
                            <label className="font-semibold text-foreground block mb-1">
                              Precio de Venta Override (CLP, opcional)
                            </label>
                            <input
                              type="number"
                              value={variantePrecio}
                              onChange={(e) => setVariantePrecio(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder={`Hereda precio base: ${formatMoney(watch('precio') || 0)}`}
                              className="input-field p-2 text-xs w-full"
                            />
                          </div>

                          <div>
                            <label className="font-semibold text-foreground block mb-1">Stock Disponible (u.)</label>
                            <input
                              type="number"
                              value={varianteStock}
                              onChange={(e) => setVarianteStock(e.target.value === '' ? 0 : Number(e.target.value))}
                              placeholder="0"
                              className="input-field p-2 text-xs w-full"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                          <button
                            type="button"
                            onClick={() => setVarianteFormOpen(false)}
                            className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground"
                          >
                            Cancelar
                          </button>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={savingVariante}
                            onClick={handleSaveVariante}
                            className="text-xs"
                          >
                            {savingVariante ? 'Guardando...' : editingVariante ? 'Actualizar Variante' : 'Crear Variante'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Lista de Variantes Existentes */}
                    {loadingVariantes ? (
                      <p className="text-xs text-muted-foreground italic py-3 text-center">Cargando variantes...</p>
                    ) : variantes.length === 0 ? (
                      <div className="p-4 rounded-lg bg-card/60 border border-border/80 text-center space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Este producto no tiene variantes o fortificaciones registradas aún.
                        </p>
                        <p className="text-[11px] text-muted-foreground/70">
                          Se evaluará como producto canónico en catas y reseñas.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {variantes.map((v) => (
                          <div
                            key={v.id}
                            className={`p-3 rounded-lg border transition-all flex flex-wrap items-center justify-between gap-3 ${
                              v.activo
                                ? 'bg-card border-border/80'
                                : 'bg-muted/30 border-border/40 opacity-60'
                            }`}
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-xs text-foreground">
                                  {v.nombre_variante}
                                </span>
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                                  {v.sku}
                                </span>
                                {v.ingrediente_fortificante && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                    ✦ {FORTIFICANTES_LABELS[v.ingrediente_fortificante as FortificanteCanonico] ?? v.ingrediente_fortificante}
                                  </span>
                                )}
                                {!v.activo && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
                                    Inactiva
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                {v.peso_neto_g != null && <span>{v.peso_neto_g}g</span>}
                                <span>
                                  Precio:{' '}
                                  <strong className="text-foreground">
                                    {v.precio_override != null ? formatMoney(v.precio_override) : `Hereda (${formatMoney(watch('precio') || 0)})`}
                                  </strong>
                                </span>
                                <span>
                                  Stock: <strong className="text-foreground">{v.stock ?? 0} u.</strong>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleVarianteActivo(v)}
                                title={v.activo ? 'Desactivar variante' : 'Activar variante'}
                                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground text-xs"
                              >
                                {v.activo ? <Eye size={14} /> : <EyeOff size={14} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditVarianteForm(v)}
                                title="Editar variante"
                                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary text-xs"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVariante(v)}
                                title="Eliminar variante"
                                className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Canales y Destinos de Publicación */}
          <div className="p-5 bg-foreground/[0.02] rounded-xl border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Compass size={16} className="text-primary" />
                Canales de Publicación
              </h3>
              <span className="text-[0.65rem] text-muted-foreground uppercase tracking-wider font-semibold">
                {channels.length} {channels.length === 1 ? 'canal' : 'canales'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Define en qué aplicaciones y superficies comerciales estará visible este producto.
            </p>
            <div className="space-y-2 pt-1">
              {PRODUCT_CHANNELS.map((ch) => {
                const isChecked = channels.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                      isChecked
                        ? 'border-primary/60 bg-primary/10 text-foreground'
                        : 'border-border/60 bg-surface-raised/30 text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                        isChecked
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border/80 bg-background'
                      }`}
                    >
                      {isChecked && <CheckCircle2 size={11} strokeWidth={3} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <span>{ch.label}</span>
                        <span className="text-[0.65rem] font-normal px-1 rounded bg-muted/60 text-muted-foreground">
                          {ch.badge}
                        </span>
                      </div>
                      <div className="text-[0.68rem] text-muted-foreground mt-0.5 leading-tight">
                        {ch.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 bg-foreground/[0.02] rounded-md border border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Organización
            </h3>

            <div className="mb-4">
              <label className="text-[0.8rem] font-medium text-foreground block mb-1.5">
                Formato *
              </label>
              <select
                value={formatoActual}
                onChange={(e) => handleFormatoChange(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Seleccionar formato</option>
                {formatOptionsForSelect.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              {errors.formato && <span className="text-xs text-destructive">{errors.formato.message}</span>}

              <div className="mt-1.5 flex items-center justify-between text-[0.7rem]">
                {matchedFormat?.peso_neto_g || extractGramajeFromFormato(formatoActual) ? (
                  <span className="text-primary flex items-center gap-1 font-mono">
                    <Scale size={11} /> Gramaje base: {matchedFormat?.peso_neto_g ?? extractGramajeFromFormato(formatoActual)}g
                  </span>
                ) : (
                  <span className="text-muted-foreground">Formato personalizado</span>
                )}
                <a
                  href="/catalogo/taxonomias"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 underline-offset-2 hover:underline"
                  title="Editar formatos y gramajes base en Núcleo"
                >
                  Gestionar formatos <ExternalLink size={10} />
                </a>
              </div>
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
              <div className="mt-2">
                <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground block mb-1">
                  Sugerencias canónicas:
                </span>
                <div className="flex flex-wrap gap-1">
                  {PRODUCT_TAGS.filter((t) => !(watch('tags') || []).includes(t)).slice(0, 6).map((suggestedTag) => (
                    <button
                      key={suggestedTag}
                      type="button"
                      onClick={() => addTag(suggestedTag)}
                      className="text-[0.65rem] px-1.5 py-0.5 rounded border border-border/60 bg-foreground/[0.02] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
                    >
                      + {suggestedTag}
                    </button>
                  ))}
                </div>
              </div>
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
              <div className="flex items-center justify-between text-[0.65rem] text-muted-foreground mt-1.5">
                <span>Escribe sólo números ({currencyDef.label}).</span>
                {precio && precio > 0 ? (
                  <span className="font-mono text-foreground/80">
                    IVA 19% incl. (Neto: {formatMoney(Math.round(precio / 1.19))})
                  </span>
                ) : null}
              </div>
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
                  Para sumar stock de producción usa “Cargar stock” en la lista.
                </p>
                {errors.stock && (
                  <span className="text-xs text-destructive">{errors.stock.message}</span>
                )}
              </div>
            ) : (
              <>
                <input type="hidden" {...register('stock')} />
                <p className="mb-4 text-xs text-muted-foreground rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                  <a
                    href="/produccion/inventario"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-2 hover:underline inline-flex items-center gap-1"
                  >
                    Cargar o reponer stock <ExternalLink size={10} />
                  </a>
                </p>
              </>
            )}

            {/* Panel de Trazabilidad de Origen & Deducción de Granel */}
            <div className="mt-4 pt-4 border-t border-border/60 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Layers size={14} className="text-primary" />
                  Trazabilidad & Granel
                </h4>
                {loteSeleccionado && Number(pesoNeto) > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[0.65rem] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} /> Sincronización activa
                  </span>
                ) : (
                  <span className="text-[0.65rem] text-muted-foreground">
                    {loteSeleccionado ? 'Falta peso neto' : 'Sin deducción de lote'}
                  </span>
                )}
              </div>

              <div>
                <label className="text-[0.8rem] font-medium text-foreground block mb-1 flex items-center justify-between">
                  <span>Lote de Floración y Bodega</span>
                  <a
                    href="/produccion/lotes"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[0.65rem] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    Ver bodega <ExternalLink size={10} />
                  </a>
                </label>
                <select {...register('lote_id')} className="input-field w-full text-xs">
                  <option value="">Sin lote asignado (accesorios, cofres, packs)</option>
                  {lotes.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nombre_lote || (l.blockchain_hash ? `Hash: ${l.blockchain_hash.slice(0, 8)}...` : `Lote: ${l.id.slice(0, 8)}`)}
                      {l.variedad_floral ? ` · ${l.variedad_floral}` : ''}
                      {typeof l.kg_total === 'number' ? ` (${l.kg_total.toFixed(1)} kg disp.)` : ''}
                      {l.publico ? ' [Público]' : ' [Privado]'}
                    </option>
                  ))}
                </select>
                {loteSeleccionado && !loteSeleccionado.publico && (
                  <div className="mt-2 rounded-lg border border-warning/30 bg-warning/5 p-2 flex items-start gap-1.5 text-[0.68rem] text-warning">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    <span>
                      Este lote está configurado como <strong>privado</strong> en bodega. Para que el pasaporte digital y el QR de la tienda se puedan consultar públicamente, cámbialo a público en{' '}
                      <a href="/produccion/lotes" target="_blank" rel="noreferrer" className="text-warning font-semibold underline">
                        Producción → Lotes
                      </a>.
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[0.8rem] font-medium text-foreground block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Scale size={13} className="text-primary" />
                    Peso Neto (g)
                  </span>
                  {Number(pesoNeto) > 0 && (
                    <span className="text-[0.65rem] font-mono text-primary">
                      = {(Number(pesoNeto) / 1000).toFixed(3)} kg / unidad
                    </span>
                  )}
                </label>
                <input
                  {...register('peso_neto_g')}
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Ej: 250 (se auto-asigna del formato)"
                  className="input-field text-sm p-3"
                />
              </div>

              {/* Panel de Trazabilidad Nutricional y Operativa */}
              {loteSeleccionado && Number(pesoNeto) > 0 ? (
                <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[0.7rem] text-foreground font-medium">
                    <span>Deducción de lote granel por unidad vendida:</span>
                    <span className="font-mono text-primary font-semibold">
                      -{(Number(pesoNeto) / 1000).toFixed(3)} kg de miel
                    </span>
                  </div>
                  <p className="text-[0.68rem] text-muted-foreground leading-relaxed">
                    Al registrarse una venta o rebaja de inventario de este producto (en tienda online o feria), el sistema descontará automáticamente este peso en kg de los <strong>{loteSeleccionado.kg_total?.toFixed(1) ?? '0'} kg</strong> disponibles en bodega.
                  </p>
                  {typeof loteSeleccionado.kg_total === 'number' && loteSeleccionado.kg_total > 0 && (
                    <div className="pt-1.5 border-t border-primary/20 flex items-center justify-between text-[0.65rem] text-muted-foreground">
                      <span>Rendimiento teórico disponible:</span>
                      <span className="font-mono text-foreground font-semibold">
                        ~{Math.floor(loteSeleccionado.kg_total / (Number(pesoNeto) / 1000))} frascos potenciales
                      </span>
                    </div>
                  )}
                </div>
              ) : loteSeleccionado && (!pesoNeto || Number(pesoNeto) <= 0) ? (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-2.5 flex items-start gap-2 text-xs text-warning">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <p className="text-[0.68rem] leading-snug">
                    El producto tiene lote asignado pero su <strong>Peso Neto</strong> es 0g. No se podrán descontar kg de miel a granel automáticamente al registrar ventas.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-border/50 bg-foreground/[0.02] p-2.5 flex items-start gap-2 text-xs text-muted-foreground">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <p className="text-[0.68rem] leading-snug">
                    <strong>Sin deducción de lote granel:</strong> Válido para cofres de regalo, accesorios o productos sin extracción directa de miel a granel. No descuenta kg en bodega apícola.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-border flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : initialData?.id ? 'Actualizar Ficha' : 'Crear Producto'}
        </Button>
      </div>
    </form>
  );
}
