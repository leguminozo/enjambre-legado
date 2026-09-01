'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  MapPin, Map, AlertTriangle, Truck, Plus, ShieldCheck, UserPlus, CheckCircle2, ClipboardList, FileText,
  Sprout, BookOpen, Sparkles, Hexagon
} from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useTerritorialActor } from '@/hooks/use-territorial-actor';
import { adoptTerritorialSession } from '@/lib/adopt-territorial-session';
import { Badge, Button, Spinner, toast } from '@enjambre/ui';
import { AlertasPanel } from '@/components/apicultor/AlertasPanel';
import { AlertaFitosanitariaForm } from '@/components/apicultor/AlertaFitosanitariaForm';
import { InscripcionActorForm } from '@/components/apicultor/InscripcionActorForm';
import { TerritorioUsuarioPanel } from '@/components/apicultor/TerritorioUsuarioPanel';
import { CensoLegalWizard } from '@/components/apicultor/CensoLegalWizard';
import {
  getTerritorialCredential,
  isAgriRol,
  isComercialRol,
  isPredioRol,
  isTecnicoRol,
  territorialRolLabel,
  resolveTerritorialMenuFamily,
  getTerritorialTerritoryTabs,
} from '@/lib/territorial-rol';
import { useAuthStore } from '@enjambre/auth';
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

function tabFromPath(pathname: string): Tab {
  if (pathname.endsWith('/mapa')) return 'mapa';
  if (pathname.endsWith('/alertas')) return 'alertas';
  if (pathname.endsWith('/trashumancia')) return 'trashumancia';
  return 'registro';
}

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

const TAB_ICON: Record<string, LucideIcon> = {
  registro: MapPin,
  mapa: Map,
  alertas: AlertTriangle,
  trashumancia: Truck,
};



const ESTADO_COLORS: Record<string, 'default' | 'success' | 'destructive' | 'warning'> = {
  activo: 'success',
  suspendido: 'warning',
  cancelado: 'destructive',
};

