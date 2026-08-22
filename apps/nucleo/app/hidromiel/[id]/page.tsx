'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge, Card, CardContent, Spinner } from '@enjambre/ui';
import { CheckCircle2, Droplet, FlaskConical, Leaf, Users, Wine } from 'lucide-react';
import { calcularABV } from '@/lib/hidromiel';
import { CurvaMediciones } from '@/components/hidromiel/CurvaMediciones';

interface MedicionPublica {
  id: string;
  tipo: string;
  valor: number | null;
  unidad: string | null;
  fecha: string;
  nota: string | null;
}

interface LoteHidromielPublico {
  id: string;
  codigo: string;
  nombre: string | null;
  estado: string;
  fecha_inicio: string;
  volumen_litros: number | null;
  densidad_inicial: number | null;
  densidad_final: number | null;
  levadura_cepa: string | null;
  co2_target_vol: number | null;
  presion_target_bar: number | null;
  temperatura_fermentacion: number | null;
  n_botellas: number | null;
  nota_personal: number | null;
  relato_publico: string | null;
  miel_lote: {
    id: string;
    nombre_lote: string | null;
    variedad_floral: string | null;
    kg_total: number | null;
  } | null;
  mediciones: MedicionPublica[];
  ingredientes: Array<{ id: string; nombre: string; cantidad: number | null; unidad: string | null; nota: string | null }>;
  etapas: Array<{ id: string; nombre: string; fecha: string; nota: string | null }>;
}

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function HidromielPublicoPage() {
  const params = useParams();
  const id = params.id as string;

  const [lote, setLote] = useState<LoteHidromielPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLote() {
      try {
        const res = await fetch(`/api/hidromiel/publico/${id}`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Lote no encontrado' : 'Error cargando datos');
        }
        const json = await res.json();
        setLote(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    if (id) void fetchLote();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[var(--vh-full)] bg-background flex flex-col items-center justify-center p-6">
        <Spinner />
        <p className="mt-4 text-sm text-muted-foreground">Abriendo el pasaporte...</p>
      </div>
    );
  }

  if (error || !lote) {
    return (
      <div className="min-h-[var(--vh-full)] bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <Droplet className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Lote no disponible</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">
          {error || 'El lote escaneado no es público o no existe.'}
        </p>
      </div>
    );
  }

  const abv =
    lote.densidad_inicial != null && lote.densidad_final != null
      ? calcularABV(lote.densidad_inicial, lote.densidad_final)
      : null;

  return (
    <div className="min-h-[var(--vh-full)] bg-surface-sunken pb-12">
      <div className="bg-primary px-6 py-12 text-primary-foreground text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative z-10">
          <Badge className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 mb-4 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Pasaporte de la botella
          </Badge>
          <h1 className="text-3xl font-bold font-serif leading-tight">
            {lote.nombre ?? 'Hidromiel'}
          </h1>
          <p className="text-primary-foreground/70 mt-1 text-sm font-mono">{lote.codigo}</p>
          <Badge className="mt-3 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 capitalize">
            {lote.estado}
          </Badge>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6 relative z-20 flex flex-col gap-4">
        {lote.relato_publico && (
          <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <p className="text-sm text-foreground/80 leading-relaxed italic">
                &ldquo;{lote.relato_publico}&rdquo;
              </p>
            </CardContent>
          </Card>
        )}

        {lote.miel_lote && (
          <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Leaf className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Su miel de origen</h2>
              </div>
              <p className="text-sm text-foreground">
                {lote.miel_lote.variedad_floral
                  ? `Miel de ${lote.miel_lote.variedad_floral}`
                  : 'Miel propia'}
                {lote.miel_lote.nombre_lote ? ` · ${lote.miel_lote.nombre_lote}` : ''}
                {lote.miel_lote.kg_total != null ? ` · ${lote.miel_lote.kg_total} kg` : ''}
              </p>
              <a
                href={`/lote/${lote.miel_lote.id}`}
                className="mt-3 inline-block text-xs text-primary font-semibold underline underline-offset-2"
              >
                Ver pasaporte de la miel →
              </a>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-foreground">El lote en números</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-sunken p-4 rounded-xl text-center">
                <p className="text-xs text-muted-foreground mb-1">Alcohol</p>
                <p className="text-2xl font-bold text-foreground">
                  {abv != null ? `${abv.toLocaleString('es-CL', { maximumFractionDigits: 1 })}%` : '—'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">vol</p>
              </div>
              <div className="bg-surface-sunken p-4 rounded-xl text-center">
                <p className="text-xs text-muted-foreground mb-1">Volumen</p>
                <p className="text-2xl font-bold text-foreground">
                  {lote.volumen_litros != null ? `${lote.volumen_litros.toLocaleString('es-CL')} L` : '—'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {lote.n_botellas != null ? `${lote.n_botellas} botellas` : 'lote'}
                </p>
              </div>
              {lote.densidad_inicial != null && (
                <div className="bg-surface-sunken p-4 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground mb-1">Inicio</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">{lote.densidad_inicial}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">gravedad</p>
                </div>
              )}
              {lote.densidad_final != null && (
                <div className="bg-surface-sunken p-4 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground mb-1">Final</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">{lote.densidad_final}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">gravedad</p>
                </div>
              )}
            </div>
            {(lote.levadura_cepa || lote.co2_target_vol != null || lote.temperatura_fermentacion != null) && (
              <div className="mt-4 text-xs text-muted-foreground space-y-1 border-t border-border pt-4">
                {lote.levadura_cepa && (
                  <p>
                    Levadura: <strong className="text-foreground">{lote.levadura_cepa}</strong>
                  </p>
                )}
                {lote.temperatura_fermentacion != null && (
                  <p>
                    Fermentación: <strong className="text-foreground">{lote.temperatura_fermentacion} °C</strong>
                  </p>
                )}
                {lote.co2_target_vol != null && (
                  <p>
                    Espumante: <strong className="text-foreground">{lote.co2_target_vol} vol CO₂</strong>
                    {lote.presion_target_bar != null ? ` · ${lote.presion_target_bar} bar` : ''}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {lote.ingredientes.length > 0 && (
          <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Wine className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Receta</h2>
              </div>
              <ul className="space-y-1.5">
                {lote.ingredientes.map((i) => (
                  <li key={i.id} className="flex items-baseline gap-2 text-sm">
                    <span className="font-medium text-foreground">{i.nombre}</span>
                    {i.cantidad != null && (
                      <span className="text-muted-foreground tabular-nums">
                        {i.cantidad.toLocaleString('es-CL')} {i.unidad ?? ''}
                      </span>
                    )}
                    {i.nota && <span className="text-xs text-muted-foreground">— {i.nota}</span>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {lote.mediciones.some((m) => m.valor != null) && (
          <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <h2 className="text-sm font-bold text-foreground mb-4">Curva del proceso</h2>
              <CurvaMediciones
                mediciones={lote.mediciones.map((m) => ({
                  id: m.id,
                  lote_id: lote.id,
                  tipo: m.tipo,
                  valor: m.valor,
                  unidad: m.unidad,
                  fecha: m.fecha,
                  nota: m.nota,
                  created_at: m.fecha,
                }))}
              />
            </CardContent>
          </Card>
        )}

        {lote.etapas.length > 0 && (
          <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <h2 className="text-sm font-bold text-foreground mb-4">Línea de tiempo</h2>
              <ol className="relative border-l border-border ml-2 space-y-4">
                {lote.etapas.map((et) => (
                  <li key={et.id} className="pl-4 relative">
                    <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground capitalize">{et.nombre}</span>
                      <span className="text-xs text-muted-foreground">{formatFecha(et.fecha)}</span>
                    </div>
                    {et.nota && <p className="text-xs text-muted-foreground mt-0.5">{et.nota}</p>}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {lote.nota_personal != null && (
          <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-6 text-center">
              <p className="text-xs text-muted-foreground mb-1">Nota de cata del maestro</p>
              <p className="text-3xl font-bold text-foreground font-display">
                {lote.nota_personal} <span className="text-base text-muted-foreground font-normal">/ 10</span>
              </p>
            </CardContent>
          </Card>
        )}

        <p className="text-[0.65rem] text-center text-muted-foreground/80 px-2 leading-relaxed">
          Iniciado {formatFecha(lote.fecha_inicio)} · {lote.estado}
        </p>
      </div>

      <div className="mt-12 text-center text-xs text-muted-foreground px-6">
        <p>Trazabilidad de la botella · Red Apícola Territorial</p>
        <p className="mt-1 font-medium">Obrera y Zángano</p>
      </div>
    </div>
  );
}
