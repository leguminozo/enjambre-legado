'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Shield,
  Loader2,
  AlertTriangle,
  X,
  Check,
  User,
  ShoppingBag,
  Store,
  Crown,
  RefreshCw,
  Wrench,
} from 'lucide-react';
import {
  Badge,
  Button,
  ImmersiveModal,
  EmptyState,
  ViewLoading,
  formatDateShort,
  friendlyError,
  toast,
  cn,
} from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  INVITABLE_PLATFORM_ROLES,
  INVITABLE_ROLE_META,
  type InvitablePlatformRole,
} from '@/lib/invitation-roles';

export interface PerfilAccesoMeta {
  id: string;
  nombre: string;
  slug: string;
  modulos: string[];
  color: string;
}

export interface UsuarioCuenta {
  id: string;
  email: string;
  full_name: string | null;
  role: InvitablePlatformRole;
  perfil_acceso_id?: string | null;
  perfil_acceso?: PerfilAccesoMeta | null;
  nivel_guardian?: string | null;
  avatar_url?: string | null;
  created_at: string;
  commercial_roles: string[];
}

interface Props {
  onRequestCrearCuenta?: () => void;
  onNavigateToRoles?: () => void;
}

const FILTER_ROLES: { id: string; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'colaborador', label: 'Roles a Medida' },
  { id: 'cliente', label: 'Clientes Tienda' },
  { id: 'operador', label: 'Operadores Bodega' },
  { id: 'apicultor', label: 'Apicultores Patio' },
  { id: 'rep_ventas', label: 'Feria POS' },
  { id: 'creador', label: 'Creadores' },
  { id: 'admin', label: 'Administradores' },
];

