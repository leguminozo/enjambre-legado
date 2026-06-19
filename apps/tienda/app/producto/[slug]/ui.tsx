'use client';

import type { ShopProduct } from '@/lib/shop/products';
import { useCartLines } from '@/components/shop/cart-context';
import React, { useState } from 'react';
import { QrCode, Shield, Clock, MapPin, Leaf } from 'lucide-react';
import { QRCode } from '@enjambre/ui';

export function AddToCartButton({
  product,
  disabled = false,
}: {
  product: ShopProduct;
  disabled?: boolean;
}) {
  const { add } = useCartLines();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-45"
      onClick={() => {
        if (disabled) return;
        add(
          {
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
          },
          1,
        );
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1400);
      }}
    >
      {added ? 'Agregado al carrito' : 'Agregar al carrito'}
    </button>
  );
}

interface TraceabilityProps {
  slug: string;
  blockchainHash?: string | null;
  colmenaOrigen?: string | null;
  fechaCosecha?: string | null;
  fechaEnvasado?: string | null;
  nombreLote?: string | null;
  descripcionLote?: string | null;
}

export function TraceabilitySection({ 
  slug,
  blockchainHash, 
  colmenaOrigen, 
  fechaCosecha,
  fechaEnvasado,
  nombreLote,
  descripcionLote
}: TraceabilityProps) {
  const [showQR, setShowQR] = useState(false);

  if (!blockchainHash) return null;

  const qrUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/producto/${slug}/trazabilidad` 
    : '';

  return (
    <div className="mt-12 border-t border-border pt-8">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-accent" />
        <h2 className="font-display text-lg text-foreground">Trazabilidad Certificada</h2>
      </div>

      <div className="rounded-xl border border-border bg-card/40 p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Info */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Este producto cuenta con certificación de trazabilidad de origen. Cada lote está firmado criptográficamente y vinculado a una colmena del bosque nativo de Chiloé.
            </p>
            
            {(colmenaOrigen || fechaCosecha || fechaEnvasado || nombreLote) && (
              <div className="space-y-3">
                {nombreLote && (
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="h-4 w-4 text-accent" />
                    <span className="text-foreground">Lote: <strong>{nombreLote}</strong></span>
                  </div>
                )}
                {colmenaOrigen && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-accent" />
                    <span className="text-foreground">Colmena: <strong>{colmenaOrigen}</strong></span>
                  </div>
                )}
                {fechaCosecha && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-accent" />
                    <span className="text-foreground">Cosecha: <strong>{new Date(fechaCosecha).toLocaleDateString('es-CL')}</strong></span>
                  </div>
                )}
                {fechaEnvasado && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-accent" />
                    <span className="text-foreground">Envasado: <strong>{new Date(fechaEnvasado).toLocaleDateString('es-CL')}</strong></span>
                  </div>
                )}
                {blockchainHash && (
                  <div className="flex items-center gap-3 text-sm">
                    <Leaf className="h-4 w-4 text-accent" />
                    <span className="text-foreground">Hash de Origen: <code className="text-xs bg-secondary px-2 py-1 rounded">{blockchainHash.slice(0, 12)}...{blockchainHash.slice(-8)}</code></span>
                  </div>
                )}
              </div>
            )}
            
            {descripcionLote && (
              <p className="mt-4 text-xs italic text-muted-foreground border-l-2 border-accent/20 pl-3">
                {descripcionLote}
              </p>
            )}

            <button
              onClick={() => setShowQR(!showQR)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
            >
              <QrCode className="h-4 w-4" />
              {showQR ? 'Ocultar QR' : 'Ver código QR'}
            </button>
          </div>

          {/* QR */}
          {showQR && (
            <div className="flex flex-col items-center justify-center p-4 bg-secondary/50 rounded-lg border border-border">
              <QRCode value={qrUrl} size={120} className="mb-3 border-none p-1 bg-white" fgColor="#000000" />
              <p className="text-xs text-muted-foreground text-center">
                Escanea para verificar el origen y trazabilidad de este producto
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
