import { useState, useEffect } from 'react';
import { TreePine, Camera, MapPin, Leaf, Plus, ChevronDown, Edit3, Trash2, X } from 'lucide-react';

import { toast, friendlyError, ViewLoading, ImmersiveModal } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ViewShell } from '@/components/layout/ViewShell';

interface TreeRecord {
  id: string;
  species: string;
  count: number;
  date: string;
  location: string;
  co2: number;
  status: 'creciendo' | 'adulto' | 'joven';
  user_id?: string | null;
}

type ArbolApiRow = {
  id: string;
  especie: string;
  cantidad: number;
  sector: string;
  fecha: string;
  status: string;
  co2_ton: number;
};

function mapRowToTreeRecord(r: ArbolApiRow | Record<string, unknown>): TreeRecord {
  const fecha = String((r as ArbolApiRow).fecha ?? '');
  return {
    id: String(r.id),
    species: String((r as ArbolApiRow).especie ?? ''),
    count: Number((r as ArbolApiRow).cantidad) || 0,
    date: fecha === '—' ? '' : fecha,
    location: String((r as ArbolApiRow).sector ?? ''),
    co2: Number((r as ArbolApiRow).co2_ton) || 0,
    status: (['joven', 'creciendo', 'adulto'].includes(String((r as ArbolApiRow).status))
      ? String((r as ArbolApiRow).status)
      : 'joven') as TreeRecord['status'],
  };
}

function getYearFromDate(dateStr: string): number {
  if (!dateStr) return 0;
  const match = dateStr.match(/\d{4}/g);
  if (match) {
    return Math.max(...match.map(Number));
  }
  return 0;
}

