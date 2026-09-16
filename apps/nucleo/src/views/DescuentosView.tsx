'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  Percent,
  Globe,
  ShoppingBag,
  Sparkles,
  MapPin,
  Truck,
  Check,
} from 'lucide-react';
import {
  Button,
  Badge,
  Input,
  Label,
  Switch,
  toast,
  ImmersiveModal,
  Spinner,
  formatCLP,
  friendlyError,
} from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { supabase } from '@/lib/supabase';

export type DiscountType = 'porcentaje' | 'monto_fijo' | 'envio_gratis';

export interface DiscountChannelOption {
  id: string;
  label: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const DISCOUNT_CHANNELS: DiscountChannelOption[] = [
  { id: 'web', label: 'Tienda Online (Web D2C)', description: 'Carro de compra y checkout oficial', badge: 'Web D2C', icon: Globe },
  { id: 'feria', label: 'Feria Apícola / POS Campo', description: 'Venta presencial directa en feria', badge: 'Feria POS', icon: ShoppingBag },
  { id: 'club', label: 'Club Legado', description: 'Suscriptores y guardianes de colmenas', badge: 'Club', icon: Sparkles },
  { id: 'local', label: 'Venta Directa / Local', description: 'Sala de venta o retiro en apiario', badge: 'Local', icon: MapPin },
  { id: 'delivery', label: 'Despacho Especial', description: 'Repartos y pedidos directos', badge: 'Despacho', icon: Truck },
];

export interface DescuentoRow {
  id: string;
  codigo: string;
  tipo: DiscountType;
  valor: number;
  valor_minimo_compra: number | null;
  max_usos: number | null;
  usos_actuales: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  descripcion: string | null;
  canales_aplicables?: string[] | null;
  created_at: string;
}

interface DescuentoFormData {
  codigo: string;
  tipo: DiscountType;
  valor: number;
  valor_minimo_compra: string;
  max_usos: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  descripcion: string;
  canales_aplicables: string[];
}

function getDefaultDates() {
  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 3);

  return {
    inicio: now.toISOString().slice(0, 10),
    fin: nextMonth.toISOString().slice(0, 10),
  };
}

