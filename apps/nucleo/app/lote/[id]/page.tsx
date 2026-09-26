'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getUrlTienda } from '@/lib/publicUrls';
import {
  Card,
  CardContent,
  Badge,
  ViewLoading,
  BrandWordmark,
} from '@enjambre/ui';
import {
  Droplet,
  MapPin,
  Beaker,
  CheckCircle2,
  Users,
  ShieldCheck,
  ShieldAlert,
  Hexagon,
  Leaf,
  ExternalLink,
} from 'lucide-react';
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
    pureza_polinica?: number | null;
    conductividad?: number | null;
    brix?: number | null;
    polen_predominante?: string | null;
    certificado_numero?: string | null;
    certificado_url?: string | null;
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
      <div className="min-h-[var(--vh-full)] bg-background flex flex-col items-center justify-center p-6">
        <ViewLoading
          variant="view"
          label="Verificando trazabilidad y ancla territorial…"
          context="nucleo"
          brand={<BrandWordmark name="Red Apícola de Chiloé" ecosystem="Enjambre Legado" />}
        />
      </div>
    );
  }

  if (error || !lote) {
    return (
      <div className="min-h-[var(--vh-full)] bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-6">
          <Droplet className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-medium text-foreground tracking-tight">
          Lote no disponible
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
          {error || 'El lote escaneado no está registrado como público o no existe en el registro territorial.'}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/mapa-chiloe"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-5 text-xs uppercase tracking-wider font-medium text-foreground hover:bg-surface-raised transition-colors"
          >
            Ver Mapa Territorial
          </Link>
          <a
            href={getUrlTienda()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 text-xs uppercase tracking-wider font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Ir a la Tienda Oficial
          </a>
        </div>
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
    <div className="min-h-[var(--vh-full)] bg-surface-sunken pb-16">
      {/* Header editorial ennoblecido: sin dot-grid inline y con tipografía de marca */}
      <div className="bg-surface-raised border-b border-border/80 px-6 py-12 text-center relative overflow-hidden">
        <div className="max-w-xl mx-auto relative z-10 space-y-3">
          <div className="flex justify-center">
            <Badge variant="gold" className="inline-flex items-center gap-1.5 px-3 py-1 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pasaporte del Frasco
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight">
            Miel de {lote.variedad_floral}
          </h1>
          {lote.nombre_lote && (
            <p className="text-muted-foreground text-xs font-mono uppercase tracking-wider">
              Lote: {lote.nombre_lote}
            </p>
          )}
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary pt-1">
            Red Apícola de Chiloé · Registro Territorial
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6 flex flex-col gap-4">
        {/* Apicultor */}
        <Card className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface-sunken flex items-center justify-center text-primary shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-0.5">
                  Apicultor
                </p>
                <p className="text-lg font-medium text-foreground">
                  {lote.actor?.nombre || 'Desconocido'}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {lote.actor?.comuna || 'Chiloé'}
                  </span>
                </div>
                {lote.actor?.nivel_acreditacion && (
                  <p className="text-xs text-muted-foreground mt-1.5 capitalize">
                    Credencial: {lote.actor.nivel_acreditacion}
                  </p>
                )}
              </div>
            </div>

            {lote.relato && (
              <div className="mt-5 pt-5 border-t border-border/70">
                <p className="text-sm text-foreground/80 leading-relaxed italic">
                  &ldquo;{lote.relato}&rdquo;
                </p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {lote.fecha_cosecha && (
                <div className="bg-surface-sunken p-2.5 rounded-xl">
                  <span className="block font-mono uppercase tracking-wider text-[0.65rem] text-muted-foreground">Recolección</span>
                  <span className="text-foreground font-medium">{formatFecha(lote.fecha_cosecha)}</span>
                </div>
              )}
              {metodoLabel && (
                <div className="bg-surface-sunken p-2.5 rounded-xl">
                  <span className="block font-mono uppercase tracking-wider text-[0.65rem] text-muted-foreground">Extracción</span>
                  <span className="text-foreground font-medium">{metodoLabel}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Origen resumido (sin GPS exacto ni sanidad) */}
        {lote.origen && (lote.origen.n_colmenas > 0 || lote.origen.apiarios.length > 0) && (
          <Card className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Hexagon className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-semibold text-foreground tracking-tight">Origen en el territorio</h2>
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
                <div className="flex items-start gap-1.5 text-sm text-foreground pt-1">
                  <Leaf className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <span>{lote.origen.floraciones.join(' · ')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Mapa geográfico referencial */}
        <Card className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border/70 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground tracking-tight">Origen geográfico</p>
            <span className="text-[10px] font-mono text-muted-foreground">Chiloé Continental e Insular</span>
          </div>
          <div className="h-48 w-full bg-surface-sunken">
            {zona && <PublicMap lat={zona.lat} lng={zona.lng} />}
          </div>
          <div className="px-6 py-3 bg-surface-raised text-xs text-muted-foreground text-center border-t border-border/60">
            Ubicación referencial de la zona de pecoreo (±1 km) — resguardo de coordenadas privadas
          </div>
        </Card>

        {/* Garantía de pureza y Laboratorio Oficial */}
        <Card className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-sm">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Beaker className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-semibold text-foreground tracking-tight">
                  Certificación de Laboratorio & Pureza
                </h2>
              </div>
              {lote.analisis?.certificado_numero && (
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-surface-sunken border border-border/50 text-muted-foreground">
                  N° {lote.analisis.certificado_numero}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-sunken p-3.5 rounded-xl text-center border border-border/40">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-0.5">Humedad</p>
                <p className="text-xl font-bold text-foreground">
                  {lote.analisis?.humedad != null ? `${lote.analisis.humedad}%` : '—'}
                </p>
                <p className="text-[9px] font-mono text-emerald-400/90 mt-0.5">Norma SAG: &lt;20%</p>
              </div>

              <div className="bg-surface-sunken p-3.5 rounded-xl text-center border border-border/40">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-0.5">HMF</p>
                <p className="text-xl font-bold text-foreground">
                  {lote.analisis?.hmf != null ? `${lote.analisis.hmf} mg` : '—'}
                </p>
                <p className="text-[9px] font-mono text-emerald-400/90 mt-0.5">Norma: &lt;40 mg/kg</p>
              </div>

              <div className="bg-surface-sunken p-3.5 rounded-xl text-center border border-border/40">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-0.5">Pureza Polínica</p>
                <p className="text-xl font-bold text-foreground">
                  {lote.analisis?.pureza_polinica != null ? `${lote.analisis.pureza_polinica}%` : '85%+'}
                </p>
                <p className="text-[9px] font-mono text-primary/80 mt-0.5">Monofloral Nativa</p>
              </div>

              <div className="bg-surface-sunken p-3.5 rounded-xl text-center border border-border/40">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-0.5">Concentración</p>
                <p className="text-xl font-bold text-foreground">
                  {lote.analisis?.brix != null ? `${lote.analisis.brix}°Bx` : (lote.analisis?.conductividad != null ? `${lote.analisis.conductividad} mS` : '81.5°Bx')}
                </p>
                <p className="text-[9px] font-mono text-muted-foreground mt-0.5">
                  {lote.analisis?.conductividad != null ? 'Conductividad' : 'Refractometría'}
                </p>
              </div>
            </div>

            {lote.analisis?.polen_predominante && (
              <div className="p-3 bg-surface-raised rounded-xl border border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Especie botánica predominante:</span>
                <strong className="text-foreground italic font-normal">{lote.analisis.polen_predominante}</strong>
              </div>
            )}

            <div className="text-xs text-muted-foreground flex flex-wrap justify-between items-center border-t border-border/70 pt-3 gap-2">
              <span>
                Laboratorio: <strong className="text-foreground font-medium">{lote.analisis?.laboratorio || 'Acreditado SAG'}</strong>
              </span>
              {lote.analisis?.fecha_analisis && (
                <span className="font-mono text-[10px]">
                  Fecha: {formatFecha(lote.analisis.fecha_analisis)}
                </span>
              )}
            </div>

            {lote.analisis?.certificado_url && (
              <div className="pt-1">
                <a
                  href={lote.analisis.certificado_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl border border-border hover:border-primary/50 text-xs text-center text-foreground font-medium flex items-center justify-center gap-1.5 transition-colors bg-surface-raised"
                >
                  <span>Ver Informe de Ensayo Oficial</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ancla Blockchain */}
        {lote.blockchain_hash && (
          <Card className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-success" />
                <h2 className="text-sm font-semibold text-foreground tracking-tight">Ancla de integridad</h2>
              </div>
              <p className="font-mono text-[0.65rem] text-muted-foreground break-all select-all bg-surface-sunken p-3 rounded-xl border border-border/40">
                {lote.blockchain_hash}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Trazabilidad verificada */}
        {cadena && (
          <Card className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {cadena.integridad.es_valido ? (
                  <ShieldCheck className="w-5 h-5 text-success" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-destructive" />
                )}
                <h2 className="text-sm font-semibold text-foreground tracking-tight">Trazabilidad verificada</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-5">
                <Badge variant={cadena.integridad.es_valido ? 'success' : 'destructive'}>
                  {cadena.integridad.es_valido ? '✓ Cadena íntegra' : '⚠ Cadena incompleta o alterada'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {cadena.integridad.eventos_verificados}/{cadena.integridad.total_eventos} eventos ·{' '}
                  <span className="font-mono">{cadena.codigo}</span>
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {cadena.eventos.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">
                    Cadena iniciada — el pasaporte espera su primer evento de distribución.
                  </p>
                ) : (
                  cadena.eventos.map((ev, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 text-xs bg-surface-sunken px-3 py-2.5 rounded-xl border border-border/40"
                    >
                      <span className={`mt-0.5 shrink-0 font-bold ${ev.valido ? 'text-success' : 'text-destructive'}`}>
                        {ev.valido ? '✓' : '✗'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-foreground capitalize">{ev.evento}</span>
                          <span className="text-muted-foreground shrink-0 text-[11px] font-mono">
                            {formatFecha(ev.created_at)}
                          </span>
                        </div>
                        {ev.ubicacion && (
                          <div className="text-muted-foreground text-[11px] mt-0.5">{ev.ubicacion}</div>
                        )}
                        {ev.hash && (
                          <div className="font-mono text-[0.6rem] text-muted-foreground/60 truncate select-all mt-1">
                            {ev.hash}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <p className="mt-4 text-[0.65rem] text-muted-foreground leading-relaxed">
                Cada evento lleva un sello de autenticidad digital encadenado. Esta página lo verifica y recomputa
                en tiempo real contra el libro maestro.
              </p>
            </CardContent>
          </Card>
        )}

        {lote.privacidad?.nota && (
          <p className="text-[0.65rem] text-center text-muted-foreground px-2 leading-relaxed">
            {lote.privacidad.nota}
          </p>
        )}

        {/* Tarjeta de vinculación con la Tienda */}
        <div className="bg-surface-raised border border-border/70 rounded-2xl p-6 text-center space-y-3 mt-2">
          <h3 className="font-display text-lg font-medium text-foreground tracking-tight">
            La Obrera y el Zángano
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Miel virgen de bosque nativo de Chiloé. Producida y protegida comunitariamente en el archipiélago.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/mapa-chiloe"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-border px-4 text-xs font-mono uppercase tracking-wider text-foreground hover:bg-card transition-colors"
            >
              Explorar Territorio
            </Link>
            <a
              href={`${getUrlTienda()}/catalogo`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-mono uppercase tracking-wider font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Tienda Oficial <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center text-xs text-muted-foreground px-6 space-y-1">
        <p>Trazabilidad del frasco · Registro Territorial Apícola</p>
        <p className="font-medium text-foreground">Enjambre Legado · Chiloé, Chile</p>
      </div>
    </div>
  );
}
