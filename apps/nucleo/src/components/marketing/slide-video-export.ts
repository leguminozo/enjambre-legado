/**
 * slide-video-export.ts — Armado de video de la pieza, en el equipo del usuario.
 *
 * Dos caminos, en orden de preferencia:
 *
 *   webcodecs     Cuadro a cuadro. El tiempo exacto se respeta siempre,
 *                 el archivo sale reproducible y el códec es el que pide el
 *                 destino (H.264 para Reels/TikTok, VP9 para web abierta).
 *   mediarecorder Grabación en vivo. Entra como respaldo: el equipo puede ir
 *                 más lento que el reloj y el video se estira.
 *
 * Ninguno de los dos caminos toca el servidor: el archivo se arma en el
 * navegador y se descarga.
 */

import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  Quality,
  WebMOutputFormat,
  type VideoCodec,
} from 'mediabunny';

export type VideoFormat = 'mp4' | 'webm';

export interface VideoExportRequest {
  width: number;
  height: number;
  fps: number;
  durationMs: number;
  format: VideoFormat;
  /** Dibuja el cuadro pedido. Debe pintar el lienzo completo. */
  drawFrame: (index: number, timestampMs: number) => void | Promise<void>;
  /**
   * Lienzo donde se pinta. Si no se entrega, el exportador crea uno.
   * Entregarlo permite que el motor que ya anima (sustrato) pinte directo.
   */
  canvas?: HTMLCanvasElement;
  /** Tasa de bits objetivo. */
  bitrate?: number;
  onProgress?: (progress: number) => void;
  /** Permite cortar la exportación desde afuera. */
  isCancelled?: () => boolean;
}

export interface VideoExportResult {
  blob: Blob;
  path: 'webcodecs' | 'mediarecorder';
  /** El archivo sale igual si se repite la exportación. */
  deterministic: boolean;
  mime: string;
}

export class ExportCancelledError extends Error {
  constructor() {
    super('La exportación fue cancelada.');
    this.name = 'ExportCancelledError';
  }
}

function canUseWebCodecs(): boolean {
  return typeof window !== 'undefined' && 'VideoEncoder' in window;
}

function canUseMediaRecorder(): boolean {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return false;
  return typeof HTMLCanvasElement !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype;
}

function codecFor(format: VideoFormat): VideoCodec {
  return format === 'mp4' ? 'avc' : 'vp9';
}

function mimeFor(format: VideoFormat): string {
  return format === 'mp4' ? 'video/mp4' : 'video/webm';
}

function totalFramesFor(request: VideoExportRequest): number {
  return Math.max(1, Math.round((request.durationMs / 1000) * request.fps));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Camino preferente: codificación cuadro a cuadro.
 * El tiempo del archivo no depende de lo rápido que dibuje el equipo.
 */
export async function encodeWithWebCodecs(
  request: VideoExportRequest,
): Promise<VideoExportResult | null> {
  if (!canUseWebCodecs()) return null;

  const canvas = request.canvas ?? document.createElement('canvas');
  if (!request.canvas) {
    canvas.width = request.width;
    canvas.height = request.height;
  }

  const format = request.format === 'mp4' ? new Mp4OutputFormat({ fastStart: 'in-memory' }) : new WebMOutputFormat();
  const output = new Output({ format, target: new BufferTarget() });

  const source = new CanvasSource(canvas, {
    codec: codecFor(request.format),
    quality: new Quality({ bitrate: request.bitrate ?? 8_000_000 }),
    keyFrameInterval: 2,
  });

  output.addVideoTrack(source, { frameRate: request.fps });
  await output.start();

  const totalFrames = totalFramesFor(request);
  const frameDuration = 1 / request.fps;

  try {
    for (let index = 0; index < totalFrames; index++) {
      if (request.isCancelled?.()) throw new ExportCancelledError();
      await request.drawFrame(index, index * frameDuration * 1000);
      await source.add(index * frameDuration, frameDuration);
      request.onProgress?.((index + 1) / totalFrames);
    }
  } catch (error) {
    await output.cancel();
    throw error;
  }

  source.close();
  await output.finalize();

  const buffer = output.target.buffer;
  if (!buffer) return null;

  return {
    blob: new Blob([buffer], { type: mimeFor(request.format) }),
    path: 'webcodecs',
    deterministic: true,
    mime: mimeFor(request.format),
  };
}

/**
 * Respaldo: grabación en vivo del lienzo.
 * Requiere que el equipo sostenga el ritmo: si no, el video se estira.
 */
export async function encodeWithMediaRecorder(
  request: VideoExportRequest,
): Promise<VideoExportResult | null> {
  if (!canUseMediaRecorder()) return null;

  const canvas = request.canvas ?? document.createElement('canvas');
  if (!request.canvas) {
    canvas.width = request.width;
    canvas.height = request.height;
  }

  const mimeCandidates =
    request.format === 'mp4'
      ? ['video/mp4;codecs=avc1', 'video/mp4']
      : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

  const mimeType = mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
  if (!mimeType) return null;

  const stream = canvas.captureStream(request.fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: request.bitrate ?? 8_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const finished = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });

  recorder.start();

  const totalFrames = totalFramesFor(request);
  const frameMs = 1000 / request.fps;
  const startedAt = performance.now();

  try {
    for (let index = 0; index < totalFrames; index++) {
      if (request.isCancelled?.()) throw new ExportCancelledError();
      await request.drawFrame(index, index * frameMs);
      const due = startedAt + (index + 1) * frameMs;
      const wait = due - performance.now();
      if (wait > 1) await sleep(wait);
      request.onProgress?.((index + 1) / totalFrames);
    }
  } catch (error) {
    if (recorder.state !== 'inactive') recorder.stop();
    throw error;
  }

  recorder.stop();
  const blob = await finished;

  return {
    blob,
    path: 'mediarecorder',
    deterministic: false,
    mime: mimeType,
  };
}

/**
 * Exporta la pieza en video con el mejor camino disponible.
 * Lanza si el equipo no puede armar video.
 */
export async function exportVideo(request: VideoExportRequest): Promise<VideoExportResult> {
  if (canUseWebCodecs()) {
    const result = await encodeWithWebCodecs(request);
    if (result) return result;
  }
  if (canUseMediaRecorder()) {
    const result = await encodeWithMediaRecorder(request);
    if (result) return result;
  }
  throw new Error('Este equipo no puede armar video. Exporta la imagen y el modelo.');
}
