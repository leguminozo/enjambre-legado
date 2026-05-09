import { useEffect, useRef, useState } from 'react';
import Meyda from 'meyda';
import { Mic, MicOff, Activity } from 'lucide-react';

export default function EspectroVivo() {
  const [isRecording, setIsRecording] = useState(false);
  const [features, setFeatures] = useState<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyzerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

      analyzerRef.current = Meyda.createMeydaAnalyzer({
        audioContext: audioContextRef.current,
        source: sourceRef.current,
        bufferSize: 512,
        featureExtractors: ['rms', 'spectralCentroid', 'spectralFlatness'],
        callback: (features) => {
          setFeatures(features);
          draw(features);
        },
      });

      analyzerRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accediendo al micrófono:', err);
    }
  };

  const stopListening = () => {
    if (analyzerRef.current) analyzerRef.current.stop();
    if (audioContextRef.current) audioContextRef.current.close();
    setIsRecording(false);
    setFeatures(null);
  };

  const draw = (data: any) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { rms, spectralCentroid } = data;
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    // Limpieza suave (efecto estela)
    ctx.fillStyle = 'rgba(26, 22, 20, 0.2)';
    ctx.fillRect(0, 0, width, height);

    // Dibujar firma sonora circular
    const radius = 40 + rms * 200;
    const color = `hsl(${spectralCentroid * 2}, 70%, 60%)`;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pulso de "conciencia"
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = `${color}11`;
    ctx.fill();
  };

  useEffect(() => {
    return () => stopListening();
  }, []);

  return (
    <div className="card animate-in delay-4" style={{ background: '#1a1614', border: '1px solid rgba(228,163,43,0.1)' }}>
      <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
        <div>
          <div className="section-title" style={{ fontSize: '1rem', color: 'var(--oro-miel)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} /> Escucha Profunda
          </div>
          <div className="section-subtitle">Firma Sonora del Enjambre</div>
        </div>
        <button 
          onClick={isRecording ? stopListening : startListening}
          className={`btn btn-sm ${isRecording ? 'btn-ghost' : 'btn-gold'}`}
          style={{ borderRadius: '50%', width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
      </div>

      <div style={{ position: 'relative', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <canvas 
          ref={canvasRef} 
          width={300} 
          height={180} 
          style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-sm)' }} 
        />
        
        {!isRecording && (
          <div style={{ position: 'absolute', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '0 var(--space-xl)' }}>
            Sensor bioacústico inactivo. Pulsa el micrófono para escuchar el latido de la colmena.
          </div>
        )}
      </div>

      {features && (
        <div style={{ marginTop: 'var(--space-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 4 }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Densidad (RMS)</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--crema-natural)', fontFamily: 'var(--font-datos)' }}>{(features.rms * 100).toFixed(2)}%</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 4 }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Centroide</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--oro-miel)', fontFamily: 'var(--font-datos)' }}>{features.spectralCentroid.toFixed(0)} Hz</div>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: 'var(--space-md)', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        {isRecording ? 'Analizando armónicos en tiempo real...' : 'Listo para diagnóstico espectral.'}
      </div>
    </div>
  );
}
