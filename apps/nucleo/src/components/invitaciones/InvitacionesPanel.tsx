'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { friendlyError, toast, Skeleton, SkeletonTable, ImmersiveModal, DatePicker } from '@enjambre/ui';
import {
  Ticket, Loader2, Plus, Copy, Check,
  CheckCircle2, Clock, X, Eye, UserPlus, Users, Shield, Shuffle,
  MessageCircle, Share2
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
import { CHILE_COMUNAS_POR_REGION } from '@enjambre/logistica';

const COMUNAS_CHILOE_INVITACIONES = [
  'Castro',
  'Ancud',
  'Quellón',
  'Dalcahue',
  'Chonchi',
  'Queilén',
  'Quemchi',
  'Puqueldón',
  'Quinchao',
  'Curaco de Vélez',
  'Puerto Varas',
  'Puerto Montt',
] as const;

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

export type InvitacionesPanelTab = 'cuentas' | 'roles' | 'invitaciones' | 'codigos' | 'canjes';

export function InvitacionesPanel({
  defaultTab,
}: {
  defaultTab?: InvitacionesPanelTab;
} = {}) {
  const apiFetch = useApiFetch();
  const searchParams = useSearchParams();
  const queryTab = searchParams?.get('tab') as InvitacionesPanelTab | null;
  const rawTab = defaultTab || queryTab || 'cuentas';
  const normalizedTab: 'cuentas' | 'roles' | 'invitaciones' =
    rawTab === 'codigos' || rawTab === 'canjes' || rawTab === 'invitaciones'
      ? 'invitaciones'
      : rawTab === 'roles'
      ? 'roles'
      : 'cuentas';

  const [codes, setCodes] = useState<InvitationCodeRow[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showCrearCuenta, setShowCrearCuenta] = useState(false);
  const [activeTab, setActiveTab] = useState<'cuentas' | 'roles' | 'invitaciones'>(normalizedTab);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const shareViaWhatsApp = (text: string) => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text);
    toast(successMessage, { type: 'success' });
  };

  const getInviteCodeShareText = (code: string, roles: string[], expiresAt?: string | null) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://registroapicolachiloe.me';
    const roleLabels = roles.map((r) => INVITABLE_ROLE_META[r as InvitablePlatformRole]?.label || r).join(', ');
    const expText = expiresAt ? `\n• *Vigencia hasta:* ${new Date(expiresAt).toLocaleDateString('es-CL')}` : '';
    return `🎫 *ENJAMBRE LEGADO — Invitación de Acceso*\n\nHas recibido una invitación oficial para incorporarte al ecosistema:\n\n• *Código de activación:* ${code}\n• *Perfil asignado:* ${roleLabels}${expText}\n• *Enlace de activación:* ${origin}/login?codigo=${code}\n\n_Ingresa el código al registrarte para activar tus herramientas automáticamente._`;
  };

  const getAccountShareText = (fullName: string, email: string, pass: string, role: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://registroapicolachiloe.me';
    const roleLabel = INVITABLE_ROLE_META[role as InvitablePlatformRole]?.label || role;
    return `🏛️ *ENJAMBRE LEGADO — Credenciales de Acceso*\n\nEstimado/a ${fullName || 'Usuario'}, tu cuenta ha sido habilitada:\n\n• *Portal de ingreso:* ${origin}/login\n• *Identificador:* ${email}\n• *Clave provisional:* ${pass}\n• *Perfil asignado:* ${roleLabel}\n\n_Al ingresar por primera vez podrás cambiar tu contraseña desde tu configuración de perfil._`;
  };

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
  const [cuentaCreada, setCuentaCreada] = useState<{ email: string; password: string; role: string; fullName?: string } | null>(null);

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
        fullName: nuevaCuenta.fullName,
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
    return (
      <div className="space-y-8 animate-in" aria-busy="true" aria-label="Cargando cuentas y accesos">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
          <div className="space-y-2">
            <Skeleton variant="text" className="w-32 h-3" />
            <Skeleton variant="text" className="w-48 h-7" />
            <Skeleton variant="text" className="w-72 max-w-full h-3.5" />
          </div>
          <Skeleton variant="rectangular" className="w-10 h-10 rounded-xl" />
        </div>
        <div className="flex gap-2 border-b border-border/80 pb-3">
          <Skeleton variant="rectangular" className="w-36 h-9 rounded-xl" />
          <Skeleton variant="rectangular" className="w-36 h-9 rounded-xl" />
          <Skeleton variant="rectangular" className="w-36 h-9 rounded-xl" />
        </div>
        <SkeletonTable rows={5} columns={5} />
      </div>
    );
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

      {activeTab === 'invitaciones' && (
        <div className="stats-grid">
          {[
            { icon: <Ticket size={18} />, val: codes.length, label: 'Invitaciones Emitidas', accent: '' },
            { icon: <CheckCircle2 size={18} />, val: codes.filter(c => c.active).length, label: 'Activas', accent: 'text-success' },
            { icon: <Clock size={18} />, val: redemptions.length, label: 'Activaciones Registradas', accent: 'text-accent' },
            { icon: <Eye size={18} />, val: codes.reduce((s, c) => s + c.current_uses, 0), label: 'Usos Totales', accent: '' },
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
            { id: 'roles', label: 'Matriz de Roles & Herramientas', icon: <Shield size={16} /> },
            { id: 'invitaciones', label: 'Invitaciones & Activaciones', icon: <Ticket size={16} />, badge: codes.filter(c => c.active).length || undefined },
          ]}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as 'cuentas' | 'roles' | 'invitaciones')}
        />
        {activeTab === 'cuentas' && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowCrearCuenta(true)} className="btn btn-outline flex items-center justify-center gap-2 shrink-0 text-xs py-2 px-3">
              <UserPlus size={16} />Crear Cuenta
            </button>
          </div>
        )}
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
            El perfil de plataforma principal (prioridad: administrador → apicultor de patio → actor territorial → etc.) se activa automáticamente en la cuenta al validar el código.
          </p>
          {invitationIncludesAdmin(newCode.roles) && (
            <p className="text-[0.65rem] text-warning mt-2 p-2 rounded-md bg-warning/10 border border-warning/20">
              <strong>Seguridad:</strong> Las invitaciones con perfil <code className="text-[0.65rem]">admin</code> se limitan estrictamente a{' '}
              <strong>1 uso</strong> y caducidad máxima de <strong>7 días</strong>. Se recomienda crear cuentas directas para administradores.
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

      {/* Tab: Invitaciones & Activaciones (Unificado) */}
      {activeTab === 'invitaciones' && (
        <div className="space-y-8">
          {/* Sección 1: Códigos Activos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Ticket size={16} className="text-primary" />
                  Códigos de Activación e Invitación
                </h3>
                <p className="text-xs text-muted-foreground">
                  Emite invitaciones para apicultores, operadores o colaboradores y compártelas directamente vía WhatsApp.
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="btn btn-gold text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0"
              >
                <Plus size={14} /> Nueva Invitación
              </button>
            </div>

            <div className="card">
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {codes.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-8 text-center">No hay códigos de invitación emitidos.</p>
                ) : codes.map(c => {
                  const shareText = getInviteCodeShareText(c.code, c.roles, c.expires_at);
                  return (
                    <div key={c.id} className={`p-4 rounded-xl bg-background/[0.03] border border-foreground/[0.06] hover:border-accent/20 transition-all ${!c.active ? 'opacity-50' : ''}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => copyCode(c.code)}
                              aria-label={`Copiar código ${c.code}`}
                              className="inline-flex items-center gap-1.5 text-xs font-mono bg-accent/15 border border-accent/20 px-2.5 py-1 rounded-md hover:bg-accent/25 transition-colors"
                              title="Copiar código alfanumérico"
                            >
                              {copiedCode === c.code ? <Check size={12} className="text-success" /> : <Copy size={12} className="text-accent" />}
                              <span className="text-accent font-bold tracking-wider">{c.code}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => copyToClipboard(shareText, `Ficha de invitación ${c.code} copiada`)}
                              className="inline-flex items-center gap-1 text-[11px] bg-muted/60 hover:bg-muted border border-border px-2 py-1 rounded-md transition-colors text-muted-foreground hover:text-foreground"
                              title="Copiar tarjeta completa para portapapeles"
                            >
                              <Copy size={11} />
                              <span>Ficha</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => shareViaWhatsApp(shareText)}
                              className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 px-2 py-1 rounded-md transition-colors"
                              title="Compartir invitación por WhatsApp"
                            >
                              <MessageCircle size={11} />
                              <span>WhatsApp</span>
                            </button>

                            {!c.active && <span className="text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">inactivo</span>}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                            <span>Usos: <strong>{c.current_uses}{c.max_uses ? `/${c.max_uses}` : ''}</strong></span>
                            <span>•</span>
                            <span>Expira: {c.expires_at ? new Date(c.expires_at).toLocaleDateString('es-CL') : 'Sin expiración'}</span>
                            <span>•</span>
                            <span>Perfiles: <strong className="text-foreground">{c.roles?.join(', ') || '—'}</strong></span>
                            {c.creatorName && (
                              <>
                                <span>•</span>
                                <span>Emitido por: {c.creatorName}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            disabled={actionLoading === c.id}
                            onClick={() => toggleCodeActive(c.id, c.active)}
                            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 ${c.active ? 'bg-warning/10 text-warning hover:bg-warning hover:text-foreground' : 'bg-success/10 text-success hover:bg-success hover:text-foreground'}`}
                            title={c.active ? 'Desactivar invitación' : 'Activar invitación'}
                          >
                            {actionLoading === c.id ? <Loader2 className="animate-spin" size={14} /> : c.active ? <Clock size={14} /> : <Check size={14} />}
                          </button>
                          <button
                            disabled={actionLoading === c.id}
                            onClick={() => deleteCode(c.id)}
                            className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-foreground transition-all disabled:opacity-50"
                            title="Eliminar invitación"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sección 2: Registro de Activaciones (Canjes) */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success" />
                Registro de Activaciones e Incorporaciones
              </h3>
              <p className="text-xs text-muted-foreground">
                Historial cronológico de cuentas que han activado invitaciones en la plataforma.
              </p>
            </div>

            <div className="card">
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {redemptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-8 text-center">No hay activaciones registradas aún.</p>
                ) : redemptions.map(r => (
                  <div key={r.id} className="p-3.5 rounded-xl bg-background/[0.03] border border-foreground/[0.06] flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-success/15 text-success border border-success/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-foreground truncate">{r.userName || 'Usuario registrado'}</p>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">{r.userEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-[11px] text-muted-foreground">
                        Código: <strong className="font-mono text-accent">{r.invitation_codes?.code}</strong>
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(r.redeemed_at).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sección 3: Prueba o validación manual */}
          <div className="rounded-2xl border border-dashed border-border/70 p-5 bg-card/40 space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Prueba o validación manual de código
            </h4>
            <p className="text-xs text-muted-foreground">
              Herramienta técnica para verificar o probar el canje de un código de invitación.
            </p>
            <RedeemInviteForm compact />
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
            <div className="p-4 rounded-xl bg-success/10 border border-success/20 space-y-3 mb-4 animate-in">
              <p className="text-sm font-bold text-success flex items-center gap-2">
                <CheckCircle2 size={16} /> Cuenta creada exitosamente
              </p>
              <p className="text-xs text-muted-foreground">Comparte estas credenciales de forma segura con el usuario:</p>
              <div className="font-mono text-xs bg-background/50 rounded-lg p-3 space-y-1.5 border border-success/15">
                <p><span className="text-muted-foreground">Nombre:</span> <strong className="text-foreground">{cuentaCreada.fullName || 'Usuario'}</strong></p>
                <p><span className="text-muted-foreground">Email:</span> <strong className="text-foreground">{cuentaCreada.email}</strong></p>
                <p><span className="text-muted-foreground">Contraseña inicial:</span> <strong className="text-foreground">{cuentaCreada.password}</strong></p>
                <p><span className="text-muted-foreground">Rol asignado:</span> <strong className="text-primary">{INVITABLE_ROLE_META[cuentaCreada.role as InvitablePlatformRole]?.label || cuentaCreada.role}</strong></p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-success/20">
                <button
                  type="button"
                  onClick={() => copyToClipboard(getAccountShareText(cuentaCreada.fullName || 'Usuario', cuentaCreada.email, cuentaCreada.password, cuentaCreada.role), 'Ficha de acceso copiada al portapapeles')}
                  className="btn btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Copy size={13} />
                  Copiar Ficha de Acceso
                </button>
                <button
                  type="button"
                  onClick={() => shareViaWhatsApp(getAccountShareText(cuentaCreada.fullName || 'Usuario', cuentaCreada.email, cuentaCreada.password, cuentaCreada.role))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                >
                  <MessageCircle size={13} />
                  Compartir por WhatsApp
                </button>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block">Contraseña temporal *</label>
                    <button
                      type="button"
                      onClick={() => {
                        const charset = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!#$*';
                        let pass = 'Legado-';
                        for (let i = 0; i < 8; i++) {
                          pass += charset.charAt(Math.floor(Math.random() * charset.length));
                        }
                        setNuevaCuenta(p => ({ ...p, password: pass }));
                      }}
                      className="text-[0.6rem] text-primary hover:underline flex items-center gap-1"
                    >
                      <Shuffle size={10} /> Generar aleatoria
                    </button>
                  </div>
                  <input
                    type="text"
                    value={nuevaCuenta.password}
                    onChange={e => setNuevaCuenta(p => ({ ...p, password: e.target.value }))}
                    className="input-field text-sm w-full font-mono"
                    placeholder="Mín. 8 caracteres o genera aleatoria"
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

              {nuevaCuenta.role === 'disenador' && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-1 animate-in">
                  <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <span>🎨</span> Diseñador & Imprenta
                  </p>
                  <p className="text-[0.65rem] text-muted-foreground leading-relaxed">
                    Acceso directo a su portal exclusivo <code className="text-[0.65rem] text-primary">/portal-imprenta</code>.
                    Podrá visualizar fotos de los frascos, fichas de etiquetas (medidas, sustrato y acabados), códigos QR vectoriales y descargar los archivos imprimibles maestros subidos desde Núcleo.
                  </p>
                </div>
              )}

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
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {COMUNAS_CHILOE_INVITACIONES.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNuevaCuenta(p => ({ ...p, comuna: c }))}
                            className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                              nuevaCuenta.comuna.toLowerCase() === c.toLowerCase()
                                ? 'border-primary bg-primary/20 text-primary font-medium'
                                : 'border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        list="invitaciones-comunas-list"
                        value={nuevaCuenta.comuna}
                        onChange={e => setNuevaCuenta(p => ({ ...p, comuna: e.target.value }))}
                        className="input-field text-sm w-full"
                        placeholder="Ej: Queilén, Chonchi, Castro..."
                      />
                      <datalist id="invitaciones-comunas-list">
                        {Object.values(CHILE_COMUNAS_POR_REGION).flat().map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
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
