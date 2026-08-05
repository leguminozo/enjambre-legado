'use client';

import { useEffect, useState } from 'react';
import { MapPin, Eye, AlertTriangle, Flower2, Shield } from 'lucide-react';
import type { MapaChiloePublico as MapaData } from '@/lib/mapa-chiloe-publico';
import { MapaChiloePublico } from './MapaChiloePublico';

/**
 * Mapa público apícola de Chiloé (mov. 11).
 * Anonimizado: sin nombres, RUP ni GPS exacto.
 */
export default function MapaChiloePage() {
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-primary text-primary-foreground px-6 py-12 text-center">
        <p className="text-xs uppercase tracking-[0.2em] opacity-80 mb-2">
          Red Apícola Territorial
        </p>
        <h1 className="text-3xl font-serif font-bold">Mapa apícola de Chiloé</h1>
        <p className="mt-3 text-sm opacity-85 max-w-md mx-auto leading-relaxed">
          Capa pública: apiarios declarados, predios facilitadores, alertas fitosanitarias y
          floración — sin datos personales ni ubicación exacta.
        </p>
      </header>

      <main className="max-w-3xl mx-auto px-4 -mt-6 pb-16 relative z-10 space-y-4">
        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="w-4 h-4 text-primary" />
              Visor público
            </div>
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
          </div>
          <div className="h-[min(70vh,520px)] w-full">
            {data ? (
              <MapaChiloePublico
                data={data}
                showApiarios={showApiarios}
                showAlertas={showAlertas}
                showFloraciones={showFloraciones}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground animate-pulse">
                Cargando capas…
              </div>
            )}
          </div>
        </section>

        {data && (
          <>
            <section className="rounded-2xl border border-border bg-card p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <Stat n={data.apiarios.filter((a) => a.tipo === 'externo').length} label="Apiarios" />
              <Stat n={data.apiarios.filter((a) => a.tipo === 'predio').length} label="Predios" />
              <Stat n={data.alertas.length} label="Alertas" />
              <Stat n={data.floraciones.length} label="Floración" />
            </section>

            {data.comunas.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-3">Por comuna</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="py-2 pr-2">Comuna</th>
                        <th className="py-2 pr-2">Actores</th>
                        <th className="py-2 pr-2">Apiarios</th>
                        <th className="py-2">Alertas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.comunas.map((c) => (
                        <tr key={c.comuna} className="border-b border-border/40">
                          <td className="py-2 pr-2 font-medium">{c.comuna}</td>
                          <td className="py-2 pr-2 tabular-nums">{c.actores_activos}</td>
                          <td className="py-2 pr-2 tabular-nums">{c.apiarios_externos}</td>
                          <td className="py-2 tabular-nums">{c.alertas_activas}</td>
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
                Mapa institucional de la Red ·{' '}
                <a href="/carta" className="text-primary hover:underline">
                  Carta constitutiva
                </a>
                {' · '}
                <a href="/impacto" className="text-primary hover:underline">
                  Impacto open-book
                </a>
              </p>
            </section>
          </>
        )}
      </main>
    </div>
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-colors ${
        active
          ? 'bg-primary/10 border-primary/40 text-primary'
          : 'bg-background border-border text-muted-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="bg-surface-sunken rounded-xl p-3">
      <p className="text-lg font-bold tabular-nums text-foreground">{n}</p>
      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
