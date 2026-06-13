import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface SugerenciaConciliacion {
  movimiento_id: string;
  venta_id: string;
  confianza: 'alta' | 'media' | 'baja';
  monto_iguales: boolean;
  fecha_cercana: boolean;
  rut_coincide: boolean;
  puntaje: number;
  movimiento?: {
    descripcion: string;
    monto: number;
    fecha_contable: string;
  };
  venta?: {
    numero: string;
    monto_total: number;
    created_at: string;
  };
}

export function ConciliacionView() {
  const [sugerencias, setSugerencias] = useState<SugerenciaConciliacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoConciliando, setAutoConciliando] = useState(false);
  const apiFetch = useApiFetch();

  useEffect(() => {
    if (!supabase) return;
    fetchSugerencias();
  }, []);

  async function fetchSugerencias() {
    try {
      const response = await apiFetch('/api/banco-chile/conciliacion-auto/sugerencias');
      const result = await response.json();
      setSugerencias(result.sugerencias || []);
    } catch (error) {
      console.error('Error fetching sugerencias:', error);
    } finally {
      setLoading(false);
    }
  }

  async function conciliarManualmente(sugerencia: SugerenciaConciliacion) {
    try {
      const response = await apiFetch('/api/banco-chile/conciliacion-auto/conciliar', {
        method: 'POST',
        body: JSON.stringify({
          movimientoId: sugerencia.movimiento_id,
          ventaId: sugerencia.venta_id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast('Conciliación exitosa', { type: 'success' });
        fetchSugerencias();
      } else {
        toast(result.error || 'Error al conciliar', { type: 'error' });
      }
    } catch (error) {
      console.error('Error conciliando:', error);
      toast('Error al conciliar', { type: 'error' });
    }
  }

  async function autoConciliar() {
    try {
      setAutoConciliando(true);
      const response = await apiFetch('/api/banco-chile/conciliacion-auto/auto-conciliar', {
        method: 'POST',
        body: JSON.stringify({ confianzaMinima: 'media' }),
      });

      const result = await response.json();
      if (result.success) {
        toast(`${result.conciliados} movimientos conciliados automáticamente`, { type: 'success' });
        fetchSugerencias();
      } else {
        toast(result.error || 'Error en auto-conciliación', { type: 'error' });
      }
    } catch (error) {
      console.error('Error auto-conciliando:', error);
      toast('Error en auto-conciliación', { type: 'error' });
    } finally {
      setAutoConciliando(false);
    }
  }

  function getConfianzaColor(confianza: string) {
    switch (confianza) {
    case 'alta':
      return 'bg-primary/10 text-primary';
    case 'media':
      return 'bg-primary/10 text-primary';
    default:
      return 'bg-secondary text-foreground';
    }
  }

  if (loading) {
    return <div className="p-4">Cargando sugerencias...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Conciliación Bancaria</h1>
            <p className="text-muted-foreground">
              Sugerencias de conciliación automática
            </p>
          </div>
          <div className="flex gap-2">
            {sugerencias.length > 0 && (
              <button
                onClick={autoConciliar}
                disabled={autoConciliando}
                className="bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90 disabled:opacity-50"
              >
                {autoConciliando ? 'Conciliando...' : 'Auto-conciliar Todo'}
              </button>
            )}
            <button
              onClick={fetchSugerencias}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:opacity-90"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {sugerencias.length === 0 ? (
        <div className="bg-card rounded-lg p-6 border text-center">
          <p className="text-muted-foreground">
            No hay sugerencias de conciliación en este momento
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Las sugerencias aparecen cuando hay movimientos bancarios sin conciliar
            que coinciden con ventas del sistema
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-card rounded-lg p-4 border">
            <p className="text-sm text-muted-foreground mb-4">
              {sugerencias.length} sugerencias encontradas
            </p>
            <div className="space-y-3">
              {sugerencias.map((sug, index) => (
                <div
                  key={`${sug.movimiento_id}-${sug.venta_id}`}
                  className="border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {sug.confianza === 'alta' ? '✅' : sug.confianza === 'media' ? '⚠️' : '⏳'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getConfianzaColor(sug.confianza)}`}>
                        Confianza {sug.confianza}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Puntaje: {sug.puntaje}/100
                      </span>
                    </div>
                    <button
                      onClick={() => conciliarManualmente(sug)}
                      className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:opacity-90"
                    >
                      Conciliar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Movimiento Bancario */}
    <div className="bg-surface-raised p-3 rounded">
      <p className="text-xs text-foreground font-medium mb-1">
                        Movimiento Bancario
                      </p>
                      <p className="text-sm font-medium">{sug.movimiento?.descripcion || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">
                        {sug.movimiento?.fecha_contable
                          ? new Date(sug.movimiento.fecha_contable).toLocaleDateString('es-CL')
                          : 'N/A'}
                      </p>
                      <p className="text-lg font-bold mt-1">
                        ${sug.movimiento?.monto.toLocaleString('es-CL') || '0'}
                      </p>
                    </div>

                    {/* Venta */}
    <div className="bg-primary/10 p-3 rounded">
      <p className="text-xs text-primary font-medium mb-1">
                        Venta
                      </p>
                      <p className="text-sm font-medium">
                        {sug.venta?.numero || `Venta #${index + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sug.venta?.created_at
                          ? new Date(sug.venta.created_at).toLocaleDateString('es-CL')
                          : 'N/A'}
                      </p>
                      <p className="text-lg font-bold mt-1">
                        ${sug.venta?.monto_total.toLocaleString('es-CL') || '0'}
                      </p>
                    </div>
                  </div>

                  {/* Indicadores de coincidencia */}
                  <div className="flex gap-2 mt-3 text-xs">
                    {sug.monto_iguales ? (
      <span className="px-2 py-1 bg-primary/10 text-primary rounded">
        ✓ Montos iguales
      </span>
    ) : (
      <span className="px-2 py-1 bg-destructive/10 text-destructive rounded">
        ✗ Montos diferentes
      </span>
    )}
    {sug.fecha_cercana ? (
      <span className="px-2 py-1 bg-primary/10 text-primary rounded">
        ✓ Fechas cercanas
      </span>
    ) : (
      <span className="px-2 py-1 bg-destructive/10 text-destructive rounded">
        ✗ Fechas lejanas
      </span>
    )}
    {sug.rut_coincide ? (
      <span className="px-2 py-1 bg-primary/10 text-primary rounded">
        ✓ RUT coincide
      </span>
    ) : (
      <span className="px-2 py-1 bg-secondary text-foreground rounded">
                        RUT no disponible
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


