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
} from 'lucide-react';
import { Button, Input, toast, Badge, HexagonLoader, cn } from '@enjambre/ui';
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

const DEGUSTACION_VARIEDADES = [
  {
    id: 'crema-virgen',
    name: 'Miel Virgen con Trocito de Panal (25g)',
    icon: Droplet,
    note: 'Con trozo de panal natural intacto',
    fortificante: 'panal_virgen' as const,
  },
  {
    id: 'crema-polen',
    name: 'Crema de Miel con Polen Floral (25g)',
    icon: Flower2,
    note: 'Polen floral seleccionado',
    fortificante: 'polen_floral' as const,
  },
  {
    id: 'crema-avellanas',
    name: 'Crema de Miel con Avellana Chilena (25g)',
    icon: Nut,
    note: 'Avellana tostada y molida',
    fortificante: 'avellana_chilena' as const,
  },
  {
    id: 'crema-cacao',
    name: 'Crema de Miel con Nibs de Cacao Crudo (25g)',
    icon: Sparkle,
    note: 'Nibs de cacao crudo (Santander, Colombia)',
    fortificante: 'cacao_crudo' as const,
  },
];

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
      : 'miel',
  );
  const [selectedProductName, setSelectedProductName] = useState<string>(
    foundInitialVariant?.nombre_variante ?? foundInitial?.name ?? DEGUSTACION_VARIEDADES[0].name,
  );

  const [step, setStep] = useState<'intro' | 'producto' | 'pares' | 'chips' | 'user' | 'success'>(
    'intro',
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
  ) => {
    setSelectedProductId(prodId);
    setSelectedVarianteId(varId);
    setSelectedProductName(name);
    setTipoSensorial(category);
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

  const currentSemanticPairs =
    PARES_SEMANTICOS_POR_CATEGORIA[tipoSensorial] || PARES_SEMANTICOS_POR_CATEGORIA.miel;

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
        const match = products.find((p) =>
          p.name.toLowerCase().includes(selectedProductName.toLowerCase()),
        );
        if (match) finalProductId = match.id;
      }

      const nucleoUrl = requireNucleoApiUrl();
      const res = await fetch(`${nucleoUrl}/api/percepcion/sesiones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo_punto: codigo,
          producto_id: finalProductId,
          variante_id: selectedVarianteId || undefined,
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
      const msg = e instanceof Error ? e.message : 'Error al registrar la cata';
      toast(msg, { type: 'error' });
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
            Experiencia Inmersiva
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-medium text-foreground tracking-tight">
            Cata Sensorial
          </h1>
          <p className="text-muted-foreground leading-relaxed text-pretty max-w-lg mx-auto">
            Bienvenido al ritual de cata en{' '}
            <strong className="text-foreground font-medium">{punto.nombre}</strong>. Evalúa la miel
            que estás probando, acumula sellos de lealtad y crea tu propio{' '}
            <strong className="text-foreground font-medium">Pasaporte Sensorial</strong> del bosque.
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
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-400">
          <div className="text-center space-y-2">
            <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary">
              Paso 1 de 3
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-foreground tracking-tight">
              ¿Qué miel estás probando?
            </h2>
            <p className="text-sm text-muted-foreground">
              Selecciona el formato o infusión que tienes en mesa.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Si hay variantes configuradas en Núcleo para este o varios productos */}
            {variantes.length > 0 ? (
              variantes.map((v) => {
                const IconComponent = getVariantIcon(v.ingrediente_fortificante);
                const parentProduct = products.find((p) => p.id === v.producto_id);
                const category: CategoriaSensorial = v.ingrediente_fortificante
                  ? 'miel_fortificada'
                  : parentProduct?.category === 'hidromiel'
                    ? 'hidromiel'
                    : 'miel';
                const note = v.ingrediente_fortificante
                  ? `✦ Inclusión: ${FORTIFICANTES_LABELS[v.ingrediente_fortificante as FortificanteCanonico] ?? v.ingrediente_fortificante}`
                  : v.peso_neto_g
                    ? `Formato ${v.peso_neto_g}g`
                    : 'Miel Pura de Origen';

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() =>
                      selectProductOrVariant(
                        v.producto_id,
                        v.id,
                        v.nombre_variante,
                        category,
                      )
                    }
                    className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-surface-raised text-left transition-all duration-150 group min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <span className="w-11 h-11 rounded-xl bg-surface-sunken flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                      <IconComponent className="w-5 h-5" strokeWidth={1.75} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm leading-snug">{v.nombre_variante}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{note}</p>
                    </div>
                    <span className="text-xs font-medium text-primary inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      Catar <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                );
              })
            ) : (
              /* Fallback canónico de degustación */
              DEGUSTACION_VARIEDADES.map((v) => {
                const IconComponent = v.icon;
                const matchedProduct = products.find((p) =>
                  p.name.toLowerCase().includes(v.name.toLowerCase()),
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
                        v.fortificante === 'panal_virgen' || (v.fortificante as string) === 'virgen'
                          ? 'miel'
                          : 'miel_fortificada',
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
              })
            )}

            {/* Otros productos del catálogo (ej. Hidromiel, Extractos, etc.) */}
            {products.length > 0 &&
              products
                .filter(
                  (p) =>
                    !variantes.some((v) => v.producto_id === p.id) &&
                    !DEGUSTACION_VARIEDADES.some((v) => p.name.includes(v.name)),
                )
                .slice(0, 4)
                .map((p) => {
                  const cat: CategoriaSensorial =
                    p.category === 'hidromiel' ? 'hidromiel' : 'miel';
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectProductOrVariant(p.id, null, p.name, cat)}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-border/80 bg-card/60 hover:border-primary/50 hover:bg-surface-raised text-left transition-all duration-150 group min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <span className="w-11 h-11 rounded-xl bg-surface-sunken flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                        <Droplet className="w-5 h-5" strokeWidth={1.75} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm leading-snug">{p.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.format || 'Edición Territorial'}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-primary inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        Catar <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  );
                })}
          </div>
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

          <div className="bg-surface-raised border border-border p-6 rounded-2xl text-center space-y-4">
            <h3 className="font-display text-xl font-medium text-foreground tracking-tight">
              Lleva esta experiencia a tu casa
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Puedes canjear tus sellos y puntos acumulados en la tienda oficial o explorar otras
              recolecciones de{' '}
              <strong className="text-foreground font-medium">{selectedProductName}</strong>.
            </p>
            <Link
              href="/catalogo"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-8 text-xs uppercase tracking-[0.2em] font-medium text-primary-foreground transition-all hover:bg-primary/90 w-full active:scale-[0.99] shadow-sm"
            >
              Explorar Catálogo Oficial
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
