'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MapPin, Eye, AlertTriangle, Flower2, Shield, ArrowLeft, ExternalLink } from 'lucide-react';
import type { MapaChiloePublico as MapaData } from '@/lib/mapa-chiloe-publico';
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
  const [error, setError] = useState<string | null>(null);
  const [showApiarios, setShowApiarios] = useState(true);
  const [showAlertas, setShowAlertas] = useState(true);
  const [showFloraciones, setShowFloraciones] = useState(true);

  useEffect(() => {
    fetch('/api/mapa-publico/chiloe')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('No se pudo cargar el mapa'))))
      .then((json) => setData(json.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error'));
  }, []);

  const layerToggles = (
    <div className="flex flex-wrap gap-2 text-xs">
      <Toggle
        active={showApiarios}
        onClick={() => setShowApiarios((v) => !v)}
        icon={<Eye className="w-3.5 h-3.5" />}
        label="Apiarios / predios"
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

  const mapPanel = (
    <section
      className={`overflow-hidden border border-border bg-card ${
        embed ? 'h-full rounded-none border-0' : 'rounded-2xl shadow-sm'
      }`}
    >
      {!embed && (
        <div className="p-4 sm:px-5 border-b border-border flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            Visor público · zonas aproximadas (±1 km)
          </div>
          {layerToggles}
        </div>
      )}
      {embed && (
        <div className="absolute top-3 left-3 right-3 z-[500] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/90 backdrop-blur-md px-3 py-1.5 text-[0.65rem] font-medium text-foreground shadow-sm">
            <MapPin className="w-3 h-3 text-primary" />
            Mapa público
          </span>
          <div className="pointer-events-auto">{layerToggles}</div>
        </div>
      )}
      <div className={`relative w-full ${embed ? 'h-full min-h-[280px]' : 'h-[min(70vh,560px)]'}`}>
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
              Cargando capas…
            </div>
          )
        )}
      </div>
    </section>
  );

  if (embed) {
    return (
      <div className="relative h-[100dvh] w-full bg-background overflow-hidden">
        {mapPanel}
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

  return (
    <div className="min-h-[var(--vh-full)] bg-background text-foreground flex flex-col">
      <TerritorioHeader />

      <section className="relative border-b border-border px-4 sm:px-8 lg:px-16 xl:px-24 pt-10 pb-12 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(circle at center, currentColor 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="relative max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-10 mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
          <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold mb-3">
            Red apícola territorial · Chiloé
          </p>
          <h1 className="font-serif text-[clamp(1.75rem,4vw,2.75rem)] font-bold tracking-tight text-foreground text-balance leading-[1.15]">
            Mapa apícola público
          </h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-xl">
            Apiarios declarados, predios facilitadores, alertas fitosanitarias y floración.
            Sin nombres, sin contactos y sin GPS exacto: solo zonas aproximadas de ~1 km.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-5">
        {mapPanel}

        {data && (
          <>
            <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <Stat n={data.apiarios.filter((a) => a.tipo === 'externo').length} label="Apiarios" />
              <Stat n={data.apiarios.filter((a) => a.tipo === 'predio').length} label="Predios" />
              <Stat n={data.alertas.length} label="Alertas" />
              <Stat n={data.floraciones.length} label="Floración" />
            </section>

            {data.comunas.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-3 text-foreground">
                  Por comuna
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="py-2.5 pr-2 font-medium">Comuna</th>
                        <th className="py-2.5 pr-2 font-medium">Actores</th>
                        <th className="py-2.5 pr-2 font-medium">Apiarios</th>
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

            <section className="rounded-2xl border border-border bg-card p-5 text-xs text-muted-foreground leading-relaxed space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Shield className="w-4 h-4 text-primary" />
                Privacidad
              </div>
              <p>{data.privacidad.nota}</p>
              <p className="font-mono text-[0.65rem]">
                v{data.version} · {data.privacidad.precision_coords} ·{' '}
                {new Date(data.generado_en).toLocaleString('es-CL')}
              </p>
              <p>
                Mapa de la Red ·{' '}
                <Link href="/carta" className="text-primary hover:underline">
                  Carta constitutiva
                </Link>
                {' · '}
                <Link href="/impacto" className="text-primary hover:underline">
                  Impacto
                </Link>
                {' · '}
                <Link href="/login?mode=signup" className="text-primary hover:underline">
                  Inscribirse
                </Link>
              </p>
            </section>
          </>
        )}
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
      className={`inline-flex items-center gap-1.5 min-h-8 sm:min-h-9 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border backdrop-blur-md text-[11px] sm:text-xs font-medium transition-all shadow-sm active:scale-[0.98] ${
        active
          ? 'bg-primary/20 border-primary/45 text-foreground ring-1 ring-primary/25'
          : 'bg-background/85 border-border/80 text-muted-foreground hover:text-foreground hover:bg-background'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="bg-surface-sunken rounded-xl p-3.5">
      <p className="text-xl font-bold tabular-nums text-foreground">{n}</p>
      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
