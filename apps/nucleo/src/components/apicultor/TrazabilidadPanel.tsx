import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ImageOff, Plus, X, AlertTriangle, TrendingDown } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge, Spinner, toast, friendlyError } from '@enjambre/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { supabase } from '@/lib/supabase';

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

interface ArbolRow {
  id: string;
  especie: string;
  cantidad: number;
  sector: string;
  fecha: string;
  status: string;
  lotesMiel: string[];
  co2_ton: number;
}

interface ReflexionRow {
  id: string;
  fecha: string;
  colmena: string;
  texto: string;
}

export function TrazabilidadPanel() {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
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

  const { data: localArboles = [], isLoading: loadingArboles } = useQuery<ArbolRow[]>({
    queryKey: ['trazabilidad-arboles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arboles_plantados')
        .select('id, especie, cantidad, sector, fecha, status, co2_ton, lote_id')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        especie: String(r.especie ?? ''),
        cantidad: Number(r.cantidad) || 0,
        sector: String(r.sector ?? ''),
        fecha: r.fecha ? String(r.fecha) : '—',
        status: String(r.status ?? 'joven'),
        co2_ton: Number(r.co2_ton) || 0,
        lotesMiel: r.lote_id ? [`Lote ${String(r.lote_id).slice(0, 8)}`] : ['Sin lote'],
      }));
    },
    staleTime: 30_000,
  });

  const { data: localReflexiones = [], isLoading: loadingReflexiones } = useQuery<ReflexionRow[]>({
    queryKey: ['trazabilidad-reflexiones'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('reflexiones')
        .select('id, content, date_display, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id),
        fecha: r.created_at
          ? new Date(String(r.created_at)).toLocaleDateString('es-CL')
          : new Date().toLocaleDateString('es-CL'),
        colmena: String(r.date_display ?? 'General'),
        texto: String(r.content ?? ''),
      }));
    },
    staleTime: 30_000,
  });

  const [showArbolForm, setShowArbolForm] = useState(false);
  const [arbolForm, setArbolForm] = useState({ especie: 'Ulmo', cantidad: 0, sector: '' });
  const [savingArbol, setSavingArbol] = useState(false);

  const [showReflexionForm, setShowReflexionForm] = useState(false);
  const [reflexionForm, setReflexionForm] = useState({ colmena: '', texto: '' });
  const [savingReflexion, setSavingReflexion] = useState(false);

  const handleAddArbol = async () => {
    if (!arbolForm.cantidad || !arbolForm.sector) return;
    setSavingArbol(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('arboles_plantados').insert({
        especie: arbolForm.especie,
        cantidad: arbolForm.cantidad,
        sector: arbolForm.sector,
        fecha: new Date().toISOString().split('T')[0],
        status: 'creciendo',
        co2_ton: parseFloat((arbolForm.cantidad * 0.05).toFixed(2)),
        lat: -42.6,
        lng: -73.8,
        user_id: user?.id ?? null,
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['trazabilidad-arboles'] });
      toast('Plantación registrada', { type: 'success' });
      setShowArbolForm(false);
      setArbolForm({ especie: 'Ulmo', cantidad: 0, sector: '' });
    } catch (err) {
      toast(friendlyError(err, 'No se pudo registrar la plantación'), { type: 'error' });
    } finally {
      setSavingArbol(false);
    }
  };

  const handleAddReflexion = async () => {
    if (!reflexionForm.texto) return;
    setSavingReflexion(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesión requerida');
      const { error } = await supabase.from('reflexiones').insert({
        user_id: user.id,
        content: reflexionForm.texto,
        date_display: reflexionForm.colmena || 'General',
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['trazabilidad-reflexiones'] });
      toast('Reflexión guardada', { type: 'success' });
      setShowReflexionForm(false);
      setReflexionForm({ colmena: '', texto: '' });
    } catch (err) {
      toast(friendlyError(err, 'No se pudo guardar la reflexión'), { type: 'error' });
    } finally {
      setSavingReflexion(false);
    }
  };

  const lotes = prodData?.data?.lotes || [];
  const stats = prodData?.data?.stats || { total_kg_lotes: 0, lotes_criticos: 0, productos_quiebre: 0 };

  if (isLoading) return (
    <div className="flex items-center justify-center p-20">
      <Spinner size="lg" className="text-primary" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-surface-sunken/30 border-border/50">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="text-[1.8rem] font-bold text-accent">{stats.total_kg_lotes.toFixed(1)} kg</div>
            <div className="text-[0.72rem] text-muted-foreground mt-1 uppercase tracking-wider">Stock en Lotes</div>
          </CardContent>
        </Card>
        <Card className="bg-surface-sunken/30 border-border/50">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="text-[1.8rem] font-bold text-destructive">{stats.lotes_criticos}</div>
            <div className="text-[0.72rem] text-muted-foreground mt-1 uppercase tracking-wider">Lotes Críticos (&lt;50kg)</div>
          </CardContent>
        </Card>
        <Card className="bg-surface-sunken/30 border-border/50">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="text-[1.8rem] font-bold text-destructive">{stats.productos_quiebre}</div>
            <div className="text-[0.72rem] text-muted-foreground mt-1 uppercase tracking-wider">Productos en Quiebre</div>
          </CardContent>
        </Card>
      </div>

      <ResponsiveTabBar
        variant="pill"
        layoutId="trazabilidad-tabs"
        tabs={[
          { id: 'arboles', label: 'Bosque plantado' },
          { id: 'lotes', label: 'Lotes de miel' },
          { id: 'reflexiones', label: 'Reflexiones' },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as 'arboles' | 'lotes' | 'reflexiones')}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'arboles' && (
            <Card>
              <CardHeader className="flex flex-row justify-between items-start pb-4">
                <div>
                  <CardTitle className="text-xl">Registro de Reforestación</CardTitle>
                  <CardDescription>Árbol → Colmena → Lote de miel · Trazabilidad completa</CardDescription>
                </div>
                <Button size="sm" variant="primary" onClick={() => setShowArbolForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus size={14} className="mr-2" /> Planta
                </Button>
              </CardHeader>
              <CardContent>
                {showArbolForm && (
                  <div className="p-5 bg-surface-sunken/50 rounded-lg mb-6 border border-border relative">
                    <Button variant="ghost" size="sm" onClick={() => setShowArbolForm(false)} className="absolute top-2 right-2 h-8 w-8 p-1">
                      <X size={14} />
                    </Button>
                    <div className="text-sm font-semibold text-foreground mb-4">Registrar Reforestación</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={arbolForm.especie} onChange={e => setArbolForm({ ...arbolForm, especie: e.target.value })}>
                        <option value="Ulmo">Ulmo</option>
                        <option value="Tepú">Tepú</option>
                        <option value="Tiaca">Tiaca</option>
                        <option value="Avellano">Avellano</option>
                      </select>
                      <input type="number" placeholder="Cantidad" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={arbolForm.cantidad || ''} onChange={e => setArbolForm({ ...arbolForm, cantidad: parseInt(e.target.value) || 0 })} />
                      <input type="text" placeholder="Sector" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={arbolForm.sector} onChange={e => setArbolForm({ ...arbolForm, sector: e.target.value })} />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[0.7rem] text-muted-foreground">Proyección: ~{(arbolForm.cantidad * 0.05).toFixed(2)} ton CO₂/año</span>
                      <Button onClick={handleAddArbol} size="sm" disabled={savingArbol}>
                        {savingArbol ? 'Guardando…' : 'Registrar Vida'}
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col gap-3">
                  {loadingArboles && (
                    <div className="flex justify-center py-8"><Spinner size="md" /></div>
                  )}
                  {localArboles.map(a => (
                    <div key={a.id} className="flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/20 transition-colors">
                      <div className="text-3xl shrink-0">🌳</div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground text-sm">
                          {a.especie} × {a.cantidad.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {a.sector} · {a.fecha}
                        </div>
                        <div className="text-xs text-primary mt-1 font-medium">
                          🍯 Lotes: {a.lotesMiel.join(', ')}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <Badge variant={a.status === 'adulto' ? 'success' : a.status === 'creciendo' ? 'info' : 'default'}>
                          {a.status}
                        </Badge>
                        <div className="text-xs text-primary font-medium">
                          🌿 {a.co2_ton} ton CO₂
                        </div>
                      </div>
                    </div>
                  ))}
                  {!loadingArboles && localArboles.length === 0 && (
                     <div className="text-center py-8 text-sm text-muted-foreground">Aún no has registrado plantaciones.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'lotes' && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Lotes y Producción Real</CardTitle>
                <CardDescription>Kg disponibles en bodega vs Productos vinculados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {lotes.map((l: Lote) => (
                    <div key={l.id} onClick={() => setSelectedLote(selectedLote === l.id ? null : l.id)}
                      className={`p-5 rounded-lg cursor-pointer transition-all duration-200 ${selectedLote === l.id ? 'border-accent/40 bg-accent/5 shadow-sm' : 'border-border bg-card hover:bg-muted/10'} border`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-foreground text-sm mb-1">
                            {l.nombre_lote || `Lote ${l.id.slice(0, 8)}`}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>Stock: <strong className="text-foreground font-semibold">{Number(l.kg_total).toFixed(2)} kg</strong></span>
                            <span>·</span>
                            <span>{l.estado}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {Number(l.kg_total) < 50 && (
                            <Badge variant="danger" className="text-[0.65rem] h-5 px-1.5 flex items-center gap-1">
                              <AlertTriangle size={10} /> Stock Bajo
                            </Badge>
                          )}
                          <ChevronRight size={16} className="text-muted-foreground transition-transform duration-300" style={{ transform: selectedLote === l.id ? 'rotate(90deg)' : 'none' }} />
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {selectedLote === l.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: 'auto', opacity: 1 }} 
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-border">
                              <div className="text-xs font-medium mb-3 text-foreground">Productos del Lote:</div>
                              {l.productos?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {l.productos.map((p) => (
                                    <div key={p.id} className="flex justify-between items-center text-xs bg-surface-sunken/50 px-3 py-2 rounded-md border border-border/30">
                                      <span className="text-muted-foreground">{p.nombre} <span className="text-[0.65rem] opacity-70">({p.peso_neto_g}g)</span></span>
                                      <span className="font-medium text-foreground">{p.stock} un.</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground italic py-2">Sin productos asignados</div>
                              )}
                              <div className="mt-4 p-3 bg-primary/5 rounded-md border border-primary/10 flex items-center gap-3 text-xs">
                                <span className="text-primary font-medium shrink-0 uppercase tracking-widest text-[0.6rem]">Blockchain</span>
                                <span className="font-mono text-foreground/80 break-all select-all">{l.blockchain_hash || 'Sin firmar'}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                  {lotes.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">No se encontraron lotes de producción.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'reflexiones' && (
            <div className="flex flex-col gap-5">
              <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm border border-accent/20 font-medium" onClick={() => setShowReflexionForm(true)}>
                <Plus size={16} className="mr-2" /> Agregar Reflexión del Bosque
              </Button>

              <AnimatePresence>
                {showReflexionForm && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="bg-surface-sunken/40 border-accent/30 relative shadow-sm">
                      <Button variant="ghost" size="sm" onClick={() => setShowReflexionForm(false)} className="absolute top-2 right-2 h-8 w-8 !p-0 text-muted-foreground hover:text-foreground">
                        <X size={16} />
                      </Button>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Nueva Reflexión ({new Date().toLocaleDateString('es-CL')})</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <input type="text" placeholder="Colmena (opcional, ej. 'Quilineja Madre')" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={reflexionForm.colmena} onChange={e => setReflexionForm({ ...reflexionForm, colmena: e.target.value })} />
                        <textarea placeholder="Qué observaste en la naturaleza, el comportamiento de las abejas o el clima hoy..." className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y" value={reflexionForm.texto} onChange={e => setReflexionForm({ ...reflexionForm, texto: e.target.value })} />
                        <div className="flex justify-end pt-2">
                          <Button onClick={handleAddReflexion} disabled={savingReflexion}>
                            {savingReflexion ? 'Guardando…' : 'Guardar Legado'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {loadingReflexiones && (
                <div className="flex justify-center py-8"><Spinner size="md" /></div>
              )}
              {localReflexiones.map((r, i) => (
                <Card key={r.id} className={`overflow-hidden transition-all duration-300 ${i === 0 ? 'border-primary/30 shadow-md bg-gradient-to-br from-card to-primary/5' : 'border-border/60 bg-surface-sunken/20'}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <Badge variant="default" className={`text-[0.65rem] uppercase tracking-widest ${i === 0 ? 'border-primary/40 text-primary' : 'text-muted-foreground'}`}>
                        Reflexión · {r.fecha}
                      </Badge>
                      <span className={`text-xs font-medium ${i === 0 ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                        {r.colmena}
                      </span>
                    </div>
                    
                    <div className={`w-full rounded-lg flex items-center justify-center mb-5 gap-3 border ${i === 0 ? 'bg-background/60 border-primary/10 h-32' : 'bg-background/40 border-border/50 h-24'}`}>
                      <ImageOff size={20} className={i === 0 ? 'text-primary/40' : 'text-muted-foreground/40'} />
                      <span className={`text-xs font-medium ${i === 0 ? 'text-primary/60' : 'text-muted-foreground/60'}`}>
                        Foto de visita · Toca para agregar
                      </span>
                    </div>
                    
                    <p className={`italic leading-relaxed ${i === 0 ? 'text-[0.95rem] text-foreground' : 'text-sm text-muted-foreground'}`} style={{ fontFamily: 'var(--font-existencial)' }}>
                      "{r.texto}"
                    </p>
                    
                    <div className="mt-5 pt-4 border-t border-border/40 text-[0.7rem] flex items-center justify-between">
                      <span className="text-muted-foreground italic flex items-center gap-1.5"><TrendingDown size={10} /> Generado por IA</span>
                      <span className="text-muted-foreground/60">{r.fecha}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {!loadingReflexiones && localReflexiones.length === 0 && (
                <div className="text-center py-12 px-4 border border-dashed border-border rounded-xl">
                  <div className="text-3xl mb-3 opacity-50">📖</div>
                  <h3 className="text-base font-medium text-foreground mb-1">El diario del bosque está vacío</h3>
                  <p className="text-sm text-muted-foreground">Registra tus observaciones de la naturaleza y las colmenas para mantener vivo el legado.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

