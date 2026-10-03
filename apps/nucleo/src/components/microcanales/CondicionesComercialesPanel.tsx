'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Copy,
  Printer,
  Check,
  Calculator,
  ShieldCheck,
  Truck,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  Flame,
  Thermometer,
  Edit3,
  RotateCcw,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
  toast,
  formatCLP,
} from '@enjambre/ui';
import {
  WHOLESALE_PRODUCTS_2025_2026,
  WHOLESALE_COMMERCIAL_RULES,
  WHOLESALE_INVESTMENT_TIERS,
  calculateWholesaleOrder,
  generateWholesaleAgreementMarkdown,
  wholesaleProductsFromRaw,
  type WholesaleProductItem,
  type WholesaleInvestmentTier,
} from '@enjambre/pricing';

type SubView = 'simulador' | 'editor' | 'contrato' | 'compromisos';

import { useApiFetch } from '@/hooks/use-api-fetch';
import { useQuery } from '@tanstack/react-query';

interface CommercialRulesState {
  moqFrascosMixtos: number;
  moqSachets: number;
  umbralDespachoGratisRmNetoClp: number;
  temperaturaMinimaCelsius: number;
  temperaturaMaximaCelsius: number;
  diasHabilesInspeccion: number;
  diasMaximoReclamo: number;
  diasGarantiaDevolucion: number;
  porcentajeContenidoMinimoDevolucion: number;
}