export function RegeneracionView() {
  const apiFetch = useApiFetch();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ species: '', count: '', location: '', notes: '', date: '', status: 'joven' });
  const [records, setRecords] = useState<TreeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<TreeRecord | null>(null);
  const [editFormData, setEditFormData] = useState({ species: '', count: '', location: '', date: '', status: 'joven' });

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const res = await apiFetch('/api/produccion/arboles');
        if (!res.ok) throw new Error('Error al cargar registros del bosque');
        const json = await res.json();
        setRecords((json.data ?? []).map((r: ArbolApiRow) => mapRowToTreeRecord(r)));
      } catch (err) {
        toast(friendlyError(err, 'Error al cargar o inicializar registros del bosque'), { type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [apiFetch]);

  const totalTrees = records.reduce((s, r) => s + r.count, 0);
  const totalCO2 = records.reduce((s, r) => s + r.co2, 0);
  const uniqueZones = new Set(records.map(r => r.location).filter(Boolean)).size;
  const uniqueSpecies = new Set(records.map(r => r.species).filter(Boolean)).size;

  const currentYear = new Date().getFullYear();
  const foundationYear = 2004;
  const anosLegado = currentYear - foundationYear;

  // Dynamic trend calculation (this year's trees / co2)
  const recentTrees = records
    .filter(r => getYearFromDate(r.date) === currentYear)
    .reduce((s, r) => s + r.count, 0);
  const recentCO2 = records
    .filter(r => getYearFromDate(r.date) === currentYear)
    .reduce((s, r) => s + r.co2, 0);

  const treeTrend = recentTrees > 0 ? `+${recentTrees.toLocaleString()}` : undefined;
  const co2Trend = recentCO2 > 0 ? `+${recentCO2} ton` : undefined;

  const co2EmitidoEstimado = Math.round(totalTrees * 0.5 / 100);
  const irrValue = co2EmitidoEstimado > 0 ? (totalCO2 / co2EmitidoEstimado).toFixed(2) : '—';
  const displayed = showAll ? records : records.slice(0, 4);

  const handleSubmit = async () => {
    if (!formData.species || !formData.count) return;
    const count = parseInt(formData.count) || 0;
    try {
      const res = await apiFetch('/api/produccion/arboles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          especie: formData.species,
          cantidad: count,
          fecha: formData.date || undefined,
          sector: formData.location || null,
          status: formData.status || 'joven',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error al registrar plantación');
      }
      const json = await res.json();
      if (json.data) {
        setRecords((prev) => [mapRowToTreeRecord(json.data as ArbolApiRow), ...prev]);
        toast('Plantación registrada exitosamente', { type: 'success' });
      }
    } catch (err) {
      toast(friendlyError(err, 'Error al registrar plantación'), { type: 'error' });
    }
    setFormData({ species: '', count: '', location: '', notes: '', date: '', status: 'joven' });
    setShowForm(false);
  };

  const handleEditClick = (r: TreeRecord) => {
    setEditingRecord(r);
    setEditFormData({
      species: r.species,
      count: String(r.count),
      location: r.location,
      date: r.date,
      status: r.status,
    });
  };

  const handleUpdate = async () => {
    if (!editingRecord || !editFormData.species || !editFormData.count) return;
    const count = parseInt(editFormData.count) || 0;
    try {
      const res = await apiFetch(`/api/produccion/arboles/${editingRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          especie: editFormData.species,
          cantidad: count,
          fecha: editFormData.date || undefined,
          sector: editFormData.location || null,
          status: editFormData.status,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error al actualizar registro');
      }
      const json = await res.json();
      if (json.data) {
        setRecords((prev) =>
          prev.map((item) =>
            item.id === editingRecord.id ? mapRowToTreeRecord(json.data as ArbolApiRow) : item,
          ),
        );
        toast('Registro actualizado exitosamente', { type: 'success' });
        setEditingRecord(null);
      }
    } catch (err) {
      toast(friendlyError(err, 'Error al actualizar registro'), { type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este registro de reforestación? Esta acción no se puede deshacer.')) return;
    try {
      const res = await apiFetch(`/api/produccion/arboles/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error al eliminar registro');
      }
      setRecords((prev) => prev.filter((item) => item.id !== id));
      toast('Registro eliminado exitosamente', { type: 'success' });
    } catch (err) {
      toast(friendlyError(err, 'Error al eliminar registro'), { type: 'error' });
    }
  };

  if (loading) {
    return <ViewLoading variant="view" label="Registro del bosque" hideLabel />;
  }

  return (
    <div className="space-y-6 animate-in">
      <ViewShell
        eyebrow="Regeneración 🌿"
        title="Cada árbol plantado es un legado que el tiempo honra"
        subtitle={`${anosLegado} años de reforestación nativa en Chiloé. Cada lote de miel está vinculado directamente a los árboles que alimentan a las abejas.`}
      />

      <div className="stats-grid">
        {[
          { icon: <TreePine size={20} />, val: totalTrees.toLocaleString(), label: 'Árboles plantados', trend: treeTrend },
          { icon: <Leaf size={20} />, val: `${totalCO2} ton`, label: 'CO₂ secuestrado', trend: co2Trend },
          { icon: <MapPin size={20} />, val: String(uniqueZones), label: 'Zonas reforestadas' },
          { icon: <Camera size={20} />, val: String(uniqueSpecies), label: 'Especies nativas' },
        ].map((s, i) => (
          <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
            <div className="stat-header">
              <div className="stat-icon">{s.icon}</div>
              {s.trend && <span className="stat-trend up">{s.trend}</span>}
            </div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card animate-in delay-2 mt-6">
        <div className="section-header">
          <div>
            <div className="section-title">Registro de Reforestación</div>
            <div className="section-subtitle">Trazabilidad directa: árbol ↔ colmena ↔ lote de miel</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-sm text-xs text-success bg-success/10 border border-success/30">
              IRR: {irrValue} {irrValue !== '—' && Number(irrValue) > 1 ? '(Impacto > Huella)' : ''}
            </div>
            <button className="btn btn-gold btn-sm" onClick={() => setShowForm(true)}>
              <Plus size={14} /> Registrar plantación
            </button>
          </div>
        </div>

        <div className="colmena-list">
          {records.length === 0 && (
            <div className="text-center py-10 px-4 text-muted-foreground">
              <div className="text-3xl mb-3 opacity-60">🌱</div>
              <p className="text-sm font-medium text-foreground mb-1">Sin registros de reforestación</p>
              <p className="text-xs">Registra tu primera plantación para comenzar el legado del bosque.</p>
            </div>
          )}
          {displayed.map(r => (
            <div key={r.id} className="colmena-item" style={{ position: 'relative' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: r.status === 'adulto' ? 'hsl(var(--success) / 0.15)' : r.status === 'creciendo' ? 'hsl(var(--accent) / 0.1)' : 'hsl(var(--info) / 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🌳</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'hsl(var(--foreground))' }}>{r.species} × {r.count.toLocaleString()}</div>
                <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>{r.location} · {r.date}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${r.status === 'adulto' ? 'badge-success' : r.status === 'creciendo' ? 'badge-gold' : 'badge-warning'}`}>{r.status === 'adulto' ? 'Adulto' : r.status === 'creciendo' ? 'Creciendo' : 'Joven'}</span>
                  <div style={{ fontSize: '0.72rem', color: 'hsl(var(--success))', marginTop: 4 }}>🌿 {r.co2} ton CO₂</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleEditClick(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: 4 }} title="Editar">
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--destructive))', padding: 4 }} title="Eliminar">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {records.length > 4 && (
          <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAll(!showAll)}>{showAll ? 'Ver menos' : `Ver todos (${records.length})`} <ChevronDown size={14} style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} /></button>
          </div>
        )}
      </div>

      <ImmersiveModal
        open={showForm}
        onClose={() => setShowForm(false)}
        eyebrow="Regeneración"
        title="Registrar plantación"
        size="lg"
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="btn btn-primary btn-sm" onClick={handleSubmit}>Guardar registro</button>
          </>
        }
      >
        <div className="form-grid-2 gap-4">
          <div>
            <label className="micro-label block mb-1">Especie</label>
            <input type="text" placeholder="Ej: Ulmo, Tepú, Canelo..." value={formData.species} onChange={e => setFormData(prev => ({ ...prev, species: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="micro-label block mb-1">Cantidad</label>
            <input type="number" placeholder="Número de árboles" value={formData.count} onChange={e => setFormData(prev => ({ ...prev, count: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="micro-label block mb-1">Ubicación / Sector</label>
            <input type="text" placeholder="Sector o coordenada" value={formData.location} onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="micro-label block mb-1">Fecha</label>
            <input type="text" placeholder="Ej: 2026-06-13 o rango" value={formData.date} onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="micro-label block mb-1">Estado de Crecimiento</label>
            <select value={formData.status} onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))} className="input-field">
              <option value="joven">Joven</option>
              <option value="creciendo">Creciendo</option>
              <option value="adulto">Adulto</option>
            </select>
          </div>
          <div>
            <label className="micro-label block mb-1">Notas</label>
            <input type="text" placeholder="Observaciones (opcional)" value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="input-field" />
          </div>
        </div>
      </ImmersiveModal>

      <ImmersiveModal
        open={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        eyebrow="Regeneración"
        title="Editar registro"
        size="lg"
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditingRecord(null)}>Cancelar</button>
            <button className="btn btn-primary btn-sm" onClick={handleUpdate}>Guardar cambios</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="micro-label block mb-1">Especie</label>
            <input type="text" value={editFormData.species} onChange={e => setEditFormData(prev => ({ ...prev, species: e.target.value }))} className="input-field w-full" />
          </div>
          <div>
            <label className="micro-label block mb-1">Cantidad de árboles</label>
            <input type="number" value={editFormData.count} onChange={e => setEditFormData(prev => ({ ...prev, count: e.target.value }))} className="input-field w-full" />
          </div>
          <div>
            <label className="micro-label block mb-1">Ubicación / Sector</label>
            <input type="text" value={editFormData.location} onChange={e => setEditFormData(prev => ({ ...prev, location: e.target.value }))} className="input-field w-full" />
          </div>
          <div>
            <label className="micro-label block mb-1">Fecha</label>
            <input type="text" value={editFormData.date} onChange={e => setEditFormData(prev => ({ ...prev, date: e.target.value }))} className="input-field w-full" />
          </div>
          <div>
            <label className="micro-label block mb-1">Estado de crecimiento</label>
            <select value={editFormData.status} onChange={e => setEditFormData(prev => ({ ...prev, status: e.target.value as TreeRecord['status'] }))} className="input-field w-full">
              <option value="joven">Joven</option>
              <option value="creciendo">Creciendo</option>
              <option value="adulto">Adulto</option>
            </select>
          </div>
        </div>
      </ImmersiveModal>

      {/* Impact summary */}
      <div className="card animate-in delay-3" style={{ marginTop: 'var(--space-lg)', background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))', color: 'hsl(var(--primary-foreground))', border: 'none' }}>
        <div style={{ fontFamily: 'var(--font-existencial)', fontSize: '1.1rem', color: 'hsl(var(--accent))', marginBottom: 'var(--space-md)' }}>Impacto Regenerativo</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-lg)', textAlign: 'center' }}>
          <div><div style={{ fontSize: '2rem', fontWeight: 700, color: 'hsl(var(--accent))' }}>{totalTrees.toLocaleString()}</div><div style={{ fontSize: '0.78rem', opacity: 0.6 }}>Árboles vivos</div></div>
          <div><div style={{ fontSize: '2rem', fontWeight: 700, color: 'hsl(var(--success))' }}>{totalCO2}</div><div style={{ fontSize: '0.78rem', opacity: 0.6 }}>Toneladas CO₂</div></div>
          <div><div style={{ fontSize: '2rem', fontWeight: 700 }}>{anosLegado}</div><div style={{ fontSize: '0.78rem', opacity: 0.6 }}>Años de legado</div></div>
        </div>
      </div>
    </div>
  );
}
