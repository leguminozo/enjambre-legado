'use client';

import React from 'react';
import { cn, QRCode } from '@enjambre/ui';
import {
  type SlideData,
  type SlideBlock,
  type SlideAspectRatio,
  buildHeaderKicker,
  resolveAccentColor,
} from './slide-studio-core';

export interface SlidePreviewCardProps {
  slide: SlideData;
  index: number;
  total: number;
  className?: string;
  aspectRatio?: SlideAspectRatio;
}

export function SlidePreviewCard({
  slide,
  index,
  total,
  className,
  aspectRatio,
}: SlidePreviewCardProps) {
  const { left: headerLeft, right: headerRight } = buildHeaderKicker(slide);
  const { hex: accentHex } = resolveAccentColor(slide.accentColor);

  const isCentered = slide.alignment === 'center';
  const alignClass = isCentered ? 'text-center' : 'text-left';

  const titleSizeClasses: Record<string, string> = {
    compact: 'text-[16px] leading-[1.22]',
    normal: 'text-[19px] leading-[1.18]',
    large: 'text-[23px] leading-[1.14]',
  };
  const titleClass = titleSizeClasses[slide.titleSize ?? 'normal'] ?? 'text-[19px] leading-[1.18]';

  const effectiveRatio = aspectRatio || slide.aspectRatio || '4:5';
  const aspectClass =
    effectiveRatio === '9:16'
      ? 'aspect-[9/16] max-w-[340px]'
      : effectiveRatio === '1:1'
      ? 'aspect-square max-w-[390px]'
      : 'aspect-[4/5] max-w-[390px]';

  return (
    <div
      className={cn(
        'w-full rounded-2xl border border-[#262C27] bg-[#0A0B0A] text-[#F2EEE6] p-4 sm:p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden select-none font-sans',
        aspectClass,
        className,
      )}
    >
      {/* 1. Header & Kickers */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[9px] font-mono tracking-wider gap-2">
          <span className="truncate font-medium" style={{ color: accentHex }}>
            {headerLeft}
          </span>
          <span className="text-[#8E9690] shrink-0 font-medium">{headerRight}</span>
        </div>
        <div className="h-px bg-[#1A201B] w-full" />
      </div>

      {/* 2. Contenido Central */}
      <div className="my-auto space-y-2.5 py-1.5 overflow-hidden">
        {/* Badge superior */}
        {slide.badge && (
          <div
            className={cn('text-[9px] font-mono tracking-widest uppercase', alignClass)}
            style={{ color: accentHex }}
          >
            {slide.badge}
          </div>
        )}

        {/* Título Principal en Cormorant Garamond con soporte para párrafos */}
        <h3
          className={cn(
            'font-existencial font-semibold text-[#F2EEE6] whitespace-pre-line',
            titleClass,
            alignClass,
          )}
        >
          {slide.title || 'Título de la lámina editorial'}
        </h3>

        {/* Subtítulo descriptivo con soporte para párrafos */}
        {slide.subtitle && (
          <p
            className={cn(
              'font-existencial italic text-[11px] leading-snug text-[#8E9690] whitespace-pre-line',
              alignClass,
            )}
          >
            {slide.subtitle}
          </p>
        )}

        {/* Bloques modulares abstractos */}
        <div className="space-y-2 pt-0.5">
          {slide.blocks && slide.blocks.length > 0 ? (
            slide.blocks.map((block: SlideBlock) => (
              <RenderBlockInPreview key={block.id} block={block} accentHex={accentHex} />
            ))
          ) : (
            <div className="p-3 rounded-xl border border-dashed border-[#262C27] text-center text-[10px] text-[#8E9690]">
              Lámina sin bloques de contenido. Añade bloques desde el editor o el arsenal.
            </div>
          )}
        </div>
      </div>

      {/* 3. Footer */}
      <div className="space-y-2 pt-1">
        <div className="h-px bg-[#1A201B] w-full" />
        <div className="flex justify-between items-center text-[9px] font-mono gap-2">
          <span className="text-[#8E9690] truncate max-w-[210px]">
            {slide.footerLeft || 'obrerayzangano.cl'}
          </span>
          <span className="font-semibold shrink-0" style={{ color: accentHex }}>
            {slide.footerRight?.trim()
              ? slide.footerRight.trim()
              : `[${String(index + 1).padStart(2, '0')} // ${String(total).padStart(2, '0')}]`}
          </span>
        </div>
      </div>
    </div>
  );
}

function RenderBlockInPreview({ block, accentHex }: { block: SlideBlock; accentHex: string }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <div className="rounded-xl border border-[#262C27] bg-[#101310] p-3 space-y-1.5 text-[9px]">
          {block.header && (
            <div
              className="text-[8.5px] font-mono tracking-wider uppercase font-semibold"
              style={{ color: accentHex }}
            >
              {block.header}
            </div>
          )}
          <div className="space-y-1 text-[#F2EEE6] opacity-90 text-[8.5px] leading-relaxed">
            {block.lines.map((line, i) => {
              // Si la línea está vacía (producida por doble enter), renderiza un espaciador de párrafo
              if (!line.trim()) {
                return <div key={i} className="h-1.5" />;
              }
              return (
                <p key={i} className="whitespace-pre-line">
                  {line}
                </p>
              );
            })}
          </div>
          {block.accentNote && (
            <div
              className="text-[8px] font-mono pt-0.5 whitespace-pre-line font-medium"
              style={{ color: accentHex }}
            >
              {block.accentNote}
            </div>
          )}
        </div>
      );

    case 'items':
      return (
        <div className="rounded-xl border border-[#262C27] bg-[#101310] p-2.5 space-y-1.5 text-[9px]">
          {block.items.map((item, idx) => (
            <div
              key={idx}
              className={idx < block.items.length - 1 ? 'border-b border-[#1A201B] pb-1' : ''}
            >
              <span
                className="font-mono text-[8px] block font-semibold"
                style={{ color: accentHex }}
              >
                {item.title}
              </span>
              <span className="text-[8.5px] text-[#F2EEE6] opacity-80 leading-tight block whitespace-pre-line">
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      );

    case 'metrics':
      return (
        <div className="rounded-xl border border-[#262C27] bg-[#101310] p-2.5 space-y-1.5 text-[9px]">
          {block.items.map((m, idx) => (
            <div
              key={idx}
              className={idx < block.items.length - 1 ? 'border-b border-[#1A201B] pb-1' : ''}
            >
              <span
                className="font-mono text-[8px] block font-semibold"
                style={{ color: accentHex }}
              >
                {m.label}
              </span>
              <span className="text-[8.5px] text-[#F2EEE6] opacity-80 leading-tight block whitespace-pre-line">
                {m.value}
              </span>
            </div>
          ))}
        </div>
      );

    case 'comparison':
      return (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-2 text-[8px]">
            {/* Izquierda */}
            <div className="p-2.5 rounded-xl bg-[#101310] border border-[#262C27] space-y-1">
              <span
                className="font-mono text-[7px] block font-semibold"
                style={{ color: accentHex }}
              >
                {block.left.tag}
              </span>
              <strong className="block font-existencial text-[11px] text-[#F2EEE6] font-semibold whitespace-pre-line">
                {block.left.title}
              </strong>
              {block.left.subtitle && (
                <span className="text-[7.5px] text-[#8E9690] block italic whitespace-pre-line">
                  {block.left.subtitle}
                </span>
              )}
              <div className="space-y-0.5 text-[#F2EEE6] opacity-80 text-[7.5px] pt-0.5">
                {block.left.lines.slice(0, 3).map((l, i) => (
                  <p key={i} className="whitespace-pre-line">
                    • {l}
                  </p>
                ))}
              </div>
            </div>

            {/* Derecha */}
            <div className="p-2.5 rounded-xl bg-[#101310] border border-[#262C27] space-y-1">
              <span
                className="font-mono text-[7px] block font-semibold"
                style={{ color: accentHex }}
              >
                {block.right.tag}
              </span>
              <strong className="block font-existencial text-[11px] text-[#F2EEE6] font-semibold whitespace-pre-line">
                {block.right.title}
              </strong>
              {block.right.subtitle && (
                <span className="text-[7.5px] text-[#8E9690] block italic whitespace-pre-line">
                  {block.right.subtitle}
                </span>
              )}
              <div className="space-y-0.5 text-[#F2EEE6] opacity-80 text-[7.5px] pt-0.5">
                {block.right.lines.slice(0, 3).map((l, i) => (
                  <p key={i} className="whitespace-pre-line">
                    • {l}
                  </p>
                ))}
              </div>
            </div>
          </div>
          {block.sharedNote && (
            <div className="text-[7px] font-mono text-center text-[#8E9690] uppercase tracking-wider whitespace-pre-line">
              {block.sharedNote}
            </div>
          )}
        </div>
      );

    case 'portal':
      return (
        <div
          className="p-3 rounded-xl border bg-[#101310] text-center space-y-1.5"
          style={{ borderColor: `${accentHex}99` }}
        >
          <div
            className="font-mono text-[12px] font-bold tracking-wider"
            style={{ color: accentHex }}
          >
            {block.url || 'obrerayzangano.cl'}
          </div>
          <div className="text-[8.5px] text-[#F2EEE6] opacity-90 leading-tight whitespace-pre-line">
            {block.subtitle}
          </div>
          {block.bullets && block.bullets.length > 0 && (
            <div className="text-left space-y-0.5 pt-1 text-[8px] text-[#8E9690]">
              {block.bullets.slice(0, 4).map((b, i) => (
                <div key={i} className="truncate">
                  • {b}
                </div>
              ))}
            </div>
          )}
          {block.callNote && (
            <div
              className="text-[8px] font-mono pt-0.5 font-semibold"
              style={{ color: accentHex }}
            >
              {block.callNote}
            </div>
          )}
        </div>
      );

    case 'quote':
      return (
        <div className="p-3 rounded-xl border border-[#262C27] bg-[#101310] space-y-1.5 text-center">
          <p className="font-existencial italic text-[13px] text-[#F2EEE6] leading-snug whitespace-pre-line">
            "{block.quote}"
          </p>
          {block.attribution && (
            <div
              className="text-[8px] font-mono uppercase tracking-wider"
              style={{ color: accentHex }}
            >
              — {block.attribution}
            </div>
          )}
        </div>
      );

    case 'qr_code':
      return (
        <div className="p-2.5 rounded-xl border border-[#262C27] bg-[#101310] flex items-center justify-between gap-2.5 text-left">
          <div className="space-y-1 min-w-0 flex-1">
            <div
              className="text-[8.5px] font-mono tracking-wider uppercase font-semibold truncate"
              style={{ color: accentHex }}
            >
              {block.title || 'CÓDIGO DE ORIGEN'}
            </div>
            <p className="text-[7.5px] text-[#8E9690] leading-tight line-clamp-2">
              {block.subtitle || 'Apunta la cámara para validar lote y registrar tu percepción.'}
            </p>
            {block.batchCode && (
              <div className="inline-block px-1.5 py-0.5 rounded text-[7px] font-mono bg-[#1A201B] text-[#D6AA5C] border border-[#262C27]">
                LOTE: {block.batchCode}
              </div>
            )}
          </div>
          <div className="shrink-0 p-1 bg-white rounded-lg border border-white/20 shadow-md flex items-center justify-center">
            <QRCode
              value={block.url || 'https://obrerayzangano.cl'}
              size={54}
              bgColor="#FFFFFF"
              fgColor="#000000"
              className="p-0 border-0 bg-transparent rounded-none"
            />
          </div>
        </div>
      );

    case 'sensorial':
      const metrics = [
        { label: 'Dulzura', val: block.sweetness },
        { label: 'Acidez', val: block.acidity },
        { label: 'Flora', val: block.flora },
        { label: 'Cuerpo', val: block.body },
      ];
      return (
        <div className="p-2.5 rounded-xl border border-[#262C27] bg-[#101310] space-y-1.5 text-left">
          <div
            className="text-[8.5px] font-mono tracking-wider uppercase font-semibold"
            style={{ color: accentHex }}
          >
            PERFIL SENSORIAL & CATA
          </div>
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-1 text-[7.5px] font-mono">
            {metrics.map((m, mi) => (
              <div key={mi} className="flex items-center justify-between gap-1">
                <span className="text-[#8E9690] truncate">{m.label}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className="w-1.5 h-1.5 rounded-[1px]"
                      style={{
                        backgroundColor: s <= m.val ? accentHex : '#1A201B',
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {block.pairingNote && (
            <div className="pt-1 border-t border-[#1A201B] text-[7.5px] italic font-existencial text-[#D6AA5C] line-clamp-2">
              {block.pairingNote}
            </div>
          )}
        </div>
      );
  }
}
