'use client';

import { useState, useEffect } from 'react';
import {
  Gift,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Compass,
  KeyRound,
  GraduationCap,
} from 'lucide-react';
import {
  Button,
  Badge,
  Input,
  Textarea,
  Label,
  Switch,
  toast,
  ImmersiveModal,
  Spinner,
  friendlyError,
} from '@enjambre/ui';
import { supabase } from '@/lib/supabase';

export type RewardType = 'exclusive_harvest' | 'territorial_content' | 'early_access' | 'experience';

export interface LoyaltyRewardRow {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  reward_type: RewardType;
  metadata?: Record<string, unknown> | null;
  active: boolean;
  created_at: string;
}

const REWARD_TYPE_CONFIG: Record<
  RewardType,
  { label: string; icon: React.ComponentType<{ className?: string; size?: number }> }
> = {
  exclusive_harvest: { label: 'Recolección Exclusiva', icon: Sparkles },
  territorial_content: { label: 'Contenido Territorial', icon: Compass },
  early_access: { label: 'Acceso Anticipado', icon: KeyRound },
  experience: { label: 'Experiencia o Cata', icon: GraduationCap },
};

interface RewardFormData {
  name: string;
  description: string;
  points_cost: number;
  reward_type: RewardType;
  active: boolean;
}