export function TerritorioHomeView() {
  const apiFetch = useApiFetch();
  const pathname = usePathname();
  const router = useRouter();
  const tab = tabFromPath(pathname);
  const [showInscripcion, setShowInscripcion] = useState(false);
  const [showAlertaForm, setShowAlertaForm] = useState(false);

  const { data: actorData, refetch: refetchActor, isFetched: actorFetched } = useTerritorialActor();

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

  const retryAdopt = async () => {
    const result = await adoptTerritorialSession();
    if (!result.ok) {
      toast.error('No se pudo completar el alta. Reintenta o usa el formulario.');
      return;
    }
    await refetchActor();
  };

  useEffect(() => {
    if (!actorFetched || miActor) return;
    void adoptTerritorialSession().then((r) => {
      if (r.ok) void refetchActor();
    });
  }, [actorFetched, miActor, refetchActor]);
  const sessionTerritorialRol = useAuthStore((s) => s.user?.territorial_rol ?? null);
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const effectiveRol = miActor?.rol ?? sessionTerritorialRol ?? null;
  const family = resolveTerritorialMenuFamily(effectiveRol);
  const isAgri = isAgriRol(effectiveRol);
  const isPredio = isPredioRol(effectiveRol);
  const isTecnico = isTecnicoRol(effectiveRol);
  const isComercial = isComercialRol(effectiveRol);
  const canEmit = isAgri || isAdmin;

  const actores = actoresData?.data ?? [];
  const alertas = alertasData?.data ?? [];
  const apiariosExternos = apiariosData?.data ?? [];
  const credential = getTerritorialCredential(miActor?.nivel_acreditacion);
  const territoryTabs = useMemo(() => getTerritorialTerritoryTabs(effectiveRol), [effectiveRol]);

  const currentMeta = {
    registro: {
      eyebrow: 'Registro Territorial · Chiloé',
      title: 'Mi Registro Territorial',
      desc: 'Tu presencia en el registro comunitario, datos del censo y trazabilidad de tu miel.',
    },
    mapa: {
      eyebrow: 'Red Apícola · Territorio',
      title: 'Mapa de la Red',
      desc: 'Zonas aproximadas de pecoreo de la red apícola de Chiloé (~1 km). Tus coordenadas exactas nunca se publican.',
    },
    alertas: {
      eyebrow: 'Prevención · Fitosanitarios',
      title: 'Alertas Fitosanitarias',
      desc: 'Avisos de aplicaciones de plaguicidas programadas en el territorio.',
    },
    trashumancia: {
      eyebrow: 'Trashumancia & Predios · Ley 21.489',
      title: 'Trashumancia y Predios',
      desc: 'Declaraciones de movimientos de colmenas y catastro de predios facilitadores.',
    },
  }[tab];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest font-mono">
          {currentMeta.eyebrow}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground">{currentMeta.title}</h1>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-xl">
          {currentMeta.desc}
        </p>
      </div>

      {/* Selector de pestañas de navegación territorial */}
      <nav
        aria-label="Pestañas de Territorio"
        className="flex items-center gap-1.5 p-1 bg-surface-raised border border-border rounded-xl overflow-x-auto scrollbar-none"
      >
        {territoryTabs.map((t) => {
          const Icon = TAB_ICON[t.id] ?? MapPin;
          const isActive = tab === t.id;
          return (
            <Link
              key={t.id}
              href={t.href}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-card text-foreground shadow-sm border border-border/80'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-primary' : 'text-muted-foreground/70'} />
              <span>{t.label}</span>
              {t.id === 'alertas' && alertas.filter((a) => a.estado === 'activa').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-warning animate-pulse" title="Alertas activas" />
              )}
              {t.id === 'registro' && miActor && !miActor.completo && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-warning/20 text-warning border border-warning/30">
                  Pendiente
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Estado real de la inscripción (solo en vista de registro o si está incompleto) */}
      {(tab === 'registro' || !miActor?.completo) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-raised border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {miActor ? (
            <>
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    Inscrito/a como {territorialRolLabel(miActor.rol)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {miActor.comuna}{miActor.region ? ` · ${miActor.region}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Badge variant={ESTADO_COLORS[miActor.estado] ?? 'default'}>{miActor.estado}</Badge>
                <span
                  className={`badge px-2 py-1 rounded-md text-xs font-semibold ${credential.className}`}
                  title={credential.desc}
                >
                  Credencial {credential.label}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {isAgri
                      ? 'Configura tu perfil agrícola'
                      : isPredio
                        ? 'Registra tu predio'
                        : isTecnico
                          ? 'Valida tu ficha técnica'
                          : isComercial
                            ? 'Configura tu perfil de acopio'
                            : family === 'institucion'
                              ? 'Valida tu ficha municipal'
                              : 'Completa tu censo legal'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {isAgri
                      ? 'Tu cuenta está activa. Para emitir alertas fitosanitarias, necesitamos tus datos básicos de ubicación y contacto.'
                      : isPredio
                        ? 'Tu cuenta está activa. Inscribe tu predio para poder recibir colmenas y coordinar con apicultores locales.'
                        : isTecnico
                          ? 'Tu cuenta está activa. Valida tus datos para acceder al censo comunal y al monitoreo sanitario.'
                          : isComercial
                            ? 'Tu cuenta está activa. Completa tus datos de acopio para conectar con la red de apicultores.'
                            : family === 'institucion'
                              ? 'Tu cuenta está activa. Valida los datos de tu institución para ver el censo y emitir informes comunales.'
                              : 'Tu cuenta está activa. Para declarar apiarios, trashumancia y emitir tu declaración SAG, completa el censo apícola (Ley 21.489).'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button onClick={() => void retryAdopt()} size="sm" variant="outline">
                  Reintentar alta
                </Button>
                <Button onClick={() => setShowInscripcion(true)} size="sm">
                  <Plus size={16} className="mr-1" />{' '}
                  {family === 'institucion'
                    ? 'Validar ficha'
                    : isAgri || isPredio
                      ? 'Configurar perfil'
                      : 'Completar censo'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Censo legal pendiente */}
      {miActor && !miActor.completo && tab !== 'registro' && (
        <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <ClipboardList className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Censo legal pendiente
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Para habilitar trashumancia, predios y la declaración SAG, completa los datos del censo apícola: RUT, apiarios y prácticas sanitarias.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => router.push('/territorio')} className="shrink-0">
            Completar censo
          </Button>
        </div>
      )}

      {/* Mi Registro */}
      {tab === 'registro' && (
        <div className="space-y-4">
          {miActor ? (
            miActor.completo ? (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Tu inscripción legal</h3>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
                </dl>
              </div>
            ) : (
              <CensoLegalWizard
                actor={miActor}
                onSaved={() => {
                  refetchActor().catch(() => toast.error('Error actualizando tu inscripción'));
                }}
              />
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 gap-3">
            <p className="text-sm text-muted-foreground max-w-lg">
              {canEmit
                ? 'Programa aplicaciones de plaguicidas y avisa a los apicultores vecinos (radio 3 km). Confirma las ajenas que te afecten.'
                : 'Alertas de aplicaciones de plaguicidas programadas en el territorio. Confirma las que te afecten para avisar al resto de la red.'}
            </p>
            {canEmit && (
              <Button onClick={() => setShowAlertaForm(true)} size="sm" className="shrink-0">
                <Plus size={16} className="mr-1" /> Emitir Alerta
              </Button>
            )}
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
          mode="self-rescue"
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
