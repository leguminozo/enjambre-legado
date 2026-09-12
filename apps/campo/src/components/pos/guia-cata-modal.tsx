'use client';

import { useState, useMemo, useEffect } from 'react';
import { type ProductoLocal } from '@/lib/offline/db';
import { supabase } from '@/lib/supabase';
import { getTiendaOrigin } from '@/lib/public-urls';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Sparkles,
  Compass,
  UtensilsCrossed,
  ShieldCheck,
  ChevronDown,
  HelpCircle,
  Award,
  Info,
  Printer,
  Clock,
  LayoutTemplate,
  CheckCircle2,
} from 'lucide-react';
import { formatCLP } from '@enjambre/ui';

export interface GuiaCataModalProps {
  producto: ProductoLocal | null;
  isOpen: boolean;
  onClose: () => void;
}

interface PerfilSensorialData {
  pitch: string;
  variedad: string;
  dimensiones: Array<{ label: string; izq: string; der: string; pct: number }>;
  notasAromaticas: string[];
  maridajes: Array<{ titulo: string; detalle: string }>;
  objeciones: Array<{ pregunta: string; respuesta: string }>;
  humedad: string;
  extraccion: string;
  momento_consumo?: string;
}

function resolverPerfilSensorial(p: ProductoLocal): PerfilSensorialData {
  // Si el administrador configuró un perfil sensorial canónico en Núcleo, priorizarlo
  const ps = p.perfil_sensorial;
  if (ps) {
    const dimensiones = [
      {
        label: 'Intensidad en Paladar',
        izq: ps.descriptores_intensidad?.izq ?? 'Suave & Floral',
        der: ps.descriptores_intensidad?.der ?? 'Robusto & Boscoso',
        pct: ps.intensidad ?? 75,
      },
      {
        label: 'Balance Dulzor / Acidez',
        izq: ps.descriptores_dulzor?.izq ?? 'Dulzor Cálido',
        der: ps.descriptores_dulzor?.der ?? 'Acidez Silvestre',
        pct: ps.dulzor_acidez ?? 60,
      },
      {
        label: 'Textura & Cristalización',
        izq: ps.descriptores_textura?.izq ?? 'Líquida / Sedosa',
        der: ps.descriptores_textura?.der ?? 'Cremosa / Untable',
        pct: ps.textura ?? 85,
      },
    ];

    const notasAromaticas =
      ps.notas_aromaticas && ps.notas_aromaticas.length > 0
        ? ps.notas_aromaticas
        : ['Flor de Ulmo', 'Corteza de Tiaca', 'Avellana Tostada', 'Caramelo Crudo'];

    const maridajes =
      ps.maridajes && ps.maridajes.length > 0
        ? ps.maridajes
        : [
            { titulo: 'Quesos Maduros y Azules', detalle: 'Contraste salino intenso que resalta azúcares vivos.' },
            { titulo: 'Charcutería y Jabalí Ahumado', detalle: 'Armoniza con carnes curadas de la Patagonia.' },
          ];

    const pitch =
      p.descripcion_corta ||
      p.descripcion_regenerativa ||
      'Miel recolectada en los fiordos de Chiloé por abejas vírgenes sin trashumancia forzada. Cruda, centrifugada en frío y biológicamente activa.';

    const variedad =
      p.lote?.variedad_floral ||
      p.origen_apicola ||
      'Bosque Templado Lluvioso de Chiloé';

    const humedad = p.lote?.analisis_humedad
      ? `${p.lote.analisis_humedad}%`
      : '< 18% (Maduración Natural)';
    const extraccion = p.lote?.metodo_extraccion ?? 'Centrifugado en frío sin pasteurizar';

    const objeciones = [
      {
        pregunta: '¿Por qué la miel se cristaliza o espesa?',
        respuesta:
          'La cristalización natural es la garantía biológica de pureza: confirma que la miel está viva, cruda y nunca pasteurizada a altas temperaturas. Si el cliente prefiere textura fluida, basta templar el frasco a baño María a menos de 40°C para no degradar las enzimas activas.',
      },
      {
        pregunta: '¿Por qué su valor es superior al de las mieles comerciales?',
        respuesta:
          'No es miel homogeneizada de mezcla industrial. Proviene de apiarios fijos en los fiordos y bosque virgen de Chiloé, madurada en colmena por abejas vírgenes sin trashumancia forzada, con análisis palinológico certificado y trazabilidad socioambiental directa.',
      },
      {
        pregunta: '¿Cómo debe conservarse en el hogar?',
        respuesta:
          'Conservar en un lugar fresco, seco y al resguardo de la luz solar directa, idealmente entre 15°C y 25°C. No requiere refrigeración; el frío acelera la cristalización compacta.',
      },
    ];

    return {
      pitch,
      variedad,
      dimensiones,
      notasAromaticas,
      maridajes,
      objeciones,
      humedad,
      extraccion,
      momento_consumo: ps.momento_consumo,
    };
  }

  const nombre = (p.nombre ?? '').toLowerCase();
  const variedadLote = p.lote?.variedad_floral;
  const origenApicola = p.origen_apicola;

  // 1. Detección de variedad botánica o tipo de producto
  const isCacao = nombre.includes('cacao') || nombre.includes('chocolate');
  const isAvellana = nombre.includes('avellana');
  const isCafe = nombre.includes('café') || nombre.includes('cafe');
  const isPolen = nombre.includes('polen');
  const isTiaca = nombre.includes('tiaca') || (variedadLote ?? '').toLowerCase().includes('tiaca');
  const isUlmo =
    nombre.includes('ulmo') ||
    (variedadLote ?? '').toLowerCase().includes('ulmo') ||
    nombre.includes('virgen');
  const isPropolio = nombre.includes('propóleo') || nombre.includes('propoleo');

  // Variedad label
  let variedad =
    variedadLote ||
    origenApicola ||
    (isCacao
      ? 'Miel Virgen con Cacao Criollo 70%'
      : isAvellana
      ? 'Miel Virgen con Avellana Chilena Tostada'
      : isCafe
      ? 'Miel Virgen con Café de Especialidad'
      : isPolen
      ? 'Miel Virgen con Polen Multifloral Crudo'
      : isTiaca
      ? 'Tiaca de Bosque Templado Lluvioso'
      : isUlmo
      ? 'Ulmo Monofloral de Chiloé (Eucryphia cordifolia)'
      : isPropolio
      ? 'Extracto de Propóleo Puro de Bosque Nativo'
      : 'Bosque Templado Lluvioso de Chiloé');

  // Pitch de 2 frases
  let pitch =
    p.descripcion_corta ||
    p.descripcion_regenerativa ||
    (isCacao
      ? 'Miel cruda de bosque nativo batida mecánicamente en frío con nibs de cacao criollo 70%. Textura cremosa con toque crujiente, sin azúcares refinadas ni lácteos añadidos.'
      : isAvellana
      ? 'Emulsión artesanal en frío de miel virgen de Chiloé y avellana silvestre (Gevuina avellana) tostada a leña. Praliné untable 100% natural sin aceites vegetales.'
      : isCafe
      ? 'Fusión organoléptica de miel virgen cruda y micro-lotes de café arábica de especialidad con tueste medio. Energía limpia y notas tostadas intensas.'
      : isPolen
      ? 'Superalimento bioactivo de alta densidad nutricional: miel virgen cruda infusionada con polen multifloral fresco secado en frío para preservar fermentos vivos.'
      : isTiaca
      ? 'Recolección de principios de verano de flor de tiaca. Color ámbar claro, notas cítricas balsámicas y una acidez silvestre sutil que limpia el paladar.'
      : isUlmo
      ? 'Miel monofloral emblemática de los fiordos de Chiloé. Aroma a flor blanca y vainilla silvestre con una textura cremosa natural insuperable.'
      : 'Miel de bosque nativo madurada en colmena en los fiordos de Chiloé por abejas vírgenes sin trashumancia forzada. Cruda, centrifugada en frío y biológicamente activa.');

  // Dimensiones organolépticas calibradas
  let dimensiones = [
    { label: 'Intensidad en Paladar', izq: 'Suave & Floral', der: 'Robusto & Boscoso', pct: 75 },
    { label: 'Balance Dulzor / Acidez', izq: 'Dulzor Cálido', der: 'Acidez Silvestre', pct: 60 },
    { label: 'Textura & Cristalización', izq: 'Líquida / Sedosa', der: 'Cremosa / Untable', pct: 85 },
  ];

  let notasAromaticas = [
    'Flor de Ulmo',
    'Corteza de Tiaca',
    'Caramelo Crudo',
    'Avellana Tostada',
    'Resina Balsámica',
  ];

  let maridajes = [
    {
      titulo: 'Quesos Maduros y Azules',
      detalle: 'Contraste salino intenso que resalta los azúcares vivos y notas de bosque.',
    },
    {
      titulo: 'Charcutería y Jabalí Ahumado',
      detalle: 'Armoniza con carnes curadas de la Patagonia y patés artesanales.',
    },
    {
      titulo: 'Infusiones Nativas (Maqui / Menta)',
      detalle: 'Endulzante crudo que aporta cuerpo sin enmascarar los taninos silvestres.',
    },
    {
      titulo: 'Café de Especialidad y Masa Madre',
      detalle: 'Textura untable que sustituye azúcares procesados en desayunos de alta gama.',
    },
  ];

  let objecionesEspecificas = [
    {
      pregunta: '¿Por qué la miel se cristaliza o espesa?',
      respuesta:
        'La cristalización natural es la garantía biológica de pureza: confirma que la miel está viva, cruda y nunca pasteurizada a altas temperaturas. Si el cliente prefiere textura fluida, basta templar el frasco a baño María a menos de 40°C para no degradar las enzimas activas.',
    },
    {
      pregunta: '¿Por qué su valor es superior al de las mieles comerciales?',
      respuesta:
        'No es miel homogeneizada de mezcla industrial. Proviene de apiarios fijos en los fiordos y bosque virgen de Chiloé, madurada en colmena y recolectada respetando el ritmo de las abejas vírgenes sin trashumancia forzada, con análisis palinológico certificado y trazabilidad socioambiental directa.',
    },
    {
      pregunta: '¿Cómo debe conservarse en el hogar?',
      respuesta:
        'Conservar en un lugar fresco, seco y al resguardo de la luz solar directa, idealmente entre 15°C y 25°C. No requiere refrigeración; el frío acelera la cristalización compacta.',
    },
  ];

  if (isCacao) {
    dimensiones = [
      { label: 'Intensidad en Paladar', izq: 'Dulzor Suave', der: 'Robusto Cacao Criollo', pct: 85 },
      { label: 'Balance Dulzor / Amargor', izq: 'Miel Predominante', der: 'Cacao Amargo 70%', pct: 60 },
      { label: 'Textura & Masticabilidad', izq: 'Cremosa Sedosa', der: 'Crunch de Nibs Tostados', pct: 75 },
    ];
    notasAromaticas = ['Cacao Criollo', 'Nibs Tostados', 'Caramelo Rústico', 'Roble Tostado', 'Miel Cruda'];
    maridajes = [
      { titulo: 'Café Filtrado / Espresso', detalle: 'Realza las notas tostadas del grano de especialidad.' },
      { titulo: 'Frutas Rojas & Frambuesas', detalle: 'Equilibra el amargor del cacao con acidez frutal fresca.' },
      { titulo: 'Tostadas de Centeno o Avena', detalle: 'Reemplazo de lujo y sin lácteos para cremas untables industriales.' },
      { titulo: 'Quesos Crema & Ricotta', detalle: 'Postre inmediato combinando suavidad láctea y textura crujiente.' },
    ];
    objecionesEspecificas = [
      {
        pregunta: '¿Tiene azúcar refinada añadida o aceite de palma?',
        respuesta:
          'Cero azúcar procesada, cero aceite de palma ni saborizantes artificiales. Solo dos ingredientes nobles: miel virgen cruda de Chiloé batida en frío con nibs de cacao puro tostado.',
      },
      ...objecionesEspecificas.slice(1),
    ];
  } else if (isAvellana) {
    dimensiones = [
      { label: 'Intensidad en Paladar', izq: 'Floral Delicado', der: 'Avellana Tostada Intensa', pct: 80 },
      { label: 'Balance Dulzor / Tostado', izq: 'Miel Dulce', der: 'Praliné Amaderado', pct: 65 },
      { label: 'Textura & Untabilidad', izq: 'Fluida', der: 'Pasta Densa Mantecosa', pct: 95 },
    ];
    notasAromaticas = ['Avellana Silvestre (Gevuina)', 'Praliné Tostado', 'Madera Cálida', 'Caramelo', 'Mantequilla'];
    maridajes = [
      { titulo: 'Yogur Griego & Granola', detalle: 'Aporta crocancia aromática y grasas saludables naturales.' },
      { titulo: 'Panqueques & Waffles de Avena', detalle: 'Sustituto puro de manjar o cremas industriales de avellana.' },
      { titulo: 'Plátano & Manzanas Asadas', detalle: 'Armonía perfecta entre la dulzura de la fruta y el tostado seco.' },
      { titulo: 'Cuchara Directa (Pre-entreno)', detalle: 'Aporte de carbohidratos vivos y lípidos de alta asimilación.' },
    ];
    objecionesEspecificas = [
      {
        pregunta: '¿Es similar a las cremas de avellana de supermercado?',
        respuesta:
          'Es lo opuesto: las comerciales son 50% azúcar refinada y aceites hidrogenados con mínimo porcentaje de avellana. Aquí hay 100% avellana chilena nativa molida en frío con pura miel virgen, sin ningún químico ni diluyente.',
      },
      ...objecionesEspecificas.slice(1),
    ];
  } else if (isCafe) {
    dimensiones = [
      { label: 'Intensidad en Paladar', izq: 'Dulzor Suave', der: 'Tueste & Cafeína Viva', pct: 90 },
      { label: 'Balance Dulzor / Amargor', izq: 'Miel Floral', der: 'Café Arábica Profundo', pct: 55 },
      { label: 'Textura & Cristalización', izq: 'Líquida', der: 'Cremosa Microgranulada', pct: 85 },
    ];
    notasAromaticas = ['Café de Especialidad', 'Tueste Medio', 'Cacao Amargo', 'Especias Cálidas', 'Melaza'];
    maridajes = [
      { titulo: 'Tostadas de Masa Madre con Ricotta', detalle: 'Energía matinal sostenida y contraste de texturas.' },
      { titulo: 'Helados Artesanales de Vainilla', detalle: 'Topping tibio estilo afogatto biocultural.' },
      { titulo: 'Bebidas de Avena o Almendra', detalle: 'Se disuelve instantáneamente creando un latte vegetal natural.' },
      { titulo: 'Chocolate Negro > 80%', detalle: 'Maridaje de intensidades para amantes de perfiles amargos nobles.' },
    ];
  } else if (isTiaca) {
    dimensiones = [
      { label: 'Intensidad en Paladar', izq: 'Floral Delicado', der: 'Robusto Amaderado', pct: 55 },
      { label: 'Balance Dulzor / Acidez', izq: 'Dulzor Pleno', der: 'Acidez Cítrica Silvestre', pct: 40 },
      { label: 'Textura & Cristalización', izq: 'Líquida Sedosa', der: 'Cremosa Densa', pct: 45 },
    ];
    notasAromaticas = ['Flor de Tiaca', 'Notas Cítricas Frescas', 'Té Blanco', 'Balsámico Suave', 'Miel Clara'];
    maridajes = [
      { titulo: 'Salmón Ahumado & Pescados Grasos', detalle: 'Su acidez cítrica limpia la grasa y realza el humo nativo.' },
      { titulo: 'Quesos Frescos de Cabra', detalle: 'Maridaje sutil que respeta la delicadeza láctea.' },
      { titulo: 'Vinagretas Gourmet', detalle: 'Emulsiona perfecto con aceite de oliva extra virgen y mostazas.' },
      { titulo: 'Tés Verdes & Infusiones Florales', detalle: 'No opaca el perfil herbal sutil de las hojas de té.' },
    ];
  } else if (isUlmo) {
    dimensiones = [
      { label: 'Intensidad en Paladar', izq: 'Floral Ligero', der: 'Bouquet Denso & Vainilla', pct: 85 },
      { label: 'Balance Dulzor / Acidez', izq: 'Dulzor Cálido Balsámico', der: 'Acidez', pct: 70 },
      { label: 'Textura & Cristalización', izq: 'Líquida', der: 'Cremosa Mantecosa Untable', pct: 90 },
    ];
    notasAromaticas = ['Flor de Ulmo', 'Vainilla Silvestre', 'Jazmín de Bosque', 'Caramelo Crudo', 'Madera Húmeda'];
    maridajes = [
      { titulo: 'Quesos Azules & Roquefort', detalle: 'El maridaje rey: dulzor floral que doma la fuerza del hongo Penicillium.' },
      { titulo: 'Charcutería y Jabalí Ahumado', detalle: 'Glaseado en caliente o acompañamiento directo para carnes de caza.' },
      { titulo: 'Hojas de Maqui & Melisa', detalle: 'Infusión reconfortante nocturna con propiedades bioactivas.' },
      { titulo: 'Pan de Centeno o Brioche Tibio', detalle: 'Se funde como mantequilla floral aromática.' },
    ];
  }

  const humedad = p.lote?.analisis_humedad
    ? `${p.lote.analisis_humedad}%`
    : '< 18% (Maduración Natural)';
  const extraccion = p.lote?.metodo_extraccion ?? 'Centrifugado en frío sin pasteurizar';

  const momentoConsumo = isCacao
    ? 'Sobremesa, merienda energética o maridaje con café de especialidad'
    : isTiaca
    ? 'Mañanas luminosas, tablas de quesos frescos y desayunos reconstituyentes'
    : isAvellana
    ? 'Desayunos lentos de invierno y meriendas reconfortantes'
    : isCafe
    ? 'Inicio de jornada y foco matutino'
    : 'Desayunos de alta gama, tablas de quesos patagónicos y rituales de bienestar';

  return {
    pitch,
    variedad,
    dimensiones,
    notasAromaticas,
    maridajes,
    objeciones: objecionesEspecificas,
    humedad,
    extraccion,
    momento_consumo: momentoConsumo,
  };
}

