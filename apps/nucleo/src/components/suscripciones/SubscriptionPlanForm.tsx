'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, useWatch, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Input,
  Textarea,
  Button,
  Label,
  Switch,
  Select,
  Badge,
  toast,
  cn,
} from '@enjambre/ui';
import {
  Plus,
  Trash2,
  CheckCircle2,
  CreditCard,
  Eye,
  Layers,
  ChevronDown,
  Globe,
  Radio,
  Store,
  Compass,
  MapPin,
  Lock,
  Tag,
  Truck,
  FileCheck2,
} from 'lucide-react';

export type PlanCategory = 'reposicion' | 'cosecha' | 'territorial' | 'pos_campo' | 'corporativo';
export type PlanChannel = 'tienda_despensa' | 'tienda_club' | 'nucleo_territorial' | 'campo_pos' | 'privado';

export const CATEGORY_CONFIG: Record<
  PlanCategory,
  { label: string; description: string; defaultChannels: PlanChannel[]; isDigitalDefault: boolean }
> = {
  reposicion: {
    label: 'Reposición Continua (Despensa)',
    description: 'Entregas periódicas de miel y productos para consumo habitual.',
    defaultChannels: ['tienda_despensa'],
    isDigitalDefault: false,
  },
  cosecha: {
    label: 'Recolección Estacional',
    description: 'Ediciones y reservas exclusivas por floración botánica anual.',
    defaultChannels: ['tienda_club'],
    isDigitalDefault: false,
  },
  territorial: {
    label: 'Registro Territorial Apícola',
    description: 'Servicios de trazabilidad con pasaportes QR y Cuaderno SAG 4590.',
    defaultChannels: ['nucleo_territorial'],
    isDigitalDefault: true,
  },
  pos_campo: {
    label: 'Puntos de Venta & Ferias',
    description: 'Planes presenciales comercializados por revendedores en ferias.',
    defaultChannels: ['campo_pos'],
    isDigitalDefault: false,
  },
  corporativo: {
    label: 'Privado / Convenio B2B',
    description: 'Acceso reservado para aliados institucionales mediante enlace directo.',
    defaultChannels: ['privado'],
    isDigitalDefault: false,
  },
};

export const CHANNEL_CONFIG: Record<
  PlanChannel,
  { label: string; surface: string; description: string; badge: string }
> = {
  tienda_despensa: {
    label: 'Tienda · Ficha de Producto (PDP)',
    surface: 'Tienda Online',
    description: 'Opción "Programar Reposición" en páginas de productos de consumo.',
    badge: 'Tienda PDP',
  },
  tienda_club: {
    label: 'Tienda · Club Legado del Bosque',
    surface: 'Tienda Online',
    description: 'Catálogo de recolecciones por floración en /club-legado-del-bosque.',
    badge: 'Club Legado',
  },
  nucleo_territorial: {
    label: 'Núcleo · Portal Territorial Apícola',
    surface: 'Núcleo Territorial',
    description: 'Catálogo de planes para apicultores en /planes-territoriales.',
    badge: 'Portal Territorial',
  },
  campo_pos: {
    label: 'Campo · Caja de Feria (POS)',
    surface: 'Campo PWA',
    description: 'Disponible para representantes de venta en punto de atención.',
    badge: 'Campo POS',
  },
  privado: {
    label: 'Privado / Solo Enlace Directo',
    surface: 'Acceso Privado',
    description: 'Oculto de vitrinas públicas; solo contratable vía enlace privado.',
    badge: 'Enlace Privado',
  },
};

export const FLORACION_OPTIONS = [
  { value: 'ulmo', label: 'Ulmo (Eucryphia cordifolia)' },
  { value: 'tiaca', label: 'Tiaca (Caldcluvia paniculata)' },
  { value: 'quillay', label: 'Quillay (Quillaja saponaria)' },
  { value: 'multifloral', label: 'Multifloral Nativa del Bosque' },
];

export const FREQUENCY_CONFIG: Record<
  string,
  { label: string; periodUnit: string; hint: string }
