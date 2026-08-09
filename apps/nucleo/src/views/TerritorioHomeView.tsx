'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  MapPin, Map, AlertTriangle, Truck, Plus, ShieldCheck, UserPlus, CheckCircle2, ClipboardList, FileText
} from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Badge, Button, Spinner, toast } from '@enjambre/ui';
import { AlertasPanel } from '@/components/apicultor/AlertasPanel';
import { AlertaFitosanitariaForm } from '@/components/apicultor/AlertaFitosanitariaForm';
import { InscripcionActorForm } from '@/components/apicultor/InscripcionActorForm';
import { TerritorioUsuarioPanel } from '@/components/apicultor/TerritorioUsuarioPanel';
import { CensoLegalWizard } from '@/components/apicultor/CensoLegalWizard';
import type { ActorLegal } from '@/components/apicultor/CensoLegalWizard';
import dynamic from 'next/dynamic';

const MapaTerritorial = dynamic(
  () => import('@/components/apicultor/MapaTerritorial').then((mod) => mod.MapaTerritorial),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] flex items-center justify-center bg-card rounded-xl border border-border">
        <Spinner />
      </div>
    ),
  }
);

type Tab = 'registro' | 'mapa' | 'alertas' | 'trashumancia';

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
  lat_aproximada?: number;
  lng_aproximada?: number;
  radio_km?: number;
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
  actores_registro: { nombre_actor: string; rup?: string };
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

const NIVEL_INFO: Record<string, { label: string; desc: string }> = {
  base: { label: 'Nivel Base', desc: 'Inscripción completada en el registro comunal.' },
  trazable: { label: 'Nivel Trazable', desc: 'Has documentado al menos un lote o una temporada en el sistema.' },
  comprometido: { label: 'Nivel Comprometido', desc: 'Consentimiento de mapa comunitario y datos completos.' },
  referente: { label: 'Nivel Referente', desc: 'Validación por pares y producción verificada en la plataforma.' },
};

const NIVEL_COLORS: Record<string, string> = {
  base: 'bg-surface-raised text-muted-foreground',
  trazable: 'bg-primary/10 text-primary',
  comprometido: 'bg-primary/20 text-primary',
  referente: 'bg-primary/30 text-primary',
};

const ESTADO_COLORS: Record<string, 'default' | 'success' | 'destructive' | 'warning'> = {
  activo: 'success',
  suspendido: 'warning',
  cancelado: 'destructive',
};

