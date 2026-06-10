'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { friendlyError, toast } from '@enjambre/ui';
import {
  Percent, Check, Loader2, Plus, Edit3,
  Trash2, X, ToggleLeft, ToggleRight
} from 'lucide-react';

interface CommissionRuleRow {
  id: string;
  empresa_id: string;
  rule_type: string;
  name: string;
  parameter: Record<string, unknown>;
  active: boolean;
  priority: number;
  created_at: string;
}

const ruleTypes = ['base', 'channel_rate', 'volume_threshold', 'loyalty', 'streak', 'tier_bonus'] as const;
type RuleType = typeof ruleTypes[number];

const ruleTypeLabels: Record<RuleType, string> = {
  base: 'Base',
  channel_rate: 'Tasa por Canal',
  volume_threshold: 'Multiplicador de Volumen',
  loyalty: 'Fidelización',
  streak: 'Racha',
  tier_bonus: 'Bono por Nivel',
};

const defaultParams: Record<RuleType, Record<string, unknown>> = {
  base: { rate: 0.10 },
  channel_rate: { channels: { feria: 0.10, delivery: 0.08, local: 0.10, corporativo: 0.12, referido: 0.09, web: 0.07 } },
  volume_threshold: { threshold: 50000, multiplier: 1.2 },
  loyalty: { bonus_rate: 0.03 },
  streak: { bonus_amount: 5000, min_days: 7 },
  tier_bonus: { tiers: { base: 1.0, senior: 1.1, elite: 1.2, legend: 1.3 } },
};

