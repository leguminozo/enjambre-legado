'use client';

import { useMemo, useState } from 'react';
import { Badge, Card, CardContent, Input, Label, MoneyInput } from '@enjambre/ui';
import {
  calcularABV,
  calcularCostoPorBotella,
  calcularPrimingMiel,
  MAX_VOL_CHAMPAGNE,
  MAX_VOL_FLIP_TOP,
  type ZonaSeguridad,
} from '@/lib/hidromiel';

function parseNum(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

const CO2_QUICK = ['2.0', '2.5', '3.0', '3.5', '4.0'];

const ZONA_INFO: Record<ZonaSeguridad, { label: string; variant: 'success' | 'warning' | 'destructive'; texto: string }> = {
  'flip-top': {
    label: `Flip-top / Grolsch (≤ ${MAX_VOL_FLIP_TOP} vol)`,
    variant: 'success',
    texto: 'Dosis segura para botella de vidrio con cierre abatible.',
  },
  champagne: {
    label: `Champagne (${MAX_VOL_FLIP_TOP}–${MAX_VOL_CHAMPAGNE} vol)`,
    variant: 'warning',
    texto: 'Requiere botella de champagne (fondo cóncavo profundo) con muselet.',
  },
  peligro: {
    label: `Peligro (> ${MAX_VOL_CHAMPAGNE} vol)`,
    variant: 'destructive',
    texto: 'Presión de botella bomba — revisa el cálculo antes de envasar.',
  },
};

/** Instrumento: gramos de miel de adición para la carbonatación deseada. */
export function CalculadoraPriming({ volumenInicial }: { volumenInicial?: number | null }) {
  const [volumen, setVolumen] = useState(volumenInicial != null ? String(volumenInicial) : '10');
  const [temperatura, setTemperatura] = useState('18');
  const [co2, setCo2] = useState('3.0');
  const [fermentabilidad, setFermentabilidad] = useState('0.82');

  const resultado = useMemo(() => {
    const volumenL = parseNum(volumen);
    const tempC = parseNum(temperatura);
    const co2TargetVol = parseNum(co2);
    const fermentabilidadMiel = parseNum(fermentabilidad);
    if (volumenL === null || tempC === null || co2TargetVol === null || fermentabilidadMiel === null) return null;
    return calcularPrimingMiel({ volumenL, co2TargetVol, tempC, fermentabilidadMiel });
  }, [volumen, temperatura, co2, fermentabilidad]);

  const zona = resultado ? ZONA_INFO[resultado.zona] : null;

  return (
    <Card className="rounded-2xl border-border">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-foreground">Priming con miel</p>
          <Badge variant="info">Instrumento</Badge>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="priming-volumen">Volumen (L)</Label>
            <Input id="priming-volumen" inputMode="decimal" value={volumen} onChange={(e) => setVolumen(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priming-temp">Temp. embotellado (°C)</Label>
            <Input id="priming-temp" inputMode="decimal" value={temperatura} onChange={(e) => setTemperatura(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priming-co2">CO₂ objetivo (vol)</Label>
            <Input id="priming-co2" inputMode="decimal" value={co2} onChange={(e) => setCo2(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {CO2_QUICK.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setCo2(v)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors border ${
                co2 === v
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-surface-raised text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {v} vol
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            Fermentabilidad
            <Input
              className="w-20 h-8 text-xs"
              inputMode="decimal"
              value={fermentabilidad}
              onChange={(e) => setFermentabilidad(e.target.value)}
            />
          </label>
        </div>

        {resultado && zona ? (
          <div className="rounded-xl bg-surface-sunken p-4 space-y-2">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <p className="text-3xl font-bold text-foreground font-display">
                {resultado.gramosMiel.toLocaleString('es-CL', { maximumFractionDigits: 1 })} g
              </p>
              <p className="text-xs text-muted-foreground">
                {resultado.gramosPorLitro.toFixed(1)} g/L · residual {resultado.co2ResidualVol.toFixed(2)} vol +{' '}
                {resultado.co2NuevoVol.toFixed(2)} vol nuevos
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={zona.variant}>{zona.label}</Badge>
              <span className="text-xs text-muted-foreground">{zona.texto}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Ingresa volumen, temperatura y CO₂ objetivo para calcular la dosis.</p>
        )}
      </CardContent>
    </Card>
  );
}

/** Instrumento: ABV a partir de gravedad inicial y final. */
export function CalculadoraABV({ ogInicial, fgInicial }: { ogInicial?: number | null; fgInicial?: number | null }) {
  const [og, setOg] = useState(ogInicial != null ? String(ogInicial) : '1.100');
  const [fg, setFg] = useState(fgInicial != null ? String(fgInicial) : '1.000');

  const abv = useMemo(() => {
    const ogN = parseNum(og);
    const fgN = parseNum(fg);
    if (ogN === null || fgN === null) return null;
    return calcularABV(ogN, fgN);
  }, [og, fg]);

  return (
    <Card className="rounded-2xl border-border">
      <CardContent className="p-5 space-y-4">
        <p className="text-sm font-bold text-foreground">Alcohol (ABV)</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="abv-og">Densidad inicial (OG)</Label>
            <Input id="abv-og" inputMode="decimal" value={og} onChange={(e) => setOg(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="abv-fg">Densidad final (FG)</Label>
            <Input id="abv-fg" inputMode="decimal" value={fg} onChange={(e) => setFg(e.target.value)} />
          </div>
        </div>
        {abv !== null ? (
          <p className="text-2xl font-bold text-foreground font-display">
            {abv.toLocaleString('es-CL', { maximumFractionDigits: 1 })}% vol
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Revisa los valores (FG debe ser menor o igual a OG).</p>
        )}
      </CardContent>
    </Card>
  );
}

/** Instrumento: costo por botella en CLP. */
export function CalculadoraCostos({
  mielKgInicial,
  mielKgFuente,
  costoInsumosInicial,
  costoEnvasesInicial,
  nBotellasInicial,
}: {
  mielKgInicial?: number | null;
  mielKgFuente?: string | null;
  costoInsumosInicial?: number | null;
  costoEnvasesInicial?: number | null;
  nBotellasInicial?: number | null;
}) {
  const [mielKg, setMielKg] = useState(mielKgInicial != null ? String(mielKgInicial) : '');
  const [costoInsumos, setCostoInsumos] = useState<number | null>(costoInsumosInicial ?? null);
  const [costoEnvases, setCostoEnvases] = useState<number | null>(costoEnvasesInicial ?? null);
  const [nBotellas, setNBotellas] = useState(nBotellasInicial != null ? String(nBotellasInicial) : '');

  const costo = useMemo(() => {
    const miel = parseNum(mielKg);
    const botellas = parseNum(nBotellas);
    if (miel === null || costoInsumos === null || costoEnvases === null || botellas === null) return null;
    return calcularCostoPorBotella({ mielKg: miel, costoMielKg: costoInsumos, costoEnvases, nBotellas: botellas });
  }, [mielKg, costoInsumos, costoEnvases, nBotellas]);

  return (
    <Card className="rounded-2xl border-border">
      <CardContent className="p-5 space-y-4">
        <p className="text-sm font-bold text-foreground">Costo por botella</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="costo-miel">Miel usada (kg)</Label>
            <Input id="costo-miel" inputMode="decimal" value={mielKg} onChange={(e) => setMielKg(e.target.value)} placeholder="3.5" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="costo-botellas">Botellas</Label>
            <Input id="costo-botellas" inputMode="numeric" value={nBotellas} onChange={(e) => setNBotellas(e.target.value)} placeholder="24" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="costo-insumos">Costo insumos (miel, levadura…)</Label>
            <MoneyInput id="costo-insumos" value={costoInsumos} onValueChange={setCostoInsumos} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="costo-envases">Costo envases (botellas, tapas…)</Label>
            <MoneyInput id="costo-envases" value={costoEnvases} onValueChange={setCostoEnvases} />
          </div>
        </div>
        {mielKgFuente && <p className="text-[0.65rem] text-muted-foreground">Miel: {mielKgFuente}</p>}
        {costo !== null ? (
          <p className="text-2xl font-bold text-foreground font-display">
            ${costo.toLocaleString('es-CL')} <span className="text-sm font-normal text-muted-foreground">por botella</span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Ingresa miel, costos y botellas para calcular el costo unitario.</p>
        )}
      </CardContent>
    </Card>
  );
}
