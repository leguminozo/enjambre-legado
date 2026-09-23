'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Check,
  AlertCircle,
  Volume2,
  RefreshCw,
  X,
  Radio,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button } from '@enjambre/ui';
import {
  parseSpanishNumber,
  parseVoiceTranscription,
  type ParsedInspeccionVoice,
} from './voice-parse';

export type { ParsedInspeccionVoice } from './voice-parse';
export { parseSpanishNumber, parseVoiceTranscription } from './voice-parse';

interface BitacoraVozModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (parsed: ParsedInspeccionVoice) => void;
  colmenasDisponibles?: { id: string; name: string | null }[];
}

interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function BitacoraVozModal({
  open,
  onOpenChange,
  onApply,
  colmenasDisponibles = [],
}: BitacoraVozModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<ParsedInspeccionVoice | null>(null);
  const [supportSpeech, setSupportSpeech] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Referencia a SpeechRecognition + intención manos libres y buffer acumulado
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const intentRef = useRef(false);
  const accumulatedTranscriptRef = useRef('');
  const currentSessionTextRef = useRef('');
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setSupportSpeech(false);
      return;
    }

    try {
      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-CL';

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          const first = event.results[i]?.[0];
          if (first) currentTranscript += `${first.transcript} `;
        }
        currentSessionTextRef.current = currentTranscript.trim();
        const fullTranscript = [accumulatedTranscriptRef.current, currentSessionTextRef.current]
          .filter(Boolean)
          .join(' ')
          .trim();
        setTranscript(fullTranscript);
        setParsed(parseVoiceTranscription(fullTranscript));
      };

      recognition.onerror = (event: { error: string }) => {
        // Sin permiso o servicio bloqueado: no tiene sentido reintentar.
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          intentRef.current = false;
          setErrorMsg('Micrófono o dictado bloqueado: revisa los permisos del navegador.');
          setIsListening(false);
          return;
        }
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setErrorMsg(`Error de reconocimiento: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Consolidar lo recibido en la sesión en el buffer acumulado
        if (currentSessionTextRef.current) {
          accumulatedTranscriptRef.current = [
            accumulatedTranscriptRef.current,
            currentSessionTextRef.current,
          ]
            .filter(Boolean)
            .join(' ')
            .trim();
          currentSessionTextRef.current = '';
        }

        // Manos libres: si el navegador cortó por pausa, diferir el restart
        // para evitar InvalidStateError en WebKit.
        if (intentRef.current && recognitionRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if (intentRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                return;
              } catch (err) {
                console.warn('[BitacoraVoz] Error al reiniciar dictado manos libres:', err);
                setIsListening(false);
              }
            }
          }, 150);
          return;
        }
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('[BitacoraVoz] Error al instanciar SpeechRecognition:', err);
      setSupportSpeech(false);
    }

    return () => {
      intentRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try {
        recognitionRef.current?.stop();
      } catch (err) {
        console.warn('[BitacoraVoz] Error al detener reconocimiento en cleanup:', err);
      }
      recognitionRef.current = null;
    };
  }, []);

  const startListening = useCallback(() => {
    setErrorMsg(null);
    if (!recognitionRef.current) return;
    intentRef.current = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error('[BitacoraVoz] Error al activar micrófono:', err);
      intentRef.current = false;
      setErrorMsg('No se pudo activar el micrófono.');
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    intentRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (!recognitionRef.current) {
      setIsListening(false);
      return;
    }
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.warn('[BitacoraVoz] Error al detener dictado:', err);
    }
    setIsListening(false);
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleApply = () => {
    if (parsed) {
      onApply(parsed);
      onOpenChange(false);
      stopListening();
    }
  };

  const handleReset = () => {
    accumulatedTranscriptRef.current = '';
    currentSessionTextRef.current = '';
    setTranscript('');
    setParsed(null);
    setErrorMsg(null);
  };

  // Coincidencia con colmena disponible
  const colmenaMatched = parsed?.colmenaQuery
    ? colmenasDisponibles.find((c) => {
        const name = (c.name || '').toLowerCase();
        return name.includes(parsed.colmenaQuery!) || parseSpanishNumber(parsed.colmenaQuery!)?.toString() === name;
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-card border border-border rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="font-display text-lg">
                Bitácora de Voz del Apiario
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground">
                Dictado en terreno sin necesidad de retirar guantes
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!supportSpeech ? (
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Navegador sin Web Speech API nativo</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tu dispositivo actual no soporta dictado directo por voz en el navegador. Graba con la Captura de
                campo (se transcribe sola al sincronizar) o ingresa las notas manualmente en el formulario.
              </p>
            </div>
          ) : (
            <>
              {/* Botón Central de Grabación */}
              <div className="flex flex-col items-center justify-center py-4">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                    isListening
                      ? 'bg-destructive text-destructive-foreground animate-pulse ring-4 ring-destructive/30 scale-105'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105'
                  }`}
                  aria-label={isListening ? 'Detener dictado' : 'Iniciar dictado'}
                >
                  {isListening ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </button>

                <div className="mt-3 flex items-center gap-2 text-xs font-mono">
                  {isListening ? (
                    <span className="flex items-center gap-1 text-destructive animate-pulse">
                      <Radio className="w-3.5 h-3.5" /> Escuchando inspección...
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Toca para hablar
                    </span>
                  )}
                </div>
              </div>

              {/* Guía rápida de dictado */}
              {!transcript && (
                <div className="p-3 rounded-xl bg-surface-sunken border border-border/40 text-[11px] text-muted-foreground space-y-1">
                  <span className="font-semibold text-foreground block">Ejemplo de dictado:</span>
                  <p className="italic">
                    «Colmena 4. Población alta, reina vista, 5 marcos de cría y 4 de miel. Sin varroa. Postura muy uniforme.»
                  </p>
                </div>
              )}

              {/* Transcripción en vivo */}
              {transcript && (
                <div className="p-3.5 rounded-xl bg-surface-raised border border-border text-xs space-y-2">
                  <div className="flex items-center justify-between text-[10px] uppercase font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-primary" /> Audio Transcrito:
                    </span>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="hover:text-foreground flex items-center gap-1"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Limpiar
                    </button>
                  </div>
                  <p className="text-foreground leading-relaxed font-datos bg-background/50 p-2.5 rounded-lg border border-border/40">
                    {transcript}
                  </p>
                </div>
              )}

              {/* Detección de Parámetros Estructurados */}
              {parsed && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-mono text-primary flex items-center gap-1">
                    <Mic className="w-3 h-3" /> Parámetros detectados automáticamente:
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {colmenaMatched && (
                      <span className="px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary font-medium">
                        Colmena: {colmenaMatched.name}
                      </span>
                    )}
                    {parsed.poblacion && (
                      <span className="px-2.5 py-1 rounded-md bg-surface-sunken border border-border text-foreground">
                        Población: <strong>{parsed.poblacion}</strong>
                      </span>
                    )}
                    {parsed.reinaVista !== undefined && (
                      <span className="px-2.5 py-1 rounded-md bg-surface-sunken border border-border text-foreground">
                        Reina: <strong>{parsed.reinaVista ? 'Vista ✓' : 'No vista ✕'}</strong>
                      </span>
                    )}
                    {parsed.marcosCria !== undefined && (
                      <span className="px-2.5 py-1 rounded-md bg-surface-sunken border border-border text-foreground">
                        Cría: <strong>{parsed.marcosCria} marcos</strong>
                      </span>
                    )}
                    {parsed.marcosMiel !== undefined && (
                      <span className="px-2.5 py-1 rounded-md bg-surface-sunken border border-border text-foreground">
                        Miel: <strong>{parsed.marcosMiel} marcos</strong>
                      </span>
                    )}
                    {parsed.varroa && (
                      <span className="px-2.5 py-1 rounded-md bg-surface-sunken border border-border text-foreground">
                        Varroa: <strong>{parsed.varroa}</strong>
                      </span>
                    )}
                    {parsed.fase && (
                      <span className="px-2.5 py-1 rounded-md bg-surface-sunken border border-border text-foreground">
                        Fase: <strong>{parsed.fase}</strong>
                      </span>
                    )}
                    {parsed.cuadros && parsed.cuadros.length > 0 && (
                      <span className="px-2.5 py-1 rounded-md bg-surface-sunken border border-border text-foreground">
                        Cuadros: <strong>{parsed.cuadros.length} detectados</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}
              {isListening && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Manos libres: el dictado se mantiene activo aunque hagas pausas. Detén al terminar la colmena.
                </p>
              )}

              {errorMsg && (
                <p className="text-xs text-destructive text-center">{errorMsg}</p>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              stopListening();
              onOpenChange(false);
            }}
          >
            Cerrar
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!parsed || !transcript}
            onClick={handleApply}
            className="flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Aplicar a la Inspección
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
