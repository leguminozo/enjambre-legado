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

/**
 * Mapa público apícola de Chiloé.
 * ?embed=1 → vista limpia (sin chrome de página) para iframe en landing.
 */
function MapaChiloeContent() {
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
        label="Apiarios"
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
      <div className="relative h-[100dvh] w-full bg-background overflow-hidden">
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
  const totalApicultores = stats?.actores_activos ?? (data?.comunas.reduce((acc, c) => acc + c.actores_activos, 0) || 0);
  const totalComunas = stats?.comunas ?? (data?.comunas.length || 0);
  const totalColmenas = stats?.colmenas_registradas ?? 0;

  return (
    <div className="min-h-[var(--vh-full)] bg-background text-foreground flex flex-col">
      <TerritorioHeader />

      {/* Barra de control compacta superior (visible inmediatamente sobre el mapa) */}
      <div className="border-b border-border bg-card px-4 sm:px-6 lg:px-10 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2.5 rounded-lg border border-border/60 hover:bg-surface-raised"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Inicio</span>
          </Link>
          <div>
            <h1 className="text-sm sm:text-base font-semibold text-foreground font-existencial leading-tight">
              Mapa Apícola Territorial · Chiloé
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Zonas aproximadas de pecoreo (±1 km) · Privacidad protegida
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-between sm:justify-end">
          {layerToggles}
        </div>
      </div>

      {/* Visor del Mapa — Ocupa el espacio visible sin necesidad de scroll */}
      <div className="relative w-full h-[min(65vh,640px)] sm:h-[calc(100dvh-130px)] min-h-[460px] bg-surface-sunken">
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
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground animate-pulse">
              Cargando mapa territorial…
            </div>
          )
        )}
      </div>

      {/* Sección Inferior de Contadores, Comunas y Privacidad */}
      <main className="border-t border-border bg-background py-10 px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Métricas del Censo Comunitario */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-primary font-semibold">
                  Censo Apícola Chiloé 2026–2027
                </p>
                <h2 className="text-lg font-bold text-foreground font-existencial mt-0.5">
                  Avance territorial
                </h2>
              </div>
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-opacity self-start sm:self-auto shadow-sm"
              >
                Inscribirme gratis
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center border-t border-border/60 pt-5">
              <Stat n={totalApicultores} label={totalApicultores === 1 ? 'Apicultor' : 'Apicultores'} />
              <Stat n={totalComunas} label={totalComunas === 1 ? 'Comuna' : 'Comunas'} />
              <Stat n={totalColmenas} label="Colmenas" />
            </div>
          </section>

          {/* Participación por Comuna */}
          {data && data.comunas.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Participación comunal
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-2.5 pr-2 font-medium">Comuna</th>
                      <th className="py-2.5 pr-2 font-medium">Apicultores</th>
                      <th className="py-2.5 pr-2 font-medium">Apiarios en mapa</th>
                      <th className="py-2.5 font-medium">Alertas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.comunas.map((c) => (
                      <tr key={c.comuna} className="border-b border-border/40">
                        <td className="py-2.5 pr-2 font-medium text-foreground">{c.comuna}</td>
                        <td className="py-2.5 pr-2 tabular-nums">{c.actores_activos}</td>
                        <td className="py-2.5 pr-2 tabular-nums">{c.apiarios_externos}</td>
                        <td className="py-2.5 tabular-nums">{c.alertas_activas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Garantía de Privacidad Clara y Humana */}
          <section className="rounded-2xl border border-border bg-card/70 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <p className="leading-relaxed">
                <strong className="text-foreground font-medium">Privacidad protegida:</strong> El mapa público muestra zonas aproximadas (~1 km) para coordinar la defensa sanitaria y de pecoreo, sin publicar nombres, RUP ni GPS exacto.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-xs">
              <Link href="/carta" className="text-primary hover:underline font-medium">
                Carta constitutiva
              </Link>
              <span>·</span>
              <Link href="/impacto" className="text-primary hover:underline font-medium">
                Impacto
              </Link>
            </div>
          </section>
        </div>
      </main>

      <TerritorioFooter />
    </div>
  );
}

export default function MapaChiloePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[var(--vh-full)] flex items-center justify-center text-sm text-muted-foreground">
          Cargando mapa…
        </div>
      }
    >
      <MapaChiloeContent />
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
