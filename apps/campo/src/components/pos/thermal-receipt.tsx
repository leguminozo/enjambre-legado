'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCLP } from '@enjambre/ui';
import { getTiendaOrigin } from '@/lib/public-urls';

export interface ThermalReceiptProps {
  id: string;
  total: number;
  lines: Array<{
    producto_id: string;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
  }>;
  metodoPago?: string;
  vuelto?: number;
  clienteNombre?: string;
  clienteTelefono?: string;
  claimToken?: string;
  claimUrl?: string | null;
  descuentoClp?: number;
  descuentoPct?: number | null;
  fecha?: Date;
  custodyMessage?: string;
  websiteUrl?: string;
}

export function ThermalReceipt({
  id,
  total,
  lines,
  metodoPago = 'efectivo',
  vuelto,
  clienteNombre,
  clienteTelefono,
  claimUrl,
  descuentoClp = 0,
  descuentoPct,
  fecha = new Date(),
  custodyMessage,
  websiteUrl,
}: ThermalReceiptProps) {
  const tiendaHost = (() => {
    if (websiteUrl) {
      try {
        return new URL(websiteUrl).hostname;
      } catch {
        return websiteUrl;
      }
    }
    try {
      return new URL(getTiendaOrigin()).hostname;
    } catch {
      return 'obrerayzangano.cl';
    }
  })();

  const custodyText =
    custodyMessage ||
    'Tu compra respalda el protocolo de conservación y conteo de especies en el Predio Pureo, Chiloé.';
  const dateStr = fecha.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = fecha.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subtotal = lines.reduce((acc, l) => acc + l.precio_unitario * l.cantidad, 0);

  const metodoLabel =
    metodoPago === 'efectivo'
      ? 'Efectivo'
      : metodoPago === 'debito' || metodoPago === 'tarjeta'
      ? 'Tarjeta Débito'
      : metodoPago === 'tarjeta_pos'
      ? 'POS SumUp'
      : metodoPago === 'transferencia'
      ? 'Transferencia'
      : 'Pago Electrónico';

  return (
    <div
      id="thermal-receipt"
      className="hidden print:block w-[76mm] max-w-[80mm] mx-auto p-2 bg-white text-black font-mono text-[11px] leading-tight"
    >
      {/* Encabezado de Marca */}
      <div className="text-center pb-2 border-b border-black border-dashed space-y-0.5">
        <h1 className="text-sm font-bold tracking-wider uppercase">Enjambre Legado</h1>
        <p className="text-[10px] tracking-widest uppercase">Predio Pureo · Chiloé</p>
        <p className="text-[9px] text-gray-700">Comprobante de Entrega y Origen</p>
      </div>

      {/* Metadata de Venta */}
      <div className="py-2 border-b border-black border-dashed space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span>Folio:</span>
          <span className="font-bold">{id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span>Fecha:</span>
          <span>{dateStr} {timeStr}</span>
        </div>
        {clienteNombre && (
          <div className="flex justify-between">
            <span>Cliente:</span>
            <span className="font-bold truncate max-w-[160px]">{clienteNombre}</span>
          </div>
        )}
        {clienteTelefono && (
          <div className="flex justify-between">
            <span>Contacto:</span>
            <span>{clienteTelefono}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Medio Pago:</span>
          <span>{metodoLabel}</span>
        </div>
      </div>

      {/* Detalle de Productos */}
      <div className="py-2 border-b border-black border-dashed space-y-1.5 text-[10px]">
        <div className="flex justify-between font-bold border-b border-gray-300 pb-0.5">
          <span>Cant · Descripción</span>
          <span>Total</span>
        </div>
        {lines.map((item, idx) => (
          <div key={`${item.producto_id}-${idx}`} className="space-y-0.5">
            <div className="flex justify-between items-baseline">
              <span className="truncate pr-1">
                {item.cantidad}x {item.nombre}
              </span>
              <span className="shrink-0 font-semibold">
                {formatCLP(item.precio_unitario * item.cantidad)}
              </span>
            </div>
            {item.cantidad > 1 && (
              <div className="text-[9px] text-gray-600 pl-3">
                ({formatCLP(item.precio_unitario)} c/u)
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Totales Financieros */}
      <div className="py-2 border-b border-black border-dashed space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCLP(subtotal)}</span>
        </div>
        {descuentoClp > 0 && (
          <div className="flex justify-between font-semibold">
            <span>Descuento{descuentoPct ? ` (${descuentoPct}%)` : ''}:</span>
            <span>-{formatCLP(descuentoClp)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-bold pt-1 border-t border-black">
          <span>TOTAL:</span>
          <span>{formatCLP(total)}</span>
        </div>
        {vuelto != null && vuelto > 0 && (
          <div className="flex justify-between text-[10px] pt-0.5">
            <span>Vuelto Entregado:</span>
            <span>{formatCLP(vuelto)}</span>
          </div>
        )}
      </div>

      {/* Pasaporte Digital & QR */}
      {claimUrl && (
        <div className="py-3 text-center space-y-1.5 border-b border-black border-dashed">
          <p className="text-[9px] font-bold uppercase tracking-wider">
            Pasaporte Digital de Origen
          </p>
          <div className="flex justify-center py-1">
            <QRCodeSVG value={claimUrl} size={110} level="M" />
          </div>
          <p className="text-[8px] leading-tight text-gray-700">
            Escanea para conocer la floración nativa y activar tu membresía.
          </p>
        </div>
      )}

      {/* Mensaje de Impacto Territorial */}
      <div className="pt-2 text-center text-[8px] text-gray-600 leading-tight space-y-1">
        <p>{custodyText}</p>
        <p className="font-bold">{tiendaHost}</p>
      </div>
    </div>
  );
}
