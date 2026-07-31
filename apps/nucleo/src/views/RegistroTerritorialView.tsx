'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, AlertTriangle, Home, Users, Plus } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, Spinner, toast
} from '@enjambre/ui';
import { motion } from 'framer-motion';
import { AlertaFitosanitariaForm } from '@/components/apicultor/AlertaFitosanitariaForm';
import { AlertasPanel } from '@/components/apicultor/AlertasPanel';
import { InscripcionActorForm } from '@/components/apicultor/InscripcionActorForm';

type Tab = 'resumen' | 'actores' | 'alertas' | 'predios' | 'trashumantes';

interface ActorResumen {
  id: string;
  rol: string;
  nombre_actor: string;
  comuna: string;
  nivel_acreditacion: string;
  estado: string;
}

interface AlertaResumen {
  id: string;
  producto: string;
  zona: string;
  fecha_programada: string;
  estado: string;
  confirmaciones: unknown[];
}

const ROL_LABELS: Record<string, string> = {
  api_residente: 'Apicultor/a Residente',
  api_trashumante: 'Apicultor/a Trashumante',
  api_mixto: 'Apicultor/a Mixto',
  prop_facilitador: 'Propietario/a Facilitador',
  agri_fitosanitario: 'Agricultor/a (Fitosanitarios)',
  agri_aplicador: 'Aplicador/a Agrícola',
  comercial_acopio: 'Comercializador/a',
  tecnico_inspector: 'Inspector/a Técnico',
  institucion_publica: 'Institución Pública',
};

const NIVEL_COLORS: Record<string, string> = {
  base: 'bg-surface-raised text-muted-foreground',
  trazable: 'bg-primary/10 text-primary',
  comprometido: 'bg-primary/20 text-primary',
  referente: 'bg-primary/30 text-primary',
};

export function RegistroTerritorialView() {
  const apiFetch = useApiFetch();
  const [tab, setTab] = useState<Tab>('resumen');
  const [showInscripcion, setShowInscripcion] = useState(false);
  const [showAlertaForm, setShowAlertaForm] = useState(false);
  const [showApiarioExterno, setShowApiarioExterno] = useState(false);

  const { data: actoresData, isLoading: loadingActores, refetch: refetchActores } = useQuery<{
    data: ActorResumen[];
  }>({
    queryKey: ['registro-territorial-actores'],
    queryFn: async () => {
      const res = await apiFetch('/api/registro-territorial/actores');
      if (!res.ok) throw new Error('Error cargando actores');
      return res.json();
    },
  });

  const { data: alertasData, isLoading: loadingAlertas, refetch: refetchAlertas } = useQuery<{
    data: AlertaResumen[];
  }>({
    queryKey: ['registro-territorial-alertas'],
    queryFn: async () => {
      const res = await apiFetch('/api/registro-territorial/alertas');
      if (!res.ok) throw new Error('Error cargando alertas');
      return res.json();
    },
  });

  const actores = actoresData?.data ?? [];
  const alertas = alertasData?.data ?? [];

  const stats = {
    totalActores: actores.length,
    residentes: actores.filter(a => a.rol === 'api_residente').length,
    trashumantes: actores.filter(a => a.rol === 'api_trashumante').length,
    alertasActivas: alertas.filter(a => a.estado === 'activa').length,
  };

  const tabs: { id: Tab; label: string; icon: typeof MapPin }[] = [
    { id: 'resumen', label: 'Resumen', icon: MapPin },
    { id: 'actores', label: 'Actores', icon: Users },
    { id: 'alertas', label: 'Alertas', icon: AlertTriangle },
    { id: 'predios', label: 'Predios', icon: Home },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Registro Territorial Apícola
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Red Apícola de Chiloé — Infraestructura territorial compartida
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAlertaForm(true)}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Emitir alerta
          </Button>
          <Button
            size="sm"
            onClick={() => setShowInscripcion(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Inscribir actor
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Actores registrados', value: stats.totalActores, color: 'text-foreground' },
          { label: 'Apicultores locales', value: stats.residentes, color: 'text-primary' },
          { label: 'Trashumantes activos', value: stats.trashumantes, color: 'text-muted-foreground' },
          { label: 'Alertas activas', value: stats.alertasActivas, color: 'text-destructive' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
              tab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {tab === 'resumen' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm">Alertas fitosanitarias activas</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAlertas ? (
                  <Spinner />
                ) : alertas.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin alertas activas</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {alertas.slice(0, 5).map((a) => (
                      <div key={a.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">{a.producto}</p>
                          <p className="text-xs text-muted-foreground">{a.zona}</p>
                        </div>
                        <Badge className="text-xs">
                          {new Date(a.fecha_programada).toLocaleDateString('es-CL')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm">Últimos actores inscritos</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingActores ? (
                  <Spinner />
                ) : actores.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin actores registrados</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {actores.slice(0, 5).map((a) => (
                      <div key={a.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">{a.nombre_actor}</p>
                          <p className="text-xs text-muted-foreground">{ROL_LABELS[a.rol] ?? a.rol} · {a.comuna}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${NIVEL_COLORS[a.nivel_acreditacion]}`}>
                          {a.nivel_acreditacion}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'actores' && (
          <div className="flex flex-col gap-3">
            {loadingActores ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : actores.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No hay actores registrados aún.</p>
                  <Button className="mt-4" onClick={() => setShowInscripcion(true)}>
                    Inscribir primer actor
                  </Button>
                </CardContent>
              </Card>
            ) : (
              actores.map((actor) => (
                <Card key={actor.id} className="bg-card border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{actor.nombre_actor}</p>
                      <p className="text-xs text-muted-foreground">
                        {ROL_LABELS[actor.rol] ?? actor.rol} · {actor.comuna}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${NIVEL_COLORS[actor.nivel_acreditacion]}`}>
                        {actor.nivel_acreditacion}
                      </span>
                      <Badge variant={actor.estado === 'activo' ? 'default' : 'danger'}>
                        {actor.estado}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {tab === 'alertas' && (
          <AlertasPanel
            alertas={alertas}
            isLoading={loadingAlertas}
            onRefresh={() => { refetchAlertas().catch(() => toast.error('Error actualizando alertas')); }}
          />
        )}

        {tab === 'predios' && (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-sm">
                Módulo de predios facilitadores — próximamente
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Modales */}
      {showInscripcion && (
        <InscripcionActorForm
          onClose={() => setShowInscripcion(false)}
          onSuccess={() => {
            setShowInscripcion(false);
            refetchActores().catch(() => toast.error('Error actualizando actores'));
          }}
        />
      )}

      {showAlertaForm && (
        <AlertaFitosanitariaForm
          onClose={() => setShowAlertaForm(false)}
          onSuccess={() => {
            setShowAlertaForm(false);
            refetchAlertas().catch(() => toast.error('Error actualizando alertas'));
          }}
        />
      )}
    </div>
  );
}
