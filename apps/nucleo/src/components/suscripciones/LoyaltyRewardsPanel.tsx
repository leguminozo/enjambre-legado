'use client';

import { useState, useEffect } from 'react';
import {
  Gift,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Award,
  Compass,
  KeyRound,
  GraduationCap,
  Check,
  Package,
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
  SkeletonTable,
  friendlyError,
} from '@enjambre/ui';
import { supabase } from '@/lib/supabase';

export type RewardType = 'exclusive_harvest' | 'territorial_content' | 'early_access' | 'experience';

export interface LoyaltyChannelOption {
  id: string;
  label: string;
  badge: string;
  description: string;
}

export const LOYALTY_CHANNELS: LoyaltyChannelOption[] = [
  { id: 'tienda', label: 'Tienda Online (Web D2C)', badge: 'Tienda Web', description: 'Canjeable en el Catálogo de la Billetera Web' },
  { id: 'campo_pos', label: 'Feria Apícola / POS Campo', badge: 'Feria POS', description: 'Retiro directo y canje presencial en feria' },
  { id: 'perfil_digital', label: 'Billetera & Portal Territorial', badge: 'Digital', description: 'Acceso desde el perfil y billetera del guardián' },
];

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
  exclusive_harvest: { label: 'Recolección Exclusiva', icon: Award },
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
  channels: string[];
  producto_id: string;
  delivery_mode: string;
}

