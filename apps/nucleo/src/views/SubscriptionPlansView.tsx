'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  EnjTableShell,
  DataTable,
  Button,
  Badge,
  toast,
  ImmersiveModal,
  Spinner,
  type ColumnDef,
} from '@enjambre/ui';
import { Plus, Edit2 } from 'lucide-react';
import {
  SubscriptionPlanForm,
  type SubscriptionPlanFormData,
} from '@/components/suscripciones/SubscriptionPlanForm';

interface SubscriptionPlanRow {
  id: string;
  name: string;
  key: string;
  price_clp: number;
  frequency: string;
  description: string | null;
  active: boolean;
  included_items: string[];
}

export function SubscriptionPlansView() {
  const [plans, setPlans] = useState<SubscriptionPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar planes', { description: error.message });
    } else {
      setPlans(data as SubscriptionPlanRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchPlans();
  }, []);

  const handleCreateNew = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const handleEdit = (plan: SubscriptionPlanRow) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData: SubscriptionPlanFormData) => {
    setIsSubmitting(true);
    
    // Normalize included_items to flat string array
    const normalizedItems = formData.included_items.map((i) => i.value).filter(Boolean);

    try {
      if (editingPlan) {
        // Update
        const { error } = await supabase
          .from('subscription_plans')
          .update({
            name: formData.name,
            description: formData.description,
            price_clp: formData.price_clp,
            frequency: formData.frequency,
            active: formData.active,
            included_items: normalizedItems,
          })
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast.success('Plan actualizado correctamente');
      } else {
        // Create
        const { error } = await supabase
          .from('subscription_plans')
          .insert({
            name: formData.name,
            key: formData.key,
            description: formData.description,
            price_clp: formData.price_clp,
            frequency: formData.frequency,
            active: formData.active,
            included_items: normalizedItems,
          });

        if (error) throw error;
        toast.success('Plan creado correctamente');
      }

      setIsModalOpen(false);
      void fetchPlans();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error', { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const mapToFormData = (plan: SubscriptionPlanRow | null): SubscriptionPlanFormData | undefined => {
    if (!plan) return undefined;
    return {
      name: plan.name,
      key: plan.key,
      description: plan.description,
      price_clp: plan.price_clp,
      frequency: plan.frequency as any,
      active: plan.active ?? false,
      included_items: Array.isArray(plan.included_items) && plan.included_items.length > 0 
        ? plan.included_items.map((i: string) => ({ value: i })) 
        : [{ value: '' }],
    };
  };

  const columns: ColumnDef<SubscriptionPlanRow>[] = [
    {
      key: 'name',
      header: 'Nombre del Plan',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.name}</span>
          <span className="text-xs text-muted-foreground font-mono">{row.key}</span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Precio',
      render: (row) => (
        <span className="tabular-nums">
          ${row.price_clp.toLocaleString('es-CL')} / {row.frequency}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => (
        <Badge variant={row.active ? 'success' : 'outline'}>
          {row.active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
            <Edit2 className="w-4 h-4 mr-2" /> Editar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Planes de Suscripción
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra los planes recurrentes ofrecidos a los clientes (Club Cosecha, Registro Territorial, etc).
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Plan
        </Button>
      </div>

      <EnjTableShell>
        {loading ? (
          <div className="py-12 flex justify-center"><Spinner /></div>
        ) : (
          <DataTable
            rows={plans}
            columns={columns}
            getId={(row) => row.id}
            emptyState={<div className="p-4 text-center text-muted-foreground">No se encontraron planes de suscripción.</div>}
          />
        )}
      </EnjTableShell>

      <ImmersiveModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Editar Plan de Suscripción' : 'Crear Nuevo Plan'}
      >
        <div className="p-1">
          <SubscriptionPlanForm
            initialData={mapToFormData(editingPlan)}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
            onCancel={() => setIsModalOpen(false)}
          />
        </div>
      </ImmersiveModal>
    </div>
  );
}
