'use client';

import { useEffect, useState } from 'react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Button, Spinner, toast } from '@enjambre/ui';
import { Printer } from 'lucide-react';

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
      </div>

      {/* Documento A4. Colores slate explícitos (no tokens semánticos): el
          documento imprime en papel blanco y los tokens del tema dark (bg-background
          claro-foreground invertidos) producirían tinta negra/borroso al imprimir. */}
      <div className="sag-document bg-white text-slate-900 shadow-sm border border-border rounded-lg p-8 sm:p-12 max-w-[800px] mx-auto w-full">
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              Registro Territorial Apícola de Chiloé
            </p>
            <h2 className="text-xl font-bold mt-1">Declaración Anual de Actividad Apícola</h2>
            <p className="text-xs text-slate-600 mt-1">
              Pre-llenada desde el registro territorial · Res. Exenta SAG 8.196/2015
            </p>
          </div>
          <p className="text-xs text-slate-500 text-right">
            Generada: {new Date(data.generado_at).toLocaleDateString('es-CL')}
            <br />
            Período censo: 2026–2027
          </p>
        </div>

        {/* Datos del actor */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 py-6 text-sm border-b border-slate-200">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Apicultor/a</p>
            <p className="font-medium">{actor.nombre_actor}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">RUT</p>
            <p className="font-medium">{actor.rut ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">RUP (SAG)</p>
            <p className="font-medium">{actor.rup ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Teléfono</p>
            <p className="font-medium">{actor.telefono ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Comuna / Región</p>
            <p className="font-medium">{actor.comuna}{actor.region ? ` · ${actor.region}` : ''}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Rol declarado</p>
            <p className="font-medium">{actor.rol}</p>
          </div>
        </div>

        {/* Apiarios */}
        <div className="py-6">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3">
            Apiarios propios ({apiarios.length} · {totalColmenas} colmenas)
          </h3>
          {apiarios.length === 0 ? (
            <p className="text-sm text-slate-500">Sin apiarios declarados.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-2">Comuna</th>
                  <th className="py-2 pr-2">Zona</th>
                  <th className="py-2 pr-2">Nombre</th>
                  <th className="py-2 pr-2">Categoría</th>
                  <th className="py-2 text-right">Colmenas</th>
                </tr>
              </thead>
              <tbody>
                {apiarios.map((a, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 pr-2">{a.comuna}</td>
                    <td className="py-2 pr-2">{a.zona}</td>
                    <td className="py-2 pr-2">{a.nombre ?? '—'}</td>
                    <td className="py-2 pr-2">{CATEGORIA_LABELS[a.categoria] ?? a.categoria}</td>
                    <td className="py-2 text-right">{a.n_colmenas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Trashumancia */}
        <div className="py-6 border-t border-slate-200">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3">
            Movimientos trashumantes ({trashumancia.length})
          </h3>
          {trashumancia.length === 0 ? (
            <p className="text-sm text-slate-500">Sin movimientos trashumantes declarados.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-2">Origen</th>
                  <th className="py-2 pr-2">Destino</th>
                  <th className="py-2 pr-2">Ingreso</th>
                  <th className="py-2 pr-2">Estado</th>
                  <th className="py-2 pr-2">Distancia</th>
                  <th className="py-2 text-right">Colmenas</th>
                </tr>
              </thead>
              <tbody>
                {trashumancia.map((t, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 pr-2">{t.comuna_origen}</td>
                    <td className="py-2 pr-2">{t.comuna_destino} ({t.zona_destino})</td>
                    <td className="py-2 pr-2">{new Date(t.fecha_ingreso).toLocaleDateString('es-CL')}</td>
                    <td className="py-2 pr-2">{t.estado}</td>
                    <td className="py-2 pr-2">
                      {t.distancia_km_menor != null && t.distancia_minima_km != null
                        ? `${t.distancia_km_menor} km vs mín. ${t.distancia_minima_km} km`
                        : '—'}
                    </td>
                    <td className="py-2 text-right">{t.n_colmenas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="pt-8 border-t border-slate-200 text-[11px] text-slate-500 space-y-2">
          <p>
            Declaro bajo mi responsabilidad que la información contenida es fiel a mi actividad apícola
            declarada en el Registro Territorial. Este documento es un pre-llenado de apoyo a la declaración
            anual ante el SAG (Res. Exenta 8.196/2015); la plataforma traza el relato y no certifica
            inocuidad ni cumplimiento sanitario.
          </p>
          <div className="flex justify-between items-end pt-10">
            <div>
              <p className="border-t border-slate-400 pt-1 pr-16">Firma</p>
            </div>
            <div>
              <p className="border-t border-slate-400 pt-1 pr-16">Fecha</p>
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
            margin: 18mm;
          }
        }
      `}</style>
    </div>
  );
}
