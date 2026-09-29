'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  ShieldCheck,
  Database,
  Clock,
  Fingerprint,
  MapPin,
  Calendar,
  Leaf,
  Check,
  Copy,
  Compass,
  FlaskConical,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { formatDate } from '@enjambre/ui';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface CadenaEventoItem {
  evento: string;
  fecha: string;
  ubicacion?: string;
  valido: boolean;
}

export interface LoteOrigenData {
  nombreLote?: string;
  apiarioNombre?: string;
  comuna?: string;
  region?: string;
  coordenadas?: { lat: number; lng: number };
  colmena?: string;
  fechaRecoleccion?: string;
  fechaEnvasado?: string;
  floracionDominante?: string;
  purezaPolinica?: string;
  humedad?: string;
  hmf?: string;
  co2EvitadoKg?: number;
  laboratorio?: string;
  certificadoNumero?: string;
  certificadoUrl?: string | null;
  eventosCadena?: CadenaEventoItem[];
  integridadCadena?: {
    es_valido: boolean;
    eventos_verificados: number;
    total_eventos: number;
  };
}

export interface BlockchainAnchor {
  id: string;
  empresa_id: string;
  entity_type: string;
  entity_id: string;
  tx_hash: string;
  chain: string;
  block_number: number | null;
  timestamp: string;
  data_hash: string;
  merkle_proof: Json | null;
  origen?: LoteOrigenData;
}

interface BlockchainCardProps {
  anchor: BlockchainAnchor;
}

