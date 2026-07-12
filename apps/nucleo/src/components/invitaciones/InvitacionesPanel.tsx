'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { friendlyError, toast, ViewLoading, ImmersiveModal, DatePicker } from '@enjambre/ui';
import {
  Ticket, Loader2, Plus, Copy, Check,
  CheckCircle2, Clock, X, Eye
} from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';

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

export function InvitacionesPanel() {
  const [codes, setCodes] = useState<InvitationCodeRow[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<'codigos' | 'canjes'>('codigos');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [newCode, setNewCode] = useState({ maxUses: '', expiresAt: '' });

  const resolveEmpresaId = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('No autenticado');

    const { data: ueData, error: ueError } = await supabase
      .from('usuarios_empresas')
      .select('empresa_id')
      .eq('user_id', authUser.id)
      .limit(1);
    if (ueError) throw ueError;

    const empresaId = ueData?.[0]?.empresa_id;
    if (!empresaId) throw new Error('Sin empresa asignada');
    return empresaId;
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
      const empresaId = await resolveEmpresaId();

      const { data: codesData, error: codesError } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (codesError) throw codesError;

      const codeRows = (codesData as InvitationCodeRow[]) || [];
      const codeIds = codeRows.map(c => c.id);

      let redemptionRows: RedemptionRow[] = [];
      if (codeIds.length > 0) {
        const { data: redemptionsData, error: redemptionsError } = await supabase
          .from('invitation_redemptions')
          .select('*, invitation_codes(code)')
          .in('invitation_id', codeIds)
          .order('redeemed_at', { ascending: false })
          .limit(50);
        if (redemptionsError) throw redemptionsError;
        redemptionRows = (redemptionsData as RedemptionRow[]) || [];
      }

      const profileMap = await fetchProfileNames([
        ...codeRows.map(c => c.created_by),
        ...redemptionRows.map(r => r.user_id),
      ]);

      setCodes(codeRows.map(c => ({
        ...c,
        creatorName: profileMap[c.created_by]?.full_name,
      })));
      setRedemptions(redemptionRows.map(r => ({
        ...r,
        userName: profileMap[r.user_id]?.full_name,
        userEmail: profileMap[r.user_id]?.email,
      })));
    } catch (err) {
      toast(friendlyError(err, 'Error al cargar invitaciones'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const createCode = async () => {
    setActionLoading('creating');
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No autenticado');

      const empresaId = await resolveEmpresaId();
      const { data: generatedCode, error: codeError } = await supabase.rpc('generar_codigo_invitacion', {
        p_empresa_id: empresaId,
      });
      if (codeError) throw codeError;
      if (!generatedCode) throw new Error('No se pudo generar el código');

      const payload: Record<string, unknown> = {
        empresa_id: empresaId,
        code: generatedCode,
        created_by: authUser.id,
        roles: ['rep_ventas'],
        tools: {},
        active: true,
      };
      if (newCode.maxUses) payload.max_uses = Number(newCode.maxUses);
      if (newCode.expiresAt) payload.expires_at = new Date(newCode.expiresAt).toISOString();

      const { error } = await supabase.from('invitation_codes').insert(payload);
      if (error) throw error;

      toast('Invitación creada', { type: 'success' });
      setShowCreate(false);
      setNewCode({ maxUses: '', expiresAt: '' });
      await fetchAll();
    } catch (err) {
      toast(friendlyError(err, 'Error al crear código'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleCodeActive = async (codeId: string, active: boolean) => {
    setActionLoading(codeId);
    try {
      const { error } = await supabase.from('invitation_codes').update({ active: !active }).eq('id', codeId);
      if (error) throw error;
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
      const { error } = await supabase.from('invitation_codes').delete().eq('id', codeId);
      if (error) throw error;
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
        eyebrow="Onboarding"
        title="Invitaciones"
        subtitle="Códigos de acceso · Onboarding al enjambre"
        icon={<Ticket size={22} />}
      />

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

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <ResponsiveTabBar
          className="flex-1"
          variant="pill"
          layoutId="invitaciones-tabs"
          tabs={[
            { id: 'codigos', label: 'Códigos', icon: <Ticket size={16} /> },
            { id: 'canjes', label: 'Canjes', icon: <CheckCircle2 size={16} />, badge: redemptions.length || undefined },
          ]}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as 'codigos' | 'canjes')}
        />
        <button onClick={() => setShowCreate(true)} className="btn btn-gold flex items-center justify-center gap-2 shrink-0">
          <Plus size={16} />Nueva Invitación
        </button>
      </div>

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
      </ImmersiveModal>

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
                      <button onClick={() => copyCode(c.code)} className="flex items-center gap-1 text-xs font-mono bg-accent/15 border border-accent/10 px-2 py-1 rounded-md hover:bg-accent/25 transition-colors">
                        {copiedCode === c.code ? <Check size={12} className="text-success" /> : <Copy size={12} className="text-accent" />}
                        <span className="text-accent font-bold">{c.code}</span>
                      </button>
                      {!c.active && <span className="text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">inactivo</span>}
                    </div>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="text-[0.65rem] text-muted-foreground">Usos: <strong>{c.current_uses}{c.max_uses ? `/${c.max_uses}` : ''}</strong></span>
                      {c.expires_at && <span className="text-[0.65rem] text-muted-foreground">Expira: {new Date(c.expires_at).toLocaleDateString('es-CL')}</span>}
                      <span className="text-[0.65rem] text-muted-foreground">Creado por: {c.creatorName || '—'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      disabled={actionLoading === c.id}
                      onClick={() => toggleCodeActive(c.id, c.active)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${c.active ? 'bg-warning/10 text-warning hover:bg-warning hover:text-foreground' : 'bg-success/10 text-success hover:bg-success hover:text-foreground'}`}
                      title={c.active ? 'Desactivar' : 'Activar'}
                    >
                      {actionLoading === c.id ? <Loader2 className="animate-spin" size={16} /> : c.active ? <Clock size={16} /> : <Check size={16} />}
                    </button>
                    <button
                      disabled={actionLoading === c.id}
                      onClick={() => deleteCode(c.id)}
                      className="w-9 h-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-foreground transition-all disabled:opacity-50"
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
    </div>
  );
}
