'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CRISTALIZACION_OPCIONES,
  FAMILIAS_AROMATICAS,
  CATEGORIAS_SENSORIALES,
  CATEGORIAS_SENSORIALES_LABELS,
  FORTIFICANTES_CANONICOS,
  FORTIFICANTES_LABELS,
  FORTIFICADA_TEXTURAS,
  HIDROMIEL_ESTILOS,
  HIDROMIEL_EFERVESCENCIA,
  EXTRACTO_SENSACIONES,
  COSMETICA_ABSORCIONES,
  MOMENTO_RECOLECCION_OPCIONES,
  MOMENTO_RECOLECCION_LABELS,
  PARES_SEMANTICOS_POR_CATEGORIA,
  RESENA_COPY,
  type CategoriaSensorial,
  type CreateResenaInput,
  type AtributosSensoriales,
  type FortificanteCanonico,
  type MomentoRecoleccion,
} from '@enjambre/resenas';
import { friendlyError, toast } from '@enjambre/ui';
import {
  Star,
  ShieldCheck,
  Compass,
  UserCheck,
  Sparkles,
  Sliders,
  Check,
  Plus,
  UtensilsCrossed,
  Clock,
  Tag,
  Info,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { RESENA_CLAIM_TOKEN_KEY } from '@/lib/shop/commerce-storage';
import { checkEligible, createResena, getAuthToken } from '@/lib/shop/resenas-api';
import { useAuth } from '@/components/providers/auth-context';
import { TiendaModal } from '@/components/shop/tienda-modal';

type Modo = 'anonima' | 'guardian';

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

const DESCRIPTORES_RATING: Record<number, string> = {
  7: 'Excepcional · Calidad Superior de Origen',
  6: 'Sobresaliente · Expresión Botánica Viva',
  5: 'Muy Buena · Carácter Genuino',
  4: 'Buena · Correcta y Balanceada',
  3: 'Regular',
  2: 'Deficiente',
  1: 'Atípica',
};

// Selector de 7 estrellas con feedback cualitativo
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-1 sm:p-1.5 min-h-[46px] min-w-[42px] flex flex-col items-center justify-center transition-all hover:scale-110 active:scale-95 rounded-xl hover:bg-surface-sunken"
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
      <p className="text-xs font-semibold text-accent-text tracking-wide">
        {value} de 7 estrellas — {DESCRIPTORES_RATING[value] ?? 'Valoración de origen'}
      </p>
    </div>
  );
}

const modalFieldClass =
  'w-full rounded-xl border border-border bg-secondary/35 px-3.5 py-2.5 text-base sm:text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition placeholder:text-muted-foreground/50';

