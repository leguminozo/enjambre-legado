'use client';

import { useEffect, useState } from 'react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Button, Spinner, toast } from '@enjambre/ui';
import { Printer, CheckCircle2 } from 'lucide-react';

interface ActorSag {
  id: string;
  rol: string;
  nombre_actor: string;
  rut?: string | null;
  rup?: string | null;
  telefono?: string | null;
  comuna: string;
  region?: string | null;
  nivel_acreditacion?: string;
  estado: string;
}

interface ApiarioSag {
  nombre?: string | null;
  comuna: string;
  zona: string;
  n_colmenas: number;
  /** Conteo vivo desde la herramienta de colmenas (null si no hay cruce). */
  n_colmenas_vivo?: number | null;
  categoria: string;
  lat_aproximada?: number | null;
  lng_aproximada?: number | null;
}

interface TrashumanteSag {
  nombre?: string | null;
  n_colmenas: number;
  comuna_origen: string;
  comuna_destino: string;
  zona_destino: string;
  fecha_ingreso: string;
  fecha_salida?: string | null;
  estado: string;
  distancia_verificada?: boolean | null;
  distancia_minima_km?: number | null;
  distancia_km_menor?: number | null;
}

interface SagData {
  actor: ActorSag;
  apiarios: ApiarioSag[];
  trashumancia: TrashumanteSag[];
  generado_at: string;
}

const CATEGORIA_LABELS: Record<string, string> = {
  produccion: 'Producción',
  polinizacion: 'Polinización',
  seleccion_cria: 'Selección y cría',
  otro: 'Otro',
};

/**
 * Declaración SAG pre-llenada (Res. Exenta 8.196/2015) — documento imprimible
 * A4 (Ctrl+P / guardar como PDF). El actor la revisa y firma; la plataforma
 * traza el relato, no certifica.
 */
