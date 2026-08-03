'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, Spinner } from '@enjambre/ui';
import { Droplet, MapPin, Beaker, CheckCircle2, Users, ShieldCheck, ShieldAlert } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for Leaflet map to avoid SSR issues
const PublicMap = dynamic(
  () => import('./PublicMap').then((mod) => mod.PublicMap),
  { ssr: false, loading: () => <div className="h-48 flex items-center justify-center bg-surface-sunken rounded-xl animate-pulse"><MapPin className="w-6 h-6 text-muted-foreground opacity-50" /></div> }
);

interface LotePublico {
  id: string;
  variedad_floral: string;
  metodo_extraccion: string;
  analisis: {
    humedad: number;
    hmf: number;
    laboratorio: string;
    fecha_analisis: string;
  };
  relato: string;
  fecha_cosecha: string;
  actor: {
    nombre: string;
    comuna: string;
    nivel_acreditacion: string;
    zona: {
      lat: number;
      lng: number;
    };
  } | null;
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

  // Cadena de custodia verificable: historial + hash recomputado vs almacenado
  useEffect(() => {
    if (!id) return;
    fetch(`/api/trazabilidad/lote/${id}/qr`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setCadena(json?.data ?? null))
      .catch(() => setCadena(null));
  }, [id]);

  const formatFecha = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
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
    
    if (id) fetchLote();
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
        <p className="text-muted-foreground mt-2 max-w-sm">{error || 'El lote escaneado no es público o no existe.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-sunken pb-12">
      {/* Hero Header */}
      <div className="bg-primary px-6 py-12 text-primary-foreground text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="relative z-10">
          <Badge className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 mb-4 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Trazabilidad Verificada
          </Badge>
          <h1 className="text-3xl font-bold font-serif leading-tight">Miel de {lote.variedad_floral}</h1>
          <p className="text-primary-foreground/80 mt-2 font-medium">Red Apícola de Chiloé</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6 relative z-20 flex flex-col gap-4">
        
        {/* Info del Productor */}
        <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Apicultor</p>
                <p className="text-lg font-bold text-foreground">{lote.actor?.nombre || 'Desconocido'}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  <span className="text-sm text-muted-foreground">{lote.actor?.comuna || 'Chiloé'}</span>
                </div>
              </div>
            </div>
            
            {lote.relato && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-foreground/80 leading-relaxed italic">"{lote.relato}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mapa de Zona */}
        <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
             <p className="text-sm font-bold text-foreground">Origen Geográfico</p>
          </div>
          <div className="h-48 w-full bg-surface-sunken">
             {lote.actor?.zona && (
               <PublicMap lat={lote.actor.zona.lat} lng={lote.actor.zona.lng} />
             )}
          </div>
          <div className="px-6 py-3 bg-surface-raised text-xs text-muted-foreground text-center">
            Ubicación referencial de la zona de pecoreo (±1km)
          </div>
        </Card>

        {/* Pureza y Laboratorio */}
        <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Beaker className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Garantía de Pureza</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-sunken p-4 rounded-xl text-center">
                <p className="text-xs text-muted-foreground mb-1">Humedad</p>
                <p className="text-2xl font-bold text-foreground">{lote.analisis?.humedad ? `${lote.analisis.humedad}%` : '--'}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Norma: &lt;20%</p>
              </div>
              <div className="bg-surface-sunken p-4 rounded-xl text-center">
                <p className="text-xs text-muted-foreground mb-1">HMF</p>
                <p className="text-2xl font-bold text-foreground">{lote.analisis?.hmf ? lote.analisis.hmf : '--'}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Norma: &lt;40 mg/kg</p>
              </div>
            </div>
            
            <div className="mt-6 text-xs text-muted-foreground flex justify-between items-center border-t border-border pt-4">
              <span>Lab: <strong>{lote.analisis?.laboratorio || 'N/A'}</strong></span>
              <span>Lote ID: {id.split('-')[0]}</span>
            </div>
          </CardContent>
        </Card>

        {/* Cadena de Custodia Verificable */}
        {cadena && (
          <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {cadena.integridad.es_valido ? (
                  <ShieldCheck className="w-5 h-5 text-success" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-destructive" />
                )}
                <h2 className="text-sm font-bold text-foreground">Cadena de Custodia</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-5">
                {cadena.integridad.es_valido ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
                    ✓ Cadena íntegra
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/30">
                    ⚠ Cadena manipulada
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {cadena.integridad.eventos_verificados}/{cadena.integridad.total_eventos} eventos verificados · código{' '}
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
                    <div key={i} className="flex items-start gap-3 text-xs bg-surface-sunken px-3 py-2 rounded-lg">
                      <span className="mt-0.5 shrink-0">{ev.valido ? '✓' : '✗'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-foreground capitalize">{ev.evento}</span>
                          <span className="text-muted-foreground shrink-0">{formatFecha(ev.created_at)}</span>
                        </div>
                        {ev.ubicacion && <div className="text-muted-foreground">{ev.ubicacion}</div>}
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
                Cada evento de la cadena lleva un hash SHA-256 encadenado. Esta página lo recomputa y lo
                compara con el almacenado: si alguien altera un eslabón, el sello se rompe.
              </p>
            </CardContent>
          </Card>
        )}

      </div>
      
      {/* Footer Branding */}
      <div className="mt-12 text-center text-xs text-muted-foreground px-6">
        <p>Trazabilidad certificada por la Red Apícola Territorial</p>
        <p className="mt-1 font-medium">Obrera y Zángano</p>
      </div>
    </div>
  );
}

// Badge mock helper since we didn't import Badge from ui
function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${className || ''}`}>{children}</span>;
}
