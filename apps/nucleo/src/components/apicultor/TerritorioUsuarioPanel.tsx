'use client';

import { useState, useEffect } from 'react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Map, Plus, MapPin, Tent } from 'lucide-react';
import { Button, HexagonLoader } from '@enjambre/ui';
import { PredioForm } from './PredioForm';
import { ApiarioExternoForm } from './ApiarioExternoForm';

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
}

interface ApiarioExterno {
  id: string;
  nombre: string;
  n_colmenas: number;
  comuna_destino: string;
  zona_destino: string;
  estado: string;
  fecha_ingreso: string;
}

export function TerritorioUsuarioPanel() {
  const apiFetch = useApiFetch();
  const [actor, setActor] = useState<ActorRegistro | null>(null);
  const [predios, setPredios] = useState<Predio[]>([]);
  const [apiarios, setApiarios] = useState<ApiarioExterno[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPredioForm, setShowPredioForm] = useState(false);
  const [showApiarioForm, setShowApiarioForm] = useState(false);

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
      {/* Mis Apiarios Trashumantes */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-accent">
            <Tent size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Mis Movimientos Trashumantes
            </h3>
          </div>
          <Button onClick={() => setShowApiarioForm(true)} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
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
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>📍 {a.comuna_destino} — {a.zona_destino}</p>
                  <p>🐝 {a.n_colmenas} Colmenas</p>
                  <p>📅 Ingreso: {a.fecha_ingreso}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mis Predios Facilitadores */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-primary">
            <MapPin size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Mis Predios Facilitadores
            </h3>
          </div>
          <Button onClick={() => setShowPredioForm(true)} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
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
                </div>
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
          onClose={() => setShowApiarioForm(false)}
          onSuccess={() => {
            setShowApiarioForm(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