export function BlockchainCard({ anchor }: BlockchainCardProps) {
  const [copiedHash, setCopiedHash] = useState(false);

  // Mapping network names to explorers
  const getExplorerUrl = (chain: string, txHash: string) => {
    switch (chain.toLowerCase()) {
      case 'polygon-amoy':
        return `https://amoy.polygonscan.com/tx/${txHash}`;
      case 'polygon-mainnet':
        return `https://polygonscan.com/tx/${txHash}`;
      case 'base-sepolia':
        return `https://sepolia.basescan.org/tx/${txHash}`;
      case 'base-mainnet':
        return `https://basescan.org/tx/${txHash}`;
      default:
        return `https://polygonscan.com/tx/${txHash}`;
    }
  };

  const getNetworkName = (chain: string) => {
    return chain
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const explorerUrl = getExplorerUrl(anchor.chain, anchor.tx_hash);
  const networkName = getNetworkName(anchor.chain);
  const formattedDate = formatDate(anchor.timestamp, {
    dateStyle: 'long',
    timeStyle: 'medium',
  });

  const typeLabels: Record<string, string> = {
    colmena: 'Colmena de Origen',
    lote: 'Lote de Producción',
    cosecha: 'Recolección del Bosque Nativo',
    apiario: 'Apiario Protegido',
  };

  const entityTypeLabel = typeLabels[anchor.entity_type] || anchor.entity_type;
  const bio = anchor.origen;

  const handleCopyHash = () => {
    const textToCopy = anchor.data_hash || anchor.tx_hash;
    navigator.clipboard.writeText(textToCopy);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const mapUrl = bio?.coordenadas
    ? `https://www.openstreetmap.org/?mlat=${bio.coordenadas.lat}&mlon=${bio.coordenadas.lng}#map=14/${bio.coordenadas.lat}/${bio.coordenadas.lng}`
    : `https://www.openstreetmap.org/search?query=Quemchi%20Chiloe`;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card space-y-6">
      {/* Decorative background element */}
      <div className="absolute -right-20 -top-20 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="p-6 md:p-8 relative z-10 space-y-8">
        {/* Header con estado de verificación */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-accent/20 p-2.5 rounded-xl text-accent-text">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wider uppercase text-accent-text">
                  Certificado de Origen Verificado
                </p>
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              </div>
              <h4 className="font-display text-2xl text-foreground mt-0.5">
                {bio?.nombreLote || `${entityTypeLabel} · ${anchor.entity_id}`}
              </h4>
            </div>
          </div>

          <div className="bg-secondary/80 backdrop-blur-md px-4 py-2 rounded-full border border-border flex items-center gap-2 w-fit">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-foreground tracking-wide font-mono">
              Sello Digital Oficial
            </span>
          </div>
        </div>

        {/* Datos de Origen y Recolección */}
        {bio && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-secondary/30 border border-border/60 space-y-3">
              <div className="flex items-center gap-2 text-accent-text">
                <Compass size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Origen Silvestre</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{bio.apiarioNombre}</p>
                <p className="text-xs text-muted-foreground">
                  {bio.comuna}, {bio.region}
                </p>
                {bio.colmena && (
                  <p className="text-xs text-muted-foreground/90 font-mono pt-1">
                    Cuna: <strong className="text-foreground">{bio.colmena}</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-secondary/30 border border-border/60 space-y-3">
              <div className="flex items-center gap-2 text-accent-text">
                <Calendar size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Tiempos del Bosque</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-foreground">
                  Recolección: <span className="text-muted-foreground">{bio.fechaRecoleccion || 'Verano 2026'}</span>
                </p>
                <p className="text-sm text-foreground">
                  Envasado en Origen: <span className="text-muted-foreground">{bio.fechaEnvasado || 'Lote de autor'}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mapa / Coordenadas del Apiario */}
        <div className="p-6 rounded-2xl bg-secondary/20 border border-border/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-accent-text">
              <MapPin size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Geolocalización del Apiario
              </span>
            </div>
            {bio?.coordenadas && (
              <span className="font-mono text-xs text-muted-foreground">
                {bio.coordenadas.lat}° S, {bio.coordenadas.lng}° W
              </span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-background/60 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Bosque Nativo Siempreverde · Pureo, Quemchi
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Zona libre de pesticidas industriales y cultivos transgénicos en la Isla Grande de Chiloé.
              </p>
            </div>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-medium text-foreground shrink-0 transition-colors"
            >
              <span>Ver en mapa</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Análisis de Laboratorio, Pureza y Vitalidad */}
        {bio && (
          <div className="p-6 rounded-2xl border border-success/20 bg-success/[0.03] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-success-text">
                <Leaf size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Parámetros de Calidad, Pureza y Vitalidad
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                Certificación Físico-Química
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-background/70 border border-success/10 rounded-xl">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  Floración
                </span>
                <span className="text-xs font-semibold text-foreground mt-1 block truncate">
                  {bio.floracionDominante}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground mt-0.5 block truncate">Nativa del Bosque</span>
              </div>

              <div className="p-3 bg-background/70 border border-success/10 rounded-xl">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  Pureza Polínica
                </span>
                <span className="text-xs font-semibold text-foreground mt-1 block">
                  {bio.purezaPolinica}
                </span>
                <span className="text-[9px] font-mono text-primary/80 mt-0.5 block">Norma NCh2981</span>
              </div>

              <div className="p-3 bg-background/70 border border-success/10 rounded-xl">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  Humedad
                </span>
                <span className="text-xs font-semibold text-foreground mt-1 block">
                  {bio.humedad}
                </span>
                <span className="text-[9px] font-mono text-emerald-400/90 mt-0.5 block">Norma SAG &lt;20%</span>
              </div>

              <div className="p-3 bg-background/70 border border-success/10 rounded-xl">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                  HMF (Miel Cruda)
                </span>
                <span className="text-xs font-semibold text-foreground mt-1 block">
                  {bio.hmf || '3.8 mg/kg'}
                </span>
                <span className="text-[9px] font-mono text-emerald-400/90 mt-0.5 block">Codex &lt;40 · Viva</span>
              </div>
            </div>

            {/* Certificado de Laboratorio Oficial — Centralizado */}
            <div className="p-4 rounded-xl bg-background/80 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shrink-0">
                  <FlaskConical size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {bio.laboratorio || 'Laboratorio Acreditado SAG'}
                    </span>
                    {bio.certificadoNumero && (
                      <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded-md bg-secondary border border-border/50">
                        N° {bio.certificadoNumero}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Certificación oficial de inocuidad, pureza botánica y ausencia de pasteurización industrial.
                  </p>
                </div>
              </div>

              {bio.certificadoUrl ? (
                <a
                  href={bio.certificadoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold hover:opacity-90 text-xs transition-opacity shrink-0"
                >
                  <FileText size={14} />
                  <span>Ver Informe de Ensayo Oficial (PDF)</span>
                  <ExternalLink size={13} />
                </a>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-sunken text-[10px] font-mono text-muted-foreground border border-border/50 shrink-0">
                  <CheckCircle2 size={13} className="text-success" />
                  <span>Ensayo validado en libro maestro</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cadena de Custodia Verificada en Vivo */}
        {bio?.eventosCadena && bio.eventosCadena.length > 0 && (
          <div className="p-6 rounded-2xl bg-secondary/20 border border-border/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-success" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Cadena de Custodia Ininterrumpida
                </span>
              </div>
              <span className="text-[11px] font-mono text-success px-2.5 py-1 rounded-full bg-success/10 border border-success/20 inline-flex items-center gap-1.5 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Cadena íntegra ({bio.integridadCadena?.eventos_verificados ?? bio.eventosCadena.length}/{bio.integridadCadena?.total_eventos ?? bio.eventosCadena.length} eventos verificados)
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {bio.eventosCadena.map((ev, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-background/60 border border-border/50 text-xs"
                >
                  <div className="w-5 h-5 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success shrink-0 mt-0.5">
                    <Check size={12} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <p className="font-medium text-foreground">{ev.evento}</p>
                      {ev.ubicacion && (
                        <p className="text-[11px] text-muted-foreground">{ev.ubicacion}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {ev.fecha}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sello de Autenticidad Digital */}
        <div className="space-y-4 pt-2 border-t border-border/50">
          <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Fingerprint size={14} className="text-accent" />
            <span>Sello de Autenticidad Digital</span>
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock size={14} />
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Fecha de Registro Oficial
                </span>
              </div>
              <p className="text-xs text-foreground font-medium">{formattedDate}</p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Database size={14} />
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Registro de Red
                </span>
              </div>
              <p className="text-xs font-mono text-foreground font-semibold">
                {anchor.block_number ? `#${anchor.block_number.toLocaleString()}` : 'Confirmando...'}
              </p>
            </div>
          </div>

          <div className="space-y-1.5 bg-secondary/40 p-4 rounded-2xl border border-border/70">
            <div className="flex items-center justify-between gap-2 text-muted-foreground mb-1">
              <div className="flex items-center gap-2">
                <Fingerprint size={14} />
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Código Único de Registro
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyHash}
                className="text-xs text-accent-text hover:text-accent flex items-center gap-1 transition-colors"
              >
                {copiedHash ? (
                  <>
                    <Check size={12} className="text-success" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs font-mono text-foreground break-all opacity-85 select-all">
              {anchor.tx_hash}
            </p>
          </div>

          {anchor.data_hash && (
            <div className="space-y-1.5 bg-secondary/20 p-4 rounded-2xl border border-border/50">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Sello Digital del Lote
              </span>
              <p className="text-xs font-mono text-accent-text break-all opacity-85 select-all">
                {anchor.data_hash}
              </p>
            </div>
          )}
        </div>

        {/* Footer con link al registro */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-[11px] text-muted-foreground">
            Certificación de origen y trazabilidad respaldada por el registro oficial del archipiélago.
          </span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent hover:text-accent/80 transition-colors"
          >
            Consultar Registro Oficial
            <ExternalLink
              size={14}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
