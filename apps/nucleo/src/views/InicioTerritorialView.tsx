'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Sprout, MapPin, Hexagon, BellRing, ScanLine, BookOpen,
  CalendarDays, ShieldCheck, Truck, FileText, Users,
} from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useAuthStore } from '@enjambre/auth';
import {
  getTerritorialCredential,
  getTerritorialHomeCopy,
  getTerritorialHomeTools,
  getTerritorialPrimaryHref,
  isAgriRol,
  isComercialRol,
  isPredioRol,
  isTecnicoRol,
  resolveTerritorialMenuFamily,
  territorialRolLabel,
} from '@/lib/territorial-rol';
import { adoptTerritorialSession } from '@/lib/adopt-territorial-session';
import { useEditorialGreeting } from '@/lib/editorial-greeting';
import { BienvenidaTerritorialCard } from '@/components/territorio/BienvenidaTerritorialCard';

interface ResumenTerritorial {
  actor: {
    id: string;
    rol: string;
    nombre_actor: string;
    comuna: string;
    region: string | null;
    nivel_acreditacion: string;
    completo: boolean;
  } | null;
  apiarios: number;
  colmenas: number;
  alertasActivas: number;
  observaciones: number;
}

function getToolIcon(href: string, title: string) {
  if (href.startsWith('/colmenas/cuaderno')) return <BookOpen size={18} />;
  if (href.startsWith('/colmenas')) return <Hexagon size={18} />;
  if (href.startsWith('/calendario')) return <CalendarDays size={18} />;
  if (href.startsWith('/territorio/trashumancia')) return <Truck size={18} />;
  if (href.startsWith('/territorio/alertas')) return <BellRing size={18} />;
  if (href.startsWith('/declaracion-sag')) return <FileText size={18} />;
  if (href.startsWith('/fenologia')) return <Sprout size={18} />;
  if (href.startsWith('/registro-territorial')) return <Users size={18} />;
  if (title.toLowerCase().includes('censo') || href.startsWith('/territorio')) return <ShieldCheck size={18} />;
  return <MapPin size={18} />;
}

/**
 * Inicio del rol territorial — home por familia + énfasis de actividad.
 * La credencial (`nivel_acreditacion`) es copy; el candado es `completo`.
 */
