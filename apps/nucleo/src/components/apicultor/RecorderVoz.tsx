'use client';

// Grabadora de voz de la bitácora — mano libre, sin señal, sin correlatividad.
// Reutiliza el permiso de micrófono de EspectroVivo (getUserMedia audio) y lo
// extiende con MediaRecorder (m4a en iOS / webm en el resto). La captura se
// guarda SIEMPRE primero en Dexie (fuente de verdad local) y se sincroniza
// cuando vuelve la señal (useBitacoraSyncEngine, semántica de Campo).
// Referencia: docs/BITACORA_APICOLA.md §3 y §5.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Mic, Square, Plus, WifiOff, CheckCircle2, AlertTriangle, FileText, Loader2,
} from 'lucide-react';
import { db } from '@/lib/offline/db';
import {
  crearSesionLocal,
  enqueueCapturaVoz,
  enqueueTranscriptManual,
} from '@/lib/offline/bitacora-offline';
import { useBitacoraSyncEngine } from '@/hooks/use-bitacora-sync-engine';

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4'; // Safari/iOS 14.3+
  if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
  return '';
}

export function RecorderVoz() {
  const { triggerSync } = useBitacoraSyncEngine();

  const sesiones = useLiveQuery(() =>
    db.sesiones_locales.orderBy('updated_at').reverse().toArray(), []);
  const pendientes = useLiveQuery(async () => ({
    capturas: await db.sync_queue.where('status').equals('pending').count(),
    errores: await db.sync_queue.where('status').equals('error').count(),
  }), []);

  const [sesionActiva, setSesionActiva] = useState<string | null>(null);
  const [grabando, setGrabando] = useState(false);
  const [duracion, setDuracion] = useState(0);
  const [mime, setMime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creandoSesion, setCreandoSesion] = useState(false);
  /** Path MVP sin STT: pegar o escribir la narración del patio. */
  const [transcriptManual, setTranscriptManual] = useState('');
  const [enviandoTranscript, setEnviandoTranscript] = useState(false);
  const [okTranscript, setOkTranscript] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMime(pickMimeType());
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const crearSesion = useCallback(async () => {
    setCreandoSesion(true);
    try {
      const sesion = await crearSesionLocal({ contexto: 'Revisión de campo' });
      setSesionActiva(sesion.id);
      void triggerSync();
    } finally {
      setCreandoSesion(false);
    }
  }, [triggerSync]);

  const iniciarGrabacion = useCallback(async () => {
    if (!sesionActiva) return;
    setError(null);

    if (!mime) {
      setError('Este dispositivo no soporta grabación de audio (MediaRecorder no disponible).');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        stream.getTracks().forEach((t) => t.stop());
        if (blob.size > 0 && sesionActiva) {
          await enqueueCapturaVoz({
            session_id: sesionActiva,
            blob,
            mime,
            duracion_seg: duracion,
            dispositivo: navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')
              ? 'iOS'
              : 'web',
          });
          void triggerSync();
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setGrabando(true);
      setDuracion(0);
      timerRef.current = setInterval(() => setDuracion((d) => d + 1), 1000);
    } catch {
      setError('No se pudo acceder al micrófono. Revisa los permisos del navegador.');
    }
  }, [sesionActiva, mime, duracion, triggerSync]);

  const detenerGrabacion = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setGrabando(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const enviarTranscriptManual = useCallback(async () => {
    if (!sesionActiva || !transcriptManual.trim()) return;
    setEnviandoTranscript(true);
    setError(null);
    setOkTranscript(null);
    try {
      await enqueueTranscriptManual({
        session_id: sesionActiva,
        transcript_raw: transcriptManual,
      });
      setTranscriptManual('');
      setOkTranscript('Transcript encolado — se sincroniza y queda listo para curaduría/procesar.');
      void triggerSync();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo encolar el transcript');
    } finally {
      setEnviandoTranscript(false);
    }
  }, [sesionActiva, transcriptManual, triggerSync]);

  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  const totalPendientes = (pendientes?.capturas ?? 0) + (pendientes?.errores ?? 0);
  const mmss = `${String(Math.floor(duracion / 60)).padStart(2, '0')}:${String(duracion % 60).padStart(2, '0')}`;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${grabando ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          <Mic size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground">Captura de campo</h3>
          <p className="text-xs text-muted-foreground">
            Voz o transcript manual — la colmena se identifica en el texto (sin STT obligatorio)
          </p>
        </div>
        {offline && (
          <span className="badge badge-warning px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 shrink-0">
            <WifiOff size={10} /> sin señal
          </span>
        )}
      </div>

      {/* Estado de sincronización local (detalle; banner global en shell) */}
      {totalPendientes > 0 && (
        <div className="px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-xs text-muted-foreground flex items-center gap-2">
          {offline ? <WifiOff size={12} /> : <AlertTriangle size={12} />}
          <span>
            {totalPendientes} ítem{totalPendientes === 1 ? '' : 's'} pendiente{totalPendientes === 1 ? '' : 's'} de sync
            {pendientes?.errores ? ` · ${pendientes.errores} con error` : ''} — se suben al recuperar señal
          </span>
        </div>
      )}

      {/* Sesión activa */}
      <div>
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold mb-1 block">
          Sesión de inspección
        </label>
        <div className="flex gap-2">
          <select
            value={sesionActiva ?? ''}
            onChange={(e) => setSesionActiva(e.target.value || null)}
            className="flex-1 bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground"
          >
            <option value="">Selecciona una sesión</option>
            {(sesiones ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.fecha} — {s.contexto ?? 'Sin contexto'}
                {!s.sincronizada ? ' (local)' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void crearSesion()}
            disabled={creandoSesion}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 disabled:opacity-50"
          >
            <Plus size={14} /> Nueva
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {okTranscript && (
        <p className="text-xs text-success flex items-center gap-1">
          <CheckCircle2 size={12} /> {okTranscript}
        </p>
      )}

      {/* Controles de grabación */}
      <div>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold mb-2">
          Opción A · Micrófono
        </p>
        <div className="flex items-center gap-3">
          {!grabando ? (
            <button
              type="button"
              onClick={() => void iniciarGrabacion()}
              disabled={!sesionActiva || !mime}
              className="flex-1 py-3 rounded-xl bg-destructive/90 hover:bg-destructive text-destructive-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Mic size={16} /> Grabar
            </button>
          ) : (
            <button
              type="button"
              onClick={detenerGrabacion}
              className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold flex items-center justify-center gap-2 animate-pulse"
            >
              <Square size={16} /> Detener — {mmss}
            </button>
          )}
        </div>
        {!sesionActiva && !grabando && (
          <p className="text-[10px] text-muted-foreground mt-2">
            Crea una sesión (funciona sin señal: se sincroniza después)
          </p>
        )}
        {grabando && (
          <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
            <CheckCircle2 size={10} className="text-success" />
            Grabando localmente — el audio se sube al recuperar señal (STT es opcional)
          </p>
        )}
      </div>

      {/* Path manual sin STT */}
      <div className="border-t border-border/60 pt-4">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold mb-2 flex items-center gap-1.5">
          <FileText size={12} /> Opción B · Transcript manual (MVP sin STT)
        </p>
        <p className="text-[11px] text-muted-foreground mb-2">
          Escribe o pega lo que dictaste: &quot;colmena 12, cría fuerte, varroa baja…&quot; Se encola offline y al sync queda listo para procesar/curar.
        </p>
        <textarea
          value={transcriptManual}
          onChange={(e) => setTranscriptManual(e.target.value)}
          rows={4}
          disabled={!sesionActiva || grabando}
          placeholder="Ej.: Colmena 15. Reina vista. Tres marcos de cría. Varroa 2 en 10. Notas: entrada limpia."
          className="w-full rounded-lg border border-border/50 bg-secondary/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 disabled:opacity-40 resize-y min-h-[5rem]"
        />
        <button
          type="button"
          onClick={() => void enviarTranscriptManual()}
          disabled={!sesionActiva || !transcriptManual.trim() || enviandoTranscript || grabando}
          className="mt-2 w-full sm:w-auto px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold inline-flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {enviandoTranscript ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          Encolar transcript
        </button>
      </div>
    </div>
  );
}
