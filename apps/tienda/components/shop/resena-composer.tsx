'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FAMILIAS_AROMATICAS,
  CATEGORIAS_SENSORIALES,
  CATEGORIAS_SENSORIALES_LABELS,
  RESENA_COPY,
  DEGUSTACION_CONFIG_DEFAULT,
  obtenerGuiaEjeSensorial,
  type CategoriaSensorial,
  type CreateResenaInput,
  type AtributosSensoriales,
} from '@enjambre/resenas';
import { friendlyError, toast } from '@enjambre/ui';
import {
  Star,
  Check,
  Plus,
  UtensilsCrossed,
  Tag,
  PenLine,
  ChevronRight,
  ChevronLeft,
  UserCheck,
} from 'lucide-react';
import { RESENA_CLAIM_TOKEN_KEY } from '@/lib/shop/commerce-storage';
import { checkEligible, createResena, getAuthToken } from '@/lib/shop/resenas-api';
import { useAuth } from '@/components/providers/auth-context';
import { TiendaModal } from '@/components/shop/tienda-modal';
import { RadarConstellation } from '@/components/shop/radar-constellation';

type Modo = 'anonima' | 'guardian';
type Step = 1 | 2 | 3;

export interface VarianteOption {
  id: string;
  nombre_variante: string;
  tipo_variante: string;
  ingrediente_fortificante?: string | null;
  peso_neto_g?: number | null;
  precio_override?: number | null;
}

export interface ResenaComposerProps {
  productoId: string;
  productName: string;
  productSlug?: string;
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  tipoSensorial?: CategoriaSensorial | string;
  tipoSensorialLabel?: string | null;
  perfilSensorial?: {
    intensidad?: number;
    dulzor_acidez?: number;
    textura?: number;
    descriptores_intensidad?: { izq?: string; der?: string };
    descriptores_dulzor?: { izq?: string; der?: string };
    descriptores_textura?: { izq?: string; der?: string };
    notas_aromaticas?: string[];
    maridajes?: Array<{ titulo: string; detalle: string }>;
    momento_consumo?: string;
    ejes?: string[];
    ejes_calibracion?: Record<string, number> | null;
    pares_semanticos?: Array<{ par: string; izq: string; der: string }>;
    qr_modo?: 'experiencia' | 'trazabilidad' | 'comercial';
    qr_titulo?: string;
    qr_mensaje?: string;
    qr_cta_resena?: string;
  } | null;
  variantes?: VarianteOption[];
  initialVarianteId?: string;
}

// Descriptores limpios y precisos sin adjetivos redundantes
const DESCRIPTORES_RATING: Record<number, string> = {
  7: 'Excepcional',
  6: 'Sobresaliente',
  5: 'Muy Buena',
  4: 'Buena',
  3: 'Regular',
  2: 'Deficiente',
  1: 'Atípica',
};

// Selector de 7 estrellas centrado y sobrio
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2.5">
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-1 sm:p-1.5 min-h-[46px] min-w-[42px] flex flex-col items-center justify-center transition-all hover:scale-110 active:scale-95 rounded-xl hover:bg-surface-sunken cursor-pointer"
            aria-label={`${n} de 7 estrellas`}
          >
            <Star
              size={24}
              className={n <= value ? 'fill-accent text-accent-text drop-shadow-xs' : 'text-muted-foreground/25'}
            />
            <span className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">{n}</span>
          </button>
        ))}
      </div>
      <p className="text-xs font-semibold text-accent-text tracking-wide text-center">
        {value} de 7 estrellas — {DESCRIPTORES_RATING[value] ?? 'Valoración'}
      </p>
    </div>
  );
}

const modalFieldClass =
  'w-full rounded-xl border border-border bg-secondary/35 px-3.5 py-2.5 text-base sm:text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition placeholder:text-muted-foreground/50';

function formatInitials(raw: string | undefined): string | undefined {
  if (!raw || !raw.trim()) return undefined;
  const trimmed = raw.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts.map((p) => `${p[0].toUpperCase()}.`).join(' ');
  }
  if (parts.length === 1 && parts[0].length > 3) {
    return `${parts[0][0].toUpperCase()}.`;
  }
  return trimmed;
}

