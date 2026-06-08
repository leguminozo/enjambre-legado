'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { friendlyError, toast } from '@enjambre/ui';
import {
  Ticket, Loader2, Plus, Copy, Check,
  CheckCircle2, Clock, X, Eye
} from 'lucide-react';

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
  profiles: { full_name: string } | null;
}

interface RedemptionRow {
  id: string;
  invitation_id: string;
  user_id: string;
  redeemed_at: string;
  roles_assigned: string[];
  invitation_codes: { code: string } | null;
  profiles: { full_name: string; email: string } | null;
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

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [codesRes, redemptionsRes] = await Promise.all([
        supabase.from('invitation_codes').select('*, profiles!invitation_codes_created_by_fkey(full_name)').order('created_at', { ascending: false }).limit(100),
        supabase.from('invitation_redemptions').select('*, invitation_codes(code), profiles!invitation_redemptions_user_id_fkey(full_name, email)').order('redeemed_at', { ascending: false }).limit(50),
      ]);
      if (codesRes.data) setCodes(codesRes.data as unknown as InvitationCodeRow[]);
      if (redemptionsRes.data) setRedemptions(redemptionsRes.data as unknown as RedemptionRow[]);
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
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) throw new Error('No autenticado');

        const payload: Record<string, unknown> = {
          code: generateCode(),
          created_by: authSession.user.id,
          roles: ['admin'],
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

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-oro-miel-dark" size={32} />
        <p className="text-sm text-text-muted font-datos uppercase tracking-widest">Cargando invitaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in relative">
  <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-oro-miel-glow flex items-center justify-center text-oro-miel-dark">
          <Ticket size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-display text-bosque-ulmo">Invitaciones</h2>
          <p className="text-sm text-text-muted">Códigos de acceso · Onboarding al enjambre</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
      { icon: <Ticket size={18} />, val: codes.length, label: 'Invitaciones', accent: '' },
        { icon: <CheckCircle2 size={18} />, val: codes.filter(c => c.active).length, label: 'Activas', accent: 'text-salud-optima' },
        { icon: <Clock size={18} />, val: redemptions.length, label: 'Canjes', accent: 'text-oro-miel-dark' },
        { icon: <Eye size={18} />, val: codes.reduce((s, c) => s + c.current_uses, 0), label: 'Usos', accent: '' },
        ].map((s, i) => (
          <div key={i} className="stat-card animate-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="stat-header"><div className="stat-icon">{s.icon}</div></div>
            <div className={`stat-value ${s.accent}`}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-2">
        {(['codigos', 'canjes'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`btn flex items-center gap-2 ${activeTab === tab ? 'btn-gold' : 'btn-outline'}`}>
            {tab === 'codigos' ? <><Ticket size={16} />Códigos</> : <><CheckCircle2 size={16} />Canjes ({redemptions.length})</>}
          </button>
        ))}
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-gold flex items-center gap-2 ml-auto">
          <Plus size={16} />Nueva Invitación
        </button>
      </div>

      {showCreate && (
        <div className="card p-6 space-y-4">
          <h3 className="font-display text-lg">Nueva Invitación</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[0.6rem] uppercase text-text-muted tracking-wider block mb-1">Límite de usos</label>
              <input type="number" min={1} value={newCode.maxUses} onChange={e => setNewCode({ ...newCode, maxUses: e.target.value })} className="input-field text-sm" placeholder="Sin límite" />
              <p className="text-[0.6rem] text-text-muted mt-1">Dejar vacío para usos ilimitados</p>
            </div>
            <div>
              <label className="text-[0.6rem] uppercase text-text-muted tracking-wider block mb-1">Vigencia</label>
              <input type="date" value={newCode.expiresAt} onChange={e => setNewCode({ ...newCode, expiresAt: e.target.value })} className="input-field text-sm" />
              <p className="text-[0.6rem] text-text-muted mt-1">Sin fecha = sin expiración</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button disabled={actionLoading === 'creating'} onClick={createCode} className="btn btn-gold text-xs">
              {actionLoading === 'creating' ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
              Generar código
            </button>
            <button onClick={() => setShowCreate(false)} className="btn btn-outline text-xs">Cancelar</button>
          </div>
        </div>
      )}

      {activeTab === 'codigos' && (
        <div className="card">
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {codes.length === 0 ? (
              <p className="text-sm text-text-muted italic py-8 text-center">No hay códigos de invitación.</p>
            ) : codes.map(c => (
              <div key={c.id} className={`p-5 rounded-xl bg-background/[0.03] border border-foreground/[0.06] hover:border-oro-miel/20 transition-all ${!c.active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <button onClick={() => copyCode(c.code)} className="flex items-center gap-1 text-xs font-mono bg-oro-miel-glow/30 border border-oro-miel/10 px-2 py-1 rounded-md hover:bg-oro-miel-glow/50 transition-colors">
                        {copiedCode === c.code ? <Check size={12} className="text-salud-optima" /> : <Copy size={12} className="text-oro-miel-dark" />}
                        <span className="text-oro-miel-dark font-bold">{c.code}</span>
                      </button>
                      {!c.active && <span className="text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-salud-riesgo/10 text-salud-riesgo">inactivo</span>}
                    </div>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="text-[0.65rem] text-text-muted">Usos: <strong>{c.current_uses}{c.max_uses ? `/${c.max_uses}` : ''}</strong></span>
                      {c.expires_at && <span className="text-[0.65rem] text-text-muted">Expira: {new Date(c.expires_at).toLocaleDateString('es-CL')}</span>}
                      <span className="text-[0.65rem] text-text-muted">Creado por: {c.profiles?.full_name || '—'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      disabled={actionLoading === c.id}
                      onClick={() => toggleCodeActive(c.id, c.active)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${c.active ? 'bg-amber/10 text-amber hover:bg-amber hover:text-foreground' : 'bg-salud-optima/10 text-salud-optima hover:bg-salud-optima hover:text-foreground'}`}
                      title={c.active ? 'Desactivar' : 'Activar'}
                    >
                      {actionLoading === c.id ? <Loader2 className="animate-spin" size={16} /> : c.active ? <Clock size={16} /> : <Check size={16} />}
                    </button>
                    <button
                      disabled={actionLoading === c.id}
                      onClick={() => deleteCode(c.id)}
                      className="w-9 h-9 rounded-full bg-salud-riesgo/10 text-salud-riesgo flex items-center justify-center hover:bg-salud-riesgo hover:text-foreground transition-all disabled:opacity-50"
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
              <p className="text-sm text-text-muted italic py-8 text-center">No hay canjes registrados.</p>
            ) : redemptions.map(r => (
              <div key={r.id} className="p-4 rounded-xl bg-background/[0.03] border border-foreground/[0.06]">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={14} className="text-salud-optima" />
                  <p className="font-bold text-sm text-bosque-ulmo">{r.profiles?.full_name || 'Usuario'}</p>
                  <span className="text-xs text-text-muted">{r.profiles?.email}</span>
                </div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-[0.65rem] text-text-muted">Código: <strong className="font-mono text-oro-miel-dark">{r.invitation_codes?.code}</strong></span>
                <span className="text-[0.65rem] text-text-muted">{new Date(r.redeemed_at).toLocaleDateString('es-CL')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
