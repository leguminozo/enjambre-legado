'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  EnjTableShell,
  DataTable,
  Button,
  Badge,
  Switch,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  toast,
  ImmersiveModal,
  Spinner,
  friendlySupabaseError,
  friendlyError,
  cn,
  type ColumnDef,
} from '@enjambre/ui';
import {
  Plus,
  Edit2,
  Repeat,
  Package,
  MoreHorizontal,
  Copy,
  Trash2,
  CheckCircle2,
  Power,
  Layers,
  Gift,
} from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { LoyaltyRewardsPanel } from '@/components/suscripciones/LoyaltyRewardsPanel';
import {
  SubscriptionPlanForm,
  normalizeIncludedItems,
  FREQUENCY_CONFIG,
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
  included_items: unknown;
}

type PlanCategoryFilter = 'all' | 'cosecha' | 'territorial' | 'reposicion';

function getPlanCategory(plan: SubscriptionPlanRow): 'cosecha' | 'territorial' | 'reposicion' | 'general' {
  const k = plan.key.toLowerCase();
  const n = plan.name.toLowerCase();
  if (k.includes('trazabilidad') || k.includes('apiario') || n.includes('trazabilidad') || n.includes('apiario')) {
    return 'territorial';
  }
  if (k.startsWith('club_') || n.startsWith('club')) {
    return 'cosecha';
  }
  if (
    k.includes('monthly') ||
    k.includes('quarterly') ||
    k.includes('annual') ||
    n.includes('reposición') ||
    n.includes('reposicion')
  ) {
    return 'reposicion';
  }
  return 'general';
}

function getCategoryBadge(cat: 'cosecha' | 'territorial' | 'reposicion' | 'general') {
  switch (cat) {
    case 'territorial':
      return { label: 'Territorial Apícola', variant: 'outline' as const };
    case 'cosecha':
      return { label: 'Recolección Estacional', variant: 'default' as const };
    case 'reposicion':
      return { label: 'Reposición', variant: 'secondary' as const };
    default:
      return { label: 'General', variant: 'outline' as const };
  }
}

