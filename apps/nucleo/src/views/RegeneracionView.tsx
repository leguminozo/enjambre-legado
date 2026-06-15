import { useState, useEffect } from 'react';
import { TreePine, Camera, MapPin, Leaf, Plus, ChevronDown, Edit3, Trash2, X } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { toast, friendlyError } from '@enjambre/ui';
import { arbolesPlantados } from '@/data/mockData';

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

function mapRowToTreeRecord(r: Record<string, unknown>): TreeRecord {
  return {
    id: String(r.id),
    species: String(r.especie ?? ''),
    count: Number(r.cantidad) || 0,
    date: String(r.fecha ?? ''),
    location: String(r.sector ?? ''),
    co2: Number(r.co2_ton) || 0,
    status: (['joven', 'creciendo', 'adulto'].includes(String(r.status)) ? String(r.status) : 'joven') as TreeRecord['status'],
    user_id: r.user_id ? String(r.user_id) : null,
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
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ species: '', count: '', location: '', notes: '', date: '', status: 'joven' });
  const [records, setRecords] = useState<TreeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<TreeRecord | null>(null);
  const [editFormData, setEditFormData] = useState({ species: '', count: '', location: '', date: '', status: 'joven' });

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const uid = user?.id || null;
        setUserId(uid);

        const { data, error } = await supabase.from('arboles_plantados').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        if (data && data.length > 0) {
          setRecords(data.map((r: Record<string, unknown>) => mapRowToTreeRecord(r)));
        } else {
          // Seeding
          const mockRecords = arbolesPlantados.map(a => ({
            especie: a.especie,
            cantidad: a.cantidad,
            fecha: a.fecha,
            sector: a.sector,
            lat: a.coordenadas.lat,
            lng: a.coordenadas.lng,
            co2_ton: a.co2_ton,
            status: a.status,
            user_id: uid,
          }));

          const { data: seeded, error: seedError } = await supabase
            .from('arboles_plantados')
            .insert(mockRecords)
            .select();

          if (seedError) throw seedError;
          if (seeded) {
            setRecords(seeded.map((r: Record<string, unknown>) => mapRowToTreeRecord(r)));
          }
        }
      } catch (err) {
        toast(friendlyError(err, 'Error al cargar o inicializar registros del bosque'), { type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

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
      const { data, error } = await supabase.from('arboles_plantados').insert({
        especie: formData.species,
        cantidad: count,
        fecha: formData.date || new Date().toISOString().split('T')[0],
        sector: formData.location || null,
        co2_ton: Math.round(count * 0.05),
        status: formData.status || 'joven',
        user_id: userId,
      }).select().single();

      if (error) throw error;
      if (data) {
        setRecords(prev => [mapRowToTreeRecord(data as Record<string, unknown>), ...prev]);
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
      const { data, error } = await supabase
        .from('arboles_plantados')
        .update({
          especie: editFormData.species,
          cantidad: count,
          fecha: editFormData.date || new Date().toISOString().split('T')[0],
          sector: editFormData.location || null,
          co2_ton: Math.round(count * 0.05),
          status: editFormData.status,
        })
        .eq('id', editingRecord.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setRecords(prev => prev.map(item => item.id === editingRecord.id ? mapRowToTreeRecord(data as Record<string, unknown>) : item));
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
      const { error } = await supabase.from('arboles_plantados').delete().eq('id', id);
      if (error) throw error;
      setRecords(prev => prev.filter(item => item.id !== id));
      toast('Registro eliminado exitosamente', { type: 'success' });
    } catch (err) {
      toast(friendlyError(err, 'Error al eliminar registro'), { type: 'error' });
    }
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'hsl(var(--foreground))' }}>Cargando registro del bosque...</div>;
  }

  return (
    <div>
      <div className="hero-banner animate-in" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.85) 0%, hsl(var(--primary)) 50%, hsl(var(--primary) / 0.7) 100%)' }}>
        <div className="hero-greeting">Módulo de Regeneración 🌿</div>
        <h1 className="hero-title">Cada árbol plantado es un legado que el tiempo honra</h1>
        <p className="hero-subtitle">{anosLegado} años de reforestación nativa en Chiloé. Cada lote de miel está vinculado directamente a los árboles que alimentan a las abejas.</p>
      </div>

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

      <div className="card animate-in delay-2" style={{ marginTop: 'var(--space-lg)' }}>
        <div className="section-header">
          <div>
            <div className="section-title">Registro de Reforestación</div>
            <div className="section-subtitle">Trazabilidad directa: árbol ↔ colmena ↔ lote de miel</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ padding: '6px 14px', background: 'hsl(var(--success) / 0.1)', border: '1px solid hsl(var(--success) / 0.3)', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', color: 'hsl(var(--success))' }}>
              IRR: {irrValue} {irrValue !== '—' && Number(irrValue) > 1 ? '(Impacto > Huella)' : ''}
            </div>
            <button className="btn btn-gold btn-sm" onClick={() => setShowForm(!showForm)}>
              <Plus size={14} /> Registrar plantación
            </button>
          </div>
        </div>

        {showForm && (
          <div style={{ padding: 'var(--space-lg)', background: 'hsl(var(--accent) / 0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', border: '1px solid hsl(var(--accent) / 0.25)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Especie</div>
                <input type="text" placeholder="Ej: Ulmo, Tepú, Canelo..." value={formData.species} onChange={e => setFormData(prev => ({ ...prev, species: e.target.value }))}
                  style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid hsl(var(--input))', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-datos)', fontSize: '0.85rem', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Cantidad</div>
                <input type="number" placeholder="Número de árboles" value={formData.count} onChange={e => setFormData(prev => ({ ...prev, count: e.target.value }))}
                  style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid hsl(var(--input))', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-datos)', fontSize: '0.85rem', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Ubicación / Sector</div>
                <input type="text" placeholder="Sector o coordenada" value={formData.location} onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid hsl(var(--input))', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-datos)', fontSize: '0.85rem', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Fecha</div>
                <input type="text" placeholder="Ej: 2026-06-13 o rango" value={formData.date} onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid hsl(var(--input))', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-datos)', fontSize: '0.85rem', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Estado de Crecimiento</div>
                <select value={formData.status} onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid hsl(var(--input))', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-datos)', fontSize: '0.85rem', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}>
                  <option value="joven">Joven</option>
                  <option value="creciendo">Creciendo</option>
                  <option value="adulto">Adulto</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Notas</div>
                <input type="text" placeholder="Observaciones (opcional)" value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid hsl(var(--input))', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-datos)', fontSize: '0.85rem', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={handleSubmit}>Guardar registro</button>
            </div>
          </div>
        )}

        <div className="colmena-list">
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

      {/* Edit Modal (Glassmorphism design) */}
      {editingRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-md)' }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <h3 style={{ fontFamily: 'var(--font-existencial)', fontSize: '1.2rem', color: 'hsl(var(--accent))', margin: 0 }}>Editar Registro de Reforestación</h3>
              <button onClick={() => setEditingRecord(null)} style={{ background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Especie</div>
                <input type="text" value={editFormData.species} onChange={e => setEditFormData(prev => ({ ...prev, species: e.target.value }))}
                  style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid hsl(var(--input))', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-datos)', fontSize: '0.85rem', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} />
              </div>
              
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Cantidad de Árboles</div>
                <input type="number" value={editFormData.count} onChange={e => setEditFormData(prev => ({ ...prev, count: e.target.value }))}
                  style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid hsl(var(--input))', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-datos)', fontSize: '0.85rem', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} />
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Ubicación / Sector</div>
                <input type="text" value={editFormData.location} onChange={e => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                  style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid hsl(var(--input))', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-datos)', fontSize: '0.85rem', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} />
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Fecha</div>
                <input type="text" value={editFormData.date} onChange={e => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                  style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid hsl(var(--input))', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-datos)', fontSize: '0.85rem', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} />
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Estado de Crecimiento</div>
                <select value={editFormData.status} onChange={e => setEditFormData(prev => ({ ...prev, status: e.target.value as TreeRecord['status'] }))}
                  style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid hsl(var(--input))', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-datos)', fontSize: '0.85rem', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}>
                  <option value="joven">Joven</option>
                  <option value="creciendo">Creciendo</option>
                  <option value="adulto">Adulto</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-xl)', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingRecord(null)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={handleUpdate}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

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