export function ReglasComisionPanel() {
  const [rules, setRules] = useState<CommissionRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editRule, setEditRule] = useState<CommissionRuleRow | null>(null);

  const [formType, setFormType] = useState<RuleType>('base');
  const [formName, setFormName] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formPriority, setFormPriority] = useState(0);
  const [formParams, setFormParams] = useState<Record<string, unknown>>(defaultParams.base);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('commission_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setRules(Array.isArray(data) ? (data as CommissionRuleRow[]) : []);
    } catch (err) {
      toast(friendlyError(err, 'Error al cargar reglas'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRules(); }, []);

  const resetForm = () => {
    setFormType('base');
    setFormName('');
    setFormActive(true);
    setFormPriority(0);
    setFormParams(defaultParams.base);
    setEditRule(null);
    setShowCreate(false);
  };

  const startEdit = (rule: CommissionRuleRow) => {
    setEditRule(rule);
    setFormType(rule.rule_type as RuleType);
    setFormName(rule.name);
    setFormActive(rule.active);
    setFormPriority(rule.priority);
    setFormParams(rule.parameter);
    setShowCreate(true);
  };

  const startCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  const saveRule = async () => {
    setActionLoading('saving');
    try {
      const payload = {
        rule_type: formType,
        name: formName || ruleTypeLabels[formType],
        parameter: formParams,
        active: formActive,
        priority: formPriority,
      };

      if (editRule) {
        const { error } = await supabase.from('commission_rules').update(payload).eq('id', editRule.id);
        if (error) throw error;
        toast('Regla actualizada', { type: 'success' });
      } else {
        const { error } = await supabase.from('commission_rules').insert(payload);
        if (error) throw error;
        toast('Regla creada', { type: 'success' });
      }

      resetForm();
      await fetchRules();
    } catch (err) {
      toast(friendlyError(err, 'Error al guardar'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleActive = async (ruleId: string, active: boolean) => {
    setActionLoading(ruleId);
    try {
      const { error } = await supabase.from('commission_rules').update({ active: !active }).eq('id', ruleId);
      if (error) throw error;
      toast(`Regla ${active ? 'desactivada' : 'activada'}`, { type: 'success' });
      await fetchRules();
    } catch (err) {
      toast(friendlyError(err, 'Error al actualizar'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteRule = async (ruleId: string) => {
    setActionLoading(ruleId);
    try {
      const { error } = await supabase.from('commission_rules').delete().eq('id', ruleId);
      if (error) throw error;
      toast('Regla eliminada', { type: 'success' });
      await fetchRules();
    } catch (err) {
      toast(friendlyError(err, 'Error al eliminar'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleTypeChange = (type: RuleType) => {
    setFormType(type);
    setFormParams(defaultParams[type]);
    setFormName(ruleTypeLabels[type]);
  };

  const updateParam = (key: string, value: unknown) => {
    setFormParams((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-accent" size={32} />
        <p className="text-sm text-muted-foreground font-datos uppercase tracking-widest">Cargando reglas...</p>
      </div>
    );
  }

  return (
  <div className="space-y-8 animate-in relative">
    <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
          <Percent size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-display text-primary">Reglas de Comisión</h2>
          <p className="text-sm text-muted-foreground">Configura tasas, multiplicadores, bonos de fidelización y racha</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ruleTypes.map((type, i) => {
          const count = rules.filter(r => r.rule_type === type).length;
          const activeCount = rules.filter(r => r.rule_type === type && r.active).length;
          return (
            <div key={type} className="stat-card animate-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="stat-header"><div className="stat-icon"><Percent size={18} /></div></div>
              <div className="stat-value">{activeCount}/{count}</div>
              <div className="stat-label">{ruleTypeLabels[type]}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg">Reglas Activas</h3>
        <button onClick={startCreate} className="btn btn-gold flex items-center gap-2">
          <Plus size={16} /> Nueva Regla
        </button>
      </div>

      {showCreate && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg">{editRule ? 'Editar Regla' : 'Nueva Regla'}</h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-primary"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Tipo</label>
              <select value={formType} onChange={(e) => handleTypeChange(e.target.value as RuleType)} className="input-field text-sm">
                {ruleTypes.map(t => <option key={t} value={t}>{ruleTypeLabels[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Nombre</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Prioridad</label>
              <input type="number" min={0} value={formPriority} onChange={(e) => setFormPriority(Number(e.target.value))} className="input-field text-sm" />
            </div>
          </div>

      <div className="border-t border-foreground/5 pt-4">
      <p className="text-[0.6rem] uppercase text-muted-foreground tracking-wider mb-3">Parámetros</p>
      {formType === 'tier_bonus' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['base', 'senior', 'elite', 'legend'] as const).map(tier => (
            <div key={tier}>
              <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">{tier} ×</label>
              <input
                type="number"
                step="0.1"
                min={1}
                value={(formParams.tiers as Record<string, number>)?.[tier] ?? 1.0}
                onChange={(e) => {
                  const tiers = { ...((formParams.tiers as Record<string, number>) || {}), [tier]: parseFloat(e.target.value) || 1.0 };
                  updateParam('tiers', tiers);
                }}
                className="input-field text-sm"
              />
            </div>
          ))}
        </div>
      ) : formType === 'channel_rate' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(['feria', 'delivery', 'local', 'corporativo', 'referido', 'web'] as const).map(ch => (
            <div key={ch}>
              <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">{ch} (%)</label>
              <input
                type="number"
                step="0.5"
                min={0}
                max={100}
                value={((formParams.channels as Record<string, number>)?.[ch] ?? 0.10) * 100}
                onChange={(e) => {
                  const channels = { ...((formParams.channels as Record<string, number>) || {}), [ch]: (parseFloat(e.target.value) || 0) / 100 };
                  updateParam('channels', channels);
                }}
                className="input-field text-sm"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(formParams).map(([key, val]) => (
            <div key={key}>
              <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">{key}</label>
              <input
                type="number"
                step="any"
                value={val as number}
                onChange={(e) => updateParam(key, parseFloat(e.target.value) || 0)}
                className="input-field text-sm"
              />
            </div>
          ))}
        </div>
      )}
    </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} className="rounded" />
              <span className="text-sm">Activa</span>
            </label>
            <div className="flex gap-3 ml-auto">
              <button disabled={actionLoading === 'saving'} onClick={saveRule} className="btn btn-gold text-xs">
                {actionLoading === 'saving' ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                {editRule ? 'Guardar' : 'Crear'}
              </button>
              <button onClick={resetForm} className="btn btn-outline text-xs">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-muted-foreground italic">No hay reglas de comisión. Crea la primera.</p>
          </div>
        ) : rules.map(rule => (
          <div key={rule.id} className={`card p-5 ${!rule.active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
              <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  rule.rule_type === 'base' ? 'bg-secondary text-muted-foreground' :
        rule.rule_type === 'channel_rate' ? 'bg-surface-raised text-foreground' :
        rule.rule_type === 'volume_threshold' ? 'bg-accent/15 text-accent' :
        rule.rule_type === 'loyalty' ? 'bg-success/10 text-success' :
        rule.rule_type === 'tier_bonus' ? 'bg-card text-foreground' :
        'bg-card text-foreground'
                }`}>
                    {ruleTypeLabels[rule.rule_type as RuleType] || rule.rule_type}
                  </span>
                  <p className="font-bold text-sm text-primary">{rule.name}</p>
                  {!rule.active && <span className="text-[0.6rem] uppercase text-destructive font-bold">inactiva</span>}
                </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {rule.rule_type === 'tier_bonus' && rule.parameter.tiers ? (
                  Object.entries(rule.parameter.tiers as Record<string, unknown>).map(([tier, val]) => (
                    <span key={tier} className="text-[0.65rem] text-muted-foreground">
                      {tier}: <strong className="text-primary">×{Number(val).toFixed(1)}</strong>
                    </span>
                  ))
                ) : rule.rule_type === 'channel_rate' && rule.parameter.channels ? (
                  Object.entries(rule.parameter.channels as Record<string, unknown>).map(([ch, val]) => (
                    <span key={ch} className="text-[0.65rem] text-muted-foreground">
                      {ch}: <strong className="text-primary">{(Number(val) * 100).toFixed(0)}%</strong>
                    </span>
                  ))
                ) : (
                  Object.entries(rule.parameter).map(([key, val]) => (
                    <span key={key} className="text-[0.65rem] text-muted-foreground">
                      {key}: <strong className="text-primary">{typeof val === 'number' ? (key.includes('rate') || key.includes('multiplier') ? (val * (key.includes('rate') ? 100 : 1)).toFixed(key.includes('rate') ? 0 : 1) + (key.includes('rate') ? '%' : '×') : val.toLocaleString('es-CL')) : String(val)}</strong>
                    </span>
                  ))
                )}
                <span className="text-[0.65rem] text-muted-foreground">Prioridad: <strong>{rule.priority}</strong></span>
              </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  disabled={actionLoading === rule.id}
                  onClick={() => toggleActive(rule.id, rule.active)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
                  title={rule.active ? 'Desactivar' : 'Activar'}
                >
                  {rule.active
                    ? <ToggleRight size={20} className="text-success" />
                    : <ToggleLeft size={20} className="text-muted-foreground" />
                  }
                </button>
                <button onClick={() => startEdit(rule)} className="w-9 h-9 rounded-full bg-surface-raised text-foreground flex items-center justify-center hover:bg-card transition-all" title="Editar">
                  <Edit3 size={16} />
                </button>
                <button
                  disabled={actionLoading === rule.id}
                  onClick={() => deleteRule(rule.id)}
                  className="w-9 h-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-foreground transition-all disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
