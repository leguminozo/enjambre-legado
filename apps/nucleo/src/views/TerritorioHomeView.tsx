'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  MapPin, Map, AlertTriangle, Truck, Plus, ShieldCheck, UserPlus, CheckCircle2, ClipboardList, FileText,
  Sprout, BookOpen, Hexagon, Award, Bell, Edit3
} from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useTerritorialActor } from '@/hooks/use-territorial-actor';
import { adoptTerritorialSession } from '@/lib/adopt-territorial-session';
import { Badge, Button, Spinner, toast, Skeleton } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { AlertasPanel } from '@/components/apicultor/AlertasPanel';
import { AlertaFitosanitariaForm } from '@/components/apicultor/AlertaFitosanitariaForm';
import { InscripcionActorForm } from '@/components/apicultor/InscripcionActorForm';
import { TerritorioUsuarioPanel } from '@/components/apicultor/TerritorioUsuarioPanel';
import { CensoLegalWizard } from '@/components/apicultor/CensoLegalWizard';
import { CredencialTerritorialModal } from '@/components/apicultor/CredencialTerritorialModal';
import {
  getTerritorialCredential,
  isAgriRol,
  isComercialRol,
  isPredioRol,
  isTecnicoRol,
  territorialRolLabel,
  resolveTerritorialMenuFamily,
} from '@/lib/territorial-rol';
import { useAuthStore } from '@enjambre/auth';
import dynamic from 'next/dynamic';

