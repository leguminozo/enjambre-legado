'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  Check,
  AlertCircle,
  Volume2,
  RefreshCw,
  Radio,
  Sparkles,
  Loader2,
  Square,
  Cpu,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
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
  const apiFetch = useApiFetch();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<ParsedInspeccionVoice | null>(null);
  const [supportSpeech, setSupportSpeech] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);

  // Referencias para Web Speech
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const intentRef = useRef(false);
  const accumulatedTranscriptRef = useRef('');
  const currentSessionTextRef = useRef('');
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Referencias para MediaRecorder (Groq Whisper fallback/directo)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Parser con Groq Llama 3.3
  const refineWithGroq = useCallback(
    async (textToParse: string) => {
      const trimmed = textToParse.trim();
      if (!trimmed || trimmed.length < 3) return;
      setIsAiProcessing(true);
      try {
        const res = await apiFetch('/api/ai/bitacora/parse', {
          method: 'POST',
          body: JSON.stringify({ text: trimmed }),
        });
        if (res.ok) {
          const json = await res.json();
          const g = json.data?.parsed;
          if (g) {
            setParsed((prev) => ({
              notasCompletas: trimmed,
              colmenaQuery: g.colmenaQuery ?? prev?.colmenaQuery,
              marcosCria:
                typeof g.marcosCria === 'number' && g.marcosCria > 0
                  ? g.marcosCria
                  : (prev?.marcosCria ?? undefined),
              marcosMiel:
                typeof g.marcosMiel === 'number' && g.marcosMiel > 0
                  ? g.marcosMiel
                  : (prev?.marcosMiel ?? undefined),
              marcosPolen:
                typeof g.marcosPolen === 'number' && g.marcosPolen > 0
                  ? g.marcosPolen
                  : (prev?.marcosPolen ?? undefined),
              poblacion: g.poblacion ?? prev?.poblacion,
              reinaVista: typeof g.reinaVista === 'boolean' ? g.reinaVista : prev?.reinaVista,
              reinaPresente: typeof g.reinaPresente === 'boolean' ? g.reinaPresente : prev?.reinaPresente,
              posturaFresca: g.posturaFresca ?? prev?.posturaFresca,
              realeras: g.realeras ?? prev?.realeras,
              zanganera: g.zanganera ?? prev?.zanganera,
              varroa: g.varroa != null ? String(g.varroa) : prev?.varroa,
              fase: g.fase ?? prev?.fase,
              cuadros: prev?.cuadros,
            }));
            setAiEnhanced(true);
          }
        }
      } catch (err) {
        console.warn('[BitacoraVoz] Error al refinar con Groq:', err);
      } finally {
        setIsAiProcessing(false);
      }
    },
    [apiFetch],
  );

  // Transcripción de audio vía Groq Whisper
  const sendAudioToGroqWhisper = useCallback(
    async (audioBlob: Blob) => {
      if (audioBlob.size < 500) return;
      setIsAiProcessing(true);
      try {
        const formData = new FormData();
        const ext = audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
        formData.append('audio', audioBlob, `dictado.${ext}`);
        const res = await apiFetch('/api/ai/bitacora/stt-direct', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const json = await res.json();
          const whisperText = json.data?.text?.trim();
          if (whisperText) {
            setTranscript(whisperText);
            setParsed(parseVoiceTranscription(whisperText));
            await refineWithGroq(whisperText);
          }
        }
      } catch (err) {
        console.warn('[BitacoraVoz] Error en transcripción Groq Whisper:', err);
      } finally {
        setIsAiProcessing(false);
      }
    },
    [apiFetch, refineWithGroq],
  );

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      // Si no hay Web Speech nativo, verificamos si existe MediaRecorder para usar Groq Whisper directamente
      const hasMedia = typeof window !== 'undefined' && Boolean(navigator?.mediaDevices?.getUserMedia);
      setSupportSpeech(hasMedia);
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
        // Feedback instantáneo determinista sin latencia
        setParsed(parseVoiceTranscription(fullTranscript));
      };

      recognition.onerror = (event: { error: string }) => {
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
      const hasMedia = typeof window !== 'undefined' && Boolean(navigator?.mediaDevices?.getUserMedia);
      setSupportSpeech(hasMedia);
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

  const startListening = useCallback(async () => {
    setErrorMsg(null);
    setAiEnhanced(false);
    intentRef.current = true;

    // Iniciar MediaRecorder para respaldo Groq Whisper de alta fidelidad
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.start(250);
        mediaRecorderRef.current = recorder;
      } catch (e) {
        console.warn('[BitacoraVoz] Permiso de audio no concedido para grabador nativo:', e);
      }
    }

    // Iniciar Web Speech si está disponible
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        return;
      } catch (err) {
        console.warn('[BitacoraVoz] Web Speech falló, usando grabador de audio:', err);
      }
    }

    // Si Web Speech falló o no existe, verificar si MediaRecorder arrancó
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      setIsListening(true);
    } else {
      intentRef.current = false;
      setErrorMsg('No se pudo activar el micrófono.');
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    intentRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('[BitacoraVoz] Error al detener Web Speech:', err);
      }
    }

    // Detener MediaRecorder y procesar audio
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        // Si no hubo transcripción en vivo por Web Speech, enviar a Whisper
        if (!accumulatedTranscriptRef.current && !currentSessionTextRef.current) {
          void sendAudioToGroqWhisper(audioBlob);
        } else {
          // Si ya tenemos texto de Web Speech, usamos Groq Llama 3.3 para estructurarlo
          const full = [accumulatedTranscriptRef.current, currentSessionTextRef.current]
            .filter(Boolean)
            .join(' ')
            .trim();
          if (full) {
            void refineWithGroq(full);
          }
        }

        // Liberar pistas del micrófono
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      };
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('[BitacoraVoz] Error al detener MediaRecorder:', err);
      }
    } else {
      // Sin MediaRecorder, refinar directamente el texto acumulado
      const full = [accumulatedTranscriptRef.current, currentSessionTextRef.current]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (full) {
        void refineWithGroq(full);
      }
    }

    setIsListening(false);
  }, [refineWithGroq, sendAudioToGroqWhisper]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      void startListening();
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
    setAiEnhanced(false);
  };

  const handleTranscriptChange = (newText: string) => {
    setTranscript(newText);
    accumulatedTranscriptRef.current = newText;
    currentSessionTextRef.current = '';
    setParsed(parseVoiceTranscription(newText));
  };

  const handleManualGroqParse = () => {
    if (transcript) {
      void refineWithGroq(transcript);
    }
  };

  // Coincidencia con colmena disponible
  const colmenaMatched = parsed?.colmenaQuery
    ? colmenasDisponibles.find((c) => {
        const name = (c.name || '').toLowerCase();
        return (
          name.includes(parsed.colmenaQuery!) ||
          parseSpanishNumber(parsed.colmenaQuery!)?.toString() === name
        );
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-card border border-border rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="font-display text-lg">
                  Bitácora de Voz del Apiario
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <span>Dictado en terreno con IA</span>
                  <span className="text-primary font-mono text-[10px]">· Groq Whisper & Llama 3.3</span>
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!supportSpeech ? (
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Navegador sin acceso a micrófono</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Revisa los permisos de micrófono en la configuración de tu navegador para habilitar el dictado con Groq Whisper.
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
                  aria-label={isListening ? 'Detener dictado y procesar' : 'Iniciar dictado'}
                >
                  {isListening ? (
                    <div className="relative flex items-center justify-center">
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                      </span>
                      <Mic className="w-8 h-8 animate-pulse text-destructive-foreground" />
                    </div>
                  ) : (
                    <Mic className="w-8 h-8 text-primary-foreground" />
                  )}
                </button>

                <div className="mt-3 flex items-center gap-2 text-xs font-mono">
                  {isListening ? (
                    <span className="flex items-center gap-1 text-destructive font-semibold animate-pulse">
                      <Radio className="w-3.5 h-3.5" /> Escuchando... Toca para detener
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Toca el micrófono para hablar
                    </span>
                  )}
                </div>
              </div>

              {/* Guía rápida de dictado */}
              {!transcript && !isListening && (
                <div className="p-3 rounded-xl bg-surface-sunken border border-border/40 text-[11px] text-muted-foreground space-y-1">
                  <span className="font-semibold text-foreground block">Ejemplo de dictado apícola:</span>
                  <p className="italic">
                    «Colmena 4. Población alta, reina vista, 5 marcos de cría y cuadro de miel. Sin varroa.»
                  </p>
                </div>
              )}

              {/* Transcripción en vivo editable */}
              {transcript && (
                <div className="p-3.5 rounded-xl bg-surface-raised border border-border text-xs space-y-2">
                  <div className="flex items-center justify-between text-[10px] uppercase font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-primary" /> Audio Transcrito:
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleManualGroqParse}
                        disabled={isAiProcessing}
                        className="hover:text-primary flex items-center gap-1 text-[10px] text-primary"
                        title="Reanalizar con Groq Llama 3.3"
                      >
                        <Cpu className="w-2.5 h-2.5" /> Analizar con IA
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="hover:text-foreground flex items-center gap-1 text-[10px]"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> Limpiar
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={transcript}
                    onChange={(e) => handleTranscriptChange(e.target.value)}
                    rows={3}
                    className="w-full text-foreground leading-relaxed font-datos bg-background/60 p-2.5 rounded-lg border border-border/40 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="El texto dictado aparecerá aquí..."
                  />
                </div>
              )}

              {/* Estado de IA Groq */}
              <div className="flex items-center justify-between min-h-[22px]">
                {isAiProcessing ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin text-primary" /> Analizando con Groq Llama 3.3...
                  </span>
                ) : aiEnhanced ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    <Sparkles className="w-3 h-3" /> Parámetros refinados con IA Groq
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Modelo: Groq Whisper & Llama 3.3
                  </span>
                )}
              </div>

              {/* Detección de Parámetros Estructurados */}
              {parsed && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-mono text-primary flex items-center gap-1">
                    <Check className="w-3 h-3" /> Parámetros detectados automáticamente:
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
                    {parsed.temperamento && (
                      <span className="px-2.5 py-1 rounded-md bg-surface-sunken border border-border text-foreground">
                        Temperamento: <strong>{parsed.temperamento}</strong>
                      </span>
                    )}
                    {parsed.reinaVista !== undefined && (
                      <span className="px-2.5 py-1 rounded-md bg-surface-sunken border border-border text-foreground">
                        Reina: <strong>{parsed.reinaVista ? 'Vista ✓' : parsed.reinaPresente ? 'Implícita (huevos) ✓' : 'No vista ✕'}</strong>
                      </span>
                    )}
                    {parsed.posturaFresca && (
                      <span className="px-2.5 py-1 rounded-md bg-success/10 border border-success/30 text-success font-medium">
                        Postura fresca: <strong>Huevos del día ✓</strong>
                      </span>
                    )}
                    {parsed.realeras && (
                      <span className="px-2.5 py-1 rounded-md bg-warning/10 border border-warning/30 text-warning font-medium">
                        Realeras: <strong>{parsed.realeras.cantidad} ({parsed.realeras.tipo})</strong>
                      </span>
                    )}
                    {parsed.zanganera && (
                      <span className="px-2.5 py-1 rounded-md bg-destructive/10 border border-destructive/30 text-destructive font-medium">
                        ⚠️ <strong>Colonia zanganera</strong>
                      </span>
                    )}
                    {parsed.marcosCria !== undefined && parsed.marcosCria > 0 && (
                      <span className="px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary font-semibold">
                        Cría: <strong>{parsed.marcosCria} marcos</strong>
                      </span>
                    )}
                    {parsed.marcosMiel !== undefined && parsed.marcosMiel > 0 && (
                      <span className="px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary font-semibold">
                        Miel: <strong>{parsed.marcosMiel} marcos</strong>
                      </span>
                    )}
                    {parsed.marcosPolen !== undefined && parsed.marcosPolen > 0 && (
                      <span className="px-2.5 py-1 rounded-md bg-surface-sunken border border-border text-foreground">
                        Polen: <strong>{parsed.marcosPolen} marcos</strong>
                      </span>
                    )}
                    {parsed.varroa && (
                      <span className={`px-2.5 py-1 rounded-md border text-foreground ${parsed.alertaSanitaria ? 'bg-destructive/10 border-destructive/30 text-destructive font-bold' : 'bg-surface-sunken border-border'}`}>
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
                    {parsed.excedeCapacidadLangstroth && (
                      <span className="px-2.5 py-1 rounded-md bg-warning/10 border border-warning/30 text-warning text-[10px]">
                        ℹ️ &gt;10 marcos: distribución en cámara + alza
                      </span>
                    )}
                  </div>
                </div>
              )}

              {isListening && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Manos libres activado: habla con naturalidad. Toca el botón rojo al terminar para que Groq extraiga los parámetros.
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
