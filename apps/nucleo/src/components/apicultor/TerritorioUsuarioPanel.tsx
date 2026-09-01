'use client';

import { useState, useEffect } from 'react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Map, Plus, MapPin, Tent, Lock, Warehouse, CheckCircle2, LogOut } from 'lucide-react';
import { Button, HexagonLoader, toast } from '@enjambre/ui';
import { CENSO_WRITE_LOCK_MESSAGE } from '@/lib/territorial-rol';
import { PredioForm } from './PredioForm';
import { ApiarioExternoForm } from './ApiarioExternoForm';

interface TerritorioUsuarioPanelProps {
  /** Si el actor completó su inscripción legal del censo; si es false, las
   *  declaraciones de trashumancia y predios se bloquean con orientación. */
  inscripcionCompleta?: boolean;
}

interface ActorRegistro {
  id: string;
  rol: string;
  nombre_actor: string;
}

interface Predio {
  id: string;
  nombre: string;
  comuna: string;
  zona: string;
  activo: boolean;
  apiarios_acogidos?: number;
}

interface ApiarioExterno {
  id: string;
  nombre: string;
  n_colmenas: number;
  comuna_destino: string;
  zona_destino: string;
  estado: string;
  fecha_ingreso: string;
  apiario_operativo_id?: string | null;
  distancia_verificada?: boolean;
  distancia_minima_km?: number | null;
  distancia_km_menor?: number | null;
}

interface AcopioDeclaracion {
  id: string;
  temporada: string;
  volumen_kg: number;
  zona?: string | null;
  estado: string;
}

