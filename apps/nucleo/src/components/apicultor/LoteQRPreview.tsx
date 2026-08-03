'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '@enjambre/ui';
import { QrCode, Copy, Check, ExternalLink } from 'lucide-react';

interface LoteQRPreviewProps {
  loteId: string;
  lotePublico: boolean;
}

export function LoteQRPreview({ loteId, lotePublico }: LoteQRPreviewProps) {
  const [copied, setCopied] = useState(false);
  
  // URL absoluta para el QR (asumiendo que estamos en el mismo dominio o usando localhost para dev)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const publicUrl = `${baseUrl}/lote/${loteId}`;
  
  // Usamos un servicio externo gratuito para generar la imagen del QR para no sumar dependencias
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-card border-border overflow-hidden max-w-sm w-full mx-auto">
      <div className="bg-surface-raised p-6 flex flex-col items-center justify-center border-b border-border">
        {lotePublico ? (
          <div className="bg-white p-4 rounded-xl shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={qrImageUrl} 
              alt="QR del Lote" 
              className="w-48 h-48 object-contain"
            />
          </div>
        ) : (
          <div className="w-48 h-48 bg-background border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
            <QrCode className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">El lote debe estar marcado como público para generar el QR</p>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Pasaporte Público</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${lotePublico ? 'bg-primary/10 text-primary' : 'bg-surface-sunken text-muted-foreground'}`}>
            {lotePublico ? 'Activo' : 'Inactivo'}
          </span>
        </CardTitle>
        <CardDescription>
          Este código conecta el lote comercial con el cliente final.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex gap-2">
          <div className="flex-1 bg-surface-sunken border border-border rounded-md px-3 py-2 text-xs font-mono text-muted-foreground truncate flex items-center">
            {publicUrl}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopy}
            disabled={!lotePublico}
            className="shrink-0 w-11 px-0"
          >
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        
        <Button 
          className="w-full mt-4" 
          variant={lotePublico ? 'primary' : 'outline'}
          disabled={!lotePublico}
          onClick={() => window.open(publicUrl, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Ver página pública
        </Button>
      </CardContent>
    </Card>
  );
}