export function LoyaltyRewardsPanel() {
  const [rewards, setRewards] = useState<LoyaltyRewardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyRewardRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<RewardFormData>({
    name: '',
    description: '',
    points_cost: 300,
    reward_type: 'exclusive_harvest',
    active: true,
  });

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .order('points_cost', { ascending: true });

      if (error) throw error;
      setRewards((data ?? []) as LoyaltyRewardRow[]);
    } catch (err) {
      toast.error('Error al cargar catálogo de canje', {
        description: friendlyError(err, 'No se pudo cargar el catálogo de recompensas'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRewards();
  }, []);

  const handleCreateNew = () => {
    setEditingReward(null);
    setFormData({
      name: '',
      description: '',
      points_cost: 300,
      reward_type: 'exclusive_harvest',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (r: LoyaltyRewardRow) => {
    setEditingReward(r);
    setFormData({
      name: r.name,
      description: r.description ?? '',
      points_cost: r.points_cost,
      reward_type: r.reward_type,
      active: r.active,
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (r: LoyaltyRewardRow) => {
    const nextState = !r.active;
    setRewards((prev) =>
      prev.map((item) => (item.id === r.id ? { ...item, active: nextState } : item)),
    );

    try {
      const { error } = await supabase
        .from('loyalty_rewards')
        .update({ active: nextState })
        .eq('id', r.id);

      if (error) throw error;
      toast.success(nextState ? 'Recompensa activada en tienda' : 'Recompensa pausada');
    } catch (err) {
      setRewards((prev) =>
        prev.map((item) => (item.id === r.id ? { ...item, active: r.active } : item)),
      );
      toast.error('Error al actualizar estado', {
        description: friendlyError(err, 'No se pudo guardar el cambio'),
      });
    }
  };

  const handleDelete = async (r: LoyaltyRewardRow) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la recompensa "${r.name}"?`)) return;

    try {
      const { error } = await supabase.from('loyalty_rewards').delete().eq('id', r.id);
      if (error) throw error;
      setRewards((prev) => prev.filter((item) => item.id !== r.id));
      toast.success('Recompensa eliminada');
    } catch (err) {
      toast.error('Error al eliminar recompensa', {
        description: friendlyError(err, 'No se pudo eliminar la recompensa'),
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formData.name.trim();
    if (!cleanName) {
      toast.error('El nombre de la recompensa es obligatorio');
      return;
    }

    if (formData.points_cost <= 0) {
      toast.error('El costo en sellos debe ser mayor a 0');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: cleanName,
      description: formData.description.trim() || null,
      points_cost: Math.round(Number(formData.points_cost)),
      reward_type: formData.reward_type,
      active: formData.active,
    };

    try {
      if (editingReward) {
        const { error } = await supabase
          .from('loyalty_rewards')
          .update(payload)
          .eq('id', editingReward.id);

        if (error) throw error;
        toast.success('Recompensa actualizada correctamente');
      } else {
        const { error } = await supabase.from('loyalty_rewards').insert(payload);
        if (error) throw error;
        toast.success('Recompensa creada exitosamente');
      }

      setIsModalOpen(false);
      await fetchRewards();
    } catch (err) {
      toast.error('Error al guardar recompensa', {
        description: friendlyError(err, 'No se pudo registrar la recompensa en el sistema'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCount = rewards.filter((r) => r.active).length;

  return (
    <div className="space-y-6">
      {/* Top Header inside tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Catálogo de Canje (Sellos de Custodia)</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Premios canjeables en la billetera y perfil de los Guardianes del Bosque con sus sellos acumulados.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 self-start sm:self-auto min-h-10"
        >
          <Plus size={16} />
          Nueva Recompensa
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 bg-surface-raised/40 p-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Recompensas Totales
          </span>
          <div className="mt-1 text-2xl font-bold text-foreground">{rewards.length}</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-surface-raised/40 p-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Disponibles en Tienda
          </span>
          <div className="mt-1 text-2xl font-bold text-success-text">{activeCount}</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-surface-raised/20 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Spinner />
          </div>
        ) : rewards.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Gift className="w-10 h-10 text-muted-foreground mx-auto stroke-1" />
            <div className="font-semibold text-foreground">Sin recompensas en catálogo</div>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Configura el primer beneficio o producto exclusivo para que los guardianes puedan canjear con sus sellos.
            </p>
            <Button type="button" onClick={handleCreateNew} className="mt-2 inline-flex items-center gap-2">
              <Plus size={16} />
              Crear primera recompensa
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/40 bg-surface-raised/60 text-[0.68rem] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Recompensa</th>
                  <th className="py-3.5 px-4 font-semibold">Tipo</th>
                  <th className="py-3.5 px-4 font-semibold">Costo en Sellos</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Estado</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {rewards.map((r) => {
                  const typeConf = REWARD_TYPE_CONFIG[r.reward_type] ?? REWARD_TYPE_CONFIG.exclusive_harvest;
                  const Icon = typeConf.icon;

                  return (
                    <tr key={r.id} className="hover:bg-surface-raised/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">{r.name}</div>
                        {r.description && (
                          <div className="text-xs text-muted-foreground max-w-md line-clamp-1">
                            {r.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Icon size={14} className="text-accent-text" />
                          <span>{typeConf.label}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="secondary" className="font-bold tracking-wide">
                          {r.points_cost} sellos
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {r.active ? (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(r)}
                            className="inline-flex items-center gap-1 text-[0.7rem] text-success uppercase tracking-wider font-semibold hover:opacity-80 transition-opacity"
                            title="Click para pausar"
                          >
                            <CheckCircle2 size={12} /> Activo
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(r)}
                            className="inline-flex items-center gap-1 text-[0.7rem] text-muted-foreground uppercase tracking-wider font-semibold hover:text-foreground transition-colors"
                            title="Click para activar"
                          >
                            <XCircle size={12} /> Pausado
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(r)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-raised rounded-lg transition-colors"
                            title="Editar recompensa"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Eliminar recompensa"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar */}
      <ImmersiveModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eyebrow="Club Legado · Lealtad"
        title={editingReward ? 'Editar Recompensa' : 'Nueva Recompensa de Canje'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reward_name">Nombre de la recompensa *</Label>
              <Input
                id="reward_name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Frasco Miel de Ulmo Edición Fundacional (300g)"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reward_type">Tipo de recompensa *</Label>
                <select
                  id="reward_type"
                  value={formData.reward_type}
                  onChange={(e) => setFormData((p) => ({ ...p, reward_type: e.target.value as RewardType }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-10"
                >
                  <option value="exclusive_harvest">Recolección Exclusiva</option>
                  <option value="early_access">Acceso Anticipado a Lotes</option>
                  <option value="experience">Experiencia o Cata Guiada</option>
                  <option value="territorial_content">Contenido Territorial Reservado</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points_cost">Costo en sellos de custodia *</Label>
                <Input
                  id="points_cost"
                  type="number"
                  value={formData.points_cost}
                  onChange={(e) => setFormData((p) => ({ ...p, points_cost: Number(e.target.value) }))}
                  min={1}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward_desc">Descripción o relato</Label>
              <Textarea
                id="reward_desc"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Explica qué recibe el guardián al canjear sus sellos..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-surface-raised/40 p-3">
              <div>
                <div className="text-sm font-medium text-foreground">Recompensa activa en tienda</div>
                <div className="text-xs text-muted-foreground">
                  Visible en la sección de canje del perfil de cliente.
                </div>
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData((p) => ({ ...p, active: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-28">
              {isSubmitting ? <Spinner className="w-4 h-4" /> : editingReward ? 'Guardar Cambios' : 'Crear Recompensa'}
            </Button>
          </div>
        </form>
      </ImmersiveModal>
    </div>
  );
}
