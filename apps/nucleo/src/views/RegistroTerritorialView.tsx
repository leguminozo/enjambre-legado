'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { MapPin, AlertTriangle, Home, Users, Plus, BarChart3, Download, FileText, Sprout } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Badge, Button, Spinner, toast, formatCalendarDate,
} from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { motion } from 'framer-motion';
import { AlertaFitosanitariaForm } from '@/components/apicultor/AlertaFitosanitariaForm';
import { AlertasPanel } from '@/components/apicultor/AlertasPanel';
import { InscripcionActorForm } from '@/components/apicultor/InscripcionActorForm';
import { ApiarioExternoForm } from '@/components/apicultor/ApiarioExternoForm';
import dynamic from 'next/dynamic';

const MapaTerritorial = dynamic(
  () => import('@/components/apicultor/MapaTerritorial').then((mod) => mod.MapaTerritorial),
  { ssr: false, loading: () => <div className="h-[500px] flex items-center justify-center bg-card rounded-xl border border-border"><Spinner /></div> }
);

import { PredioForm } from '@/components/apicultor/PredioForm';
import { Map, Truck } from 'lucide-react';
import { resolveComunaChiloe, slugifyComuna } from '@/lib/chiloe-comunas';
import {
  getTerritorialCredential,
  territorialRolLabel,
} from '@/lib/territorial-rol';

type Tab = 'resumen' | 'mapa' | 'actores' | 'alertas' | 'predios' | 'trashumantes' | 'comunas';

interface ActorResumen {
  id: string;
  rol: string;
  nombre_actor: string;
  comuna: string;
  nivel_acreditacion: string;
  estado: string;
  completo?: boolean;
}

interface AlertaResumen {
  id: string;
  producto: string;
  zona: string;
  fecha_programada: string;
  estado: string;
  confirmaciones: unknown[];
  lat_aproximada?: number;
  lng_aproximada?: number;
  radio_km?: number;
}

interface PredioResumen {
  id: string;
  nombre?: string;
  comuna: string;
  zona: string;
  superficie_ha?: number;
  activo: boolean;
  actores_registro: { nombre_actor: string, rol: string };
}

interface ApiarioExternoResumen {
  id: string;
  nombre?: string;
  n_colmenas: number;
  comuna_origen: string;
  comuna_destino: string;
  zona_destino: string;
  lat_aproximada?: number;
  lng_aproximada?: number;
  fecha_ingreso: string;
  fecha_salida?: string;
  estado: string;
  distancia_verificada?: boolean;
  distancia_minima_km?: number | null;
  distancia_km_menor?: number | null;
  actores_registro: {
    nombre_actor: string;
    rup?: string;
  };
}

interface ComunaResumen {
  comuna: string;
  actores_activos: number;
  apiarios: number;
  colmenas: number;
  trashumantes: number;
  alertas_activas: number;
}

interface ApiarioRegistroResumen {
  id: string;
  nombre?: string | null;
  comuna: string;
  zona: string;
  n_colmenas: number;
  categoria: string;
  lat_aproximada?: number | null;
  lng_aproximada?: number | null;
}