export function TerritorioHomeView() {
  const apiFetch = useApiFetch();
  const [tab, setTab] = useState<Tab>('registro');
  const [showInscripcion, setShowInscripcion] = useState(false);
  const [showAlertaForm, setShowAlertaForm] = useState(false);

  const { data: actorData, refetch: refetchActor } = useQuery<{ data: ActorLegal | null }>({
    queryKey: ['territorio-actor-me'],
    queryFn: async () => {
      const res = await apiFetch('/api/registro-territorial/actores/me');
      if (!res.ok) throw new Error('Error cargando tu inscripción');
      return res.json();
    },
  });

  const { data: actoresData } = useQuery<{ data: ActorResumen[] }>({
    queryKey: ['territorio-actores'],
    queryFn: async () => {
      const res = await apiFetch('/api/registro-territorial/actores');
      if (!res.ok) throw new Error('Error cargando actores');
      return res.json();
    },
  });

  const { data: alertasData, isLoading: loadingAlertas, refetch: refetchAlertas } = useQuery<{
    data: AlertaResumen[];
  }>({
    queryKey: ['territorio-alertas'],
    queryFn: async () => {
      const res = await apiFetch('/api/registro-territorial/alertas');
      if (!res.ok) throw new Error('Error cargando alertas');
      return res.json();
    },
  });

  const { data: apiariosData } = useQuery<{ data: ApiarioExternoResumen[] }>({
    queryKey: ['territorio-apiarios-externos'],
    queryFn: async () => {
      const res = await apiFetch('/api/registro-territorial/apiarios-externos');
      if (!res.ok) throw new Error('Error cargando apiarios externos');
      return res.json();
    },
  });

  const { data: apiariosRegistroData } = useQuery<{ data: ApiarioRegistroResumen[] }>({
    queryKey: ['territorio-apiarios-registro'],
    queryFn: async () => {
      const res = await apiFetch('/api/registro-territorial/apiarios');
      if (!res.ok) throw new Error('Error cargando apiarios del registro');
      return res.json();
    },
  });

  const miActor = actorData?.data ?? null;
  const actores = actoresData?.data ?? [];
  const alertas = alertasData?.data ?? [];
  const apiariosExternos = apiariosData?.data ?? [];

  const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: 'registro', label: 'Mi Registro', icon: MapPin },
    { id: 'mapa', label: 'Mapa Comunitario', icon: Map },
    { id: 'alertas', label: 'Alertas Fitosanitarias', icon: AlertTriangle },
    { id: 'trashumancia', label: 'Trashumancia y Predios', icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Registro Territorial Apícola de Chiloé
        </p>
        <h1 className="text-3xl font-bold font-serif text-foreground">Mi Territorio</h1>
        <p className="text-muted-foreground text-sm max-w-lg">
          Tu presencia en el registro comunitario: protección del territorio, alertas tempranas y trazabilidad de tu miel.
        </p>
      </div>

      {/* Estado real de la inscripción */}
      <div className="p-5 rounded-2xl bg-surface-raised border border-border flex items-center gap-4">
        {miActor ? (
          <>
            <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Inscrito/a como {ROL_LABELS[miActor.rol] ?? miActor.rol}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {miActor.comuna}{miActor.region ? ` · ${miActor.region}` : ''}
                {miActor.rup ? ` · RUP ${miActor.rup}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={ESTADO_COLORS[miActor.estado] ?? 'default'}>{miActor.estado}</Badge>
              <span className={`badge px-2 py-1 rounded-md text-xs font-semibold ${NIVEL_COLORS[miActor.nivel_acreditacion] ?? NIVEL_COLORS.base}`}>
                {NIVEL_INFO[miActor.nivel_acreditacion]?.label ?? miActor.nivel_acreditacion}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Aún no estás en el Registro Territorial</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inscríbete para declarar tus apiarios, recibir alertas fitosanitarias y sumarte al ordenamiento comunal.
              </p>
            </div>
            <Button onClick={() => setShowInscripcion(true)} size="sm">
              <Plus size={16} className="mr-1" /> Inscribirme
            </Button>
          </>
        )}
      </div>

      {/* Censo legal pendiente */}
      {miActor && !miActor.completo && (
        <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30 flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-warning shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Inscripción legal pendiente</p>
            <p className="text-xs text-muted-foreground">
              Completa los datos que exige el censo apícola (Ley N.º 21.489 y ordenanza municipal) para poder declarar trashumancia y predios.
            </p>
          </div>
          <Button size="sm" onClick={() => setTab('registro')}>Continuar</Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors border-b-2 ${
              tab === id
                ? 'text-primary border-primary bg-primary/5'
                : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-surface-raised'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Mi Registro */}
      {tab === 'registro' && (
        <div className="space-y-4">
          {miActor ? (
            miActor.completo ? (
              <>
                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldCheck size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Tu inscripción</h3>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Rol en el territorio</dt>
                      <dd className="mt-1 font-medium text-foreground">{ROL_LABELS[miActor.rol] ?? miActor.rol}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Comuna</dt>
                      <dd className="mt-1 font-medium text-foreground">
                        {miActor.comuna}{miActor.region ? ` · ${miActor.region}` : ''}
                      </dd>
                    </div>
                    {miActor.rut && (
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-muted-foreground">RUT</dt>
                        <dd className="mt-1 font-medium text-foreground">{miActor.rut}</dd>
                      </div>
                    )}
                    {miActor.rup && (
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-muted-foreground">RUP (SAG)</dt>
                        <dd className="mt-1 font-medium text-foreground">{miActor.rup}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Nivel de acreditación</dt>
                      <dd className="mt-1 font-medium text-foreground">
                        {NIVEL_INFO[miActor.nivel_acreditacion]?.label ?? miActor.nivel_acreditacion}
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          {NIVEL_INFO[miActor.nivel_acreditacion]?.desc ?? 'Acreditación por actividad documentada.'}
                        </span>
                      </dd>
                    </div>
                  </dl>
                  <div className="pt-4 mt-4 border-t border-border">
                    <Link
                      href="/declaracion-sag"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileText size={16} />
                      Descargar declaración SAG pre-llenada (Res. 8.196/2015)
                    </Link>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-2">¿Cómo subir de nivel?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    La acreditación se gana documentando tu actividad real en el sistema, no se autodeclara:
                    registra tus predios facilitadores, declara tus movimientos trashumantes y confirma las alertas
                    fitosanitarias de tu zona. La red entera confía en tu historial.
                  </p>
                </div>
              </>
            ) : (
              <>
                <CensoLegalWizard
                  actor={miActor}
                  onSaved={() => {
                    refetchActor().catch(() => toast.error('Error actualizando tu inscripción'));
                  }}
                />
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-2">¿Cómo subir de nivel?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Primero completa tu inscripción legal. Luego, la acreditación se gana documentando tu actividad real
                    en el sistema: predios, trashumancia, alertas y trazabilidad de tu miel.
                  </p>
                </div>
              </>
            )
          ) : (
            <div className="bg-card border border-border rounded-2xl p-10 text-center">
              <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Completa tu inscripción</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
                El registro comunal es la base del ordenamiento apícola de Chiloé: quién tiene colmenas,
                dónde y con qué resguardo. Tú decides qué compartir con el resto del territorio.
              </p>
              <Button onClick={() => setShowInscripcion(true)}>
                <UserPlus size={16} className="mr-1" /> Inscribirme en el Registro
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Mapa Comunitario */}
      {tab === 'mapa' && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Las ubicaciones son aproximadas (~1 km). Tus coordenadas exactas nunca se publican: el mapa comunitario
            protege el valor de tus colmenas.
          </p>
          <MapaTerritorial
            actores={actores}
            alertas={alertas}
            apiariosExternos={apiariosExternos}
            apiariosRegistro={apiariosRegistroData?.data ?? []}
          />
        </div>
      )}

      {/* Alertas Fitosanitarias */}
      {tab === 'alertas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground max-w-lg">
              Alertas de aplicaciones de plaguicidas programadas en el territorio. Confirma las que te afecten
              para avisar al resto de la red.
            </p>
            <Button onClick={() => setShowAlertaForm(true)} size="sm">
              <Plus size={16} className="mr-1" /> Emitir Alerta
            </Button>
          </div>
          <AlertasPanel
            alertas={alertas}
            actorId={miActor?.id ?? null}
            isLoading={loadingAlertas}
            onRefresh={() => {
              refetchAlertas().catch(() => toast.error('Error actualizando alertas'));
            }}
          />
        </div>
      )}

      {/* Trashumancia y Predios */}
      {tab === 'trashumancia' && (
        <TerritorioUsuarioPanel inscripcionCompleta={miActor?.completo ?? false} />
      )}

      {/* Modales */}
      {showInscripcion && (
        <InscripcionActorForm
          onClose={() => setShowInscripcion(false)}
          onSuccess={() => {
            setShowInscripcion(false);
            refetchActor().catch(() => toast.error('Error actualizando tu inscripción'));
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
