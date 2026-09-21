'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { friendlyError, toast, ViewLoading, ImmersiveModal, DatePicker } from '@enjambre/ui';
import {
  Ticket, Loader2, Plus, Copy, Check,
  CheckCircle2, Clock, X, Eye, UserPlus, Users, Shield
} from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import {
  INVITABLE_PLATFORM_ROLES,
  INVITABLE_ROLE_META,
  type InvitablePlatformRole,
} from '@/lib/invitation-roles';
import { enforceAdminInviteConstraints, invitationIncludesAdmin } from '@/lib/invitation-policy';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { RedeemInviteForm } from '@/components/invitaciones/RedeemInviteForm';
import { DirectorioCuentasTab } from '@/components/invitaciones/DirectorioCuentasTab';
import { RolesPersonalizadosTab } from '@/components/invitaciones/RolesPersonalizadosTab';

interface InvitationCodeRow {
  id: string;
  code: string;
  created_by: string;
  roles: string[];
  tools: Record<string, unknown> | null;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  creatorName?: string;
}

interface RedemptionRow {
  id: string;
  invitation_id: string;
  user_id: string;
  redeemed_at: string;
  roles_assigned: string[];
  invitation_codes: { code: string } | null;
  userName?: string;
  userEmail?: string;
}

interface NuevaCuenta {
  email: string;
  password: string;
  fullName: string;
  role: InvitablePlatformRole;
  rolTerritorial: string;
  comuna: string;
}

const ROLES_SISTEMA = INVITABLE_PLATFORM_ROLES.map((value) => ({
  value,
  label: INVITABLE_ROLE_META[value].label,
  desc: INVITABLE_ROLE_META[value].desc,
}));

const ROLES_TERRITORIALES = [
  { value: 'api_residente', label: '🐝 Apicultor Residente', desc: 'Opera apiarios fijos en Chiloé' },
  { value: 'api_trashumante', label: '🚚 Apicultor Trashumante', desc: 'Trae colmenas desde otra región' },
  { value: 'api_mixto', label: '🔀 Apicultor Mixto', desc: 'Residente con traslados' },
  { value: 'prop_facilitador', label: '🌿 Propietario Facilitador', desc: 'Cede predio para colmenas' },
  { value: 'agri_fitosanitario', label: '🧪 Agricultor / Fitosanitario', desc: 'Reporta fumigaciones y plaguicidas' },
  { value: 'agri_aplicador', label: '🚜 Aplicador Fitosanitario', desc: 'Empresa aplicadora / contratista' },
  { value: 'tecnico_inspector', label: '🔬 Técnico Inspector', desc: 'SAG u otro organismo técnico' },
  { value: 'institucion_publica', label: '🏛️ Institución Pública', desc: 'Municipio, CONAF, INDAP, etc.' },
];

