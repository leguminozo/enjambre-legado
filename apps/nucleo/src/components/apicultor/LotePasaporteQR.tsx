'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, QrCode, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Badge, Button, QRCode, Spinner, toast, friendlyError } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface QrData {
  codigo: string;
  integridad: {
    es_valido: boolean;
    eventos_verificados: number;
    total_eventos: number;
  };
}

/**
 * Pasaporte verificable de un lote (QR + integridad de cadena de custodia).
 * Vive en Producción: la única trazabilidad de producto con valor real.
 */
export function LotePasaporteQR({ loteId, compact = false }: { loteId: string; compact?: boolean }) {
  const apiFetch = useApiFetch();
  const [qr, setQr] = useState<QrData | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      // apiFetch manda Bearer: permite ver QR de lotes aún no publicados (borrador operador)
      const res = await apiFetch(`/api/trazabilidad/lote/${loteId}/qr`);
      if (!res.ok) {
        setQr(null);
        return;
      }
      const json = (await res.json()) as { data: QrData };
      setQr(json.data);
    } catch {
      setQr(null);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, loteId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const generar = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/trazabilidad/lote/${loteId}/qr`, { method: 'POST' });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || 'No se pudo generar el QR');
      }
      toast.success('Pasaporte firmado: QR generado');
      await cargar();
    } catch (err) {
      toast.error(friendlyError(err));
      setLoading(false);
    }
  };

  if (loading && qr === undefined) {
    return (
      <div className="flex justify-center py-3">
        <Spinner size="sm" />
      </div>
    );
  }

  if (qr) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return (
      <div className={`flex items-center gap-3 ${compact ? '' : 'mt-2'}`}>
        <QRCode value={`${origin}/lote/${loteId}`} size={compact ? 72 : 96} className="p-1.5 shrink-0" />
        <div className="flex flex-col gap-1.5 text-xs min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {qr.integridad.es_valido ? (
              <Badge variant="success" className="h-5 px-2 flex items-center gap-1 text-[0.65rem]">
                <ShieldCheck size={11} /> Cadena íntegra
              </Badge>
            ) : (
              <Badge variant="danger" className="h-5 px-2 flex items-center gap-1 text-[0.65rem]">
                <ShieldAlert size={11} /> Cadena manipulada
              </Badge>
            )}
            <span className="font-mono text-muted-foreground truncate">{qr.codigo}</span>
          </div>
          <span className="text-muted-foreground">
            {qr.integridad.eventos_verificados}/{qr.integridad.total_eventos} eventos verificados
          </span>
          <a
            href={`/lote/${loteId}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline w-fit"
          >
            <ExternalLink size={12} /> Ver pasaporte (requiere lote publicado)
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground italic">Sin pasaporte firmado</p>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-[0.65rem] border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary shrink-0"
        disabled={loading}
        onClick={(e) => {
          e.stopPropagation();
          void generar();
        }}
      >
        <QrCode size={12} className="mr-1.5" />
        {loading ? 'Firmando…' : 'Firmar pasaporte'}
      </Button>
    </div>
  );
}
