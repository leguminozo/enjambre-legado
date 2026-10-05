/**
 * Condiciones comerciales B2B y catálogo oficial para Revendedores Autorizados
 * Obrera y Zangano — Miel de autor Chile (2025-2026).
 */

export interface WholesaleProductItem {
  id: string;
  nombre: string;
  categoria: 'sachet' | 'frasco_mediano' | 'frasco_mayor';
  formato: string;
  pesoGramos: number;
  pvpRecomendadoClp: number;
  precioNetoBaseClp: number;
  minimoCompraUnidades: number;
  descripcion?: string;
}

export interface WholesaleInvestmentTier {
  desdeClp: number;
  hastaClp: number | null;
  descuentoPct: number;
  etiqueta: string;
}

export interface WholesaleOrderLineInput {
  productId: string;
  quantity: number;
}

export interface WholesaleCalculatedLine {
  productId: string;
  nombre: string;
  categoria: 'sachet' | 'frasco_mediano' | 'frasco_mayor';
  formato: string;
  quantity: number;
  pvpUnitarioClp: number;
  precioNetoBaseUnitarioClp: number;
  precioNetoFinalUnitarioClp: number;
  subtotalNetoBaseClp: number;
  subtotalNetoFinalClp: number;
  subtotalPvpEstimadoClp: number;
  margenBrutoEstimadoClp: number;
  margenPctSobrePvp: number;
}

export interface WholesaleQuoteResult {
  lines: WholesaleCalculatedLine[];
  totalUnidadesFrascos: number;
  totalUnidadesSachets: number;
  totalUnidades: number;
  cumpleMoqFrascos: boolean;
  cumpleMoqSachets: boolean;
  cumpleMoqGeneral: boolean;
  subtotalNetoBaseClp: number;
  descuentoInversionPct: number;
  descuentoInversionClp: number;
  subtotalNetoFinalClp: number;
  despachoGratisRm: boolean;
  montoFaltanteDespachoGratisClp: number;
  iva19PctClp: number;
  totalFacturableIvaIncluidoClp: number;
  totalPvpEstimadoClp: number;
  margenComercialRevendedorClp: number;
  margenComercialRevendedorPct: number;
  proximoTramoDescuento: {
    metaClp: number;
    pct: number;
    faltanteClp: number;
  } | null;
}

export const WHOLESALE_PRODUCTS_2025_2026: readonly WholesaleProductItem[] = [  {
    id: 'crema-miel-sachet-15g',
    nombre: 'Crema de Miel (sachet)',
    categoria: 'sachet',
    formato: '15 g',
    pesoGramos: 15,
    pvpRecomendadoClp: 990,
    precioNetoBaseClp: 400,
    minimoCompraUnidades: 500,
    descripcion: 'Sachet individual 15g de miel cruda cremada para servicio y barra.',
  },
  {
    id: 'crema-miel-polen-avellana-sachet-15g',
    nombre: 'Crema de Miel con Polen / Avellanas (sachet)',
    categoria: 'sachet',
    formato: '15-20 g',
    pesoGramos: 18,
    pvpRecomendadoClp: 1190,
    precioNetoBaseClp: 500,
    minimoCompraUnidades: 500,
    descripcion: 'Sachet individual infusionado con polen agroecológico o avellana tostada.',
  },
  {
    id: 'crema-miel-frasco-mediano-150g',
    nombre: 'Crema de Miel (frasco mediano)',
    categoria: 'frasco_mediano',
    formato: '150 g',
    pesoGramos: 150,
    pvpRecomendadoClp: 5990,
    precioNetoBaseClp: 2990,
    minimoCompraUnidades: 30,
    descripcion: 'Frasco mediano de vidrio, crema de miel pura del bosque patagónico.',
  },
  {
    id: 'crema-miel-variedades-frasco-mediano-150g',
    nombre: 'Crema de Miel con Polen / Avellanas / Cacao (frasco mediano)',
    categoria: 'frasco_mediano',
    formato: '150 g',
    pesoGramos: 150,
    pvpRecomendadoClp: 6490,
    precioNetoBaseClp: 3245,
    minimoCompraUnidades: 30,
    descripcion: 'Frasco mediano con superalimentos e ingredientes nobles.',
  },
  {
    id: 'crema-miel-reserva-bosque-frasco-mayor-500g',
    nombre: 'Crema de Miel ~ Reserva del Bosque (frasco mayor)',
    categoria: 'frasco_mayor',
    formato: '500 g',
    pesoGramos: 500,
    pvpRecomendadoClp: 21990,
    precioNetoBaseClp: 16655,
    minimoCompraUnidades: 15,
    descripcion: 'Edición mayor 500g, lote numerado de bosque nativo antiguo.',
  },
  {
    id: 'miel-tradicional-reserva-bosque-frasco-mayor-500g',
    nombre: 'Miel Tradicional ~ Reserva del Bosque (frasco mayor)',
    categoria: 'frasco_mayor',
    formato: '500 g',
    pesoGramos: 500,
    pvpRecomendadoClp: 14990,
    precioNetoBaseClp: 11100,
    minimoCompraUnidades: 15,
    descripcion: 'Miel líquida tradicional sin filtrar 500g con origen protegido.',
  },
] as const;