export function TerritorioUsuarioPanel({ inscripcionCompleta = true }: TerritorioUsuarioPanelProps) {
  const apiFetch = useApiFetch();
  const [actor, setActor] = useState<ActorRegistro | null>(null);
  const [predios, setPredios] = useState<Predio[]>([]);
  const [apiarios, setApiarios] = useState<ApiarioExterno[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPredioForm, setShowPredioForm] = useState(false);
  const [showApiarioForm, setShowApiarioForm] = useState(false);
  const [showAcopioForm, setShowAcopioForm] = useState(false);
  const [acopios, setAcopios] = useState<AcopioDeclaracion[]>([]);
  const [acopioTemporada, setAcopioTemporada] = useState('');
  const [acopioVolumen, setAcopioVolumen] = useState('');
  const [acopioZona, setAcopioZona] = useState('');
  const [savingAcopio, setSavingAcopio] = useState(false);

  // Gap 1B: llegada desde /colmenas con "Declarar salida trashumante".
  const [pendingApiarioId, setPendingApiarioId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('apiario_id');
  });
  useEffect(() => {
    if (actor && pendingApiarioId) {
      setShowApiarioForm(true);
      // Se limpia tras el primer paint: el form ya montó con el id; aperturas
      // manuales posteriores no deben re-prefillear.
      setTimeout(() => setPendingApiarioId(null), 0);
    }
  }, [actor, pendingApiarioId]);

  const bloquearPorCenso = () => {
    toast.info(CENSO_WRITE_LOCK_MESSAGE);
  };

  // Cruce ley → vivo: materializa la declaración como apiario operativo.
  const [materializando, setMaterializando] = useState<string | null>(null);
  const materializar = async (a: ApiarioExterno) => {
    setMaterializando(a.id);
    try {
      const res = await apiFetch(`/api/registro-territorial/apiarios-externos/${a.id}/materializar`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Error al materializar el apiario');
      }
      toast.success(`"${a.nombre || a.zona_destino}" ahora está en tus apiarios operativos`);
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al materializar el apiario');
    } finally {
      setMaterializando(null);
    }
  };

  // Ciclo de vida trashumante: dar por retirado al terminar la temporada.
  const [retirando, setRetirando] = useState<string | null>(null);
  const retirarApiario = async (a: ApiarioExterno) => {
    if (!window.confirm(`¿Dar por retirado "${a.nombre || a.zona_destino}"? Se mantiene el historial en el registro.`)) return;
    setRetirando(a.id);
    try {
      const res = await apiFetch(`/api/registro-territorial/apiarios-externos/${a.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'retirado' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Error al actualizar el apiario');
      }
      toast.success(`"${a.nombre || a.zona_destino}" marcado como retirado`);
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar el apiario');
    } finally {
      setRetirando(null);
    }
  };

  const guardarAcopio = async () => {
    if (!acopioTemporada.trim() || !acopioVolumen || Number(acopioVolumen) < 0) {
      toast.error('Indica temporada y volumen estimado (kg)');
      return;
    }
    setSavingAcopio(true);
    try {
      const res = await apiFetch('/api/registro-territorial/acopio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temporada: acopioTemporada.trim(),
          volumen_kg: Number(acopioVolumen),
          zona: acopioZona.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Error al declarar acopio');
      }
      toast.success('Intención de acopio declarada');
      setShowAcopioForm(false);
      setAcopioTemporada('');
      setAcopioVolumen('');
      setAcopioZona('');
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al declarar acopio');
    } finally {
      setSavingAcopio(false);
    }
  };

  const cambiarEstadoAcopio = async (id: string, estado: 'confirmada' | 'cancelada') => {
    try {
      const res = await apiFetch(`/api/registro-territorial/acopio/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Error al actualizar acopio');
      }
      toast.success(estado === 'confirmada' ? 'Intención confirmada' : 'Intención cancelada');
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar acopio');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Actor
      const resActor = await apiFetch('/api/registro-territorial/actores/me');
      if (resActor.ok) {
        const jsonActor = await resActor.json();
        const miActor = jsonActor.data;
        if (miActor) {
          setActor(miActor);

          // 2. Fetch Predios
          const resPredios = await apiFetch(`/api/registro-territorial/predios?actor_id=${miActor.id}`);
          if (resPredios.ok) {
            const p = await resPredios.json();
            setPredios(p.data || []);
          }

          // 3. Fetch Apiarios
          const resApiarios = await apiFetch(`/api/registro-territorial/apiarios-externos?actor_id=${miActor.id}`);
          if (resApiarios.ok) {
            const a = await resApiarios.json();
            setApiarios(a.data || []);
          }

          // 4. Fetch Acopio
          const resAcopio = await apiFetch('/api/registro-territorial/acopio');
          if (resAcopio.ok) {
            const ac = await resAcopio.json();
            setAcopios(ac.data || []);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiFetch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <HexagonLoader size="md" />
      </div>
    );
  }

  if (!actor) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card border border-border/50 rounded-xl text-center">
        <Map className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-xl font-display font-bold mb-2">Aún no estás en el Registro Territorial</h3>
        <p className="text-muted-foreground mb-6 max-w-md text-sm mx-auto">
          Para registrar predios facilitadores o declarar apiarios trashumantes, primero debes activar tu perfil en el Registro Territorial desde tu Perfil de usuario.
        </p>
        <a href="/perfil" className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-colors text-sm">
          Ir a Mi Perfil
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!inscripcionCompleta && (
        <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30 flex items-center gap-3">
          <Lock className="w-5 h-5 text-warning shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Inscripción legal pendiente</p>
            <p className="text-xs text-muted-foreground">
              {CENSO_WRITE_LOCK_MESSAGE}
            </p>
          </div>
        </div>
      )}

      {/* Mis Apiarios Trashumantes */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-accent">
            <Tent size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Mis Movimientos Trashumantes
            </h3>
          </div>
          <Button
            onClick={() => (inscripcionCompleta ? setShowApiarioForm(true) : bloquearPorCenso())}
            size="sm"
            className="w-full sm:w-auto shrink-0 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus size={16} className="mr-1" /> Declarar Ingreso
          </Button>
        </div>

        {apiarios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-xl">
            No tienes apiarios trashumantes declarados activos.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apiarios.map((a) => (
              <div key={a.id} className="p-4 bg-secondary/30 border border-border/50 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-foreground text-sm">{a.nombre || 'Apiario sin nombre'}</p>
                  <span className={`badge px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${a.estado === 'activo' ? 'badge-success' : 'badge-warning'}`}>
                    {a.estado}
                  </span>
                </div>
                {a.estado === 'suspendido' && (
                  <span className="badge px-2 py-0.5 rounded-md text-[10px] font-bold uppercase badge-warning">
                    Pendiente de revisión (distancia legal)
                  </span>
                )}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>📍 {a.comuna_destino} — {a.zona_destino}</p>
                  <p>🐝 {a.n_colmenas} Colmenas</p>
                  <p>📅 Ingreso: {a.fecha_ingreso}</p>
                </div>
                {a.apiario_operativo_id ? (
                  <span className="inline-flex items-center gap-1 text-xs text-primary">
                    <CheckCircle2 size={13} /> Entrelazado con tus apiarios operativos
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={materializando === a.id}
                    onClick={() => void materializar(a)}
                  >
                    <Warehouse size={14} className="mr-1" />
                    {materializando === a.id ? 'Materializando…' : 'Crear apiario operativo'}
                  </Button>
                )}
                {a.estado === 'activo' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={retirando === a.id}
                    onClick={() => void retirarApiario(a)}
                  >
                    <LogOut size={14} className="mr-1" />
                    {retirando === a.id ? 'Retirando…' : 'Dar por retirado'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mis Predios Facilitadores */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-primary">
            <MapPin size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Mis Predios Facilitadores
            </h3>
          </div>
          <Button
            onClick={() => (inscripcionCompleta ? setShowPredioForm(true) : bloquearPorCenso())}
            size="sm"
            className="w-full sm:w-auto shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={16} className="mr-1" /> Registrar Predio
          </Button>
        </div>

        {predios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-xl">
            No has inscrito predios facilitadores.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predios.map((p) => (
              <div key={p.id} className="p-4 bg-secondary/30 border border-border/50 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-foreground text-sm">{p.nombre || 'Predio sin nombre'}</p>
                  <span className={`badge px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${p.activo ? 'badge-success' : 'badge-danger'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>📍 {p.comuna} — {p.zona}</p>
                  {typeof p.apiarios_acogidos === 'number' && (
                    <p className={p.apiarios_acogidos > 0 ? 'text-primary' : ''}>
                      🐝 {p.apiarios_acogidos} {p.apiarios_acogidos === 1 ? 'apiario acogido' : 'apiarios acogidos'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mis Intenciones de Acopio (comercial_acopio y demás actores) */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-accent">
            <Warehouse size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Intenciones de acopio
            </h3>
          </div>
          <Button
            onClick={() => (inscripcionCompleta ? setShowAcopioForm(true) : bloquearPorCenso())}
            size="sm"
            className="w-full sm:w-auto shrink-0 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus size={16} className="mr-1" /> Declarar intención
          </Button>
        </div>

        {acopios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-xl">
            Aún no has declarado intención de acopio para esta temporada.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {acopios.map((ac) => (
              <div key={ac.id} className="p-4 bg-secondary/30 border border-border/50 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-foreground text-sm">{ac.temporada}</p>
                  <span className={`badge px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${ac.estado === 'confirmada' ? 'badge-success' : ac.estado === 'cancelada' ? 'badge-danger' : 'badge-warning'}`}>
                    {ac.estado}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>⚖️ {ac.volumen_kg} kg estimados</p>
                  {ac.zona && <p>📍 {ac.zona}</p>}
                </div>
                {ac.estado === 'propuesta' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void cambiarEstadoAcopio(ac.id, 'confirmada')}
                  >
                    <CheckCircle2 size={13} className="mr-1" /> Confirmar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showPredioForm && (
        <PredioForm
          actores={[]} // Not needed when fixedActorId is provided
          fixedActorId={actor.id}
          fixedActorName={actor.nombre_actor}
          onClose={() => setShowPredioForm(false)}
          onSuccess={() => {
            setShowPredioForm(false);
            loadData();
          }}
        />
      )}

      {showApiarioForm && (
        <ApiarioExternoForm
          actores={[]} // Not needed when fixedActorId is provided
          predios={[]} // Passing empty array for now since it's optional
          fixedActorId={actor.id}
          fixedActorName={actor.nombre_actor}
          initialApiarioId={pendingApiarioId ?? undefined}
          onClose={() => setShowApiarioForm(false)}
          onSuccess={() => {
            setShowApiarioForm(false);
            loadData();
          }}
        />
      )}

      {showAcopioForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto overscroll-contain" onClick={() => setShowAcopioForm(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[calc(100%-2rem)] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Declarar intención de acopio</h3>
              <button className="text-muted-foreground hover:text-foreground p-1" aria-label="Cerrar" onClick={() => setShowAcopioForm(false)}>✕</button>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Temporada</label>
              <input className="input-field w-full" placeholder="Ej: 2026-2027" value={acopioTemporada} onChange={(e) => setAcopioTemporada(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Volumen estimado (kg)</label>
              <input className="input-field w-full" type="number" min="0" placeholder="Ej: 1200" value={acopioVolumen} onChange={(e) => setAcopioVolumen(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Zona (opcional)</label>
              <input className="input-field w-full" placeholder="Ej: Queilén, Chiloé" value={acopioZona} onChange={(e) => setAcopioZona(e.target.value)} />
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 w-full">
              <Button size="sm" variant="ghost" className="w-full sm:w-auto" onClick={() => setShowAcopioForm(false)}>Cancelar</Button>
              <Button size="sm" className="w-full sm:w-auto" disabled={savingAcopio} onClick={() => void guardarAcopio()}>
                {savingAcopio ? 'Guardando…' : 'Declarar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