export function SubscriptionPlansView() {
  const apiFetch = useApiFetch();
  const [mainTab, setMainTab] = useState<'planes' | 'canje'>('planes');
  const [plans, setPlans] = useState<SubscriptionPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<PlanCategoryFilter>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanRow | null>(null);
  const [initialFormData, setInitialFormData] = useState<SubscriptionPlanFormData | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar planes', { description: friendlySupabaseError(error) });
    } else {
      setPlans((data as SubscriptionPlanRow[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchPlans();
  }, []);

  const normalizeFrequencyForForm = (freq: string): 'monthly' | 'quarterly' | 'annual' | 'season' => {
    const f = freq?.toLowerCase()?.trim();
    if (f === 'season') return 'season';
    if (f === 'quarterly') return 'quarterly';
    if (f === 'annual' || f === 'yearly') return 'annual';
    return 'monthly';
  };

  const mapToFormData = (plan: SubscriptionPlanRow | null): SubscriptionPlanFormData | undefined => {
    if (!plan) return undefined;
    return {
      name: plan.name,
      key: plan.key,
      description: plan.description || '',
      price_clp: plan.price_clp,
      frequency: normalizeFrequencyForForm(plan.frequency),
      active: plan.active ?? false,
      included_items: normalizeIncludedItems(plan.included_items),
    };
  };

  const handleCreateNew = () => {
    setEditingPlan(null);
    setInitialFormData(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (plan: SubscriptionPlanRow) => {
    setEditingPlan(plan);
    setInitialFormData(mapToFormData(plan));
    setIsModalOpen(true);
  };

  const handleDuplicate = (plan: SubscriptionPlanRow) => {
    setEditingPlan(null); // Tratar como nuevo registro en backend
    const baseData = mapToFormData(plan);
    if (baseData) {
      setInitialFormData({
        ...baseData,
        name: `${baseData.name} (Copia)`,
        key: `${baseData.key}_copia_${Math.floor(100 + Math.random() * 900)}`,
        active: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleToggleActive = async (plan: SubscriptionPlanRow, newActive: boolean) => {
    // Actualización optimista inmediata en la UI
    setPlans((prev) =>
      prev.map((p) => (p.id === plan.id ? { ...p, active: newActive } : p))
    );

    const { error } = await supabase
      .from('subscription_plans')
      .update({ active: newActive })
      .eq('id', plan.id);

    if (error) {
      // Revertir cambio si hubo error
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, active: plan.active } : p))
      );
      toast.error('No se pudo actualizar el estado', {
        description: friendlySupabaseError(error),
      });
    } else {
      toast.success(newActive ? `Plan "${plan.name}" activado` : `Plan "${plan.name}" pausado`);
      void apiFetch('/api/admin-system/purge-cache', { method: 'POST' }).catch(() => undefined);
    }
  };

  const handleDelete = async (plan: SubscriptionPlanRow) => {
    const confirmed = window.confirm(
      `¿Deseas eliminar permanentemente el plan "${plan.name}"?\n\nSi el plan tiene clientes o historial de suscripciones asociadas, el sistema impedirá su eliminación para proteger los registros contables.`
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', plan.id);

      if (error) {
        toast.error('No fue posible eliminar el plan', {
          description: friendlySupabaseError(error),
        });
        return;
      }

      toast.success(`Plan "${plan.name}" eliminado correctamente`);
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      void apiFetch('/api/admin-system/purge-cache', { method: 'POST' }).catch(() => undefined);
    } catch (err: unknown) {
      toast.error('Error al procesar la eliminación', {
        description: friendlyError(err),
      });
    }
  };

  const handleFormSubmit = async (formData: SubscriptionPlanFormData) => {
    setIsSubmitting(true);

    const normalizedItems = formData.included_items.map((i) => i.value.trim()).filter(Boolean);

    try {
      if (editingPlan) {
        // Actualizar plan existente
        const { error } = await supabase
          .from('subscription_plans')
          .update({
            name: formData.name,
            description: formData.description || null,
            price_clp: formData.price_clp,
            frequency: formData.frequency,
            active: formData.active,
            included_items: normalizedItems,
          })
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast.success(`Plan "${formData.name}" actualizado correctamente`);
      } else {
        // Crear nuevo plan o copia
        const { error } = await supabase
          .from('subscription_plans')
          .insert({
            name: formData.name,
            key: formData.key,
            description: formData.description || null,
            price_clp: formData.price_clp,
            frequency: formData.frequency,
            active: formData.active,
            included_items: normalizedItems,
          });

        if (error) throw error;
        toast.success(`Plan "${formData.name}" creado con éxito`);
      }

      void apiFetch('/api/admin-system/purge-cache', { method: 'POST' }).catch(() => undefined);

      setIsModalOpen(false);
      void fetchPlans();
    } catch (error: unknown) {
      toast.error('Error al guardar el plan', {
        description: friendlyError(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryCounts = useMemo(() => {
    const counts = { all: plans.length, cosecha: 0, territorial: 0, reposicion: 0 };
    for (const p of plans) {
      const cat = getPlanCategory(p);
      if (cat === 'cosecha') counts.cosecha++;
      else if (cat === 'territorial') counts.territorial++;
      else if (cat === 'reposicion') counts.reposicion++;
    }
    return counts;
  }, [plans]);

  const filteredPlans = useMemo(() => {
    if (activeCategory === 'all') return plans;
    return plans.filter((p) => getPlanCategory(p) === activeCategory);
  }, [plans, activeCategory]);

  const columns: ColumnDef<SubscriptionPlanRow>[] = [
    {
      key: 'name',
      header: 'Nombre y Atributos del Plan',
      render: (row) => {
        const cat = getPlanCategory(row);
        const badge = getCategoryBadge(cat);
        return (
          <div className="flex flex-col gap-1 min-w-[220px]">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground text-sm">{row.name}</span>
              <Badge variant={badge.variant} className="text-[10px] px-1.5 py-0 uppercase tracking-wider font-semibold">
                {badge.label}
              </Badge>
            </div>
            {row.description ? (
              <p className="text-xs text-muted-foreground line-clamp-1 max-w-sm" title={row.description}>
                {row.description}
              </p>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'price',
      header: 'Inversión',
      render: (row) => {
        const freq = FREQUENCY_CONFIG[row.frequency]?.periodUnit || row.frequency;
        return (
          <div className="flex flex-col">
            <span className="tabular-nums font-semibold text-foreground text-sm">
              ${row.price_clp.toLocaleString('es-CL')} CLP
            </span>
            <span className="text-xs text-muted-foreground">
              por {freq}
            </span>
          </div>
        );
      },
    },
    {
      key: 'included_items',
      header: 'Beneficios',
      render: (row) => {
        const items = normalizeIncludedItems(row.included_items);
        const validCount = items.filter((i) => i.value.trim()).length;
        return (
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 size={13} className="text-primary shrink-0" />
            <span>
              {validCount} {validCount === 1 ? 'entregable' : 'entregables'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Disponibilidad',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Switch
            checked={row.active}
            onCheckedChange={(checked) => void handleToggleActive(row, checked)}
            aria-label={`Cambiar estado del plan ${row.name}`}
          />
          <span
            className={cn(
              'text-xs font-medium',
              row.active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {row.active ? 'Activo' : 'Pausado'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row)}
            className="h-8 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-2.5"
          >
            <Edit2 size={13} />
            <span className="hidden sm:inline">Editar</span>
          </Button>

          <DropdownMenu
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Más acciones del plan"
              >
                <MoreHorizontal size={15} />
              </Button>
            }
          >
            <DropdownMenuItem onSelect={() => handleEdit(row)}>
              <div className="inline-flex items-center gap-2 text-xs">
                <Edit2 size={13} />
                <span>Editar detalles</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={() => handleDuplicate(row)}>
              <div className="inline-flex items-center gap-2 text-xs">
                <Copy size={13} />
                <span>Duplicar como nuevo plan</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={() => void handleToggleActive(row, !row.active)}>
              <div className="inline-flex items-center gap-2 text-xs">
                <Power size={13} />
                <span>{row.active ? 'Pausar temporalmente' : 'Activar plan'}</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem destructive onSelect={() => void handleDelete(row)}>
              <div className="inline-flex items-center gap-2 text-xs text-destructive">
                <Trash2 size={13} />
                <span>Eliminar del catálogo</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ViewShell
        variant="compact"
        eyebrow="Mercado · Retención & Fidelización"
        title="Suscripciones & Lealtad del Club"
        subtitle="Administra los modelos de reposición continua, recolecciones estacionales y el catálogo de canje de sellos para los Guardianes del Bosque."
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
            {mainTab === 'planes' && (
              <Button onClick={handleCreateNew} className="inline-flex items-center gap-2 min-h-11">
                <Plus size={18} className="mr-1" />
                Nuevo Plan
              </Button>
            )}
          </div>
        }
      />

      {/* Selector Principal: Planes de Reposición vs Catálogo de Canje */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <button
          type="button"
          onClick={() => setMainTab('planes')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors',
            mainTab === 'planes'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
          )}
        >
          <Repeat size={15} />
          <span>Planes de Reposición Recurrente</span>
        </button>
        <button
          type="button"
          onClick={() => setMainTab('canje')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors',
            mainTab === 'canje'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
          )}
        >
          <Gift size={15} />
          <span>Catálogo de Canje (Sellos)</span>
        </button>
      </div>

      {mainTab === 'canje' ? (
        <LoyaltyRewardsPanel />
      ) : (
        <>
          {/* Segmentador de Categorías Bioculturales */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-sunken/60 rounded-xl border border-border/80 w-fit">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={cn(
                'px-3.5 py-1.5 text-xs rounded-lg font-medium transition-colors inline-flex items-center gap-1.5',
                activeCategory === 'all'
                  ? 'bg-card text-foreground shadow-sm border border-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Layers size={13} />
              <span>Todos</span>
              <span className="text-[10px] opacity-70">({categoryCounts.all})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('cosecha')}
              className={cn(
                'px-3.5 py-1.5 text-xs rounded-lg font-medium transition-colors inline-flex items-center gap-1.5',
                activeCategory === 'cosecha'
                  ? 'bg-card text-foreground shadow-sm border border-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>Recolección Estacional</span>
              <span className="text-[10px] opacity-70">({categoryCounts.cosecha})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('territorial')}
              className={cn(
                'px-3.5 py-1.5 text-xs rounded-lg font-medium transition-colors inline-flex items-center gap-1.5',
                activeCategory === 'territorial'
                  ? 'bg-card text-foreground shadow-sm border border-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>Territoriales Apícolas</span>
              <span className="text-[10px] opacity-70">({categoryCounts.territorial})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('reposicion')}
              className={cn(
                'px-3.5 py-1.5 text-xs rounded-lg font-medium transition-colors inline-flex items-center gap-1.5',
                activeCategory === 'reposicion'
                  ? 'bg-card text-foreground shadow-sm border border-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>Reposición Despensa</span>
              <span className="text-[10px] opacity-70">({categoryCounts.reposicion})</span>
            </button>
          </div>

          <EnjTableShell>
            {loading ? (
              <div className="py-12 flex justify-center"><Spinner /></div>
            ) : (
              <DataTable
                rows={filteredPlans}
                columns={columns}
                getId={(row) => row.id}
                emptyState={
                  <div className="p-8 text-center text-muted-foreground space-y-2">
                    <p className="font-medium text-foreground">No se encontraron planes en esta categoría</p>
                    <p className="text-xs">Crea planes recurrentes para fidelizar a los guardianes del bosque.</p>
                    <Button size="sm" variant="outline" onClick={handleCreateNew} className="mt-2 text-xs">
                      <Plus size={14} className="mr-1.5" /> Crear Primer Plan
                    </Button>
                  </div>
                }
              />
            )}
          </EnjTableShell>
        </>
      )}

      <ImmersiveModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="xl"
        eyebrow="Configuración Comercial"
        title={
          editingPlan
            ? `Editar: ${editingPlan.name}`
            : initialFormData
            ? `Duplicar Plan: ${initialFormData.name}`
            : 'Crear Nuevo Plan de Suscripción'
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-muted-foreground hidden sm:block">
              Los cambios se sincronizan en tiempo real con el catálogo y la pasarela de pagos.
            </p>
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="subscription-plan-form"
                disabled={isSubmitting}
                className="text-xs"
              >
                {isSubmitting
                  ? 'Guardando...'
                  : editingPlan
                  ? 'Actualizar Plan'
                  : 'Crear Plan'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="p-1">
          <SubscriptionPlanForm
            formId="subscription-plan-form"
            initialData={initialFormData}
            isEditing={Boolean(editingPlan)}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
            onCancel={() => setIsModalOpen(false)}
            showStandaloneActions={false}
          />
        </div>
      </ImmersiveModal>
    </div>
  );
}