/**
 * Sanea el catálogo mayorista persistido (JSONB del CMS de Núcleo) a fichas
 * completas. Ítem inválido o columna vacía = catálogo base del package: una
 * edición trunca del panel nunca puede dejar al simulador sin precios.
 */
export function wholesaleProductsFromRaw(
  raw: unknown,
  fallback: readonly WholesaleProductItem[] = WHOLESALE_PRODUCTS_2025_2026,
): WholesaleProductItem[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return fallback.map((p) => ({ ...p }));
  }

  const CATEGORIAS = new Set(['sachet', 'frasco_mediano', 'frasco_mayor']);
  const parsed: WholesaleProductItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const obj = item as Record<string, unknown>;
    const id = typeof obj.id === 'string' ? obj.id.trim() : '';
    const nombre = typeof obj.nombre === 'string' ? obj.nombre.trim() : '';
    const categoria = typeof obj.categoria === 'string' && CATEGORIAS.has(obj.categoria)
      ? (obj.categoria as WholesaleProductItem['categoria'])
      : null;
    if (!id || !nombre || !categoria) continue;

    const pvp = Number(obj.pvpRecomendadoClp);
    const neto = Number(obj.precioNetoBaseClp);
    const minimo = Number(obj.minimoCompraUnidades);
    const peso = Number(obj.pesoGramos);
    if (!Number.isFinite(pvp) || pvp < 0 || !Number.isFinite(neto) || neto < 0) continue;

    parsed.push({
      id,
      nombre,
      categoria,
      formato: typeof obj.formato === 'string' ? obj.formato.trim() : '',
      pesoGramos: Number.isFinite(peso) && peso >= 0 ? Math.round(peso) : 0,
      pvpRecomendadoClp: Math.round(pvp),
      precioNetoBaseClp: Math.round(neto),
      minimoCompraUnidades: Number.isFinite(minimo) && minimo >= 0 ? Math.round(minimo) : 0,
      descripcion: typeof obj.descripcion === 'string' ? obj.descripcion : undefined,
    });
  }

  return parsed.length > 0 ? parsed : fallback.map((p) => ({ ...p }));
}

export const WHOLESALE_INVESTMENT_TIERS: readonly WholesaleInvestmentTier[] = [
  { desdeClp: 0, hastaClp: 499999, descuentoPct: 0, etiqueta: 'Base (< $500.000)' },
  { desdeClp: 500000, hastaClp: 999999, descuentoPct: 0.05, etiqueta: 'Volumen 5% ($500.000 – $999.999)' },
  { desdeClp: 1000000, hastaClp: null, descuentoPct: 0.10, etiqueta: 'Mayorista Preferente 10% (≥ $1.000.000)' },
] as const;

export interface WholesaleCommercialRules {
  moqFrascosMixtos: number;
  moqSachets: number;
  umbralDespachoGratisRmNetoClp: number;
  tasaIvaChile: number;
  temperaturaMinimaCelsius: number;
  temperaturaMaximaCelsius: number;
  humedadMaximaPct: number;
  diasHabilesInspeccion: number;
  diasMaximoReclamo: number;
  diasGarantiaDevolucion: number;
  porcentajeContenidoMinimoDevolucion: number;
  contactoEmail: string;
  contactoTelefono: string;
  sitioWeb: string;
  instagram: string;
  razonSocialEmisora: string;
}

