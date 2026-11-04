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

// Selector de 7 estrellas (escala cultural de 1 a 7)
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-1 sm:p-1.5 min-h-[44px] min-w-[36px] flex flex-col items-center justify-center transition-all hover:scale-110 active:scale-95"
          aria-label={`${n} de 7 estrellas`}
        >
          <Star
            size={22}
            className={n <= value ? 'fill-accent text-accent-text' : 'text-muted-foreground/30'}
          />
          <span className="text-[9px] text-muted-foreground/70 mt-0.5 font-mono">{n}</span>
        </button>
      ))}
      <span className="text-xs font-semibold text-foreground ml-2 tabular-nums">
        {value} / 7
      </span>
    </div>
  );
}

const modalFieldClass =
  'w-full rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-base sm:text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30';

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
  const [modo, setModo] = useState<Modo>('anonima');
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

  // Inicializar estado de pares semánticos si no están seteados
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

  const modeTabs = (
    <div className="flex gap-2 -mt-1 p-1 bg-surface-sunken/60 rounded-xl border border-border/50">
      <button
        type="button"
        onClick={() => setModo('anonima')}
        className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 min-h-[44px] text-xs font-semibold uppercase tracking-wider transition ${
          modo === 'anonima'
            ? 'bg-card text-foreground shadow-sm border border-border/80'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Compass size={14} className={modo === 'anonima' ? 'text-primary' : ''} />
        <span>Visitantes (Rápido)</span>
      </button>
      <button
        type="button"
        onClick={() => setModo('guardian')}
        className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 min-h-[44px] text-xs font-semibold uppercase tracking-wider transition ${
          modo === 'guardian'
            ? 'bg-primary/15 text-primary shadow-sm border border-primary/30'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <ShieldCheck size={14} />
        <span>Huella Legado</span>
      </button>
    </div>
  );

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
      ariaLabel={`Crear reseña sensorial de ${productName}`}
      size="lg"
      headerExtra={modeTabs}
      footer={
        <div className="w-full space-y-2">
          {modo === 'guardian' && !isAuthenticated ? (
            <Link
              href="/login"
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <UserCheck size={16} />
              <span>Acceder con mi Cuenta Legado</span>
            </Link>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleSubmit()}
              className="w-full min-h-[48px] rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading
                ? 'Registrando huella...'
                : modo === 'guardian'
                  ? 'Confirmar Huella en el Legado Sensorial (+ciclos)'
                  : 'Publicar Testimonio de Paso'}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {/* Guía curatorial desde Núcleo (si fue configurada) */}
        {perfilSensorial?.qr_titulo && (
          <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-accent-text">
              <Sparkles size={13} />
              <span>{perfilSensorial.qr_titulo}</span>
            </div>
            {perfilSensorial.qr_mensaje && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {perfilSensorial.qr_mensaje}
              </p>
            )}
          </div>
        )}

        {/* Selector de Variante / Edición si existen opciones */}
        {variantes.length > 0 && (
          <div className="p-3.5 rounded-xl bg-surface-sunken/40 border border-border/40 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              <Compass size={13} className="text-primary" />
              <span>¿Qué edición o formato probaste?</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedVarianteId(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition min-h-[36px] ${
                  selectedVarianteId === null
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition min-h-[36px] ${
                    selectedVarianteId === v.id
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
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

        {/* Selector de Valoración en Escala 1 a 7 */}
        <div className="p-4 rounded-xl bg-surface-sunken/40 border border-border/40 space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Calificación de Excelencia (Escala 1 a 7)
          </p>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        {modo === 'anonima' ? (
          /* ================================================================ */
          /* MODO VISITANTES (Rápido & Anónimo)                               */
          /* ================================================================ */
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Comparte tu testimonio en 30 segundos. Tu reseña será moderada por el equipo antes de publicarse en la tienda.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
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
                    : 'Describe qué sensaciones, texturas o recuerdos te evocó este producto del bosque...'
                }
                className={`${modalFieldClass} resize-none`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                Tus iniciales o alias voluntario
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ej. G. C. o Visitante del Bosque"
                className={modalFieldClass}
              />
              <p className="text-[11px] text-muted-foreground/80">
                Por resguardo de privacidad (Ley N° 19.628), solo se publicarán iniciales o tu alias.
              </p>
            </div>
          </div>
        ) : (
          /* ================================================================ */
          /* MODO LEGADO SENSORIAL (Profundo & Ramificado)                     */
          /* ================================================================ */
          <div className="space-y-5">
            {!isAuthenticated ? (
              <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Compass size={16} />
                  <span>Cata Completa del Enjambre Legado</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El protocolo de cata profunda te permite calibrar contrastes sensoriales, identificar notas botánicas
                  y proponer maridajes. Además, acumula ciclos de néctar en tu cuenta del Club Legado y otorga la insignia dorada
                  de <strong>Legado</strong> a tu reseña.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity min-h-10"
                  >
                    Iniciar Sesión / Registrarse
                  </Link>
                  <button
                    type="button"
                    onClick={() => setModo('anonima')}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground transition-colors min-h-10"
                  >
                    Continuar como Visitante
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-primary/90 font-medium">
                  <span>{RESENA_COPY.guardianSubtitle}</span>
                  {eligibilityLoading ? (
                    <span className="text-muted-foreground italic">Verificando compras...</span>
                  ) : eligibility?.compraVerificada ? (
                    <span className="text-success-text flex items-center gap-1">
                      <Check size={13} />
                      Compra verificada
                    </span>
                  ) : null}
                </div>

                {/* ── 1. Contrastes Organolépticos (Pares Semánticos) ──────────── */}
                {activePares.length > 0 && (
                  <div className="p-4 rounded-xl bg-surface-sunken/40 border border-border/40 space-y-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      <Sliders size={13} className="text-primary" />
                      <span>Calibración de Contrastes Organolépticos</span>
                    </div>

                    <div className="space-y-3 pt-1">
                      {activePares.map((par) => {
                        const val = paresState[par.par] ?? 6;
                        return (
                          <div key={par.par} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className={val <= 4 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                                {par.izq}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                                {val <= 4 ? `Tendencia ${par.izq}` : val >= 7 ? `Tendencia ${par.der}` : 'Equilibrado'} ({val}/10)
                              </span>
                              <span className={val >= 7 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
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
                              className="w-full accent-primary h-2 bg-border rounded-lg cursor-pointer"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── 2. Notas Aromáticas & Botánicas Reconocidas ───────────────── */}
                <div className="p-4 rounded-xl bg-surface-sunken/40 border border-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      <Tag size={13} className="text-primary" />
                      <span>Notas Aromáticas & Botánicas Reconocidas</span>
                    </div>
                    {selectedNotas.size > 0 && (
                      <span className="text-[11px] text-accent-text font-medium">
                        {selectedNotas.size} {selectedNotas.size === 1 ? 'nota' : 'notas'}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {availableNotas.map((n) => {
                      const active = selectedNotas.has(n);
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => toggleNota(n)}
                          className={`text-xs px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                            active
                              ? 'bg-accent/20 text-accent-text font-semibold border border-accent/40 shadow-sm'
                              : 'bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:border-border'
                          }`}
                        >
                          {active && <Check size={12} />}
                          <span>{n}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Input para agregar descriptor adicional */}
                  <div className="flex items-center gap-2 pt-1">
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
                      placeholder="¿Descubriste otra nota o matiz en tu cata?"
                      className={`${modalFieldClass} text-xs py-1.5`}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomNota}
                      disabled={!customNotaInput.trim()}
                      className="px-3 py-2 rounded-lg bg-surface-raised border border-border text-xs font-semibold text-foreground hover:bg-surface-sunken disabled:opacity-40 transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* ── 3. Dimensiones Organolépticas de Familia ──────────────────── */}
                {effectiveTipo === 'miel' && (
                  <div className="space-y-3">
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
                          Familia Aromática Dominante
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                      <div className="space-y-1.5">
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
                          className="w-full accent-primary h-2 bg-border rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {effectiveTipo === 'miel_fortificada' && (
                  <div className="space-y-3">
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
                      <div className="space-y-1.5">
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
                          className="w-full accent-primary h-2 bg-border rounded-lg cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1.5">
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
                          className="w-full accent-primary h-2 bg-border rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {effectiveTipo === 'fortificaciones' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="uppercase tracking-wider text-muted-foreground font-medium">
                            Tostado
                          </span>
                          <span className="font-semibold text-primary">{tostado} / 10</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={tostado}
                          onChange={(e) => setTostado(Number(e.target.value))}
                          className="w-full accent-primary h-2 bg-border rounded-lg cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="uppercase tracking-wider text-muted-foreground font-medium">
                            Untuosidad
                          </span>
                          <span className="font-semibold text-primary">{untuosidad} / 10</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={untuosidad}
                          onChange={(e) => setUntuosidad(Number(e.target.value))}
                          className="w-full accent-primary h-2 bg-border rounded-lg cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="uppercase tracking-wider text-muted-foreground font-medium">
                            Intensidad
                          </span>
                          <span className="font-semibold text-primary">{intensidad} / 10</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={intensidad}
                          onChange={(e) => setIntensidad(Number(e.target.value))}
                          className="w-full accent-primary h-2 bg-border rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {effectiveTipo === 'hidromiel' && (
                  <div className="space-y-3">
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
                      <div className="space-y-1.5">
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
                          className="w-full accent-primary h-2 bg-border rounded-lg cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1.5">
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
                          className="w-full accent-primary h-2 bg-border rounded-lg cursor-pointer"
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
                    <div className="space-y-1.5">
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
                        className="w-full accent-primary h-2 bg-border rounded-lg cursor-pointer"
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
                    <div className="space-y-1.5">
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
                        className="w-full accent-primary h-2 bg-border rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {effectiveTipo === 'infusion' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
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
                        className="w-full accent-primary h-2 bg-border rounded-lg cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1.5">
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
                        className="w-full accent-primary h-2 bg-border rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* ── 4. Momento y Maridaje Sugeridos (con presets de Núcleo) ───── */}
                <div className="p-4 rounded-xl bg-surface-sunken/40 border border-border/40 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    <UtensilsCrossed size={13} className="text-primary" />
                    <span>Momento & Maridaje Sugerido</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                        Momento de Degustación
                      </label>
                      <input
                        value={momento}
                        onChange={(e) => setMomento(e.target.value)}
                        placeholder="ej. Sobremesa pausada, Desayuno de invierno"
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
                              className="text-[10px] px-2 py-0.5 rounded-full bg-surface-raised border border-border/70 text-muted-foreground hover:text-foreground transition"
                            >
                              {preset}
                            </button>
                          ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                        Maridaje Recomendado
                      </label>
                      <input
                        value={maridaje}
                        onChange={(e) => setMaridaje(e.target.value)}
                        placeholder="ej. Queso azul, café filtrado de especialidad"
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
                              className="text-[10px] px-2 py-0.5 rounded-full bg-surface-raised border border-border/70 text-muted-foreground hover:text-foreground transition"
                            >
                              {preset}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 5. Firma Sensorial Completa (Notas Personales) ───────────── */}
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                    Firma Sensorial & Impresiones del Catador
                  </label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={4}
                    placeholder={`Describe con precisión la apertura aromática, texturas y persistencia en paladar de esta expresión de ${productName}...`}
                    className={`${modalFieldClass} resize-none`}
                  />
                  <p className="text-[11px] text-muted-foreground/80">
                    Mínimo 10 caracteres. Tu análisis enriquecerá la constelación comunitaria tras su aprobación en el Núcleo.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </TiendaModal>
  );
}