export function RegistroTerritorialView() {
  const apiFetch = useApiFetch();
  const [tab, setTab] = useState<Tab>('resumen');
  const [comuna, setComuna] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('comuna') ?? '';
  });
  const [showInscripcion, setShowInscripcion] = useState(false);
  const [showAlertaForm, setShowAlertaForm] = useState(false);
  const [showApiarioExterno, setShowApiarioExterno] = useState(false);
  const [showPredioForm, setShowPredioForm] = useState(false);

  const cambiarComuna = (c: string) => {
    setComuna(c);
    const url = new URL(window.location.href);
    if (c) url.searchParams.set('comuna', c);
    else url.searchParams.delete('comuna');
    window.history.replaceState(null, '', url.toString());
  };

  const exportCsv = async () => {
    try {
      const res = await apiFetch('/api/registro-territorial/export/comunas.csv');
      if (!res.ok) throw new Error('Error exportando CSV');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resumen-comunas_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error exportando el resumen por comuna');
    }
  };

  const qsComuna = comuna ? `?comuna=${encodeURIComponent(comuna)}` : '';

  const { data: actoresData, isLoading: loadingActores, refetch: refetchActores } = useQuery<{
    data: ActorResumen[];
  }>({
    queryKey: ['registro-territorial-actores', comuna],
    queryFn: async () => {
      const res = await apiFetch(`/api/registro-territorial/actores${qsComuna}`);
      if (!res.ok) throw new Error('Error cargando actores');
      return res.json();
    },
  });

  const { data: alertasData, isLoading: loadingAlertas, refetch: refetchAlertas } = useQuery<{
    data: AlertaResumen[];
  }>({
    queryKey: ['registro-territorial-alertas', comuna],
    queryFn: async () => {
      const res = await apiFetch(`/api/registro-territorial/alertas${qsComuna}`);
      if (!res.ok) throw new Error('Error cargando alertas');
      return res.json();
    },
  });

  const { data: prediosData, isLoading: loadingPredios, refetch: refetchPredios } = useQuery<{
    data: PredioResumen[];
  }>({
    queryKey: ['registro-territorial-predios', comuna],
    queryFn: async () => {
      const res = await apiFetch(`/api/registro-territorial/predios${qsComuna}`);
      if (!res.ok) throw new Error('Error cargando predios');
      return res.json();
    },
  });

  const { data: apiariosData, isLoading: loadingApiarios, refetch: refetchApiarios } = useQuery<{
    data: ApiarioExternoResumen[];
  }>({
    queryKey: ['registro-territorial-apiarios-externos', comuna],
    queryFn: async () => {
      const res = await apiFetch(`/api/registro-territorial/apiarios-externos${qsComuna}`);
      if (!res.ok) throw new Error('Error cargando apiarios externos');
      return res.json();
    },
  });

  const { data: apiariosRegistroData } = useQuery<{ data: ApiarioRegistroResumen[] }>({
    queryKey: ['registro-territorial-apiarios-registro', comuna],
    queryFn: async () => {
      const res = await apiFetch(`/api/registro-territorial/apiarios${qsComuna}`);
      if (!res.ok) throw new Error('Error cargando apiarios del registro');
      return res.json();
    },
  });

  const { data: comunasData, isLoading: loadingComunas } = useQuery<{ data: ComunaResumen[] }>({
    queryKey: ['registro-territorial-resumen-comunas'],
    queryFn: async () => {
      const res = await apiFetch('/api/registro-territorial/resumen-comunas');
      if (!res.ok) throw new Error('Error cargando resumen por comuna');
      return res.json();
    },
  });

  const actores = actoresData?.data ?? [];
  const alertas = alertasData?.data ?? [];
  const predios = prediosData?.data ?? [];
  const apiariosExternos = apiariosData?.data ?? [];
  const apiariosRegistro = apiariosRegistroData?.data ?? [];
  const comunas = comunasData?.data ?? [];

  const stats = {
    totalActores: actores.length,
    residentes: actores.filter(a => a.rol === 'api_residente').length,
    trashumantes: actores.filter(a => a.rol === 'api_trashumante').length,
    alertasActivas: alertas.filter(a => a.estado === 'activa').length,
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <ViewShell
        variant="compact"
        eyebrow="Red Apícola de Chiloé"
        title="Registro Territorial Apícola"
        subtitle="Cuidado comunitario del bosque nativo, las colmenas y la miel del archipiélago."
        icon={<MapPin size={20} />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {comunas.length > 0 && (
              <select
                value={comuna}
                onChange={(e) => cambiarComuna(e.target.value)}
                className="rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-9"
                aria-label="Filtrar por comuna"
              >
                <option value="">Todas las comunas ({comunas.length})</option>
                {comunas.map((c) => (
                  <option key={c.comuna} value={c.comuna}>{c.comuna}</option>
                ))}
              </select>
            )}
            <Button
              variant="outline"
              size="sm"
              className="min-h-9 text-xs"
              onClick={() => setShowAlertaForm(true)}
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-warning" />
              Aviso preventivo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-9 text-xs"
              onClick={() => setShowApiarioExterno(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Ingreso
            </Button>
            <Button
              size="sm"
              className="min-h-9 text-xs"
              onClick={() => setShowInscripcion(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Inscribir actor
            </Button>
          </div>
        }
      />

      <ResponsiveTabBar
        variant="pill"
        layoutId="registro-territorial-tabs"
        tabs={[
          { id: 'resumen', label: 'Resumen' },
          { id: 'mapa', label: 'Mapa Territorial' },
          { id: 'actores', label: 'Actores', badge: stats.totalActores > 0 ? stats.totalActores : undefined },
          { id: 'alertas', label: 'Avisos Preventivos', badge: stats.alertasActivas > 0 ? stats.alertasActivas : undefined },
          { id: 'trashumantes', label: 'Trashumantes', badge: stats.trashumantes > 0 ? stats.trashumantes : undefined },
          { id: 'predios', label: 'Predios', badge: predios.length > 0 ? predios.length : undefined },
          { id: 'comunas', label: 'Comunas', badge: comunas.length > 0 ? comunas.length : undefined },
        ]}
        activeId={tab}
        onChange={(id) => setTab(id as Tab)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Actores registrados', value: stats.totalActores, color: 'text-foreground' },
          { label: 'Apicultores locales', value: stats.residentes, color: 'text-primary' },
          { label: 'Trashumantes activos', value: stats.trashumantes, color: 'text-muted-foreground' },
          { label: 'Alertas activas', value: stats.alertasActivas, color: 'text-destructive' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[11px] sm:text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-xl sm:text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

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
                          {formatCalendarDate(a.fecha_programada)}
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
                          <p className="text-xs text-muted-foreground">{territorialRolLabel(a.rol)} · {a.comuna}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getTerritorialCredential(a.nivel_acreditacion).className}`}>
                          {getTerritorialCredential(a.nivel_acreditacion).label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'resumen' && (
          <div className="hidden" />
        )}

        {tab === 'mapa' && (
          <MapaTerritorial
            actores={actores}
            alertas={alertas}
            apiariosExternos={apiariosExternos}
            apiariosRegistro={apiariosRegistro}
          />
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
                        {territorialRolLabel(actor.rol)} · {actor.comuna}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getTerritorialCredential(actor.nivel_acreditacion).className}`}
                        title={getTerritorialCredential(actor.nivel_acreditacion).desc}
                      >
                        {getTerritorialCredential(actor.nivel_acreditacion).label}
                      </span>
                      <Badge variant={actor.completo ? 'success' : 'warning'}>
                        {actor.completo ? 'Censo OK' : 'Censo pendiente'}
                      </Badge>
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
            actorId={null}
            isLoading={loadingAlertas}
            onRefresh={() => { refetchAlertas().catch(() => toast.error('Error actualizando alertas')); }}
          />
        )}

        {tab === 'predios' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
              <h2 className="text-lg font-medium text-foreground">Catastro de Predios Facilitadores</h2>
              <Button size="sm" onClick={() => setShowPredioForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Registrar Predio
              </Button>
            </div>
            {loadingPredios ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : predios.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No hay predios facilitadores registrados aún.</p>
                </CardContent>
              </Card>
            ) : (
              predios.map((predio) => (
                <Card key={predio.id} className="bg-card border-border">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        <Home className="w-4 h-4 text-primary" />
                        {predio.nombre || 'Predio sin nombre'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Propietario: {predio.actores_registro?.nombre_actor}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {predio.comuna} · {predio.zona} {predio.superficie_ha ? `· ${predio.superficie_ha} ha` : ''}
                      </p>
                    </div>
                    <Badge variant={predio.activo ? 'success' : 'default'}>
                      {predio.activo ? 'Disponible' : 'Inactivo'}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {tab === 'trashumantes' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
              <h2 className="text-lg font-medium text-foreground">Declaraciones de Trashumancia</h2>
              <Button size="sm" onClick={() => setShowApiarioExterno(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Declarar Ingreso
              </Button>
            </div>
            {loadingApiarios ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : apiariosExternos.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No hay declaraciones de apiarios trashumantes activas.</p>
                </CardContent>
              </Card>
            ) : (
              apiariosExternos.map((apiario) => (
                <Card key={apiario.id} className="bg-card border-border">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        <Truck className="w-4 h-4 text-accent" />
                        {apiario.actores_registro?.nombre_actor} {apiario.nombre ? `- ${apiario.nombre}` : ''}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {apiario.n_colmenas} colmenas ingresadas el {formatCalendarDate(apiario.fecha_ingreso)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ruta: {apiario.comuna_origen} ➔ {apiario.comuna_destino} ({apiario.zona_destino})
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={apiario.estado === 'activo' ? 'success' : 'default'}>
                        {apiario.estado}
                      </Badge>
                      {apiario.distancia_verificada ? (
                        <Badge variant="success">Distancia verificada</Badge>
                      ) : apiario.estado === 'suspendido' ? (
                        <Badge variant="warning">Pendiente de revisión</Badge>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {tab === 'comunas' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Agregados por comuna del Registro Territorial. El CSV autenticado incluye el total
                de colmenas; el informe público lo oculta si hay menos de tres apiarios.
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/comuna"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-9 items-center px-3 border border-border rounded-md text-sm hover:bg-surface-sunken"
                >
                  Informe público
                </a>
                <Button size="sm" variant="outline" onClick={() => void exportCsv()}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
            {loadingComunas ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : comunas.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Sin datos por comuna todavía.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card border-border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="p-3">Comuna</th>
                      <th className="p-3">Actores</th>
                      <th className="p-3">Apiarios</th>
                      <th className="p-3">Colmenas</th>
                      <th className="p-3">Trashumantes</th>
                      <th className="p-3">Alertas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comunas.map((c) => (
                      <tr key={c.comuna} className="border-b border-border/50 last:border-0">
                        <td className="p-3 font-medium text-foreground">
                          {resolveComunaChiloe(c.comuna) ? (
                            <a
                              href={`/comuna/${resolveComunaChiloe(c.comuna)?.slug ?? slugifyComuna(c.comuna)}`}
                              className="underline underline-offset-4"
                            >
                              {c.comuna}
                            </a>
                          ) : (
                            c.comuna
                          )}
                        </td>
                        <td className="p-3">{c.actores_activos}</td>
                        <td className="p-3">{c.apiarios}</td>
                        <td className="p-3">{c.colmenas.toLocaleString('es-CL')}</td>
                        <td className="p-3">{c.trashumantes}</td>
                        <td className="p-3">{c.alertas_activas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}
      </motion.div>

      {/* Modales */}
      {showInscripcion && (
        <InscripcionActorForm
          mode="admin"
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

      {showApiarioExterno && (
        <ApiarioExternoForm
          actores={actores}
          predios={predios}
          onClose={() => setShowApiarioExterno(false)}
          onSuccess={() => {
            setShowApiarioExterno(false);
            refetchApiarios().catch(() => toast.error('Error actualizando apiarios'));
          }}
        />
      )}

      {showPredioForm && (
        <PredioForm
          actores={actores}
          onClose={() => setShowPredioForm(false)}
          onSuccess={() => {
            setShowPredioForm(false);
            refetchPredios().catch(() => toast.error('Error actualizando predios'));
          }}
        />
      )}
    </div>
  );
}