export const WHOLESALE_COMMERCIAL_RULES: WholesaleCommercialRules = {
  moqFrascosMixtos: 120,
  moqSachets: 500,
  umbralDespachoGratisRmNetoClp: 900000,
  tasaIvaChile: 0.19,
  temperaturaMinimaCelsius: 15,
  temperaturaMaximaCelsius: 25,
  humedadMaximaPct: 60,
  diasHabilesInspeccion: 5,
  diasMaximoReclamo: 30,
  diasGarantiaDevolucion: 15,
  porcentajeContenidoMinimoDevolucion: 80,
  contactoEmail: 'contacto@obrerayzangano.cl',
  contactoTelefono: '+56 9 7760 7741',
  sitioWeb: 'obrerayzangano.cl',
  instagram: '@obrerayzangano',
  razonSocialEmisora: 'Obrera y Zangano EIRL',
};

export interface WholesaleOrderCalculationOptions {
  rules?: Partial<WholesaleCommercialRules>;
  investmentTiers?: readonly WholesaleInvestmentTier[];
}

/**
 * Clasifica el volumen mensual estimado en su tramo mayorista oficial.
 */
export function clasificarTierInversion(montoClp: number): {
  etiqueta: string;
  descuentoPct: number;
} {
  const monto = Math.max(0, Math.floor(montoClp));
  const sorted = [...WHOLESALE_INVESTMENT_TIERS].sort((a, b) => b.desdeClp - a.desdeClp);
  for (const tier of sorted) {
    if (monto >= tier.desdeClp && (tier.hastaClp == null || monto <= tier.hastaClp)) {
      return { etiqueta: tier.etiqueta, descuentoPct: tier.descuentoPct };
    }
  }
  const base = WHOLESALE_INVESTMENT_TIERS[0]!;
  return { etiqueta: base.etiqueta, descuentoPct: base.descuentoPct };
}

/**
 * Resuelve el porcentaje de descuento según la inversión neta.
 */
export function resolveInvestmentDiscountPct(
  subtotalNetoClp: number,
  tiers: readonly WholesaleInvestmentTier[] = WHOLESALE_INVESTMENT_TIERS,
): number {
  const sorted = [...tiers].sort((a, b) => b.desdeClp - a.desdeClp);
  for (const tier of sorted) {
    if (subtotalNetoClp >= tier.desdeClp) {
      if (tier.hastaClp == null || subtotalNetoClp <= tier.hastaClp) {
        return tier.descuentoPct;
      }
    }
  }
  return 0;
}

/**
 * Calcula cotización y márgenes de un pedido al por mayor.
 */
