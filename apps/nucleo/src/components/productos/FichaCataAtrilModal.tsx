'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Printer, Compass, Utensils, Clock, QrCode, Sparkles } from 'lucide-react';
import { Button, QRCode } from '@enjambre/ui';
import type { Product, PerfilSensorial, ProductoVariante } from '@/lib/product-types';
import { FORTIFICANTES_LABELS, type FortificanteCanonico } from '@enjambre/resenas';
import { getUrlTienda } from '@/lib/publicUrls';

export interface FichaCataAtrilModalProps {
  open: boolean;
  onClose: () => void;
  product: Product;
}

export function FichaCataAtrilModal({ open, onClose, product }: FichaCataAtrilModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [variantes, setVariantes] = useState<ProductoVariante[]>([]);
  const [selectedVarianteId, setSelectedVarianteId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !product.id) return;
    void (async () => {
      try {
        const res = await fetch(`/api/variantes?producto_id=${product.id}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data)) setVariantes(json.data);
        }
      } catch {
        // Fail-open
      }
    })();
  }, [open, product.id]);

  if (!open) return null;

  const selectedVariante = variantes.find((v) => v.id === selectedVarianteId) ?? null;
  const perfilBase = (product.perfil_sensorial as PerfilSensorial) || {
    intensidad: 75,
    dulzor_acidez: 60,
    textura: 85,
    notas_aromaticas: [],
    maridajes: [],
    momento_consumo: '',
  };

  const overrideObj = (selectedVariante?.perfil_sensorial_override &&
    typeof selectedVariante.perfil_sensorial_override === 'object'
    ? selectedVariante.perfil_sensorial_override
    : {}) as Partial<PerfilSensorial>;

  const perfil = {
    ...perfilBase,
    ...overrideObj,
  };

  const displayNombre = selectedVariante
    ? `${product.nombre} · ${selectedVariante.nombre_variante}`
    : product.nombre;

  const tiendaBaseUrl = typeof window !== 'undefined' ? getUrlTienda() : 'https://obrerayzangano.cl';
  const qrUrl = `${tiendaBaseUrl}/producto/${product.slug || product.id}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      {/* Estilos específicos de impresión: aíslan solo el tarjetón físico */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #ficha-atril-tarjeton,
          #ficha-atril-tarjeton * {
            visibility: visible !important;
          }
          #ficha-atril-tarjeton {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 148mm !important; /* Formato postal A6 amplio */
            max-width: 148mm !important;
            min-height: 210mm !important;
            margin: 0 !important;
            padding: 24px !important;
            background: #ffffff !important;
            color: #1a1a1a !important;
            border: 1.5px solid #222222 !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
          }
          .print-hidden {
            display: none !important;
          }
          .print-text-dark {
            color: #111111 !important;
          }
          .print-border-dark {
            border-color: #333333 !important;
          }
          .print-bg-light {
            background-color: #f7f7f7 !important;
          }
          .print-bar-fill {
            background-color: #111111 !important;
          }
        }
      `}</style>

      {/* Contenedor Modal */}
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Barra superior de control */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-border bg-surface-raised print-hidden gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Ficha de Atril de Mostrador · Cata & Degustación
            </span>
          </div>

          <div className="flex items-center gap-2">
            {variantes.length > 0 && (
              <select
                value={selectedVarianteId ?? ''}
                onChange={(e) => setSelectedVarianteId(e.target.value ? e.target.value : null)}
                className="input-field py-1 px-2.5 text-xs bg-card border border-border"
              >
                <option value="">Producto Base ({product.formato || 'Estándar'})</option>
                {variantes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre_variante}
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs text-foreground hover:text-primary"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Tarjetón</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-sunken transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo con Scroll para vista en pantalla */}
        <div className="p-6 overflow-y-auto bg-surface-sunken/40 flex justify-center">
          {/* Tarjetón Imprimible */}
          <div
            id="ficha-atril-tarjeton"
            ref={cardRef}
            className="w-full max-w-[480px] bg-card border border-border/80 rounded-xl p-6 md:p-8 flex flex-col justify-between shadow-lg print-text-dark"
          >
            {/* Header del Tarjetón */}
            <div className="text-center pb-4 border-b border-border/60 print-border-dark">
              <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-primary block mb-1">
                ENJAMBRE LEGADO · CHILOÉ
              </span>
              <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-foreground print-text-dark">
                {displayNombre}
              </h2>
              {selectedVariante?.ingrediente_fortificante && (
                <span className="inline-block mt-1 text-[11px] font-semibold text-primary">
                  ✦ Inclusión: {FORTIFICANTES_LABELS[selectedVariante.ingrediente_fortificante as FortificanteCanonico] ?? selectedVariante.ingrediente_fortificante}
                </span>
              )}
              <div className="flex items-center justify-center gap-2 mt-1.5 text-xs text-muted-foreground print-text-dark">
                {product.origen_apicola && (
                  <span className="font-medium">{product.origen_apicola}</span>
                )}
                {product.origen_apicola && (product.formato || selectedVariante?.peso_neto_g) && <span>·</span>}
                {selectedVariante?.peso_neto_g ? (
                  <span>{selectedVariante.peso_neto_g}g</span>
                ) : (
                  product.formato && <span>{product.formato}</span>
                )}
              </div>
            </div>

            {/* Curvas Organolépticas */}
            <div className="py-5 space-y-3.5 border-b border-border/60 print-border-dark">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                <Compass className="w-3.5 h-3.5" />
                <span>Perfil Sensorial en Paladar</span>
              </div>

              {/* Intensidad */}
              <div>
                <div className="flex justify-between text-[11px] text-muted-foreground print-text-dark mb-1">
                  <span>{perfil.descriptores_intensidad?.izq || 'Suave & Floral'}</span>
                  <span className="font-semibold text-foreground print-text-dark">
                    Intensidad {perfil.intensidad}%
                  </span>
                  <span>{perfil.descriptores_intensidad?.der || 'Robusto & Boscoso'}</span>
                </div>
                <div className="w-full h-2 bg-surface-sunken print-bg-light rounded-full overflow-hidden border border-border/40">
                  <div
                    className="h-full bg-primary print-bar-fill rounded-full"
                    style={{ width: `${perfil.intensidad}%` }}
                  />
                </div>
              </div>

              {/* Dulzor / Acidez */}
              <div>
                <div className="flex justify-between text-[11px] text-muted-foreground print-text-dark mb-1">
                  <span>{perfil.descriptores_dulzor?.izq || 'Dulzor Cálido'}</span>
                  <span className="font-semibold text-foreground print-text-dark">
                    Balance {perfil.dulzor_acidez}%
                  </span>
                  <span>{perfil.descriptores_dulzor?.der || 'Acidez Silvestre'}</span>
                </div>
                <div className="w-full h-2 bg-surface-sunken print-bg-light rounded-full overflow-hidden border border-border/40">
                  <div
                    className="h-full bg-primary print-bar-fill rounded-full"
                    style={{ width: `${perfil.dulzor_acidez}%` }}
                  />
                </div>
              </div>

              {/* Textura */}
              <div>
                <div className="flex justify-between text-[11px] text-muted-foreground print-text-dark mb-1">
                  <span>{perfil.descriptores_textura?.izq || 'Sedosa'}</span>
                  <span className="font-semibold text-foreground print-text-dark">
                    Textura {perfil.textura}%
                  </span>
                  <span>{perfil.descriptores_textura?.der || 'Cremosa & Densa'}</span>
                </div>
                <div className="w-full h-2 bg-surface-sunken print-bg-light rounded-full overflow-hidden border border-border/40">
                  <div
                    className="h-full bg-primary print-bar-fill rounded-full"
                    style={{ width: `${perfil.textura}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Notas Aromáticas */}
            {perfil.notas_aromaticas && perfil.notas_aromaticas.length > 0 && (
              <div className="py-4 border-b border-border/60 print-border-dark">
                <span className="text-[10px] tracking-wider uppercase font-semibold text-muted-foreground print-text-dark block mb-2">
                  Notas Olfativas & Aromas
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {perfil.notas_aromaticas.map((nota: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-surface-raised print-bg-light border border-border text-foreground print-text-dark"
                    >
                      {nota}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Maridajes Sugeridos */}
            {perfil.maridajes && perfil.maridajes.length > 0 && (
              <div className="py-4 border-b border-border/60 print-border-dark">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Maridajes Gastronómicos</span>
                </div>
                <ul className="space-y-1.5 text-xs text-foreground print-text-dark">
                  {perfil.maridajes.slice(0, 3).map((m: { titulo: string; detalle: string }, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">·</span>
                      <div>
                        <strong className="font-medium">{m.titulo}</strong>
                        {m.detalle && <span className="text-muted-foreground print-text-dark"> — {m.detalle}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Momento de Degustación */}
            {perfil.momento_consumo && (
              <div className="py-3 border-b border-border/60 print-border-dark text-xs text-muted-foreground print-text-dark flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{perfil.momento_consumo}</span>
              </div>
            )}

            {/* Pie con Código QR y Trazabilidad */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-primary block">
                  Trazabilidad & Compra Digital
                </span>
                <p className="text-[11px] text-muted-foreground print-text-dark max-w-[240px] leading-tight">
                  Escanea con tu teléfono para verificar el certificado de pureza biológica y origen de este lote.
                </p>
              </div>
              <div className="shrink-0">
                <QRCode
                  value={qrUrl}
                  size={84}
                  className="bg-background print-bg-light border border-border p-1.5 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
