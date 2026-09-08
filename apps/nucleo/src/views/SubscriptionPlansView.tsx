'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
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
import { Plus, Edit2, Repeat, Package } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
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
  const apiFetch = useApiFetch();
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

      void apiFetch('/api/admin-system/purge-cache', { method: 'POST' }).catch(() => undefined);

      setIsModalOpen(false);
      void fetchPlans();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error', { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizeFrequency = (freq: string): 'monthly' | 'yearly' | 'weekly' => {
    if (freq === 'yearly' || freq === 'annual') return 'yearly';
    if (freq === 'weekly') return 'weekly';
    return 'monthly';
  };

  const mapToFormData = (plan: SubscriptionPlanRow | null): SubscriptionPlanFormData | undefined => {
    if (!plan) return undefined;
    return {
      name: plan.name,
      key: plan.key,
      description: plan.description,
      price_clp: plan.price_clp,
      frequency: normalizeFrequency(plan.frequency),
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
    <div className="space-y-6 animate-in fade-in duration-300">
      <ViewShell
        variant="compact"
        eyebrow="Mercado · Fidelización"
        title="Planes de Suscripción"
        subtitle="Administra los planes recurrentes ofrecidos a los clientes (Club Legado del Bosque, reposición periódica)."
        icon={<Repeat size={20} />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/catalogo"
              className="btn btn-outline text-xs inline-flex items-center gap-2 min-h-11 px-3"
            >
              <Package size={16} />
              Catálogo de Productos
            </Link>
            <Button onClick={handleCreateNew} className="inline-flex items-center gap-2 min-h-11">
              <Plus size={18} className="mr-1" />
              Nuevo Plan
            </Button>
          </div>
        }
      />

      <EnjTableShell>
        {loading ? (
          <div className="py-12 flex justify-center"><Spinner /></div>
        ) : (
          <DataTable
            rows={plans}
            columns={columns}
            getId={(row) => row.id}
            emptyState={
              <div className="p-6 text-center text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Aún no hay planes de reposición configurados</p>
                <p className="text-xs">Crea planes mensuales o trimestrales para los guardianes del bosque.</p>
              </div>
            }
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
