'use client';

// Grabadora de voz de la bitácora — mano libre, sin señal, sin correlatividad.
// Reutiliza el permiso de micrófono de EspectroVivo (getUserMedia audio) y lo
// extiende con MediaRecorder (m4a en iOS / webm en el resto). La captura se
// guarda SIEMPRE primero en Dexie (fuente de verdad local) y se sincroniza
// cuando vuelve la señal (useBitacoraSyncEngine, semántica de Campo).
// Referencia: docs/BITACORA_APICOLA.md §3 y §5.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Mic, Square, Plus, WifiOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/offline/db';
import { crearSesionLocal, enqueueCapturaVoz } from '@/lib/offline/bitacora-offline';
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

  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  const totalPendientes = (pendientes?.capturas ?? 0) + (pendientes?.errores ?? 0);
  const mmss = `${String(Math.floor(duracion / 60)).padStart(2, '0')}:${String(duracion % 60).padStart(2, '0')}`;

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${grabando ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          <Mic size={20} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">Captura por voz</h3>
          <p className="text-xs text-muted-foreground">
            Dicta la inspección: la colmena se identifica en tu voz
          </p>
        </div>
        {offline && (
          <span className="badge badge-warning px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1">
            <WifiOff size={10} /> sin señal
          </span>
        )}
      </div>

      {/* Estado de sincronización (patrón SyncStatusBanner de Campo) */}
      {totalPendientes > 0 && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-xs text-muted-foreground flex items-center gap-2">
          {offline ? <WifiOff size={12} /> : <AlertTriangle size={12} />}
          <span>
            {totalPendientes} captura{totalPendientes === 1 ? '' : 's'} pendiente{totalPendientes === 1 ? '' : 's'} de sync
            {pendientes?.errores ? ` · ${pendientes.errores} con error` : ''} — se suben al recuperar señal
          </span>
        </div>
      )}

      {/* Sesión activa */}
      <div className="mb-4">
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
            onClick={() => void crearSesion()}
            disabled={creandoSesion}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 disabled:opacity-50"
          >
            <Plus size={14} /> Nueva
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-destructive mb-3">{error}</p>}

      {/* Controles de grabación */}
      <div className="flex items-center gap-3">
        {!grabando ? (
          <button
            onClick={() => void iniciarGrabacion()}
            disabled={!sesionActiva || !mime}
            className="flex-1 py-3 rounded-xl bg-destructive/90 hover:bg-destructive text-destructive-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Mic size={16} /> Grabar
          </button>
        ) : (
          <button
            onClick={detenerGrabacion}
            className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold flex items-center justify-center gap-2 animate-pulse"
          >
            <Square size={16} /> Detener — {mmss}
          </button>
        )}
      </div>

      {!sesionActiva && !grabando && (
        <p className="text-[10px] text-muted-foreground mt-3">
          Crea una sesión (funciona sin señal: se sincroniza después)
        </p>
      )}
      {grabando && (
        <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
          <CheckCircle2 size={10} className="text-success" />
          Grabando localmente — el audio se subirá al bucket bitacora-audio al recuperar señal
        </p>
      )}
    </div>
  );
}
