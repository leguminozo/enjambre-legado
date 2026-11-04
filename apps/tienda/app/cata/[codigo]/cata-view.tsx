'use client';

import { useState } from 'react';
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
  type CategoriaSensorial,
  type FortificanteCanonico,
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
    keywords: ['crema de miel', 'batida', 'crema'],
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
  {
    id: 'crema-virgen',
    name: 'Miel Virgen con Trocito de Panal',
    icon: Droplet,
    note: 'Con trozo de panal natural intacto de Pureo, Chiloé',
    fortificante: 'panal_virgen' as const,
    keywords: ['panal', 'virgen', 'ulmo'],
  },
  {
    id: 'prototipo-porvenir',
    name: 'Edición Experimental / Reserva de Autor',
    icon: Sparkle,
    note: 'Muestra especial de feria · Recolección estacional o barrica',
    fortificante: 'ninguno' as const,
    keywords: ['reserva', 'experimental'],
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
}

export function CataView({
  punto,
  codigo,
  chipsCatalog,
  products,
  variantes = [],
  initialProductSlugOrId,
  initialVarianteId,
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

  const [pabellon, setPabellon] = useState<'casa' | 'geografias'>('casa');
  const [esGeografica, setEsGeografica] = useState<boolean>(false);
  const [selectedFloracionSlug, setSelectedFloracionSlug] = useState<string | null>(null);

  const [step, setStep] = useState<'intro' | 'producto' | 'pares' | 'chips' | 'user' | 'success'>(
    foundInitialVariant || foundInitial ? 'pares' : 'producto',
  );
  const [loading, setLoading] = useState(false);

  // Form state
  const [paresState, setParesState] = useState<Record<string, number>>({});
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
    setParesState({});
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
  const currentSemanticPairs =
    (currentProduct?.perfil_sensorial as { pares_semanticos?: Array<{ par: string; izq: string; der: string }> })?.pares_semanticos ||
    PARES_SEMANTICOS_POR_CATEGORIA[tipoSensorial] ||
    PARES_SEMANTICOS_POR_CATEGORIA.miel;

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
      const paresArray = currentSemanticPairs.map((p) => ({
        par: p.par,
        valor: paresState[p.par] || 0,
      }));

      let chipsArray = Array.from(selectedChips).map((chipName) => {
        const cat = chipsCatalog.find((c) => c.chip === chipName);
        return { bloque: cat?.bloque ?? 'sabor', chip: chipName };
      });

      if (chipsArray.length === 0) {
        chipsArray = [{ bloque: 'sabor', chip: 'Dulce' }];
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

  const profileScores = currentSemanticPairs.map((p) => {
    const val = paresState[p.par] || 0;
    const percentage = ((val + 3) / 6) * 100;
    return { name: p.der, inverse: p.izq, percentage, val };
  });

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
                          v.fortificante === 'panal_virgen' || (v.fortificante as string) === 'ninguno'
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
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-400">
          <div className="text-center space-y-2">
            <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary">
              Paso 2 de 3
            </span>
            <Badge variant="outline" className="mb-1">
              {selectedProductName}
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-foreground tracking-tight">
              Perfil de Textura y Aroma
            </h2>
            <p className="text-sm text-muted-foreground">
              Desliza según tu percepción directa en el paladar.
            </p>
          </div>

          <div className="space-y-6 bg-card border border-border p-6 rounded-2xl">
            {currentSemanticPairs.map((p) => {
              const val = paresState[p.par] || 0;
              return (
                <div key={p.par} className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider">
                    <span className={val < 0 ? 'text-primary font-bold' : 'text-muted-foreground'}>
                      {p.izq}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground/60">
                      {val === 0
                        ? 'Equilibrado'
                        : val > 0
                          ? `+${val} ${p.der}`
                          : `${val} ${p.izq}`}
                    </span>
                    <span className={val > 0 ? 'text-primary font-bold' : 'text-muted-foreground'}>
                      {p.der}
                    </span>
                  </div>
                  <div className="py-2">
                    <input
                      type="range"
                      min="-3"
                      max="3"
                      step="1"
                      value={val}
                      aria-label={`Intensidad entre ${p.izq} y ${p.der}`}
                      onChange={(e) =>
                        setParesState({ ...paresState, [p.par]: parseInt(e.target.value, 10) })
                      }
                      className="w-full accent-primary h-2 bg-surface-sunken rounded-lg appearance-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground/50 px-1 font-mono">
                    <span>-3</span>
                    <span>-2</span>
                    <span>-1</span>
                    <span className="text-foreground/70 font-semibold">0</span>
                    <span>+1</span>
                    <span>+2</span>
                    <span>+3</span>
                  </div>
                </div>
              );
            })}
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
              Siguiente: Notas de Sabor
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
              Agrado general (escala 1 a 7 estrellas)
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
              {agrado} / 7
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
                  Ejes de Textura y Aroma
                </span>
                <span className="text-xs text-primary font-mono font-medium">
                  Calibración Bosque Nativo
                </span>
              </div>

              {profileScores.map((score) => (
                <div key={score.name} className="space-y-2">
                  <div className="flex justify-between text-xs uppercase tracking-wider font-medium">
                    <span
                      className={
                        score.val < 0 ? 'text-primary font-semibold' : 'text-muted-foreground'
                      }
                    >
                      {score.inverse}
                    </span>
                    <span
                      className={
                        score.val > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'
                      }
                    >
                      {score.name}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface-sunken rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${score.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
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