export function DescuentosView() {
  const [descuentos, setDescuentos] = useState<DescuentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDescuento, setEditingDescuento] = useState<DescuentoRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultDates = useMemo(() => getDefaultDates(), []);

  const [formData, setFormData] = useState<DescuentoFormData>({
    codigo: '',
    tipo: 'porcentaje',
    valor: 10,
    valor_minimo_compra: '',
    max_usos: '',
    fecha_inicio: defaultDates.inicio,
    fecha_fin: defaultDates.fin,
    activo: true,
    descripcion: '',
    canales_aplicables: ['web', 'feria'],
  });

  const fetchDescuentos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('descuentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDescuentos((data ?? []) as DescuentoRow[]);
    } catch (err) {
      toast.error('Error al cargar cupones', {
        description: friendlyError(err, 'No se pudo sincronizar la lista de cupones'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDescuentos();
  }, []);

  const handleCreateNew = () => {
    setEditingDescuento(null);
    setFormData({
      codigo: '',
      tipo: 'porcentaje',
      valor: 10,
      valor_minimo_compra: '',
      max_usos: '',
      fecha_inicio: defaultDates.inicio,
      fecha_fin: defaultDates.fin,
      activo: true,
      descripcion: '',
      canales_aplicables: ['web', 'feria'],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (d: DescuentoRow) => {
    setEditingDescuento(d);
    setFormData({
      codigo: d.codigo,
      tipo: d.tipo,
      valor: Number(d.valor),
      valor_minimo_compra: d.valor_minimo_compra ? String(d.valor_minimo_compra) : '',
      max_usos: d.max_usos ? String(d.max_usos) : '',
      fecha_inicio: d.fecha_inicio ? d.fecha_inicio.slice(0, 10) : defaultDates.inicio,
      fecha_fin: d.fecha_fin ? d.fecha_fin.slice(0, 10) : defaultDates.fin,
      activo: d.activo,
      descripcion: d.descripcion ?? '',
      canales_aplicables: d.canales_aplicables && d.canales_aplicables.length > 0 ? d.canales_aplicables : ['web', 'feria'],
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (d: DescuentoRow) => {
    const nextState = !d.activo;
    setDescuentos((prev) =>
      prev.map((item) => (item.id === d.id ? { ...item, activo: nextState } : item)),
    );

    try {
      const { error } = await supabase
        .from('descuentos')
        .update({ activo: nextState, updated_at: new Date().toISOString() })
        .eq('id', d.id);

      if (error) throw error;
      toast.success(nextState ? 'Cupón activado' : 'Cupón pausado');
    } catch (err) {
      setDescuentos((prev) =>
        prev.map((item) => (item.id === d.id ? { ...item, activo: d.activo } : item)),
      );
      toast.error('Error al actualizar estado', {
        description: friendlyError(err, 'No se pudo guardar el cambio'),
      });
    }
  };

  const handleDelete = async (d: DescuentoRow) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el cupón "${d.codigo}"?`)) return;

    try {
      const { error } = await supabase.from('descuentos').delete().eq('id', d.id);
      if (error) throw error;
      setDescuentos((prev) => prev.filter((item) => item.id !== d.id));
      toast.success('Cupón eliminado correctamente');
    } catch (err) {
      toast.error('Error al eliminar cupón', {
        description: friendlyError(err, 'No se pudo eliminar el cupón'),
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formData.codigo.trim().toUpperCase();
    if (!cleanCode) {
      toast.error('El código es obligatorio');
      return;
    }

    if (formData.tipo === 'porcentaje' && (formData.valor <= 0 || formData.valor > 100)) {
      toast.error('El porcentaje debe estar entre 1% y 100%');
      return;
    }

    if (formData.tipo === 'monto_fijo' && formData.valor <= 0) {
      toast.error('El monto debe ser mayor a $0');
      return;
    }

    if (!formData.canales_aplicables || formData.canales_aplicables.length === 0) {
      toast.error('Debes seleccionar al menos un canal de aplicación para el cupón');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      codigo: cleanCode,
      tipo: formData.tipo,
      valor: formData.tipo === 'envio_gratis' ? 0 : Number(formData.valor),
      valor_minimo_compra: formData.valor_minimo_compra ? parseInt(formData.valor_minimo_compra, 10) : null,
      max_usos: formData.max_usos ? parseInt(formData.max_usos, 10) : null,
      fecha_inicio: new Date(formData.fecha_inicio).toISOString(),
      fecha_fin: new Date(formData.fecha_fin + 'T23:59:59').toISOString(),
      activo: formData.activo,
      descripcion: formData.descripcion.trim() || null,
      canales_aplicables: formData.canales_aplicables,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingDescuento) {
        const { error } = await supabase
          .from('descuentos')
          .update(payload)
          .eq('id', editingDescuento.id);

        if (error) throw error;
        toast.success('Cupón actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('descuentos')
          .insert({
            ...payload,
            usos_actuales: 0,
          });

        if (error) throw error;
        toast.success('Cupón creado exitosamente');
      }

      setIsModalOpen(false);
      await fetchDescuentos();
    } catch (err) {
      toast.error('Error al guardar cupón', {
        description: friendlyError(err, 'No se pudo registrar el cupón en el sistema'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCanal = (channelId: string) => {
    setFormData((prev) => {
      const current = prev.canales_aplicables || [];
      const exists = current.includes(channelId);
      if (exists && current.length === 1) {
        toast.error('El cupón debe estar asignado a al menos un canal');
        return prev;
      }
      return {
        ...prev,
        canales_aplicables: exists
          ? current.filter((c) => c !== channelId)
          : [...current, channelId],
      };
    });
  };

  const activeCount = descuentos.filter((d) => d.activo).length;
  const totalUses = descuentos.reduce((acc, d) => acc + (d.usos_actuales || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ViewShell
        eyebrow="Mercado · Beneficios"
        title="Cupones y Descuentos"
        subtitle="Códigos promocionales para checkout, campañas y retribución especial. Se aplican automáticamente según reglas de compra."
        icon={<Percent size={20} />}
        actions={
          <Button type="button" onClick={handleCreateNew} className="inline-flex items-center gap-2">
            <Plus size={16} />
            Nuevo Cupón
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Total Cupones
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {descuentos.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Registrados en el sistema
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Cupones Activos
          </div>
          <div className="text-2xl font-bold font-mono text-success mt-1">
            {activeCount}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Habilitados para uso
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Usos Totales
          </div>
          <div className="text-2xl font-bold font-mono text-primary mt-1">
            {totalUses}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Canjeados por clientes
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Spinner className="w-4 h-4" /> Cargando cupones...
          </div>
        ) : descuentos.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Tag className="w-10 h-10 text-muted-foreground mx-auto stroke-1" />
            <div className="font-semibold text-foreground">Sin cupones creados</div>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Crea tu primer cupón para promociones en tienda, eventos o beneficios a clientes.
            </p>
            <Button type="button" onClick={handleCreateNew} className="mt-2 inline-flex items-center gap-2">
              <Plus size={16} />
              Crear primer cupón
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/40 bg-surface-raised/60 text-[0.68rem] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Código</th>
                  <th className="py-3.5 px-4 font-semibold">Beneficio</th>
                  <th className="py-3.5 px-4 font-semibold">Canales</th>
                  <th className="py-3.5 px-4 font-semibold">Compra Mínima</th>
                  <th className="py-3.5 px-4 font-semibold">Usos</th>
                  <th className="py-3.5 px-4 font-semibold">Vigencia</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Estado</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {descuentos.map((d) => {
                  const now = new Date();
                  const end = new Date(d.fecha_fin);
                  const isExpired = now > end;
                  const isExhausted = d.max_usos != null && d.usos_actuales >= d.max_usos;
                  const channels = d.canales_aplicables && d.canales_aplicables.length > 0
                    ? d.canales_aplicables
                    : ['web', 'feria'];

                  return (
                    <tr key={d.id} className="hover:bg-surface-raised/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{d.codigo}</span>
                          {d.descripcion && (
                            <span className="text-xs font-sans text-muted-foreground font-normal truncate max-w-[150px]">
                              · {d.descripcion}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-foreground">
                        {d.tipo === 'porcentaje' && (
                          <Badge variant="secondary" className="font-semibold">
                            {d.valor}% OFF
                          </Badge>
                        )}
                        {d.tipo === 'monto_fijo' && (
                          <Badge variant="secondary" className="font-semibold">
                            -{formatCLP(Number(d.valor))}
                          </Badge>
                        )}
                        {d.tipo === 'envio_gratis' && (
                          <Badge variant="success" className="font-semibold">
                            Despacho Gratis
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {channels.map((ch) => {
                            const conf = DISCOUNT_CHANNELS.find((c) => c.id === ch);
                            return (
                              <span
                                key={ch}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.65rem] font-medium bg-surface-raised text-muted-foreground border border-border/50"
                              >
                                {conf?.badge ?? ch}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground text-xs">
                        {d.valor_minimo_compra ? formatCLP(d.valor_minimo_compra) : 'Sin mínimo'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{d.usos_actuales}</span>
                        {d.max_usos != null ? ` / ${d.max_usos}` : ' / ∞'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Hasta {new Date(d.fecha_fin).toLocaleDateString('es-CL')}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 text-[0.7rem] text-destructive uppercase tracking-wider font-semibold">
                            <AlertTriangle size={12} /> Vencido
                          </span>
                        ) : isExhausted ? (
                          <span className="inline-flex items-center gap-1 text-[0.7rem] text-muted-foreground uppercase tracking-wider font-semibold">
                            <XCircle size={12} /> Agotado
                          </span>
                        ) : d.activo ? (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(d)}
                            className="inline-flex items-center gap-1 text-[0.7rem] text-success uppercase tracking-wider font-semibold hover:opacity-80 transition-opacity"
                            title="Click para pausar"
                          >
                            <CheckCircle2 size={12} /> Activo
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(d)}
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
                            onClick={() => handleEdit(d)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-raised rounded-lg transition-colors"
                            title="Editar cupón"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(d)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Eliminar cupón"
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

      <ImmersiveModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eyebrow="Mercado · Beneficios"
        title={editingDescuento ? `Editar cupón ${editingDescuento.codigo}` : 'Nuevo Cupón de Descuento'}
        size="lg"
      >
        <form
          key={editingDescuento ? editingDescuento.id : (isModalOpen ? 'create' : 'closed')}
          onSubmit={handleFormSubmit}
          className="p-6 space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="codigo">Código del cupón *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData((p) => ({ ...p, codigo: e.target.value.toUpperCase() }))}
                placeholder="EJ: BIENVENIDO10, FERIA2026"
                className="font-mono uppercase font-bold tracking-wider"
                required
              />
              <p className="text-xs text-muted-foreground">
                Se guardará en mayúsculas automáticamente.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de beneficio *</Label>
              <select
                id="tipo"
                value={formData.tipo}
                onChange={(e) => setFormData((p) => ({ ...p, tipo: e.target.value as DiscountType }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-10"
              >
                <option value="porcentaje">Porcentaje de descuento (%)</option>
                <option value="monto_fijo">Monto fijo en pesos ($ CLP)</option>
                <option value="envio_gratis">Despacho gratis</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">
                {formData.tipo === 'porcentaje'
                  ? 'Porcentaje (%) *'
                  : formData.tipo === 'monto_fijo'
                    ? 'Monto a descontar (CLP) *'
                    : 'Valor'}
              </Label>
              <Input
                id="valor"
                type="number"
                disabled={formData.tipo === 'envio_gratis'}
                value={formData.tipo === 'envio_gratis' ? 0 : formData.valor}
                onChange={(e) => setFormData((p) => ({ ...p, valor: Number(e.target.value) }))}
                min={1}
                max={formData.tipo === 'porcentaje' ? 100 : undefined}
                required={formData.tipo !== 'envio_gratis'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_minimo_compra">Compra mínima requerida (CLP)</Label>
              <Input
                id="valor_minimo_compra"
                type="number"
                placeholder="Ej: 25000 (dejar vacío si no aplica)"
                value={formData.valor_minimo_compra}
                onChange={(e) => setFormData((p) => ({ ...p, valor_minimo_compra: e.target.value }))}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_usos">Límite de usos totales</Label>
              <Input
                id="max_usos"
                type="number"
                placeholder="Ej: 50 (dejar vacío para usos ilimitados)"
                value={formData.max_usos}
                onChange={(e) => setFormData((p) => ({ ...p, max_usos: e.target.value }))}
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_inicio">Válido desde *</Label>
              <Input
                id="fecha_inicio"
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => setFormData((p) => ({ ...p, fecha_inicio: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_fin">Válido hasta *</Label>
              <Input
                id="fecha_fin"
                type="date"
                value={formData.fecha_fin}
                onChange={(e) => setFormData((p) => ({ ...p, fecha_fin: e.target.value }))}
                required
              />
            </div>

            {/* Canales de Aplicación */}
            <div className="space-y-2 sm:col-span-2 pt-2 border-t border-border/40">
              <Label>Canales y Destinos de Aplicación *</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Selecciona dónde los clientes y operadores podrán hacer válido este cupón.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DISCOUNT_CHANNELS.map((ch) => {
                  const Icon = ch.icon;
                  const isChecked = (formData.canales_aplicables || []).includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleCanal(ch.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        isChecked
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border/60 bg-surface-raised/40 text-muted-foreground hover:border-border hover:text-foreground'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                          isChecked
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border/80 bg-background'
                        }`}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Icon size={13} className="text-primary" />
                          <span>{ch.label}</span>
                        </div>
                        <div className="text-[0.7rem] text-muted-foreground mt-0.5 leading-snug">
                          {ch.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="descripcion">Descripción o referencia interna</Label>
              <Input
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData((p) => ({ ...p, descripcion: e.target.value }))}
                placeholder="Ej: Campaña lanzamiento miel de Ulmo en feria"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-border/40 bg-surface-raised/40 p-3">
              <div>
                <div className="text-sm font-medium text-foreground">Cupón activo</div>
                <div className="text-xs text-muted-foreground">
                  Permite a los usuarios ingresar este código en la pantalla de pago o POS.
                </div>
              </div>
              <Switch
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData((p) => ({ ...p, activo: checked }))}
              />
            </div>

            {/* Live Preview Card */}
            <div className="sm:col-span-2 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[0.7rem] uppercase tracking-wider font-semibold text-primary">
                  Previsualización del Cupón
                </span>
                <Badge variant={formData.activo ? 'success' : 'secondary'} className="text-[0.65rem]">
                  {formData.activo ? 'Habilitado' : 'Pausado'}
                </Badge>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="font-mono font-bold text-lg text-foreground tracking-wider">
                  {formData.codigo || 'CODIGO-EJEMPLO'}
                </span>
                <span className="font-semibold text-primary text-sm">
                  {formData.tipo === 'porcentaje'
                    ? `${formData.valor}% de descuento`
                    : formData.tipo === 'monto_fijo'
                      ? `-${formatCLP(Number(formData.valor))}`
                      : 'Despacho sin costo'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 border-t border-border/30">
                <span>
                  {formData.valor_minimo_compra ? `Mínimo: ${formatCLP(Number(formData.valor_minimo_compra))}` : 'Sin monto mínimo'}
                </span>
                <span>·</span>
                <span>Válido hasta {formData.fecha_fin || 'fecha límite'}</span>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {(formData.canales_aplicables || []).map((ch) => {
                  const conf = DISCOUNT_CHANNELS.find((c) => c.id === ch);
                  return (
                    <span
                      key={ch}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-medium bg-background border border-primary/30 text-foreground"
                    >
                      {conf?.badge ?? ch}
                    </span>
                  );
                })}
              </div>
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
              {isSubmitting ? <Spinner className="w-4 h-4" /> : editingDescuento ? 'Guardar Cambios' : 'Crear Cupón'}
            </Button>
          </div>
        </form>
      </ImmersiveModal>
    </div>
  );
}
