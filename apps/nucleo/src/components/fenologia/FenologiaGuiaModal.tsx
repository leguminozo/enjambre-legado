'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Thermometer,
  Calendar,
  Flower2,
  TrendingUp,
  MapPin,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Compass,
} from 'lucide-react';

export interface FenologiaGuiaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FenologiaGuiaModal({ isOpen, onClose }: FenologiaGuiaModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'fundamento' | 'gdd' | 'operativa' | 'calibracion'>('fundamento');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-auto bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-surface-raised shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Flower2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-foreground leading-tight">
                Oráculo Fenológico y Grados-Día (GDD)
              </h2>
              <p className="text-xs text-muted-foreground">
                Fundamento bio-climático y guía operativa para apicultura de precisión territorial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-sunken transition-colors"
            aria-label="Cerrar guía"
          >
            <X size={18} />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-border bg-background shrink-0 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('fundamento')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeTab === 'fundamento'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
            }`}
          >
            1. ¿Qué es y Para Qué Sirve?
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gdd')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeTab === 'gdd'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
            }`}
          >
            2. ¿Cómo se Calcula el GDD?
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('operativa')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeTab === 'operativa'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
            }`}
          >
            3. Aplicación en Colmena y Miel
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calibracion')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              activeTab === 'calibracion'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
            }`}
          >
            4. Calibración en Terreno
          </button>
        </div>

        {/* Contenido Desplazable */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-foreground/90 leading-relaxed">
          {activeTab === 'fundamento' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-2">
                <div className="flex items-center gap-2 text-primary font-medium text-xs uppercase tracking-wider">
                  <Compass size={14} />
                  <span>El reloj biológico del bosque nativo</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  Las plantas no leen calendarios: responden a la energía térmica
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  En el bosque templado lluvioso de Chiloé, una misma especie (como el Ulmo o el Canelo) puede florecer 3 semanas antes o 3 semanas después respecto al año anterior. Esto no depende del mes del calendario, sino del <strong>calor solar acumulado</strong> que las yemas florales han absorbido desde el invierno.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-border bg-surface-sunken space-y-1.5">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar size={13} className="text-accent" />
                    Enfoque Tradicional (Ciego)
                  </span>
                  <p className="text-muted-foreground">
                    Poner alzas melarias en una fecha fija ("el 15 de enero"). Si el año fue frío, la flor aún no abre y las abejas consumen reservas; si fue cálido, la flor abrió antes y el néctar principal se perdió.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-1.5">
                  <span className="font-semibold text-primary flex items-center gap-1.5">
                    <TrendingUp size={13} className="text-primary" />
                    Enfoque Fenológico (Oráculo)
                  </span>
                  <p className="text-muted-foreground">
                    Monitorear la curva térmica en tiempo real por satélite y proyección a 16 días. Sabes exactamente qué semana romperá el botón floral en tu comuna para colocar alzas limpias y capturar miel monofloral pura.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gdd' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-3">
                <div className="flex items-center gap-2 text-accent font-medium text-xs uppercase tracking-wider">
                  <Thermometer size={14} />
                  <span>Fórmula Universal de Grados-Día de Desarrollo</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  GDD (Growing Degree Days): Medición de energía bioclimática
                </h3>
                <div className="p-3 rounded-lg bg-surface-sunken border border-border font-mono text-xs text-primary space-y-1">
                  <p className="font-bold">GDD diario = max(0, Temperatura Media Diaria - Tbase)</p>
                  <p className="text-[11px] text-muted-foreground">
                    Para la flora templada de Chiloé: Tbase = 5.0°C. Solo los grados por encima de 5°C activan la fisiología vegetal.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Inicio del ciclo:</strong> En el hemisferio sur, la acumulación térmica se reinicia cada <strong>1 de julio</strong> (solsticio de invierno). Desde esa fecha, cada día con temperaturas sobre 5°C aporta grados al contador.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Umbrales térmicos de referencia (Flora de Chiloé):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-lg border border-border bg-surface-raised">
                    <div className="font-semibold text-foreground">Notro / Canelo</div>
                    <div className="text-primary text-sm font-bold">~360°d</div>
                    <div className="text-[10px] text-muted-foreground">Primavera temprana (Oct)</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border bg-surface-raised">
                    <div className="font-semibold text-foreground">Patagua / Tiaca</div>
                    <div className="text-accent text-sm font-bold">~930°d</div>
                    <div className="text-[10px] text-muted-foreground">Verano pleno (Dic-Ene)</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border bg-surface-raised">
                    <div className="font-semibold text-foreground">Ulmo / Arrayán</div>
                    <div className="text-success text-sm font-bold">~1.200°d - 1.370°d</div>
                    <div className="text-[10px] text-muted-foreground">Verano tardío (Feb-Mar)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'operativa' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-2">
                <div className="flex items-center gap-2 text-success font-medium text-xs uppercase tracking-wider">
                  <CheckCircle2 size={14} />
                  <span>Beneficios tangibles para el apicultor</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  4 Decisiones críticas que el Oráculo resuelve
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl border border-border bg-surface-sunken flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <span className="font-semibold text-foreground block">Mieles Monoflorales Certificables</span>
                    <p className="text-muted-foreground mt-0.5">
                      Si colocas las alzas justo cuando el Ulmo alcanza su umbral (1.200°d) y las retiras antes de que abra la floración acompañante, logras una pureza polínica superior al 85%, duplicando el valor comercial por kilo.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-surface-sunken flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <span className="font-semibold text-foreground block">Prevención Quirúrgica de Enjambrazón</span>
                    <p className="text-muted-foreground mt-0.5">
                      Cuando el Canelo o el Notro están al 90% de su umbral, el flujo masivo de néctar bloqueará la postura de la reina en 72 horas. Saberlo te permite agrandar el nido o dividir núcleos antes de perder el enjambre.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-surface-sunken flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <span className="font-semibold text-foreground block">Trashumancia Inteligente</span>
                    <p className="text-muted-foreground mt-0.5">
                      La costa oriental de Chiloé (Curaco de Vélez, Quinchao) acumula calor más rápido que la cordillera de Piuchén o la costa de Cucao. Puedes trasladar colmenas para aprovechar una floración dos veces en la misma temporada.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-surface-sunken flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <span className="font-semibold text-foreground block">Protección Fitosanitaria en Floración</span>
                    <p className="text-muted-foreground mt-0.5">
                      Prohibido aplicar tratamientos en colmena durante el pecoreo de floraciones principales para preservar la pureza orgánica cero-residuos de la miel nativa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calibracion' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-2">
                <div className="flex items-center gap-2 text-primary font-medium text-xs uppercase tracking-wider">
                  <Lightbulb size={14} />
                  <span>Ciencia participativa y calibración</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  El satélite proyecta, pero tus ojos en el bosque confirman
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Los satélites ERA5 y las estaciones climáticas proveen la temperatura macro, pero cada quebrada, ladera y bosque de Chiloé tiene microclimas particulares. Por eso, tu rol en terreno es indispensable.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl border border-border bg-surface-sunken space-y-2">
                  <span className="font-semibold text-foreground">¿Cómo calibrar una especie?</span>
                  <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
                    <li>
                      Cuando salgas al bosque o apiario y veas los primeros botones abiertos (fase BBCH 65: plena floración), toca el botón <strong>«Registro de Campo»</strong> en el encabezado o <strong>«+ Observar»</strong> en la tarjeta de la especie.
                    </li>
                    <li>
                      Selecciona la fecha exacta, el sector o predio, e intensidad aproximada de flores.
                    </li>
                    <li>
                      Al pulsar <strong>«Calibrar»</strong> en cualquier tarjeta, el sistema cruzará tus observaciones reales con los grados-día acumulados ese día exacto, ajustando el umbral para que la predicción del próximo año sea infalible.
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="px-6 py-4 border-t border-border bg-surface-raised flex items-center justify-between shrink-0">
          <span className="text-[11px] text-muted-foreground font-mono">
            Modelo fenológico biocultural · Chiloé, Chile
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary text-xs min-h-9 px-4"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