/** Disocia nombres completos a iniciales (conforme a Ley 19.628 de Protección de la Vida Privada) */
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
  productSlug,
  open,
  onClose,
  onSubmitted,
  tipoSensorial = 'miel',
  tipoSensorialLabel,
  perfilSensorial,
  variantes = [],
  initialVarianteId,
}: ResenaComposerProps) {
  const [modo, setModo] = useState<Modo>('guardian');
  const [selectedVarianteId, setSelectedVarianteId] = useState<string | null>(initialVarianteId ?? null);
  const [rating, setRating] = useState(7);
  const [comentario, setComentario] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Parámetros organolépticos adaptativos
  const [cristalizacion, setCristalizacion] = useState<string>(CRISTALIZACION_OPCIONES[0]);
  const [familia, setFamilia] = useState<string>(FAMILIAS_AROMATICAS[0]);
  const [intensidad, setIntensidad] = useState(7);
  const [momentoRecoleccion, setMomentoRecoleccion] = useState<MomentoRecoleccion>('primera_extraccion');
  const [notas, setNotas] = useState('');
  const [momento, setMomento] = useState('');
  const [maridaje, setMaridaje] = useState('');

  // Miel Fortificada
  const [fortificante, setFortificante] = useState<string>(FORTIFICANTES_CANONICOS[0]);
  const [balanceInclusion, setBalanceInclusion] = useState(6);
  const [texturaInclusion, setTexturaInclusion] = useState<string>(FORTIFICADA_TEXTURAS[0]);

  // Hidromiel
  const [hidromielEstilo, setHidromielEstilo] = useState<string>(HIDROMIEL_ESTILOS[1]);
  const [hidromielEfervescencia, setHidromielEfervescencia] = useState<string>(HIDROMIEL_EFERVESCENCIA[1]);
  const [acidezViva, setAcidezViva] = useState(6);
  const [tanicidad, setTanicidad] = useState(5);

  // Extracto
  const [extractoSensacion, setExtractoSensacion] = useState<string>(EXTRACTO_SENSACIONES[1]);
  const [concentracion, setConcentracion] = useState(8);

  // Cosmética
  const [cosmeticaAbsorcion, setCosmeticaAbsorcion] = useState<string>(COSMETICA_ABSORCIONES[1]);
  const [sensacionGrasa, setSensacionGrasa] = useState(4);

  // Infusión
  const [intensidadInfusion, setIntensidadInfusion] = useState(7);
  const [complejidadHerbal, setComplejidadHerbal] = useState(7);

  // Fortificaciones puras
  const [tostado, setTostado] = useState(7);
  const [molienda, setMolienda] = useState('Molienda fina sedosa');
  const [untuosidad, setUntuosidad] = useState(7);

  // Pares Semánticos Dinámicos (Contrastes)
  const [paresState, setParesState] = useState<Record<string, number>>({});

  // Notas Aromáticas / Botánicas Seleccionadas
  const [selectedNotas, setSelectedNotas] = useState<Set<string>>(new Set());
  const [customNotaInput, setCustomNotaInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    compraVerificada?: boolean;
    venta_id?: string | null;
    reason?: string;
  } | null>(null);
  const { isAuthenticated } = useAuth();

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

  // Pares semánticos activos: configurados en Núcleo para este producto o defaults por familia
  const activePares = useMemo(() => {
    if (perfilSensorial?.pares_semanticos && perfilSensorial.pares_semanticos.length > 0) {
      return perfilSensorial.pares_semanticos;
    }
    return PARES_SEMANTICOS_POR_CATEGORIA[effectiveTipo] ?? PARES_SEMANTICOS_POR_CATEGORIA.miel;
  }, [perfilSensorial?.pares_semanticos, effectiveTipo]);

  // Inicializar estado de pares semánticos
  useEffect(() => {
    setParesState((prev) => {
      const next = { ...prev };
      for (const p of activePares) {
        if (next[p.par] === undefined) {
          next[p.par] = 6;
        }
      }
      return next;
    });
  }, [activePares]);

  // Notas botánicas y aromáticas disponibles para tildar
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

  useEffect(() => {
    if (selectedVariante?.ingrediente_fortificante && selectedVariante.ingrediente_fortificante !== 'ninguno') {
      setFortificante(selectedVariante.ingrediente_fortificante);
    }
  }, [selectedVariante]);

  useEffect(() => {
    const handleOpenWithDetail = (e: Event) => {
      const custom = e as CustomEvent<{ intensidad?: number; varianteId?: string | null }>;
      if (custom.detail?.intensidad) {
        setIntensidad(custom.detail.intensidad);
      }
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

  const buildAtributos = (): AtributosSensoriales => {
    const baseExtra = {
      pares_semanticos: paresState,
      notas_seleccionadas: Array.from(selectedNotas),
      maridaje_sugerido: maridaje.trim() || undefined,
      momento_sugerido: momento.trim() || undefined,
    };

    switch (effectiveTipo) {
      case 'miel':
        return {
          tipo: 'miel',
          cristalizacion: cristalizacion as (typeof CRISTALIZACION_OPCIONES)[number],
          familia_aromatica: familia as (typeof FAMILIAS_AROMATICAS)[number],
          intensidad_fondo: intensidad,
          momento_recoleccion: momentoRecoleccion,
          ...baseExtra,
        };
      case 'miel_fortificada':
        return {
          tipo: 'miel_fortificada',
          fortificante: (selectedVariante?.ingrediente_fortificante && selectedVariante.ingrediente_fortificante !== 'ninguno'
            ? selectedVariante.ingrediente_fortificante
            : fortificante) as (typeof FORTIFICANTES_CANONICOS)[number],
          balance_inclusion: balanceInclusion,
          textura_inclusion: texturaInclusion as (typeof FORTIFICADA_TEXTURAS)[number],
          intensidad_fondo: intensidad,
          familia_aromatica: familia as (typeof FAMILIAS_AROMATICAS)[number],
          ...baseExtra,
        };
      case 'fortificaciones':
        return {
          tipo: 'fortificaciones',
          tostado,
          molienda,
          untuosidad,
          intensidad_fondo: intensidad,
          ...baseExtra,
        };
      case 'hidromiel':
        return {
          tipo: 'hidromiel',
          estilo: hidromielEstilo as (typeof HIDROMIEL_ESTILOS)[number],
          efervescencia: hidromielEfervescencia as (typeof HIDROMIEL_EFERVESCENCIA)[number],
          acidez_viva: acidezViva,
          tanicidad,
          ...baseExtra,
        };
      case 'extracto':
        return {
          tipo: 'extracto',
          percepcion_garganta: extractoSensacion as (typeof EXTRACTO_SENSACIONES)[number],
          concentracion_percibida: concentracion,
          ...baseExtra,
        };
      case 'cosmetica':
        return {
          tipo: 'cosmetica',
          absorcion_dermica: cosmeticaAbsorcion as (typeof COSMETICA_ABSORCIONES)[number],
          sensacion_grasa: sensacionGrasa,
          ...baseExtra,
        };
      case 'infusion':
        return {
          tipo: 'infusion',
          intensidad_infusion: intensidadInfusion,
          complejidad_herbal: complejidadHerbal,
          ...baseExtra,
        };
      default:
        return {
          tipo: String(effectiveTipo),
          ...baseExtra,
        };
    }
  };

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
          toast('La cata sensorial requiere al menos 10 caracteres', { type: 'error' });
          return;
        }
        payload = {
          modo: 'guardian',
          producto_id: productoId,
          variante_id: selectedVarianteId || undefined,
          tipo_sensorial: effectiveTipo,
          rating,
          venta_id: eligibility?.venta_id ?? undefined,
          atributos: buildAtributos(),
          cristalizacion_percibida: effectiveTipo === 'miel' ? (cristalizacion as (typeof CRISTALIZACION_OPCIONES)[number]) : undefined,
          familia_aromatica: (effectiveTipo === 'miel' || effectiveTipo === 'miel_fortificada') ? (familia as (typeof FAMILIAS_AROMATICAS)[number]) : undefined,
          intensidad_fondo: intensidad,
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

  return (
    <TiendaModal
      open={open}
      onClose={onClose}
      kicker={
        selectedVariante
          ? `Edición · ${selectedVariante.nombre_variante}`
          : tipoSensorialLabel || CATEGORIAS_SENSORIALES_LABELS[effectiveTipo] || 'Expresión Botánica de Origen'
      }
      title={
        selectedVariante
          ? `Cata de ${selectedVariante.nombre_variante}`
          : `Cata Sensorial · ${productName}`
      }
      subtitle="Registra tu apreciación organoléptica para enriquecer la constelación comunitaria."
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

          <div className="w-full sm:w-auto order-1 sm:order-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="hidden sm:inline-flex min-h-[48px] items-center justify-center px-5 rounded-full border border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition"
            >
              Cancelar
            </button>

            {modo === 'guardian' && !isAuthenticated ? (
              <Link
                href="/login"
                className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <UserCheck size={16} />
                <span>Acceder con mi Cuenta Legado</span>
              </Link>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleSubmit()}
                className="w-full sm:w-auto min-h-[48px] rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
              >
                {loading
                  ? 'Registrando huella...'
                  : modo === 'guardian'
                    ? 'Confirmar Huella en el Legado Sensorial (+ciclos)'
                    : 'Publicar Testimonio de Paso'}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ── Selector Heroico de los Dos Flujos (Espacioso y Jerarquizado) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-surface-sunken/80 rounded-2xl border border-border/60">
          <button
            type="button"
            onClick={() => setModo('guardian')}
            className={`flex items-start sm:items-center gap-3 rounded-xl p-3 sm:p-3.5 text-left transition-all ${
              modo === 'guardian'
                ? 'bg-primary/15 text-primary border border-primary/35 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-sunken/50'
            }`}
          >
            <div className={`p-2 rounded-xl mt-0.5 sm:mt-0 ${modo === 'guardian' ? 'bg-primary/20 text-primary' : 'bg-surface-sunken text-muted-foreground'}`}>
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider">Huella Legado</div>
              <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                Cata completa · Pares en boca & botánica · +Ciclos
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setModo('anonima')}
            className={`flex items-start sm:items-center gap-3 rounded-xl p-3 sm:p-3.5 text-left transition-all ${
              modo === 'anonima'
                ? 'bg-card text-foreground border border-border shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-sunken/50'
            }`}
          >
            <div className={`p-2 rounded-xl mt-0.5 sm:mt-0 ${modo === 'anonima' ? 'bg-primary/15 text-primary' : 'bg-surface-sunken text-muted-foreground'}`}>
              <Compass size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider">Visitantes (Rápido)</div>
              <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                Sin cuenta · 30 segundos · En cola de moderación
              </div>
            </div>
          </button>
        </div>

        {/* Guía curatorial desde Núcleo si fue configurada */}
        {perfilSensorial?.qr_titulo && (
          <div className="p-4 rounded-2xl bg-accent/5 border border-accent/25 flex items-start gap-3">
            <Sparkles size={16} className="text-accent-text shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-accent-text tracking-wide">
                {perfilSensorial.qr_titulo}
              </p>
              {perfilSensorial.qr_mensaje && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {perfilSensorial.qr_mensaje}
                </p>
              )}
            </div>
          </div>
        )}

        {modo === 'anonima' ? (
          /* ================================================================ */
          /* MODO VISITANTES (Rápido & Anónimo)                               */
          /* ================================================================ */
          <div className="max-w-2xl mx-auto space-y-6 py-2 sm:py-4">
            <div className="text-center space-y-1.5">
              <h4 className="font-display text-xl text-foreground font-semibold">
                Testimonio Breve de Paso
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Comparte tu experiencia en un instante. Ideal para degustaciones en terreno, eventos, o primeras impresiones sin cuenta.
              </p>
            </div>

            {/* Selector de Variante / Edición si existen opciones */}
            {variantes.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  <Compass size={14} className="text-primary" />
                  <span>¿Qué edición o formato probaste?</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVarianteId(null)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition min-h-[40px] ${
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
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium transition min-h-[40px] ${
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

            {/* Calificación de Excelencia */}
            <div className="p-5 sm:p-6 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Calificación de Excelencia (Escala 1 a 7)
              </p>
              <StarPicker value={rating} onChange={setRating} />
            </div>

            {/* Testimonio */}
            <div className="p-5 sm:p-6 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
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

            {/* Iniciales o Alias */}
            <div className="p-5 sm:p-6 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                Tus iniciales o alias voluntario
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ej. G. C. o Visitante del Sur"
                className={modalFieldClass}
              />
              <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                Por resguardo de privacidad (Ley N° 19.628 de Protección de la Vida Privada), solo se exhibirán iniciales o tu alias.
              </p>
            </div>
          </div>
        ) : (
          /* ================================================================ */
          /* MODO HUELLA LEGADO (Profunda, Espaciosa y Jerarquizada)          */
          /* ================================================================ */
          <div>
            {!isAuthenticated ? (
              <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl border border-primary/30 bg-primary/5 space-y-4 text-center my-4">
                <div className="inline-flex p-3 rounded-2xl bg-primary/15 text-primary mx-auto">
                  <ShieldCheck size={32} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-display text-2xl text-foreground font-semibold">
                    Cata Completa del Enjambre Legado
                  </h4>
                  <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                    El protocolo de cata profunda te permite calibrar los contrastes en boca, identificar notas botánicas y proponer maridajes. Además, otorga el sello dorado de <strong>Legado</strong> a tu reseña y suma ciclos a tu pasaporte.
                  </p>
                </div>
                <div className="pt-3 flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <UserCheck size={16} />
                    <span>Iniciar Sesión / Registrarse</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setModo('anonima')}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Continuar como Visitante
                  </button>
                </div>
              </div>
            ) : (
              /* GRID ESPACIOSO EN 2 COLUMNAS PARA ESCRITORIO / VERTICAL EN MÓVIL */
              <div className="lg:grid lg:grid-cols-12 lg:gap-7 space-y-6 lg:space-y-0">
                {/* ── COLUMNA IZQUIERDA: Formato, Calificación & Contrastes (6 cols) ── */}
                <div className="lg:col-span-6 space-y-5">
                  {/* Card 1: Selección de Edición & Calificación de Excelencia */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-4">
                    {/* Selector de Variante */}
                    {variantes.length > 0 && (
                      <div className="space-y-2 border-b border-border/40 pb-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                          <Compass size={14} className="text-primary" />
                          <span>Edición o variante probada</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedVarianteId(null)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition min-h-[38px] ${
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
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition min-h-[38px] ${
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

                    {/* Escala 1 a 7 Estrellas */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                          Calificación de Excelencia
                        </span>
                        {eligibilityLoading ? (
                          <span className="text-[11px] text-muted-foreground italic">Verificando...</span>
                        ) : eligibility?.compraVerificada ? (
                          <span className="text-[11px] text-success-text font-medium flex items-center gap-1">
                            <Check size={12} />
                            Compra verificada
                          </span>
                        ) : null}
                      </div>
                      <StarPicker value={rating} onChange={setRating} />
                    </div>
                  </div>

                  {/* Card 2: Calibración de Contrastes Organolépticos (Pares Semánticos) */}
                  {activePares.length > 0 && (
                    <div className="p-5 sm:p-6 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-foreground font-semibold uppercase tracking-wider">
                          <Sliders size={14} className="text-primary" />
                          <span>Contrastes en Boca & Balance Organoléptico</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Calibra la tensión entre los polos sensoriales característicos de esta familia botánica.
                        </p>
                      </div>

                      <div className="space-y-4 pt-1">
                        {activePares.map((par) => {
                          const val = paresState[par.par] ?? 6;
                          return (
                            <div key={par.par} className="space-y-1.5 bg-card/40 p-3 rounded-xl border border-border/40">
                              <div className="flex items-center justify-between text-xs font-medium">
                                <span className={val <= 4 ? 'text-primary font-bold' : 'text-muted-foreground'}>
                                  {par.izq}
                                </span>
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  {val <= 4 ? `Tendencia ${par.izq}` : val >= 7 ? `Tendencia ${par.der}` : 'Equilibrado'} ({val}/10)
                                </span>
                                <span className={val >= 7 ? 'text-primary font-bold' : 'text-muted-foreground'}>
                                  {par.der}
                                </span>
                              </div>
                              <input
                                type="range"
                                min={1}
                                max={10}
                                value={val}
                                onChange={(e) =>
                                  setParesState((prev) => ({
                                    ...prev,
                                    [par.par]: Number(e.target.value),
                                  }))
                                }
                                className="w-full accent-primary h-2 bg-border/70 rounded-lg cursor-pointer"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Card 3: Ficha Estructural de Familia Botánica */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-4">
                    <div className="flex items-center gap-2 text-xs text-foreground font-semibold uppercase tracking-wider">
                      <Compass size={14} className="text-primary" />
                      <span>Ficha de Familia · {CATEGORIAS_SENSORIALES_LABELS[effectiveTipo] ?? effectiveTipo}</span>
                    </div>

                    {effectiveTipo === 'miel' && (
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="text-xs space-y-1.5 block">
                            <span className="uppercase tracking-wider text-muted-foreground font-medium block">
                              Textura / Cristalización
                            </span>
                            <select
                              value={cristalizacion}
                              onChange={(e) => setCristalizacion(e.target.value)}
                              className={modalFieldClass}
                            >
                              {CRISTALIZACION_OPCIONES.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-xs space-y-1.5 block">
                            <span className="uppercase tracking-wider text-muted-foreground font-medium block">
                              Familia Aromática Principal
                            </span>
                            <select
                              value={familia}
                              onChange={(e) => setFamilia(e.target.value)}
                              className={modalFieldClass}
                            >
                              {FAMILIAS_AROMATICAS.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                          <label className="text-xs space-y-1.5 block">
                            <span className="uppercase tracking-wider text-muted-foreground font-medium block">
                              Momento de Recolección
                            </span>
                            <select
                              value={momentoRecoleccion}
                              onChange={(e) => setMomentoRecoleccion(e.target.value as MomentoRecoleccion)}
                              className={modalFieldClass}
                            >
                              {MOMENTO_RECOLECCION_OPCIONES.map((m) => (
                                <option key={m} value={m}>
                                  {MOMENTO_RECOLECCION_LABELS[m]}
                                </option>
                              ))}
                            </select>
                          </label>

                          <div className="space-y-1.5 bg-card/40 p-2.5 rounded-xl border border-border/40">
                            <div className="flex justify-between text-xs">
                              <span className="uppercase tracking-wider text-muted-foreground font-medium">
                                Intensidad en Paladar
                              </span>
                              <span className="font-semibold text-primary">{intensidad} / 10</span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={10}
                              value={intensidad}
                              onChange={(e) => setIntensidad(Number(e.target.value))}
                              className="w-full accent-primary h-2 bg-border/70 rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {effectiveTipo === 'miel_fortificada' && (
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="text-xs space-y-1.5 block">
                            <span className="uppercase tracking-wider text-muted-foreground font-medium block">
                              Inclusión Fortificante
                            </span>
                            <select
                              value={fortificante}
                              onChange={(e) => setFortificante(e.target.value)}
                              disabled={Boolean(selectedVariante?.ingrediente_fortificante && selectedVariante.ingrediente_fortificante !== 'ninguno')}
                              className={modalFieldClass}
                            >
                              {FORTIFICANTES_CANONICOS.map((f) => (
                                <option key={f} value={f}>
                                  {FORTIFICANTES_LABELS[f]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-xs space-y-1.5 block">
                            <span className="uppercase tracking-wider text-muted-foreground font-medium block">
                              Textura de la Inclusión
                            </span>
                            <select
                              value={texturaInclusion}
                              onChange={(e) => setTexturaInclusion(e.target.value)}
                              className={modalFieldClass}
                            >
                              {FORTIFICADA_TEXTURAS.map((t) => (
                                <option key={t} value={t}>
                                  {t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5 bg-card/40 p-2.5 rounded-xl border border-border/40">
                            <div className="flex justify-between text-xs">
                              <span className="uppercase tracking-wider text-muted-foreground font-medium">
                                Balance Miel vs Inclusión
                              </span>
                              <span className="font-semibold text-primary">
                                {balanceInclusion <= 4
                                  ? 'Domina miel'
                                  : balanceInclusion >= 7
                                    ? 'Domina inclusión'
                                    : 'Equilibrado 50/50'}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={10}
                              value={balanceInclusion}
                              onChange={(e) => setBalanceInclusion(Number(e.target.value))}
                              className="w-full accent-primary h-2 bg-border/70 rounded-lg cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1.5 bg-card/40 p-2.5 rounded-xl border border-border/40">
                            <div className="flex justify-between text-xs">
                              <span className="uppercase tracking-wider text-muted-foreground font-medium">
                                Intensidad en Paladar
                              </span>
                              <span className="font-semibold text-primary">{intensidad} / 10</span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={10}
                              value={intensidad}
                              onChange={(e) => setIntensidad(Number(e.target.value))}
                              className="w-full accent-primary h-2 bg-border/70 rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {effectiveTipo === 'hidromiel' && (
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="text-xs space-y-1.5 block">
                            <span className="uppercase tracking-wider text-muted-foreground font-medium block">
                              Estilo de Fermentación
                            </span>
                            <select
                              value={hidromielEstilo}
                              onChange={(e) => setHidromielEstilo(e.target.value)}
                              className={modalFieldClass}
                            >
                              {HIDROMIEL_ESTILOS.map((o) => (
                                <option key={o} value={o}>
                                  {o.charAt(0).toUpperCase() + o.slice(1)}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-xs space-y-1.5 block">
                            <span className="uppercase tracking-wider text-muted-foreground font-medium block">
                              Efervescencia
                            </span>
                            <select
                              value={hidromielEfervescencia}
                              onChange={(e) => setHidromielEfervescencia(e.target.value)}
                              className={modalFieldClass}
                            >
                              {HIDROMIEL_EFERVESCENCIA.map((o) => (
                                <option key={o} value={o}>
                                  {o.charAt(0).toUpperCase() + o.slice(1)}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5 bg-card/40 p-2.5 rounded-xl border border-border/40">
                            <div className="flex justify-between text-xs">
                              <span className="uppercase tracking-wider text-muted-foreground font-medium">
                                Acidez Viva
                              </span>
                              <span className="font-semibold text-primary">{acidezViva} / 10</span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={10}
                              value={acidezViva}
                              onChange={(e) => setAcidezViva(Number(e.target.value))}
                              className="w-full accent-primary h-2 bg-border/70 rounded-lg cursor-pointer"
                            />
                          </div>
                          <div className="space-y-1.5 bg-card/40 p-2.5 rounded-xl border border-border/40">
                            <div className="flex justify-between text-xs">
                              <span className="uppercase tracking-wider text-muted-foreground font-medium">
                                Tanicidad & Estructura
                              </span>
                              <span className="font-semibold text-primary">{tanicidad} / 10</span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={10}
                              value={tanicidad}
                              onChange={(e) => setTanicidad(Number(e.target.value))}
                              className="w-full accent-primary h-2 bg-border/70 rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {effectiveTipo === 'extracto' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="text-xs space-y-1.5 block">
                          <span className="uppercase tracking-wider text-muted-foreground font-medium block">
                            Sensación en Garganta
                          </span>
                          <select
                            value={extractoSensacion}
                            onChange={(e) => setExtractoSensacion(e.target.value)}
                            className={modalFieldClass}
                          >
                            {EXTRACTO_SENSACIONES.map((o) => (
                              <option key={o} value={o}>
                                {o.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="space-y-1.5 bg-card/40 p-2.5 rounded-xl border border-border/40">
                          <div className="flex justify-between text-xs">
                            <span className="uppercase tracking-wider text-muted-foreground font-medium">
                              Concentración Percibida
                            </span>
                            <span className="font-semibold text-primary">{concentracion} / 10</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={concentracion}
                            onChange={(e) => setConcentracion(Number(e.target.value))}
                            className="w-full accent-primary h-2 bg-border/70 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    {effectiveTipo === 'cosmetica' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="text-xs space-y-1.5 block">
                          <span className="uppercase tracking-wider text-muted-foreground font-medium block">
                            Absorción Dérmica
                          </span>
                          <select
                            value={cosmeticaAbsorcion}
                            onChange={(e) => setCosmeticaAbsorcion(e.target.value)}
                            className={modalFieldClass}
                          >
                            {COSMETICA_ABSORCIONES.map((o) => (
                              <option key={o} value={o}>
                                {o.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="space-y-1.5 bg-card/40 p-2.5 rounded-xl border border-border/40">
                          <div className="flex justify-between text-xs">
                            <span className="uppercase tracking-wider text-muted-foreground font-medium">
                              Nutrición / Sensación en Piel
                            </span>
                            <span className="font-semibold text-primary">{sensacionGrasa} / 10</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={sensacionGrasa}
                            onChange={(e) => setSensacionGrasa(Number(e.target.value))}
                            className="w-full accent-primary h-2 bg-border/70 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    )}

                    {effectiveTipo === 'infusion' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5 bg-card/40 p-2.5 rounded-xl border border-border/40">
                          <div className="flex justify-between text-xs">
                            <span className="uppercase tracking-wider text-muted-foreground font-medium">
                              Intensidad de Infusión
                            </span>
                            <span className="font-semibold text-primary">{intensidadInfusion} / 10</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={intensidadInfusion}
                            onChange={(e) => setIntensidadInfusion(Number(e.target.value))}
                            className="w-full accent-primary h-2 bg-border/70 rounded-lg cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1.5 bg-card/40 p-2.5 rounded-xl border border-border/40">
                          <div className="flex justify-between text-xs">
                            <span className="uppercase tracking-wider text-muted-foreground font-medium">
                              Complejidad Herbal
                            </span>
                            <span className="font-semibold text-primary">{complejidadHerbal} / 10</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={complejidadHerbal}
                            onChange={(e) => setComplejidadHerbal(Number(e.target.value))}
                            className="w-full accent-primary h-2 bg-border/70 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── COLUMNA DERECHA: Botánica, Maridaje & Firma Sommelier (6 cols) ── */}
                <div className="lg:col-span-6 space-y-5">
                  {/* Card 4: Notas Aromáticas & Botánicas Reconocidas */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-xs text-foreground font-semibold uppercase tracking-wider">
                          <Tag size={14} className="text-primary" />
                          <span>Notas Aromáticas & Botánicas Reconocidas</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Marca los matices que percibiste en tu cata organoléptica.
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
                            className={`text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
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

                    {/* Input para agregar descriptor adicional */}
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
                        className="px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border text-xs font-semibold text-foreground hover:bg-surface-sunken disabled:opacity-40 transition shrink-0"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Card 5: Momento y Maridaje Sugerido */}
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
                        {/* Presets de momento */}
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
                                className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
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
                        {/* Presets de maridaje */}
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
                                className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
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

                  {/* Card 6: Firma Sensorial & Impresiones del Catador */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-foreground font-semibold uppercase tracking-wider">
                        <Sparkles size={14} className="text-primary" />
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
                      rows={5}
                      placeholder={`En nariz evoca... en paladar abre con una textura... dejando un retrogusto...`}
                      className={`${modalFieldClass} resize-none leading-relaxed`}
                    />
                    <p className="text-[11px] text-muted-foreground/80">
                      Mínimo 10 caracteres. Al confirmarse, sumará datos a la Constelación Sensorial de Cata.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </TiendaModal>
  );
}
