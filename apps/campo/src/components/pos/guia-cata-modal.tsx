'use client';

import { useState, useMemo, useEffect } from 'react';
import { type ProductoLocal, db } from '@/lib/offline/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { supabase } from '@/lib/supabase';
import { getTiendaOrigin } from '@/lib/public-urls';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
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
import { PARES_SEMANTICOS_POR_CATEGORIA, type CategoriaSensorial } from '@enjambre/resenas';

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
  const ps = p.perfil_sensorial;
  const normTipo = (p.tipo_sensorial || '').toLowerCase().trim();
  const nombre = (p.nombre ?? '').toLowerCase();
  const variedadLote = p.lote?.variedad_floral;
  const origenApicola = p.origen_apicola;

  // Detección botánica y taxonómica refinada
  const isCacao = nombre.includes('cacao') || nombre.includes('chocolate');
  const isAvellana = nombre.includes('avellana');
  const isPolen = nombre.includes('polen');
  const isPanal = nombre.includes('panal');
  const isTiaca = nombre.includes('tiaca') || (variedadLote ?? '').toLowerCase().includes('tiaca');
  const isUlmo = nombre.includes('ulmo') || (variedadLote ?? '').toLowerCase().includes('ulmo');
  const isVirgen = nombre.includes('virgen') || isPanal;

  let cat: CategoriaSensorial = 'miel';
  if (
    normTipo === 'fortificaciones' ||
    normTipo.includes('fortificaci') ||
    (!normTipo.includes('miel') && (isAvellana || isCacao || isPolen || nombre.includes('nibs')))
  ) {
    cat = 'fortificaciones';
  } else if (
    normTipo === 'miel_fortificada' ||
    (normTipo.includes('fortificada') && !normTipo.includes('fortificaciones')) ||
    (nombre.includes('miel') && (isAvellana || isCacao || isPolen))
  ) {
    cat = 'miel_fortificada';
  } else if (normTipo.includes('hidromiel') || nombre.includes('hidromiel')) {
    cat = 'hidromiel';
  } else if (normTipo.includes('extracto') || normTipo.includes('tintura') || nombre.includes('propoleo') || nombre.includes('propóleo')) {
    cat = 'extracto';
  } else if (normTipo.includes('cosmet') || normTipo.includes('balsamo') || normTipo.includes('bálsamo') || normTipo.includes('cera') || nombre.includes('balsamo') || nombre.includes('bálsamo')) {
    cat = 'cosmetica';
  } else if (normTipo.includes('infusion') || normTipo.includes('infusión') || nombre.includes('infusion') || nombre.includes('infusión')) {
    cat = 'infusion';
  }

  // 1. Dimensiones sensoriales en paladar
  let dimensiones: Array<{ label: string; izq: string; der: string; pct: number }>;
  if (Array.isArray(ps?.pares_semanticos) && ps.pares_semanticos.length >= 3) {
    dimensiones = ps.pares_semanticos.map((par, i) => {
      const pct = i === 0 ? ps.intensidad ?? 80 : i === 1 ? ps.dulzor_acidez ?? 65 : ps.textura ?? 85;
      return {
        label: par.par,
        izq: par.izq,
        der: par.der,
        pct,
      };
    });
  } else if (ps?.descriptores_intensidad || ps?.descriptores_dulzor || ps?.descriptores_textura) {
    dimensiones = [
      {
        label: 'Intensidad en Paladar',
        izq: ps.descriptores_intensidad?.izq ?? 'Suave & Floral',
        der: ps.descriptores_intensidad?.der ?? 'Robusto & Boscoso',
        pct: ps.intensidad ?? 75,
      },
      {
        label: 'Balance de Origen',
        izq: ps.descriptores_dulzor?.izq ?? 'Dulzor Cálido',
        der: ps.descriptores_dulzor?.der ?? 'Acidez Silvestre',
        pct: ps.dulzor_acidez ?? 60,
      },
      {
        label: 'Textura & Cuerpo',
        izq: ps.descriptores_textura?.izq ?? 'Líquida / Sedosa',
        der: ps.descriptores_textura?.der ?? 'Cremosa / Untable',
        pct: ps.textura ?? 85,
      },
    ];
  } else {
    const defaultPairs = PARES_SEMANTICOS_POR_CATEGORIA[cat] ?? PARES_SEMANTICOS_POR_CATEGORIA.miel;
    dimensiones = defaultPairs.map((par, i) => {
      const pct = i === 0 ? ps?.intensidad ?? 80 : i === 1 ? ps?.dulzor_acidez ?? 65 : ps?.textura ?? 85;
      return {
        label: par.par,
        izq: par.izq,
        der: par.der,
        pct,
      };
    });
  }

  // 2. Variedad o denominación de origen
  const variedad =
    variedadLote ||
    origenApicola ||
    (cat === 'fortificaciones'
      ? isAvellana
        ? 'Avellana Chilena Nativa (Gevuina avellana) · Tostada y Molida'
        : isCacao
          ? 'Nibs de Cacao Crudo (Santander, Colombia)'
          : isPolen
            ? 'Polen Floral Puro de Bosque Nativo'
            : 'Materia Prima Noble de Origen'
      : cat === 'hidromiel'
        ? 'Hidromiel Artesanal de Bosque Nativo & Agua Austral'
        : cat === 'extracto'
          ? 'Propóleo Puro de Bosque Templado Lluvioso'
          : cat === 'cosmetica'
            ? 'Cera Virgen de Opérculo & Botánica Austral'
            : cat === 'infusion'
              ? 'Botánica Silvestre de Sotobosque Chilote'
              : isCacao
                ? 'Crema de Miel con Nibs de Cacao Crudo (Santander, Colombia)'
                : isAvellana
                  ? 'Crema de Miel con Avellana Chilena Tostada y Molida'
                  : isPolen
                    ? 'Crema de Miel con Polen Floral'
                    : isVirgen
                      ? 'Miel Virgen con Trocito de Panal'
                      : isTiaca
                        ? 'Tiaca de Bosque Templado Lluvioso'
                        : isUlmo
                          ? 'Ulmo Monofloral de Chiloé (Eucryphia cordifolia)'
                          : 'Bosque Templado Lluvioso de Chiloé');

  // 3. Pitch de venta inmediato
  const pitch =
    p.descripcion_corta ||
    p.descripcion_regenerativa ||
    (cat === 'fortificaciones'
      ? isAvellana
        ? 'Avellana nativa chilena (Gevuina avellana) recolectada en bosque templado, tostada suavemente y molida en frío. 100% fruto puro sin aceites añadidos, azúcar ni preservantes.'
        : isCacao
          ? 'Nibs de cacao fino de aroma seleccionados y tostados a baja temperatura. Crocancia noble y pureza bioactiva sin aditivos ni lácteos.'
          : isPolen
            ? 'Polen floral crudo deshidratado en frío. Gránulos vivos con alta concentración de enzimas, aminoácidos y fermentos naturales del bosque.'
            : 'Materia prima pura recolectada y procesada en frío para conservar íntegros sus nutrientes y perfil sensorial.'
      : cat === 'hidromiel'
        ? 'Fermentación salvaje de miel cruda de bosque nativo y agua de lluvia austral. Sin alcohol destilado añadido, sulfitos artificiales ni azúcares comerciales.'
        : cat === 'cosmetica'
          ? 'Formulación pura a base de cera virgen de opérculo y macerados botánicos de Chiloé. Nutrición dérmica profunda libre de derivados de petróleo o fragancias sintéticas.'
          : cat === 'extracto'
            ? 'Extracto hidroalcohólico concentrado de propóleo crudo de bosque templado. Máxima densidad de flavonoides bioactivos para defensa natural.'
            : cat === 'infusion'
              ? 'Hojas y flores silvestres recolectadas a mano en sotobosques de Chiloé y deshidratadas en sombra para preservar intactos sus aceites esenciales.'
              : isCacao
                ? 'Miel cruda de bosque nativo batida mecánicamente en frío con nibs de cacao crudo de Santander. Textura cremosa con toque crujiente natural, sin azúcares refinadas ni lácteos añadidos.'
                : isAvellana
                  ? 'Emulsión artesanal en frío de miel virgen de Chiloé y avellana nativa chilena tostada y molida. Praliné untable 100% puro sin aceites vegetales ni aditivos.'
                  : isPolen
                    ? 'Miel virgen cruda infusionada en frío con polen floral seleccionado para preservar fermentos e inmunidad natural.'
                    : isVirgen
                      ? 'Miel virgen de bosque nativo con trozo de panal natural intacto. Cera de opérculo virgen comestible rica en própolis natural y miel cruda madurada en colmena.'
                      : isTiaca
                        ? 'Recolección de principios de verano de flor de tiaca. Color ámbar claro, notas cítricas balsámicas y una acidez silvestre sutil que limpia el paladar.'
                        : isUlmo
                          ? 'Miel monofloral emblemática de los fiordos de Chiloé. Aroma a flor blanca y vainilla silvestre con una textura cremosa natural insuperable.'
                          : 'Miel de bosque nativo madurada en colmena en los fiordos de Chiloé por abejas vírgenes sin trashumancia forzada. Cruda, centrifugada en frío y biológicamente activa.');

  // 4. Notas aromáticas
  const notasAromaticas =
    ps?.notas_aromaticas && ps.notas_aromaticas.length > 0
      ? ps.notas_aromaticas
      : cat === 'fortificaciones'
        ? isAvellana
          ? ['Avellana Nativa Tostada', 'Grasa Noble', 'Madera Suave', 'Corteza Seca', 'Molienda Artesanal']
          : isCacao
            ? ['Cacao Fino de Aroma', 'Tostado Profundo', 'Notas Terrosas', 'Amargor Noble']
            : ['Polen Floral', 'Néctar Seco', 'Notas de Enzima', 'Bosque Silvestre']
        : cat === 'hidromiel'
          ? ['Fermento Melífero', 'Manzana Silvestre', 'Flores Blancas', 'Acidez Cítrica']
          : cat === 'cosmetica'
            ? ['Cera de Opérculo', 'Miel Virgen', 'Resina Balsámica', 'Seda Botánica']
            : cat === 'extracto'
              ? ['Propóleo Concentrado', 'Resina Balsámica', 'Pungencia Noble', 'Corteza Nativa']
              : cat === 'infusion'
                ? ['Hojas de Bosque', 'Hierbas Medicinales', 'Flores Silvestres', 'Retrogusto Cálido']
                : [
                    'Flor de Ulmo',
                    'Corteza de Tiaca',
                    'Caramelo Crudo',
                    'Avellana Tostada',
                    'Resina Balsámica',
                  ];

  // 5. Maridajes
  const maridajes =
    ps?.maridajes && ps.maridajes.length > 0
      ? ps.maridajes
      : cat === 'fortificaciones'
        ? [
            { titulo: 'Yogur Natural & Granola de Origen', detalle: 'Aporte de grasas saludables, textura crocante y energía limpia sin azúcares.' },
            { titulo: 'Frutas Asadas & Bowls de Avena', detalle: 'Sustituto puro de alta gama para cremas industriales y mantecas procesadas.' },
            { titulo: 'Café de Especialidad / Filtrado', detalle: 'Equilibrio perfecto entre la calidez del grano y la molienda del fruto seco.' },
            { titulo: 'Consumo Directo (Pre/Post Ejercicio)', detalle: 'Aporte noble de lípidos saludables y minerales de asimilación directa.' },
          ]
        : cat === 'hidromiel'
          ? [
              { titulo: 'Tablas de Quesos Maduros y Azules', detalle: 'La acidez viva y efervescencia ligera cortan la grasa del queso con elegancia.' },
              { titulo: 'Charcutería y Jamón Curado', detalle: 'Equilibrio tánico con carnes nobles y patés artesanales de la Patagonia.' },
              { titulo: 'Aperitivo Fresco en Copa', detalle: 'Disfrutar entre 8°C y 12°C como brindis de inicio de mesa.' },
            ]
          : cat === 'cosmetica'
            ? [
                { titulo: 'Aplicación Nocturna Reparadora', detalle: 'Permite que la cera y lípidos botánicos restauren la barrera lipídica durante el descanso.' },
                { titulo: 'Protección ante Viento & Clima Austral', detalle: 'Escudo natural contra la resequedad provocada por frío o viento salino.' },
              ]
            : [
                { titulo: 'Quesos Maduros y Azules', detalle: 'Contraste salino intenso que resalta los azúcares vivos y notas de bosque.' },
                { titulo: 'Charcutería y Jabalí Ahumado', detalle: 'Armoniza con carnes curadas de la Patagonia y patés artesanales.' },
                { titulo: 'Infusiones Nativas (Maqui / Menta)', detalle: 'Endulzante crudo que aporta cuerpo sin enmascarar los taninos silvestres.' },
                { titulo: 'Café de Especialidad y Masa Madre', detalle: 'Textura untable de alta densidad floral ideal para pan de masa madre y desayunos de alta gama.' },
              ];

  // 6. Objeciones de venta contextuales por familia
  const objecionesEspecificas =
    cat === 'fortificaciones'
      ? [
          {
            pregunta: '¿Tiene azúcar añadida, aceites vegetales o preservantes?',
            respuesta:
              'Cero aditivos, cero azúcares refinadas, cero aceites vegetales añadidos. Es 100% materia prima noble pura seleccionada, tostada y molida en frío para mantener su integridad nutricional.',
          },
          {
            pregunta: '¿Cómo se consume o incorpora en la alimentación diaria?',
            respuesta:
              'Es extremadamente versátil: recomendamos 1 o 2 cucharadas diarias en bowls de yogur, papillas de avena, frutas de estación, batidos o directamente como fuente de grasas saludables y micronutrientes.',
          },
          {
            pregunta: '¿Cómo debe conservarse una vez abierto el frasco?',
            respuesta:
              'Conservar bien cerrado en lugar fresco, seco y al resguardo de la luz solar directa. Al ser un producto puro sin aditivos ni agua libre, sus aceites nobles se mantienen estables a temperatura ambiente.',
          },
        ]
      : cat === 'hidromiel'
        ? [
            {
              pregunta: '¿Qué es la hidromiel y cómo se diferencia de otras bebidas?',
              respuesta:
                'Es la bebida fermentada más antigua del mundo: miel cruda de bosque nativo y agua pura de lluvia austral fermentadas lentamente con levaduras salvajes. Sin alcohol destilado añadido ni aditivos industriales.',
            },
            {
              pregunta: '¿Qué graduación alcohólica tiene y cómo se sirve?',
              respuesta:
                'Tiene entre 10% y 13% de alcohol producto de su fermentación natural. Se sirve fresca (entre 8°C y 12°C), ideal en copa como aperitivo o acompañando tablas de quesos y carnes curadas.',
            },
            {
              pregunta: '¿Es muy dulce como la miel líquida?',
              respuesta:
                'No: durante la fermentación, las levaduras transforman los azúcares en alcohol y notas florales complejas con acidez viva, logrando un balance estructurado, seco y elegante en boca.',
            },
          ]
        : cat === 'cosmetica'
          ? [
              {
                pregunta: '¿Es apto para pieles sensibles o labios agrietados?',
                respuesta:
                  'Sí, formulado exclusivamente con cera pura de opérculo y extractos botánicos nobles de Chiloé. Libre de derivados del petróleo, parafinas, aromas sintéticos o parabenos.',
              },
              {
                pregunta: '¿Deja sensación grasosa o pegajosa?',
                respuesta:
                  'La cera virgen crea una micropelícula transpirable que nutre y retiene la hidratación natural de la piel sin obstruir poros ni dejar brillo artificial.',
              },
            ]
          : cat === 'extracto'
            ? [
                {
                  pregunta: '¿Cómo se dosifica y en qué momento es recomendable tomarlo?',
                  respuesta:
                    'Unas gotas directas o diluidas en agua templada o infusión. Ideal en las mañanas o ante cambios de estación para reforzar las defensas naturales con flavonoides bioactivos.',
                },
                {
                  pregunta: '¿Por qué tiene un sabor tan intenso o pungente?',
                  respuesta:
                    'La pungencia resinosa es la firma de pureza y alta concentración de polifenoles del propóleo crudo de bosque templado, recolectado sin dilución artificial.',
                },
              ]
            : cat === 'infusion'
              ? [
                  {
                    pregunta: '¿Cómo se recolectan y secan las hierbas?',
                    respuesta:
                      'Recolección manual en sotobosques nativos y deshidratado en sombra a baja temperatura para preservar intactos los aceites esenciales y propiedades botánicas.',
                  },
                  {
                    pregunta: '¿Cómo se prepara para una infusión óptima?',
                    respuesta:
                      'Agua recién hervida a 90°C (dejando reposar un minuto tras el hervor), infundir tapado durante 5 a 7 minutos para no volatilizar los aromas terapéuticos.',
                  },
                ]
            : [
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

  // 7. Parámetros técnicos
  const humedad =
    cat === 'fortificaciones'
      ? p.lote?.analisis_humedad ? `${p.lote.analisis_humedad}%` : 'Molienda en frío sin aditivos'
      : cat === 'hidromiel'
        ? 'Fermentación salvaje en frío'
        : cat === 'cosmetica'
          ? 'Poder emoliente dérmico'
          : cat === 'extracto'
            ? 'Extracto hidroalcohólico concentrado'
            : cat === 'infusion'
              ? 'Deshidratado en sombra'
              : p.lote?.analisis_humedad
                ? `${p.lote.analisis_humedad}%`
                : '< 18% (Maduración Natural)';

  const extraccion =
    cat === 'fortificaciones'
      ? p.lote?.metodo_extraccion ?? 'Tostado noble y molienda artesanal'
      : cat === 'hidromiel'
        ? p.lote?.metodo_extraccion ?? 'Fermentación lenta y maduración en barrica'
        : cat === 'cosmetica'
          ? p.lote?.metodo_extraccion ?? 'Fundido suave y decantado de cera virgen'
          : cat === 'extracto'
            ? p.lote?.metodo_extraccion ?? 'Maceración lenta de propóleo crudo'
            : cat === 'infusion'
              ? p.lote?.metodo_extraccion ?? 'Recolección manual de hojas y flores'
              : p.lote?.metodo_extraccion ?? 'Centrifugado en frío sin pasteurizar';

  const momentoConsumo =
    ps?.momento_consumo ||
    (cat === 'fortificaciones'
      ? 'Desayunos lentos de invierno, meriendas reconstituyentes y bowls matinales'
      : cat === 'hidromiel'
        ? 'Aperitivo antes de cenar, sobremesas y brindis de celebración'
        : cat === 'cosmetica'
          ? 'Ritual nocturno de hidratación o protección previa a salir al frío'
          : isCacao
            ? 'Sobremesa, merienda energética o maridaje con café de especialidad'
            : isTiaca
              ? 'Mañanas luminosas, tablas de quesos frescos y desayunos reconstituyentes'
              : isAvellana
                ? 'Desayunos lentos de invierno y meriendas reconfortantes'
                : isPolen
                  ? 'Inicio de jornada, bowls matinales y revitalización diaria'
                  : isVirgen
                    ? 'Tablas de quesos de alta gama, corte directo de panal y ocasiones especiales'
                    : 'Desayunos de alta gama, tablas de quesos patagónicos y rituales de bienestar');

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
    // Fail-silent para no interrumpir al agente comercial en terreno ni requerir red
  }
};

