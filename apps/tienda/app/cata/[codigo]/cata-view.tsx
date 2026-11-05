'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Droplet,
  Flower2,
  Nut,
  Sparkle,
  Coffee,
  Star,
  CheckCircle2,
  ChevronRight,
  Compass,
  ShieldCheck,
  MapPin,
  TreePine,
  Leaf,
  BookOpen,
  Wallet,
} from 'lucide-react';
import { WalletButtons } from '@/components/shop/wallet-buttons';
import { Button, Input, toast, friendlyError, Badge, HexagonLoader, cn } from '@enjambre/ui';
import { requireNucleoApiUrl } from '@/lib/shop/nucleo-url';
import type { ShopProduct } from '@/lib/shop/products';

import {
  PARES_SEMANTICOS_POR_CATEGORIA,
  PARES_SEMANTICOS,
  FORTIFICANTES_LABELS,
  EJES_SENSORIALES_POR_CATEGORIA,
  VALORES_DEFAULT_EJES,
  resolverEjesSensoriales,
  type CategoriaSensorial,
  type FortificanteCanonico,
  type TipoSensorial,
} from '@enjambre/resenas';

export interface CataVarianteOption {
  id: string;
  producto_id: string;
  sku: string;
  nombre_variante: string;
  tipo_variante: string;
  ingrediente_fortificante?: string | null;
  peso_neto_g?: number | null;
  activo?: boolean;
}

export interface MielGeograficaOption {
  key: string;
  nombre: string;
  nombreCientifico: string;
  macroZona: string;
  tagline: string;
  perfilResumido: string;
  floracionSlug: string;
}

export const MIELES_GEOGRAFICAS_CHILE: MielGeograficaOption[] = [
  // Norte & Atacama
  {
    key: 'chanar',
    nombre: 'Chañar de Atacama',
    nombreCientifico: 'Geoffroea decorticans',
    macroZona: 'Norte (Desierto & Oasis)',
    tagline: 'Oasis desérticos y quebradas áridas de Atacama.',
    perfilResumido: 'Notas tostadas a arrope, caramelo profundo y mineralidad salina.',
    floracionSlug: 'chanar',
  },
  {
    key: 'algarrobo',
    nombre: 'Algarrobo del Desierto',
    nombreCientifico: 'Prosopis chilensis',
    macroZona: 'Norte (Desierto & Oasis)',
    tagline: 'Valles secos y floración resistente.',
    perfilResumido: 'Densidad espesa, notas a melaza y frutos secos confitados.',
    floracionSlug: 'algarrobo',
  },
  // Zona Centro
  {
    key: 'quillay',
    nombre: 'Quillay de la Zona Central',
    nombreCientifico: 'Quillaja saponaria',
    macroZona: 'Zona Centro (Bosque Esclerófilo)',
    tagline: 'Bosque mediterráneo de floración estival.',
    perfilResumido: 'Floral puro y limpio, notas herbáceas secas y final refrescante.',
    floracionSlug: 'quillay',
  },
  {
    key: 'peumo',
    nombre: 'Peumo de Quebrada Central',
    nombreCientifico: 'Cryptocarya alba',
    macroZona: 'Zona Centro (Bosque Esclerófilo)',
    tagline: 'Follaje aromático y sotobosque esclerófilo.',
    perfilResumido: 'Balsámico limpio, resina vegetal y retrogusto fresco.',
    floracionSlug: 'peumo',
  },
  {
    key: 'corontillo',
    nombre: 'Corontillo Silvestre',
    nombreCientifico: 'Escallonia virgata',
    macroZona: 'Zona Centro (Bosque Esclerófilo)',
    tagline: 'Laderas soleadas y floración nativa.',
    perfilResumido: 'Herbal silvestre, matiz resinoso y dulzor sobrio.',
    floracionSlug: 'corontillo',
  },
  // Zona Sur & Austral
  {
    key: 'ulmo',
    nombre: 'Ulmo del Bosque Nativo',
    nombreCientifico: 'Eucryphia cordifolia',
    macroZona: 'Zona Sur & Austral (Chiloé)',
    tagline: 'Árbol nodriza del dosel templado lluvioso.',
    perfilResumido: 'Benzaldehído puro, almendra amarga, flor de azahar y textura cremosa.',
    floracionSlug: 'ulmo',
  },
  {
    key: 'tiaca',
    nombre: 'Tiaca de Quebradas Húmedas',
    nombreCientifico: 'Caldcluvia paniculata',
    macroZona: 'Zona Sur & Austral (Chiloé)',
    tagline: 'Riberas y cuencas de alta pluviosidad.',
    perfilResumido: 'Herbal balsámico vivaz, mentol y acidez cítrica natural.',
    floracionSlug: 'tiaca',
  },
  {
    key: 'meli',
    nombre: 'Melí de Bosque Profundo',
    nombreCientifico: 'Amomyrtus meli',
    macroZona: 'Zona Sur & Austral (Chiloé)',
    tagline: 'Mirtácea endémica aromática de Chiloé.',
    perfilResumido: 'Rico en eugenol, clavo de olor, pimienta dulce y madera húmeda.',
    floracionSlug: 'meli',
  },
  {
    key: 'tepu',
    nombre: 'Tepú de Turberas Milenarias',
    nombreCientifico: 'Tepualia stipularis',
    macroZona: 'Zona Sur & Austral (Chiloé)',
    tagline: 'Suelos fósiles y turbales insulares.',
    perfilResumido: 'Amaderado resinoso profundo, color cobrizo y alta mineralidad.',
    floracionSlug: 'tepu',
  },
];