export function calculateWholesaleOrder(
  items: WholesaleOrderLineInput[],
  catalog: readonly WholesaleProductItem[] = WHOLESALE_PRODUCTS_2025_2026,
  options?: WholesaleOrderCalculationOptions,
): WholesaleQuoteResult {
  const productMap = new Map<string, WholesaleProductItem>(catalog.map((p) => [p.id, p]));
  const rules = {
    ...WHOLESALE_COMMERCIAL_RULES,
    ...(options?.rules ?? {}),
  };
  const tiers = options?.investmentTiers ?? WHOLESALE_INVESTMENT_TIERS;

  let subtotalNetoBase = 0;
  let totalFrascos = 0;
  let totalSachets = 0;
  let totalUnidades = 0;
  let totalPvpEstimado = 0;

  // Primer pase: acumular subtotales netos base
  const tempLines: Array<{
    product: WholesaleProductItem;
    quantity: number;
    subtotalNetoBase: number;
    subtotalPvp: number;
  }> = [];

  for (const item of items) {
    if (item.quantity <= 0) continue;
    const product = productMap.get(item.productId);
    if (!product) continue;

    const lineNetoBase = product.precioNetoBaseClp * item.quantity;
    const linePvp = product.pvpRecomendadoClp * item.quantity;

    subtotalNetoBase += lineNetoBase;
    totalPvpEstimado += linePvp;
    totalUnidades += item.quantity;

    if (product.categoria === 'sachet') {
      totalSachets += item.quantity;
    } else {
      totalFrascos += item.quantity;
    }

    tempLines.push({
      product,
      quantity: item.quantity,
      subtotalNetoBase: lineNetoBase,
      subtotalPvp: linePvp,
    });
  }

  const descuentoPct = resolveInvestmentDiscountPct(subtotalNetoBase, tiers);
  const factorMultiplicador = 1 - descuentoPct;
  const descuentoInversionClp = Math.round(subtotalNetoBase * descuentoPct);
  const subtotalNetoFinalClp = subtotalNetoBase - descuentoInversionClp;

  const lines: WholesaleCalculatedLine[] = tempLines.map((entry) => {
    const unitarioFinal = Math.round(entry.product.precioNetoBaseClp * factorMultiplicador);
    const lineNetoFinal = unitarioFinal * entry.quantity;
    const margenBruto = entry.subtotalPvp - lineNetoFinal;
    const margenPct = entry.subtotalPvp > 0 ? (margenBruto / entry.subtotalPvp) * 100 : 0;

    return {
      productId: entry.product.id,
      nombre: entry.product.nombre,
      categoria: entry.product.categoria,
      formato: entry.product.formato,
      quantity: entry.quantity,
      pvpUnitarioClp: entry.product.pvpRecomendadoClp,
      precioNetoBaseUnitarioClp: entry.product.precioNetoBaseClp,
      precioNetoFinalUnitarioClp: unitarioFinal,
      subtotalNetoBaseClp: entry.subtotalNetoBase,
      subtotalNetoFinalClp: lineNetoFinal,
      subtotalPvpEstimadoClp: entry.subtotalPvp,
      margenBrutoEstimadoClp: margenBruto,
      margenPctSobrePvp: Math.round(margenPct * 10) / 10,
    };
  });

  const cumpleMoqFrascos = totalFrascos >= rules.moqFrascosMixtos;
  const cumpleMoqSachets = totalSachets >= rules.moqSachets;
  const cumpleMoqGeneral = cumpleMoqFrascos || cumpleMoqSachets;

  const despachoGratisRm = subtotalNetoFinalClp >= rules.umbralDespachoGratisRmNetoClp;
  const montoFaltanteDespachoGratisClp = despachoGratisRm
    ? 0
    : rules.umbralDespachoGratisRmNetoClp - subtotalNetoFinalClp;

  const iva19PctClp = Math.round(subtotalNetoFinalClp * rules.tasaIvaChile);
  const totalFacturableIvaIncluidoClp = subtotalNetoFinalClp + iva19PctClp;

  const margenComercialRevendedorClp = totalPvpEstimado - totalFacturableIvaIncluidoClp;
  const margenComercialRevendedorPct = totalPvpEstimado > 0
    ? Math.round(((totalPvpEstimado - subtotalNetoFinalClp) / totalPvpEstimado) * 1000) / 10
    : 0;

  const sortedAsc = [...tiers].sort((a, b) => a.desdeClp - b.desdeClp);
  const nextTier = sortedAsc.find((t) => t.desdeClp > subtotalNetoBase && t.descuentoPct > descuentoPct);
  let proximoTramoDescuento: WholesaleQuoteResult['proximoTramoDescuento'] = null;
  if (nextTier) {
    proximoTramoDescuento = {
      metaClp: nextTier.desdeClp,
      pct: Math.round(nextTier.descuentoPct * 100),
      faltanteClp: nextTier.desdeClp - subtotalNetoBase,
    };
  }

  return {
    lines,
    totalUnidadesFrascos: totalFrascos,
    totalUnidadesSachets: totalSachets,
    totalUnidades,
    cumpleMoqFrascos,
    cumpleMoqSachets,
    cumpleMoqGeneral,
    subtotalNetoBaseClp: subtotalNetoBase,
    descuentoInversionPct: descuentoPct,
    descuentoInversionClp,
    subtotalNetoFinalClp,
    despachoGratisRm,
    montoFaltanteDespachoGratisClp,
    iva19PctClp,
    totalFacturableIvaIncluidoClp,
    totalPvpEstimadoClp: totalPvpEstimado,
    margenComercialRevendedorClp,
    margenComercialRevendedorPct,
    proximoTramoDescuento,
  };
}

export interface WholesaleAgreementData {
  razonSocial?: string;
  rut?: string;
  direccion?: string;
  contactoNombre?: string;
  fecha?: string;
  /** Catálogo/reglas vigentes del CMS; ausentes = boceto base del package. */
  products?: readonly WholesaleProductItem[];
  rules?: WholesaleCommercialRules;
  investmentTiers?: readonly WholesaleInvestmentTier[];
}

/**
 * Genera el texto oficial de las Condiciones Comerciales listo para firma o envío en formato Markdown.
 */