export function DeclaracionSagView() {
  const apiFetch = useApiFetch();
  const [data, setData] = useState<SagData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        let actorId: string | null = new URLSearchParams(window.location.search).get('actor_id');
        if (!actorId) {
          const resMe = await apiFetch('/api/registro-territorial/actores/me');
          if (!resMe.ok) throw new Error('Debes estar inscrito en el Registro Territorial');
          const jsonMe = await resMe.json();
          actorId = jsonMe?.data?.id ?? null;
        }
        if (!actorId) throw new Error('Debes estar inscrito en el Registro Territorial');

        const res = await apiFetch(`/api/registro-territorial/declaracion-sag?actor_id=${actorId}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Error generando la declaración');
        }
        const json = await res.json();
        if (!cancelled) setData(json.data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error generando la declaración');
          toast.error(e instanceof Error ? e.message : 'Error generando la declaración');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  // Histórico: la presentación queda registrada (antes el PDF era desechable).
  const registrarPresentacion = async () => {
    if (!data?.actor) return;
    const actor = data.actor as { id?: string };
    if (!actor.id) return;
    setRegistrando(true);
    try {
      const res = await apiFetch('/api/registro-territorial/declaraciones-sag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor_id: actor.id,
          periodo: new Date().toISOString().slice(0, 7),
          n_colmenas_declaradas: apiarios.reduce((sum, a) => sum + a.n_colmenas, 0),
          n_colmenas_vivas: apiarios.reduce(
            (sum, a) => sum + (typeof a.n_colmenas_vivo === 'number' ? a.n_colmenas_vivo : 0),
            0,
          ),
          estado: 'presentada',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error registrando la declaración');
      }
      toast.success('Declaración SAG registrada en tu historial');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error registrando la declaración');
    } finally {
      setRegistrando(false);
    }
  };

  if (error) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center p-16">
        <Spinner />
      </div>
    );
  }

  const { actor, apiarios, trashumancia } = data;
  const totalColmenas = apiarios.reduce((sum, a) => sum + a.n_colmenas, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Declaración SAG pre-llenada</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Res. Exenta 8.196/2015 — registro anual de apicultores y apiarios. Revisa, completa y firma.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Imprimir / Guardar PDF
        </Button>
        <Button size="sm" onClick={() => void registrarPresentacion()} disabled={registrando}>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {registrando ? 'Registrando…' : 'Registrar presentación'}
        </Button>
      </div>

      {/* Documento A4. Colores slate explícitos (no tokens semánticos): el
          documento imprime en papel blanco y los tokens del tema dark (bg-background
          claro-foreground invertidos) producirían tinta negra/borroso al imprimir. */}
      <div className="sag-document bg-white text-slate-900 shadow-sm border border-border rounded-lg p-8 sm:p-12 max-w-[800px] mx-auto w-full">
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
              República de Chile · Registro Territorial Apícola de Chiloé
            </p>
            <h2 className="text-xl font-bold mt-1 tracking-tight">Declaración Anual de Actividad Apícola</h2>
            <p className="text-xs text-slate-600 mt-1">
              Borrador pre-llenado de apoyo · Res. Exenta SAG N° 8.196/2015 · Ley N° 21.489
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 space-y-0.5 font-mono">
            <p>Emisión: {new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.generado_at))}</p>
            <p>Período Censo: 2026–2027</p>
            <p className="text-[10px] text-slate-400">ID: {actor.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Datos del actor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 py-6 text-sm border-b border-slate-200">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Apicultor/a o Razón Social</p>
            <p className="font-semibold text-slate-900">{actor.nombre_actor}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">RUT</p>
            <p className="font-semibold text-slate-900">{actor.rut ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Rol Único Pecuario (RUP SAG)</p>
            <p className="font-semibold text-slate-900">{actor.rup ?? 'En trámite / No informado'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Teléfono / Contacto</p>
            <p className="font-semibold text-slate-900">{actor.telefono ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Comuna Base / Región</p>
            <p className="font-semibold text-slate-900">{actor.comuna}{actor.region ? ` · ${actor.region}` : ' · Región de Los Lagos'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Categoría Territorial</p>
            <p className="font-semibold text-slate-900 capitalize">{actor.rol.replace(/_/g, ' ')}</p>
          </div>
        </div>

        {/* Apiarios */}
        <div className="py-6">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-800">
            1. Apiarios Propios ({apiarios.length} declarados · {totalColmenas.toLocaleString('es-CL')} colmenas totales)
          </h3>
          {apiarios.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Sin apiarios declarados a la fecha de emisión.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-slate-300 text-left text-[10px] uppercase tracking-wider text-slate-600">
                  <th className="py-2 pr-2">Comuna</th>
                  <th className="py-2 pr-2">Sector / Zona</th>
                  <th className="py-2 pr-2">Identificación Apiario</th>
                  <th className="py-2 pr-2">Destino / Categoría</th>
                  <th className="py-2 text-right">N° Colmenas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apiarios.map((a, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-2 font-medium">{a.comuna}</td>
                    <td className="py-2 pr-2">{a.zona}</td>
                    <td className="py-2 pr-2">{a.nombre ?? 'Apiario Principal'}</td>
                    <td className="py-2 pr-2">{CATEGORIA_LABELS[a.categoria] ?? a.categoria}</td>
                    <td className="py-2 text-right font-semibold tabular-nums">
                      {a.n_colmenas.toLocaleString('es-CL')}
                      {a.n_colmenas_vivo != null && a.n_colmenas_vivo !== a.n_colmenas && (
                        <span className="block text-[10px] font-normal text-slate-500">
                          vivo: {a.n_colmenas_vivo.toLocaleString('es-CL')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Trashumancia */}
        <div className="py-6 border-t border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-800">
            2. Movimientos de Trashumancia Registrados ({trashumancia.length})
          </h3>
          {trashumancia.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Sin movimientos trashumantes registrados en el período.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-slate-300 text-left text-[10px] uppercase tracking-wider text-slate-600">
                  <th className="py-2 pr-2">Comuna Origen</th>
                  <th className="py-2 pr-2">Comuna Destino</th>
                  <th className="py-2 pr-2">Fecha Ingreso</th>
                  <th className="py-2 pr-2">Estado</th>
                  <th className="py-2 pr-2">Distancia Vecina</th>
                  <th className="py-2 text-right">Colmenas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trashumancia.map((t, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-2">{t.comuna_origen}</td>
                    <td className="py-2 pr-2">{t.comuna_destino} ({t.zona_destino})</td>
                    <td className="py-2 pr-2">{new Date(t.fecha_ingreso).toLocaleDateString('es-CL')}</td>
                    <td className="py-2 pr-2 capitalize">{t.estado}</td>
                    <td className="py-2 pr-2">
                      {t.distancia_km_menor != null && t.distancia_minima_km != null
                        ? `${t.distancia_km_menor} km (mín. ${t.distancia_minima_km} km)`
                        : 'Verificada'}
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums">{t.n_colmenas.toLocaleString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Declaración de Responsabilidad y Firmas */}
        <div className="pt-8 border-t-2 border-slate-300 text-[11px] text-slate-600 space-y-3">
          <p className="leading-relaxed text-justify">
            <strong>DECLARACIÓN JURADA SIMPLE:</strong> Declaro bajo mi responsabilidad que la información individualizada en este documento es fiel y fidedigna respecto de la existencia, ubicación aproximada y manejo de mis colmenares en el archipiélago de Chiloé. Este documento constituye un borrador técnico generado desde el Registro Territorial Apícola de Chiloé para facilitar la Declaración Anual de Existencias ante el Servicio Agrícola y Ganadero (SAG) conforme a la Res. Exenta N° 8.196/2015 y la Ley N° 21.489.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 pt-10 text-center text-xs">
            <div className="border-t border-slate-500 pt-2 space-y-1">
              <p className="font-bold text-slate-900">FIRMA DEL DECLARANTE</p>
              <p className="text-[10px] text-slate-500">RUT: {actor.rut ?? '____________________'}</p>
            </div>
            <div className="border border-dashed border-slate-400 p-3 rounded text-[10px] text-slate-400 flex flex-col items-center justify-center min-h-[70px]">
              <span>TIMBRE / RECEPCIÓN OFICINA</span>
              <span>(SAG / MESA APÍCOLA MUNICIPAL)</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .sag-document,
          .sag-document * {
            visibility: visible;
          }
          .sag-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none;
            border: none;
            border-radius: 0;
            max-width: none;
          }
          @page {
            margin: 15mm;
            size: A4 portrait;
          }
        }
      `}</style>
    </div>
  );
}
