'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, Spinner } from '@enjambre/ui';
import { Droplet, MapPin, Beaker, CheckCircle2, Users, ShieldCheck, ShieldAlert, Hexagon, Leaf } from 'lucide-react';
import dynamic from 'next/dynamic';

const PublicMap = dynamic(
  () => import('./PublicMap').then((mod) => mod.PublicMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 flex items-center justify-center bg-surface-sunken rounded-xl animate-pulse">
        <MapPin className="w-6 h-6 text-muted-foreground opacity-50" />
      </div>
    ),
  },
);

interface LotePublico {
  id: string;
  nombre_lote: string | null;
  variedad_floral: string;
  metodo_extraccion: string | null;
  analisis: {
    humedad: number | null;
    hmf: number | null;
    laboratorio: string | null;
    fecha_analisis: string | null;
  };
  relato: string | null;
  fecha_cosecha: string | null;
  fecha_envasado: string | null;
  blockchain_hash: string | null;
  actor: {
    nombre: string;
    comuna: string;
    nivel_acreditacion: string | null;
    zona: {
      lat: number;
      lng: number;
      precision?: string;
      source?: string;
    };
  } | null;
  origen?: {
    apiarios: string[];
    colmenas: string[];
    floraciones: string[];
    fecha_recoleccion: string | null;
    n_colmenas: number;
  };
  privacidad?: {
    nivel: string;
    nota: string;
  };
}

