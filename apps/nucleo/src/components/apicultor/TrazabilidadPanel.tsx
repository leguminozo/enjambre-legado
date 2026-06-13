import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, ChevronRight, CheckCircle2, ImageOff, Plus, X, Loader2, AlertTriangle, TrendingDown } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface Lote {
  id: string;
  nombre_lote?: string;
  kg_total: number;
  estado: string;
  productos: Array<{
    id: string;
    nombre: string;
    peso_neto_g: number;
    stock: number;
  }>;
  blockchain_hash?: string;
}

interface ProduccionData {
  data: {
    lotes: Lote[];
    stats: {
      total_kg_lotes: number;
      lotes_criticos: number;
      productos_quiebre: number;
    };
  };
}

export function TrazabilidadPanel() {
  const apiFetch = useApiFetch();
  const { data: prodData, isLoading } = useQuery<ProduccionData>({
    queryKey: ['produccion-dashboard'],
    queryFn: async () => {
      const res = await apiFetch('/api/produccion/dashboard');
      if (!res.ok) throw new Error('Error cargando produccion');
      return res.json();
    },
    staleTime: 60_000,
  });
  const [selectedLote, setSelectedLote] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'arboles' | 'lotes' | 'reflexiones'>('lotes');

  const [localArboles, setLocalArboles] = useState<Array<{ id: string; especie: string; cantidad: number; sector: string; fecha: string; status: string; lotesMiel: string[]; co2_ton: number; coordenadas: { lat: number; lng: number } }>>([]);
  const [localReflexiones, setLocalReflexiones] = useState<Array<{ fecha: string; colmena: string; texto: string }>>([]);

  const [showArbolForm, setShowArbolForm] = useState(false);
  const [arbolForm, setArbolForm] = useState({ especie: 'Ulmo', cantidad: 0, sector: '' });

  const [showReflexionForm, setShowReflexionForm] = useState(false);
  const [reflexionForm, setReflexionForm] = useState({ colmena: '', texto: '' });

  const totalTrees = localArboles.reduce((s, a) => s + a.cantidad, 0);
  const totalCO2 = localArboles.reduce((s, a) => s + a.co2_ton, 0);

  const handleAddArbol = () => {
    if (!arbolForm.cantidad || !arbolForm.sector) return;
    setLocalArboles([{
      id: 'n_' + Date.now(),
      especie: arbolForm.especie,
      cantidad: arbolForm.cantidad,
      sector: arbolForm.sector,
      fecha: new Date().toLocaleDateString('es-CL'),
      status: 'creciendo',
      lotesMiel: ['Pendiente'],
      co2_ton: parseFloat((arbolForm.cantidad * 0.05).toFixed(2)),
      coordenadas: { lat: -42.6, lng: -73.8 }
    }, ...localArboles]);
    setShowArbolForm(false);
    setArbolForm({ especie: 'Ulmo', cantidad: 0, sector: '' });
  };

  const handleAddReflexion = () => {
    if (!reflexionForm.texto) return;
    setLocalReflexiones([{
      fecha: new Date().toLocaleDateString('es-CL'),
      colmena: reflexionForm.colmena || 'General',
      texto: reflexionForm.texto
    }, ...localReflexiones]);
    setShowReflexionForm(false);
    setReflexionForm({ colmena: '', texto: '' });
  };

  const lotes = prodData?.data?.lotes || [];
  const stats = prodData?.data?.stats || { total_kg_lotes: 0, lotes_criticos: 0, productos_quiebre: 0 };

  if (isLoading) return (
    <div className="flex items-center justify-center p-20">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      <div className="grid grid-cols-3 gap-4">
        {[
          { val: stats.total_kg_lotes.toFixed(1) + ' kg', label: 'Stock en Lotes', color: 'hsl(var(--accent))' },
          { val: stats.lotes_criticos, label: 'Lotes Críticos (<50kg)', color: 'var(--text-destructive)' },
          { val: stats.productos_quiebre, label: 'Productos en Quiebre', color: 'var(--text-destructive)' },
        ].map((s, i) => (
          <div key={i} className="text-center p-6 bg-primary/[0.04] rounded-md">
            <div className="text-[1.8rem] font-bold" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[0.72rem] text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        {([['arboles', '🌳 Bosque plantado'], ['lotes', '🍯 Lotes de miel'], ['reflexiones', '📖 Reflexiones']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`btn btn-sm ${activeTab === id ? 'btn-primary' : 'btn-ghost'} text-[0.78rem]`}>{label}</button>
        ))}
      </div>

      {activeTab === 'arboles' && (
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Registro de Reforestación</div>
              <div className="section-subtitle">Árbol → Colmena → Lote de miel · Trazabilidad completa</div>
            </div>
            <button className="btn btn-gold btn-sm" onClick={() => setShowArbolForm(true)}><Plus size={14} style={{ marginRight: 4 }} /> Planta</button>
          </div>

          {showArbolForm && (
            <div className="p-4 bg-miel-glow rounded-md mb-4 border border-accent/30 relative">
              <button onClick={() => setShowArbolForm(false)} className="absolute top-3 right-3 bg-transparent border-none cursor-pointer text-muted-foreground"><X size={16} /></button>
              <div className="text-[0.85rem] font-semibold text-bosque mb-2">Registrar Reforestación</div>

              <div className="grid grid-cols-3 gap-2 mb-2">
                <select className="input-field" value={arbolForm.especie} onChange={e => setArbolForm({ ...arbolForm, especie: e.target.value })}>
                  <option value="Ulmo">Ulmo</option>
                  <option value="Tepú">Tepú</option>
                  <option value="Tiaca">Tiaca</option>
                  <option value="Avellano">Avellano</option>
                </select>
                <input type="number" placeholder="Cantidad" className="input-field" value={arbolForm.cantidad || ''} onChange={e => setArbolForm({ ...arbolForm, cantidad: parseInt(e.target.value) || 0 })} />
                <input type="text" placeholder="Sector" className="input-field" value={arbolForm.sector} onChange={e => setArbolForm({ ...arbolForm, sector: e.target.value })} />
              </div>

              <div className="flex justify-end items-center gap-3">
                <span className="text-[0.7rem] text-muted-foreground">Proyección: ~{(arbolForm.cantidad * 0.05).toFixed(2)} ton CO₂/año</span>
                <button className="btn btn-primary btn-sm" onClick={handleAddArbol}>Registrar Vida</button>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {localArboles.map(a => (
              <div key={a.id} className="flex items-center gap-4 p-4 rounded-sm border border-primary/[0.06] bg-primary/[0.01]">
                <div className="text-[1.5rem] shrink-0">🌳</div>
                <div className="flex-1">
                  <div className="font-semibold text-bosque text-[0.9rem]">
                    {a.especie} × {a.cantidad.toLocaleString()}
                  </div>
                  <div className="text-[0.72rem] text-muted-foreground">
                    {a.sector} · {a.fecha}
                  </div>
                  <div className="text-[0.7rem] text-success mt-0.5">
                    🍯 Lotes: {a.lotesMiel.join(', ')}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`badge ${a.status === 'adulto' ? 'badge-success' : a.status === 'creciendo' ? 'badge-gold' : 'badge-warning'}`}>
                    {a.status}
                  </span>
                  <div className="text-[0.7rem] text-success mt-1">
                    🌿 {a.co2_ton} ton CO₂
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'lotes' && (
        <div className="card">
          <div className="section-header">
            <div><div className="section-title">Lotes y Producción Real</div>
            <div className="section-subtitle">Kg disponibles en bodega vs Productos vinculados</div></div>
          </div>
          <div className="flex flex-col gap-2">
            {lotes.map((l: Lote) => (
              <div key={l.id} onClick={() => setSelectedLote(selectedLote === l.id ? null : l.id)}
                className={`p-4 rounded-sm cursor-pointer transition-all duration-150 ${selectedLote === l.id ? 'border border-accent/40 bg-miel-glow' : 'border border-primary/[0.06] bg-transparent'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-bosque text-[0.88rem]">
                      {l.nombre_lote || `Lote ${l.id.slice(0, 8)}`}
                    </div>
                    <div className="text-[0.72rem] text-muted-foreground">
                      Stock: <strong>{Number(l.kg_total).toFixed(2)} kg</strong> · {l.estado}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {Number(l.kg_total) < 50 && (
                      <span className="badge badge-warning text-[0.62rem]">
                        <AlertTriangle size={9} style={{ display: 'inline', marginRight: 3 }} />Stock Bajo
                      </span>
                    )}
                    <ChevronRight size={14} className="text-muted-foreground" style={{ transform: selectedLote === l.id ? 'rotate(90deg)' : 'none', transition: 'transform 200ms' }} />
                  </div>
                </div>
                {selectedLote === l.id && (
                  <div className="mt-4 pt-4 border-t border-accent/20">
                    <div className="text-[0.75rem] font-semibold mb-2 text-bosque">Productos del Lote:</div>
                    {l.productos?.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {l.productos.map((p) => (
                          <div key={p.id} className="flex justify-between text-[0.75rem] bg-foreground/[0.03] px-2 py-1 rounded">
                            <span>{p.nombre} ({p.peso_neto_g}g)</span>
                            <span className="font-semibold">{p.stock} un.</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[0.7rem] text-muted-foreground italic">Sin productos asignados</div>
                    )}
                    <div className="mt-3 flex gap-2 text-[0.78rem]">
                      <span className="text-muted-foreground w-[90px] shrink-0">Blockchain</span>
                      <span className="font-mono text-success font-medium break-all">{l.blockchain_hash || 'Sin firmar'}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reflexiones' && (
        <div className="flex flex-col gap-4">

          <button className="btn btn-gold w-full flex justify-center" onClick={() => setShowReflexionForm(true)}>
            <Plus size={16} /> Agregar Reflexión del Bosque
          </button>

          {showReflexionForm && (
            <div className="p-4 bg-miel-glow rounded-md border border-accent/30 relative">
              <button onClick={() => setShowReflexionForm(false)} className="absolute top-3 right-3 bg-transparent border-none cursor-pointer text-muted-foreground"><X size={16} /></button>
              <div className="text-[0.85rem] font-semibold text-bosque mb-2">Nueva Reflexión ({new Date().toLocaleDateString('es-CL')})</div>

              <input type="text" placeholder="Colmena (opcional, ej. 'Quilineja Madre')" className="input-field mb-2" value={reflexionForm.colmena} onChange={e => setReflexionForm({ ...reflexionForm, colmena: e.target.value })} />

              <textarea placeholder="Qué observaste en la naturaleza, el comportamiento de las abejas o el clima hoy..." className="input-field mb-2" value={reflexionForm.texto} onChange={e => setReflexionForm({ ...reflexionForm, texto: e.target.value })} style={{ minHeight: 80, resize: 'vertical' }} />

              <div className="flex justify-end">
                <button className="btn btn-primary btn-sm" onClick={handleAddReflexion}>Guardar Legado</button>
              </div>
            </div>
          )}

          {localReflexiones.map((r, i) => (
            <div key={i} className="card" style={i === 0 ? { background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))', border: 'none', color: 'hsl(var(--foreground))' } : undefined}>
              <div className="flex justify-between mb-2">
                <div className="text-[0.65rem] uppercase tracking-[0.12em]" style={{ color: i === 0 ? 'hsl(var(--accent))' : undefined }}>
                  <span className={i !== 0 ? 'text-muted-foreground' : ''}>Reflexión del bosque · {r.fecha}</span>
                </div>
                <div className="text-[0.68rem]" style={{ color: i === 0 ? 'hsl(var(--foreground) / 0.5)' : undefined }}>
                  <span className={i !== 0 ? 'text-muted-foreground' : ''}>{r.colmena}</span>
                </div>
              </div>
              <div className={`h-[${i === 0 ? 120 : 80}px] rounded-sm flex items-center justify-center mb-4 gap-2 ${i === 0 ? 'bg-foreground/[0.08]' : 'bg-primary/[0.05]'}`} style={{ height: i === 0 ? 120 : 80 }}>
                <ImageOff size={18} style={{ color: i === 0 ? 'hsl(var(--foreground) / 0.3)' : undefined }} className={i !== 0 ? 'text-muted-foreground' : ''} />
                <span className="text-[0.75rem]" style={{ color: i === 0 ? 'hsl(var(--foreground) / 0.3)' : undefined }}>
                  <span className={i !== 0 ? 'text-muted-foreground' : ''}>Foto de visita · Toca para agregar</span>
                </span>
              </div>
              <p className="italic leading-relaxed" style={{ fontFamily: 'var(--font-existencial)', fontSize: i === 0 ? '0.95rem' : '0.88rem', color: i === 0 ? 'hsl(var(--foreground) / 0.85)' : undefined }}>
                <span className={i !== 0 ? 'text-muted-foreground' : ''}>{r.texto}</span>
              </p>
              <div className="mt-4 text-[0.7rem]" style={{ color: i === 0 ? 'hsl(var(--foreground) / 0.35)' : undefined }}>
                <span className={i !== 0 ? 'text-muted-foreground' : ''}>— Generado por IA a partir de tus notas de visita</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