> = {
  monthly: {
    label: 'Mensual',
    periodUnit: 'mes',
    hint: 'Facturación recurrente cada 30 días',
  },
  quarterly: {
    label: 'Trimestral',
    periodUnit: 'trimestre',
    hint: 'Facturación recurrente cada 3 meses',
  },
  annual: {
    label: 'Anual',
    periodUnit: 'año',
    hint: 'Facturación recurrente cada 12 meses',
  },
  season: {
    label: 'Por Temporada (Recolección)',
    periodUnit: 'temporada',
    hint: 'Cobro único por ciclo anual de floración y recolección',
  },
};

export const FREQUENCY_SELECT_OPTIONS = [
  { value: 'monthly', label: 'Mensual (cada 30 días)' },
  { value: 'quarterly', label: 'Trimestral (cada 3 meses)' },
  { value: 'annual', label: 'Anual (cada 12 meses)' },
  { value: 'season', label: 'Por Temporada / Recolección (anual)' },
];

export const CATEGORY_SELECT_OPTIONS = [
  { value: 'reposicion', label: 'Reposición Continua (Despensa)' },
  { value: 'cosecha', label: 'Recolección Estacional (Club Legado)' },
  { value: 'territorial', label: 'Registro Territorial Apícola' },
  { value: 'pos_campo', label: 'Puntos de Venta & Ferias' },
  { value: 'corporativo', label: 'Privado / Convenio B2B' },
];

