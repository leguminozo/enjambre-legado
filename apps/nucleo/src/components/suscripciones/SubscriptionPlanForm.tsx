'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Input,
  Textarea,
  Button,
  Label,
  Switch,
  Select,
  toast,
} from '@enjambre/ui';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';

const planSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  key: z.string().min(1, 'La clave (key) es requerida'),
  description: z.string().nullable(),
  price_clp: z.number().min(0, 'El precio debe ser positivo'),
  frequency: z.enum(['monthly', 'yearly', 'weekly']),
  active: z.boolean(),
  included_items: z.array(z.object({ value: z.string() })).min(1, 'Debe incluir al menos un beneficio'),
});

export type SubscriptionPlanFormData = z.infer<typeof planSchema>;

interface SubscriptionPlanFormProps {
  initialData?: SubscriptionPlanFormData;
  onSubmit: (data: SubscriptionPlanFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

export function SubscriptionPlanForm({
  initialData,
  onSubmit,
  isLoading,
  onCancel,
}: SubscriptionPlanFormProps) {
  const form = useForm<SubscriptionPlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: initialData || {
      name: '',
      key: '',
      description: '',
      price_clp: 0,
      frequency: 'monthly',
      active: true,
      included_items: [{ value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'included_items',
  });

  const handleSubmit = async (data: SubscriptionPlanFormData) => {
    try {
      await onSubmit(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al guardar', { description: msg });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre Comercial</Label>
          <Input id="name" {...form.register('name')} placeholder="Ej. Club Legado Oro" />
          {form.formState.errors.name && (
            <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="key">Clave Única (Key)</Label>
          <Input id="key" {...form.register('key')} placeholder="ej. club_legado_oro" disabled={!!initialData} />
          {form.formState.errors.key && (
            <p className="text-destructive text-xs">{form.formState.errors.key.message}</p>
          )}
          <p className="text-xs text-muted-foreground">Usada internamente. No editable después de creado.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" {...form.register('description')} placeholder="Descripción visible para el usuario..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price_clp">Precio (CLP)</Label>
          <Input id="price_clp" type="number" {...form.register('price_clp', { valueAsNumber: true })} />
          {form.formState.errors.price_clp && (
            <p className="text-destructive text-xs">{form.formState.errors.price_clp.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frecuencia de Cobro</Label>
          <Select 
            options={[
              { value: 'monthly', label: 'Mensual' },
              { value: 'yearly', label: 'Anual' },
              { value: 'weekly', label: 'Semanal' },
            ]}
            value={form.watch('frequency')}
            onValueChange={(val) => form.setValue('frequency', val as 'monthly' | 'yearly' | 'weekly')}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Beneficios Incluidos (Lista viñetas)</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })}>
            <Plus className="w-4 h-4 mr-2" /> Agregar Beneficio
          </Button>
        </div>
        
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <div className="flex-1 space-y-1">
              <Input
                {...form.register(`included_items.${index}.value`)}
                placeholder={`Beneficio ${index + 1}...`}
              />
              {form.formState.errors.included_items?.[index]?.value && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.included_items[index]?.value?.message}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              className="px-3"
              onClick={() => remove(index)}
              disabled={fields.length === 1}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <Switch
          checked={form.watch('active')}
          onCheckedChange={(val) => form.setValue('active', val)}
          id="active"
        />
        <Label htmlFor="active" className="cursor-pointer">
          Plan Activo (Visible y contratable)
        </Label>
      </div>

      <div className="flex justify-end gap-3 pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar Plan'}
        </Button>
      </div>
    </form>
  );
}
