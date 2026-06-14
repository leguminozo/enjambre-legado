'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  includeMargin?: boolean;
  className?: string;
  logoImage?: string;
  logoWidth?: number;
  logoHeight?: number;
}

export function QRCode({
  value,
  size = 200,
  bgColor = 'transparent',
  fgColor = 'currentColor',
  includeMargin = false,
  className,
  logoImage,
  logoWidth,
  logoHeight,
}: QRCodeProps) {
  return (
    <div className={`flex items-center justify-center p-4 bg-card border border-border rounded-xl ${className ?? ''}`}>
      <QRCodeSVG
        value={value}
        size={size}
        bgColor={bgColor}
        fgColor={fgColor}
        includeMargin={includeMargin}
        imageSettings={
          logoImage
            ? {
                src: logoImage,
                x: undefined,
                y: undefined,
                height: logoHeight ?? 24,
                width: logoWidth ?? 24,
                excavate: true,
              }
            : undefined
        }
      />
    </div>
  );
}
