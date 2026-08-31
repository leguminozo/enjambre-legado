'use client';

import { useState } from 'react';
import { Mic, Square, Loader2, CheckCircle2, ShieldAlert, AlertTriangle, Fingerprint } from 'lucide-react';
import type { BitacoraPayload } from '@/lib/bitacora-ledger-schema';

export function LedgerReadbackTerminal({
  apiarioId,
  colmenaId,
}: {
  apiarioId: string;
  colmenaId: string;
}) {
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [parsedPayload, setParsedPayload] = useState<(BitacoraPayload & { notas_oficio?: string }) | null>(null);
  const [error, setError] = useState<{ message: string; issues?: any[] } | null>(null);
  const [sealedHash, setSealedHash] = useState<string | null>(null);

  const handleParse = async () => {
    if (!transcript.trim()) return;
    setIsProcessing(true);
    setError(null);
    setParsedPayload(null);
    setSealedHash(null);

    try {
      const res = await fetch('/api/bitacora/ledger/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript_raw: transcript }),
      });

      const json = await res.json();
      if (!res.ok) throw { message: json.message || json.error, issues: json.issues };

      setParsedPayload(json.data.payload_extraido);
    } catch (e: any) {
      setError(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommit = async () => {
    if (!parsedPayload) return;
    setIsCommitting(true);
    setError(null);

    try {
      const res = await fetch('/api/bitacora/ledger/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiario_id: apiarioId,
          colmena_id: colmenaId,
          transcript_raw: transcript,
          client_request_id: crypto.randomUUID(), 
          payload_extraido: parsedPayload,
          notas_oficio: parsedPayload.notas_oficio
        }),
      });

      const json = await res.json();
      if (!res.ok) throw { message: json.message || json.error };

      setSealedHash(json.data.hash);
    } catch (e: any) {
      setError(e);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="bg-card border-2 border-border/60 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Bitácora de Campo (Vanguardia)</h3>
          <p className="text-xs text-muted-foreground">
            Protocolo de confirmación (Readback). Invariantes biológicos estrictos.
          </p>
        </div>
      </div>

      {!sealedHash && (
        <div className="space-y-4">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Ej: Inspección. La población es de 8 cuadros, con 3 de cría sellada. Se vio la reina..."
            className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none min-h-[5rem]"
            disabled={isProcessing || isCommitting || !!parsedPayload}
          />

          {!parsedPayload && (
            <button
              onClick={handleParse}
              disabled={!transcript.trim() || isProcessing}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-colors"
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
              Interpretar Dictado (IA Determinista)
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle size={16} /> Error de Validación (Límites Físicos)
          </div>
          <p className="text-xs">{error.message}</p>
          {error.issues && (
            <ul className="list-disc list-inside text-xs mt-2 opacity-80">
              {error.issues.map((i, idx) => (
                <li key={idx}>
                  {i.path?.join('.')}: {i.message}
                </li>
              ))}
            </ul>
          )}
          <button 
            onClick={() => { setError(null); setParsedPayload(null); }}
            className="mt-2 px-3 py-1.5 text-xs font-bold bg-destructive/20 rounded-lg hover:bg-destructive/30"
          >
            Revisar y dictar de nuevo
          </button>
        </div>
      )}

      {parsedPayload && !sealedHash && (
        <div className="mt-6 space-y-4 border-t border-border pt-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 text-warning font-bold text-sm uppercase tracking-wider">
            <AlertTriangle size={16} />
            <span>Paso de Confirmación Crítica (Readback)</span>
          </div>
          
          <div className="bg-secondary/40 rounded-xl p-4 border border-border/50 font-mono text-xs text-foreground space-y-2">
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Acción Extraída:</span>
              <span className="font-bold text-primary">{parsedPayload.tipo_accion}</span>
            </div>
            
            {Object.entries(parsedPayload.data).map(([key, value]) => (
              <div key={key} className="flex justify-between py-1 border-b border-border/20 last:border-0">
                <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                <span className="font-bold">{String(value)}</span>
              </div>
            ))}
            
            {parsedPayload.notas_oficio && (
              <div className="pt-2 border-t border-border/50">
                <span className="text-muted-foreground block mb-1">Notas del Oficio:</span>
                <span className="italic opacity-80">"{parsedPayload.notas_oficio}"</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setParsedPayload(null)}
              disabled={isCommitting}
              className="flex-1 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              Cancelar / Editar
            </button>
            <button
              onClick={handleCommit}
              disabled={isCommitting}
              className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
            >
              {isCommitting ? <Loader2 size={16} className="animate-spin" /> : <Fingerprint size={16} />}
              Confirmar (Sellar en Ledger)
            </button>
          </div>
        </div>
      )}

      {sealedHash && (
        <div className="mt-6 p-5 rounded-2xl bg-success/10 border border-success/20 animate-in zoom-in-95 flex flex-col items-center justify-center text-center space-y-3">
          <CheckCircle2 size={32} className="text-success" />
          <div>
            <h4 className="text-success font-bold">Evento inmutable sellado con éxito</h4>
            <p className="text-xs text-success/80 font-mono mt-1">Hash: {sealedHash}</p>
          </div>
          <button
            onClick={() => {
              setSealedHash(null);
              setParsedPayload(null);
              setTranscript('');
            }}
            className="mt-2 px-4 py-2 rounded-lg bg-success/20 hover:bg-success/30 text-success text-xs font-bold transition-colors"
          >
            Dictar siguiente evento
          </button>
        </div>
      )}
    </div>
  );
}