export function LoyaltyRewardsPanel() {
  const [rewards, setRewards] = useState<LoyaltyRewardRow[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Array<{ id: string; nombre: string | null; formato?: string | null }>>([]);
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
    channels: ['tienda', 'campo_pos', 'perfil_digital'],
    producto_id: '',
    delivery_mode: 'envio',
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
    void (async () => {
      const { data } = await supabase
        .from('productos')
        .select('id, nombre, formato')
        .order('nombre', { ascending: true });
      if (data) setCatalogProducts(data as Array<{ id: string; nombre: string | null; formato?: string | null }>);
    })();
  }, []);

  const handleCreateNew = () => {
    setEditingReward(null);
    setFormData({
      name: '',
      description: '',
      points_cost: 300,
      reward_type: 'exclusive_harvest',
      active: true,
      channels: ['tienda', 'campo_pos', 'perfil_digital'],
      producto_id: '',
      delivery_mode: 'envio',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (r: LoyaltyRewardRow) => {
    setEditingReward(r);
    const meta = (r.metadata ?? {}) as Record<string, unknown>;
    const chs = Array.isArray(meta.channels) && meta.channels.length > 0
      ? (meta.channels as string[])
      : ['tienda', 'campo_pos', 'perfil_digital'];

    setFormData({
      name: r.name,
      description: r.description ?? '',
      points_cost: r.points_cost,
      reward_type: r.reward_type,
      active: r.active,
      channels: chs,
      producto_id: typeof meta.producto_id === 'string' ? meta.producto_id : '',
      delivery_mode: typeof meta.delivery_mode === 'string' ? meta.delivery_mode : 'envio',
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
      toast.error('El costo en puntos debe ser mayor a 0');
      return;
    }

    if (!formData.channels || formData.channels.length === 0) {
      toast.error('Debes seleccionar al menos un canal de canje');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: cleanName,
      description: formData.description.trim() || null,
      points_cost: Math.round(Number(formData.points_cost)),
      reward_type: formData.reward_type,
      active: formData.active,
      metadata: {
        ...(editingReward?.metadata ?? {}),
        channels: formData.channels,
        producto_id: formData.producto_id || null,
        delivery_mode: formData.delivery_mode || 'envio',
      },
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

  const toggleCanal = (channelId: string) => {
    setFormData((prev) => {
      const current = prev.channels || [];
      const exists = current.includes(channelId);
      if (exists && current.length === 1) {
        toast.error('La recompensa debe estar asignada a al menos un canal');
        return prev;
      }
      return {
        ...prev,
        channels: exists ? current.filter((c) => c !== channelId) : [...current, channelId],
      };
    });
  };

  const activeCount = rewards.filter((r) => r.active).length;

  return (
    <div className="space-y-6">
      {/* Top Header inside tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Catálogo de Canje (Puntos del Bosque)</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Premios y experiencias canjeables en la billetera y perfil de los Guardianes del Bosque con sus puntos acumulados.
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
          <div className="p-6" aria-busy="true">
            <SkeletonTable rows={4} columns={5} />
          </div>
        ) : rewards.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Gift className="w-10 h-10 text-muted-foreground mx-auto stroke-1" />
            <div className="font-semibold text-foreground">Sin recompensas en catálogo</div>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Configura el primer beneficio o producto exclusivo para que los guardianes puedan canjear con sus puntos.
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
                  <th className="py-3.5 px-4 font-semibold">Canales</th>
                  <th className="py-3.5 px-4 font-semibold">Costo en Puntos</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Estado</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {rewards.map((r) => {
                  const typeConf = REWARD_TYPE_CONFIG[r.reward_type] ?? REWARD_TYPE_CONFIG.exclusive_harvest;
                  const Icon = typeConf.icon;
                  const meta = (r.metadata ?? {}) as Record<string, unknown>;
                  const channels = Array.isArray(meta.channels) && meta.channels.length > 0
                    ? (meta.channels as string[])
                    : ['tienda', 'campo_pos', 'perfil_digital'];

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
                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {channels.map((ch) => {
                            const conf = LOYALTY_CHANNELS.find((c) => c.id === ch);
                            return (
                              <span
                                key={ch}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.62rem] font-medium bg-surface-raised text-muted-foreground border border-border/50"
                              >
                                {conf?.badge ?? ch}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="secondary" className="font-bold tracking-wide">
                          {r.points_cost} pts
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
        <form
          key={editingReward ? editingReward.id : (isModalOpen ? 'create' : 'closed')}
          onSubmit={handleFormSubmit}
          className="p-6 space-y-6"
        >
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
                <Label htmlFor="points_cost">Costo en puntos *</Label>
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
                placeholder="Explica qué recibe el guardián al canjear sus puntos..."
                rows={3}
              />
            </div>

            {/* Canales de Canje */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <Label>Canales de Redención *</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Dónde podrán los miembros del Club solicitar o redimir este beneficio.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {LOYALTY_CHANNELS.map((ch) => {
                  const isChecked = (formData.channels || []).includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleCanal(ch.id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                        isChecked
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border/60 bg-surface-raised/40 text-muted-foreground hover:border-border hover:text-foreground'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                          isChecked
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border/80 bg-background'
                        }`}
                      >
                        {isChecked && <Check size={11} strokeWidth={3} />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground">{ch.label}</div>
                        <div className="text-[0.68rem] text-muted-foreground mt-0.5 leading-tight">
                          {ch.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vinculación física con Catálogo */}
            {formData.reward_type === 'exclusive_harvest' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl border border-primary/20 bg-primary/5">
                <div className="space-y-1.5">
                  <Label htmlFor="producto_id" className="text-xs font-semibold">
                    Producto Físico del Catálogo (Opcional)
                  </Label>
                  <select
                    id="producto_id"
                    value={formData.producto_id}
                    onChange={(e) => setFormData((p) => ({ ...p, producto_id: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-9"
                  >
                    <option value="">Sin vincular a SKU específico</option>
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.formato ? `· ${p.formato}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[0.68rem] text-muted-foreground">
                    Vincula a un producto para descontar stock al canjear.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="delivery_mode" className="text-xs font-semibold">
                    Modalidad de Entrega
                  </Label>
                  <select
                    id="delivery_mode"
                    value={formData.delivery_mode}
                    onChange={(e) => setFormData((p) => ({ ...p, delivery_mode: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-9"
                  >
                    <option value="envio">Despacho Nacional (se suma a encomienda)</option>
                    <option value="presencial_feria">Retiro Presencial en Stand / Feria POS</option>
                    <option value="digital">Acceso Inmediato Digital</option>
                  </select>
                  <p className="text-[0.68rem] text-muted-foreground">
                    Define la logística de entrega para el custodio.
                  </p>
                </div>
              </div>
            )}

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