export function CondicionesComercialesPanel() {
  const apiFetch = useApiFetch();
  const [subView, setSubView] = useState<SubView>('simulador');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Catálogo de productos
  const [products, setProducts] = useState<WholesaleProductItem[]>([...WHOLESALE_PRODUCTS_2025_2026]);

  // Reglas comerciales editables en Núcleo
  const [rules, setRules] = useState<CommercialRulesState>({
    moqFrascosMixtos: WHOLESALE_COMMERCIAL_RULES.moqFrascosMixtos,
    moqSachets: WHOLESALE_COMMERCIAL_RULES.moqSachets,
    umbralDespachoGratisRmNetoClp: WHOLESALE_COMMERCIAL_RULES.umbralDespachoGratisRmNetoClp,
    temperaturaMinimaCelsius: WHOLESALE_COMMERCIAL_RULES.temperaturaMinimaCelsius,
    temperaturaMaximaCelsius: WHOLESALE_COMMERCIAL_RULES.temperaturaMaximaCelsius,
    diasHabilesInspeccion: WHOLESALE_COMMERCIAL_RULES.diasHabilesInspeccion,
    diasMaximoReclamo: WHOLESALE_COMMERCIAL_RULES.diasMaximoReclamo,
    diasGarantiaDevolucion: WHOLESALE_COMMERCIAL_RULES.diasGarantiaDevolucion,
    porcentajeContenidoMinimoDevolucion: WHOLESALE_COMMERCIAL_RULES.porcentajeContenidoMinimoDevolucion,
  });

  // Tramos de inversión
  const [tiers, setTiers] = useState<WholesaleInvestmentTier[]>([...WHOLESALE_INVESTMENT_TIERS]);

  // Cargar desde base de datos via BFF
  const condicionesQuery = useQuery({
    queryKey: ['b2b', 'condiciones-comerciales'],
    queryFn: async () => {
      const res = await apiFetch('/api/b2b/condiciones-comerciales');
      if (!res.ok) throw new Error('Error al cargar condiciones');
      return res.json();
    },
  });

  useEffect(() => {
    if (condicionesQuery.data?.data) {
      const r = condicionesQuery.data.data.rules;
      if (r) {
        setRules({
          moqFrascosMixtos: r.moq_frascos_mixtos ?? WHOLESALE_COMMERCIAL_RULES.moqFrascosMixtos,
          moqSachets: r.moq_sachets ?? WHOLESALE_COMMERCIAL_RULES.moqSachets,
          umbralDespachoGratisRmNetoClp: r.umbral_despacho_gratis_rm_neto_clp ?? WHOLESALE_COMMERCIAL_RULES.umbralDespachoGratisRmNetoClp,
          temperaturaMinimaCelsius: r.temperatura_minima_celsius ?? WHOLESALE_COMMERCIAL_RULES.temperaturaMinimaCelsius,
          temperaturaMaximaCelsius: r.temperatura_maxima_celsius ?? WHOLESALE_COMMERCIAL_RULES.temperaturaMaximaCelsius,
          diasHabilesInspeccion: r.dias_habiles_inspeccion ?? WHOLESALE_COMMERCIAL_RULES.diasHabilesInspeccion,
          diasMaximoReclamo: r.dias_maximo_reclamo ?? WHOLESALE_COMMERCIAL_RULES.diasMaximoReclamo,
          diasGarantiaDevolucion: r.dias_garantia_devolucion ?? WHOLESALE_COMMERCIAL_RULES.diasGarantiaDevolucion,
          porcentajeContenidoMinimoDevolucion: r.porcentaje_contenido_minimo_devolucion ?? WHOLESALE_COMMERCIAL_RULES.porcentajeContenidoMinimoDevolucion,
        });
        if (Array.isArray(r.productos) && r.productos.length > 0) {
          setProducts(wholesaleProductsFromRaw(r.productos));
        }
      }
      const tList = condicionesQuery.data.data.tiers;
      if (Array.isArray(tList) && tList.length > 0) {
        setTiers(
          tList.map((t: { desde_clp: number; hasta_clp: number | null; descuento_pct: number; etiqueta: string }) => ({
            desdeClp: Number(t.desde_clp),
            hastaClp: t.hasta_clp != null ? Number(t.hasta_clp) : null,
            descuentoPct: Number(t.descuento_pct),
            etiqueta: t.etiqueta,
          })),
        );
      }
    }
  }, [condicionesQuery.data]);

  // Guardar en base de datos cuando se edita
  const handleSaveToStorage = async () => {
    setSaving(true);
    try {
      const payload = {
        rules: {
          moq_frascos_mixtos: Number(rules.moqFrascosMixtos),
          moq_sachets: Number(rules.moqSachets),
          umbral_despacho_gratis_rm_neto_clp: Number(rules.umbralDespachoGratisRmNetoClp),
          temperatura_minima_celsius: Number(rules.temperaturaMinimaCelsius),
          temperatura_maxima_celsius: Number(rules.temperaturaMaximaCelsius),
          dias_habiles_inspeccion: Number(rules.diasHabilesInspeccion),
          dias_maximo_reclamo: Number(rules.diasMaximoReclamo),
          dias_garantia_devolucion: Number(rules.diasGarantiaDevolucion),
          porcentaje_contenido_minimo_devolucion: Number(rules.porcentajeContenidoMinimoDevolucion),
          productos: products.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            categoria: p.categoria,
            formato: p.formato,
            pesoGramos: p.pesoGramos,
            pvpRecomendadoClp: Number(p.pvpRecomendadoClp),
            precioNetoBaseClp: Number(p.precioNetoBaseClp),
            minimoCompraUnidades: Number(p.minimoCompraUnidades),
            ...(p.descripcion ? { descripcion: p.descripcion } : {}),
          })),
        },
        tiers: tiers.map((t, idx) => ({
          desde_clp: Number(t.desdeClp),
          hasta_clp: t.hastaClp != null ? Number(t.hastaClp) : null,
          descuento_pct: Number(t.descuentoPct),
          etiqueta: t.etiqueta,
          prioridad: idx + 1,
        })),
      };

      const res = await apiFetch('/api/b2b/condiciones-comerciales', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Error al guardar');
      }

      toast('Condiciones comerciales B2B actualizadas con éxito. La tienda y el portal mayorista ya usan estos valores.', { type: 'success' });
      condicionesQuery.refetch();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al guardar la configuración', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('¿Restablecer las reglas comerciales al boceto canónico?')) {
      setProducts([...WHOLESALE_PRODUCTS_2025_2026]);
      setRules({
        moqFrascosMixtos: WHOLESALE_COMMERCIAL_RULES.moqFrascosMixtos,
        moqSachets: WHOLESALE_COMMERCIAL_RULES.moqSachets,
        umbralDespachoGratisRmNetoClp: WHOLESALE_COMMERCIAL_RULES.umbralDespachoGratisRmNetoClp,
        temperaturaMinimaCelsius: WHOLESALE_COMMERCIAL_RULES.temperaturaMinimaCelsius,
        temperaturaMaximaCelsius: WHOLESALE_COMMERCIAL_RULES.temperaturaMaximaCelsius,
        diasHabilesInspeccion: WHOLESALE_COMMERCIAL_RULES.diasHabilesInspeccion,
        diasMaximoReclamo: WHOLESALE_COMMERCIAL_RULES.diasMaximoReclamo,
        diasGarantiaDevolucion: WHOLESALE_COMMERCIAL_RULES.diasGarantiaDevolucion,
        porcentajeContenidoMinimoDevolucion: WHOLESALE_COMMERCIAL_RULES.porcentajeContenidoMinimoDevolucion,
      });
      setTiers([...WHOLESALE_INVESTMENT_TIERS]);
      toast('Valores locales restaurados al boceto base (haz clic en Guardar para persistir en BD)', { type: 'info' });
    }
  };

  // Formulario para personalización de la ficha/contrato
  const [razonSocial, setRazonSocial] = useState('');
  const [rut, setRut] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fecha, setFecha] = useState(() => {
    const d = new Date();
    return `${d.getDate().toString().padStart(2, '0')} / ${(d.getMonth() + 1).toString().padStart(2, '0')} / ${d.getFullYear()}`;
  });

  // Estado del simulador de pedido
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({
    'crema-miel-sachet-15g': 0,
    'crema-miel-polen-avellana-sachet-15g': 0,
    'crema-miel-frasco-mediano-150g': 45,
    'crema-miel-variedades-frasco-mediano-150g': 45,
    'crema-miel-reserva-bosque-frasco-mayor-500g': 15,
    'miel-tradicional-reserva-bosque-frasco-mayor-500g': 15,
  });

  const quoteInput = useMemo(() => {
    return Object.entries(orderQuantities).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }, [orderQuantities]);

  const quote = useMemo(() => {
    return calculateWholesaleOrder(quoteInput, products, { rules, investmentTiers: tiers });
  }, [quoteInput, products, rules, tiers]);

  const agreementText = useMemo(() => {
    return generateWholesaleAgreementMarkdown({
      razonSocial: razonSocial || undefined,
      rut: rut || undefined,
      direccion: direccion || undefined,
      fecha,
      products,
      rules: { ...WHOLESALE_COMMERCIAL_RULES, ...rules },
      investmentTiers: tiers,
    });
  }, [razonSocial, rut, direccion, fecha, products, rules, tiers]);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(agreementText);
      setCopied(true);
      toast('Condiciones comerciales copiadas al portapapeles', { type: 'success' });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast('No se pudo copiar al portapapeles', { type: 'error' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleQuantityChange = (productId: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setOrderQuantities((prev) => ({
      ...prev,
      [productId]: num,
    }));
  };

  const handleProductFieldChange = (
    index: number,
    field: keyof WholesaleProductItem,
    value: string | number
  ) => {
    setProducts((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
  };

  const handleAddProduct = () => {
    const newId = `prod-custom-${Date.now()}`;
    const newProd: WholesaleProductItem = {
      id: newId,
      nombre: 'Nuevo Producto Mayorista',
      categoria: 'frasco_mediano',
      formato: '150 g',
      pesoGramos: 150,
      pvpRecomendadoClp: 5990,
      precioNetoBaseClp: 2990,
      minimoCompraUnidades: 12,
    };
    setProducts((prev) => [...prev, newProd]);
  };

  const handleDeleteProduct = (index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyPreset = (preset: 'apertura_mixta' | 'sachets_servicio' | 'frascos_premium') => {
    if (preset === 'apertura_mixta') {
      setOrderQuantities({
        'crema-miel-sachet-15g': 0,
        'crema-miel-polen-avellana-sachet-15g': 0,
        'crema-miel-frasco-mediano-150g': 45,
        'crema-miel-variedades-frasco-mediano-150g': 45,
        'crema-miel-reserva-bosque-frasco-mayor-500g': 15,
        'miel-tradicional-reserva-bosque-frasco-mayor-500g': 15,
      });
      toast('Preset aplicado: Apertura estándar 120 frascos', { type: 'success' });
    } else if (preset === 'sachets_servicio') {
      setOrderQuantities({
        'crema-miel-sachet-15g': 300,
        'crema-miel-polen-avellana-sachet-15g': 200,
        'crema-miel-frasco-mediano-150g': 0,
        'crema-miel-variedades-frasco-mediano-150g': 0,
        'crema-miel-reserva-bosque-frasco-mayor-500g': 0,
        'miel-tradicional-reserva-bosque-frasco-mayor-500g': 0,
      });
      toast('Preset aplicado: 500 sachets servicio/degustación', { type: 'success' });
    } else if (preset === 'frascos_premium') {
      setOrderQuantities({
        'crema-miel-sachet-15g': 0,
        'crema-miel-polen-avellana-sachet-15g': 0,
        'crema-miel-frasco-mediano-150g': 60,
        'crema-miel-variedades-frasco-mediano-150g': 60,
        'crema-miel-reserva-bosque-frasco-mayor-500g': 30,
        'miel-tradicional-reserva-bosque-frasco-mayor-500g': 30,
      });
      toast('Preset aplicado: 180 frascos (Escala Preferente ≥$1M)', { type: 'success' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Subnavegación del panel */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-sunken border border-border">
          <button
            type="button"
            onClick={() => setSubView('simulador')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              subView === 'simulador'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calculator size={14} />
            Simulador B2B
          </button>
          <button
            type="button"
            onClick={() => setSubView('editor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              subView === 'editor'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Edit3 size={14} />
            Editor de Tarifas & Boceto
          </button>
          <button
            type="button"
            onClick={() => setSubView('contrato')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              subView === 'contrato'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText size={14} />
            Ficha Oficial & Acuerdo
          </button>
          <button
            type="button"
            onClick={() => setSubView('compromisos')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              subView === 'compromisos'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck size={14} />
            Protocolo de Conservación
          </button>
        </div>

        <div className="flex items-center gap-2">
          {subView === 'editor' && (
            <>
              <Button variant="outline" size="sm" onClick={handleResetToDefaults}>
                <RotateCcw size={14} className="mr-1.5" />
                Restaurar boceto
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveToStorage}>
                <Save size={14} className="mr-1.5" />
                Guardar cambios
              </Button>
            </>
          )}
          {subView !== 'editor' && (
            <>
              <Button variant="outline" size="sm" onClick={handleCopyText}>
                {copied ? <Check size={14} className="mr-1.5 text-success" /> : <Copy size={14} className="mr-1.5" />}
                {copied ? 'Copiado' : 'Copiar acuerdo'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handlePrint} className="hidden sm:inline-flex">
                <Printer size={14} className="mr-1.5" />
                Imprimir
              </Button>
            </>
          )}
        </div>
      </div>

      {/* VISTA: EDITOR DE BOCETO Y TARIFAS EN NÚCLEO */}
      {subView === 'editor' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap pb-3">
              <div>
                <CardTitle className="text-base font-display">Editor Dinámico de Catálogo B2B</CardTitle>
                <CardDescription>
                  Ajusta los precios netos, PVP recomendados, mínimos y formatos en tiempo real. Cualquier cambio se refleja inmediatamente en el simulador y la ficha oficial.
                </CardDescription>
              </div>
              <Button variant="primary" size="sm" onClick={handleAddProduct}>
                <Plus size={14} className="mr-1.5" />
                Añadir producto
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="py-2.5 pr-2 font-medium">Nombre Producto</th>
                      <th className="py-2.5 px-2 font-medium w-24">Formato</th>
                      <th className="py-2.5 px-2 font-medium w-28">PVP Sugerido</th>
                      <th className="py-2.5 px-2 font-medium w-28 text-primary">Neto Base</th>
                      <th className="py-2.5 px-2 font-medium w-24">Mínimo (uds)</th>
                      <th className="py-2.5 pl-2 font-medium text-right w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {products.map((p, idx) => (
                      <tr key={p.id}>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={p.nombre}
                            onChange={(e) => handleProductFieldChange(idx, 'nombre', e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={p.formato}
                            onChange={(e) => handleProductFieldChange(idx, 'formato', e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={p.pvpRecomendadoClp}
                            onChange={(e) => handleProductFieldChange(idx, 'pvpRecomendadoClp', Number(e.target.value))}
                            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={p.precioNetoBaseClp}
                            onChange={(e) => handleProductFieldChange(idx, 'precioNetoBaseClp', Number(e.target.value))}
                            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs font-mono text-primary font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={p.minimoCompraUnidades}
                            onChange={(e) => handleProductFieldChange(idx, 'minimoCompraUnidades', Number(e.target.value))}
                            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs font-mono text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="py-2 pl-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(idx)}
                            className="text-muted-foreground hover:text-destructive transition p-1"
                            title="Eliminar producto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Parámetros Generales de Política */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Parámetros Operativos y Logísticos</CardTitle>
              <CardDescription>Reglas de negocio aplicadas al cálculo comercial B2B.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="MOQ Frascos Mixtos"
                type="number"
                value={rules.moqFrascosMixtos}
                onChange={(e) => setRules((r) => ({ ...r, moqFrascosMixtos: Number(e.target.value) }))}
              />
              <Input
                label="MOQ Sachets"
                type="number"
                value={rules.moqSachets}
                onChange={(e) => setRules((r) => ({ ...r, moqSachets: Number(e.target.value) }))}
              />
              <Input
                label="Despacho Gratis RM (Neto $)"
                type="number"
                value={rules.umbralDespachoGratisRmNetoClp}
                onChange={(e) => setRules((r) => ({ ...r, umbralDespachoGratisRmNetoClp: Number(e.target.value) }))}
              />
              <Input
                label="Rango Temperatura (°C)"
                value={`${rules.temperaturaMinimaCelsius} - ${rules.temperaturaMaximaCelsius} °C`}
                disabled
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* VISTA: SIMULADOR DE PEDIDO MAYORISTA */}
      {subView === 'simulador' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Formulario y productos */}
          <div className="lg:col-span-7 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-lg font-display">Cotizador Mayorista</CardTitle>
                    <CardDescription>
                      Ingresa cantidades para calcular cotización, márgenes del revendedor y validación de MOQ.
                    </CardDescription>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('apertura_mixta')}
                      className="px-2.5 py-1 text-[0.7rem] rounded-md bg-surface-raised border border-border text-muted-foreground hover:text-foreground transition"
                    >
                      Apertura 120 uds
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('frascos_premium')}
                      className="px-2.5 py-1 text-[0.7rem] rounded-md bg-surface-raised border border-border text-muted-foreground hover:text-foreground transition"
                    >
                      Tramo 10% (≥$1M)
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="divide-y divide-border/60">
                  {products.map((prod: WholesaleProductItem) => {
                    const currentQty = orderQuantities[prod.id] || 0;
                    const lineFinalNet = Math.round(
                      prod.precioNetoBaseClp * (1 - quote.descuentoInversionPct) * currentQty
                    );

                    return (
                      <div key={prod.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">{prod.nombre}</span>
                            <Badge variant="default" className="text-[0.65rem] px-1.5 py-0">
                              {prod.formato}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>
                              PVP sugerido: <strong className="text-foreground">{formatCLP(prod.pvpRecomendadoClp)}</strong>
                            </span>
                            <span>·</span>
                            <span>
                              Neto base: <strong className="text-primary">{formatCLP(prod.precioNetoBaseClp)}</strong>
                            </span>
                            <span>·</span>
                            <span>Min: {prod.minimoCompraUnidades} uds</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-20">
                            <input
                              type="number"
                              min="0"
                              step="5"
                              value={currentQty === 0 ? '' : currentQty}
                              placeholder="0"
                              onChange={(e) => handleQuantityChange(prod.id, e.target.value)}
                              className="w-full text-center rounded-lg border border-border bg-background px-2 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div className="w-24 text-right">
                            <p className="text-xs font-semibold text-foreground">
                              {currentQty > 0 ? formatCLP(lineFinalNet) : '—'}
                            </p>
                            <p className="text-[0.65rem] text-muted-foreground">neto</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Escala de inversión informativa */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tiers.map((tier) => {
                const isActive = quote.descuentoInversionPct === tier.descuentoPct;
                return (
                  <div
                    key={tier.etiqueta}
                    className={`rounded-xl p-3 border transition-all ${
                      isActive
                        ? 'bg-primary/10 border-primary shadow-sm'
                        : 'bg-surface-sunken/40 border-border/60 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                        {tier.descuentoPct === 0 ? 'Base' : `+${tier.descuentoPct * 100}% Dcto`}
                      </span>
                      {isActive && <Badge variant="success" className="text-[0.6rem] px-1 py-0">Activo</Badge>}
                    </div>
                    <p className="text-xs font-medium text-foreground mt-1">{tier.etiqueta}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Resumen de Cotización y Márgenes */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-primary/30 shadow-md">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-display">Resumen de Cotización B2B</CardTitle>
                  <Badge variant={quote.cumpleMoqGeneral ? 'success' : 'warning'}>
                    {quote.cumpleMoqGeneral ? 'MOQ Cumplido' : 'Bajo MOQ'}
                  </Badge>
                </div>
                <CardDescription>
                  {quote.totalUnidadesFrascos} frascos (mín. {rules.moqFrascosMixtos}) · {quote.totalUnidadesSachets} sachets (mín. {rules.moqSachets})
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                {/* Alerta de MOQ si no cumple */}
                {!quote.cumpleMoqGeneral && (
                  <div className="rounded-xl bg-warning/10 border border-warning/30 p-3 flex items-start gap-2 text-xs text-foreground">
                    <AlertCircle size={16} className="text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-warning">Apertura bajo pedido mínimo inicial</p>
                      <p className="text-muted-foreground mt-0.5">
                        El MOQ inicial requiere mínimo <strong>{rules.moqFrascosMixtos} frascos mixtos</strong> o <strong>{rules.moqSachets} sachets</strong>.
                        {quote.totalUnidadesFrascos > 0 && ` Faltan ${Math.max(0, rules.moqFrascosMixtos - quote.totalUnidadesFrascos)} frascos.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Próximo tramo de inversión */}
                {quote.proximoTramoDescuento && quote.subtotalNetoBaseClp > 0 && (
                  <div className="rounded-xl bg-surface-sunken border border-border p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Próximo tramo ({quote.proximoTramoDescuento.pct}% dcto)</span>
                      <span className="font-medium text-foreground">
                        Faltan {formatCLP(quote.proximoTramoDescuento.faltanteClp)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            (quote.subtotalNetoBaseClp / quote.proximoTramoDescuento.metaClp) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Desglose Financiero */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal Neto Base:</span>
                    <span className="font-mono">{formatCLP(quote.subtotalNetoBaseClp)}</span>
                  </div>

                  {quote.descuentoInversionPct > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Descuento por inversión ({quote.descuentoInversionPct * 100}%):</span>
                      <span className="font-mono">-{formatCLP(quote.descuentoInversionClp)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-medium text-foreground pt-1 border-t border-border/50">
                    <span>Neto Facturable:</span>
                    <span className="font-mono text-primary font-bold">{formatCLP(quote.subtotalNetoFinalClp)}</span>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>IVA Crédito Fiscal (19%):</span>
                    <span className="font-mono">{formatCLP(quote.iva19PctClp)}</span>
                  </div>

                  <div className="flex justify-between items-baseline pt-2 border-t border-border font-display">
                    <span className="text-base font-semibold text-foreground">Total Factura (IVA incl.):</span>
                    <span className="text-xl font-bold text-foreground font-mono">
                      {formatCLP(quote.totalFacturableIvaIncluidoClp)}
                    </span>
                  </div>
                </div>

                {/* Logística RM */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Truck size={14} className={quote.despachoGratisRm ? 'text-success' : 'text-muted-foreground'} />
                    Despacho Región Metropolitana:
                  </span>
                  <span className={quote.despachoGratisRm ? 'text-success font-medium' : 'text-muted-foreground'}>
                    {quote.despachoGratisRm
                      ? `Gratuito (≥ ${formatCLP(rules.umbralDespachoGratisRmNetoClp)} netos)`
                      : `Faltan ${formatCLP(quote.montoFaltanteDespachoGratisClp)}`}
                  </span>
                </div>

                {/* Rendimiento para el Emporio / Revendedor */}
                <div className="rounded-xl bg-surface-raised/80 border border-border p-3.5 space-y-2">
                  <p className="text-[0.7rem] uppercase tracking-wider font-semibold text-muted-foreground">
                    Rentabilidad Proyectada del Revendedor
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Venta a PVP Sugerido</p>
                      <p className="text-sm font-semibold text-foreground font-mono">
                        {formatCLP(quote.totalPvpEstimadoClp)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Margen Comercial Neto</p>
                      <p className="text-sm font-semibold text-success font-mono">
                        ~{quote.margenComercialRevendedorPct}%
                      </p>
                    </div>
                  </div>
                  <p className="text-[0.68rem] text-muted-foreground leading-tight">
                    Calculado vendiendo a precios recomendados al público sugeridos por la marca.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* VISTA: CONTRATO / FICHA OFICIAL */}
      {subView === 'contrato' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Personalización rápida */}
          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display">Personalizar Documento</CardTitle>
                <CardDescription>
                  Ingresa los datos del emporio o cliente para generar el acuerdo listo para firma.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <Input
                  label="Razón Social / Nombre"
                  placeholder="Ej: Emporio Lo Barnechea SpA"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                />
                <Input
                  label="RUT Cliente"
                  placeholder="Ej: 76.123.456-7"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                />
                <Input
                  label="Dirección Punto de Venta"
                  placeholder="Ej: Av. El Rodeo 12345, Lo Barnechea"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
                <Input
                  label="Fecha de Emisión"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
                <div className="pt-2">
                  <Button variant="primary" className="w-full" onClick={handleCopyText}>
                    {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                    {copied ? 'Copiado al Portapapeles' : 'Copiar Ficha Formal'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Renderizado de la Ficha Editorial Oficial */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-lg space-y-8">
              {/* Encabezado Editorial */}
              <div className="border-b border-border/80 pb-6 text-center space-y-2">
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary">
                  Condiciones Comerciales Oficiales
                </p>
                <h2 className="font-display text-2xl sm:text-3xl text-foreground font-light">
                  Revendedor Autorizado Chile (2025-2026)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Obrera y Zangano · Miel de autor │ obrerayzangano.cl │ @obrerayzangano
                </p>
              </div>

              {/* Datos del Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs rounded-xl bg-surface-sunken/40 border border-border/60 p-4">
                <div>
                  <span className="text-muted-foreground uppercase text-[0.65rem] tracking-wider block">Cliente / Razón Social</span>
                  <span className="font-semibold text-foreground text-sm">{razonSocial || '____________________________________________'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase text-[0.65rem] tracking-wider block">RUT</span>
                  <span className="font-mono text-foreground text-sm">{rut || '__________________'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground uppercase text-[0.65rem] tracking-wider block">Punto de Venta Aprobado</span>
                  <span className="text-foreground">{direccion || '____________________________________________'}</span>
                  <p className="text-[0.68rem] text-muted-foreground italic mt-1">
                    (Se reserva el derecho de aprobación previa del punto de venta por Obrera y Zangano para garantizar coherencia con la imagen premium de la marca.)
                  </p>
                </div>
              </div>

              {/* Pedido Mínimo Inicial */}
              <div className="space-y-1">
                <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-primary">
                  1. Pedido Mínimo Inicial (MOQ)
                </h3>
                <p className="text-xs text-muted-foreground">
                  <strong>{rules.moqFrascosMixtos} unidades mixtas</strong> (frascos medianos / mayores) o <strong>{rules.moqSachets} unidades</strong> (sachets individuales).
                </p>
              </div>

              {/* Tabla de Tarifas */}
              <div className="space-y-2">
                <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-primary">
                  2. Precios Netos Revendedor (sin IVA – franco bodega Santiago)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">Producto</th>
                        <th className="py-2 px-2 font-medium">Formato</th>
                        <th className="py-2 px-2 font-medium">PVP Sugerido (IVA incl.)</th>
                        <th className="py-2 px-2 font-medium text-primary">Precio Neto Base</th>
                        <th className="py-2 pl-2 font-medium text-right">Mínimo Compra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {products.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2.5 pr-3 font-medium text-foreground">{p.nombre}</td>
                          <td className="py-2.5 px-2 text-muted-foreground">{p.formato}</td>
                          <td className="py-2.5 px-2 font-mono text-foreground">{formatCLP(p.pvpRecomendadoClp)}</td>
                          <td className="py-2.5 px-2 font-mono text-primary font-bold">{formatCLP(p.precioNetoBaseClp)}</td>
                          <td className="py-2.5 pl-2 font-mono text-right text-muted-foreground">{p.minimoCompraUnidades} uds.</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Escala de Descuentos */}
              <div className="space-y-1">
                <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-primary">
                  3. Escala de Descuentos por Inversión Neta
                </h3>
                <div className="flex flex-wrap gap-4 text-xs text-foreground">
                  <span className="rounded-lg bg-surface-sunken px-3 py-1.5 border border-border">
                    Menos de $500.000 netos: <strong>0 %</strong>
                  </span>
                  <span className="rounded-lg bg-surface-sunken px-3 py-1.5 border border-border">
                    $500.000 – $999.999 netos: <strong>5 %</strong>
                  </span>
                  <span className="rounded-lg bg-surface-sunken px-3 py-1.5 border border-border">
                    ≥ $1.000.000 netos: <strong>10 %</strong>
                  </span>
                </div>
              </div>

              {/* Condiciones de Pago y Entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-primary">
                    4. Condiciones de Pago
                  </h3>
                  <p className="text-muted-foreground">
                    • 1er pedido: 100 % anticipado o 50 % anticipo + 50 % contra entrega.<br />
                    • Siguientes (sujeto a evaluación crediticia): 30 días fecha factura.
                  </p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-primary">
                    5. Despacho y Entrega
                  </h3>
                  <p className="text-muted-foreground">
                    • Región Metropolitana: Gratuito desde {formatCLP(rules.umbralDespachoGratisRmNetoClp)} netos.<br />
                    • Montos inferiores: costo según comuna. Regiones: flete por pagar.
                  </p>
                </div>
              </div>

              {/* Firmas de Cierre */}
              <div className="pt-8 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-8 text-xs">
                <div className="space-y-6">
                  <p className="text-muted-foreground">Fecha: {fecha}</p>
                  <div className="border-t border-dashed border-border pt-2">
                    <p className="font-semibold text-foreground">Firma Revendedor Autorizado</p>
                    <p className="text-[0.65rem] text-muted-foreground">RUT: {rut || '__________________'}</p>
                  </div>
                </div>
                <div className="space-y-6 text-right">
                  <p className="text-muted-foreground">Validez: 12 meses</p>
                  <div className="border-t border-dashed border-border pt-2">
                    <p className="font-semibold text-foreground">Obrera y Zangano EIRL</p>
                    <p className="text-[0.65rem] text-muted-foreground">Firma y Sello Oficial</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA: COMPROMISOS Y PROTOCOLO DE CALIDAD */}
      {subView === 'compromisos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Thermometer size={18} />
                <CardTitle className="text-sm font-semibold">1. Almacenamiento & Conservación</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1.5">
              <p>
                Temperatura constante entre <strong>{rules.temperaturaMinimaCelsius} y {rules.temperaturaMaximaCelsius} °C</strong>, humedad relativa menor al 60 %, en lugar seco, sin exposición directa al sol y libre de olores intensos.
              </p>
              <p className="text-[0.68rem] text-foreground/80 italic">
                El incumplimiento exime al productor de deterioros por cristalización anómala o fermentación.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Calendar size={18} />
                <CardTitle className="text-sm font-semibold">2. Inspección & Reclamos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1.5">
              <p>
                Inspección obligatoria dentro de los <strong>{rules.diasHabilesInspeccion} días hábiles</strong> siguientes a la recepción.
              </p>
              <p>
                Reclamos por defectos visibles u ocultos deben formularse por escrito con respaldo fotográfico y muestras en un máximo de <strong>{rules.diasMaximoReclamo} días</strong>.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary mb-1">
                <ShieldCheck size={18} />
                <CardTitle className="text-sm font-semibold">3. Devoluciones & Garantía</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1.5">
              <p>
                Aceptadas únicamente por <strong>defectos de fabricación comprobados</strong> dentro de los 15 días posteriores a la notificación válida.
              </p>
              <p className="text-[0.68rem] text-foreground/80">
                El frasco debe conservar su empaque original y al menos el 80 % de su contenido intacto.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Flame size={18} />
                <CardTitle className="text-sm font-semibold">4. Límite de Responsabilidad</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1.5">
              <p>
                La responsabilidad máxima del proveedor se limita al <strong>valor neto del lote afectado</strong>.
              </p>
              <p>
                Se excluyen de forma expresa lucro cesante, daños indirectos o eventos de fuerza mayor (sequías, interrupciones climáticas apícolas).
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Building2 size={18} />
                <CardTitle className="text-sm font-semibold">5. Protección de Marca & Canal</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1.5">
              <p>
                Prohibida la venta en marketplaces masivos (Mercado Libre, Falabella, etc.) sin autorización escrita previa.
              </p>
              <p>
                Permitida la venta en el local físico aprobado y en la tienda online propia respetando siempre los precios recomendados al público (PVP).
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Layers size={18} />
                <CardTitle className="text-sm font-semibold">6. Material POP & Degustación</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1.5">
              <p>
                A partir del segundo pedido se facilita de forma gratuita <strong>material POP oficial</strong>: exhibidores de madera noble, pendón, catadores y cartelería editorial.
              </p>
              <p className="text-[0.68rem] text-foreground/80">
                Uso obligatorio en la zona gourmet del local para garantizar la coherencia estética.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
