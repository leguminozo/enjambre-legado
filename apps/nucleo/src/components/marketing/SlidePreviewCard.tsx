'use client';

import React from 'react';
import { type SlideData, type SlideBlock, buildHeaderKicker } from './slide-studio-core';

export interface SlidePreviewCardProps {
  slide: SlideData;
  index: number;
  total: number;
  className?: string;
}

export function SlidePreviewCard({ slide, index, total, className }: SlidePreviewCardProps) {
  const { left: headerLeft, right: headerRight } = buildHeaderKicker(slide);

  return (
    <div
      className={`w-full max-w-[390px] aspect-[4/5] rounded-2xl border border-[#262C27] bg-[#0A0B0A] text-[#F2EEE6] p-4 sm:p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden select-none font-sans ${
        className ?? ''
      }`}
    >
      {/* 1. Header & Kickers */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[9px] font-mono tracking-wider gap-2">
          <span className="text-[#D6AA5C] truncate font-medium">
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
          <div className="text-[9px] font-mono text-[#D6AA5C] tracking-widest uppercase">
            {slide.badge}
          </div>
        )}

        {/* Título Principal en Cormorant Garamond */}
        <h3 className="font-existencial text-[19px] leading-[1.18] font-semibold text-[#F2EEE6]">
          {slide.title || 'Título de la lámina editorial'}
        </h3>

        {/* Subtítulo descriptivo */}
        {slide.subtitle && (
          <p className="font-existencial italic text-[11px] leading-snug text-[#8E9690]">
            {slide.subtitle}
          </p>
        )}

        {/* Bloques modulares abstractos */}
        <div className="space-y-2 pt-0.5">
          {slide.blocks && slide.blocks.length > 0 ? (
            slide.blocks.map((block: SlideBlock) => (
              <RenderBlockInPreview key={block.id} block={block} />
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
        <div className="flex justify-between items-center text-[9px] font-mono">
          <span className="text-[#8E9690]">{slide.footerLeft || 'obrerayzangano.cl'}</span>
          <span className="text-[#D6AA5C] font-semibold">
            [{String(index + 1).padStart(2, '0')} // {String(total).padStart(2, '0')}]
          </span>
        </div>
      </div>
    </div>
  );
}

function RenderBlockInPreview({ block }: { block: SlideBlock }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <div className="rounded-xl border border-[#262C27] bg-[#101310] p-3 space-y-1.5 text-[9px]">
          {block.header && (
            <div className="text-[8.5px] font-mono text-[#D6AA5C] tracking-wider uppercase font-semibold">
              {block.header}
            </div>
          )}
          <div className="space-y-0.5 text-[#F2EEE6] opacity-90 text-[8.5px] leading-relaxed">
            {block.lines.filter((l) => l.trim().length > 0).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          {block.accentNote && (
            <div className="text-[8px] font-mono text-[#D6AA5C] pt-0.5">
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
              <span className="font-mono text-[#D6AA5C] text-[8px] block font-semibold">
                {item.title}
              </span>
              <span className="text-[8.5px] text-[#F2EEE6] opacity-80 leading-tight block">
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
              <span className="font-mono text-[#D6AA5C] text-[8px] block font-semibold">
                {m.label}
              </span>
              <span className="text-[8.5px] text-[#F2EEE6] opacity-80 leading-tight block">
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
              <span className="text-[#D6AA5C] font-mono text-[7px] block font-semibold">
                {block.left.tag}
              </span>
              <strong className="block font-existencial text-[11px] text-[#F2EEE6] font-semibold">
                {block.left.title}
              </strong>
              {block.left.subtitle && (
                <span className="text-[7.5px] text-[#8E9690] block italic">
                  {block.left.subtitle}
                </span>
              )}
              <div className="space-y-0.5 text-[#F2EEE6] opacity-80 text-[7.5px] pt-0.5">
                {block.left.lines.slice(0, 3).map((l, i) => (
                  <p key={i}>• {l}</p>
                ))}
              </div>
            </div>

            {/* Derecha */}
            <div className="p-2.5 rounded-xl bg-[#101310] border border-[#262C27] space-y-1">
              <span className="text-[#D6AA5C] font-mono text-[7px] block font-semibold">
                {block.right.tag}
              </span>
              <strong className="block font-existencial text-[11px] text-[#F2EEE6] font-semibold">
                {block.right.title}
              </strong>
              {block.right.subtitle && (
                <span className="text-[7.5px] text-[#8E9690] block italic">
                  {block.right.subtitle}
                </span>
              )}
              <div className="space-y-0.5 text-[#F2EEE6] opacity-80 text-[7.5px] pt-0.5">
                {block.right.lines.slice(0, 3).map((l, i) => (
                  <p key={i}>• {l}</p>
                ))}
              </div>
            </div>
          </div>
          {block.sharedNote && (
            <div className="text-[7px] font-mono text-center text-[#8E9690] uppercase tracking-wider">
              {block.sharedNote}
            </div>
          )}
        </div>
      );

    case 'portal':
      return (
        <div className="p-3 rounded-xl border border-[#D6AA5C]/60 bg-[#101310] text-center space-y-1.5">
          <div className="font-mono text-[12px] text-[#D6AA5C] font-bold tracking-wider">
            {block.url || 'obrerayzangano.cl'}
          </div>
          <div className="text-[8.5px] text-[#F2EEE6] opacity-90 leading-tight">
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
            <div className="text-[8px] font-mono text-[#D6AA5C] pt-0.5 font-semibold">
              {block.callNote}
            </div>
          )}
        </div>
      );

    case 'quote':
      return (
        <div className="p-3 rounded-xl border border-[#262C27] bg-[#101310] space-y-1.5 text-center">
          <p className="font-existencial italic text-[13px] text-[#F2EEE6] leading-snug">
            "{block.quote}"
          </p>
          {block.attribution && (
            <div className="text-[8px] font-mono text-[#D6AA5C] uppercase tracking-wider">
              — {block.attribution}
            </div>
          )}
        </div>
      );
  }
}