const DEGUSTACION_VARIEDADES = [
  {
    id: 'crema-pura',
    name: 'Crema de Miel Batida en Frío',
    icon: Droplet,
    note: 'Batido mecánico lento en frío · Textura sedosa de bosque nativo',
    fortificante: 'ninguno' as const,
    keywords: ['crema de miel', 'batida', 'crema', 'pura'],
  },
  {
    id: 'crema-avellanas',
    name: 'Crema de Miel con Avellana Chilena',
    icon: Nut,
    note: 'Avellana nativa tostada y molida de bosque templado',
    fortificante: 'avellana_chilena' as const,
    keywords: ['avellana', 'avellanas'],
  },
  {
    id: 'crema-polen',
    name: 'Crema de Miel con Polen Floral',
    icon: Flower2,
    note: 'Polen multifloral silvestre recolectado en el archipiélago',
    fortificante: 'polen_floral' as const,
    keywords: ['polen'],
  },
  {
    id: 'crema-cacao',
    name: 'Crema de Miel con Nibs de Cacao',
    icon: Sparkle,
    note: 'Nibs de cacao crudo de origen · Contraste tostado y floral',
    fortificante: 'cacao_crudo' as const,
    keywords: ['cacao', 'nibs'],
  },
];

function findCatalogProductForVariety(
  products: ShopProduct[],
  varietyName: string,
  keywords: string[] = [],
): ShopProduct | undefined {
  const normName = varietyName.toLowerCase();
  const exact = products.find((p) => p.name.toLowerCase().includes(normName));
  if (exact) return exact;
  for (const kw of keywords) {
    const found = products.find(
      (p) =>
        p.name.toLowerCase().includes(kw.toLowerCase()) ||
        p.slug.toLowerCase().includes(kw.toLowerCase()),
    );
    if (found) return found;
  }
  return undefined;
}