export function InvitacionesPanel({
  defaultTab,
}: {
  defaultTab?: 'cuentas' | 'roles' | 'codigos' | 'canjes';
} = {}) {
  const apiFetch = useApiFetch();
  const searchParams = useSearchParams();
  const queryTab = searchParams?.get('tab');
  const initialTab =
    (defaultTab || queryTab) && ['cuentas', 'roles', 'codigos', 'canjes'].includes((defaultTab || queryTab) as string)
      ? ((defaultTab || queryTab) as 'cuentas' | 'roles' | 'codigos' | 'canjes')
      : 'cuentas';

  const [codes, setCodes] = useState<InvitationCodeRow[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showCrearCuenta, setShowCrearCuenta] = useState(false);
  const [activeTab, setActiveTab] = useState<'cuentas' | 'roles' | 'codigos' | 'canjes'>(initialTab);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [newCode, setNewCode] = useState<{ maxUses: string; expiresAt: string; roles: string[] }>({
    maxUses: '',
    expiresAt: '',
    roles: ['apicultor'],
  });

  const [nuevaCuenta, setNuevaCuenta] = useState<NuevaCuenta>({
    email: '',
    password: '',
    fullName: '',
    role: 'apicultor',
    rolTerritorial: 'api_residente',
    comuna: '',
  });
  const [cuentaCreada, setCuentaCreada] = useState<{ email: string; password: string; role: string } | null>(null);

  type BffInvitation = InvitationCodeRow & {
    invitation_redemptions?: Array<{
      id: string;
      user_id: string;
      redeemed_at: string;
      roles_assigned: string[];
    }>;
  };

  const fetchProfileNames = async (userIds: string[]) => {
    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    if (uniqueIds.length === 0) return {} as Record<string, { full_name: string; email?: string }>;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', uniqueIds);
    if (error) throw error;

    return Object.fromEntries(
      (data || []).map((p: { id: string; full_name: string; email?: string }) => [p.id, p]),
    );
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Una sola vía: BFF admin (tenant + requireProfileRole)
      const res = await apiFetch('/api/invitations');
      const json = (await res.json().catch(() => ({}))) as {
        data?: BffInvitation[];
        message?: string;
        code?: string;
      };
      if (!res.ok) {
        throw new Error(json.message || 'No se pudieron cargar las invitaciones');
      }

      const codeRows = json.data ?? [];
      const redemptionRows: RedemptionRow[] = [];
      for (const c of codeRows) {
        for (const r of c.invitation_redemptions ?? []) {
          redemptionRows.push({
            id: r.id,
            invitation_id: c.id,
            user_id: r.user_id,
            redeemed_at: r.redeemed_at,
            roles_assigned: r.roles_assigned ?? [],
            invitation_codes: { code: c.code },
          });
        }
      }
      redemptionRows.sort(
        (a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime(),
      );

      const profileMap = await fetchProfileNames([
        ...codeRows.map((c) => c.created_by),
        ...redemptionRows.map((r) => r.user_id),
      ]);

      setCodes(
        codeRows.map((c) => ({
          ...c,
          creatorName: profileMap[c.created_by]?.full_name,
        })),
      );
      setRedemptions(
        redemptionRows.map((r) => ({
          ...r,
          userName: profileMap[r.user_id]?.full_name,
          userEmail: profileMap[r.user_id]?.email,
        })),
      );
    } catch (err) {
      toast(friendlyError(err, 'Error al cargar invitaciones'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  const createCode = async () => {
    setActionLoading('creating');
    try {
      // Una sola vía: BFF aplica política admin (1 uso / ≤7d) y genera el código
      const roles = newCode.roles.length > 0 ? newCode.roles : ['apicultor'];
      const body: Record<string, unknown> = {
        roles,
        tools: {},
      };
      if (newCode.maxUses) body.max_uses = Number(newCode.maxUses);
      if (newCode.expiresAt) {
        body.expires_at = new Date(newCode.expiresAt).toISOString();
      }

      // Preview local de warnings (el BFF re-aplica enforce)
      const preview = enforceAdminInviteConstraints({
        roles,
        max_uses: body.max_uses as number | undefined,
        expires_at: (body.expires_at as string | undefined) ?? null,
      });

      const res = await apiFetch('/api/invitations', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: unknown;
        message?: string;
        code?: string;
        meta?: { policy_warnings?: string[] };
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.message || json.error || 'No se pudo crear la invitación');
      }

      const warnings = json.meta?.policy_warnings?.length
        ? json.meta.policy_warnings
        : preview.warnings;
      if (warnings.length) toast(warnings[0]!, { type: 'info' });
      toast('Invitación creada', { type: 'success' });
      setShowCreate(false);
      setNewCode({ maxUses: '', expiresAt: '', roles: ['apicultor'] });
      await fetchAll();
    } catch (err) {
      toast(friendlyError(err, 'Error al crear código'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const crearCuentaDirecta = async () => {
    if (!nuevaCuenta.email || !nuevaCuenta.password || !nuevaCuenta.fullName) {
      toast('Completa todos los campos requeridos', { type: 'error' });
      return;
    }
    setActionLoading('crear-cuenta');
    try {
      const body: Record<string, unknown> = {
        email: nuevaCuenta.email,
        password: nuevaCuenta.password,
        fullName: nuevaCuenta.fullName,
        role: nuevaCuenta.role,
      };
      if (nuevaCuenta.role === 'territorial') {
        body.rolTerritorial = nuevaCuenta.rolTerritorial;
        if (nuevaCuenta.comuna) body.comuna = nuevaCuenta.comuna;
      }

      const res = await apiFetch('/api/admin/crear-cuenta', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        code?: string;
        error?: { issues?: { message: string }[] };
      };
      if (!res.ok) {
        let errorMsg = json.message || 'Error al crear cuenta';
        if (json.error?.issues?.length) {
          errorMsg = json.error.issues.map((i) => i.message).join(', ');
        }
        throw new Error(errorMsg);
      }

      setCuentaCreada({
        email: nuevaCuenta.email,
        password: nuevaCuenta.password,
        role: nuevaCuenta.role,
      });
      toast(json.message ?? 'Cuenta creada', { type: 'success' });
      setNuevaCuenta({
        email: '',
        password: '',
        fullName: '',
        role: 'apicultor',
        rolTerritorial: 'api_residente',
        comuna: '',
      });
    } catch (err) {
      toast(friendlyError(err, 'Error al crear cuenta'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleCodeActive = async (codeId: string, active: boolean) => {
    setActionLoading(codeId);
    try {
      const res = await apiFetch(`/api/invitations/${codeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !active }),
      });
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(json.message || 'No se pudo actualizar');
      toast(`Código ${active ? 'desactivado' : 'activado'}`, { type: 'success' });
      await fetchAll();
    } catch (err) {
      toast(friendlyError(err, 'Error al actualizar'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteCode = async (codeId: string) => {
    setActionLoading(codeId);
    try {
      const res = await apiFetch(`/api/invitations/${codeId}`, { method: 'DELETE' });
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(json.message || 'No se pudo eliminar');
      toast('Código eliminado', { type: 'success' });
      await fetchAll();
    } catch (err) {
      toast(friendlyError(err, 'Error al eliminar'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return <ViewLoading variant="view" label="Invitaciones" hideLabel />;
  }

  return (
    <div className="space-y-8 animate-in relative">
      <ViewShell
        variant="compact"
        eyebrow="Gobernanza & Red"
        title="Cuentas & Accesos"
        subtitle="Directorio de cuentas del ecosistema · Asignación de roles · Invitaciones"
        icon={<Users size={22} />}
      />

      <RedeemInviteForm compact />

      {activeTab !== 'cuentas' && activeTab !== 'roles' && (
        <div className="stats-grid">
          {[
            { icon: <Ticket size={18} />, val: codes.length, label: 'Invitaciones', accent: '' },
            { icon: <CheckCircle2 size={18} />, val: codes.filter(c => c.active).length, label: 'Activas', accent: 'text-success' },
            { icon: <Clock size={18} />, val: redemptions.length, label: 'Canjes', accent: 'text-accent' },
            { icon: <Eye size={18} />, val: codes.reduce((s, c) => s + c.current_uses, 0), label: 'Usos', accent: '' },
          ].map((s, i) => (
            <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
              <div className="stat-header"><div className="stat-icon">{s.icon}</div></div>
              <div className={`stat-value ${s.accent}`}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <ResponsiveTabBar
          className="flex-1"
          variant="pill"
          layoutId="invitaciones-tabs"
          tabs={[
            { id: 'cuentas', label: 'Directorio de Cuentas', icon: <Users size={16} /> },
            { id: 'roles', label: 'Roles & Permisos', icon: <Shield size={16} /> },
            { id: 'codigos', label: 'Códigos', icon: <Ticket size={16} /> },
            { id: 'canjes', label: 'Canjes', icon: <CheckCircle2 size={16} />, badge: redemptions.length || undefined },
          ]}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as 'cuentas' | 'roles' | 'codigos' | 'canjes')}
        />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowCrearCuenta(true)} className="btn btn-outline flex items-center justify-center gap-2 shrink-0 text-xs py-2 px-3">
            <UserPlus size={16} />Crear Cuenta
          </button>
          {activeTab === 'codigos' && (
            <button onClick={() => setShowCreate(true)} className="btn btn-gold flex items-center justify-center gap-2 shrink-0 text-xs py-2 px-3">
              <Plus size={16} />Nueva Invitación
            </button>
          )}
        </div>
      </div>

      {/* Modal Código de Invitación */}
      <ImmersiveModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        eyebrow="Comunidad"
        title="Nueva invitación"
        size="md"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="btn btn-outline text-xs">Cancelar</button>
            <button disabled={actionLoading === 'creating'} onClick={createCode} className="btn btn-gold text-xs">
              {actionLoading === 'creating' ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
              Generar código
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Límite de usos</label>
            <input type="number" min={1} value={newCode.maxUses} onChange={e => setNewCode({ ...newCode, maxUses: e.target.value })} className="input-field text-sm w-full" placeholder="Sin límite" />
            <p className="text-[0.6rem] text-muted-foreground mt-1">Dejar vacío para usos ilimitados</p>
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Vigencia</label>
            <DatePicker value={newCode.expiresAt} onChange={val => setNewCode({ ...newCode, expiresAt: val })} className="w-full" />
            <p className="text-[0.6rem] text-muted-foreground mt-1">Sin fecha = sin expiración</p>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-2">Roles asignados</label>
          <div className="flex flex-wrap gap-2">
            {INVITABLE_PLATFORM_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                title={INVITABLE_ROLE_META[role].desc}
                onClick={() => {
                  setNewCode((prev) => ({
                    ...prev,
                    roles: prev.roles.includes(role)
                      ? prev.roles.filter((r) => r !== role)
                      : [...prev.roles, role],
                  }));
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors border ${
                  newCode.roles.includes(role)
                    ? 'bg-accent/20 border-accent/30 text-accent font-bold'
                    : 'bg-background/[0.03] border-foreground/[0.06] text-muted-foreground hover:bg-background/[0.05]'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
          <p className="text-[0.6rem] text-muted-foreground mt-1">
            El rol de plataforma primario (prioridad: admin → apicultor → territorial → rep → …) se escribe en{' '}
            <code className="text-[0.6rem]">profiles.role</code> al canjear. Patio = <strong>apicultor</strong>; red/censo ={' '}
            <strong>territorial</strong>.
          </p>
          {invitationIncludesAdmin(newCode.roles) && (
            <p className="text-[0.65rem] text-warning mt-2 p-2 rounded-md bg-warning/10 border border-warning/20">
              <strong>Seguridad:</strong> códigos con <code className="text-[0.65rem]">admin</code> se limitan a{' '}
              <strong>1 uso</strong> y caducidad máxima <strong>7 días</strong> (forzado en UI y BFF). Preferí crear cuenta
              directa para admins.
            </p>
          )}
        </div>
      </ImmersiveModal>

      {/* Tab: Directorio de Cuentas */}
      {activeTab === 'cuentas' && (
        <DirectorioCuentasTab
          onRequestCrearCuenta={() => setShowCrearCuenta(true)}
          onNavigateToRoles={() => setActiveTab('roles')}
        />
      )}

      {/* Tab: Roles & Permisos */}
      {activeTab === 'roles' && (
        <RolesPersonalizadosTab />
      )}

      {/* Tab: Códigos */}
      {activeTab === 'codigos' && (
        <div className="card">
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {codes.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">No hay códigos de invitación.</p>
            ) : codes.map(c => (
              <div key={c.id} className={`p-5 rounded-xl bg-background/[0.03] border border-foreground/[0.06] hover:border-accent/20 transition-all ${!c.active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => copyCode(c.code)}
                        aria-label={`Copiar código ${c.code}`}
                        className="inline-flex min-h-11 items-center gap-1 text-xs font-mono bg-accent/15 border border-accent/10 px-3 py-2 rounded-md hover:bg-accent/25 transition-colors"
                      >
                        {copiedCode === c.code ? <Check size={12} className="text-success" /> : <Copy size={12} className="text-accent" />}
                        <span className="text-accent font-bold">{c.code}</span>
                      </button>
                      {!c.active && <span className="text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">inactivo</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="text-[0.65rem] text-muted-foreground">Usos: <strong>{c.current_uses}{c.max_uses ? `/${c.max_uses}` : ''}</strong></span>
                      {c.expires_at && <span className="text-[0.65rem] text-muted-foreground">Expira: {new Date(c.expires_at).toLocaleDateString('es-CL')}</span>}
                      <span className="text-[0.65rem] text-muted-foreground">Roles: {c.roles?.join(', ') || '—'}</span>
                      <span className="text-[0.65rem] text-muted-foreground">Creado por: {c.creatorName || '—'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      disabled={actionLoading === c.id}
                      onClick={() => toggleCodeActive(c.id, c.active)}
                      className={`min-h-11 min-w-11 h-11 w-11 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${c.active ? 'bg-warning/10 text-warning hover:bg-warning hover:text-foreground' : 'bg-success/10 text-success hover:bg-success hover:text-foreground'}`}
                      title={c.active ? 'Desactivar' : 'Activar'}
                    >
                      {actionLoading === c.id ? <Loader2 className="animate-spin" size={16} /> : c.active ? <Clock size={16} /> : <Check size={16} />}
                    </button>
                    <button
                      disabled={actionLoading === c.id}
                      onClick={() => deleteCode(c.id)}
                      className="min-h-11 min-w-11 h-11 w-11 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-foreground transition-all disabled:opacity-50"
                      title="Eliminar"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Canjes */}
      {activeTab === 'canjes' && (
        <div className="card">
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {redemptions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">No hay canjes registrados.</p>
            ) : redemptions.map(r => (
              <div key={r.id} className="p-4 rounded-xl bg-background/[0.03] border border-foreground/[0.06]">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={14} className="text-success" />
                  <p className="font-bold text-sm text-primary">{r.userName || 'Usuario'}</p>
                  <span className="text-xs text-muted-foreground">{r.userEmail}</span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-[0.65rem] text-muted-foreground">Código: <strong className="font-mono text-accent">{r.invitation_codes?.code}</strong></span>
                  <span className="text-[0.65rem] text-muted-foreground">{new Date(r.redeemed_at).toLocaleDateString('es-CL')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Crear Cuenta */}
      <ImmersiveModal
        open={showCrearCuenta}
        onClose={() => setShowCrearCuenta(false)}
        eyebrow="Directorio"
        title="Nueva cuenta directa"
        size="md"
        footer={
          <>
            <button onClick={() => { setShowCrearCuenta(false); setCuentaCreada(null); }} className="btn btn-outline text-xs">Cancelar</button>
            <button
              disabled={actionLoading === 'crear-cuenta' || !nuevaCuenta.email || !nuevaCuenta.password || !nuevaCuenta.fullName || !!cuentaCreada}
              onClick={crearCuentaDirecta}
              className="btn btn-gold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'crear-cuenta' ? <Loader2 className="animate-spin" size={14} /> : <UserPlus size={14} />}
              Crear cuenta
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground">
            Crea la cuenta completa desde aquí y comparte las credenciales con el usuario por fuera. La cuenta queda activa inmediatamente.
          </p>

          {cuentaCreada && (
            <div className="p-4 rounded-xl bg-success/10 border border-success/20 space-y-2 mb-4 animate-in">
              <p className="text-sm font-bold text-success flex items-center gap-2">
                <CheckCircle2 size={16} /> Cuenta creada exitosamente
              </p>
              <p className="text-xs text-muted-foreground">Comparte estas credenciales de forma segura con el usuario:</p>
              <div className="font-mono text-xs bg-background/50 rounded-lg p-3 space-y-1">
                <p><span className="text-muted-foreground">Email:</span> <strong className="text-foreground">{cuentaCreada.email}</strong></p>
                <p><span className="text-muted-foreground">Contraseña:</span> <strong className="text-foreground">{cuentaCreada.password}</strong></p>
                <p><span className="text-muted-foreground">Rol:</span> <strong className="text-primary">{cuentaCreada.role}</strong></p>
              </div>
            </div>
          )}

          {!cuentaCreada && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Nombre completo *</label>
                  <input
                    type="text"
                    value={nuevaCuenta.fullName}
                    onChange={e => setNuevaCuenta(p => ({ ...p, fullName: e.target.value }))}
                    className="input-field text-sm w-full"
                    placeholder="Ej: Juan Mansilla Torres"
                  />
                </div>
                <div>
                  <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Email *</label>
                  <input
                    type="email"
                    value={nuevaCuenta.email}
                    onChange={e => setNuevaCuenta(p => ({ ...p, email: e.target.value }))}
                    className="input-field text-sm w-full"
                    placeholder="juan@ejemplo.cl"
                  />
                </div>
                <div>
                  <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Contraseña temporal *</label>
                  <input
                    type="text"
                    value={nuevaCuenta.password}
                    onChange={e => setNuevaCuenta(p => ({ ...p, password: e.target.value }))}
                    className="input-field text-sm w-full font-mono"
                    placeholder="Mín. 8 caracteres"
                  />
                  <p className="text-[0.6rem] text-muted-foreground mt-1">El usuario podrá cambiarla después.</p>
                </div>
                <div>
                  <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Rol del sistema *</label>
                  <select
                    value={nuevaCuenta.role}
                    onChange={(e) =>
                      setNuevaCuenta((p) => ({
                        ...p,
                        role: e.target.value as InvitablePlatformRole,
                      }))
                    }
                    className="input-field text-sm w-full"
                  >
                    {ROLES_SISTEMA.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <p className="text-[0.6rem] text-muted-foreground mt-1">
                    {ROLES_SISTEMA.find((r) => r.value === nuevaCuenta.role)?.desc}
                  </p>
                </div>
              </div>

              {nuevaCuenta.role === 'apicultor' && (
                <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 space-y-1 animate-in">
                  <p className="text-xs font-medium text-foreground">Apicultor de patio</p>
                  <p className="text-[0.65rem] text-muted-foreground">
                    Accede a Núcleo en <code className="text-[0.65rem]">/inicio</code> con colmenas, cuaderno y bitácora.
                    No ve contable, SII ni editor de tienda. Credenciales: copialas abajo y entréguelas por canal seguro.
                  </p>
                </div>
              )}

              {/* Campos adicionales para rol territorial (red/censo, no patio) */}
              {nuevaCuenta.role === 'territorial' && (
                <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-4 animate-in">
                  <p className="text-xs font-medium text-foreground">Configuración Territorial</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Tipo de Actor Territorial</label>
                      <select
                        value={nuevaCuenta.rolTerritorial}
                        onChange={e => setNuevaCuenta(p => ({ ...p, rolTerritorial: e.target.value }))}
                        className="input-field text-sm w-full"
                      >
                        {ROLES_TERRITORIALES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <p className="text-[0.6rem] text-muted-foreground mt-1">
                        {ROLES_TERRITORIALES.find(r => r.value === nuevaCuenta.rolTerritorial)?.desc}
                      </p>
                    </div>
                    <div>
                      <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Comuna principal</label>
                      <input
                        type="text"
                        value={nuevaCuenta.comuna}
                        onChange={e => setNuevaCuenta(p => ({ ...p, comuna: e.target.value }))}
                        className="input-field text-sm w-full"
                        placeholder="Ej: Queilén, Chonchi, Castro..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ImmersiveModal>
    </div>
  );
}
