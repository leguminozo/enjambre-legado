'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Users,
  Check,
  Package,
  Truck,
  Sparkles,
  Store,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  Badge,
  Button,
  ImmersiveModal,
  EmptyState,
  ViewLoading,
  friendlyError,
  toast,
  cn,
} from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';

export interface RolPersonalizado {
  id: string;
  empresa_id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  color: string;
  modulos: string[];
  activo: boolean;
  created_at: string;
  usuarios_asignados?: number;
}

interface ModuloOption {
  key: string;
  label: string;
  description: string;
}

interface ModuloGroup {
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  options: ModuloOption[];
}

const MODULO_GROUPS: ModuloGroup[] = [
  {
    name: 'Bodega & Producción',
    icon: Package,
    options: [
      { key: 'inventario', label: 'Conteo e Inventario', description: 'Registro de stock físico y ajustes de bodega' },
      { key: 'lotes', label: 'Lotes y Trazabilidad', description: 'Revisión y cierre de lotes productivos' },
      { key: 'recoleccion', label: 'Registro de Recolección', description: 'Ingreso de néctar y miel del bosque nativo' },
      { key: 'alambique', label: 'Alambique & Destilaciones', description: 'Bitácora y producción de hidrolatos' },
      { key: 'infusiones', label: 'Producción de Infusiones', description: 'Materia prima, deshidratado y recetas' },
    ],
  },
  {
    name: 'Logística & Despachos',
    icon: Truck,
    options: [
      { key: 'envios', label: 'Envíos y Despachos', description: 'Preparación de bultos y guías de transporte' },
      { key: 'centros-stock', label: 'Centros de Distribución', description: 'Inventario en bodegas satélite y packing' },
      { key: 'proveedores', label: 'Proveedores Logísticos', description: 'Directorio de transportistas y centros' },
    ],
  },
  {
    name: 'Entorno Apícola',
    icon: Sparkles,
    options: [
      { key: 'colmenas', label: 'Colmenas y Apiarios', description: 'Fichas técnicas y registro de unidades' },
      { key: 'cuaderno-campo', label: 'Cuaderno de Campo', description: 'Bitácora de visitas y revisiones sanitarias' },
      { key: 'ciclo-bosque', label: 'Calendario Apícola', description: 'Cronograma estacional y floraciones' },
    ],
  },
  {
    name: 'Comercial & Terreno',
    icon: Store,
    options: [
      { key: 'monitor-feria', label: 'Monitor de Feria POS', description: 'Supervisión en vivo de ventas en puntos itinerantes' },
      { key: 'crm', label: 'Directorio de Clientes CRM', description: 'Consulta de perfiles y notas de relación' },
      { key: 'catalogo', label: 'Catálogo de Productos', description: 'Consulta de fichas comerciales y precios' },
    ],
  },
];

