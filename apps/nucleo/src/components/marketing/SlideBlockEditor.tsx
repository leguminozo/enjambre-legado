'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { type SlideBlock } from './slide-studio-core';

export interface SlideBlockEditorProps {
  block: SlideBlock;
  onChange: (updated: SlideBlock) => void;
}

export function SlideBlockEditor({ block, onChange }: SlideBlockEditorProps) {
  switch (block.type) {
    case 'paragraph':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-mono text-muted-foreground block mb-1">
              Encabezado del Párrafo (Mono)
            </label>
            <input
              type="text"
              className="input-field w-full text-base md:text-xs font-mono"
              value={block.header ?? ''}
              onChange={(e) => onChange({ ...block, header: e.target.value })}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-mono text-muted-foreground block">
                Líneas del Párrafo
              </label>
              <span className="text-[10px] font-mono text-primary/70">
                Doble Enter (↵↵) crea un nuevo párrafo
              </span>
            </div>
            <textarea
              rows={5}
              placeholder="Escribe el texto del manifiesto... Usa doble Enter para separar párrafos."
              className="input-field w-full text-base md:text-xs leading-relaxed"
              value={block.lines.join('\n')}
              onChange={(e) => onChange({ ...block, lines: e.target.value.split('\n') })}
            />
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground block mb-1">
              Nota de Cierre / Flecha
            </label>
            <input
              type="text"
              className="input-field w-full text-base md:text-xs font-mono"
              value={block.accentNote ?? ''}
              onChange={(e) => onChange({ ...block, accentNote: e.target.value })}
            />
          </div>
        </div>
      );

    case 'items':
      return (
        <div className="space-y-3">
          <div className="space-y-2.5">
            {block.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] gap-2 items-center">
                <input
                  type="text"
                  placeholder="Título (ej. DESDE 2004)"
                  className="input-field w-full text-base md:text-xs font-mono"
                  value={item.title}
                  onChange={(e) => {
                    const next = [...block.items];
                    next[idx] = { ...next[idx], title: e.target.value };
                    onChange({ ...block, items: next });
                  }}
                />
                <input
                  type="text"
                  placeholder="Descripción detallada"
                  className="input-field w-full text-base md:text-xs"
                  value={item.desc}
                  onChange={(e) => {
                    const next = [...block.items];
                    next[idx] = { ...next[idx], desc: e.target.value };
                    onChange({ ...block, items: next });
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = block.items.filter((_, i) => i !== idx);
                    onChange({ ...block, items: next });
                  }}
                  className="btn btn-ghost h-10 w-10 sm:h-8 sm:w-8 p-0 text-destructive hover:bg-destructive/10 shrink-0 flex items-center justify-center self-end sm:self-center"
                  title="Eliminar ítem"
                  aria-label="Eliminar ítem"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...block,
                items: [...block.items, { title: '', desc: '' }],
              })
            }
            className="btn btn-outline btn-sm h-10 sm:h-8 text-xs flex items-center gap-1.5 w-full sm:w-auto justify-center"
          >
            <Plus size={14} /> Añadir Ítem
          </button>
        </div>
      );

    case 'metrics':
      return (
        <div className="space-y-3">
          <div className="space-y-2.5">
            {block.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] gap-2 items-center">
                <input
                  type="text"
                  placeholder="Parámetro (ej. TEMPERATURA NATURAL)"
                  className="input-field w-full text-base md:text-xs font-mono"
                  value={item.label}
                  onChange={(e) => {
                    const next = [...block.items];
                    next[idx] = { ...next[idx], label: e.target.value };
                    onChange({ ...block, items: next });
                  }}
                />
                <input
                  type="text"
                  placeholder="Valor analítico / Norma"
                  className="input-field w-full text-base md:text-xs"
                  value={item.value}
                  onChange={(e) => {
                    const next = [...block.items];
                    next[idx] = { ...next[idx], value: e.target.value };
                    onChange({ ...block, items: next });
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = block.items.filter((_, i) => i !== idx);
                    onChange({ ...block, items: next });
                  }}
                  className="btn btn-ghost h-10 w-10 sm:h-8 sm:w-8 p-0 text-destructive hover:bg-destructive/10 shrink-0 flex items-center justify-center self-end sm:self-center"
                  title="Eliminar parámetro"
                  aria-label="Eliminar parámetro"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...block,
                items: [...block.items, { label: '', value: '' }],
              })
            }
            className="btn btn-outline btn-sm h-10 sm:h-8 text-xs flex items-center gap-1.5 w-full sm:w-auto justify-center"
          >
            <Plus size={14} /> Añadir Parámetro
          </button>
        </div>
      );

    case 'comparison':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Panel Izquierdo */}
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
              <span className="text-xs font-mono text-primary block font-semibold">
                Panel Izquierdo
              </span>
              <input
                type="text"
                placeholder="Tag (ej. [ESTADO 01])"
                className="input-field w-full text-base md:text-xs font-mono"
                value={block.left.tag}
                onChange={(e) =>
                  onChange({ ...block, left: { ...block.left, tag: e.target.value } })
                }
              />
              <input
                type="text"
                placeholder="Título (ej. MIEL CRUDA)"
                className="input-field w-full text-base md:text-xs font-existencial"
                value={block.left.title}
                onChange={(e) =>
                  onChange({ ...block, left: { ...block.left, title: e.target.value } })
                }
              />
              <input
                type="text"
                placeholder="Subtítulo (ej. Floración Estacional)"
                className="input-field w-full text-base md:text-xs italic"
                value={block.left.subtitle ?? ''}
                onChange={(e) =>
                  onChange({ ...block, left: { ...block.left, subtitle: e.target.value } })
                }
              />
              <textarea
                rows={3}
                placeholder="Líneas descriptivas (una por línea)"
                className="input-field w-full text-base md:text-xs"
                value={block.left.lines.join('\n')}
                onChange={(e) =>
                  onChange({ ...block, left: { ...block.left, lines: e.target.value.split('\n') } })
                }
              />
            </div>

            {/* Panel Derecho */}
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
              <span className="text-xs font-mono text-primary block font-semibold">
                Panel Derecho
              </span>
              <input
                type="text"
                placeholder="Tag (ej. [ESTADO 02])"
                className="input-field w-full text-base md:text-xs font-mono"
                value={block.right.tag}
                onChange={(e) =>
                  onChange({ ...block, right: { ...block.right, tag: e.target.value } })
                }
              />
              <input
                type="text"
                placeholder="Título (ej. CREMA DE MIEL)"
                className="input-field w-full text-base md:text-xs font-existencial"
                value={block.right.title}
                onChange={(e) =>
                  onChange({ ...block, right: { ...block.right, title: e.target.value } })
                }
              />
              <input
                type="text"
                placeholder="Subtítulo (ej. Batido en Frío 48h)"
                className="input-field w-full text-base md:text-xs italic"
                value={block.right.subtitle ?? ''}
                onChange={(e) =>
                  onChange({ ...block, right: { ...block.right, subtitle: e.target.value } })
                }
              />
              <textarea
                rows={3}
                placeholder="Líneas descriptivas (una por línea)"
                className="input-field w-full text-base md:text-xs"
                value={block.right.lines.join('\n')}
                onChange={(e) =>
                  onChange({ ...block, right: { ...block.right, lines: e.target.value.split('\n') } })
                }
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground block mb-1">
              Nota Compartida al Pie
            </label>
            <input
              type="text"
              placeholder="ej. AMBAS PRESENTACIONES MANTIENEN SU FIRMA ENZIMÁTICA INTACTA"
              className="input-field w-full text-base md:text-xs font-mono"
              value={block.sharedNote ?? ''}
              onChange={(e) => onChange({ ...block, sharedNote: e.target.value })}
            />
          </div>
        </div>
      );

    case 'portal':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">
                URL de Destino
              </label>
              <input
                type="text"
                placeholder="obrerayzangano.cl"
                className="input-field w-full text-base md:text-xs font-mono"
                value={block.url}
                onChange={(e) => onChange({ ...block, url: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">
                Subtítulo del Portal
              </label>
              <input
                type="text"
                placeholder="Biblioteca botánica y tienda oficial"
                className="input-field w-full text-base md:text-xs"
                value={block.subtitle}
                onChange={(e) => onChange({ ...block, subtitle: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground block mb-1">
              Puntos del Portal (uno por línea)
            </label>
            <textarea
              rows={3}
              placeholder="Escribe los puntos de acceso o catálogo..."
              className="input-field w-full text-base md:text-xs"
              value={block.bullets.join('\n')}
              onChange={(e) => onChange({ ...block, bullets: e.target.value.split('\n') })}
            />
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground block mb-1">
              Llamado al Pie
            </label>
            <input
              type="text"
              placeholder="ej. ENLACE DIRECTO EN LA BIOGRAFÍA ->"
              className="input-field w-full text-base md:text-xs font-mono"
              value={block.callNote ?? ''}
              onChange={(e) => onChange({ ...block, callNote: e.target.value })}
            />
          </div>
        </div>
      );

    case 'quote':
      return (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-mono text-muted-foreground block">
                Cita Textual
              </label>
              <span className="text-[10px] font-mono text-primary/70">
                Doble Enter (↵↵) crea un nuevo párrafo
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="Cita o axioma territorial... Usa doble Enter para párrafos."
              className="input-field w-full text-base md:text-xs font-existencial leading-relaxed"
              value={block.quote}
              onChange={(e) => onChange({ ...block, quote: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground block mb-1">
              Atribución
            </label>
            <input
              type="text"
              placeholder="ej. Registro Territorial de Chiloé"
              className="input-field w-full text-base md:text-xs font-mono"
              value={block.attribution ?? ''}
              onChange={(e) => onChange({ ...block, attribution: e.target.value })}
            />
          </div>
        </div>
      );

    case 'qr_code':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">
                Tipo de Destino QR
              </label>
              <select
                className="input-field w-full text-base md:text-xs font-mono"
                value={block.destinationType}
                onChange={(e) => {
                  const dest = e.target.value as 'resena' | 'lote' | 'producto' | 'club' | 'tienda' | 'custom';
                  let defaultUrl = block.url;
                  let defaultTitle = block.title;
                  if (dest === 'resena') {
                    defaultUrl = 'https://tienda.obrerayzangano.cl/resenas/nueva';
                    defaultTitle = 'RESEÑA VIVA EN MESA';
                  } else if (dest === 'lote') {
                    defaultUrl = `https://tienda.obrerayzangano.cl/trazabilidad?lote=${block.batchCode || 'LOTE-ULMO-2026'}`;
                    defaultTitle = 'PASAPORTE DE ORIGEN';
                  } else if (dest === 'producto') {
                    defaultUrl = 'https://tienda.obrerayzangano.cl/catalogo';
                    defaultTitle = 'FICHA OFICIAL DE PRODUCTO';
                  } else if (dest === 'club') {
                    defaultUrl = 'https://tienda.obrerayzangano.cl/club-legado-del-bosque';
                    defaultTitle = 'CLUB LEGADO DEL BOSQUE';
                  } else if (dest === 'tienda') {
                    defaultUrl = 'https://tienda.obrerayzangano.cl/catalogo';
                    defaultTitle = 'TIENDA SOBERANA';
                  }
                  onChange({
                    ...block,
                    destinationType: dest,
                    url: defaultUrl,
                    title: defaultTitle,
                  });
                }}
              >
                <option value="resena">Reseña en Mesa / Comensal</option>
                <option value="lote">Pasaporte de Lote / Trazabilidad</option>
                <option value="producto">Producto Específico del Catálogo</option>
                <option value="club">Club Legado del Bosque</option>
                <option value="tienda">Catálogo / Tienda Oficial</option>
                <option value="custom">Enlace Personalizado</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground block mb-1">
                Código de Lote Asociado
              </label>
              <input
                type="text"
                placeholder="ej. LOTE-2026-ULMO-01"
                className="input-field w-full text-base md:text-xs font-mono"
                value={block.batchCode ?? ''}
                onChange={(e) => onChange({ ...block, batchCode: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground block mb-1">
              Título del Bloque (Mono)
            </label>
            <input
              type="text"
              className="input-field w-full text-base md:text-xs font-mono"
              value={block.title}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground block mb-1">
              Instrucción / Subtítulo
            </label>
            <input
              type="text"
              placeholder="ej. Apunta la cámara para registrar tus notas sensoriales y validar el lote."
              className="input-field w-full text-base md:text-xs"
              value={block.subtitle ?? ''}
              onChange={(e) => onChange({ ...block, subtitle: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground block mb-1">
              URL de Destino Real (se codifica en el QR)
            </label>
            <input
              type="text"
              className="input-field w-full text-base md:text-xs font-mono text-primary"
              value={block.url}
              onChange={(e) => onChange({ ...block, url: e.target.value })}
            />
          </div>
        </div>
      );

    case 'sensorial':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { key: 'sweetness', label: 'Dulzura' },
              { key: 'acidity', label: 'Acidez' },
              { key: 'flora', label: 'Flora' },
              { key: 'body', label: 'Cuerpo' },
            ].map(({ key, label }) => {
              const currentVal = block[key as 'sweetness' | 'acidity' | 'flora' | 'body'];
              return (
                <div key={key} className="p-2.5 rounded-xl border border-border bg-surface-sunken/40 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-primary">{currentVal}/5</span>
                  </div>
                  <div className="flex gap-1 justify-between">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => onChange({ ...block, [key]: val })}
                        className={`h-6 w-full rounded text-[10px] font-mono transition-colors ${
                          val <= currentVal
                            ? 'bg-primary text-primary-foreground font-bold'
                            : 'bg-surface-raised border border-border/60 text-muted-foreground hover:bg-surface-raised/80'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground block mb-1">
              Textura & Cristalización
            </label>
            <input
              type="text"
              placeholder="ej. Microcristales sedosos y untuosos"
              className="input-field w-full text-base md:text-xs"
              value={block.crystallization ?? ''}
              onChange={(e) => onChange({ ...block, crystallization: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground block mb-1">
              Nota de Maridaje (Cafeterías / Gastronomía)
            </label>
            <input
              type="text"
              placeholder="ej. Armoniza con cafés de tueste medio lavado y cold brew con notas cítricas."
              className="input-field w-full text-base md:text-xs italic"
              value={block.pairingNote ?? ''}
              onChange={(e) => onChange({ ...block, pairingNote: e.target.value })}
            />
          </div>
        </div>
      );
  }
}
