'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play,
  Square,
  Camera,
  Layers,
  Sliders,
  RotateCcw,
  Film,
  Zap,
  Activity,
  Save,
  ArrowLeft,
} from 'lucide-react';
import {
  cn,
  toast,
  friendlyError,
} from '@enjambre/ui';
import {
  IdentitySubstrateSimulation,
  DEFAULT_SUBSTRATE_PARAMS,
  SUBSTRATE_PALETTES,
  type SubstrateParameters,
  type SubstrateMotorType,
  type SubstratePaletteId,
} from './identity-substrate-engine';
import { type SlideData } from './slide-studio-core';
import { exportVideo } from './slide-video-export';
import {
  type SavedVideoProject,
  saveVideoProject,
  type AspectRatioType,
} from './saved-videos';

export type { AspectRatioType };

export interface AudiovisualIdentityWorkspaceProps {
  initialProject?: SavedVideoProject | null;
  onVolver?: () => void;
  onGuardadoExitoso?: (proyecto: SavedVideoProject) => void;
  activeSlide?: SlideData;
  className?: string;
}

const MOTOR_CONFIGS: Array<{
  id: SubstrateMotorType;
  label: string;
  tagline: string;
  desc: string;
}> = [
  {
    id: 'obrera_zangano',
    label: 'Obrera y Zángano',
    tagline: 'Vuelo de Pecoreo & Polen Austral',
    desc: 'Hero oficial de la marca: abejas obreras y zánganos reales con alas batientes, resplandor dorado y fragmentos macroscópicos de polen y ámbar.',
  },
  {
    id: 'hueco_bosque',
    label: 'Hueco del Bosque & Luz de Copa',
    tagline: 'Dosel Ancestral & Rayo Volumétrico',
    desc: 'Atmósfera cinematográfica del tronco milenario: anillos de corteza, haz de luz solar descendente y motas de polvo dorado suspendidas.',
  },
  {
    id: 'radar_constelacion',
    label: 'Constelación Sensorial & Radar',
    tagline: 'Ejes Organolépticos & Telaraña Botánica',
    desc: 'Polígono sensorial vivo inspirado en el ritual de cata: 8 notas botánicas en resonancia, ejes armónicos y estrellas nodriza.',
  },
  {
    id: 'floracion_bosque',
    label: 'Floración & Fenología Austral',
    tagline: 'Pétalos de Ulmo & Rocío de Selva',
    desc: 'Floración viva del dosel milenario de Chiloé: flores blancas y crema abriéndose lentamente con pétalos mecidos por el viento austral.',
  },
  {
    id: 'cristalizacion_miel',
    label: 'Cristalización & Miel Cremosa',
    tagline: 'Crecimiento Dendrítico & Nieve Ámbar',
    desc: 'Textura de miel cruda hilada en frío: agujas fractales de glucosa pura creciendo desde núcleos áureos y micro-cristales en suspensión.',
  },
  {
    id: 'alambique_hidromiel',
    label: 'Alambique & Fermentación',
    tagline: 'Vapor Botánico & Microburbujas',
    desc: 'Efervescencia silvestre de hidromiel de bosque: burbujas doradas en ascenso, vapores aromáticos de roble y calor cobrizo de fondo.',
  },
  {
    id: 'reologia_miel',
    label: 'Reología del Néctar',
    tagline: 'Fluidos Viscosos & Tensión Ámbar',
    desc: 'Simulación de miel virgen de Ulmo, catenarias elásticas y gotas densas no-newtonianas.',
  },
  {
    id: 'geometria_panal',
    label: 'Geometría de Cera & Panal Vivo',
    tagline: 'Celdillas Hexagonales & Pulso Térmico',
    desc: 'Arquitectura viva de alvéolos de cera virgen con miel translúcida y termorregulación de enjambre.',
  },
  {
    id: 'enjambre_flujo',
    label: 'Enjambre & Pecoreo Austral',
    tagline: 'Vectores de Vuelo & Orientación Solar',
    desc: 'Campos de flujo balístico, estelas de vuelo áureas y corrientes de viento del archipiélago.',
  },
  {
    id: 'lidar_fiordos',
    label: 'LiDAR de Fiordos',
    tagline: 'Batimetría & Isobaras Australes',
    desc: 'Curvas de nivel topográficas del archipiélago y niebla pluvial del Corcovado.',
  },
  {
    id: 'filigrana_origen',
    label: 'Filigrana de Origen',
    tagline: 'Sello de Autenticidad Digital',
    desc: 'Guilloché de alta seguridad y resonancia geométrica para trazabilidad de lote.',
  },
];

const ASPECT_DIMENSIONS: Record<AspectRatioType, { width: number; height: number; label: string; sub: string }> = {
  '9:16': { width: 1080, height: 1920, label: '9:16', sub: 'Reel / Historia' },
  '4:5': { width: 1080, height: 1350, label: '4:5', sub: 'Feed Vertical' },
  '1:1': { width: 1080, height: 1080, label: '1:1', sub: 'Feed Cuadrado' },
  '16:9': { width: 1920, height: 1080, label: '16:9', sub: 'Apaisado / Web' },
};