interface CataViewProps {
  punto: { id: string; nombre: string; tipo: string; ciudad: string | null };
  codigo: string;
  chipsCatalog: {
    id: string;
    bloque: 'sabor' | 'aroma' | 'textura' | 'color';
    chip: string;
    categoria_producto?: string | null;
  }[];
  products: ShopProduct[];
  variantes?: CataVarianteOption[];
  initialProductSlugOrId?: string;
  initialVarianteId?: string;
  initialPabellon?: 'casa' | 'geografias';
  lockPabellon?: 'casa' | 'geografias' | null;
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

function RadarConstellation({
  axes,
  scores,
  size = 200,
}: {
  axes: readonly string[];
  scores: Record<string, number>;
  size?: number;
}) {
  const totalAxes = axes.length || 8;
  const cx = size / 2;
  const cy = size / 2;
  const rMax = (size / 2) * 0.68;
  const levels = [0.25, 0.5, 0.75, 1.0];

  const points = axes.map((axis, i) => {
    const val = Math.max(1.0, Math.min(10.0, scores[axis] ?? 7.5)) / 10;
    const angle = ((Math.PI * 2) / totalAxes) * i - Math.PI / 2;
    const r = val * rMax;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), val, axis };
  });

  const polyStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="relative mx-auto flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
        <defs>
          <radialGradient id="radar-constellation-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.08" />
          </radialGradient>
        </defs>

        {levels.map((lvl) => {
          const pts = axes
            .map((_, i) => {
              const angle = ((Math.PI * 2) / totalAxes) * i - Math.PI / 2;
              const r = lvl * rMax;
              return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
            })
            .join(' ');
          return (
            <polygon
              key={lvl}
              points={pts}
              fill="none"
              stroke="currentColor"
              className="text-border/50"
              strokeWidth="0.8"
              strokeDasharray={lvl === 1.0 ? undefined : '2 2'}
            />
          );
        })}

        {axes.map((_, i) => {
          const angle = ((Math.PI * 2) / totalAxes) * i - Math.PI / 2;
          const x2 = cx + rMax * Math.cos(angle);
          const y2 = cy + rMax * Math.sin(angle);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x2.toFixed(1)}
              y2={y2.toFixed(1)}
              stroke="currentColor"
              className="text-border/40"
              strokeWidth="0.8"
            />
          );
        })}

        <polygon
          points={polyStr}
          fill="url(#radar-constellation-grad)"
          stroke="var(--primary)"
          strokeWidth="2"
          className="transition-all duration-300 ease-out"
        />

        {points.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r="3.5"
            className="fill-primary stroke-card transition-all duration-300 ease-out"
            strokeWidth="1.5"
          />
        ))}
      </svg>
    </div>
  );
}

