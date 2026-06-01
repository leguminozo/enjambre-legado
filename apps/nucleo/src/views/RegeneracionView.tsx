import { useState, useEffect } from 'react';
import { TreePine, Camera, MapPin, Leaf, Plus, ChevronDown } from 'lucide-react';

import { supabase } from '@/lib/supabase';

interface TreeRecord {
  id: string; species: string; count: number; date: string; location: string; co2: number; status: 'creciendo' | 'adulto' | 'joven';
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
  };
}

export default function RegeneracionView() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ species: '', count: '', location: '', notes: '' });
  const [records, setRecords] = useState<TreeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function loadTrees() {
      setLoading(true);
      try {
        const { data } = await supabase.from('arboles_plantados').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) {
          setRecords(data.map((r) => mapRowToTreeRecord(r as Record<string, unknown>)));
        }
      } catch (err) {
        console.error('Error loading arboles_plantados:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTrees();
  }, []);

  const totalTrees = records.reduce((s, r) => s + r.count, 0);
  const totalCO2 = records.reduce((s, r) => s + r.co2, 0);
  const uniqueZones = new Set(records.map(r => r.location)).size;
  const uniqueSpecies = new Set(records.map(r => r.species)).size;
  const displayed = showAll ? records : records.slice(0, 4);

  const handleSubmit = async () => {
    if (!formData.species || !formData.count) return;
    const count = parseInt(formData.count) || 0;
    try {
      const { data } = await supabase.from('arboles_plantados').insert({
        especie: formData.species,
        cantidad: count,
        fecha: String(new Date().getFullYear()),
        sector: formData.location || null,
        co2_ton: Math.round(count * 0.05),
        status: 'joven',
      }).select().single();
      if (data) {
        setRecords(prev => [mapRowToTreeRecord(data as Record<string, unknown>), ...prev]);
      }
    } catch (err) {
      console.error('Error inserting arbol:', err);
    }
    setFormData({ species: '', count: '', location: '', notes: '' });
    setShowForm(false);
  };

    if (loading) {
    return <div style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'hsl(var(--foreground))' }}>Cargando registro del bosque...</div>;
  }

  return (
        <div>
            <div className="hero-banner animate-in" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.85) 0%, hsl(var(--primary)) 50%, hsl(var(--primary) / 0.7) 100%)' }}>
                <div className="hero-greeting">Módulo de Regeneración 🌿</div>
                <h1 className="hero-title">Cada árbol plantado es un legado que el tiempo honra</h1>
                <p className="hero-subtitle">22 años de reforestación nativa en Chiloé. Cada lote de miel está vinculado directamente a los árboles que alimentan a las abejas.</p>
            </div>

            <div className="stats-grid">
                {[
                    { icon: <TreePine size={20} />, val: totalTrees.toLocaleString(), label: 'Árboles plantados', trend: '+200' },
                    { icon: <Leaf size={20} />, val: `${totalCO2} ton`, label: 'CO₂ secuestrado', trend: '+10' },
{ icon: <MapPin size={20} />, val: String(uniqueZones), label: 'Zonas reforestadas' },
      { icon: <Camera size={20} />, val: String(uniqueSpecies), label: 'Especies nativas' },
                ].map((s, i) => (
                    <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
                        <div className="stat-header"><div className="stat-icon">{s.icon}</div>{s.trend && <span className="stat-trend up">{s.trend}</span>}</div>
                        <div className="stat-value">{s.val}</div><div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="card animate-in delay-2" style={{ marginTop: 'var(--space-lg)' }}>
                <div className="section-header">
                    <div><div className="section-title">Registro de Reforestación</div><div className="section-subtitle">Trazabilidad directa: árbol ↔ colmena ↔ lote de miel</div></div>
                    <button className="btn btn-gold btn-sm" onClick={() => setShowForm(!showForm)}><Plus size={14} /> Registrar plantación</button>
                </div>

                {showForm && (
                    <div style={{ padding: 'var(--space-lg)', background: 'hsl(var(--accent) / 0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', border: '1px solid hsl(var(--accent) / 0.25)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                            {[
                                { label: 'Especie', key: 'species', ph: 'Ej: Ulmo, Tepú, Canelo...' },
                                { label: 'Cantidad', key: 'count', ph: 'Número de árboles' },
                                { label: 'Ubicación', key: 'location', ph: 'Sector o coordenada' },
                                { label: 'Notas', key: 'notes', ph: 'Observaciones (opcional)' },
                            ].map(field => (
                                <div key={field.key}>
                                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>{field.label}</div>
                                    <input type={field.key === 'count' ? 'number' : 'text'} placeholder={field.ph} value={(formData as Record<string, string>)[field.key]} onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                        style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid hsl(var(--input))', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-datos)', fontSize: '0.85rem', background: 'hsl(var(--card))' }} />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancelar</button>
                            <button className="btn btn-primary btn-sm" onClick={handleSubmit}>Guardar registro</button>
                        </div>
                    </div>
                )}

                <div className="colmena-list">
                    {displayed.map(r => (
                        <div key={r.id} className="colmena-item">
                            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: r.status === 'adulto' ? 'hsl(var(--success) / 0.15)' : r.status === 'creciendo' ? 'hsl(var(--accent) / 0.1)' : 'hsl(var(--info) / 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🌳</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'hsl(var(--foreground))' }}>{r.species} × {r.count.toLocaleString()}</div>
                                <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>{r.location} · {r.date}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span className={`badge ${r.status === 'adulto' ? 'badge-success' : r.status === 'creciendo' ? 'badge-gold' : 'badge-warning'}`}>{r.status === 'adulto' ? 'Adulto' : r.status === 'creciendo' ? 'Creciendo' : 'Joven'}</span>
                                <div style={{ fontSize: '0.72rem', color: 'hsl(var(--success))', marginTop: 4 }}>🌿 {r.co2} ton CO₂</div>
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

            {/* Impact summary */}
            <div className="card animate-in delay-3" style={{ marginTop: 'var(--space-lg)', background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))', color: 'hsl(var(--primary-foreground))', border: 'none' }}>
                <div style={{ fontFamily: 'var(--font-existencial)', fontSize: '1.1rem', color: 'hsl(var(--accent))', marginBottom: 'var(--space-md)' }}>Impacto Regenerativo</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-lg)', textAlign: 'center' }}>
                    <div><div style={{ fontSize: '2rem', fontWeight: 700, color: 'hsl(var(--accent))' }}>{totalTrees.toLocaleString()}</div><div style={{ fontSize: '0.78rem', opacity: 0.6 }}>Árboles vivos</div></div>
                    <div><div style={{ fontSize: '2rem', fontWeight: 700, color: 'hsl(var(--success))' }}>{totalCO2}</div><div style={{ fontSize: '0.78rem', opacity: 0.6 }}>Toneladas CO₂</div></div>
                    <div><div style={{ fontSize: '2rem', fontWeight: 700 }}>22</div><div style={{ fontSize: '0.78rem', opacity: 0.6 }}>Años de legado</div></div>
                </div>
            </div>
        </div>
    );
}