export default function LotePublicoPage() {
  const params = useParams();
  const id = params.id as string;

  const [lote, setLote] = useState<LotePublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cadena, setCadena] = useState<{
    codigo: string;
    integridad: { es_valido: boolean; eventos_verificados: number; total_eventos: number };
    eventos: Array<{
      evento: string;
      ubicacion: string | null;
      created_at: string | null;
      valido: boolean;
      hash: string | null;
    }>;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/trazabilidad/lote/${id}/qr`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setCadena(json?.data ?? null))
      .catch(() => setCadena(null));
  }, [id]);

  const formatFecha = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString('es-CL', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: iso.includes('T') ? '2-digit' : undefined,
          minute: iso.includes('T') ? '2-digit' : undefined,
        })
      : '—';

  useEffect(() => {
    async function fetchLote() {
      try {
        const res = await fetch(`/api/lotes-publicos/${id}`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Lote no encontrado' : 'Error cargando datos');
        }
        const data = await res.json();
        setLote(data.data);
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Spinner />
        <p className="mt-4 text-sm text-muted-foreground">Verificando trazabilidad...</p>
      </div>
    );
  }

  if (error || !lote) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
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

  const zona = lote.actor?.zona;
  const metodoLabel =
    lote.metodo_extraccion === 'centrifugo'
      ? 'Centrifugado'
      : lote.metodo_extraccion === 'manual'
        ? 'Manual'
        : lote.metodo_extraccion === 'prensado'
          ? 'Prensado'
          : lote.metodo_extraccion || null;

  return (
    <div className="min-h-screen bg-surface-sunken pb-12">
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
            Pasaporte del frasco
          </Badge>
          <h1 className="text-3xl font-bold font-serif leading-tight">
            Miel de {lote.variedad_floral}
          </h1>
          {lote.nombre_lote && (
            <p className="text-primary-foreground/70 mt-1 text-sm font-mono">{lote.nombre_lote}</p>
          )}
          <p className="text-primary-foreground/80 mt-2 font-medium">Red Apícola de Chiloé</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6 relative z-20 flex flex-col gap-4">
        <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                  Apicultor
                </p>
                <p className="text-lg font-bold text-foreground">
                  {lote.actor?.nombre || 'Desconocido'}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  <span className="text-sm text-muted-foreground">
                    {lote.actor?.comuna || 'Chiloé'}
                  </span>
                </div>
                {lote.actor?.nivel_acreditacion && (
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    Credencial: {lote.actor.nivel_acreditacion}
                  </p>
                )}
              </div>
            </div>

            {lote.relato && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-foreground/80 leading-relaxed italic">
                  &ldquo;{lote.relato}&rdquo;
                </p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {lote.fecha_cosecha && (
                <div>
                  <span className="block uppercase tracking-wider text-[0.65rem]">Cosecha</span>
                  <span className="text-foreground font-medium">{formatFecha(lote.fecha_cosecha)}</span>
                </div>
              )}
              {metodoLabel && (
                <div>
                  <span className="block uppercase tracking-wider text-[0.65rem]">Extracción</span>
                  <span className="text-foreground font-medium">{metodoLabel}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Origen resumido (sin GPS exacto ni sanidad) */}
        {lote.origen && (lote.origen.n_colmenas > 0 || lote.origen.apiarios.length > 0) && (
          <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Hexagon className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Origen en el territorio</h2>
              </div>
              {lote.origen.apiarios.length > 0 && (
                <p className="text-sm text-foreground mb-2">
                  <span className="text-muted-foreground">Apiario(s): </span>
                  {lote.origen.apiarios.join(', ')}
                </p>
              )}
              {lote.origen.colmenas.length > 0 && (
                <p className="text-sm text-foreground mb-2">
                  <span className="text-muted-foreground">
                    Colmena{lote.origen.n_colmenas === 1 ? '' : 's'} ({lote.origen.n_colmenas}):{' '}
                  </span>
                  {lote.origen.colmenas.join(', ')}
                </p>
              )}
              {lote.origen.floraciones.length > 0 && (
                <div className="flex items-start gap-1.5 text-sm text-foreground">
                  <Leaf className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                  <span>{lote.origen.floraciones.join(' · ')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <p className="text-sm font-bold text-foreground">Origen geográfico</p>
          </div>
          <div className="h-48 w-full bg-surface-sunken">
            {zona && <PublicMap lat={zona.lat} lng={zona.lng} />}
          </div>
          <div className="px-6 py-3 bg-surface-raised text-xs text-muted-foreground text-center">
            Ubicación referencial de la zona de pecoreo (±1 km) — no es el patio exacto
          </div>
        </Card>

        <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Beaker className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Garantía de pureza</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-sunken p-4 rounded-xl text-center">
                <p className="text-xs text-muted-foreground mb-1">Humedad</p>
                <p className="text-2xl font-bold text-foreground">
                  {lote.analisis?.humedad != null ? `${lote.analisis.humedad}%` : '—'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Norma: &lt;20%</p>
              </div>
              <div className="bg-surface-sunken p-4 rounded-xl text-center">
                <p className="text-xs text-muted-foreground mb-1">HMF</p>
                <p className="text-2xl font-bold text-foreground">
                  {lote.analisis?.hmf != null ? lote.analisis.hmf : '—'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Norma: &lt;40 mg/kg</p>
              </div>
            </div>

            <div className="mt-6 text-xs text-muted-foreground flex justify-between items-center border-t border-border pt-4 gap-2">
              <span>
                Lab: <strong>{lote.analisis?.laboratorio || 'N/A'}</strong>
              </span>
              <span className="font-mono shrink-0">Lote {id.split('-')[0]}</span>
            </div>
            {lote.analisis?.fecha_analisis && (
              <p className="text-[0.65rem] text-muted-foreground mt-2">
                Análisis: {formatFecha(lote.analisis.fecha_analisis)}
              </p>
            )}
          </CardContent>
        </Card>

        {lote.blockchain_hash && (
          <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-success" />
                <h2 className="text-sm font-bold text-foreground">Ancla de integridad</h2>
              </div>
              <p className="font-mono text-[0.65rem] text-muted-foreground break-all select-all">
                {lote.blockchain_hash}
              </p>
            </CardContent>
          </Card>
        )}

        {cadena && (
          <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {cadena.integridad.es_valido ? (
                  <ShieldCheck className="w-5 h-5 text-success" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-destructive" />
                )}
                <h2 className="text-sm font-bold text-foreground">Cadena de custodia</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-5">
                {cadena.integridad.es_valido ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
                    ✓ Cadena íntegra
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/30">
                    ⚠ Cadena incompleta o alterada
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {cadena.integridad.eventos_verificados}/{cadena.integridad.total_eventos} eventos ·{' '}
                  <span className="font-mono">{cadena.codigo}</span>
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {cadena.eventos.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Cadena vacía — el pasaporte espera su primer evento.
                  </p>
                ) : (
                  cadena.eventos.map((ev, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 text-xs bg-surface-sunken px-3 py-2 rounded-lg"
                    >
                      <span className="mt-0.5 shrink-0">{ev.valido ? '✓' : '✗'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-foreground capitalize">{ev.evento}</span>
                          <span className="text-muted-foreground shrink-0">
                            {formatFecha(ev.created_at)}
                          </span>
                        </div>
                        {ev.ubicacion && (
                          <div className="text-muted-foreground">{ev.ubicacion}</div>
                        )}
                        {ev.hash && (
                          <div className="font-mono text-[0.6rem] text-muted-foreground/60 truncate select-all">
                            {ev.hash}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <p className="mt-4 text-[0.65rem] text-muted-foreground/70 leading-relaxed">
                Cada evento lleva un hash SHA-256 encadenado. Esta página lo recomputa y lo compara
                con el almacenado.
              </p>
            </CardContent>
          </Card>
        )}

        {lote.privacidad?.nota && (
          <p className="text-[0.65rem] text-center text-muted-foreground/80 px-2 leading-relaxed">
            {lote.privacidad.nota}
          </p>
        )}
      </div>

      <div className="mt-12 text-center text-xs text-muted-foreground px-6">
        <p>Trazabilidad del frasco · Red Apícola Territorial</p>
        <p className="mt-1 font-medium">Obrera y Zángano</p>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${className || ''}`}>
      {children}
    </span>
  );
}
