'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/pos/cart-context';
import { db, type ProductoLocal } from '@/lib/offline/db';
import { triggerScanFeedback } from '@/lib/pos-feedback';
import { useBarcodeGun } from '@/hooks/use-barcode-gun';
import { formatCLP, HexagonLoader } from '@enjambre/ui';
import {
  Camera,
  CameraOff,
  X,
  Flashlight,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  QrCode,
} from 'lucide-react';

export interface ContinuousStreamScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContinuousStreamScanner({ isOpen, onClose }: ContinuousStreamScannerProps) {
  const router = useRouter();
  const { lines, total, scanAndAdd } = useCart();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [lastScanned, setLastScanned] = useState<{
    nombre: string;
    code: string;
    precio: number;
    timestamp: number;
  } | null>(null);

  // Productos locales en Dexie para resolución inmediata offline
  const [productos, setProductos] = useState<ProductoLocal[]>([]);
  const [unresolvedCode, setUnresolvedCode] = useState<string | null>(null);
  // SSR-safe check para BarcodeDetector (requiere iOS 17+, Chrome o Edge; no disponible en Safari iOS < 17)
  const [hasBarcodeDetector, setHasBarcodeDetector] = useState(true);

  useEffect(() => {
    setHasBarcodeDetector(typeof window !== 'undefined' && 'BarcodeDetector' in window);
  }, []);

  const isScanningRef = useRef(false);
  const scanFrameRef = useRef<() => void>(() => {});
  const lastCodeTimeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Cargar catálogo local
  useEffect(() => {
    if (!isOpen) return;
    void db.productos.toArray().then((list) => {
      setProductos(list.filter((p) => p.visible !== false));
    });
  }, [isOpen]);

