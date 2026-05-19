import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

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

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );

  useEffect(() => {
    fetchSugerencias();
  }, []);

  async function fetchSugerencias() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/banco-chile/conciliacion-auto/sugerencias', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-empresa-id': session.user.id,
        },
      });

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/banco-chile/conciliacion-auto/conciliar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-empresa-id': session.user.id,
        },
        body: JSON.stringify({
          movimientoId: sugerencia.movimiento_id,
          ventaId: sugerencia.venta_id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Conciliación exitosa');
        fetchSugerencias();
      } else {
        alert(result.error || 'Error al conciliar');
      }
    } catch (error) {
      console.error('Error conciliando:', error);
      alert('Error al conciliar');
    }
  }

  async function autoConciliar() {
    try {
      setAutoConciliando(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/banco-chile/conciliacion-auto/auto-conciliar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-empresa-id': session.user.id,
        },
        body: JSON.stringify({ confianzaMinima: 'media' }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`${result.conciliados} movimientos conciliados automáticamente`);
        fetchSugerencias();
      } else {
        alert(result.error || 'Error en auto-conciliación');
      }
    } catch (error) {
      console.error('Error auto-conciliando:', error);
      alert('Error en auto-conciliación');
    } finally {
      setAutoConciliando(false);
    }
  }

  function getConfianzaColor(confianza: string) {
    switch (confianza) {
      case 'alta':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
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
                    <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded">
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
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
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                        ✓ Montos iguales
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
                        ✗ Montos diferentes
                      </span>
                    )}
                    {sug.fecha_cercana ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                        ✓ Fechas cercanas
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
                        ✗ Fechas lejanas
                      </span>
                    )}
                    {sug.rut_coincide ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                        ✓ RUT coincide
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 rounded">
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

export default ConciliacionView;
