'use client';

import React from 'react';
import { cn, QRCode } from '@enjambre/ui';
import {
  type SlideData,
  type SlideBlock,
  type SlideAspectRatio,
  type SlideAlignment,
  type SlideThemeConfig,
  type SlideFontConfig,
  buildHeaderKicker,
  resolveAccentColor,
  resolveSlideTheme,
  resolveSlideFontFamily,
  resolveTitleFontWeight,
} from './slide-studio-core';

export interface SlidePreviewCardProps {
  slide: SlideData;
  index: number;
  total: number;
  className?: string;
  aspectRatio?: SlideAspectRatio;
  onSelectField?: (fieldId: string) => void;
}

export function resolveAlignmentClass(alignment?: SlideAlignment): string {
  switch (alignment) {
    case 'center':
      return 'text-center';
    case 'right':
      return 'text-right';
    case 'justify':
      return 'text-justify';
    case 'left':
    default:
      return 'text-left';
  }
}

export function SlidePreviewCard({
  slide,
  index,
  total,
  className,
  aspectRatio,
  onSelectField,
}: SlidePreviewCardProps) {
  const { left: headerLeft, right: headerRight } = buildHeaderKicker(slide);
  const { hex: accentHex } = resolveAccentColor(slide.accentColor);
  const themeConfig = resolveSlideTheme(slide.theme);
  const fontConfig = resolveSlideFontFamily(slide.fontFamily);
  const weightConfig = resolveTitleFontWeight(slide.titleWeight);
  const titleItalicClass = slide.titleItalic ? 'italic' : '';

  const alignClass = resolveAlignmentClass(slide.alignment);

  const titleSizeClasses: Record<string, string> = {
    compact: 'text-[16px] leading-[1.22]',
    normal: 'text-[19px] leading-[1.18]',
    large: 'text-[23px] leading-[1.14]',
  };
  const titleClass = titleSizeClasses[slide.titleSize ?? 'normal'] ?? 'text-[19px] leading-[1.18]';

  const effectiveRatio = aspectRatio || slide.aspectRatio || '4:5';
  const aspectClass =
    effectiveRatio === '16:9'
      ? 'aspect-video max-w-[560px]'
      : effectiveRatio === '9:16'
      ? 'aspect-[9/16] max-w-[340px]'
      : effectiveRatio === '1:1'
      ? 'aspect-square max-w-[390px]'
      : 'aspect-[4/5] max-w-[390px]';

  const interactiveClass = onSelectField
    ? 'cursor-pointer transition-all duration-150 hover:outline hover:outline-1 hover:outline-dashed hover:outline-primary/70 hover:bg-primary/5 rounded px-1 -mx-1'
    : '';

  return (
    <div
      className={cn(
        'w-full rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden select-none font-sans transition-colors duration-200',
        aspectClass,
        className,
      )}
      style={{
        backgroundColor: themeConfig.bgHex,
        borderColor: themeConfig.borderHex,
        color: themeConfig.textPrimaryHex,
      }}
    >
      {/* 1. Header & Kickers (Oculto en Marco Limpio/Zen) */}
      {!slide.cleanFrame && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[9px] font-mono tracking-wider gap-2">
            <span
              className={cn('truncate font-medium', interactiveClass)}
              style={{ color: accentHex }}
              onClick={onSelectField ? () => onSelectField('field-kickerLeft') : undefined}
              title={onSelectField ? 'Editar arista superior izquierda' : undefined}
            >
              {headerLeft}
            </span>
            <span
              className={cn('shrink-0 font-medium', interactiveClass)}
              style={{ color: themeConfig.textMutedHex }}
              onClick={onSelectField ? () => onSelectField('field-kickerRight') : undefined}
              title={onSelectField ? 'Editar arista superior derecha' : undefined}
            >
              {headerRight}
            </span>
          </div>
          {!slide.hideDividers && (
            <div className="h-px w-full" style={{ backgroundColor: themeConfig.dividerHex }} />
          )}
        </div>
      )}

      {/* 2. Contenido Central */}
      <div className="my-auto space-y-2.5 py-1.5 overflow-hidden">
        {/* Badge superior */}
        {slide.badge && (
          <div
            className={cn('text-[9px] font-mono tracking-widest uppercase', alignClass, interactiveClass)}
            style={{ color: accentHex }}
            onClick={onSelectField ? () => onSelectField('field-badge') : undefined}
            title={onSelectField ? 'Editar insignia superior' : undefined}
          >
            {slide.badge}
          </div>
        )}

        {/* Título Principal con tipografía, peso y estilo configurables */}
        <h3
          className={cn(
            fontConfig.cssClass,
            weightConfig.cssClass,
            titleItalicClass,
            titleClass,
            alignClass,
            interactiveClass,
            'whitespace-pre-line',
          )}
          style={{ color: themeConfig.textPrimaryHex }}
          onClick={onSelectField ? () => onSelectField('field-title') : undefined}
          title={onSelectField ? 'Editar título principal' : undefined}
        >
          {slide.title || 'Título de la lámina editorial'}
        </h3>

        {/* Subtítulo descriptivo con tipografía configurable */}
        {slide.subtitle && (
          <p
            className={cn(
              fontConfig.cssClass,
              'italic text-[11px] leading-snug whitespace-pre-line',
              alignClass,
              interactiveClass,
            )}
            style={{ color: themeConfig.textMutedHex }}
            onClick={onSelectField ? () => onSelectField('field-subtitle') : undefined}
            title={onSelectField ? 'Editar subtítulo descriptivo' : undefined}
          >
            {slide.subtitle}
          </p>
        )}

        {/* Bloques modulares abstractos */}
        <div className="space-y-2 pt-0.5">
          {slide.blocks && slide.blocks.length > 0 ? (
            slide.blocks.map((block: SlideBlock) => (
              <div
                key={block.id}
                className={cn(
                  'rounded-xl transition-all',
                  onSelectField &&
                    'cursor-pointer hover:ring-1 hover:ring-primary/60 hover:bg-primary/5 transition-all',
                )}
                onClick={onSelectField ? () => onSelectField(`block-${block.id}`) : undefined}
                title={onSelectField ? 'Editar bloque' : undefined}
              >
                <RenderBlockInPreview
                  block={block}
                  accentHex={accentHex}
                  themeConfig={themeConfig}
                  fontConfig={fontConfig}
                  slideAlignment={slide.alignment}
                />
              </div>
            ))
          ) : (
            <div
              className="p-3 rounded-xl border border-dashed text-center text-[10px]"
              style={{
                borderColor: themeConfig.borderHex,
                color: themeConfig.textMutedHex,
              }}
            >
              Lámina sin bloques de contenido. Añade bloques desde el editor o el arsenal.
            </div>
          )}
        </div>
      </div>

      {/* 3. Footer (Oculto en Marco Limpio/Zen) */}
      {!slide.cleanFrame && (
        <div className="space-y-2 pt-1">
          {!slide.hideDividers && (
            <div className="h-px w-full" style={{ backgroundColor: themeConfig.dividerHex }} />
          )}
          <div className="flex justify-between items-center text-[9px] font-mono gap-2">
            <span
              className={cn('truncate max-w-[210px]', interactiveClass)}
              style={{ color: themeConfig.textMutedHex }}
              onClick={onSelectField ? () => onSelectField('field-footerLeft') : undefined}
              title={onSelectField ? 'Editar pie de página izquierdo' : undefined}
            >
              {slide.footerLeft || 'obrerayzangano.cl'}
            </span>
            <span
              className={cn('font-semibold shrink-0', interactiveClass)}
              style={{ color: accentHex }}
              onClick={onSelectField ? () => onSelectField('field-footerRight') : undefined}
              title={onSelectField ? 'Editar pie de página derecho' : undefined}
            >
              {slide.footerRight?.trim()
                ? slide.footerRight.trim()
                : `[${String(index + 1).padStart(2, '0')} // ${String(total).padStart(2, '0')}]`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function RenderBlockInPreview({
  block,
  accentHex,
  themeConfig,
  fontConfig,
  slideAlignment,
}: {
  block: SlideBlock;
  accentHex: string;
  themeConfig: SlideThemeConfig;
  fontConfig: SlideFontConfig;
  slideAlignment?: SlideAlignment;
}) {
  const effectiveAlignment = ('alignment' in block && block.alignment) || slideAlignment || 'left';
  const alignClass = resolveAlignmentClass(effectiveAlignment);
  const blockScale = 'scale' in block && block.scale ? block.scale : 'normal';

  switch (block.type) {
    case 'paragraph': {
      const lineSizeClass =
        blockScale === 'compact'
          ? 'text-[7.5px] leading-snug'
          : blockScale === 'large'
          ? 'text-[10px] leading-relaxed font-medium'
          : 'text-[8.5px] leading-relaxed';
      return (
        <div
          className="rounded-xl border p-3 space-y-1.5 text-[9px]"
          style={{
            backgroundColor: themeConfig.cardHex,
            borderColor: themeConfig.borderHex,
          }}
        >
          {block.header && (
            <div
              className={cn(
                'text-[8.5px] font-mono tracking-wider uppercase font-semibold',
                alignClass,
              )}
              style={{ color: accentHex }}
            >
              {block.header}
            </div>
          )}
          <div
            className={cn('space-y-1 opacity-90', lineSizeClass, alignClass)}
            style={{ color: themeConfig.textPrimaryHex }}
          >
            {block.lines.map((line, i) => {
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
              className={cn(
                'text-[8px] font-mono pt-0.5 whitespace-pre-line font-medium',
                alignClass,
              )}
              style={{ color: accentHex }}
            >
              {block.accentNote}
            </div>
          )}
        </div>
      );
    }

    case 'items':
      return (
        <div
          className="rounded-xl border p-2.5 space-y-1.5 text-[9px]"
          style={{
            backgroundColor: themeConfig.cardHex,
            borderColor: themeConfig.borderHex,
          }}
        >
          {block.items.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                idx < block.items.length - 1 ? 'border-b pb-1' : '',
                alignClass,
              )}
              style={{
                borderColor: themeConfig.dividerHex,
              }}
            >
              <span
                className={cn('font-mono text-[8px] block font-semibold', alignClass)}
                style={{ color: accentHex }}
              >
                {item.title}
              </span>
              <span
                className={cn('text-[8.5px] opacity-80 leading-tight block whitespace-pre-line', alignClass)}
                style={{ color: themeConfig.textPrimaryHex }}
              >
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      );

    case 'metrics':
      return (
        <div
          className="rounded-xl border p-2.5 space-y-1.5 text-[9px]"
          style={{
            backgroundColor: themeConfig.cardHex,
            borderColor: themeConfig.borderHex,
          }}
        >
          {block.items.map((m, idx) => (
            <div
              key={idx}
              className={cn(
                idx < block.items.length - 1 ? 'border-b pb-1' : '',
                alignClass,
              )}
              style={{
                borderColor: themeConfig.dividerHex,
              }}
            >
              <span
                className={cn('font-mono text-[8px] block font-semibold', alignClass)}
                style={{ color: accentHex }}
              >
                {m.label}
              </span>
              <span
                className={cn('text-[8.5px] opacity-80 leading-tight block whitespace-pre-line', alignClass)}
                style={{ color: themeConfig.textPrimaryHex }}
              >
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
            <div
              className={cn('p-2.5 rounded-xl border space-y-1', alignClass)}
              style={{
                backgroundColor: themeConfig.cardHex,
                borderColor: themeConfig.borderHex,
              }}
            >
              <span
                className="font-mono text-[7px] block font-semibold"
                style={{ color: accentHex }}
              >
                {block.left.tag}
              </span>
              <strong
                className={cn('block text-[11px] font-semibold whitespace-pre-line', fontConfig.cssClass)}
                style={{ color: themeConfig.textPrimaryHex }}
              >
                {block.left.title}
              </strong>
              {block.left.subtitle && (
                <span
                  className={cn('text-[7.5px] block italic whitespace-pre-line', fontConfig.cssClass)}
                  style={{ color: themeConfig.textMutedHex }}
                >
                  {block.left.subtitle}
                </span>
              )}
              <div
                className="space-y-0.5 opacity-80 text-[7.5px] pt-0.5"
                style={{ color: themeConfig.textPrimaryHex }}
              >
                {block.left.lines.slice(0, 3).map((l, i) => (
                  <p key={i} className="whitespace-pre-line">
                    • {l}
                  </p>
                ))}
              </div>
            </div>

            {/* Derecha */}
            <div
              className={cn('p-2.5 rounded-xl border space-y-1', alignClass)}
              style={{
                backgroundColor: themeConfig.cardHex,
                borderColor: themeConfig.borderHex,
              }}
            >
              <span
                className="font-mono text-[7px] block font-semibold"
                style={{ color: accentHex }}
              >
                {block.right.tag}
              </span>
              <strong
                className={cn('block text-[11px] font-semibold whitespace-pre-line', fontConfig.cssClass)}
                style={{ color: themeConfig.textPrimaryHex }}
              >
                {block.right.title}
              </strong>
              {block.right.subtitle && (
                <span
                  className={cn('text-[7.5px] block italic whitespace-pre-line', fontConfig.cssClass)}
                  style={{ color: themeConfig.textMutedHex }}
                >
                  {block.right.subtitle}
                </span>
              )}
              <div
                className="space-y-0.5 opacity-80 text-[7.5px] pt-0.5"
                style={{ color: themeConfig.textPrimaryHex }}
              >
                {block.right.lines.slice(0, 3).map((l, i) => (
                  <p key={i} className="whitespace-pre-line">
                    • {l}
                  </p>
                ))}
              </div>
            </div>
          </div>
          {block.sharedNote && (
            <div
              className={cn('text-[7px] font-mono uppercase tracking-wider whitespace-pre-line', alignClass)}
              style={{ color: themeConfig.textMutedHex }}
            >
              {block.sharedNote}
            </div>
          )}
        </div>
      );

    case 'portal':
      return (
        <div
          className={cn('p-3 rounded-xl border space-y-1.5', alignClass)}
          style={{
            backgroundColor: themeConfig.cardHex,
            borderColor: accentHex,
          }}
        >
          <div
            className="font-mono text-[12px] font-bold tracking-wider"
            style={{ color: accentHex }}
          >
            {block.url || 'obrerayzangano.cl'}
          </div>
          <div
            className="text-[8.5px] opacity-90 leading-tight whitespace-pre-line"
            style={{ color: themeConfig.textPrimaryHex }}
          >
            {block.subtitle}
          </div>
          {block.bullets && block.bullets.length > 0 && (
            <div
              className={cn('space-y-0.5 pt-1 text-[8px]', alignClass)}
              style={{ color: themeConfig.textMutedHex }}
            >
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

    case 'quote': {
      const quoteSizeClass =
        blockScale === 'compact'
          ? 'text-[11px]'
          : blockScale === 'large'
          ? 'text-[15px]'
          : 'text-[13px]';
      return (
        <div
          className={cn('p-3 rounded-xl border space-y-1.5', alignClass)}
          style={{
            backgroundColor: themeConfig.cardHex,
            borderColor: themeConfig.borderHex,
          }}
        >
          <p
            className={cn(fontConfig.cssClass, 'italic leading-snug whitespace-pre-line', quoteSizeClass)}
            style={{ color: themeConfig.textPrimaryHex }}
          >
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
    }

    case 'qr_code':
      return (
        <div
          className={cn('p-2.5 rounded-xl border flex items-center justify-between gap-2.5', alignClass)}
          style={{
            backgroundColor: themeConfig.cardHex,
            borderColor: themeConfig.borderHex,
          }}
        >
          <div className="space-y-1 min-w-0 flex-1">
            <div
              className="text-[8.5px] font-mono tracking-wider uppercase font-semibold truncate"
              style={{ color: accentHex }}
            >
              {block.title || 'CÓDIGO DE ORIGEN'}
            </div>
            <p
              className="text-[7.5px] leading-tight line-clamp-2"
              style={{ color: themeConfig.textMutedHex }}
            >
              {block.subtitle || 'Apunta la cámara para validar lote y registrar tu percepción.'}
            </p>
            {block.batchCode && (
              <div
                className="inline-block px-1.5 py-0.5 rounded text-[7px] font-mono border"
                style={{
                  backgroundColor: themeConfig.dividerHex,
                  borderColor: themeConfig.borderHex,
                  color: accentHex,
                }}
              >
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
        <div
          className="p-2.5 rounded-xl border space-y-1.5 text-left"
          style={{
            backgroundColor: themeConfig.cardHex,
            borderColor: themeConfig.borderHex,
          }}
        >
          <div
            className="text-[8.5px] font-mono tracking-wider uppercase font-semibold"
            style={{ color: accentHex }}
          >
            PERFIL SENSORIAL & CATA
          </div>
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-1 text-[7.5px] font-mono">
            {metrics.map((m, mi) => (
              <div key={mi} className="flex items-center justify-between gap-1">
                <span className="truncate" style={{ color: themeConfig.textMutedHex }}>{m.label}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className="w-1.5 h-1.5 rounded-[1px]"
                      style={{
                        backgroundColor: s <= m.val ? accentHex : themeConfig.dividerHex,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {block.pairingNote && (
            <div
              className={cn(fontConfig.cssClass, 'pt-1 border-t text-[7.5px] italic line-clamp-2')}
              style={{
                borderTopColor: themeConfig.dividerHex,
                color: accentHex,
              }}
            >
              {block.pairingNote}
            </div>
          )}
        </div>
      );
  }
}