  // Índice en memoria para resolución O(1) de escaneo continuo (30-60 fps)
  const productosById = useMemo(() => {
    return new Map(productos.map((p) => [p.id.toLowerCase(), p]));
  }, [productos]);

  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
    setTorchOn(false);
  }, []);

  const handleProductResolved = useCallback(
    (product: ProductoLocal, code: string) => {
      if (product.precio == null) return;

      scanAndAdd(
        {
          producto_id: product.id,
          nombre: product.nombre ?? 'Producto',
          precio_unitario: product.precio,
        },
        code,
      );

      triggerScanFeedback('success');
      setLastScanned({
        nombre: product.nombre ?? 'Producto',
        code,
        precio: product.precio,
        timestamp: Date.now(),
      });
      setUnresolvedCode(null);
    },
    [scanAndAdd],
  );

  const processScannedCode = useCallback(
    (rawCode: string) => {
      const code = rawCode.trim();
      if (!code) return;

      const now = Date.now();
      // Cooldown de 1.4s para el mismo código exacto
      if (
        lastCodeTimeRef.current.code === code &&
        now - lastCodeTimeRef.current.time < 1400
      ) {
        return;
      }
      lastCodeTimeRef.current = { code, time: now };

      // Estrategia 1: Coincidencia O(1) por ID de producto (UUID)
      const byId = productosById.get(code.toLowerCase());
      if (byId) {
        handleProductResolved(byId, code);
        return;
      }

      // Estrategia 2: Si el código es una URL (ej. https://.../cata/XYZ o /producto/crema-de-miel)
      if (code.startsWith('http://') || code.startsWith('https://')) {
        try {
          const url = new URL(code);
          const pathSegments = url.pathname.split('/').filter(Boolean);
          const lastSegment = pathSegments[pathSegments.length - 1] ?? '';

          const bySlug = productos.find((p) =>
            p.nombre?.toLowerCase().includes(lastSegment.toLowerCase().replace(/-/g, ' ')),
          );
          if (bySlug) {
            handleProductResolved(bySlug, lastSegment);
            return;
          }
        } catch {
          // URL no parseable; continuar con la siguiente estrategia de resolución
        }
      }

      // Estrategia 3: Coincidencia por nombre o código en catálogo
      const byName = productos.find(
        (p) => p.nombre && code.toLowerCase().includes(p.nombre.toLowerCase()),
      );
      if (byName) {
        handleProductResolved(byName, code);
        return;
      }

      // Si el código no está mapeado a un producto directo, pero hay un solo producto en catálogo
      if (productos.length === 1 && productos[0]) {
        handleProductResolved(productos[0], code);
        return;
      }

      // Si no se puede deducir automáticamente, ofrecer selector de 1 toque (Teach mode)
      triggerScanFeedback('error');
      setUnresolvedCode(code);
    },
    [productos, productosById, handleProductResolved],
  );

  // Escuchar pistola lectora física conectada por Bluetooth o USB
  useBarcodeGun({
    onScan: processScannedCode,
    enabled: isOpen,
  });

  const scanFrame = useCallback(() => {
    if (!isScanningRef.current) return;
    const video = videoRef.current;
    const Detector =
      typeof window !== 'undefined'
        ? (
            window as Window & {
              BarcodeDetector?: new (opts: { formats: string[] }) => {
                detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
              };
            }
          ).BarcodeDetector
        : undefined;

    if (!Detector) {
      // BarcodeDetector no disponible en este navegador (Safari iOS < 17).
      // No continuar el bucle rAF para evitar gasto innecesario de batería/CPU.
      return;
    }

    if (!video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrameRef.current);
      return;
    }

    const detector = new Detector({
      formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'data_matrix'],
    });

    void detector
      .detect(video)
      .then((codes) => {
        if (!isScanningRef.current) return;
        const value = codes[0]?.rawValue?.trim();
        if (value) {
          processScannedCode(value);
        }
        rafRef.current = requestAnimationFrame(scanFrameRef.current);
      })
      .catch(() => {
        if (!isScanningRef.current) return;
        rafRef.current = requestAnimationFrame(scanFrameRef.current);
      });
  }, [processScannedCode]);

  useEffect(() => {
    scanFrameRef.current = scanFrame;
  }, [scanFrame]);

  const startCamera = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }

      // Verificar linterna (torch)
      const track = stream.getVideoTracks()[0];
      if (track) {
        const caps = track.getCapabilities ? (track.getCapabilities() as { torch?: boolean }) : {};
        setHasTorch(Boolean(caps.torch));
      }

      setActive(true);
      isScanningRef.current = true;
      rafRef.current = requestAnimationFrame(scanFrameRef.current);
    } catch {
      setError('No se pudo acceder a la cámara. Usa el ingreso manual o verifica los permisos.');
      stopCamera();
    } finally {
      setStarting(false);
    }
  }, [stopCamera]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextState = !torchOn;
      await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch {
      // Linterna no admitida
    }
  };

  useEffect(() => {
    if (isOpen) {
      void startCamera();
    } else {
      stopCamera();
      setLastScanned(null);
      setUnresolvedCode(null);
    }
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  const totalItemsCount = lines.reduce((acc, l) => acc + l.cantidad, 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in duration-200">
      {/* Cabecera del Escáner */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <QrCode size={16} />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold leading-tight text-foreground">
              Escaneo Rápido de Feria
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Pasa los frascos frente a la cámara en ráfaga continua
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasTorch && active && (
            <button
              type="button"
              onClick={() => void toggleTorch()}
              className={`min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl border transition-colors ${
                torchOn
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground'
              }`}
              title={torchOn ? 'Apagar linterna' : 'Encender linterna'}
              aria-label="Alternar linterna"
            >
              <Flashlight size={18} />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-destructive/10 transition-colors"
            title="Cerrar escáner"
            aria-label="Cerrar escáner"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Visor de Cámara Central */}
      <div className="relative flex-1 bg-surface-sunken overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            active ? 'opacity-100' : 'opacity-0'
          }`}
          playsInline
          muted
        />

        {!active && !starting && (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center z-10">
            <CameraOff size={40} className="text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground max-w-xs">
              {error ?? 'Cámara pausada o no iniciada.'}
            </p>
            <button
              type="button"
              onClick={() => void startCamera()}
              className="min-h-11 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Reintentar Cámara
            </button>
          </div>
        )}

        {starting && (
          <div className="flex flex-col items-center justify-center gap-2 z-10">
            <HexagonLoader />
            <span className="text-xs text-muted-foreground tracking-widest uppercase mt-2">
              Iniciando visor...
            </span>
          </div>
        )}

        {/* Retícula de Enfoque con feedback dinámico */}
        {active && hasBarcodeDetector && (
          <div className="relative pointer-events-none w-64 h-64 sm:w-72 sm:h-72 border-2 border-dashed border-primary/60 rounded-3xl flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-primary/[0.03] animate-pulse" />
            <div className="w-12 h-1 bg-primary/40 rounded-full" />
            <span className="absolute bottom-3 text-[10px] uppercase font-mono tracking-widest text-primary/80 bg-background/80 px-2 py-0.5 rounded-md backdrop-blur-sm">
              Apunta al código QR
            </span>
          </div>
        )}

        {/* Fallback elegante para navegadores sin BarcodeDetector (Safari iOS < 17) */}
        {active && !hasBarcodeDetector && (
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-sm z-20 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-card/95 border border-warning/40 p-4 rounded-2xl shadow-xl backdrop-blur-md text-center space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-warning/15 text-warning flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Detección en visor no admitida
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El detector óptico automático requiere Safari en iOS 17+ o Google Chrome. Puedes escanear con una pistola lectora física (Bluetooth/USB) o escribir el código abajo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notificación Flotante del último frasco escaneado */}
        {lastScanned && (
          <div className="absolute top-4 inset-x-4 mx-auto max-w-sm z-20 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="bg-card/95 border border-success/40 p-3 rounded-2xl shadow-xl backdrop-blur-md flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    +1 {lastScanned.nombre}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Código: {lastScanned.code.slice(0, 14)}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-primary shrink-0">
                {formatCLP(lastScanned.precio)}
              </span>
            </div>
          </div>
        )}

        {/* Modal Teach Mode: Si el código es nuevo o desconocido */}
        {unresolvedCode && (
          <div className="absolute inset-x-4 bottom-4 z-30 bg-card/95 border border-warning/40 p-4 rounded-2xl shadow-2xl backdrop-blur-md max-w-md mx-auto animate-in slide-in-from-bottom-3">
            <div className="flex items-start gap-2.5 mb-3">
              <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-foreground">Código no asociado automáticamente</p>
                <p className="text-[11px] text-muted-foreground">
                  ¿A qué producto corresponde este frasco? (Toca uno para sumarlo)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
              {productos.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleProductResolved(prod, unresolvedCode)}
                  className="p-2 text-left rounded-xl bg-surface-sunken hover:bg-primary/10 border border-border transition-all text-xs"
                >
                  <p className="font-semibold text-foreground truncate">{prod.nombre}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {prod.precio != null ? formatCLP(prod.precio) : ''}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barra Inferior del Carrito en Vivo */}
      <div className="p-4 bg-card border-t border-border flex flex-col gap-3">
        {/* Entrada manual de respaldo */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!manualInput.trim()) return;
            processScannedCode(manualInput.trim());
            setManualInput('');
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="O escribe/pega código manual o pistola..."
            className="flex-1 bg-surface-sunken border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!manualInput.trim()}
            className="min-h-11 px-4 bg-surface-raised border border-border hover:border-primary text-foreground text-xs font-bold rounded-xl transition-colors disabled:opacity-40"
          >
            Añadir
          </button>
        </form>

        {/* Resumen y Botón de Cobro Rápido */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <ShoppingBag size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">
                {totalItemsCount === 1 ? '1 unidad en carrito' : `${totalItemsCount} unidades`}
              </p>
              <p className="text-lg font-mono font-bold text-primary leading-tight">
                {formatCLP(total)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              router.push('/pos/carrito');
            }}
            disabled={totalItemsCount === 0}
            className="min-h-11 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-sm font-bold tracking-wide uppercase flex items-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-40 shadow-sm"
          >
            <span>Ir a Cobrar</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