export function InicioTerritorialView() {
  const apiFetch = useApiFetch();
  const sessionTerritorialRol = useAuthStore((s) => s.user?.territorial_rol ?? null);
  const authUserFullName = useAuthStore((s) => s.user?.full_name ?? undefined);
  const [resumen, setResumen] = useState<ResumenTerritorial | null>(null);
  const [cargando, setCargando] = useState(true);

  const [adoptFailed, setAdoptFailed] = useState(false);
  const hasAttemptedAdoptRef = useRef(false);

  const cargar = useCallback(async () => {
    try {
      const res = await apiFetch('/api/registro-territorial/resumen');
      if (res.ok) {
        const j = await res.json();
        setResumen(j.data ?? null);
        if (j.data?.actor) {
          setAdoptFailed(false);
          return;
        }
      }

      // Si no hay actor en la respuesta y aún no se intentó adopción en este ciclo,
      // ejecutar el alta automática una sola vez de forma controlada.
      if (!hasAttemptedAdoptRef.current) {
        hasAttemptedAdoptRef.current = true;
        const adopted = await adoptTerritorialSession();
        if (adopted.ok && adopted.adopted) {
          const retryRes = await apiFetch('/api/registro-territorial/resumen');
          if (retryRes.ok) {
            const retryJ = await retryRes.json();
            setResumen(retryJ.data ?? null);
            if (retryJ.data?.actor) setAdoptFailed(false);
            return;
          }
        }
        setAdoptFailed(!adopted.ok);
      }
    } catch {
      /* el inicio se muestra sin métricas si el resumen falla */
    } finally {
      setCargando(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // SoT en UI: actor inscrito > sesión (auth store) > null
  const effectiveRol =
    resumen?.actor?.rol ?? sessionTerritorialRol ?? null;
  const family = resolveTerritorialMenuFamily(effectiveRol);
  const homeCopy = getTerritorialHomeCopy(effectiveRol);
  const tools = useMemo(
    () => getTerritorialHomeTools(effectiveRol, { censoCompleto: resumen?.actor?.completo }),
    [effectiveRol, resumen?.actor?.completo],
  );
  const credential = resumen?.actor
    ? getTerritorialCredential(resumen.actor.nivel_acreditacion)
    : null;
  const ctaHref = getTerritorialPrimaryHref(effectiveRol, {
    inscrito: Boolean(resumen?.actor),
    censoCompleto: resumen?.actor?.completo,
  });

  const rolLabel = territorialRolLabel(effectiveRol);

  const editorial = useEditorialGreeting({
    name: resumen?.actor?.nombre_actor ?? authUserFullName,
    subrole: effectiveRol,
  });

  const showApiStats = family === 'api' || family === 'minimo';
  const stats =
    family === 'institucion'
      ? [
          {
            icon: <Hexagon size={18} />,
            val: resumen?.colmenas ?? 0,
            label: 'Colmenas en red (agregado)',
          },
          {
            icon: <MapPin size={18} />,
            val: resumen?.apiarios ?? 0,
            label: 'Apiarios en red',
          },
          {
            icon: <BellRing size={18} />,
            val: resumen?.alertasActivas ?? 0,
            label: 'Alertas activas',
          },
          {
            icon: <ScanLine size={18} />,
            val: resumen?.observaciones ?? 0,
            label: 'Observaciones fenológicas',
          },
        ]
      : [
          { icon: <Hexagon size={18} />, val: resumen?.colmenas ?? 0, label: 'Colmenas declaradas' },
          { icon: <MapPin size={18} />, val: resumen?.apiarios ?? 0, label: 'Apiarios registrados' },
          {
            icon: <BellRing size={18} />,
            val: resumen?.alertasActivas ?? 0,
            label: 'Alertas en tu zona',
          },
          {
            icon: <ScanLine size={18} />,
            val: resumen?.observaciones ?? 0,
            label: 'Observaciones fenológicas',
          },
        ];

  const isAgri = isAgriRol(effectiveRol);
  const isPredio = isPredioRol(effectiveRol);
  const isTecnico = isTecnicoRol(effectiveRol);
  const isComercial = isComercialRol(effectiveRol);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow={homeCopy.eyebrow}
        greeting={editorial.greeting}
        title="Inicio"
        subtitle={
          resumen?.actor
            ? `Tu territorio, tus herramientas — ${resumen.actor.comuna}${resumen.actor.region ? `, ${resumen.actor.region}` : ''}.`
            : homeCopy.subtitleFallback
        }
        icon={<Sprout size={20} />}
        actions={
          resumen?.actor ? (
            <div className="flex flex-wrap items-center gap-2">
              {credential && (
                <span
                  className={`text-xs px-2.5 py-1 rounded-full uppercase tracking-wide font-medium ${credential.className}`}
                  title={credential.desc}
                >
                  Credencial {credential.label}
                </span>
              )}
              <Link
                href={ctaHref}
                className={`text-xs px-2.5 py-1 rounded-full uppercase tracking-wide font-medium transition-colors ${
                  resumen.actor.completo
                    ? 'bg-success/15 text-success border border-success/30 hover:bg-success/20'
                    : 'bg-warning/15 text-warning border border-warning/30 hover:bg-warning/20'
                }`}
              >
                Censo {resumen.actor.completo ? 'completo' : 'pendiente'}
              </Link>
            </div>
          ) : undefined
        }
      >
        {/* Pulso Fenológico: Centralizado y unificado en la cabecera */}
        <div className="w-full mt-3 pt-3.5 border-t border-border/40 flex flex-col items-center text-center animate-in fade-in duration-500">
          <div className="inline-flex items-center justify-center gap-2 flex-wrap px-3 py-1 rounded-full bg-surface-raised/80 border border-border/50">
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-medium inline-flex items-center gap-1.5">
              <Sprout size={11} className="text-primary" />
              Pulso Fenológico
            </span>
            <span className="text-border/80">·</span>
            <span className="text-[11px] text-muted-foreground font-medium">
              {editorial.season.seasonName}
            </span>
          </div>
          <p className="font-display italic text-base sm:text-lg text-foreground/90 leading-snug mt-2 max-w-3xl">
            «{editorial.quote.quote}»
          </p>
        </div>
      </ViewShell>

      {/* Guía de Bienvenida de Primera Vez y Pilares */}
      <BienvenidaTerritorialCard
        nombreActor={resumen?.actor?.nombre_actor}
        rolLabel={rolLabel}
        comuna={resumen?.actor?.comuna}
        completo={resumen?.actor?.completo}
        ctaHref={ctaHref}
      />

      {!cargando && !resumen?.actor && (
        <div className="card p-4 border border-warning/30 bg-warning/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              {adoptFailed
                ? 'Aún no encontramos tu ficha territorial'
                : family === 'institucion'
                  ? 'Aún no hay ficha de institución vinculada'
                  : isAgri
                    ? 'Aún no has configurado tu perfil agrícola'
                    : isPredio
                      ? 'Aún no has configurado tu perfil de propietario'
                      : isTecnico
                        ? 'Aún no has validado tu ficha técnica'
                        : isComercial
                          ? 'Aún no has configurado tu perfil de acopio'
                          : 'Aún no estás en el Registro Territorial'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {adoptFailed
                ? 'Reintenta o completa tu inscripción en 2 minutos con tus datos básicos para resguardar tus colmenas.'
                : family === 'institucion'
                  ? 'Completa la inscripción institucional para ver censo y mapa con tu rol.'
                  : isAgri
                    ? 'Inscríbete para emitir alertas fitosanitarias de tus aplicaciones.'
                    : isPredio
                      ? 'Inscríbete para registrar tus predios y acoger apiarios.'
                      : isTecnico
                        ? 'Inscríbete para acceder al censo comunal y al monitoreo sanitario.'
                        : isComercial
                          ? 'Inscríbete para conectar con apicultores y planificar acopio.'
                          : 'Inscríbete para declarar tus apiarios, recibir alertas fitosanitarias y sumarte al ordenamiento comunal.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void cargar()}
              className="px-4 py-2 text-xs rounded-md border border-border font-medium min-h-11"
            >
              Reintentar
            </button>
            <Link
              href={ctaHref}
              className="px-4 py-2 text-xs rounded-md bg-accent text-primary-foreground font-medium hover:opacity-90 transition-opacity whitespace-nowrap min-h-11 inline-flex items-center"
            >
              {family === 'institucion' ? 'Abrir territorio' : 'Ir a Territorio'}
            </Link>
          </div>
        </div>
      )}

      {(showApiStats || family === 'institucion') && (
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
              <div className="stat-header">
                <div className="stat-icon">{s.icon}</div>
              </div>
              <div className="stat-value">{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-baseline justify-between gap-3 pt-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Herramientas y Servicios
        </span>
        <span className="text-xs text-muted-foreground">
          {tools.length} disponibles
        </span>
      </div>

      <div
        className={`grid grid-cols-1 gap-3 ${tools.length >= 3 ? 'sm:grid-cols-2 xl:grid-cols-3' : tools.length === 2 ? 'sm:grid-cols-2' : ''}`}
      >
        {tools.map((t) => (
          <Link
            key={`${t.href}-${t.title}`}
            href={t.href}
            className={`card p-4 border transition-all duration-150 active:scale-[0.98] ${
              t.primary
                ? 'border-accent/40 bg-accent/5 hover:border-accent/70 shadow-sm'
                : 'border-border hover:border-accent/40 bg-card'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                t.primary ? 'bg-accent/20 text-accent' : 'bg-surface-raised text-primary'
              }`}>
                {getToolIcon(t.href, t.title)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="section-title text-sm text-foreground font-medium">{t.title}</div>
                  {t.primary && (
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-accent/20 text-accent shrink-0">
                      Prioritario
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.desc}</p>
              </div>
              <span className="text-muted-foreground/40 shrink-0 self-center" aria-hidden>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