const logEscuelaVenta = async (
  productoId: string,
  productoNombre: string,
  accion: 'apertura_guia_cata' | 'consulta_objecion' | 'modo_atril',
  detalle?: Record<string, unknown>,
) => {
  try {
    const { data } = await supabase.auth.getUser();
    await (supabase as unknown as {
      from: (t: string) => {
        insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>;
      };
    })
      .from('rep_ventas_capacitacion_logs')
      .insert({
        producto_id: productoId,
        producto_nombre: productoNombre,
        user_id: data?.user?.id ?? null,
        accion,
        detalle: detalle ?? {},
      });
  } catch {
    // Fail-silent para no interrumpir al vendedor en terreno ni requerir red
  }
};

export function GuiaCataModal({ producto, isOpen, onClose }: GuiaCataModalProps) {
  const [openObjecion, setOpenObjecion] = useState<number | null>(null);
  const [modoAtril, setModoAtril] = useState(false);

  const perfil = useMemo(() => {
    if (!producto) return null;
    return resolverPerfilSensorial(producto);
  }, [producto]);

  useEffect(() => {
    if (isOpen && producto) {
      void logEscuelaVenta(producto.id, producto.nombre ?? 'Producto', 'apertura_guia_cata');
    }
  }, [isOpen, producto]);

  if (!isOpen || !producto || !perfil) return null;

  const toggleObjecion = (index: number) => {
    setOpenObjecion((prev) => {
      const next = prev === index ? null : index;
      if (next !== null && perfil.objeciones[next]) {
        void logEscuelaVenta(producto.id, producto.nombre ?? 'Producto', 'consulta_objecion', {
          pregunta: perfil.objeciones[next].pregunta,
        });
      }
      return next;
    });
  };

  const tiendaBaseUrl = typeof window !== 'undefined' ? getTiendaOrigin() : 'https://obrerayzangano.cl';
  const qrUrl = `${tiendaBaseUrl}/producto/${producto.slug || producto.id}`;

  const handlePrintAtril = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Estilos específicos de impresión para el tarjetón de atril */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #ficha-atril-campo,
          #ficha-atril-campo * {
            visibility: visible !important;
          }
          #ficha-atril-campo {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 148mm !important;
            max-width: 148mm !important;
            min-height: 210mm !important;
            margin: 0 !important;
            padding: 24px !important;
            background: #ffffff !important;
            color: #1a1a1a !important;
            border: 1.5px solid #222222 !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
          }
          .campo-print-hidden {
            display: none !important;
          }
          .campo-print-text-dark {
            color: #111111 !important;
          }
          .campo-print-bg-light {
            background-color: #f7f7f7 !important;
          }
          .campo-print-bar-fill {
            background-color: #111111 !important;
          }
        }
      `}</style>

      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado Fijo */}
        <div className="flex items-start justify-between p-5 border-b border-border bg-surface-raised/60 shrink-0 campo-print-hidden">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                <Sparkles className="w-3 h-3" /> Escuela de Venta & Cata
              </span>
              {producto.formato && (
                <span className="text-[10px] uppercase font-semibold text-muted-foreground bg-surface-sunken px-2 py-0.5 rounded">
                  {producto.formato}
                </span>
              )}
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground leading-tight">
              {producto.nombre ?? 'Producto'}
            </h2>
            {producto.precio != null && (
              <p className="text-sm font-mono font-bold text-primary">
                {formatCLP(producto.precio)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !modoAtril;
                setModoAtril(next);
                if (next) {
                  void logEscuelaVenta(producto.id, producto.nombre ?? 'Producto', 'modo_atril');
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-surface-raised hover:bg-surface-sunken text-xs font-medium text-foreground transition-colors"
              title="Modo Tarjetón de Mostrador / Atril"
            >
              <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">{modoAtril ? 'Ver Guía' : 'Ficha Atril'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-sunken transition-colors"
              aria-label="Cerrar guía de venta"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {modoAtril ? (
          /* Tarjetón de Mostrador / Modo Atril */
          <div className="p-6 overflow-y-auto bg-surface-sunken/40 flex flex-col items-center">
            <div className="w-full max-w-[460px] flex justify-end mb-3 campo-print-hidden">
              <button
                onClick={handlePrintAtril}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-raised hover:bg-surface-sunken text-xs font-semibold text-foreground transition-colors"
              >
                <Printer className="w-4 h-4 text-primary" />
                <span>Imprimir Tarjetón</span>
              </button>
            </div>
            <div
              id="ficha-atril-campo"
              className="w-full max-w-[460px] bg-card border border-border/80 rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-lg campo-print-text-dark"
            >
              {/* Header */}
              <div className="text-center pb-4 border-b border-border/60">
                <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-primary block mb-1">
                  ENJAMBRE LEGADO · CHILOÉ
                </span>
                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground campo-print-text-dark">
                  {producto.nombre}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-1.5 text-xs text-muted-foreground campo-print-text-dark">
                  {producto.origen_apicola && <span>{producto.origen_apicola}</span>}
                  {producto.origen_apicola && producto.formato && <span>·</span>}
                  {producto.formato && <span>{producto.formato}</span>}
                </div>
              </div>

              {/* Curvas Sensoriales */}
              <div className="py-4 space-y-3 border-b border-border/60">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Perfil Sensorial en Paladar</span>
                </div>
                {perfil.dimensiones.map((dim, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[11px] text-muted-foreground campo-print-text-dark mb-1">
                      <span>{dim.izq}</span>
                      <span className="font-semibold text-foreground campo-print-text-dark">
                        {dim.label} {dim.pct}%
                      </span>
                      <span>{dim.der}</span>
                    </div>
                    <div className="w-full h-2 bg-surface-sunken campo-print-bg-light rounded-full overflow-hidden border border-border/40">
                      <div
                        className="h-full bg-primary campo-print-bar-fill rounded-full"
                        style={{ width: `${dim.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Notas Olfativas */}
              {perfil.notasAromaticas && perfil.notasAromaticas.length > 0 && (
                <div className="py-3 border-b border-border/60">
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-muted-foreground campo-print-text-dark block mb-1.5">
                    Notas Olfativas & Aromas
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {perfil.notasAromaticas.map((nota, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs font-medium rounded-md bg-surface-raised campo-print-bg-light border border-border text-foreground campo-print-text-dark"
                      >
                        {nota}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Maridajes */}
              {perfil.maridajes && perfil.maridajes.length > 0 && (
                <div className="py-3 border-b border-border/60">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Maridajes Gastronómicos</span>
                  </div>
                  <ul className="space-y-1 text-xs text-foreground campo-print-text-dark">
                    {perfil.maridajes.slice(0, 3).map((m, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-primary font-bold">·</span>
                        <div>
                          <strong className="font-medium">{m.titulo}</strong>
                          {m.detalle && <span className="text-muted-foreground campo-print-text-dark"> — {m.detalle}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Momento */}
              {perfil.momento_consumo && (
                <div className="py-2.5 border-b border-border/60 text-xs text-muted-foreground campo-print-text-dark flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{perfil.momento_consumo}</span>
                </div>
              )}

              {/* Pie con QR */}
              <div className="pt-3 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-primary block">
                    Trazabilidad & Compra Digital
                  </span>
                  <p className="text-[11px] text-muted-foreground campo-print-text-dark max-w-[220px] leading-tight">
                    Escanea para verificar el origen y pureza biológica de este lote.
                  </p>
                </div>
                <div className="shrink-0 p-1 bg-background campo-print-bg-light border border-border rounded-lg">
                  <QRCodeSVG value={qrUrl} size={80} level="M" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Contenido Scrolleable Estándar */
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-foreground">
            {/* Pitch de Venta de 2 Frases */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Award className="w-4 h-4" /> El Pitch de Venta (2 Frases Clave)
              </div>
              <p className="font-display text-base sm:text-lg italic text-foreground leading-relaxed">
                «{perfil.pitch}»
              </p>
              <p className="text-[11px] text-muted-foreground">
                Tip sommelier: Transmite la pureza cruda y el origen sin trashumancia antes de mencionar el precio.
              </p>
            </div>

            {/* Perfil Sensorial */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Compass className="w-4 h-4 text-primary" /> Perfil Sensorial Organoléptico
                </h3>
                <span className="text-[10px] text-muted-foreground">Calibración en cata</span>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-surface-raised/50 border border-border">
                {perfil.dimensiones.map((dim, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{dim.izq}</span>
                      <span className="font-bold text-foreground">
                        {dim.label} ({dim.pct}%)
                      </span>
                      <span className="text-muted-foreground">{dim.der}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-sunken overflow-hidden border border-border/40">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${dim.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Notas Aromáticas */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Notas Aromáticas Destacadas
                </span>
                <div className="flex flex-wrap gap-2">
                  {perfil.notasAromaticas.map((nota, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-surface-raised border border-border text-foreground shadow-sm"
                    >
                      {nota}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Maridajes Recomendados */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-primary" /> Maridaje Top & Venta Cruzada
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {perfil.maridajes.map((m, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-surface-raised/40 border border-border/80 space-y-1 hover:border-primary/40 transition-colors"
                  >
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {m.titulo}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {m.detalle}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ficha Técnica y Origen de Lote */}
            <div className="p-4 rounded-xl bg-surface-raised/30 border border-border space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" /> Ficha Técnica & Pureza de Lote
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Variedad Floral</span>
                  <strong className="text-foreground font-semibold">{perfil.variedad}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Humedad Certificada</span>
                  <strong className="text-foreground font-semibold">{perfil.humedad}</strong>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-muted-foreground block text-[10px] uppercase">Extracción</span>
                  <strong className="text-foreground font-semibold">{perfil.extraccion}</strong>
                </div>
              </div>
            </div>

            {/* Manejo de Objeciones en Vivo */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" /> Respuestas a Preguntas del Cliente
                </h3>
                <span className="text-[10px] text-muted-foreground">Toca para abrir argumento</span>
              </div>
              <div className="space-y-2">
                {perfil.objeciones.map((obj, i) => {
                  const isObjOpen = openObjecion === i;
                  return (
                    <div
                      key={i}
                      className="rounded-lg border border-border overflow-hidden bg-surface-raised/50"
                    >
                      <button
                        onClick={() => toggleObjecion(i)}
                        className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-semibold text-foreground hover:bg-surface-raised transition-colors"
                      >
                        <span>«{obj.pregunta}»</span>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
                            isObjOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isObjOpen && (
                        <div className="p-3.5 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/30 bg-surface-sunken">
                          <p>{obj.respuesta}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Advertencia Legal de Autonomía */}
            <div className="p-3 rounded-lg bg-surface-sunken border border-border/40 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-tight">
                <strong>Herramienta consultiva voluntaria:</strong> Este argumentario y notas organolépticas constituyen material técnico de apoyo comercial de libre uso y adaptación por parte del prestador independiente, sin constituir orden directa ni obligación jerárquica (Corte Suprema Rol N° 20.995-2026).
              </p>
            </div>
          </div>
        )}

        {/* Pie Fijo */}
        <div className="p-4 border-t border-border bg-surface-raised/40 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Entendido, volver al catálogo
          </button>
        </div>
      </div>
    </div>
  );
}