export function ResenaComposer({
  productoId,
  productName,
  open,
  onClose,
  onSubmitted,
  tipoSensorial = 'miel',
  tipoSensorialLabel,
  perfilSensorial,
  variantes = [],
  initialVarianteId,
}: ResenaComposerProps) {
  const { isAuthenticated } = useAuth();
  const [modo, setModo] = useState<Modo>(isAuthenticated ? 'guardian' : 'anonima');
  const [step, setStep] = useState<Step>(1);
  const [selectedVarianteId, setSelectedVarianteId] = useState<string | null>(initialVarianteId ?? null);
  const [rating, setRating] = useState(7);
  const [comentario, setComentario] = useState('');
  const [displayName, setDisplayName] = useState('');

  // 8 Ejes Sensoriales Canónicos
  const activeAxes = DEGUSTACION_CONFIG_DEFAULT.ejesSensorialesCanonicos;
  const [ejesCalibracionState, setEjesCalibracionState] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const axis of DEGUSTACION_CONFIG_DEFAULT.ejesSensorialesCanonicos) {
      initial[axis] = perfilSensorial?.ejes_calibracion?.[axis] ?? DEGUSTACION_CONFIG_DEFAULT.valorInicialEje;
    }
    return initial;
  });

  // Notas botánicas y aromáticas
  const [selectedNotas, setSelectedNotas] = useState<Set<string>>(new Set());
  const [customNotaInput, setCustomNotaInput] = useState('');

  // Momento & Maridaje
  const [momento, setMomento] = useState('');
  const [maridaje, setMaridaje] = useState('');

  // Firma Sensorial del Catador (Paso 3)
  const [notas, setNotas] = useState('');

  const [loading, setLoading] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    compraVerificada?: boolean;
    venta_id?: string | null;
    reason?: string;
  } | null>(null);

  // Sincronizar modo con autenticación automáticamente:
  // Si está logeado -> cata sensorial completa
  // Si no está logeado -> cata rápida de visitante
  useEffect(() => {
    setModo(isAuthenticated ? 'guardian' : 'anonima');
  }, [isAuthenticated]);

  // Reiniciar paso al abrir/cerrar modal
  useEffect(() => {
    if (open) {
      setStep(1);
    }
  }, [open]);

  const selectedVariante = useMemo(
    () => variantes.find((v) => v.id === selectedVarianteId) ?? null,
    [variantes, selectedVarianteId],
  );

  const effectiveTipo: CategoriaSensorial = useMemo(() => {
    if (selectedVariante) {
      if (
        selectedVariante.tipo_variante === 'fortificacion' ||
        (selectedVariante.ingrediente_fortificante && selectedVariante.ingrediente_fortificante !== 'ninguno')
      ) {
        return 'miel_fortificada';
      }
    }
    const valid = CATEGORIAS_SENSORIALES as readonly string[];
    if (tipoSensorial && valid.includes(tipoSensorial)) {
      return tipoSensorial as CategoriaSensorial;
    }
    return 'miel';
  }, [selectedVariante, tipoSensorial]);

  const availableNotas = useMemo(() => {
    const set = new Set<string>();
    if (perfilSensorial?.notas_aromaticas) {
      for (const n of perfilSensorial.notas_aromaticas) {
        if (n && n.trim()) set.add(n.trim());
      }
    }
    for (const f of FAMILIAS_AROMATICAS) {
      set.add(f);
    }
    return Array.from(set);
  }, [perfilSensorial?.notas_aromaticas]);

  const toggleNota = (nota: string) => {
    setSelectedNotas((prev) => {
      const next = new Set(prev);
      if (next.has(nota)) next.delete(nota);
      else next.add(nota);
      return next;
    });
  };

  const handleAddCustomNota = () => {
    const trimmed = customNotaInput.trim();
    if (!trimmed) return;
    setSelectedNotas((prev) => new Set([...prev, trimmed]));
    setCustomNotaInput('');
  };

  const updateAxis = (axis: string, deltaOrVal: number, isAbsolute = false) => {
    setEjesCalibracionState((prev) => {
      const current = prev[axis] ?? DEGUSTACION_CONFIG_DEFAULT.valorInicialEje;
      const newVal = isAbsolute ? deltaOrVal : current + deltaOrVal;
      const clamped = Math.max(1.0, Math.min(10.0, Number(newVal.toFixed(1))));
      return { ...prev, [axis]: clamped };
    });
  };

  useEffect(() => {
    const handleOpenWithDetail = (e: Event) => {
      const custom = e as CustomEvent<{ intensidad?: number; varianteId?: string | null }>;
      if (custom.detail?.varianteId !== undefined) {
        setSelectedVarianteId(custom.detail.varianteId);
      }
    };
    window.addEventListener('enjambre:open-resena-composer', handleOpenWithDetail);
    return () => window.removeEventListener('enjambre:open-resena-composer', handleOpenWithDetail);
  }, []);

  useEffect(() => {
    if (!open || modo !== 'guardian' || !isAuthenticated) {
      setEligibility(null);
      return;
    }

    let cancelled = false;
    setEligibilityLoading(true);

    void (async () => {
      const token = await getAuthToken();
      if (!token || cancelled) {
        setEligibilityLoading(false);
        return;
      }
      const result = await checkEligible(productoId, token);
      if (!cancelled) {
        setEligibility(result);
        setEligibilityLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, modo, isAuthenticated, productoId]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = modo === 'guardian' ? await getAuthToken() : undefined;
      let payload: CreateResenaInput;

      if (modo === 'anonima') {
        if (comentario.trim().length < 3) {
          toast('Por favor comparte al menos unas palabras sobre tu experiencia', { type: 'error' });
          return;
        }
        payload = {
          modo: 'anonima',
          producto_id: productoId,
          variante_id: selectedVarianteId || undefined,
          tipo_sensorial: effectiveTipo,
          rating,
          comentario_corto: comentario.trim(),
          display_name: formatInitials(displayName) || undefined,
        };
      } else {
        if (!token) {
          toast('Inicia sesión para registrar tu huella en el Legado Sensorial', { type: 'error' });
          return;
        }
        if (notas.trim().length < 10) {
          toast('La firma sensorial requiere al menos 10 caracteres', { type: 'error' });
          return;
        }

        const intensidadCalculada = Math.round(ejesCalibracionState['Intensidad de Sabor'] ?? 7);
        const primeraNota = Array.from(selectedNotas)[0];
        const familiaFallback = (
          FAMILIAS_AROMATICAS.includes(primeraNota as (typeof FAMILIAS_AROMATICAS)[number])
            ? primeraNota
            : 'floral'
        ) as (typeof FAMILIAS_AROMATICAS)[number];

        const baseExtra: AtributosSensoriales = {
          tipo: 'miel',
          cristalizacion: 'Cremosa',
          familia_aromatica: familiaFallback,
          intensidad_fondo: Math.min(10, Math.max(1, intensidadCalculada)),
          ejes_calibracion: ejesCalibracionState,
          notas_seleccionadas: Array.from(selectedNotas),
          maridaje_sugerido: maridaje.trim() || undefined,
          momento_sugerido: momento.trim() || undefined,
        };

        payload = {
          modo: 'guardian',
          producto_id: productoId,
          variante_id: selectedVarianteId || undefined,
          tipo_sensorial: effectiveTipo,
          rating,
          venta_id: eligibility?.venta_id ?? undefined,
          atributos: baseExtra,
          cristalizacion_percibida: 'Cremosa',
          familia_aromatica: familiaFallback,
          intensidad_fondo: Math.min(10, Math.max(1, intensidadCalculada)),
          notas_personales: notas.trim(),
          momento_consumo: momento.trim() || undefined,
          maridaje: maridaje.trim() || undefined,
          comentario_corto: comentario.trim() || undefined,
        };
      }

      const result = await createResena(payload, token);
      if (!result.ok) {
        toast(friendlyError(result.error, result.error ?? 'No se pudo guardar la reseña'), { type: 'error' });
        return;
      }

      if (result.claimToken) {
        localStorage.setItem(RESENA_CLAIM_TOKEN_KEY, result.claimToken);
      }

      toast(result.message ?? RESENA_COPY.pendingModeration, { type: 'success' });
      onSubmitted?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Título y descripción centralizados y adaptados según el modo
  const modalKicker =
    selectedVariante
      ? `Edición · ${selectedVariante.nombre_variante}`
      : tipoSensorialLabel || CATEGORIAS_SENSORIALES_LABELS[effectiveTipo] || 'Expresión Botánica de Origen';

  const modalTitle =
    modo === 'guardian'
      ? selectedVariante
        ? `Cata Sensorial · ${selectedVariante.nombre_variante}`
        : `Cata Sensorial · ${productName}`
      : selectedVariante
        ? `Testimonio Sensorial · ${selectedVariante.nombre_variante}`
        : `Testimonio Sensorial · ${productName}`;

  const modalSubtitle =
    modo === 'guardian'
      ? 'Comparte lo que sentiste al degustar esta creación y suma tu experiencia a la comunidad.'
      : 'Comparte tu experiencia en un instante. Ideal para degustaciones en terreno y primeras impresiones.';

  return (
    <TiendaModal
      open={open}
      onClose={onClose}
      headerCentered
      kicker={modalKicker}
      title={modalTitle}
      subtitle={modalSubtitle}
      ariaLabel={`Crear reseña sensorial de ${productName}`}
      size="2xl"
      bodyClassName="p-4 sm:p-7 space-y-6"
      footer={
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground/80 text-center sm:text-left order-2 sm:order-1">
            {modo === 'guardian'
              ? 'Tu firma sensorial será moderada en Núcleo y acreditará ciclos a tu cuenta.'
              : 'Tu opinión pasará por moderación previa antes de publicarse en la tienda.'}
          </p>

          <div className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-end gap-2.5">
            {modo === 'anonima' ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="hidden sm:inline-flex min-h-[46px] items-center justify-center px-5 rounded-full border border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void handleSubmit()}
                  className="w-full sm:w-auto min-h-[46px] rounded-full bg-primary px-8 py-2.5 text-xs uppercase tracking-wider font-semibold text-primary-foreground hover:bg-primary/90 transition-opacity disabled:opacity-50 shadow-md cursor-pointer"
                >
                  {loading ? 'Publicando...' : 'Publicar Testimonio de Paso'}
                </button>
              </>
            ) : (
              <>
                {step === 1 && (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="hidden sm:inline-flex min-h-[46px] items-center justify-center px-5 rounded-full border border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-2.5 text-xs uppercase tracking-wider font-semibold text-primary-foreground hover:bg-primary/90 transition-opacity shadow-md cursor-pointer"
                    >
                      <span>Siguiente: Experiencia en Paladar</span>
                      <ChevronRight size={14} />
                    </button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex min-h-[46px] items-center justify-center gap-1.5 px-5 rounded-full border border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                      <span>Atrás</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-2.5 text-xs uppercase tracking-wider font-semibold text-primary-foreground hover:bg-primary/90 transition-opacity shadow-md cursor-pointer"
                    >
                      <span>Siguiente: Notas & Reseña</span>
                      <ChevronRight size={14} />
                    </button>
                  </>
                )}

                {step === 3 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex min-h-[46px] items-center justify-center gap-1.5 px-5 rounded-full border border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                      <span>Atrás</span>
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void handleSubmit()}
                      className="w-full sm:w-auto min-h-[46px] rounded-full bg-primary px-8 py-2.5 text-xs uppercase tracking-wider font-semibold text-primary-foreground hover:bg-primary/90 transition-opacity disabled:opacity-50 shadow-md cursor-pointer"
                    >
                      {loading ? 'Confirmando...' : 'Confirmar Huella en el Legado Sensorial (+ciclos)'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {modo === 'anonima' ? (
          /* ================================================================ */
          /* MODO VISITANTES (Rápido & Anónimo)                               */
          /* ================================================================ */
          <div className="max-w-xl mx-auto space-y-6 py-1">
            {/* Selector de Variante / Edición si existen opciones */}
            {variantes.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-2.5 text-center">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">
                  ¿Qué edición o formato probaste?
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVarianteId(null)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition min-h-[40px] cursor-pointer ${
                      selectedVarianteId === null
                        ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                        : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Formato Base
                  </button>
                  {variantes.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVarianteId(v.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium transition min-h-[40px] cursor-pointer ${
                        selectedVarianteId === v.id
                          ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                          : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {v.nombre_variante}
                      {v.peso_neto_g ? ` · ${v.peso_neto_g}g` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calificación de Excelencia (Centrada y sin textos redundantes) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-3 text-center">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                Calificación de Excelencia
              </span>
              <StarPicker value={rating} onChange={setRating} />
            </div>

            {/* Testimonio */}
            <div className="p-5 sm:p-6 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block text-center">
                Tu testimonio sensorial
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                maxLength={280}
                rows={4}
                placeholder={
                  effectiveTipo === 'miel_fortificada'
                    ? 'Describe qué sensaciones te evocó la combinación de miel cruda y la adición botánica...'
                    : 'Describe qué sensaciones, texturas o recuerdos te evocó esta expresión del bosque...'
                }
                className={`${modalFieldClass} resize-none`}
              />
              <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1">
                <span>Sé descriptivo y sincero.</span>
                <span className="font-mono">{comentario.length} / 280</span>
              </div>
            </div>

            {/* Iniciales o Alias Voluntario */}
            <div className="p-5 sm:p-6 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block text-center">
                Tus iniciales o alias voluntario
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ej. G. C. o Visitante del Sur"
                className={modalFieldClass}
              />
              <p className="text-[11px] text-muted-foreground/80 leading-relaxed text-center">
                Por resguardo de privacidad (Ley N° 19.628 de Protección de la Vida Privada), solo se exhibirán iniciales o tu alias.
              </p>
            </div>
          </div>
        ) : (
          /* ================================================================ */
          /* MODO CATA SENSORIAL COMPLETA (Paso a Paso Canon QR)              */
          /* ================================================================ */
          <div className="space-y-6">
            {!isAuthenticated ? (
              <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl border border-primary/30 bg-primary/5 space-y-4 text-center my-2">
                <div className="inline-flex p-3 rounded-2xl bg-primary/15 text-primary mx-auto">
                  <UserCheck size={32} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-display text-2xl text-foreground font-semibold">
                    Cata Completa del Enjambre Legado
                  </h4>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Inicia sesión para calibrar los 8 ejes sensoriales, registrar notas botánicas y acreditar ciclos a tu cuenta.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-xs uppercase tracking-wider font-semibold hover:bg-primary/90 transition-all shadow-sm"
                  >
                    <UserCheck size={16} />
                    <span>Acceder con mi Cuenta</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setModo('anonima')}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-border text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Continuar como Visitante
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* ── PASO 1: Formato & Calificación Global ────────────────── */}
                {step === 1 && (
                  <div className="max-w-xl mx-auto space-y-6 py-1 animate-in fade-in duration-300">
                    <div className="text-center space-y-1.5 pb-1">
                      <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
                        Paso 1 de 3 · Evaluación Global
                      </span>
                      <h4 className="font-display text-xl sm:text-2xl text-foreground font-semibold">
                        Calificación de Excelencia
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        Valora la pureza y maestría general de esta expresión botánica.
                      </p>
                    </div>

                    {/* Selector de Variante */}
                    {variantes.length > 0 && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-2.5 text-center">
                        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">
                          Edición o variante probada
                        </span>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedVarianteId(null)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition min-h-[40px] cursor-pointer ${
                              selectedVarianteId === null
                                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Formato Base
                          </button>
                          {variantes.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setSelectedVarianteId(v.id)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition min-h-[40px] cursor-pointer ${
                                selectedVarianteId === v.id
                                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                  : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {v.nombre_variante}
                              {v.peso_neto_g ? ` · ${v.peso_neto_g}g` : ''}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Calificación 1 a 7 Estrellas */}
                    <div className="p-6 sm:p-7 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                          Calificación de Excelencia
                        </span>
                        {eligibilityLoading ? (
                          <span className="text-[11px] text-muted-foreground italic">· Verificando...</span>
                        ) : eligibility?.compraVerificada ? (
                          <span className="text-[11px] text-success-text font-medium inline-flex items-center gap-1">
                            <Check size={12} />
                            Compra verificada
                          </span>
                        ) : null}
                      </div>
                      <StarPicker value={rating} onChange={setRating} />
                    </div>
                  </div>
                )}

                {/* ── PASO 2: Tu Experiencia en Paladar (8 Notas Canónicas) ──── */}
                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="text-center space-y-1.5 pb-1">
                      <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
                        Paso 2 de 3 · Tu Experiencia en Paladar
                      </span>
                      {selectedVariante && (
                        <span className="inline-block px-3 py-0.5 rounded-full bg-surface-sunken border border-border/60 text-xs font-medium text-foreground">
                          {selectedVariante.nombre_variante}
                        </span>
                      )}
                      <h4 className="font-display text-xl sm:text-2xl text-foreground font-semibold tracking-tight">
                        Mapa de Sabores & Sensaciones
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Ajusta cada nota del 1.0 al 10.0 según lo que sientes en tu boca. Tu red sensorial se dibuja en tiempo real.
                      </p>
                    </div>

                    {/* Telaraña / Radar Visual Interactivo */}
                    <div className="p-4 sm:p-5 bg-card/60 border border-border/80 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-xs">
                      <div className="w-full flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground pb-2 border-b border-border/50 mb-2">
                        <span>Tu Mapa de Degustación ({activeAxes.length} Notas)</span>
                        <span className="text-primary font-bold">1.0 — 10.0</span>
                      </div>
                      <RadarConstellation axes={activeAxes} scores={ejesCalibracionState} size={220} />
                    </div>

                    {/* Deslizadores de las 8 Notas Sensoriales */}
                    <div className="space-y-3 bg-card/60 border border-border/80 p-4 sm:p-5 rounded-2xl shadow-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-border/50">
                        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                          Notas y Sensaciones en Boca
                        </span>
                        <span className="text-[11px] text-primary font-mono font-medium">
                          Ajusta con el deslizador o con + / -
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {activeAxes.map((axis: string, idx: number) => {
                          const val = ejesCalibracionState[axis] ?? DEGUSTACION_CONFIG_DEFAULT.valorInicialEje;
                          const guia = obtenerGuiaEjeSensorial(axis);

                          return (
                            <div
                              key={axis}
                              className="p-3 bg-surface-sunken/60 border border-border/60 rounded-xl space-y-2 hover:border-primary/40 transition-colors"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-card border border-border/80 flex items-center justify-center font-mono text-[10px] text-muted-foreground font-semibold">
                                    {idx + 1}
                                  </span>
                                  <span className="font-medium text-foreground tracking-tight">{axis}</span>
                                </div>
                                <div className="flex items-center gap-1.5 font-mono">
                                  <span className="text-sm font-bold text-primary tabular-nums">
                                    {val.toFixed(1)}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">/ 10</span>
                                </div>
                              </div>

                              <p className="text-[11px] text-muted-foreground leading-snug">
                                {guia.preguntaGuia}
                              </p>

                              <div className="flex items-center gap-2.5 pt-0.5">
                                <button
                                  type="button"
                                  aria-label={`Reducir ${axis}`}
                                  onClick={() => updateAxis(axis, -0.5)}
                                  className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:bg-surface-raised active:scale-95 text-sm font-bold transition-transform cursor-pointer"
                                >
                                  -
                                </button>
                                <div className="flex-1">
                                  <input
                                    type="range"
                                    min="1.0"
                                    max="10.0"
                                    step="0.5"
                                    value={val}
                                    aria-label={`Intensidad de ${axis}`}
                                    onChange={(e) => updateAxis(axis, parseFloat(e.target.value), true)}
                                    className="w-full accent-primary h-2 bg-card rounded-lg appearance-none cursor-pointer focus:outline-none"
                                  />
                                </div>
                                <button
                                  type="button"
                                  aria-label={`Aumentar ${axis}`}
                                  onClick={() => updateAxis(axis, 0.5)}
                                  className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:bg-surface-raised active:scale-95 text-sm font-bold transition-transform cursor-pointer"
                                >
                                  +
                                </button>
                              </div>

                              <div className="flex justify-between text-[10px] font-mono text-muted-foreground px-0.5">
                                <span className="truncate pr-2">{guia.extremoIzq}</span>
                                <span className="truncate pl-2 text-right">{guia.extremoDer}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PASO 3: Botánica, Maridaje & Firma Sensorial ─────────── */}
                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="text-center space-y-1.5 pb-1">
                      <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
                        Paso 3 de 3 · Notas & Reseña
                      </span>
                      <h4 className="font-display text-xl sm:text-2xl text-foreground font-semibold">
                        Notas Botánicas & Firma Sensorial
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Selecciona los matices que lograste percibir y describe tu impresión final.
                      </p>
                    </div>

                    {/* Card 1: Notas Aromáticas & Botánicas Reconocidas */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 text-xs text-foreground font-semibold uppercase tracking-wider">
                            <Tag size={14} className="text-primary" />
                            <span>Notas Aromáticas & Botánicas Reconocidas</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Marca los aromas y notas que lograste percibir al degustar.
                          </p>
                        </div>
                        {selectedNotas.size > 0 && (
                          <span className="text-xs text-accent-text font-semibold px-2 py-0.5 rounded-full bg-accent/15 border border-accent/25">
                            {selectedNotas.size} {selectedNotas.size === 1 ? 'nota' : 'notas'}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1 max-h-[170px] overflow-y-auto pr-1">
                        {availableNotas.map((n) => {
                          const active = selectedNotas.has(n);
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => toggleNota(n)}
                              className={`text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                                active
                                  ? 'bg-accent/20 text-accent-text font-semibold border border-accent/40 shadow-xs'
                                  : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:border-border'
                              }`}
                            >
                              {active && <Check size={13} />}
                              <span>{n}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                        <input
                          type="text"
                          value={customNotaInput}
                          onChange={(e) => setCustomNotaInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomNota();
                            }
                          }}
                          placeholder="¿Descubriste otra nota botánica? Escríbela aquí..."
                          className={`${modalFieldClass} text-xs py-2`}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomNota}
                          disabled={!customNotaInput.trim()}
                          className="px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border text-xs font-semibold text-foreground hover:bg-surface-sunken disabled:opacity-40 transition shrink-0 cursor-pointer"
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Card 2: Momento y Maridaje Recomendado */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-xs text-foreground font-semibold uppercase tracking-wider">
                          <UtensilsCrossed size={14} className="text-primary" />
                          <span>Momento & Maridaje Recomendado</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Sugerencias de la casa configuradas para esta floración.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                          <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                            Momento de Degustación
                          </label>
                          <input
                            value={momento}
                            onChange={(e) => setMomento(e.target.value)}
                            placeholder="ej. Sobremesa pausada"
                            className={modalFieldClass}
                          />
                          <div className="flex flex-wrap gap-1 pt-1">
                            {[
                              perfilSensorial?.momento_consumo,
                              'Sobremesa pausada',
                              'Desayuno de origen',
                              'Ritual nocturno',
                            ]
                              .filter((v): v is string => Boolean(v && v.trim()))
                              .map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setMomento(preset)}
                                  className={`text-[10px] px-2 py-0.5 rounded-full border transition cursor-pointer ${
                                    momento === preset
                                      ? 'bg-primary/20 text-primary border-primary/40 font-semibold'
                                      : 'bg-surface-raised border-border/70 text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                            Maridaje Sugerido
                          </label>
                          <input
                            value={maridaje}
                            onChange={(e) => setMaridaje(e.target.value)}
                            placeholder="ej. Queso azul, café filtrado"
                            className={modalFieldClass}
                          />
                          <div className="flex flex-wrap gap-1 pt-1">
                            {[
                              ...(perfilSensorial?.maridajes?.map((m) => m.titulo) ?? []),
                              'Quesos maduros',
                              'Café de especialidad',
                              'Pan de masa madre',
                            ]
                              .filter(Boolean)
                              .slice(0, 4)
                              .map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setMaridaje(preset)}
                                  className={`text-[10px] px-2 py-0.5 rounded-full border transition cursor-pointer ${
                                    maridaje === preset
                                      ? 'bg-primary/20 text-primary border-primary/40 font-semibold'
                                      : 'bg-surface-raised border-border/70 text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Firma Sensorial & Impresiones del Catador */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-foreground font-semibold uppercase tracking-wider">
                          <PenLine size={14} className="text-primary" />
                          <span>Firma Sensorial del Catador</span>
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {notas.length} / 600
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Describe con precisión la apertura aromática, texturas y persistencia final de {productName}.
                      </p>
                      <textarea
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        maxLength={600}
                        rows={4}
                        placeholder="En nariz evoca... en paladar abre con una textura... dejando un retrogusto..."
                        className={`${modalFieldClass} resize-none leading-relaxed`}
                      />
                      <p className="text-[11px] text-muted-foreground/80">
                        Mínimo 10 caracteres. Al confirmarse, sumará datos a la Constelación Sensorial de Cata.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </TiendaModal>
  );
}