const COMMERCIAL_ROLE_LABELS: Record<string, { label: string; color: string }> = {
  comprador: { label: 'Comprador', color: 'bg-muted text-muted-foreground' },
  suscriptor: { label: 'Club Legado', color: 'bg-primary/20 text-primary border-primary/30' },
  revendedor: { label: 'Revendedor B2B', color: 'bg-accent/20 text-accent-foreground border-accent/30' },
  embajador: { label: 'Embajador', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
};

export function DirectorioCuentasTab({ onRequestCrearCuenta, onNavigateToRoles }: Props) {
  const apiFetch = useApiFetch();
  const [usuarios, setUsuarios] = useState<UsuarioCuenta[]>([]);
  const [rolesPersonalizados, setRolesPersonalizados] = useState<PerfilAccesoMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('todos');

  // Modal de edición
  const [editingUser, setEditingUser] = useState<UsuarioCuenta | null>(null);
  const [targetRole, setTargetRole] = useState<InvitablePlatformRole>('cliente');
  const [targetPerfilAccesoId, setTargetPerfilAccesoId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchDirectorio = useCallback(async () => {
    setLoading(true);
    try {
      const [usrRes, rolesRes] = await Promise.all([
        apiFetch('/api/admin/usuarios?limit=200'),
        apiFetch('/api/admin/roles-personalizados'),
      ]);

      if (!usrRes.ok) throw new Error('Error al consultar usuarios');
      const usrData = await usrRes.json();
      setUsuarios((usrData.usuarios as UsuarioCuenta[]) || []);

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRolesPersonalizados(rolesData.roles || []);
      }
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void fetchDirectorio();
  }, [fetchDirectorio]);

  const filteredUsuarios = useMemo(() => {
    const q = search.trim().toLowerCase();
    return usuarios.filter((u) => {
      const matchesSearch =
        !q ||
        (u.full_name?.toLowerCase().includes(q) ?? false) ||
        (u.email?.toLowerCase().includes(q) ?? false) ||
        (u.perfil_acceso?.nombre.toLowerCase().includes(q) ?? false);

      const matchesRole =
        selectedRoleFilter === 'todos' || u.role === selectedRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [usuarios, search, selectedRoleFilter]);

  const handleOpenEdit = (u: UsuarioCuenta) => {
    setEditingUser(u);
    setTargetRole(u.role);
    setTargetPerfilAccesoId(u.perfil_acceso_id || null);
  };

  const handleSelectCustomRole = (r: PerfilAccesoMeta) => {
    setTargetRole('colaborador');
    setTargetPerfilAccesoId(r.id);
  };

  const handleSelectStandardRole = (r: InvitablePlatformRole) => {
    setTargetRole(r);
    setTargetPerfilAccesoId(null);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/usuarios/${editingUser.id}/rol`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: targetRole,
          perfil_acceso_id: targetPerfilAccesoId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Error al actualizar rol');
      }

      toast.success(
        targetRole === 'colaborador' && targetPerfilAccesoId
          ? `Perfil asignado correctamente a ${editingUser.full_name || editingUser.email}`
          : `Rol actualizado a ${targetRole} para ${editingUser.full_name || editingUser.email}`
      );
      setEditingUser(null);
      void fetchDirectorio();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  // Conteo por categoría
  const counts = useMemo(() => {
    const map: Record<string, number> = { todos: usuarios.length };
    for (const u of usuarios) {
      map[u.role] = (map[u.role] || 0) + 1;
    }
    return map;
  }, [usuarios]);

  return (
    <div className="space-y-6">
      {/* Barra superior de control */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo o rol..."
            className="w-full text-xs pl-9 pr-8 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchDirectorio()}
            disabled={loading}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </Button>

          {onRequestCrearCuenta && (
            <Button
              variant="primary"
              size="sm"
              onClick={onRequestCrearCuenta}
              className="gap-1.5 text-xs font-semibold"
            >
              + Nueva cuenta
            </Button>
          )}
        </div>
      </div>

      {/* Chips de filtro por rol */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_ROLES.map((f) => {
          const isActive = selectedRoleFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setSelectedRoleFilter(f.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-border/40'
              )}
            >
              <span>{f.label}</span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-background text-muted-foreground'
                )}
              >
                {counts[f.id] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Listado de cuentas */}
      {loading ? (
        <div className="py-12">
          <ViewLoading variant="view" label="Cargando directorio de cuentas..." />
        </div>
      ) : filteredUsuarios.length === 0 ? (
        <EmptyState
          title={search ? 'Sin coincidencias' : 'No hay cuentas en esta categoría'}
          description={
            search
              ? `No se encontraron cuentas con el término «${search}».`
              : 'No hay usuarios registrados con el rol seleccionado actualmente.'
          }
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Rol en Núcleo / Ecosistema</th>
                  <th className="py-3 px-4">Vínculo Comercial</th>
                  <th className="py-3 px-4">Registrado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsuarios.map((u) => {
                  const isColaborador = u.role === 'colaborador' && u.perfil_acceso;
                  const isOperador = u.role === 'operador';
                  const isAdmin = u.role === 'admin';
                  const isApicultor = u.role === 'apicultor';

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      {/* Nombre y correo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold uppercase',
                              isAdmin
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : isColaborador || isOperador
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {u.full_name ? u.full_name.charAt(0) : u.email.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {u.full_name || 'Sin nombre registrado'}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Rol principal */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isColaborador ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-500/30 bg-emerald-500/15 text-emerald-300">
                              <Wrench size={11} />
                              {u.perfil_acceso?.nombre}
                            </span>
                          ) : (
                            <span
                              className={cn(
                                'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                                isAdmin
                                  ? 'border-amber-500/30 bg-amber-500/15 text-amber-300 font-semibold'
                                  : isOperador
                                  ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                                  : isApicultor
                                  ? 'border-yellow-500/30 bg-yellow-500/15 text-yellow-300'
                                  : u.role === 'rep_ventas'
                                  ? 'border-blue-500/30 bg-blue-500/15 text-blue-300'
                                  : u.role === 'creador'
                                  ? 'border-purple-500/30 bg-purple-500/15 text-purple-300'
                                  : 'border-border bg-muted/40 text-muted-foreground'
                              )}
                            >
                              {INVITABLE_ROLE_META[u.role]?.label || u.role}
                            </span>
                          )}

                          {isColaborador && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ({u.perfil_acceso?.modulos.length || 0} módulos)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Vínculo comercial tienda */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          {u.commercial_roles.length === 0 ? (
                            <span className="text-[11px] text-muted-foreground/70 italic">
                              Comprador estándar
                            </span>
                          ) : (
                            u.commercial_roles.map((cr) => {
                              const meta = COMMERCIAL_ROLE_LABELS[cr];
                              return (
                                <span
                                  key={cr}
                                  className={cn(
                                    'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                                    meta?.color || 'bg-muted text-muted-foreground'
                                  )}
                                >
                                  {meta?.label || cr}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>

                      {/* Fecha de registro */}
                      <td className="py-3 px-4 text-muted-foreground text-[11px] whitespace-nowrap">
                        {formatDateShort(u.created_at)}
                      </td>

                      {/* Acción de reasignación */}
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(u)}
                          className="text-xs h-7 px-2.5 hover:bg-muted/80"
                        >
                          Asignar rol →
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de reasignación y ascenso de rol */}
      {editingUser && (
        <ImmersiveModal
          open={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          title={`Asignar rol a «${editingUser.full_name || editingUser.email}»`}
        >
          <div className="py-4 space-y-5">
            {/* Header del usuario */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-sunken border border-border/60">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {editingUser.full_name || 'Sin nombre'}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {editingUser.email}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-muted-foreground block">
                  Rol actual
                </span>
                <span className="text-xs font-medium text-foreground">
                  {editingUser.perfil_acceso?.nombre || editingUser.role}
                </span>
              </div>
            </div>

            {/* SECCIÓN 1: Roles Personalizados (A Medida) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Wrench size={13} />
                  Roles a Medida Creados en Núcleo
                </label>
                {onNavigateToRoles && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null);
                      onNavigateToRoles();
                    }}
                    className="text-[11px] text-primary hover:underline"
                  >
                    + Gestionar o crear roles
                  </button>
                )}
              </div>

              {rolesPersonalizados.length === 0 ? (
                <div className="p-3 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                  Aún no hay roles personalizados creados. Puedes crear uno desde la pestaña «Roles y Permisos».
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1">
                  {rolesPersonalizados.map((r) => {
                    const isSelected =
                      targetRole === 'colaborador' && targetPerfilAccesoId === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleSelectCustomRole(r)}
                        className={cn(
                          'text-left p-2.5 rounded-xl border transition-all flex items-start gap-3',
                          isSelected
                            ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary/30'
                            : 'bg-card border-border/70 hover:bg-surface-raised hover:border-border'
                        )}
                      >
                        <div className="pt-0.5">
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full border flex items-center justify-center',
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground'
                            )}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-foreground">
                              {r.nombre}
                            </p>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {r.modulos.length} módulos
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {r.modulos.map((m) => (
                              <span
                                key={m}
                                className="text-[10px] px-1.5 py-0.2 rounded bg-muted/80 text-muted-foreground font-mono"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECCIÓN 2: Roles Estándar de Plataforma */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                O Selecciona un Rol de Plataforma Estándar
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                {INVITABLE_PLATFORM_ROLES.filter((r) => r !== 'colaborador').map((r) => {
                  const meta = INVITABLE_ROLE_META[r];
                  const isSelected = targetRole === r && targetPerfilAccesoId === null;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleSelectStandardRole(r)}
                      className={cn(
                        'text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5',
                        isSelected
                          ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary/30'
                          : 'bg-card border-border/70 hover:bg-surface-raised hover:border-border'
                      )}
                    >
                      <div className="pt-0.5">
                        <div
                          className={cn(
                            'w-3.5 h-3.5 rounded-full border flex items-center justify-center',
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground'
                          )}
                        >
                          {isSelected && <Check size={9} strokeWidth={3} />}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground leading-tight">
                          {meta?.label || r}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 leading-tight">
                          {meta?.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advertencia si selecciona Admin */}
            {targetRole === 'admin' && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block">Nivel de Seguridad Máximo</strong>
                  El rol Administrador otorga acceso total al sistema contable, banco, declaraciones ante el SII, márgenes y configuración crítica de la plataforma.
                </div>
              </div>
            )}

            {/* Explicación de impacto si selecciona Rol a Medida */}
            {targetRole === 'colaborador' && targetPerfilAccesoId && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
                <Check size={14} className="shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <strong>Acceso personalizado activo:</strong> Al iniciar sesión en Núcleo, esta persona solo verá y podrá operar los módulos autorizados definidos para este rol, manteniendo blindadas las áreas privadas y financieras.
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingUser(null)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleSaveRole()}
                disabled={
                  saving ||
                  (targetRole === editingUser.role &&
                    targetPerfilAccesoId === (editingUser.perfil_acceso_id || null))
                }
                className="gap-1.5 font-semibold"
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Confirmar y aplicar rol'
                )}
              </Button>
            </div>
          </div>
        </ImmersiveModal>
      )}
    </div>
  );
}