const COLOR_OPTIONS = [
  { id: 'amber', label: 'Ámbar', class: 'border-amber-500/30 text-amber-300 bg-amber-500/15' },
  { id: 'emerald', label: 'Esmeralda', class: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/15' },
  { id: 'blue', label: 'Zafiro', class: 'border-sky-500/30 text-sky-300 bg-sky-500/15' },
  { id: 'purple', label: 'Amatista', class: 'border-purple-500/30 text-purple-300 bg-purple-500/15' },
  { id: 'rose', label: 'Cobre', class: 'border-rose-500/30 text-rose-300 bg-rose-500/15' },
];

export function RolesPersonalizadosTab() {
  const apiFetch = useApiFetch();
  const [roles, setRoles] = useState<RolPersonalizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RolPersonalizado | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formColor, setFormColor] = useState('amber');
  const [formModulos, setFormModulos] = useState<string[]>([]);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/roles-personalizados');
      if (!res.ok) throw new Error('Error al cargar roles');
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormNombre('');
    setFormDescripcion('');
    setFormColor('amber');
    setFormModulos(['inventario', 'lotes']);
    setModalOpen(true);
  };

  const handleOpenEdit = (r: RolPersonalizado) => {
    setEditingRole(r);
    setFormNombre(r.nombre);
    setFormDescripcion(r.descripcion || '');
    setFormColor(r.color || 'amber');
    setFormModulos(r.modulos || []);
    setModalOpen(true);
  };

  const handleToggleModulo = (key: string) => {
    setFormModulos((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSaveRole = async () => {
    if (!formNombre.trim()) {
      toast.error('El nombre del rol es obligatorio');
      return;
    }
    if (formModulos.length === 0) {
      toast.error('Debe seleccionar al menos un módulo permitido');
      return;
    }

    setSaving(true);
    try {
      if (editingRole) {
        const res = await apiFetch(`/api/admin/roles-personalizados/${editingRole.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: formNombre.trim(),
            descripcion: formDescripcion.trim() || undefined,
            color: formColor,
            modulos: formModulos,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Error al actualizar el rol');
        }
        toast.success(`Rol «${formNombre}» actualizado`);
      } else {
        const res = await apiFetch('/api/admin/roles-personalizados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: formNombre.trim(),
            descripcion: formDescripcion.trim() || undefined,
            color: formColor,
            modulos: formModulos,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Error al crear el rol');
        }
        toast.success(`Rol «${formNombre}» creado con éxito`);
      }
      setModalOpen(false);
      void fetchRoles();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (r: RolPersonalizado) => {
    if (r.usuarios_asignados && r.usuarios_asignados > 0) {
      toast.error(
        `No se puede eliminar «${r.nombre}» porque tiene ${r.usuarios_asignados} cuenta(s) asignada(s). Reasigna los usuarios primero.`
      );
      return;
    }

    if (!confirm(`¿Confirma eliminar el rol «${r.nombre}»?`)) return;

    setDeletingId(r.id);
    try {
      const res = await apiFetch(`/api/admin/roles-personalizados/${r.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Error al eliminar el rol');
      }
      toast.success(`Rol «${r.nombre}» eliminado`);
      void fetchRoles();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            Roles y Perfiles de Acceso Estructurales
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Crea roles a medida para colaboradores (ej. ayudantes de inventario o bodega) seleccionando solo los módulos permitidos.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          className="gap-1.5 text-xs font-semibold self-start sm:self-auto"
        >
          <Plus size={14} />
          Crear nuevo rol
        </Button>
      </div>

      {/* Roles grid */}
      {loading ? (
        <div className="py-12">
          <ViewLoading variant="view" label="Cargando roles personalizados..." />
        </div>
      ) : roles.length === 0 ? (
        <EmptyState
          title="No hay roles personalizados"
          description="Crea un perfil de acceso a medida para delegar tareas operativas en bodega, logística o terreno."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r) => {
            const colorClass =
              COLOR_OPTIONS.find((c) => c.id === r.color)?.class ||
              COLOR_OPTIONS[0].class;

            return (
              <div
                key={r.id}
                className="rounded-xl border border-border/70 bg-card p-5 space-y-4 hover:border-border transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-xs px-2.5 py-0.5 rounded-full font-medium border',
                            colorClass
                          )}
                        >
                          {r.nombre}
                        </span>
                      </div>
                      {r.descripcion && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {r.descripcion}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted/60 transition-colors"
                        title="Editar rol"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => void handleDeleteRole(r)}
                        disabled={deletingId === r.id}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10 transition-colors"
                        title="Eliminar rol"
                      >
                        {deletingId === r.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Modules badges */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                      Módulos autorizados ({r.modulos?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {r.modulos?.map((mod) => (
                        <span
                          key={mod}
                          className="text-[11px] px-2 py-0.5 rounded bg-muted/70 text-muted-foreground border border-border/40 font-mono"
                        >
                          {mod}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer with user count */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users size={13} className="text-primary" />
                    <strong>{r.usuarios_asignados ?? 0}</strong> {r.usuarios_asignados === 1 ? 'persona asignada' : 'personas asignadas'}
                  </span>
                  <button
                    onClick={() => handleOpenEdit(r)}
                    className="text-primary hover:underline text-[11px] font-medium"
                  >
                    Configurar módulos →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar Rol */}
      <ImmersiveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRole ? `Configurar rol «${editingRole.nombre}»` : 'Crear nuevo rol personalizado'}
      >
        <div className="py-4 space-y-5">
          {/* Nombre y descripción */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Nombre del rol <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="ej. Ayudante de Inventario, Asistente de Despacho"
                className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Descripción operativa
              </label>
              <input
                type="text"
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                placeholder="ej. Conteo físico de stock, recepción de materias primas y revisión de lotes"
                className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Distintivo visual
              </label>
              <div className="flex items-center gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFormColor(c.id)}
                    className={cn(
                      'text-xs px-3 py-1 rounded-full border transition-all',
                      c.class,
                      formColor === c.id
                        ? 'ring-2 ring-primary ring-offset-1 ring-offset-background font-semibold scale-105'
                        : 'opacity-70 hover:opacity-100'
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Módulos seleccionables agrupados */}
          <div className="space-y-4 pt-3 border-t border-border">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Selección de Módulos Autorizados
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Los colaboradores con este rol solo podrán visualizar y acceder a los módulos marcados a continuación.
              </p>
            </div>

            <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
              {MODULO_GROUPS.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.name} className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <GroupIcon size={14} className="text-primary" />
                      <span>{group.name}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.options.map((opt) => {
                        const isChecked = formModulos.includes(opt.key);
                        return (
                          <label
                            key={opt.key}
                            onClick={() => handleToggleModulo(opt.key)}
                            className={cn(
                              'flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors select-none text-left',
                              isChecked
                                ? 'bg-primary/10 border-primary/40 text-foreground'
                                : 'bg-card border-border/50 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                            )}
                          >
                            <div
                              className={cn(
                                'w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center border transition-colors',
                                isChecked
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-border bg-background'
                              )}
                            >
                              {isChecked && <Check size={11} strokeWidth={3} />}
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-medium leading-tight">
                                {opt.label}
                              </p>
                              <p className="text-[10px] text-muted-foreground leading-tight">
                                {opt.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Aviso de seguridad Zero Trust */}
          <div className="p-3 rounded-lg bg-surface-sunken border border-border/40 text-[11px] text-muted-foreground flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Protección financiera activa:</strong> Las áreas críticas (Contabilidad, SII, Conciliación Bancaria y Administración de Cuentas) están excluidas de los roles delegables y requieren credenciales de Administrador.
            </span>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleSaveRole()}
              disabled={saving || !formNombre.trim() || formModulos.length === 0}
              className="gap-1.5 font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Guardando...
                </>
              ) : editingRole ? (
                'Guardar cambios'
              ) : (
                'Crear rol'
              )}
            </Button>
          </div>
        </div>
      </ImmersiveModal>
    </div>
  );
}
