'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { QrCode, ScanLine, Package, MapPin, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { QrCameraScanner } from '@/components/shop/qr-camera-scanner';

type AuditEvent = {
  id: string;
  evento: string;
  ubicacion: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
};

type QRData = {
  codigo: string;
  producto: string;
  lote: string;
  apiario: string | null;
  cosecha: string | null;
  fecha_produccion: string;
  audit_trail: AuditEvent[];
};

export default function QRScanPage() {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScan = useCallback(async (code: string) => {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setQrData(null);

    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      // Buscar QR code
      const { data: qrData, error: qrError } = await supabase
        .from('qr_codes')
        .select(`
          *,
          producto:productos(nombre),
          apiario:apiarios(nombre)
        `)
        .eq('codigo', code.trim())
        .eq('activo', true)
        .single();

      if (qrError || !qrData) {
        setError('Código QR no encontrado o inactivo');
        setLoading(false);
        return;
      }

      // Obtener audit trail
      const { data: auditTrail } = await supabase
        .from('qr_audit_trail')
        .select('*')
        .eq('qr_id', qrData.id)
        .order('created_at', { ascending: true });

      setQrData({
        codigo: qrData.codigo,
        producto: (qrData.producto as any)?.nombre || 'Producto desconocido',
        lote: qrData.lote_id,
        apiario: (qrData.apiario as any)?.nombre || null,
        cosecha: qrData.cosecha_id || null,
        fecha_produccion: qrData.fecha_produccion,
        audit_trail: auditTrail ?? [],
      });
    } catch (err) {
      console.error('Error scanning QR:', err);
      setError('Error al escanear código QR');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code')?.trim();
    if (code) void handleScan(code);
  }, [handleScan]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan(qrCode);
    }
  };

  const getEventIcon = (evento: string) => {
    switch (evento) {
      case 'creado':
        return <Package size={16} className="text-accent" />;
      case 'escaneado':
        return <ScanLine size={16} className="text-info" />;
      case 'enviado':
        return <MapPin size={16} className="text-warning" />;
      case 'entregado':
        return <CheckCircle2 size={16} className="text-success" />;
      default:
        return <Clock size={16} className="text-muted-foreground" />;
    }
  };

  const getEventLabel = (evento: string) => {
    const labels: Record<string, string> = {
      creado: 'Creado',
      escaneado: 'Escaneado',
      enviado: 'Enviado',
      entregado: 'Entregado',
      devuelto: 'Devuelto',
      reportado: 'Reportado',
    };
    return labels[evento] || evento;
  };

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[60vh] bg-background pb-16">
        <div className="border-b border-border px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-accent" />
              </div>
              <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">Escáner QR</h1>
            </div>
            <p className="text-muted-foreground">Escanea el código QR de tu producto para ver su trazabilidad completa desde el apiario hasta tu mesa.</p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="space-y-6">
            <QrCameraScanner onScan={handleScan} disabled={loading} />

            <div className="rounded-xl border border-border bg-card/40 p-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Ingresa o escanea el código QR
              </label>
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ej: ABC123XYZ"
                  className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                />
                <button
                  onClick={() => handleScan(qrCode)}
                  disabled={loading || !qrCode.trim()}
                  className="px-6 py-3 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Escanear'
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {qrData && (
              <div className="space-y-6 animate-in">
                {/* Product info */}
                <div className="rounded-xl border border-border bg-card/40 p-6">
                  <h2 className="font-display text-lg text-foreground mb-4">Información del Producto</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Código QR</p>
                      <p className="font-medium text-foreground">{qrData.codigo}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Producto</p>
                      <p className="font-medium text-foreground">{qrData.producto}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Lote</p>
                      <p className="font-medium text-foreground">{qrData.lote}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Fecha de Producción</p>
                      <p className="font-medium text-foreground">{new Date(qrData.fecha_produccion).toLocaleDateString('es-CL')}</p>
                    </div>
                    {qrData.apiario && (
                      <div>
                        <p className="text-muted-foreground mb-1">Apiario</p>
                        <p className="font-medium text-foreground">{qrData.apiario}</p>
                      </div>
                    )}
                    {qrData.cosecha && (
                      <div>
                        <p className="text-muted-foreground mb-1">Cosecha</p>
                        <p className="font-medium text-foreground">{qrData.cosecha}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Audit trail */}
                <div className="rounded-xl border border-border bg-card/40 p-6">
                  <h2 className="font-display text-lg text-foreground mb-4">Historial de Trazabilidad</h2>
                  {qrData.audit_trail.length > 0 ? (
                    <div className="space-y-3">
                      {qrData.audit_trail.map((event, index) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-surface-sunken border border-border"
                        >
                          <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shrink-0 mt-0.5">
                            {getEventIcon(event.evento)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-foreground">{getEventLabel(event.evento)}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.created_at).toLocaleString('es-CL')}
                              </p>
                            </div>
                            {event.ubicacion && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin size={12} />
                                {event.ubicacion}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <Clock size={32} className="mx-auto mb-2 opacity-50" />
                      Sin eventos registrados
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