export function generateWholesaleAgreementMarkdown(data: WholesaleAgreementData = {}): string {
  const clienteNombre = data.razonSocial?.trim() || '____________________________________________';
  const clienteRut = data.rut?.trim() || '__________________';
  const clienteDireccion = data.direccion?.trim() || '____________________________________________';
  const fechaDoc = data.fecha?.trim() || '____ / ____ / 2025';

  const products = data.products && data.products.length > 0 ? data.products : WHOLESALE_PRODUCTS_2025_2026;
  const rules = data.rules ?? WHOLESALE_COMMERCIAL_RULES;
  const tiers = data.investmentTiers && data.investmentTiers.length > 0
    ? data.investmentTiers
    : WHOLESALE_INVESTMENT_TIERS;

  const precioTabla = products
    .map((p) => {
      const col = (text: string, width: number) => text.slice(0, width).padEnd(width, ' ');
      return `│ ${col(p.nombre, 45)} │ ${col(p.formato, 7)} │ ${col(`$${p.pvpRecomendadoClp.toLocaleString('es-CL')}`, 15)} │ ${col(`$${p.precioNetoBaseClp.toLocaleString('es-CL')}`, 16)} │ ${col(`${p.minimoCompraUnidades} uds`, 7)} │`;
    })
    .join('\n');

  const tramos = tiers
    .map((t) => {
      const desde = t.desdeClp.toLocaleString('es-CL');
      const hasta = t.hastaClp != null ? `$${t.hastaClp.toLocaleString('es-CL')}` : 'más';
      return `• ${t.desdeClp === 0 ? `Menos de $${(t.hastaClp ?? 0).toLocaleString('es-CL')}` : `$${desde} – ${hasta}`} → ${Math.round(t.descuentoPct * 100)} %`;
    })
    .join('\n');

  return `CONDICIONES COMERCIALES – REVENDEDOR AUTORIZADO CHILE (2025-2026)
Obrera y Zangano – Miel de autor │ obrerayzangano.cl │ @obrerayzangano

Cliente / Razón Social: ${clienteNombre}
RUT: ${clienteRut}
Dirección punto de venta: ${clienteDireccion}

(Se reserva el derecho de aprobación previa del punto de venta por Obrera y Zangano para garantizar coherencia con la imagen premium de la marca. Evaluación mediante visita o fotografías. Comunicación en máx. 48 hrs.)

PEDIDO MÍNIMO INICIAL (MOQ)
${rules.moqFrascosMixtos} unidades mixtas (frascos medianos / mayores) o ${rules.moqSachets} unidades (sachets).

TABLA DE PRECIOS NETOS 2025-2026 (sin IVA – franco bodega Santiago)
│ Producto                                       │ Formato │ PVP Recomendado │ Precio Neto Base │ Mínimo  │
${precioTabla}

DESCUENTOS POR VOLUMEN DE INVERSIÓN NETA
${tramos}

CONDICIONES DE PAGO
• Primer pedido: 100 % anticipado o 50 % anticipo + 50 % contra entrega.
• Pedidos posteriores (sujeto a evaluación crediticia): 30 días fecha factura.

ENTREGA Y TRANSPORTE
• Región Metropolitana: Gratuito desde $${rules.umbralDespachoGratisRmNetoClp.toLocaleString('es-CL')} netos.
• Pedidos inferiores RM: flete según comuna y peso. Regiones: flete por pagar.

COMPROMISOS Y RESPONSABILIDADES ESENCIALES
1. Almacenamiento y conservación: Temperatura entre ${rules.temperaturaMinimaCelsius} y ${rules.temperaturaMaximaCelsius} °C, humedad < ${rules.humedadMaximaPct} %, lugar seco, oscuro y libre de olores fuertes para preservar las propiedades biológicas.
2. Inspección y reclamos: Inspección en ${rules.diasHabilesInspeccion} días hábiles desde recepción. Reclamos escritos con respaldo fotográfico en máx. ${rules.diasMaximoReclamo} días.
3. Devoluciones y garantías: Válidas únicamente por defecto de fabricación comprobado (frasco original con ≥ ${rules.porcentajeContenidoMinimoDevolucion} % de contenido) notificadas dentro de ${rules.diasGarantiaDevolucion} días.
4. Limitación de responsabilidad: Limitada al valor neto del producto afectado. Sin indemnización por daño indirecto ni lucro cesante.
5. Protección de marca: Respetar PVP sugeridos; prohibida venta en marketplaces masivos (Mercado Libre, Falabella, etc.) sin autorización escrita expresa.
6. Material POP: Exhibidores y material gráfico oficial provisto gratuitamente a partir del 2° pedido.

VALIDEZ: 12 meses desde la firma o primer pedido.

Acepto íntegramente las condiciones expuestas:
Fecha: ${fechaDoc}
Firma Revendedor: ______________________________  RUT: ${clienteRut}

Obrera y Zangano EIRL                           ______________________________ (Sello)
Contacto: ${rules.contactoTelefono} │ ${rules.contactoEmail}
`;
}