export function CataView({
  punto,
  codigo,
  chipsCatalog,
  products,
  variantes = [],
  initialProductSlugOrId,
  initialVarianteId,
  initialPabellon = 'casa',
  lockPabellon = null,
}: CataViewProps) {
  const foundInitialVariant = variantes.find(
    (v) =>
      v.id === initialVarianteId ||
      v.sku.toLowerCase() === initialVarianteId?.toLowerCase(),
  );

  const foundInitial = products.find(
    (p) =>
      p.id === (foundInitialVariant?.producto_id ?? initialProductSlugOrId) ||
      p.slug === initialProductSlugOrId,
  );

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    foundInitialVariant?.producto_id ?? foundInitial?.id ?? null,
  );
  const [selectedVarianteId, setSelectedVarianteId] = useState<string | null>(
    foundInitialVariant?.id ?? null,
  );
  const [tipoSensorial, setTipoSensorial] = useState<CategoriaSensorial>(
    foundInitialVariant?.ingrediente_fortificante && foundInitialVariant.ingrediente_fortificante !== 'ninguno'
      ? 'miel_fortificada'
      : ((foundInitial?.tipo_sensorial as CategoriaSensorial) || 'miel'),
  );
  const [selectedProductName, setSelectedProductName] = useState<string>(
    foundInitialVariant?.nombre_variante ?? foundInitial?.name ?? DEGUSTACION_VARIEDADES[0].name,
  );

  const [pabellon, setPabellon] = useState<'casa' | 'geografias'>(lockPabellon ?? initialPabellon);
  const [esGeografica, setEsGeografica] = useState<boolean>((lockPabellon ?? initialPabellon) === 'geografias');
  const [selectedFloracionSlug, setSelectedFloracionSlug] = useState<string | null>(null);

  const [step, setStep] = useState<'intro' | 'producto' | 'pares' | 'chips' | 'user' | 'success'>(
    foundInitialVariant || foundInitial ? 'pares' : 'producto',
  );
  const [loading, setLoading] = useState(false);

  // Form state
  const activeAxes = useMemo(() => {
    return resolverEjesSensoriales(tipoSensorial, selectedProductName);
  }, [tipoSensorial, selectedProductName]);

  const [ejesCalibracionState, setEjesCalibracionState] = useState<Record<string, number>>(() => {
    const axes = resolverEjesSensoriales(tipoSensorial, selectedProductName);
    const initialEjes: Record<string, number> = {};
    axes.forEach((axis) => {
      const def = VALORES_DEFAULT_EJES[axis] ?? 75;
      initialEjes[axis] = Number((def / 10).toFixed(1));
    });
    return initialEjes;
  });

  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const [agrado, setAgrado] = useState(7);
  const [comentarioAbierto, setComentarioAbierto] = useState('');
  const [email, setEmail] = useState('');
  const [puntosGanados, setPuntosGanados] = useState<number>(25);

  const selectProductOrVariant = (
    prodId: string | null,
    varId: string | null,
    name: string,
    category: CategoriaSensorial = 'miel',
    floracionSlug?: string,
    geografica: boolean = false,
  ) => {
    setSelectedProductId(prodId);
    setSelectedVarianteId(varId);
    setSelectedProductName(name);
    setTipoSensorial(category);
    setSelectedFloracionSlug(floracionSlug || null);
    setEsGeografica(geografica);

    const axes = resolverEjesSensoriales(category, name);
    const matchedProduct = products.find((p) => p.id === prodId);
    const prodCal = matchedProduct?.perfil_sensorial?.ejes_calibracion;
    const initialEjes: Record<string, number> = {};
    axes.forEach((axis) => {
      const pVal = prodCal?.[axis];
      if (typeof pVal === 'number') {
        initialEjes[axis] = pVal > 10 ? Number((pVal / 10).toFixed(1)) : Number(pVal.toFixed(1));
      } else {
        const def = VALORES_DEFAULT_EJES[axis] ?? 75;
        initialEjes[axis] = Number((def / 10).toFixed(1));
      }
    });
    setEjesCalibracionState(initialEjes);
    setSelectedChips(new Set());
    setStep('pares');
  };

  const selectProduct = (prodId: string | null, name: string) => {
    selectProductOrVariant(prodId, null, name, 'miel');
  };

  const getVariantIcon = (fortificante?: string | null) => {
    switch (fortificante) {
      case 'polen_floral':
        return Flower2;
      case 'avellana_chilena':
        return Nut;
      case 'cacao_crudo':
        return Sparkle;
      case 'panal_virgen':
      default:
        return Droplet;
    }
  };

  const currentProduct = products.find((p) => p.id === selectedProductId);

  const filteredChips = chipsCatalog.filter((c) => {
    if (!c.categoria_producto || c.categoria_producto === 'miel') return true;
    return c.categoria_producto === tipoSensorial;
  });

  const toggleChip = (chip: string) => {
    const next = new Set(selectedChips);
    if (next.has(chip)) next.delete(chip);
    else next.add(chip);
    setSelectedChips(next);
  };

  const submitCata = async () => {
    if (!email.trim()) {
      toast('Por favor ingresa tu correo para guardar tu pasaporte sensorial', {
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const ejes100: Record<string, number> = {};
      activeAxes.forEach((axis: string) => {
        const v10 = ejesCalibracionState[axis] ?? 7.5;
        ejes100[axis] = Math.round(v10 * 10);
      });

      const paresArray = activeAxes.slice(0, 4).map((axis: string) => {
        const val10 = ejesCalibracionState[axis] ?? 7.5;
        const valBipolar = Math.round(((val10 - 1) / 9) * 6 - 3);
        return {
          par: axis,
          valor: Math.max(-3, Math.min(3, valBipolar)),
        };
      });

      let chipsArray = Array.from(selectedChips).map((chipName) => {
        const cat = chipsCatalog.find((c) => c.chip === chipName);
        return { bloque: cat?.bloque ?? 'sabor', chip: chipName };
      });

      if (chipsArray.length === 0) {
        chipsArray = [{ bloque: 'sabor', chip: 'Cremosa' }];
      }

      let finalProductId = selectedProductId;
      if (!finalProductId) {
        const selectedVariety = DEGUSTACION_VARIEDADES.find((v) => v.name === selectedProductName);
        const match = findCatalogProductForVariety(
          products,
          selectedProductName,
          selectedVariety?.keywords ?? [],
        );
        finalProductId = match?.id ?? products[0]?.id ?? '146073e1-ac90-45d9-9fb3-9ece4a4e877d';
      }

      const nucleoUrl = requireNucleoApiUrl();
      const res = await fetch(`${nucleoUrl}/api/percepcion/sesiones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo_punto: codigo,
          producto_id: finalProductId,
          variante_id: selectedVarianteId || undefined,
          floracion_slug: selectedFloracionSlug || undefined,
          tipo_sensorial: tipoSensorial,
          email: email.trim(),
          consentimiento: true,
          ejes_calibracion: ejes100,
          pares: paresArray,
          chips: chipsArray,
          abierta: comentarioAbierto.trim() || undefined,
          agrado,
          intencion_recompra: true,
          tipo_evaluador: 'consumidor',
        }),
      });

      if (!res.ok) {
        throw new Error('Error al registrar la cata');
      }

      const data = await res.json();
      if (data?.data?.puntos_ganados) {
        setPuntosGanados(data.data.puntos_ganados);
      }

      setStep('success');
    } catch (e: unknown) {
      toast(friendlyError(e, 'No fue posible registrar la cata en este momento'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 w-full">
      {step === 'intro' && (
        <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
            <Droplet className="w-8 h-8 text-primary" strokeWidth={1.75} />
          </div>
          <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary">
            {punto.tipo === 'feria_evento'
              ? 'Estación de Degustación en Vivo'
              : punto.tipo === 'hotel'
                ? 'Cortesía Botánica de Habitación'
                : punto.tipo === 'tienda_gourmet'
                  ? 'Vitrina de Pureza de Origen'
                  : 'Experiencia Inmersiva'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight">
            Ritual de Cata Sensorial
          </h1>
          <p className="text-muted-foreground leading-relaxed text-pretty max-w-lg mx-auto">
            Bienvenido al ritual de cata en{' '}
            <strong className="text-foreground font-medium">{punto.nombre}</strong>. Degusta con tu
            revolvedor o copa técnica, calibra lo que tu paladar percibe en tiempo real y sé testigo directo
            del balance botánico y sensorial del bosque chileno.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="w-full mt-8"
            onClick={() => setStep('producto')}
          >
            Comenzar Cata
          </Button>
        </div>
      )}

      {step === 'producto' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-[10px] font-mono uppercase tracking-[0.18em] text-primary">
              <Droplet className="w-3 h-3" />
              {punto.tipo === 'feria_evento'
                ? 'Estación de Degustación en Vivo'
                : punto.nombre}
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-medium text-foreground tracking-tight pt-1">
              ¿Qué variante estás degustando?
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Toca la creación que tienes en tu paladar para calibrar sus notas sensoriales y dejar tu reseña.
            </p>
          </div>

          {/* Selector de Doble Pabellón */}
          {!lockPabellon && (
            <div className="grid grid-cols-2 p-1 bg-surface-sunken rounded-2xl border border-border/60">
              <button
                type="button"
                onClick={() => setPabellon('casa')}
                className={cn(
                  "py-3 px-3 rounded-xl text-xs font-medium transition-all text-center flex flex-col items-center justify-center gap-0.5",
                  pabellon === 'casa'
                    ? "bg-card text-foreground shadow-sm border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="font-medium text-xs sm:text-sm">Creaciones en Mesa</span>
                <span className="text-[10px] text-primary font-mono">Pureo · Chiloé</span>
              </button>
              <button
                type="button"
                onClick={() => setPabellon('geografias')}
                className={cn(
                  "py-3 px-3 rounded-xl text-xs font-medium transition-all text-center flex flex-col items-center justify-center gap-0.5",
                  pabellon === 'geografias'
                    ? "bg-card text-foreground shadow-sm border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="font-medium text-xs sm:text-sm">Mieles de Chile</span>
                <span className="text-[10px] text-accent-text font-mono">Atlas Botánico</span>
              </button>
            </div>
          )}

          {pabellon === 'casa' ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground px-1">
                Selecciona la variante que acabas de probar. Tu evaluación se suma directamente a la{' '}
                <strong className="text-foreground">ficha oficial de esa creación</strong>.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {DEGUSTACION_VARIEDADES.map((v) => {
                  const IconComponent = v.icon;
                  const matchedProduct = findCatalogProductForVariety(
                    products,
                    v.name,
                    v.keywords,
                  );
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() =>
                        selectProductOrVariant(
                          matchedProduct?.id ?? null,
                          null,
                          v.name,
                          v.fortificante === 'ninguno'
                            ? 'miel'
                            : 'miel_fortificada',
                          'ulmo',
                          false,
                        )
                      }
                      className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-surface-raised text-left transition-all duration-150 group min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <span className="w-11 h-11 rounded-xl bg-surface-sunken flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                        <IconComponent className="w-5 h-5" strokeWidth={1.75} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm leading-snug">{v.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{v.note}</p>
                      </div>
                      <span className="text-xs font-medium text-primary inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        Catar <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground px-1">
                Mieles monoflorales en copa técnica. Su evaluación alimenta directamente la{' '}
                <strong className="text-foreground">Biblioteca de Floraciones pública</strong> de Chile.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {MIELES_GEOGRAFICAS_CHILE.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() =>
                      selectProductOrVariant(
                        products[0]?.id ?? '146073e1-ac90-45d9-9fb3-9ece4a4e877d',
                        null,
                        m.nombre,
                        'miel',
                        m.floracionSlug,
                        true,
                      )
                    }
                    className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-accent/50 hover:bg-surface-raised text-left transition-all duration-150 group min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <span className="w-11 h-11 rounded-xl bg-surface-sunken flex items-center justify-center text-accent-text group-hover:scale-105 transition-transform shrink-0">
                      <Compass className="w-5 h-5" strokeWidth={1.75} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground text-sm leading-snug">{m.nombre}</p>
                        <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-sunken border border-border/50 text-muted-foreground">
                          {m.macroZona}
                        </span>
                      </div>
                      <p className="text-xs text-accent-text/90 italic font-serif mt-0.5">
                        {m.nombreCientifico}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                        {m.perfilResumido}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-accent-text inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      Catar <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'pares' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-400">
          <div className="text-center space-y-2">
            <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary">
              Paso 2 de 3 · Perfil Sensorial
            </span>
            <Badge variant="outline" className="mb-1">
              {selectedProductName}
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-foreground tracking-tight">
              Geometría de la Red Sensorial
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Calibra los 8 vértices en escala 1.0 a 10.0 según tu percepción directa en el paladar. La red poligonal se calibra en vivo.
            </p>
          </div>

          {/* Telaraña / Radar Visual Interactivo */}
          <div className="p-4 sm:p-6 bg-card border border-border rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
            <div className="w-full flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground pb-2 border-b border-border/60 mb-2">
              <span>Constelación Activa ({activeAxes.length} Vértices)</span>
              <span className="text-primary font-bold">1.0 — 10.0</span>
            </div>
            <RadarConstellation axes={activeAxes} scores={ejesCalibracionState} size={230} />
          </div>

          {/* Deslizadores de los 8 Ejes Canónicos */}
          <div className="space-y-3 bg-card border border-border p-4 sm:p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Vértices de Percepción
              </span>
              <span className="text-[11px] text-primary font-mono font-medium">
                Ajusta deslizando o con + / -
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-1">
              {activeAxes.map((axis: string, idx: number) => {
                const val = ejesCalibracionState[axis] ?? 7.5;
                const updateVal = (newVal: number) => {
                  const clamped = Math.max(1.0, Math.min(10.0, Number(newVal.toFixed(1))));
                  setEjesCalibracionState((prev) => ({ ...prev, [axis]: clamped }));
                };

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

                    <div className="flex items-center gap-2.5 pt-0.5">
                      <button
                        type="button"
                        aria-label={`Reducir ${axis}`}
                        onClick={() => updateVal(val - 0.5)}
                        className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:bg-surface-raised active:scale-95 text-sm font-bold transition-transform"
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
                          onChange={(e) => updateVal(parseFloat(e.target.value))}
                          className="w-full accent-primary h-2 bg-card rounded-lg appearance-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                      </div>
                      <button
                        type="button"
                        aria-label={`Aumentar ${axis}`}
                        onClick={() => updateVal(val + 0.5)}
                        className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:bg-surface-raised active:scale-95 text-sm font-bold transition-transform"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex justify-between text-[9px] font-mono text-muted-foreground/60 px-0.5">
                      <span>Sutil (1.0)</span>
                      <span>Intenso (10.0)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" size="lg" onClick={() => setStep('producto')}>
              Atrás
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={() => setStep('chips')}
            >
              Siguiente: Notas & Reseña
            </Button>
          </div>
        </div>
      )}

      {step === 'chips' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-400">
          <div className="text-center space-y-2">
            <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary">
              Paso 3 de 3
            </span>
            <Badge variant="outline" className="mb-1">
              {selectedProductName}
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-foreground tracking-tight">
              Notas de Sabor y Reseña
            </h2>
            <p className="text-sm text-muted-foreground">
              Selecciona los matices que logras percibir en esta muestra.
            </p>
          </div>

          <div
            className="flex flex-wrap gap-2 justify-center"
            role="group"
            aria-label="Notas de sabor"
          >
            {filteredChips.map((c) => {
              const isSelected = selectedChips.has(c.chip);
              return (
                <button
                  key={c.id}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  onClick={() => toggleChip(c.chip)}
                  className={`min-h-[40px] px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 border ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm active:scale-[0.98]'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {c.chip}
                </button>
              );
            })}
          </div>

          <div className="space-y-3 pt-6 border-t border-border/70">
            <p className="text-center text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Evaluación Global (Escala de Excelencia Territorial 1 a 7 Estrellas)
            </p>
            <div
              className="flex justify-center items-center gap-1.5"
              role="radiogroup"
              aria-label="Agrado general"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((star) => {
                const isActive = agrado >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={agrado === star}
                    aria-label={`${star} de 7 estrellas`}
                    onClick={() => setAgrado(star)}
                    className="min-h-[44px] min-w-[38px] flex flex-col items-center justify-center rounded-lg hover:bg-surface-raised transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Star
                      className={cn(
                        'w-6 h-6 transition-all duration-150',
                        isActive
                          ? 'fill-primary text-primary scale-105'
                          : 'text-muted-foreground/30 hover:text-muted-foreground/60',
                      )}
                    />
                    <span className="text-[9px] text-muted-foreground/70 font-mono mt-0.5">{star}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs font-semibold text-foreground tabular-nums">
              {agrado} / 7 · <span className="text-primary font-normal">{DESCRIPTORES_RATING[agrado] || ''}</span>
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="comentario-abierto"
              className="block text-xs font-mono uppercase tracking-wider text-muted-foreground"
            >
              Tu reseña oficial (Opcional)
            </label>
            <textarea
              id="comentario-abierto"
              value={comentarioAbierto}
              onChange={(e) => setComentarioAbierto(e.target.value)}
              rows={3}
              maxLength={280}
              placeholder="Describe los matices que sentiste al probar esta miel. Tu comentario aportará a la caracterización sensorial comunitaria..."
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            <p className="text-[11px] font-mono text-muted-foreground/70 text-right">
              {comentarioAbierto.length}/280
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" size="lg" onClick={() => setStep('pares')}>
              Atrás
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={() => setStep('user')}
            >
              Siguiente: Guardar Pasaporte
            </Button>
          </div>
        </div>
      )}

      {step === 'user' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-400">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-foreground tracking-tight">
              Guarda tu Pasaporte
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Ingresa tu correo para acreditar tus sellos en{' '}
              <strong className="text-foreground font-medium">{punto.nombre}</strong> y sumar puntos
              globales en la red.
            </p>
          </div>

          <div className="space-y-4 bg-card border border-border p-6 rounded-2xl">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label className="flex items-start gap-3 pt-2 cursor-pointer select-none">
              <input type="checkbox" className="mt-1 accent-primary rounded" defaultChecked />
              <span className="text-xs text-muted-foreground leading-relaxed">
                Acepto registrar mi evaluación sensorial comunitaria y vincular mi perfil al club de
                la red.
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setStep('chips')}
              disabled={loading}
            >
              Atrás
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={loading || !email.trim()}
              onClick={submitCata}
            >
              {loading ? <HexagonLoader size="sm" /> : 'Revelar mi Perfil Sensorial'}
            </Button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="space-y-8 animate-in zoom-in-95 fade-in duration-500">
          <div className="text-center space-y-3 pt-4">
            <div className="flex flex-wrap justify-center gap-2 mb-1">
              <Badge variant="success" className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> 1 Sello en {punto.nombre}
              </Badge>
              <Badge variant="gold">+{puntosGanados} Puntos del Bosque</Badge>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight">
              Tu Pasaporte Sensorial
            </h2>
            <p className="text-sm text-muted-foreground">
              Evaluación registrada para{' '}
              <strong className="text-foreground font-medium">{selectedProductName}</strong>.
            </p>
          </div>

          <div className="bg-card border border-border p-6 sm:p-8 rounded-2xl space-y-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-4 right-4 pointer-events-none select-none">
              <Compass className="w-24 h-24 stroke-[0.75] opacity-15 text-primary" />
            </div>

            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Geometría Sensorial Calibrada
                </span>
                <span className="text-xs text-primary font-mono font-medium">
                  Constelación de {activeAxes.length} Vértices
                </span>
              </div>

              {/* Telaraña / Radar Visual Resumen */}
              <div className="py-2 flex justify-center">
                <RadarConstellation axes={activeAxes} scores={ejesCalibracionState} size={210} />
              </div>

              {/* Grid de los 8 Ejes Calibrados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {activeAxes.map((axis: string) => {
                  const score = ejesCalibracionState[axis] ?? 7.5;
                  const pct = Math.max(10, Math.min(100, (score / 10) * 100));
                  return (
                    <div key={axis} className="bg-surface-sunken/80 p-2.5 rounded-xl border border-border/60">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-foreground font-medium truncate pr-1">{axis}</span>
                        <span className="font-mono text-primary font-bold">{score.toFixed(1)}/10</span>
                      </div>
                      <div className="h-1.5 w-full bg-card rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-border/60 relative z-10">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                Notas Percibidas
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedChips).map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 bg-surface-sunken rounded-full border border-border text-xs text-foreground font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {comentarioAbierto && (
              <div className="pt-4 border-t border-border/60 relative z-10">
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                  Tu Reseña Registrada
                </p>
                <p className="text-sm italic text-foreground/80 leading-relaxed">
                  “{comentarioAbierto}”
                </p>
                <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  Enviada a la central de proveniencia para moderación y publicación.
                </p>
              </div>
            )}
          </div>

          {/* Doble Destino de Reseña */}
          {esGeografica ? (
            <div className="bg-card border border-accent/40 p-6 rounded-2xl text-center space-y-4 shadow-sm">
              <div className="mx-auto w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text">
                <Compass className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent-text">
                  Inscripción en el Atlas Botánico
                </span>
                <h3 className="font-display text-xl font-medium text-foreground tracking-tight">
                  Reseña Derivada a la Biblioteca de Floraciones
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Tu evaluación sensorial ha quedado inscrita en el registro botánico público de{' '}
                  <strong className="text-foreground">{selectedProductName}</strong>. Has aportado a la calibración del atlas melífero vivo de Chile.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href={`/ciencia/${selectedFloracionSlug || 'ulmo'}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-8 text-xs uppercase tracking-[0.2em] font-medium text-accent-foreground transition-all hover:bg-accent/90 w-full active:scale-[0.99] shadow-sm"
                >
                  Ver Ficha en la Biblioteca de Floraciones →
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-primary/30 p-6 rounded-2xl text-center space-y-4 shadow-sm">
              <div className="mx-auto w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
                  Calibración Oficial de Producto
                </span>
                <h3 className="font-display text-xl font-medium text-foreground tracking-tight">
                  Huella Sensorial Incorporada a la Tienda
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Tu evaluación calibra directamente la ficha comercial de{' '}
                  <strong className="text-foreground">{selectedProductName}</strong> en la tienda oficial para futuros compradores.
                </p>
              </div>
            </div>
          )}

          {/* Salida Diferida Respetuosa (Sin datáfonos ni transacciones en mesa) */}
          <div className="bg-surface-raised border border-border p-6 rounded-2xl text-center space-y-4">
            <h3 className="font-display text-xl font-medium text-foreground tracking-tight">
              {esGeografica ? 'Despensa Austral de Pureo' : 'Lleva esta experiencia a tu casa'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              La cata se disfruta sin prisa ni transacciones en mesa. Puedes revisar nuestras creaciones de temporada con despacho en frío a domicilio en 48 a 72 horas desde Chiloé.
            </p>
            <Link
              href="/catalogo"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-8 text-xs uppercase tracking-[0.2em] font-medium text-primary-foreground transition-all hover:bg-primary/90 w-full active:scale-[0.99] shadow-sm"
            >
              Explorar Catálogo Oficial (Salida Diferida)
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
