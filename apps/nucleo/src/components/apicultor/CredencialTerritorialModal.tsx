'use client';

import { Award, Printer, X, ShieldCheck, CheckCircle2, MapPin } from 'lucide-react';
import { QRCode } from '@enjambre/ui';
import { getTerritorialCredential, territorialRolLabel } from '@/lib/territorial-rol';
import { formatearRUT } from '@/lib/rut';
import { resolveComunaChiloe } from '@/lib/chiloe-comunas';

export interface CredencialActor {
  id: string;
  nombre_actor: string;
  rol: string;
  comuna: string;
  region?: string | null;
  rut?: string | null;
  rup?: string | null;
  nivel_acreditacion?: string;
  estado: string;
  completo?: boolean | null;
}

interface CredencialTerritorialModalProps {
  actor: CredencialActor;
  isOpen: boolean;
  onClose: () => void;
}

export function CredencialTerritorialModal({
  actor,
  isOpen,
  onClose,
}: CredencialTerritorialModalProps) {
  if (!isOpen) return null;

  const credential = getTerritorialCredential(actor.nivel_acreditacion);
  const codigoRegistro = `RTA-CL-${actor.id.slice(0, 8).toUpperCase()}`;
  const resolvedComuna = resolveComunaChiloe(actor.comuna);
  const verificationUrl = resolvedComuna
    ? `https://www.registroapicolachiloe.me/comuna/${resolvedComuna.slug}`
    : `https://www.registroapicolachiloe.me/mapa-chiloe`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      {/* Estilos específicos para impresión de credencial en formato certificado A4/Letter */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #credencial-territorial-print,
          #credencial-territorial-print * {
            visibility: visible !important;
          }
          #credencial-territorial-print {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 100% !important;
            max-width: 650px !important;
            padding: 32px !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: 2px solid #000000 !important;
            border-radius: 12px !important;
            box-shadow: none !important;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}</style>

      <div
        id="credencial-territorial-print"
        className="card max-w-xl w-full p-6 sm:p-8 space-y-6 bg-card border border-border rounded-2xl shadow-2xl text-left relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fondo sutil decorativo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 print:hidden" />

        {/* Encabezado */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                Archipiélago de Chiloé · Región de Los Lagos
              </p>
              <h2 className="font-existencial text-lg sm:text-xl font-bold text-foreground tracking-tight">
                Registro Territorial Apícola
              </h2>
              <p className="text-xs text-muted-foreground">
                Sello de Autenticidad & Padrón Comunitario de Polinizadores
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors print:hidden"
            aria-label="Cerrar credencial"
          >
            <X size={20} />
          </button>
        </div>

        {/* Bloque Central de Identidad */}
        <div className="p-4 sm:p-5 rounded-xl bg-surface-sunken border border-border space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Titular Acreditado
              </span>
              <p className="text-base sm:text-lg font-bold text-foreground">
                {actor.nombre_actor}
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs text-primary font-medium mt-0.5">
                <CheckCircle2 size={13} className="text-success" />
                {territorialRolLabel(actor.rol)}
              </span>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground tracking-wider block">
                Código de Registro
              </span>
              <span className="font-mono text-sm font-bold text-foreground">
                {codigoRegistro}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-border/60 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">RUT</span>
              <span className="font-medium text-foreground">
                {actor.rut ? formatearRUT(actor.rut) : 'No informado'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">RUP SAG</span>
              <span className="font-medium text-foreground">
                {actor.rup || 'En trámite oficial'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Comuna Base</span>
              <span className="font-medium text-foreground flex items-center gap-1">
                <MapPin size={11} className="text-primary shrink-0" />
                {actor.comuna}
              </span>
            </div>
          </div>
        </div>

        {/* Nivel de Acreditación y QR de Verificación */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2.5 py-1 rounded-full uppercase tracking-wide font-bold ${credential.className}`}
              >
                Nivel {credential.label}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {actor.completo ? 'Censo al día' : 'Censo en proceso'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {credential.desc}
            </p>
            <div className="p-2.5 rounded-lg bg-surface-raised border border-border text-[11px] text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-primary" />
                <span>Anonimización Espacial Comunitaria:</span>
              </p>
              <p>
                Las coordenadas de pecoreo se resguardan bajo radio difuso de ~2 km en la red comunitaria y macro-cuencas comunales en el mapa público para cautelar la sanidad y prevenir el abigeato apícola (Ley N° 21.719).
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface-raised border border-border text-center space-y-1.5">
            <div className="p-1.5 bg-background rounded-lg border border-border">
              <QRCode value={verificationUrl} size={84} />
            </div>
            <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
              Verificar Comuna
            </span>
          </div>
        </div>

        {/* Deslinde Legal */}
        <p className="text-[10px] text-muted-foreground/80 leading-relaxed border-t border-border pt-3">
          Inscripción voluntaria bajo el amparo de la <strong>Ley N° 21.489</strong> (Protección y Fomento del Desarrollo Apícola) y competencias de fomento rural de la <strong>Ley N° 18.695</strong> (Orgánica Constitucional de Municipalidades). Este instrumento comunitario no sustituye la inscripción legal obligatoria en el SIPEC Apícola del Servicio Agrícola y Ganadero (SAG).
        </p>

        {/* Botones de Acción */}
        <div className="flex gap-3 pt-1 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-11 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors text-foreground"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 min-h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-sm"
          >
            <Printer size={15} />
            <span>Imprimir Credencial / PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
