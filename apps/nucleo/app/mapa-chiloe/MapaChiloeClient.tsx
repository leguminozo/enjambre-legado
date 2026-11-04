'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MapPin, Eye, AlertTriangle, Flower2, Shield, ArrowLeft, ExternalLink } from 'lucide-react';
import type { MapaChiloePublico as MapaData } from '@/lib/mapa-chiloe-publico';
import type { CensoStatsData } from '@/components/censo/CensoStats';
import { MapaChiloePublico } from './MapaChiloePublico';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';
import type { TerritorioHeaderContent } from '@/lib/territorio-cms';

interface MapaChiloeClientProps {
  headerContent?: TerritorioHeaderContent;
}

/**
 * Mapa público apícola de Chiloé.
 * ?embed=1 → vista limpia (sin chrome de página) para iframe en landing.
 */
function MapaChiloeContent({ headerContent }: MapaChiloeClientProps) {
  const searchParams = useSearchParams();
  const embed = searchParams.get('embed') === '1';

  const [data, setData] = useState<MapaData | null>(null);
  const [stats, setStats] = useState<CensoStatsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showApiarios, setShowApiarios] = useState(true);
  const [showAlertas, setShowAlertas] = useState(true);
  const [showFloraciones, setShowFloraciones] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/mapa-publico/chiloe').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/censo-publico/stats').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([mapaRes, statsRes]) => {
        if (mapaRes?.data) setData(mapaRes.data);
        if (statsRes?.data) setStats(statsRes.data);
        if (!mapaRes?.data) setError('No se pudo cargar el mapa');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar mapa'));
  }, []);

  const layerToggles = (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
      <Toggle
        active={showApiarios}
        onClick={() => setShowApiarios((v) => !v)}
        icon={<Eye className="w-3.5 h-3.5" />}
        label="Zonas en red"
      />
      <Toggle
        active={showAlertas}
        onClick={() => setShowAlertas((v) => !v)}
        icon={<AlertTriangle className="w-3.5 h-3.5" />}
        label="Alertas"
      />
      <Toggle
        active={showFloraciones}
        onClick={() => setShowFloraciones((v) => !v)}
        icon={<Flower2 className="w-3.5 h-3.5" />}
        label="Floración"
      />
    </div>
  );

  // Modo embebido (iframe en landing)
  if (embed) {
    return (
      <div className="relative h-[var(--vh-full)] w-full bg-background overflow-hidden">
        <div className="absolute top-3 left-3 right-3 z-[500] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/90 backdrop-blur-md px-3 py-1.5 text-[0.65rem] font-medium text-foreground shadow-sm">
            <MapPin className="w-3 h-3 text-primary" />
            Mapa público
          </span>
          <div className="pointer-events-auto">{layerToggles}</div>
        </div>

        <div className="relative w-full h-full min-h-[280px]">
          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-background/90">
              <p className="text-sm text-destructive text-center max-w-sm">{error}</p>
            </div>
          )}
          {data ? (
            <MapaChiloePublico
              data={data}
              showApiarios={showApiarios}
              showAlertas={showAlertas}
              showFloraciones={showFloraciones}
            />
          ) : (
            !error && (
              <div className="h-full min-h-[280px] flex items-center justify-center text-sm text-muted-foreground animate-pulse">
                Cargando mapa…
              </div>
            )
          )}
        </div>

        <Link
          href="/mapa-chiloe"
          target="_top"
          className="absolute bottom-3 right-3 z-[500] inline-flex items-center gap-1.5 rounded-full border border-border bg-background/95 px-3 py-2 text-[0.7rem] font-medium text-foreground shadow-md hover:bg-surface-raised transition-colors"
        >
          Ampliar
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // Vista completa directa
  const totalApicultores =
    stats?.actores_activos ??
    (data?.comunas.reduce((acc, c) => acc + c.actores_activos, 0) || 78);
  const totalComunas = data?.comunas.length ?? (stats?.comunas || 10);
  const totalAsentamientos =
    data?.comunas.reduce((acc, c) => acc + (c.asentamientos_protegidos ?? c.apiarios_externos ?? 0), 0) || 141;
  const totalColmenas = stats?.colmenas_registradas ?? 1306;

  return (
    <div className="min-h-[var(--vh-full)] bg-background text-foreground flex flex-col">
      <TerritorioHeader content={headerContent} />

      {/* Visor Inmersivo Enmarcado — Ocupa la vertical con elegancia contenida */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-6 flex flex-col">
        <div className="relative w-full h-[76vh] sm:h-[82vh] lg:h-[85vh] min-h-[520px] rounded-3xl border border-border/80 shadow-2xl overflow-hidden bg-surface-sunken">
          {/* Barra de control flotante sobre el mapa — Título editorial perfectamente centrado */}
          <div className="absolute top-3 sm:top-4 inset-x-3 sm:inset-x-4 z-[400] flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-background/90 dark:bg-card/90 backdrop-blur-xl border border-border/70 shadow-lg pointer-events-auto">
            {/* Lado Izquierdo: Volver al inicio */}
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-xl border border-border/60 hover:bg-surface-raised font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Inicio</span>
              </Link>
            </div>

            {/* Centro: Título y Ley Centrados */}
            <div className="text-center px-2 flex-1">
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-foreground font-existencial tracking-tight leading-tight">
                Mapa Apícola Territorial · Chiloé
              </h1>
              <p className="text-[11px] text-muted-foreground tracking-normal hidden sm:block">
                Zonas Comunales de Pecoreo Protegido · Resguardo Soberano Ley 21.489
              </p>
            </div>

            {/* Lado Derecho: Filtros y capas */}
            <div className="flex items-center gap-1.5 self-end md:self-auto shrink-0">
              {layerToggles}
            </div>
          </div>

          {/* Badge flotante inferior con alcance */}
          <div className="absolute bottom-4 left-4 z-[400] hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/85 dark:bg-card/85 backdrop-blur-md border border-border/60 text-xs text-muted-foreground shadow-md pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>10 comunas insulares protegidas</span>
          </div>

          {/* Visor interactivo Leaflet */}
          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
              <div className="text-center max-w-sm space-y-3">
                <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
                <p className="text-sm text-foreground font-medium">{error}</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-4"
                >
                  Volver al inicio
                </Link>
              </div>
            </div>
          )}

          {data ? (
            <MapaChiloePublico
              data={data}
              showApiarios={showApiarios}
              showAlertas={showAlertas}
              showFloraciones={showFloraciones}
            />
          ) : (
            !error && (
              <div className="h-full w-full flex flex-col items-center justify-center text-sm text-muted-foreground gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <span>Cargando mapa territorial de Chiloé…</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Contenido Editorial y Resumen de Cuencas */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        <div className="space-y-10">
          {/* Cifras de avance territorial */}
          <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-primary font-semibold">
                  Censo Apícola Chiloé 2026–2027
                </p>
                <h2 className="font-existencial text-2xl sm:text-3xl font-bold text-foreground mt-1">
                  Avance territorial
                </h2>
              </div>
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98] shrink-0"
              >
                Inscribirme gratis
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center border-t border-border/60 pt-5">
              <Stat n={totalApicultores} label={totalApicultores === 1 ? 'Apicultor' : 'Apicultores'} />
              <Stat n={totalComunas} label={totalComunas === 1 ? 'Comuna' : 'Comunas'} />
              <Stat n={totalAsentamientos} label="Asentamientos" />
              <Stat n={totalColmenas} label="Colmenas" />
            </div>
          </section>

          {/* Tabla de comunas */}
          {data && data.comunas.length > 0 && (
            <section className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-border">
                <h3 className="font-existencial text-lg font-bold text-foreground">
                  Comunas registradas en la red
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Protección de floradas nativas y áreas de pecoreo por territorio
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-sunken border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 font-medium">Comuna</th>
                      <th className="px-3 sm:px-4 py-3 font-medium text-center">Apicultores</th>
                      <th className="px-3 sm:px-4 py-3 font-medium text-center">Asentamientos</th>
                      <th className="px-4 sm:px-6 py-3 font-medium hidden md:table-cell">Floración nativa</th>
                      <th className="px-3 sm:px-4 py-3 font-medium text-center">Alertas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.comunas.map((c) => (
                      <tr key={c.comuna} className="hover:bg-surface-raised/50 transition-colors">
                        <td className="px-4 sm:px-6 py-3 font-medium text-foreground">
                          {c.comuna}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-center tabular-nums text-foreground">
                          {c.actores_activos}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-center tabular-nums text-foreground">
                          {c.asentamientos_protegidos}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-muted-foreground hidden md:table-cell">
                          {c.floracion_dominante}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-center">
                          {c.alertas_activas > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/15 text-destructive">
                              {c.alertas_activas} activa{c.alertas_activas > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              0
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Garantía de Privacidad Clara y Humana */}
          <section className="rounded-2xl border border-border bg-card/70 p-5 flex items-start sm:items-center gap-3 text-xs text-muted-foreground">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <p className="leading-relaxed">
              <strong className="text-foreground font-medium">Privacidad protegida:</strong> El mapa público presenta zonas agregadas por cuenca comunal (Ley 21.489) para coordinar la defensa sanitaria y de pecoreo, sin publicar coordenadas individuales, RUP ni nombres de predios para resguardar la seguridad de cada apiario.
            </p>
          </section>
        </div>
      </main>

      <TerritorioFooter />
    </div>
  );
}

export function MapaChiloeClient({ headerContent }: MapaChiloeClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[var(--vh-full)] flex items-center justify-center text-sm text-muted-foreground">
          Cargando mapa…
        </div>
      }
    >
      <MapaChiloeContent headerContent={headerContent} />
    </Suspense>
  );
}

function Toggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 min-h-9 px-3 py-1.5 rounded-full border backdrop-blur-md text-xs font-medium transition-all shadow-sm active:scale-[0.98] ${
        active
          ? 'bg-primary/20 border-primary/45 text-foreground ring-1 ring-primary/25'
          : 'bg-background/85 border-border/80 text-muted-foreground hover:text-foreground hover:bg-surface-raised'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="bg-surface-sunken rounded-xl p-3 sm:p-4">
      <p className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">{n}</p>
      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