export function extractBenefitLabel(item: unknown): string {
  if (typeof item === 'string') return item.trim();
  if (!item || typeof item !== 'object') return '';

  const obj = item as Record<string, unknown>;

  if (typeof obj.note === 'string' && obj.note.trim()) return obj.note.trim();
  if (typeof obj.title === 'string' && obj.title.trim()) return obj.title.trim();
  if (typeof obj.label === 'string' && obj.label.trim()) return obj.label.trim();
  if (typeof obj.name === 'string' && obj.name.trim()) return obj.name.trim();

  if (obj.type === 'floracion' && typeof obj.value === 'string') {
    const val = obj.value.trim();
    return `Floración selecta de ${val.charAt(0).toUpperCase() + val.slice(1)}`;
  }

  if (typeof obj.feature === 'string') {
    const FEATURE_MAP: Record<string, string> = {
      pasaportes_qr_ilimitados: 'Pasaportes QR ilimitados por lote',
      estadisticas_escaneos: 'Estadísticas y analítica de escaneos',
      cuaderno_campo_res_4590: 'Cuaderno de campo digital (Res. SAG 4590/2025)',
      georreferenciacion_apiarios: 'Georreferenciación de apiarios y colmenas',
      certificados_origen: 'Certificados oficiales de origen botánico',
    };
    if (FEATURE_MAP[obj.feature]) return FEATURE_MAP[obj.feature];
    return obj.feature
      .replace(/[_-]+/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  if (typeof obj.value === 'string' && obj.value.trim()) return obj.value.trim();

  return '';
}

export function normalizeIncludedItems(items: unknown): Array<{ value: string }> {
  if (!Array.isArray(items) || items.length === 0) {
    return [{ value: '' }];
  }

  const normalized = items
    .map((item) => {
      const text = extractBenefitLabel(item);
      return text ? { value: text } : null;
    })
    .filter((item): item is { value: string } => item !== null && item.value.length > 0);

  return normalized.length > 0 ? normalized : [{ value: '' }];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const planSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  key: z.string().min(2, 'El identificador del plan es requerido'),
  description: z.string().nullable().optional(),
  price_clp: z.number().min(0, 'El precio no puede ser negativo'),
  frequency: z.enum(['monthly', 'quarterly', 'annual', 'season']),
  active: z.boolean(),
  category: z.enum(['reposicion', 'cosecha', 'territorial', 'pos_campo', 'corporativo']),
  channels: z
    .array(z.enum(['tienda_despensa', 'tienda_club', 'nucleo_territorial', 'campo_pos', 'privado']))
    .min(1, 'Debes seleccionar al menos un canal de publicación'),
  is_digital: z.boolean(),
  floracion: z.string().optional(),
  badge_label: z.string().optional(),
  destacado: z.boolean().optional(),
  included_items: z
    .array(z.object({ value: z.string() }))
    .min(1, 'Debe incluir al menos un beneficio o entrega'),
});

export type SubscriptionPlanFormData = z.infer<typeof planSchema>;

interface SubscriptionPlanFormProps {
  formId?: string;
  initialData?: SubscriptionPlanFormData;
  isEditing?: boolean;
  onSubmit: (data: SubscriptionPlanFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
  showStandaloneActions?: boolean;
}

export function SubscriptionPlanForm({
  formId = 'subscription-plan-form',
  initialData,
  isEditing = false,
  onSubmit,
  isLoading = false,
  onCancel,
  showStandaloneActions = false,
}: SubscriptionPlanFormProps) {
  const [showAdvancedKey, setShowAdvancedKey] = useState(false);

  const defaultValues: SubscriptionPlanFormData = initialData || {
    name: '',
    key: '',
    description: '',
    price_clp: 0,
    frequency: 'monthly',
    active: true,
    category: 'reposicion',
    channels: ['tienda_despensa'],
    is_digital: false,
    floracion: 'ulmo',
    badge_label: '',
    destacado: false,
    included_items: [{ value: '' }],
  };

  const form = useForm<SubscriptionPlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'included_items',
  });

  // Re-sincronizar valores si initialData cambia tras abrir el modal
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const watchedName = useWatch({ control: form.control, name: 'name' });
  const watchedPrice = useWatch({ control: form.control, name: 'price_clp' });
  const watchedFrequency = useWatch({ control: form.control, name: 'frequency' });
  const watchedDescription = useWatch({ control: form.control, name: 'description' });
  const watchedActive = useWatch({ control: form.control, name: 'active' });
  const watchedCategory = useWatch({ control: form.control, name: 'category' });
  const watchedChannels = useWatch({ control: form.control, name: 'channels' }) || [];
  const watchedIsDigital = useWatch({ control: form.control, name: 'is_digital' });
  const watchedFloracion = useWatch({ control: form.control, name: 'floracion' });
  const watchedBadgeLabel = useWatch({ control: form.control, name: 'badge_label' });
  const watchedDestacado = useWatch({ control: form.control, name: 'destacado' });
  const watchedItems = useWatch({ control: form.control, name: 'included_items' });

  // Autogenerar key a partir del nombre comercial si se trata de un nuevo plan
  useEffect(() => {
    if (!isEditing && watchedName && !form.formState.dirtyFields.key) {
      const generated = slugify(watchedName);
      form.setValue('key', generated, { shouldValidate: false });
    }
  }, [watchedName, isEditing, form]);

  // Al cambiar de categoría en modo creación, sugerir canales y naturaleza de entrega
  const handleCategoryChange = (newCat: PlanCategory) => {
    form.setValue('category', newCat, { shouldValidate: true });
    if (!isEditing) {
      const cfg = CATEGORY_CONFIG[newCat];
      if (cfg) {
        form.setValue('channels', cfg.defaultChannels, { shouldValidate: true });
        form.setValue('is_digital', cfg.isDigitalDefault, { shouldValidate: true });
      }
    }
  };

  const toggleChannel = (channel: PlanChannel) => {
    const current = form.getValues('channels') || [];
    const exists = current.includes(channel);
    let next: PlanChannel[];
    if (exists) {
      next = current.filter((c) => c !== channel);
    } else {
      next = [...current, channel];
    }
    form.setValue('channels', next, { shouldValidate: true, shouldDirty: true });
  };

  const handleFormSubmit = async (data: SubscriptionPlanFormData) => {
    try {
      await onSubmit(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al procesar el plan';
      toast.error('Error al guardar el plan', { description: msg });
    }
  };

  const handleFormErrors = (errors: FieldErrors<SubscriptionPlanFormData>) => {
    if (errors.key) {
      setShowAdvancedKey(true);
    }
    if (errors.channels) {
      toast.error('Selecciona al menos un canal de publicación');
    } else if (errors.name) {
      toast.error('El nombre comercial es obligatorio');
    } else {
      toast.error('Revisa los campos del formulario');
    }
  };

  const freqConfig = FREQUENCY_CONFIG[watchedFrequency] || FREQUENCY_CONFIG.monthly;
  const currentCategoryConfig = CATEGORY_CONFIG[watchedCategory] || CATEGORY_CONFIG.reposicion;
  const validBenefits = (watchedItems || [])
    .map((item) => item?.value?.trim())
    .filter(Boolean);

  return (
    <form
      id={formId}
      onSubmit={form.handleSubmit(handleFormSubmit, handleFormErrors)}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Formulario de edición comercial */}
        <div className="lg:col-span-7 space-y-6">
          {/* Identidad y Propósito */}
          <div className="space-y-4 rounded-xl border border-border bg-card/60 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Layers size={14} className="text-primary" />
              <span>Identidad del Plan</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre Comercial del Plan</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Ej. Club Legado de Ulmo, Trazabilidad Premium"
                className="h-11 font-medium"
              />
              {form.formState.errors.name && (
                <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Propósito y Descripción del Servicio</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Describe el valor del lote, recolecciones incluidas, frecuencia de entrega o herramientas habilitadas..."
                rows={3}
                className="resize-none text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Visible para clientes en el catálogo y durante el proceso de suscripción.
              </p>
            </div>
          </div>

          {/* Destino y Canales de Publicación */}
          <div className="space-y-4 rounded-xl border border-border bg-card/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Globe size={14} className="text-primary" />
                <span>Destino y Canales de Publicación</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {watchedChannels.length} {watchedChannels.length === 1 ? 'canal activo' : 'canales activos'}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              Define en qué superficies del monorepo se expondrá este plan para su contratación.
            </p>

            {/* Categoría del Plan */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoría y Modelo de Suscripción</Label>
              <Select
                options={CATEGORY_SELECT_OPTIONS}
                value={watchedCategory}
                onValueChange={(val) => handleCategoryChange(val as PlanCategory)}
              />
              <p className="text-[11px] text-muted-foreground">
                {currentCategoryConfig.description}
              </p>
            </div>

            {/* Selector Multi-canal de Publicación */}
            <div className="space-y-2.5 pt-2">
              <Label>Superficies y Vitrinas Habilitadas</Label>
              <div className="grid grid-cols-1 gap-2.5">
                {(
                  Object.keys(CHANNEL_CONFIG) as PlanChannel[]
                ).map((chKey) => {
                  const ch = CHANNEL_CONFIG[chKey];
                  const isChecked = watchedChannels.includes(chKey);
                  return (
                    <div
                      key={chKey}
                      onClick={() => toggleChannel(chKey)}
                      className={cn(
                        'flex items-start justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none',
                        isChecked
                          ? 'border-primary/60 bg-surface-raised shadow-sm ring-1 ring-primary/20'
                          : 'border-border/70 bg-card/40 hover:bg-surface-raised/50 hover:border-border'
                      )}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-xs font-medium',
                              isChecked ? 'text-foreground' : 'text-muted-foreground'
                            )}
                          >
                            {ch.label}
                          </span>
                          <Badge
                            variant={isChecked ? 'default' : 'outline'}
                            className="text-[9px] px-1.5 py-0 uppercase tracking-wider"
                          >
                            {ch.surface}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          {ch.description}
                        </p>
                      </div>

                      <div className="pt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleChannel(chKey)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background cursor-pointer accent-primary"
                          aria-label={ch.label}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {form.formState.errors.channels && (
                <p className="text-destructive text-xs mt-1">
                  {form.formState.errors.channels.message}
                </p>
              )}
            </div>

            {/* Naturaleza de la Entrega (Física vs Digital) */}
            <div className="pt-3 border-t border-border/60 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {watchedIsDigital ? (
                      <FileCheck2 size={15} className="text-primary" />
                    ) : (
                      <Truck size={15} className="text-primary" />
                    )}
                    <span className="text-xs font-medium text-foreground">
                      {watchedIsDigital
                        ? 'Servicio Digital / Certificación SAG (Sin envío físico)'
                        : 'Entrega Física de Productos (Despacho logístico programado)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {watchedIsDigital
                      ? 'No genera órdenes de despacho en logística ni solicita dirección de entrega.'
                      : 'Programa despachos periódicos a domicilio gestionados en el módulo de envíos.'}
                  </p>
                </div>
                <Switch
                  checked={watchedIsDigital}
                  onCheckedChange={(val) => form.setValue('is_digital', val, { shouldDirty: true })}
                />
              </div>

              {/* Si es Recolección Estacional, selector de Floración */}
              {watchedCategory === 'cosecha' && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <Label htmlFor="floracion">Variedad Botánica / Floración</Label>
                  <Select
                    options={FLORACION_OPTIONS}
                    value={watchedFloracion || 'ulmo'}
                    onValueChange={(val) => form.setValue('floracion', val, { shouldDirty: true })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Asocia el plan a la ventana fenológica de recolección del bosque nativo.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Precio y Frecuencia */}
          <div className="space-y-4 rounded-xl border border-border bg-card/60 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <CreditCard size={14} className="text-primary" />
              <span>Inversión y Frecuencia de Cobro</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_clp">Precio de Suscripción (CLP)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                    $
                  </span>
                  <Input
                    id="price_clp"
                    type="number"
                    min={0}
                    step={100}
                    {...form.register('price_clp', { valueAsNumber: true })}
                    className="h-11 pl-7 tabular-nums font-semibold"
                  />
                </div>
                {form.formState.errors.price_clp && (
                  <p className="text-destructive text-xs">{form.formState.errors.price_clp.message}</p>
                )}
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  Equivale a ${(Number(watchedPrice) || 0).toLocaleString('es-CL')} CLP
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frecuencia del Ciclo</Label>
                <Select
                  options={FREQUENCY_SELECT_OPTIONS}
                  value={form.watch('frequency')}
                  onValueChange={(val) =>
                    form.setValue(
                      'frequency',
                      val as 'monthly' | 'quarterly' | 'annual' | 'season',
                      { shouldValidate: true }
                    )
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  {freqConfig.hint}
                </p>
              </div>
            </div>

            {/* Distintivos Comerciales Opcionales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/60">
              <div className="space-y-2">
                <Label htmlFor="badge_label">Etiqueta Promocional (Opcional)</Label>
                <Input
                  id="badge_label"
                  {...form.register('badge_label')}
                  placeholder="Ej. Más Elegido, Cupos Limitados"
                  className="h-10 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Texto destacado en vitrina sobre la tarjeta del plan.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-6 sm:pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="destacado" className="cursor-pointer text-xs">
                    Plan Destacado
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Resalta con borde dorado en catálogos.
                  </p>
                </div>
                <Switch
                  id="destacado"
                  checked={watchedDestacado}
                  onCheckedChange={(val) => form.setValue('destacado', val, { shouldDirty: true })}
                />
              </div>
            </div>
          </div>

          {/* Beneficios Incluidos */}
          <div className="space-y-4 rounded-xl border border-border bg-card/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <CheckCircle2 size={14} className="text-primary" />
                <span>Entregables y Beneficios del Suscriptor</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ value: '' })}
                className="h-8 text-xs inline-flex items-center gap-1.5"
              >
                <Plus size={14} />
                Agregar Beneficio
              </Button>
            </div>

            <div className="space-y-2.5">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono w-5 text-right shrink-0">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <Input
                      {...form.register(`included_items.${index}.value`)}
                      placeholder={`Ej. Envío bimensual de Miel de Ulmo, Pasaportes QR...`}
                      className="h-10 text-sm"
                    />
                    {form.formState.errors.included_items?.[index]?.value && (
                      <p className="text-destructive text-xs mt-1">
                        {form.formState.errors.included_items[index]?.value?.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label="Quitar beneficio"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
            {form.formState.errors.included_items?.root && (
              <p className="text-destructive text-xs">
                {form.formState.errors.included_items.root.message}
              </p>
            )}
          </div>

          {/* Switch de activación y sección de Key técnica */}
          <div className="space-y-4 rounded-xl border border-border bg-card/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="active" className="text-sm font-medium cursor-pointer">
                  Disponibilidad del Plan
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Los planes activos se publican de inmediato en los canales seleccionados.
                </p>
              </div>
              <Switch
                id="active"
                checked={watchedActive}
                onCheckedChange={(val) => form.setValue('active', val, { shouldDirty: true })}
              />
            </div>

            {/* Identificador de sistema colapsable con soporte readOnly en edición */}
            <div className="pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={() => setShowAdvancedKey((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown
                  size={14}
                  className={cn(
                    'transition-transform duration-200',
                    showAdvancedKey ? 'rotate-180' : ''
                  )}
                />
                <span>Identificador técnico de integración</span>
              </button>

              {showAdvancedKey ? (
                <div className="mt-3 space-y-2 rounded-lg bg-surface-sunken p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="key" className="text-xs text-muted-foreground">
                      Código de referencia del plan (Key)
                    </Label>
                    {isEditing ? (
                      <span className="text-[10px] text-muted-foreground">
                        Fijo para preservar historial de suscripciones
                      </span>
                    ) : (
                      <span className="text-[10px] text-primary">
                        Generado automáticamente (personalizable)
                      </span>
                    )}
                  </div>
                  <Input
                    id="key"
                    {...form.register('key')}
                    readOnly={isEditing}
                    placeholder="ej. club_legado_ulmo"
                    className={cn(
                      'h-8 font-mono text-xs',
                      isEditing
                        ? 'bg-surface-raised/70 opacity-80 cursor-not-allowed border-dashed'
                        : ''
                    )}
                  />
                  {form.formState.errors.key && (
                    <p className="text-destructive text-xs">{form.formState.errors.key.message}</p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Live Preview Card (Previsualización en vivo) */}
        <div className="lg:col-span-5 sticky top-2 space-y-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Eye size={14} className="text-primary" />
              <span>Previsualización del Suscriptor</span>
            </div>
            <Badge variant="outline" className="text-[10px] font-normal border-primary/30 text-primary">
              En vivo
            </Badge>
          </div>

          <div
            className={cn(
              'rounded-2xl border bg-gradient-to-b from-card to-card/90 p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all',
              watchedDestacado ? 'border-primary/60 shadow-primary/10' : 'border-border'
            )}
          >
            {/* Adorno decorativo de aura orgánica */}
            <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              {/* Badges superiores: Estado y Etiqueta Comercial */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-primary">
                    {freqConfig.label}
                  </span>
                  {watchedBadgeLabel?.trim() ? (
                    <Badge variant="default" className="text-[10px] py-0 px-2 font-medium">
                      {watchedBadgeLabel.trim()}
                    </Badge>
                  ) : null}
                </div>
                <Badge variant={watchedActive ? 'default' : 'outline'}>
                  {watchedActive ? 'Activo' : 'Pausado'}
                </Badge>
              </div>

              <div>
                <h3 className="text-xl font-display text-foreground font-semibold">
                  {watchedName?.trim() || 'Nombre del Plan'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">
                  {watchedDescription?.trim() ||
                    'La descripción del servicio aparecerá aquí para informar al suscriptor sobre sus atributos.'}
                </p>
              </div>

              {/* Canales y Naturaleza de Entrega */}
              <div className="flex flex-wrap items-center gap-1.5 py-1">
                <Badge variant="secondary" className="text-[10px] inline-flex items-center gap-1">
                  {watchedIsDigital ? (
                    <>
                      <FileCheck2 size={11} className="text-primary" />
                      <span>Servicio Digital SAG</span>
                    </>
                  ) : (
                    <>
                      <Truck size={11} className="text-primary" />
                      <span>Despacho a Domicilio</span>
                    </>
                  )}
                </Badge>

                {watchedChannels.map((chKey) => (
                  <Badge key={chKey} variant="outline" className="text-[9px] border-border/80">
                    {CHANNEL_CONFIG[chKey]?.badge || chKey}
                  </Badge>
                ))}
              </div>

              {/* Precio destacado */}
              <div className="py-2 border-y border-border/80 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold font-display text-foreground tabular-nums">
                  ${(Number(watchedPrice) || 0).toLocaleString('es-CL')}
                </span>
                <span className="text-xs text-muted-foreground">
                  CLP / {freqConfig.periodUnit}
                </span>
              </div>

              {/* Lista de beneficios con checks elegantes */}
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-medium text-foreground uppercase tracking-wide">
                  Beneficios incluidos:
                </p>
                {validBenefits.length > 0 ? (
                  <ul className="space-y-2">
                    {validBenefits.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-foreground/90">
                        <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Sin beneficios especificados todavía.
                  </p>
                )}
              </div>

              <div className="pt-3">
                <Button
                  type="button"
                  disabled
                  className="w-full h-11 text-xs opacity-75 cursor-not-allowed"
                >
                  Suscribirse al Plan
                </Button>
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                  Vista simulada del componente de catálogo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showStandaloneActions ? (
        <div className="flex justify-end gap-3 pt-6 border-t border-border">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          ) : null}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar Plan'}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