export function GuiaCataModal({ producto, isOpen, onClose }: GuiaCataModalProps) {
  const [openObjecion, setOpenObjecion] = useState<number | null>(null);
  const [modoAtril, setModoAtril] = useState(false);
  const [selectedVarianteId, setSelectedVarianteId] = useState<string | null>(null);

  const variantes = useLiveQuery(
    () => (producto ? db.variantes.where('producto_id').equals(producto.id).toArray() : []),
    [producto?.id],
  );

  useEffect(() => {
    setSelectedVarianteId(null);
  }, [producto?.id]);

  const selectedVariante = useMemo(
    () => variantes?.find((v) => v.id === selectedVarianteId) ?? null,
    [variantes, selectedVarianteId],
  );

  const effectiveProducto = useMemo(() => {
    if (!producto) return null;
    if (!selectedVariante) return producto;
    return {
      ...producto,
      nombre: `${producto.nombre} · ${selectedVariante.nombre_variante}`,
      precio: selectedVariante.precio_override ?? producto.precio,
      peso_neto_g: selectedVariante.peso_neto_g || producto.peso_neto_g,
      formato: selectedVariante.peso_neto_g ? `${selectedVariante.peso_neto_g}g` : producto.formato,
      perfil_sensorial:
        (selectedVariante.perfil_sensorial_override as ProductoLocal['perfil_sensorial']) ??
        producto.perfil_sensorial,
    };
  }, [producto, selectedVariante]);

  const perfil = useMemo(() => {
    if (!effectiveProducto) return null;
    return resolverPerfilSensorial(effectiveProducto);
  }, [effectiveProducto]);

  useEffect(() => {
    if (isOpen && effectiveProducto) {
      void logEscuelaVenta(effectiveProducto.id, effectiveProducto.nombre ?? 'Producto', 'apertura_guia_cata');
    }
  }, [isOpen, effectiveProducto]);

  if (!isOpen || !producto || !perfil || !effectiveProducto) return null;

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
                <Compass className="w-3 h-3" /> Escuela de Venta & Cata
              </span>
              {effectiveProducto.formato && (
                <span className="text-[10px] uppercase font-semibold text-muted-foreground bg-surface-sunken px-2 py-0.5 rounded">
                  {effectiveProducto.formato}
                </span>
              )}
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground leading-tight">
              {effectiveProducto.nombre ?? 'Producto'}
            </h2>
            {effectiveProducto.precio != null && (
              <p className="text-sm font-mono font-bold text-primary">
                {formatCLP(effectiveProducto.precio)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !modoAtril;
                setModoAtril(next);
                if (next) {
                  void logEscuelaVenta(effectiveProducto.id, effectiveProducto.nombre ?? 'Producto', 'modo_atril');
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

        {/* Selector de Variante / Fortificación */}
        {variantes && variantes.length > 0 && (
          <div className="px-6 py-2.5 bg-surface-sunken/60 border-b border-border/50 flex flex-wrap items-center gap-1.5 campo-print-hidden">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
              Variante:
            </span>
            <button
              type="button"
              onClick={() => setSelectedVarianteId(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                selectedVarianteId === null
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'bg-surface-raised text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              Formato Base
            </button>
            {variantes.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVarianteId(v.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  selectedVarianteId === v.id
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'bg-surface-raised text-muted-foreground hover:text-foreground border border-border/60'
                }`}
              >
                {v.nombre_variante}
                {v.peso_neto_g ? ` (${v.peso_neto_g}g)` : ''}
              </button>
            ))}
          </div>
        )}

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
                  {effectiveProducto.nombre}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-1.5 text-xs text-muted-foreground campo-print-text-dark">
                  {effectiveProducto.origen_apicola && <span>{effectiveProducto.origen_apicola}</span>}
                  {effectiveProducto.origen_apicola && effectiveProducto.formato && <span>·</span>}
                  {effectiveProducto.formato && <span>{effectiveProducto.formato}</span>}
                </div>
              </div>

              {/* Curvas Sensoriales */}
              <div className="py-4 space-y-3 border-b border-border/60">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                  <Compass className="w-3.5 h-3.5" />
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
                <strong>Herramienta consultiva voluntaria:</strong> Este argumentario y notas sensoriales constituyen material técnico de apoyo comercial de libre uso y adaptación por parte del prestador independiente, sin constituir orden directa ni obligación jerárquica (Corte Suprema Rol N° 20.995-2026).
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
