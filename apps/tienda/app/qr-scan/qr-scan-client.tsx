'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { HexagonLoader, formatCalendarDate } from '@enjambre/ui';
import {
  QrCode,
  ScanLine,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Award,
  Wallet,
  Leaf,
  ArrowRight,
  ArrowUpRight,
  Star,
  RotateCcw,
} from 'lucide-react';
import { type QrScanSettings, resolveLocalized } from '@enjambre/shop-chrome';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { QrCameraScanner } from '@/components/shop/qr-camera-scanner';
import { getNucleoApiUrl } from '@/lib/shop/nucleo-url';

type AuditEvent = {
  evento: string;
  ubicacion: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
  hash: string | null;
  valido: boolean;
};

type QRData = {
  codigo: string;
  fecha_produccion: string;
  lote_id: string | null;
  producto: { id: string; nombre: string } | null;
  apiario: { id: string; nombre: string } | null;
  integridad: {
    es_valido: boolean;
    eventos_verificados: number;
    total_eventos: number;
  };
  eventos: AuditEvent[];
};

export interface QRScanClientProps {
  settings: QrScanSettings;
}

export function QRScanClient({ settings }: QRScanClientProps) {
  const locale = useLocale();
  const title = resolveLocalized(settings.title, settings.title_en, locale);
  const subtitle = resolveLocalized(settings.subtitle, settings.subtitle_en, locale);
  const searchLabel = resolveLocalized(settings.search_label, settings.search_label_en, locale);
  const searchButtonLabel = resolveLocalized(settings.search_button_label, settings.search_button_label_en, locale);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScan = useCallback(async (code: string) => {
    const raw = code.trim();
    if (!raw) return;

    // Los QRs pueden ser URLs: el pasaporte de nucleo (/lote/:id) o el PDP de la
    // tienda (/producto/:slug). Resolver redirigiendo al destino correcto.
    try {
      const url = new URL(raw);
      const loteMatch = raw.match(/\/lote\/([0-9a-f-]{36})/i);
      if (loteMatch) {
        const nucleo = getNucleoApiUrl();
        if (nucleo) {
          window.location.href = `${nucleo}/lote/${loteMatch[1]}`;
          return;
        }
      }
      const productoMatch = raw.match(/\/producto\/([^/?#]+)/);
      if (productoMatch) {
        window.location.href = `/producto/${productoMatch[1]}`;
        return;
      }
      if (url.origin === window.location.origin) {
        window.location.href = url.pathname;
        return;
      }
    } catch {
      // No es una URL: es un código plano.
    }

    setLoading(true);
    setError(null);
    setQrData(null);

    try {
      // Single source: el pasaporte verificado de nucleo (recomputa SHA-256 por
      // evento). Antes se leía qr_codes/qr_audit_trail directo con cliente anon
      // (sin verificación de integridad y con RLS que bloqueaba qr_codes).
      const nucleo = getNucleoApiUrl();
      if (!nucleo) {
        setError('No se pudo conectar con el servicio de trazabilidad');
        return;
      }
      const res = await fetch(`${nucleo}/api/trazabilidad/qr/${encodeURIComponent(raw)}`);
      if (!res.ok) {
        setError('Código QR no encontrado o inactivo');
        return;
      }
      const json = await res.json();
      setQrData(json.data);
    } catch (err) {
      console.error('Error scanning QR:', err);
      setError('Error al escanear código QR');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code')?.trim();
    if (code) void handleScan(code);
  }, [handleScan]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan(qrCode);
    }
  };

  const getEventIcon = (evento: string) => {
    switch (evento) {
      case 'creado':
        return <Package size={16} className="text-accent" />;
      case 'escaneado':
        return <ScanLine size={16} className="text-info" />;
      case 'enviado':
        return <MapPin size={16} className="text-warning" />;
      case 'entregado':
        return <CheckCircle2 size={16} className="text-success" />;
      default:
        return <Clock size={16} className="text-muted-foreground" />;
    }
  };

  const getEventLabel = (evento: string) => {
    const labels: Record<string, string> = {
      creado: 'Creado',
      escaneado: 'Escaneado',
      enviado: 'Enviado',
      entregado: 'Entregado',
      devuelto: 'Devuelto',
      reportado: 'Reportado',
    };
    return labels[evento] || evento;
  };

  const formatValidDesc = (template: string, verificados: number, total: number) => {
    if (template.includes('{verificados}') || template.includes('{total}')) {
      return template.replace('{verificados}', String(verificados)).replace('{total}', String(total));
    }
    return `${verificados} de ${total} ${template}`;
  };

  return (
    <StoreShell>
      <ShopHeader />
      <main
        data-cms-section="qr_scan_settings"
        className="min-h-[60vh] bg-background pb-16"
      >
        <div className="border-b border-border px-4 pt-[max(2.5rem,calc(var(--safe-top)+1.25rem))] pb-10 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 shrink-0 rounded-full bg-accent/10 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-accent" />
              </div>
              <h1 className="font-display text-[clamp(1.75rem,6vw,2.25rem)] sm:text-4xl font-semibold text-foreground text-balance">
                {title}
              </h1>
            </div>
            <p className="text-muted-foreground text-pretty">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="space-y-6">
            <QrCameraScanner onScan={handleScan} disabled={loading} />

            <div className="rounded-xl border border-border bg-card/40 p-6">
              <label className="block text-sm font-medium text-foreground mb-2" htmlFor="qr-manual-code">
                {searchLabel}
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <input
                  ref={inputRef}
                  id="qr-manual-code"
                  type="text"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={settings.search_placeholder}
                  className="flex-1 min-h-11 rounded-lg border border-border bg-surface px-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleScan(qrCode)}
                  disabled={loading || !qrCode.trim()}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <HexagonLoader size="sm" /> : searchButtonLabel}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {!qrData && !loading && (
              <div className="rounded-2xl border border-border/80 bg-card/60 p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-medium text-foreground">
                      El Poder de tu Frasco en el Ecosistema
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Cada frasco físico de miel nativa es una llave viva al vínculo y origen territorial
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-surface-sunken/60 border border-border/40 space-y-2">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <ShieldCheck className="w-4 h-4 text-accent" />
                      <span>Sello de Autenticidad</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Origen trazable hasta el apiario específico en Chiloé (Pureo / Piuchén) y fecha exacta de recolección.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-sunken/60 border border-border/40 space-y-2">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <Wallet className="w-4 h-4 text-accent" />
                      <span>Acredita a tu Billetera</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Suma sellos en tu Pase Digital de Guardián y expande tus metros cuadrados de bosque nativo protegido.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-sunken/60 border border-border/40 space-y-2">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <Leaf className="w-4 h-4 text-accent" />
                      <span>Pureza Polínica</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Verifica la concentración melisopalinológica de Ulmo, Tiaca o flora nativa sin pasteurización ni aditivos.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <Link
                    href="/perfil/trazabilidad"
                    className="inline-flex items-center gap-1.5 text-accent hover:underline font-mono uppercase tracking-wider text-[11px]"
                  >
                    <span>Ver Certificado de Origen</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/perfil/billetera"
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>Abrir mi Billetera</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {qrData && (
              <div className="space-y-6 animate-in">
                {/* Banner de Vinculación y Protección */}
                <div className="rounded-2xl border border-accent/40 bg-accent/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-mono uppercase tracking-wider text-accent font-medium">
                      Frasco Verificado · Ecosistema Chiloé
                    </p>
                    <p className="text-sm text-foreground">
                      Vincula este lote con tu Billetera de Guardián para sumar sellos de formato y m² de bosque protegido.
                    </p>
                  </div>
                  <Link
                    href="/perfil/billetera"
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2 text-xs font-medium uppercase tracking-wider hover:bg-foreground/90 transition-colors shrink-0"
                  >
                    <span>Registrar en Billetera</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Integridad de la trazabilidad de origen */}
                <div className={`rounded-xl border p-6 ${qrData.integridad.es_valido ? 'border-success/40 bg-success/5' : 'border-destructive/50 bg-destructive/5'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    {qrData.integridad.es_valido ? (
                      <ShieldCheck className="h-6 w-6 text-success-text" />
                    ) : (
                      <ShieldAlert className="h-6 w-6 text-destructive" />
                    )}
                    <h2 className="font-display text-lg text-foreground">
                      {qrData.integridad.es_valido ? settings.valid_title : settings.invalid_title}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {qrData.integridad.es_valido
                      ? formatValidDesc(settings.valid_desc, qrData.integridad.eventos_verificados, qrData.integridad.total_eventos)
                      : settings.invalid_desc}
                  </p>
                  {qrData.lote_id && (
                    <a
                      href={`${getNucleoApiUrl()}/lote/${qrData.lote_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent-text hover:underline"
                    >
                      Ver pasaporte completo del frasco
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>

                {/* Product info */}
                <div className="rounded-xl border border-border bg-card/40 p-6">
                  <h2 className="font-display text-lg text-foreground mb-4">Información del Producto</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Código QR</p>
                      <p className="font-medium text-foreground">{qrData.codigo}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Producto</p>
                      <p className="font-medium text-foreground">{qrData.producto?.nombre || 'Producto desconocido'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Lote</p>
                      <p className="font-medium text-foreground">{qrData.lote_id || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Fecha de Producción</p>
                      <p className="font-medium text-foreground">{formatCalendarDate(qrData.fecha_produccion)}</p>
                    </div>
                    {qrData.apiario && (
                      <div>
                        <p className="text-muted-foreground mb-1">Apiario</p>
                        <p className="font-medium text-foreground">{qrData.apiario.nombre}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Audit trail */}
                <div className="rounded-xl border border-border bg-card/40 p-6">
                  <h2 className="font-display text-lg text-foreground mb-4">Historial de Trazabilidad</h2>
                  {qrData.eventos.length > 0 ? (
                    <div className="space-y-3">
                      {qrData.eventos.map((event, index) => (
                        <div
                          key={`${event.evento}-${index}`}
                          className="flex items-start gap-3 p-3 rounded-lg bg-surface-sunken border border-border"
                        >
                          <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shrink-0 mt-0.5">
                            {getEventIcon(event.evento)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-foreground">{getEventLabel(event.evento)}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.created_at).toLocaleString('es-CL')}
                              </p>
                            </div>
                            {event.ubicacion && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin size={12} />
                                {event.ubicacion}
                              </p>
                            )}
                            <p className={`text-xs mt-1 flex items-center gap-1 ${event.valido ? 'text-success-text' : 'text-destructive'}`}>
                              {event.valido ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                              {event.valido ? 'Integridad verificada' : 'Registro no coincide'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <Clock size={32} className="mx-auto mb-2 opacity-50" />
                      Sin eventos registrados
                    </div>
                  )}
                </div>

                {/* Acciones de Valor: Huella Sensorial y Retorno Circular */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="rounded-xl border border-border/70 bg-card/40 p-5 flex flex-col justify-between backdrop-blur-sm">
                    <div>
                      <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center mb-3">
                        <Star size={16} />
                      </div>
                      <h3 className="font-display text-base font-semibold text-foreground">
                        Huella Sensorial & Cata
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        ¿Degustaste esta recolección? Registra tus notas de cata y aromas para recibir 500 puntos de lealtad en tu Billetera.
                      </p>
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/cata/${encodeURIComponent(qrData.codigo)}`}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <span>Iniciar Cata Sensorial</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-card/40 p-5 flex flex-col justify-between backdrop-blur-sm">
                    <div>
                      <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center mb-3">
                        <RotateCcw size={16} />
                      </div>
                      <h3 className="font-display text-base font-semibold text-foreground">
                        Economía Circular del Envase
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        Conserva este frasco limpio. Al terminar tu miel, retórnalo en feria o despacho y recibe 500 puntos por envase.
                      </p>
                    </div>
                    <div className="mt-4">
                      <Link
                        href="/perfil/circular"
                        className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border border-border bg-surface-raised px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-raised/80 transition-colors"
                      >
                        <span>Ver Protocolo de Retorno</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
