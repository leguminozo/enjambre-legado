'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, Badge, Spinner } from '@enjambre/ui';
import {
  Sprout, FlaskConical, Droplets, Droplet, Calendar, MapPin,
  Clock, Thermometer, CheckCircle2, Leaf,
} from 'lucide-react';

interface DestilacionPublica {
  id: string;
  codigo: string;
  metodo: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  carga_kg: number;
  agua_l: number | null;
  duracion_min: number | null;
  temperatura_promedio: number | null;
  rendimiento_hidrolato_ml: number | null;
  rendimiento_aceite_ml: number | null;
  relato_publico: string | null;
  planta: {
    nombre_comun: string;
    nombre_cientifico: string | null;
    parte_usada: string;
    estado_material: string;
    cantidad_kg: number;
    origen: string | null;
    lat: number | null;
    lng: number | null;
    fecha_recoleccion: string | null;
  } | null;
}

const PARTE_LABEL: Record<string, string> = {
  hojas: 'Hojas',
  flores: 'Flores',
  corteza: 'Corteza',
  raices: 'Raíces',
  semillas: 'Semillas',
  frutos: 'Frutos',
  ramas: 'Ramas',
  otra: 'Otra',
};

const METODO_LABEL: Record<string, string> = {
  arrastre_vapor: 'Arrastre de vapor',
  hidrodestilacion: 'Hidrodestilación',
};

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('es-CL') : '—';

export default function AlambiquePublicoPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<DestilacionPublica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDestilacion() {
      try {
        const res = await fetch(`/api/alambique/publico/${id}`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Destilación no encontrada' : 'Error cargando datos');
        }
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchDestilacion();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[var(--vh-full)] bg-background flex flex-col items-center justify-center p-6">
        <Spinner />
        <p className="mt-4 text-sm text-muted-foreground">Verificando trazabilidad…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[var(--vh-full)] bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <FlaskConical className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Destilación no disponible</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">{error || 'El registro escaneado no es público o no existe.'}</p>
      </div>
    );
  }

  const planta = data.planta;

  return (
    <div className="min-h-[var(--vh-full)] bg-surface-sunken pb-12">
      {/* Hero Header */}
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
            Trazabilidad Verificada
          </Badge>
          <h1 className="text-3xl font-bold font-serif leading-tight">
            {planta ? `Destilado de ${planta.nombre_comun}` : 'Destilación Artesanal'}
          </h1>
          <p className="text-primary-foreground/80 mt-2 font-medium">{data.codigo}</p>
          {planta?.nombre_cientifico && (
            <p className="text-primary-foreground/70 mt-1 italic text-sm">{planta.nombre_cientifico}</p>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6 relative z-20 flex flex-col gap-4">
        {/* Materia Prima */}
        <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Sprout className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-foreground">La Materia Prima</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-sunken p-4 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Parte usada</p>
                <p className="text-sm font-semibold text-foreground">{PARTE_LABEL[planta?.parte_usada ?? ''] ?? planta?.parte_usada ?? '—'}</p>
              </div>
              <div className="bg-surface-sunken p-4 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Estado</p>
                <p className="text-sm font-semibold text-foreground capitalize">{planta?.estado_material ?? '—'}</p>
              </div>
              <div className="bg-surface-sunken p-4 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Cantidad</p>
                <p className="text-sm font-semibold text-foreground">{planta ? `${planta.cantidad_kg.toLocaleString('es-CL')} kg` : '—'}</p>
              </div>
              <div className="bg-surface-sunken p-4 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Recolección</p>
                <p className="text-sm font-semibold text-foreground">{fmtDate(planta?.fecha_recoleccion)}</p>
              </div>
            </div>
            {planta?.origen && (
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                <p className="text-sm text-foreground/80">{planta.origen}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* El Proceso */}
        <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <FlaskConical className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-foreground">El Proceso</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-sunken p-4 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Método</p>
                <p className="text-sm font-semibold text-foreground">{METODO_LABEL[data.metodo] ?? data.metodo}</p>
              </div>
              <div className="bg-surface-sunken p-4 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Fecha</p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  <p className="text-sm font-semibold text-foreground">{fmtDate(data.fecha_inicio)}</p>
                </div>
              </div>
              <div className="bg-surface-sunken p-4 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Carga</p>
                <p className="text-sm font-semibold text-foreground">{data.carga_kg.toLocaleString('es-CL')} kg</p>
              </div>
              <div className="bg-surface-sunken p-4 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Agua</p>
                <p className="text-sm font-semibold text-foreground">{data.agua_l != null ? `${data.agua_l} L` : '—'}</p>
              </div>
              <div className="bg-surface-sunken p-4 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Duración</p>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  <p className="text-sm font-semibold text-foreground">{data.duracion_min != null ? `${data.duracion_min} min` : '—'}</p>
                </div>
              </div>
              <div className="bg-surface-sunken p-4 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Temperatura</p>
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-accent" />
                  <p className="text-sm font-semibold text-foreground">{data.temperatura_promedio != null ? `${data.temperatura_promedio} °C` : '—'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rendimientos */}
        <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Droplets className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Rendimientos</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-sunken p-4 rounded-xl text-center">
                <Droplet className="w-5 h-5 mx-auto text-accent mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Hidrolato</p>
                <p className="text-2xl font-bold text-foreground">
                  {data.rendimiento_hidrolato_ml != null ? `${data.rendimiento_hidrolato_ml.toLocaleString('es-CL')} ml` : '—'}
                </p>
              </div>
              <div className="bg-surface-sunken p-4 rounded-xl text-center">
                <Leaf className="w-5 h-5 mx-auto text-primary mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Aceite esencial</p>
                <p className="text-2xl font-bold text-foreground">
                  {data.rendimiento_aceite_ml != null ? `${data.rendimiento_aceite_ml} ml` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relato */}
        {data.relato_publico && (
          <Card className="bg-card shadow-sm border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <p className="text-sm text-foreground/80 leading-relaxed italic">"{data.relato_publico}"</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer Branding */}
      <div className="mt-12 text-center text-xs text-muted-foreground px-6">
        <p>Destilación artesanal con trazabilidad verificada</p>
        <p className="mt-1 font-medium">Obrera y Zángano</p>
      </div>
    </div>
  );
}