const MapaTerritorial = dynamic(
  () => import('@/components/apicultor/MapaTerritorial').then((mod) => mod.MapaTerritorial),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[580px] h-[calc(var(--vh-full)-240px)] flex flex-col items-center justify-center bg-card rounded-2xl border border-border p-6 gap-3 animate-in" aria-busy="true">
        <Map className="w-10 h-10 text-muted-foreground animate-pulse" />
        <Skeleton variant="text" className="w-48 h-4" />
        <Skeleton variant="text" className="w-64 h-3 opacity-60" />
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
  comuna?: string;
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
  const [showCredencial, setShowCredencial] = useState(false);
  const [editingCenso, setEditingCenso] = useState(false);

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
  const apiariosPropios = apiariosRegistroData?.data ?? [];
  const totalColmenas = apiariosPropios.reduce((sum, a) => sum + (a.n_colmenas || 0), 0);

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

  const alertasEnMiComuna = useMemo(() => {
    if (!miActor) return [];
    const actorComunaLower = miActor.comuna.toLowerCase().trim();
    return alertas.filter(
      (a) =>
        a.estado === 'activa' &&
        ((a.comuna && a.comuna.toLowerCase().trim() === actorComunaLower) ||
          a.zona?.toLowerCase().includes(actorComunaLower)),
    );
  }, [alertas, miActor]);

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
      {/* Header Canónico (patrón limpio editorial de RSN) */}
      <ViewShell
        variant="clean"
        title={currentMeta.title}
        subtitle={
          tab === 'alertas'
            ? canEmit
              ? 'Programa aplicaciones de plaguicidas y resguarda a los apicultores vecinos (radio 3 km). Confirma las ajenas que te afecten.'
              : 'Alertas de aplicaciones de plaguicidas programadas en el territorio. Confirma las que te afecten para avisar al resto de la red.'
            : currentMeta.desc
        }
        actions={
          tab === 'alertas' && canEmit ? (
            <Button
              onClick={() => setShowAlertaForm(true)}
              size="sm"
              className="text-xs h-9 rounded-xl shadow-sm"
            >
              <Plus size={15} className="mr-1.5" /> Emitir Alerta Fitosanitaria
            </Button>
          ) : tab === 'registro' && miActor ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCredencial(true)}
              className="text-xs h-9 rounded-xl border-border/80 hover:bg-surface-raised"
            >
              <Award size={14} className="mr-1.5 text-primary" /> Credencial Digital
            </Button>
          ) : tab === 'mapa' ? (
            <div className="flex items-center gap-2">
              {miActor && !miActor.completo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/territorio')}
                  className="text-xs h-8 rounded-xl border-warning/40 text-warning bg-warning/10 hover:bg-warning/20 font-medium"
                >
                  <ClipboardList size={13} className="mr-1.5" /> Completar Censo
                </Button>
              )}
              <span className="text-[11px] font-mono text-muted-foreground/80 bg-surface-raised px-3 py-1.5 rounded-xl border border-border/60">
                Pecoreo ±1.5 km · GPS protegido
              </span>
            </div>
          ) : undefined
        }
      />

      {/* Selector de pestañas canónico y accesible */}
      <ResponsiveTabBar
        variant="pill"
        layoutId="territorio-home-tabs"
        tabs={[
          { id: 'registro', label: 'Mi Registro' },
          { id: 'mapa', label: 'Mapa de la Red' },
          { id: 'alertas', label: 'Alertas', badge: alertasEnMiComuna.length > 0 ? alertasEnMiComuna.length : undefined },
          { id: 'trashumancia', label: 'Trashumancia y Predios' },
        ]}
        activeId={tab}
        onChange={(id) => {
          if (id === 'registro') router.push('/territorio');
          else router.push(`/territorio/${id}`);
        }}
      />

      {/* Alerta temprana fitosanitaria en la comuna del apicultor */}
      {miActor && alertasEnMiComuna.length > 0 && tab !== 'alertas' && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">
                Alerta de Aplicación Fitosanitaria en {miActor.comuna}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Se registran {alertasEnMiComuna.length} aviso(s) programado(s) dentro de tu zona comunal (Ley N° 21.489 y Res. SAG 7.068/2024). Revisa los productos y perímetros para resguardar tus apiarios.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => router.push('/territorio/alertas')}
            className="shrink-0 text-xs"
          >
            Ver Alertas Fitosanitarias
          </Button>
        </div>
      )}

      {/* Estado real de la inscripción (en registro, o si el usuario aún no está inscrito en absoluto) */}
      {(tab === 'registro' || !miActor) && (
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
                  className={`badge px-2.5 py-1 rounded-lg text-xs font-semibold ${credential.className}`}
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
                              : 'Inscríbete en el Registro Territorial'}
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
                              : 'Tu cuenta está activa. Para declarar apiarios, trashumancia y emitir tu declaración SAG, completa tu inscripción inicial.'}
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
                      : 'Inscribirme en el Registro'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Censo legal pendiente (solo en pestañas que no son registro ni mapa para no quebrar el viewport) */}
      {miActor && !miActor.completo && tab !== 'registro' && tab !== 'mapa' && (
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
          <Button
            size="sm"
            onClick={() => {
              setShowInscripcion(false);
              setShowAlertaForm(false);
              router.push('/territorio');
            }}
            className="shrink-0"
          >
            Completar censo
          </Button>
        </div>
      )}

      {/* Mi Registro */}
      {tab === 'registro' && (
        <div className="space-y-4">
          {miActor ? (
            miActor.completo && !editingCenso ? (
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success/15 border border-success/30 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">Tu inscripción legal está completa</h3>
                        <Badge variant="success">Censo al día</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Inscripción acreditada ante la red territorial y la Ley Apícola SAG N.º 21.489
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCenso(true)}
                      className="text-xs rounded-xl"
                    >
                      <Edit3 size={13} className="mr-1.5" /> Actualizar datos o apiarios
                    </Button>
                    <Link href="/declaracion-sag">
                      <Button size="sm" className="text-xs rounded-xl">
                        <FileText size={13} className="mr-1.5" /> Declaración SAG oficial
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-surface-raised/40 border border-border/60 space-y-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Identidad Legal</p>
                    <div className="space-y-1.5 text-sm">
                      <p className="text-foreground"><span className="text-muted-foreground text-xs">RUT:</span> {miActor.rut || 'No indicado'}</p>
                      <p className="text-foreground"><span className="text-muted-foreground text-xs">Teléfono:</span> {miActor.telefono || 'No indicado'}</p>
                      <p className="text-foreground"><span className="text-muted-foreground text-xs">RUP SAG:</span> {miActor.rup || 'Sin RUP'}</p>
                      <p className="text-xs text-success flex items-center gap-1 font-medium pt-1">
                        <CheckCircle2 size={13} className="shrink-0" /> Existencia animal declarada ante el SAG
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-raised/40 border border-border/60 space-y-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Sanidad y Varroa</p>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-1">Prácticas sanitarias:</p>
                        <p className="text-xs text-foreground font-medium bg-background/60 p-2.5 rounded-lg border border-border/40">
                          {miActor.practicas_sanitarias || 'No especificadas'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-1">Método de control de varroa:</p>
                        <p className="text-xs text-foreground font-medium bg-background/60 p-2.5 rounded-lg border border-border/40">
                          {miActor.metodo_control_varroa || 'No especificado'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-raised/40 border border-border/60 space-y-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Apiarios Declarados</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Apiarios registrados:</span>
                        <span className="font-bold text-foreground">{apiariosPropios.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Total de colmenas:</span>
                        <span className="font-bold text-primary">{totalColmenas} colmenas</span>
                      </div>
                      <div className="space-y-1 pt-1 max-h-32 overflow-y-auto">
                        {apiariosPropios.map((ap) => (
                          <div key={ap.id} className="text-xs bg-background/50 px-2.5 py-1.5 rounded-lg border border-border/40 flex items-center justify-between">
                            <span className="truncate max-w-[140px] font-medium text-foreground">{ap.nombre || ap.zona}</span>
                            <span className="text-muted-foreground font-mono">{ap.n_colmenas} colm.</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 text-xs text-muted-foreground border-t border-border/40">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-primary shrink-0" />
                    Tus coordenadas exactas están protegidas por secreto territorial.
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCredencial(true)}
                    className="text-xs h-8 text-primary hover:text-primary"
                  >
                    <Award size={13} className="mr-1.5" /> Abrir credencial digital
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {editingCenso && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-border">
                    <span className="text-xs font-medium text-muted-foreground">Modo edición de censo legal</span>
                    <Button variant="ghost" size="sm" onClick={() => setEditingCenso(false)} className="text-xs h-7">
                      Volver a mi ficha
                    </Button>
                  </div>
                )}
                <CensoLegalWizard
                  actor={miActor}
                  onSaved={() => {
                    setEditingCenso(false);
                    refetchActor().catch(() => toast.error('Error actualizando tu inscripción'));
                  }}
                />
              </div>
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

      {/* Modal Credencial Territorial */}
      {miActor && (
        <CredencialTerritorialModal
          actor={miActor}
          isOpen={showCredencial}
          onClose={() => setShowCredencial(false)}
        />
      )}
    </div>
  );
}