export function AudiovisualIdentityWorkspace({
  initialProject,
  onVolver,
  onGuardadoExitoso,
  activeSlide,
  className,
}: AudiovisualIdentityWorkspaceProps) {
  const [projectTitle, setProjectTitle] = useState(
    initialProject?.title ||
      (activeSlide
        ? `Video — ${activeSlide.title || 'Lámina'}`
        : 'Nueva Pieza Audiovisual'),
  );
  const [projectId, setProjectId] = useState(
    initialProject?.id || `vid-${Date.now()}`,
  );
  const [aspect, setAspect] = useState<AspectRatioType>(
    initialProject?.aspect || '4:5',
  );
  const [params, setParams] = useState<SubstrateParameters>(
    initialProject?.params || DEFAULT_SUBSTRATE_PARAMS,
  );
  const [activeTab, setActiveTab] = useState<'motor' | 'fisica' | 'capas' | 'exportar'>('motor');

  // Estado de Lámina Editorial superpuesta (neutral = 'none' por defecto para no tapar el sustrato)
  const [cardOverlayStyle, setCardOverlayStyle] = useState<'none' | 'full' | 'floating' | 'fog'>(
    initialProject?.cardOverlayStyle || (activeSlide ? 'floating' : 'none'),
  );

  // Grabación de video
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(15.0);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [videoBitrate, setVideoBitrate] = useState<'8' | '16' | '28'>('16');

  // Estadísticas en tiempo real
  const [stats, setStats] = useState({ tick: 0, organisms: 0, fps: 60, frameCostMs: 0, qualityTier: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<IdentitySubstrateSimulation | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isExportingRef = useRef(false);
  const cancelRequestedRef = useRef(false);
  const isOnScreenRef = useRef(true);

  // El sustrato no se anima si nadie lo está mirando.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        isOnScreenRef.current = entries.some((entry) => entry.isIntersecting);
      },
      { threshold: 0.01 },
    );
    observer.observe(canvas);

    return () => observer.disconnect();
  }, []);
  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  // Inicializar o redimensionar simulación al abrir o cambiar formato
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dim = ASPECT_DIMENSIONS[aspect];

    if (!simRef.current) {
      const sim = new IdentitySubstrateSimulation(canvas, params);
      simRef.current = sim;
    } else {
      simRef.current.resize(dim.width, dim.height);
      simRef.current.updateParameters(params);
    }

    if (activeSlide) {
      simRef.current.setBrandOverlay({
        title: activeSlide.title || 'ENJAMBRE LEGADO',
        kicker: activeSlide.kickerLeft || 'CHILOÉ 42°S // ESTÁNDAR DE ORIGEN',
        batchCode: activeSlide.footerRight || 'LOTE VERIFICADO',
      });
    }

    // Loop de animación a 60 FPS
    let isRunning = true;
    const loop = (currentTime: number) => {
      if (!isRunning) return;

      const pageVisible = typeof document === 'undefined' || !document.hidden;

      if (simRef.current && !isExportingRef.current && pageVisible && isOnScreenRef.current) {
        simRef.current.step();

        // Cálculo de FPS suave
        frameCountRef.current++;
        if (currentTime - lastTimeRef.current >= 1000) {
          const fps = Math.round((frameCountRef.current * 1000) / (currentTime - lastTimeRef.current));
          const currentStats = simRef.current.getStats();
          setStats({
            tick: currentStats.tick,
            organisms: currentStats.organismCount,
            fps,
            frameCostMs: currentStats.frameCostMs,
            qualityTier: currentStats.qualityTier,
          });
          frameCountRef.current = 0;
          lastTimeRef.current = currentTime;
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [aspect]);

  // Actualizar parámetros de simulación reactivamente
  const handleParamChange = useCallback((newPartial: Partial<SubstrateParameters>) => {
    setParams((prev) => {
      const updated = {
        ...prev,
        ...newPartial,
        layers: {
          ...prev.layers,
          ...(newPartial.layers || {}),
        },
      };
      if (simRef.current) {
        simRef.current.updateParameters(updated);
      }
      return updated;
    });
  }, []);

  // Interacción táctil o mouse sobre el lienzo
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !simRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    simRef.current.setCursor(canvasX, canvasY, true);
    simRef.current.triggerPulse(canvasX, canvasY);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !simRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    simRef.current.setCursor(canvasX, canvasY, true);
  };

  const handleCanvasPointerLeave = () => {
    if (simRef.current) {
      simRef.current.setCursor(0, 0, false);
    }
  };

  // Descarga inmediata de Fotograma Maestro en PNG alta resolución
  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('No se pudo generar la imagen del fotograma.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oyz_sustrato_${params.motor}_${aspect.replace(':', 'x')}_tick${stats.tick}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Fotograma PNG descargado en resolución nativa.');
    }, 'image/png');
  };

  // Armado del video: el sustrato avanza cuadro a cuadro y se codifica en el
  // equipo. Usa el mismo camino de salida que el generador de láminas.
  const handleStartRecording = useCallback(async () => {
    const canvas = canvasRef.current;
    const sim = simRef.current;
    if (!canvas || !sim) return;

    setIsRecording(true);
    setRecordingProgress(0);
    cancelRequestedRef.current = false;
    isExportingRef.current = true;

    try {
      const fps = 30;
      const stepsPerFrame = Math.max(1, Math.round(60 / fps));
      const bitrate = parseInt(videoBitrate, 10) * 1000 * 1000;

      const result = await exportVideo({
        canvas,
        width: canvas.width,
        height: canvas.height,
        fps,
        durationMs: recordingSeconds * 1000,
        format: 'mp4',
        bitrate,
        drawFrame: () => {
          for (let step = 0; step < stepsPerFrame; step++) {
            sim.step();
          }
        },
        onProgress: (value) => setRecordingProgress(Math.round(value * 100)),
        isCancelled: () => cancelRequestedRef.current,
      });

      const ext = result.mime.includes('mp4') ? 'mp4' : 'webm';
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `oyz_video_${params.motor}_${aspect.replace(':', 'x')}_${recordingSeconds}s.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        result.deterministic
          ? `Video listo. ${ext.toUpperCase()} reproducible, misma semilla y misma pieza.`
          : `Video listo en ${ext.toUpperCase()}.`,
      );
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      isExportingRef.current = false;
      setIsRecording(false);
      setRecordingProgress(0);
    }
  }, [aspect, params.motor, recordingSeconds, videoBitrate]);

  const handleStopRecording = useCallback(() => {
    cancelRequestedRef.current = true;
  }, []);

  const currentDimensions = ASPECT_DIMENSIONS[aspect];
  const activePalette = useMemo(() => {
    const base = SUBSTRATE_PALETTES[params.palette] || SUBSTRATE_PALETTES.ambar;
    if (params.customColor) {
      return {
        ...base,
        label: 'Color Personalizado',
        primaryHex: params.customColor,
        secondaryHex: params.customColor,
        glowHex: params.customColor,
      };
    }
    return base;
  }, [params.palette, params.customColor]);

  const layerConfigs = useMemo(() => {
    if (params.motor === 'obrera_zangano') {
      return [
        { key: 'organisms' as const, label: 'Abejas Obreras & Zánganos', desc: 'Anatomía detallada, alas batientes y resplandor áureo' },
        { key: 'particles' as const, label: 'Polen & Ámbar Flotante', desc: 'Ingredientes botánicos macroscópicos y motas de luz' },
        { key: 'hulls' as const, label: 'Halo Atmosférico del Enjambre', desc: 'Resplandor volumétrico y calidez de fondo' },
        { key: 'synapses' as const, label: 'Vectores de Comunicación', desc: 'Líneas sutiles de orientación solar y vuelo' },
        { key: 'pulses' as const, label: 'Ondas Gravitacionales', desc: 'Respuesta expansiva a clics y toques' },
        { key: 'cameraMotion' as const, label: 'Cinemática de Cámara', desc: 'Respiración y micro-deriva continua' },
        { key: 'brandSeal' as const, label: 'Sello de Origen OYZ', desc: 'Micro-retícula y coordenadas oficiales' },
      ];
    }
    if (params.motor === 'hueco_bosque') {
      return [
        { key: 'hulls' as const, label: 'Tronco de Árbol & Anillos', desc: 'Corteza ancestral, veta de madera y cavidad' },
        { key: 'synapses' as const, label: 'Rayo de Luz Volumétrico', desc: 'Luz de copa descendente del dosel del bosque' },
        { key: 'particles' as const, label: 'Motas de Polen Iluminadas', desc: 'Polvo áureo suspendido brillando en el haz solar' },
        { key: 'organisms' as const, label: 'Espejo de Néctar Reposado', desc: 'Reflejo líquido en el fondo de la cavidad' },
        { key: 'pulses' as const, label: 'Pulsos de Brisa Austral', desc: 'Ondulaciones de luz y resonancia' },
        { key: 'cameraMotion' as const, label: 'Cinemática de Cámara', desc: 'Zoom y vaivén orgánico del dosel' },
        { key: 'brandSeal' as const, label: 'Sello de Origen OYZ', desc: 'Micro-retícula y coordenadas oficiales' },
      ];
    }
    if (params.motor === 'radar_constelacion') {
      return [
        { key: 'organisms' as const, label: 'Polígono Sensorial & Notas', desc: 'Vértices dinámicos de percepción de cata' },
        { key: 'hulls' as const, label: 'Anillos & Octógonos de Radar', desc: 'Escala porcentual de calibración organoléptica' },
        { key: 'synapses' as const, label: 'Ejes Armónicos & Telaraña', desc: 'Líneas de conexión entre las 8 notas sensoriales' },
        { key: 'particles' as const, label: 'Estrellas Nodriza & Muestras', desc: 'Puntos de muestreo botánico en órbita' },
        { key: 'pulses' as const, label: 'Pulsos de Calibración', desc: 'Ondas expansivas de degustación' },
        { key: 'cameraMotion' as const, label: 'Cinemática de Cámara', desc: 'Respiración y micro-deriva continua' },
        { key: 'brandSeal' as const, label: 'Sello de Origen OYZ', desc: 'Micro-retícula y coordenadas oficiales' },
      ];
    }
    if (params.motor === 'floracion_bosque') {
      return [
        { key: 'organisms' as const, label: 'Flores de Ulmo & Estambres', desc: 'Pétalos en floración viva y gotas de rocío' },
        { key: 'particles' as const, label: 'Pétalos al Viento Austral', desc: 'Hojas y pétalos flotando en deriva continua' },
        { key: 'hulls' as const, label: 'Dosel & Follaje de Fondo', desc: 'Sombras botánicas y atmósfera de copa' },
        { key: 'synapses' as const, label: 'Pecíolos & Conexiones Florales', desc: 'Líneas vegetales de savia silvestre' },
        { key: 'pulses' as const, label: 'Brisa del Bosque Austral', desc: 'Ráfagas de viento y resonancia' },
        { key: 'cameraMotion' as const, label: 'Cinemática de Cámara', desc: 'Zoom y vaivén orgánico del dosel' },
        { key: 'brandSeal' as const, label: 'Sello de Origen OYZ', desc: 'Micro-retícula y coordenadas oficiales' },
      ];
    }
    if (params.motor === 'cristalizacion_miel') {
      return [
        { key: 'organisms' as const, label: 'Núcleos de Cristalización', desc: 'Puntos de cristalización activa de glucosa' },
        { key: 'hulls' as const, label: 'Manto de Miel Cremosa', desc: 'Fondo aterciopelado de textura hilada en frío' },
        { key: 'synapses' as const, label: 'Dendritas & Agujas Fractales', desc: 'Ramificación hexagonal de cristal puro' },
        { key: 'particles' as const, label: 'Micro-Cristales en Suspensión', desc: 'Nieve ámbar y destellos brillantes' },
        { key: 'pulses' as const, label: 'Pulsos de Cristalización', desc: 'Ondas térmicas y alineación molecular' },
        { key: 'cameraMotion' as const, label: 'Cinemática de Cámara', desc: 'Respiración y micro-zoom' },
        { key: 'brandSeal' as const, label: 'Sello de Origen OYZ', desc: 'Micro-retícula y coordenadas oficiales' },
      ];
    }
    if (params.motor === 'alambique_hidromiel') {
      return [
        { key: 'organisms' as const, label: 'Microburbujas Efervescentes', desc: 'Burbujas doradas en ascenso continuo' },
        { key: 'hulls' as const, label: 'Fondo de Cobre & Roble', desc: 'Calor volcánico y pátina de fermentación' },
        { key: 'synapses' as const, label: 'Vapores & Espiral de Destilación', desc: 'Líneas de condensación botánica' },
        { key: 'particles' as const, label: 'Chispas & Efluvios Aromáticos', desc: 'Micro-gotas suspendidas en el vapor' },
        { key: 'pulses' as const, label: 'Pulsos de Calor & Presión', desc: 'Ondulaciones de fermentación viva' },
        { key: 'cameraMotion' as const, label: 'Cinemática de Cámara', desc: 'Respiración y micro-deriva continua' },
        { key: 'brandSeal' as const, label: 'Sello de Origen OYZ', desc: 'Micro-retícula y coordenadas oficiales' },
      ];
    }
    if (params.motor === 'reologia_miel') {
      return [
        { key: 'organisms' as const, label: 'Gotas de Miel No-Newtoniana', desc: 'Gotas densas con brillo especular y curvatura' },
        { key: 'synapses' as const, label: 'Catenarias & Filamentos Elásticos', desc: 'Hilos continuos de miel cayendo en suspensión' },
        { key: 'particles' as const, label: 'Micro-Burbujas & Polen', desc: 'Partículas suspendidas en el néctar denso' },
        { key: 'hulls' as const, label: 'Manto Viscoso & Menisco', desc: 'Superficie de miel y tensión ámbar' },
        { key: 'pulses' as const, label: 'Ondas de Impacto Viscoso', desc: 'Ripples elásticos concéntricos' },
        { key: 'cameraMotion' as const, label: 'Cinemática de Cámara', desc: 'Respiración y micro-zoom' },
        { key: 'brandSeal' as const, label: 'Sello de Origen OYZ', desc: 'Micro-retícula y coordenadas oficiales' },
      ];
    }
    if (params.motor === 'geometria_panal') {
      return [
        { key: 'organisms' as const, label: 'Alvéolos de Miel Translúcida', desc: 'Celdillas hexagonales con pulso térmico' },
        { key: 'hulls' as const, label: 'Estructura de Cera Virgen', desc: 'Paredes hexagonales del panal' },
        { key: 'particles' as const, label: 'Polen & Efluvios Térmicos', desc: 'Micro-partículas del nido' },
        { key: 'synapses' as const, label: 'Red de Termorregulación', desc: 'Resonancia colectiva del panal' },
        { key: 'pulses' as const, label: 'Pulsos de Incubación', desc: 'Ondas térmicas concéntricas' },
        { key: 'cameraMotion' as const, label: 'Cinemática de Cámara', desc: 'Micro-zoom y deriva continua' },
        { key: 'brandSeal' as const, label: 'Sello de Origen OYZ', desc: 'Micro-retícula y coordenadas oficiales' },
      ];
    }
    return [
      { key: 'organisms' as const, label: 'Organismos Vivos & Gotas', desc: 'Cuerpos de densidad y núcleos luminosos' },
      { key: 'hulls' as const, label: 'Hulls & Membranas Envolventes', desc: 'Campos de viscosidad difusa' },
      { key: 'particles' as const, label: 'Partículas & Estelas de Vuelo', desc: 'Micro-rastros y polen en movimiento' },
      { key: 'synapses' as const, label: 'Sinapsis & Catenarias de Red', desc: 'Filamentos elásticos interconectados' },
      { key: 'pulses' as const, label: 'Pulsos Gravitacionales', desc: 'Ondas concéntricas de resonancia' },
      { key: 'cameraMotion' as const, label: 'Cinemática de Cámara', desc: 'Micro-zoom y deriva continua' },
      { key: 'brandSeal' as const, label: 'Sello de Origen OYZ', desc: 'Micro-retícula y coordenadas oficiales' },
    ];
  }, [params.motor]);

  const handleGuardarProyecto = () => {
    const canvas = canvasRef.current;
    let thumbnailUrl: string | undefined;
    if (canvas) {
      try {
        thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
      } catch {
        // ignore
      }
    }

    const saved: SavedVideoProject = {
      id: projectId,
      title: projectTitle.trim() || 'Pieza Audiovisual',
      aspect,
      durationSeconds: recordingSeconds,
      params,
      cardOverlayStyle,
      thumbnailUrl,
      createdAt: initialProject?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveVideoProject(saved);
    toast.success('Pieza guardada en el archivo audiovisual');
    onGuardadoExitoso?.(saved);
  };

  return (
    <div className={cn('flex flex-col gap-4 h-full', className)}>
      {/* Barra superior de Proyecto: Volver a colección, Título editable, Guardar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          {onVolver && (
            <button
              type="button"
              onClick={onVolver}
              className="btn btn-outline btn-sm font-mono text-xs flex items-center gap-1.5 px-3 rounded-xl shrink-0"
              title="Volver a la colección de piezas"
            >
              <ArrowLeft size={13} />
              <span>Colección</span>
            </button>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hidden sm:inline">
              Pieza:
            </span>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="bg-transparent font-serif text-base sm:text-lg font-light text-foreground border-b border-transparent hover:border-border/60 focus:border-primary px-1 py-0.5 focus:outline-none transition-colors min-w-[180px] sm:min-w-[280px]"
              placeholder="Nombre de la pieza audiovisual..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleGuardarProyecto}
            className="btn btn-primary btn-sm font-mono text-xs flex items-center gap-1.5 px-3.5 rounded-xl shadow-sm"
          >
            <Save size={13} />
            <span>Guardar en Colección</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-[calc(100vh-210px)] gap-6 overflow-hidden">
        {/* ============================================================== */}
        {/* COLUMNA IZQUIERDA: PANEL DE CONTROL Y FÍSICA PROCEDIMENTAL     */}
        {/* ============================================================== */}
        <div className="w-full lg:w-[460px] xl:w-[500px] flex flex-col justify-between shrink-0 rounded-2xl border border-border bg-card/70 backdrop-blur-md overflow-hidden shadow-xl">
        {/* 1. Header del Estudio & Ticker Stats */}
        <div className="p-4 border-b border-border/70 space-y-3 bg-surface-sunken/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Motor Activo: {stats.fps} FPS
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
              <span>Tick: {stats.tick}</span>
              <span>•</span>
              <span>Org: {stats.organisms}</span>
              <span>•</span>
              <span>Cuadro: {stats.frameCostMs.toFixed(1)} ms</span>
              {stats.qualityTier > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-400">
                    Calidad {stats.qualityTier === 1 ? 'reducida' : 'mínima'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Selector de Pestañas de Control */}
          <div className="grid grid-cols-4 p-1 rounded-xl bg-surface-sunken border border-border/60 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('motor')}
              className={cn(
                'py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5',
                activeTab === 'motor'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Activity size={13} />
              <span>Lienzo Vivo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fisica')}
              className={cn(
                'py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5',
                activeTab === 'fisica'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Sliders size={13} />
              <span>Física</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('capas')}
              className={cn(
                'py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5',
                activeTab === 'capas'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Layers size={13} />
              <span>Capas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('exportar')}
              className={cn(
                'py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5',
                activeTab === 'exportar'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Film size={13} />
              <span>Master</span>
            </button>
          </div>
        </div>

        {/* 2. Cuerpo Desplazable del Panel de Parámetros */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {/* ---------------- PESTAÑA: MOTOR DEL SUSTRATO ---------------- */}
          {activeTab === 'motor' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Formato de Encuadre — Selector Compacto */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground uppercase">Formato de Encuadre</span>
                  <span className="text-foreground font-medium">
                    {currentDimensions.width} × {currentDimensions.height} px
                  </span>
                </div>
                <select
                  value={aspect}
                  onChange={(e) => setAspect(e.target.value as AspectRatioType)}
                  className="w-full rounded-xl border border-border bg-surface-sunken/60 px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[38px] cursor-pointer"
                >
                  <option value="4:5">4:5 — Feed Vertical (1080 × 1350 px)</option>
                  <option value="9:16">9:16 — Reel / Historia (1080 × 1920 px)</option>
                  <option value="1:1">1:1 — Feed Cuadrado (1080 × 1080 px)</option>
                  <option value="16:9">16:9 — Apaisado / Web (1920 × 1080 px)</option>
                </select>
              </div>

              {/* Selección del Motor Biológico */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Motor Generativo de Identidad
                </label>
                <div className="space-y-2">
                  {MOTOR_CONFIGS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleParamChange({ motor: m.id })}
                      className={cn(
                        'w-full p-3 rounded-xl border text-left transition-all flex flex-col gap-1',
                        params.motor === m.id
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border/60 bg-surface-sunken/30 hover:border-border hover:bg-surface-sunken/60',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif font-semibold tracking-wide text-foreground">
                          {m.label}
                        </span>
                        <span className="text-[10px] font-mono text-primary font-medium">
                          {m.tagline}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {m.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Paleta Cromática Territorial & Mixeador */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground uppercase">Paleta Cromática Territorial</span>
                  <span className="text-primary font-medium uppercase">
                    {params.customColor || activePalette.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(Object.keys(SUBSTRATE_PALETTES) as SubstratePaletteId[]).map((palKey) => {
                    const pal = SUBSTRATE_PALETTES[palKey];
                    const isSelected = !params.customColor && params.palette === palKey;
                    return (
                      <button
                        key={palKey}
                        type="button"
                        onClick={() => handleParamChange({ palette: palKey, customColor: undefined })}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all',
                          isSelected
                            ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-sm ring-1 ring-primary/40'
                            : 'border-border/70 bg-card hover:bg-surface-raised text-muted-foreground hover:text-foreground',
                        )}
                        title={`${pal.label} · ${pal.sublabel}`}
                      >
                        <span
                          className="h-3 w-3 rounded-full shrink-0 border border-black/20"
                          style={{ backgroundColor: pal.primaryHex }}
                        />
                        <span>{pal.label}</span>
                      </button>
                    );
                  })}

                  {/* Mixeador de Color Personalizado Libre */}
                  <div className="flex items-center gap-1.5 pl-1 ml-auto sm:ml-0">
                    <div className="relative flex items-center">
                      <input
                        type="color"
                        id="video-custom-color-picker"
                        value={params.customColor || activePalette.primaryHex}
                        onChange={(e) => handleParamChange({ customColor: e.target.value })}
                        className="h-7 w-7 rounded-lg border border-border bg-card cursor-pointer p-0.5"
                        title="Mixeador de color personalizado libre"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="#HEX"
                      value={params.customColor || ''}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val === '' || val.startsWith('#')) {
                          handleParamChange({ customColor: val || undefined });
                        } else {
                          handleParamChange({ customColor: `#${val}` });
                        }
                      }}
                      className="w-20 px-2 py-1 rounded-lg border border-border bg-card text-xs font-mono text-foreground placeholder:text-muted-foreground uppercase"
                      title="Ingresa código HEX hexadecimal directo"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- PESTAÑA: FÍSICA VECTORIAL Y CINEMÁTICA ---------------- */}
          {activeTab === 'fisica' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Dinámica de Cámara */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Dinámica de Cámara
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'respiracion' as const, label: 'Respiración', sub: 'Pulsación orgánica lenta' },
                    { id: 'ken_burns' as const, label: 'Ken Burns', sub: 'Zoom milimétrico continuo' },
                    { id: 'barrido' as const, label: 'Barrido Austral', sub: 'Drift horizontal suave' },
                    { id: 'estatico' as const, label: 'Estático', sub: 'Encuadre fijo puro' },
                  ].map((cam) => (
                    <button
                      key={cam.id}
                      type="button"
                      onClick={() => handleParamChange({ camera: cam.id })}
                      className={cn(
                        'p-2.5 rounded-xl border text-left transition-all',
                        params.camera === cam.id
                          ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40'
                          : 'border-border/60 bg-surface-sunken/40 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <div className="text-xs font-mono font-medium">{cam.label}</div>
                      <div className="text-[9px] text-muted-foreground">{cam.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dinámica Gravitacional */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Fuerzas Gravitacionales
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'curl' as const, label: 'Campo de Curl', sub: 'Flujo sin fuentes ni sumideros' },
                    { id: 'orbita' as const, label: 'Órbita Elíptica', sub: 'Doble foco de atracción' },
                    { id: 'flujo_laminar' as const, label: 'Flujo Laminar', sub: 'Corriente continua' },
                    { id: 'vortice' as const, label: 'Vórtice Suave', sub: 'Remolino centrado' },
                    { id: 'cursor' as const, label: 'Cursor Interactivo', sub: 'Responde a mouse/touch' },
                  ].map((grav) => (
                    <button
                      key={grav.id}
                      type="button"
                      onClick={() => handleParamChange({ gravity: grav.id })}
                      className={cn(
                        'p-2.5 rounded-xl border text-left transition-all',
                        params.gravity === grav.id
                          ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40'
                          : 'border-border/60 bg-surface-sunken/40 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <div className="text-xs font-mono font-medium">{grav.label}</div>
                      <div className="text-[9px] text-muted-foreground">{grav.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders de Simulación */}
              <div className="space-y-4 pt-2 border-t border-border/60">
                {/* Velocidad */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Velocidad de Flujo</span>
                    <span className="text-primary font-semibold">{params.flowSpeed.toFixed(2)}×</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.05"
                    value={params.flowSpeed}
                    onChange={(e) => handleParamChange({ flowSpeed: parseFloat(e.target.value) })}
                    className="w-full accent-primary h-1.5 rounded-lg bg-surface-sunken"
                  />
                </div>

                {/* Turbulencia */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Turbulencia Atmosférica</span>
                    <span className="text-primary font-semibold">{params.turbulence.toFixed(2)}×</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="3.0"
                    step="0.05"
                    value={params.turbulence}
                    onChange={(e) => handleParamChange({ turbulence: parseFloat(e.target.value) })}
                    className="w-full accent-primary h-1.5 rounded-lg bg-surface-sunken"
                  />
                </div>

                {/* Densidad de Organismos */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Densidad de Población</span>
                    <span className="text-primary font-semibold">{params.populationDensity}</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="320"
                    step="10"
                    value={params.populationDensity}
                    onChange={(e) => handleParamChange({ populationDensity: parseInt(e.target.value, 10) })}
                    className="w-full accent-primary h-1.5 rounded-lg bg-surface-sunken"
                  />
                </div>

                {/* Brillo & Luminiscencia */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Brillo & Luminiscencia</span>
                    <span className="text-primary font-semibold">{params.luminance.toFixed(2)}×</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={params.luminance}
                    onChange={(e) => handleParamChange({ luminance: parseFloat(e.target.value) })}
                    className="w-full accent-primary h-1.5 rounded-lg bg-surface-sunken"
                  />
                </div>

                {/* Persistencia de Estelas (Fade) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Persistencia de Estelas</span>
                    <span className="text-primary font-semibold">{params.fadePersistence.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.25"
                    step="0.005"
                    value={params.fadePersistence}
                    onChange={(e) => handleParamChange({ fadePersistence: parseFloat(e.target.value) })}
                    className="w-full accent-primary h-1.5 rounded-lg bg-surface-sunken"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ---------------- PESTAÑA: CAPAS & COMPOSICIÓN ---------------- */}
          {activeTab === 'capas' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Conmutación de Capas */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Capas Activas del Render
                </label>
                <div className="space-y-2">
                  {layerConfigs.map((layer) => {
                    const isActive = params.layers[layer.key];
                    return (
                      <div
                        key={layer.key}
                        onClick={() =>
                          handleParamChange({
                            layers: {
                              ...params.layers,
                              [layer.key]: !isActive,
                            },
                          })
                        }
                        className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-surface-sunken/40 hover:bg-surface-sunken transition-all cursor-pointer select-none"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-medium text-foreground">
                            {layer.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {layer.desc}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'text-xs font-mono font-bold px-2 py-0.5 rounded-md transition-colors',
                            isActive
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-surface-sunken text-muted-foreground/60 border border-border/40',
                          )}
                        >
                          {isActive ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modo de Fusión de Capas */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Modo de Fusión de Capas
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'screen' as const, label: 'Screen (Luz)', sub: 'Fusión transparente' },
                    { id: 'lighter' as const, label: 'Lighter (Aditivo)', sub: 'Luminiscencia intensa' },
                    { id: 'overlay' as const, label: 'Overlay (Contraste)', sub: 'Realce de tonos' },
                    { id: 'source-over' as const, label: 'Directo (Opaco)', sub: 'Trazo sólido puro' },
                  ].map((blend) => (
                    <button
                      key={blend.id}
                      type="button"
                      onClick={() => handleParamChange({ blendMode: blend.id })}
                      className={cn(
                        'p-2.5 rounded-xl border text-left transition-all',
                        params.blendMode === blend.id
                          ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40'
                          : 'border-border/60 bg-surface-sunken/40 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <div className="text-xs font-mono font-medium">{blend.label}</div>
                      <div className="text-[9px] text-muted-foreground">{blend.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Encuadre de Lámina Editorial */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Encuadre de la Lámina Editorial
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none' as const, label: 'Solo Lienzo Vivo', sub: 'Fondo botánico puro' },
                    { id: 'floating' as const, label: 'Tarjeta Flotante', sub: 'Recuadro con marco' },
                    { id: 'fog' as const, label: 'Fundido Atmosférico', sub: 'Niebla sutil integrada' },
                    { id: 'full' as const, label: 'Pantalla Plena', sub: 'Texto a borde completo' },
                  ].map((cardStyle) => (
                    <button
                      key={cardStyle.id}
                      type="button"
                      onClick={() => setCardOverlayStyle(cardStyle.id)}
                      className={cn(
                        'p-2.5 rounded-xl border text-left transition-all',
                        cardOverlayStyle === cardStyle.id
                          ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40'
                          : 'border-border/60 bg-surface-sunken/40 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <div className="text-xs font-mono font-medium">{cardStyle.label}</div>
                      <div className="text-[9px] text-muted-foreground">{cardStyle.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---------------- PESTAÑA: EXPORTACIÓN MASTER ---------------- */}
          {activeTab === 'exportar' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Duración del Clip */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Duración del Clip de Video
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5.0, 10.0, 15.0, 30.0].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setRecordingSeconds(sec)}
                      className={cn(
                        'p-2.5 rounded-xl border text-center transition-all font-mono',
                        recordingSeconds === sec
                          ? 'border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/40'
                          : 'border-border/60 bg-surface-sunken/40 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <span className="text-xs">{sec.toFixed(1)}s</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bitrate & Calidad */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Calidad de Codificación
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '8' as const, label: 'Estándar', bps: '8 Mbps' },
                    { id: '16' as const, label: 'Alta Fidelidad', bps: '16 Mbps' },
                    { id: '28' as const, label: 'Master 4K', bps: '28 Mbps' },
                  ].map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setVideoBitrate(q.id)}
                      className={cn(
                        'p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5',
                        videoBitrate === q.id
                          ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40'
                          : 'border-border/60 bg-surface-sunken/40 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <span className="text-xs font-mono font-medium">{q.label}</span>
                      <span className="text-[10px] text-muted-foreground">{q.bps}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Monitor de Grabación */}
              {isRecording && (
                <div className="p-4 rounded-xl border border-destructive/50 bg-destructive/10 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-2 font-bold text-destructive">
                      <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-ping" />
                      CODIFICANDO VIDEO... {recordingProgress}%
                    </span>
                    <span className="text-muted-foreground">
                      {((recordingSeconds * recordingProgress) / 100).toFixed(1)}s / {recordingSeconds.toFixed(1)}s
                    </span>
                  </div>
                  <div className="w-full bg-surface-sunken h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-destructive h-full transition-all duration-100 ease-linear"
                      style={{ width: `${recordingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Footer con Acciones de Descarga y Grabación */}
        <div className="p-4 border-t border-border/70 bg-surface-sunken/40 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadPNG}
              className="btn btn-outline h-11 text-xs font-mono flex items-center justify-center gap-2 rounded-xl border-border hover:border-primary/50 text-foreground"
              title="Descargar fotograma en resolución nativa PNG"
            >
              <Camera size={15} className="text-primary" />
              <span>Fotograma PNG</span>
            </button>

            {isRecording ? (
              <button
                type="button"
                onClick={handleStopRecording}
                className="btn btn-destructive h-11 text-xs font-mono flex items-center justify-center gap-2 rounded-xl shadow-lg"
              >
                <Square size={15} />
                <span>Cancelar ({recordingProgress}%)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  void handleStartRecording();
                }}
                className="btn btn-primary h-11 text-xs font-mono flex items-center justify-center gap-2 rounded-xl shadow-lg font-semibold"
                title={`Grabar clip de video de ${recordingSeconds}s`}
              >
                <Play size={15} className="fill-current" />
                <span>Grabar Video ({recordingSeconds}s)</span>
              </button>
            )}
          </div>

          <p className="text-[10px] font-mono text-center text-muted-foreground">
            Renderizado 100% acelerado por GPU local en navegador · Cero latencia de red
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* COLUMNA DERECHA: LIENZO EN VIVO (VIEWPORT INTERACTIVO)         */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col items-center justify-between relative rounded-2xl border border-border bg-background/90 p-4 sm:p-6 overflow-hidden shadow-2xl min-h-[480px]">
        {/* Header flotante del Viewport */}
        <div className="w-full flex items-center justify-between z-20 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-surface-sunken/90 border border-border text-[11px] font-mono text-foreground backdrop-blur-md">
              {currentDimensions.width} × {currentDimensions.height} px ({aspect})
            </span>
            {isRecording && (
              <span className="px-2.5 py-1 rounded-lg bg-destructive/90 text-primary-foreground text-[11px] font-mono font-bold animate-pulse backdrop-blur-md">
                GRABANDO {recordingProgress}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => simRef.current?.triggerPulse()}
              className="btn btn-outline btn-xs h-7 px-2.5 rounded-lg text-[11px] font-mono bg-surface-sunken/80 backdrop-blur-md flex items-center gap-1.5 hover:border-primary/60"
              title="Generar pulso gravitacional de prueba"
            >
              <Zap size={12} className="text-primary" />
              <span>Emitir Pulso</span>
            </button>
            <button
              type="button"
              onClick={() => simRef.current?.resetSimulation()}
              className="btn btn-outline btn-xs h-7 px-2.5 rounded-lg text-[11px] font-mono bg-surface-sunken/80 backdrop-blur-md flex items-center gap-1.5 hover:border-primary/60"
              title="Reiniciar partículas"
            >
              <RotateCcw size={12} />
              <span>Reiniciar</span>
            </button>
          </div>
        </div>

        {/* Contenedor del Lienzo con Escala Automática sin Desfase */}
        <div className="relative flex items-center justify-center w-full flex-1 min-h-0 p-1 sm:p-2 overflow-hidden">
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-black flex items-center justify-center"
            style={{
              aspectRatio: `${currentDimensions.width} / ${currentDimensions.height}`,
              maxHeight: '100%',
              maxWidth: '100%',
              height: currentDimensions.height >= currentDimensions.width ? '100%' : 'auto',
              width: currentDimensions.width >= currentDimensions.height ? '100%' : 'auto',
            }}
          >
            {/* 1. Canvas 2D Procedimental */}
            <canvas
              ref={canvasRef}
              width={currentDimensions.width}
              height={currentDimensions.height}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerLeave={handleCanvasPointerLeave}
              className="w-full h-full block cursor-crosshair select-none touch-none"
            />

            {/* 2. Superposición de Lámina Editorial (solo si está explícitamente activa y no es 'none') */}
            {cardOverlayStyle !== 'none' && (
              <div
                className={cn(
                  'absolute inset-0 pointer-events-none flex flex-col justify-between transition-all duration-300',
                  cardOverlayStyle === 'floating'
                    ? 'p-6 sm:p-8 rounded-2xl border border-primary/20 backdrop-blur-[3px] bg-background/30'
                    : cardOverlayStyle === 'fog'
                    ? 'p-8 sm:p-12 bg-gradient-to-t from-background/90 via-background/40 to-transparent'
                    : 'p-8 sm:p-12 flex flex-col justify-between',
                )}
              >
                {/* Kicker Superior */}
                <div className="flex justify-between items-center text-[10px] font-mono tracking-widest uppercase">
                  <span className="text-primary font-medium">
                    {activeSlide?.kickerLeft || 'CHILOÉ 42°S // ESTÁNDAR DE ORIGEN'}
                  </span>
                  <span className="text-muted-foreground">
                    {activeSlide?.kickerRight || 'RECOLECCIÓN SILVESTRE'}
                  </span>
                </div>

                {/* Título Principal en Cormorant Garamond */}
                <div className="space-y-3 my-auto max-w-xl">
                  <h2
                    className="font-serif text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-foreground leading-[1.12]"
                    style={{ color: activePalette.primaryHex }}
                  >
                    {activeSlide?.title || projectTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-foreground/80 font-sans leading-relaxed">
                    {activeSlide?.subtitle || 'Miel cruda de bosque nativo, sin pasteurizar, sin ultrafiltrar.'}
                  </p>
                </div>

                {/* Footer de Trazabilidad */}
                <div className="flex justify-between items-center text-[9px] font-mono tracking-wider text-muted-foreground border-t border-border/40 pt-3">
                  <span>{activeSlide?.footerLeft || 'obrerayzangano.cl'}</span>
                  <span className="text-primary">
                    {activeSlide?.footerRight || 'CERTIFICADO DE ORIGEN VERIFICADO'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hint de Interacción en el fondo */}
        <div className="pt-2 text-[10px] font-mono text-muted-foreground/80 pointer-events-none text-center">
          Haz clic o arrastra sobre el lienzo para emitir ondas gravitacionales y guiar el flujo
        </div>
      </div>
    </div>
  </div>
);
}
