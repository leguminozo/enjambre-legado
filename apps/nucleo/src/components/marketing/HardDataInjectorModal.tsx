'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Database,
  Sprout,
  QrCode,
  CheckCircle2,
  FlaskConical,
  Edit3,
  Plus,
  RefreshCw,
  Coffee,
  Sliders,
  ExternalLink,
  Sparkles,
  Trees,
} from 'lucide-react';
import { toast } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { type SlideData, type SlideBlock } from './slide-studio-core';

export interface HardDataInjectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInject: (updatedSlide: Partial<SlideData>, newBlocks?: SlideBlock[]) => void;
  activeSlide: SlideData;
}

export interface EditableLoteData {
  id?: string;
  codigo: string;
  especie: string;
  cientifico: string;
  cuenca: string;
  paralelo: string;
  fechaRecoleccion: string;
  humedad: string;
  ph: string;
  conductividad: string;
  hmf: string;
  polenPorcentaje: string;
  textura: string;
}

export interface EditableFenologiaData {
  id?: string;
  comun: string;
  cientifico: string;
  familia: string;
  tbase: number;
  gddRequerido: number;
  floracionMeses: string;
  secrecionNectar: string;
  rolEcologico: string;
  descripcion: string;
}

export interface DatabaseProductOption {
  id: string;
  nombre: string;
  slug?: string;
  formato?: string | null;
  peso_neto_g?: number | null;
}

// Fallbacks seguros de alta fidelidad biológica (en caso de que la DB esté recién inicializada)
const DEFAULT_LOTES: EditableLoteData[] = [
  {
    codigo: 'LOTE-2026-ULMO-01',
    especie: 'Ulmo de Verano',
    cientifico: 'Eucryphia cordifolia',
    cuenca: 'Cuenca Río Chepu · Chiloé',
    paralelo: "42°08'S · 73°59'W",
    fechaRecoleccion: 'Febrero 2026',
    polenPorcentaje: '89.4% polen dominante',
    humedad: '16.8%',
    ph: '3.9',
    conductividad: '0.72 mS/cm',
    hmf: '4.2 mg/kg',
    textura: 'Cristalización fina cremada en frío',
  },
  {
    codigo: 'LOTE-2026-TIACA-02',
    especie: 'Tiaca de Selva Fría',
    cientifico: 'Caldcluvia paniculata',
    cuenca: 'Cuenca Lago Huillinco · Chiloé',
    paralelo: "42°41'S · 73°56'W",
    fechaRecoleccion: 'Enero 2026',
    polenPorcentaje: '84.1% polen dominante',
    humedad: '17.1%',
    ph: '4.1',
    conductividad: '0.68 mS/cm',
    hmf: '3.8 mg/kg',
    textura: 'Líquida ámbar claro con alta fluidez',
  },
  {
    codigo: 'LOTE-2026-MELI-03',
    especie: 'Melí & Bosque Templado',
    cientifico: 'Amomyrtus meli',
    cuenca: 'Cuenca Parque Nacional Cucao · Chiloé',
    paralelo: "42°37'S · 74°06'W",
    fechaRecoleccion: 'Diciembre 2025',
    polenPorcentaje: '78.6% polen nativo',
    humedad: '16.5%',
    ph: '3.8',
    conductividad: '0.75 mS/cm',
    hmf: '4.9 mg/kg',
    textura: 'Cristalización media con notas resinosas',
  },
];

const DEFAULT_FENOLOGIA: EditableFenologiaData[] = [
  {
    comun: 'Ulmo',
    cientifico: 'Eucryphia cordifolia',
    familia: 'Cunoniaceae',
    tbase: 7,
    gddRequerido: 480,
    floracionMeses: 'Febrero — Marzo',
    secrecionNectar: 'Máxima (Cenit estival)',
    rolEcologico: 'Árbol nodriza de dosel maduro de hasta 40m',
    descripcion: 'Pico de secreción nectaria de la selva fría. Polen de alta densidad nutritiva.',
  },
  {
    comun: 'Tiaca',
    cientifico: 'Caldcluvia paniculata',
    familia: 'Cunoniaceae',
    tbase: 6,
    gddRequerido: 320,
    floracionMeses: 'Diciembre — Enero',
    secrecionNectar: 'Muy alta (Comienzo de verano)',
    rolEcologico: 'Especie riparia reguladora de cursos de agua',
    descripcion: 'Floración blanca en racimos densos, néctar límpido de acidez floral brillante.',
  },
  {
    comun: 'Melí',
    cientifico: 'Amomyrtus meli',
    familia: 'Myrtaceae',
    tbase: 6,
    gddRequerido: 260,
    floracionMeses: 'Noviembre — Diciembre',
    secrecionNectar: 'Alta y aromática',
    rolEcologico: 'Subcanopia densa en bosques húmedos profundos',
    descripcion: 'Aroma balsámico intenso con aceites esenciales terpénicos transferidos al néctar.',
  },
  {
    comun: 'Avellano Chileno',
    cientifico: 'Gevuina avellana',
    familia: 'Proteaceae',
    tbase: 5,
    gddRequerido: 180,
    floracionMeses: 'Septiembre — Octubre',
    secrecionNectar: 'Media (Aporte de polen temprano)',
    rolEcologico: 'Nutrición proteica primaveral para el enjambre',
    descripcion: 'Despertar biológico de la colmena tras el invierno lluvioso insular.',
  },
];

const DEFAULT_PRODUCTOS: DatabaseProductOption[] = [
  { id: 'prod-ulmo-500', nombre: 'Miel de Ulmo Cruda 500g', slug: 'miel-de-ulmo-500g', formato: 'Frasco Vidrio', peso_neto_g: 500 },
  { id: 'prod-tiaca-500', nombre: 'Miel de Tiaca Cruda 500g', slug: 'miel-de-tiaca-500g', formato: 'Frasco Vidrio', peso_neto_g: 500 },
  { id: 'prod-meli-500', nombre: 'Miel de Melí Cruda 500g', slug: 'miel-de-meli-500g', formato: 'Frasco Vidrio', peso_neto_g: 500 },
  { id: 'prod-sachet-15g', nombre: 'Sachets Barista 15g (Caja 50u)', slug: 'sachets-barista-15g', formato: 'Monodosis', peso_neto_g: 750 },
];

export function HardDataInjectorModal({
  isOpen,
  onClose,
  onInject,
  activeSlide,
}: HardDataInjectorModalProps) {
  const apiFetch = useApiFetch();

  const [activeTab, setActiveTab] = useState<'lotes' | 'fenologia' | 'sensorial' | 'biomasa' | 'qr'>('lotes');
  const [loadingDb, setLoadingDb] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Listas de entidades
  const [lotesList, setLotesList] = useState<EditableLoteData[]>(DEFAULT_LOTES);
  const [fenologiaList, setFenologiaList] = useState<EditableFenologiaData[]>(DEFAULT_FENOLOGIA);
  const [productosList, setProductosList] = useState<DatabaseProductOption[]>(DEFAULT_PRODUCTOS);

  // Selección activa y modo de edición
  const [selectedLoteIndex, setSelectedLoteIndex] = useState(0);
  const [isEditingLote, setIsEditingLote] = useState(false);
  const [currentLoteForm, setCurrentLoteForm] = useState<EditableLoteData>(DEFAULT_LOTES[0]);

  const [selectedEspecieIndex, setSelectedEspecieIndex] = useState(0);
  const [isEditingEspecie, setIsEditingEspecie] = useState(false);
  const [currentEspecieForm, setCurrentEspecieForm] = useState<EditableFenologiaData>(DEFAULT_FENOLOGIA[0]);

  // QR Generator State
  const [qrDest, setQrDest] = useState<'resena' | 'lote' | 'producto' | 'club' | 'custom'>('resena');
  const [qrBatchCode, setQrBatchCode] = useState('LOTE-2026-ULMO-01');
  const [qrProductSlug, setQrProductSlug] = useState('miel-de-ulmo-500g');
  const [qrCustomUrl, setQrCustomUrl] = useState('https://obrerayzangano.cl');
  const [qrTitle, setQrTitle] = useState('VALIDACIÓN SENSORIAL EN VIVO');
  const [qrSubtitle, setQrSubtitle] = useState('Apunta la cámara para calificar aroma, notas y cuerpo en 30 segundos.');

  // Sensorial Profile State (para Cafeterías y Barismo)
  const [sensorialSweetness, setSensorialSweetness] = useState(4);
  const [sensorialAcidity, setSensorialAcidity] = useState(3);
  const [sensorialFlora, setSensorialFlora] = useState(5);
  const [sensorialBody, setSensorialBody] = useState(4);
  const [sensorialTexture, setSensorialTexture] = useState('Microcristales sedosos y untuosos');
  const [sensorialPairing, setSensorialPairing] = useState('Armoniza con tueste medio lavado de Etiopía, Geisha y cold brew cítrico. Servir bajo 40°C.');

  // Biomasa & CO2 State (Impacto Territorial Auditado)
  const [biomasaHectareas, setBiomasaHectareas] = useState('142');
  const [biomasaCuenca, setBiomasaCuenca] = useState('Cuenca Río Chepu · Bosque Templado Lluvioso');
  const [biomasaCO2Evitado, setBiomasaCO2Evitado] = useState('2.4 kg CO₂e / kg miel');
  const [biomasaArbolesCensados, setBiomasaArbolesCensados] = useState('1,840 árboles nativos');
  const [biomasaEspeciesClave, setBiomasaEspeciesClave] = useState('Ulmo, Tiaca, Melí, Canelo y Notro');

  // Sincronizar selección inicial
  useEffect(() => {
    if (lotesList[selectedLoteIndex]) {
      setCurrentLoteForm(lotesList[selectedLoteIndex]);
    }
  }, [selectedLoteIndex, lotesList]);

  useEffect(() => {
    if (fenologiaList[selectedEspecieIndex]) {
      setCurrentEspecieForm(fenologiaList[selectedEspecieIndex]);
    }
  }, [selectedEspecieIndex, fenologiaList]);

  // Carga reactiva de datos reales desde Núcleo API
  const loadDatabaseEntities = useCallback(async () => {
    try {
      setLoadingDb(true);
      const [prodRes, fenoRes] = await Promise.allSettled([
        apiFetch('/api/produccion/dashboard'),
        apiFetch('/api/fenologia/especies/todas'),
      ]);

      let hasLiveItems = false;

      // 1. Procesar Producción (Lotes y Productos de Postgres)
      if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
        const prodData = (await prodRes.value.json()) as {
          data?: {
            lotes?: Array<{
              id: string;
              codigo?: string;
              nombre_lote?: string | null;
              variedad_floral?: string | null;
              analisis_humedad?: number | null;
              analisis_brix?: number | null;
              kg_total?: number;
              created_at?: string;
            }>;
            productos?: Array<{
              id: string;
              nombre: string;
              slug?: string;
              formato?: string | null;
              peso_neto_g?: number | null;
            }>;
          };
        };

        const rawLotes = prodData?.data?.lotes;
        if (Array.isArray(rawLotes) && rawLotes.length > 0) {
          hasLiveItems = true;
          const mappedLotes: EditableLoteData[] = rawLotes.map((l, i) => {
            const cod = l.codigo || l.nombre_lote || `LOTE-${new Date(l.created_at || Date.now()).getFullYear()}-${String(i + 1).padStart(2, '0')}`;
            const esp = l.variedad_floral || 'Ulmo de Bosque Nativo';
            return {
              id: l.id,
              codigo: cod,
              especie: esp,
              cientifico: esp.toLowerCase().includes('ulmo')
                ? 'Eucryphia cordifolia'
                : esp.toLowerCase().includes('tiaca')
                  ? 'Caldcluvia paniculata'
                  : 'Bosque Nativo Templado',
              cuenca: 'Cordillera de la Costa · Chiloé',
              paralelo: "42°08'S · 73°59'W",
              fechaRecoleccion: l.created_at
                ? new Date(l.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' })
                : 'Temporada Actual',
              polenPorcentaje: '87.5% polen nativo dominante',
              humedad: l.analisis_humedad ? `${l.analisis_humedad}%` : '16.9%',
              ph: '3.9',
              conductividad: '0.71 mS/cm',
              hmf: '4.1 mg/kg',
              textura: 'Cristalización fina cremada en frío',
            };
          });
          setLotesList(mappedLotes);
          setSelectedLoteIndex(0);
          setCurrentLoteForm(mappedLotes[0]);
          setQrBatchCode(mappedLotes[0].codigo);
        }

        const rawProds = prodData?.data?.productos;
        if (Array.isArray(rawProds) && rawProds.length > 0) {
          const mappedProds: DatabaseProductOption[] = rawProds.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            slug: p.slug || p.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            formato: p.formato || 'Frasco',
            peso_neto_g: p.peso_neto_g ?? null,
          }));
          setProductosList(mappedProds);
          if (mappedProds[0]?.slug) {
            setQrProductSlug(mappedProds[0].slug);
          }
        }
      }

      // 2. Procesar Fenología Real
      if (fenoRes.status === 'fulfilled' && fenoRes.value.ok) {
        const fenoData = (await fenoRes.value.json()) as {
          data?: Array<{
            id: string;
            nombre_comun: string;
            nombre_cientifico: string;
            familia: string | null;
            tbase_c?: number;
            t_base?: number;
            gdd_umbral?: number | null;
            mes_inicio_floracion?: number | null;
            mes_fin_floracion?: number | null;
          }>;
        };

        const rawEspecies = fenoData?.data;
        if (Array.isArray(rawEspecies) && rawEspecies.length > 0) {
          hasLiveItems = true;
          const mappedEspecies: EditableFenologiaData[] = rawEspecies.map((e) => {
            const meses =
              e.mes_inicio_floracion && e.mes_fin_floracion
                ? `${e.mes_inicio_floracion} — ${e.mes_fin_floracion}`
                : 'Estival (Dic — Mar)';
            return {
              id: e.id,
              comun: e.nombre_comun,
              cientifico: e.nombre_cientifico,
              familia: e.familia || 'Flora Nativa',
              tbase: Number(e.tbase_c ?? e.t_base ?? 6),
              gddRequerido: Number(e.gdd_umbral ?? 350),
              floracionMeses: meses,
              secrecionNectar: 'Máxima (Monitoreada)',
              rolEcologico: 'Especie nodriza y reguladora de dosel en la selva fría',
              descripcion: `Población nativa con floración estival registrada en Chiloé. Tbase=${e.tbase_c ?? 6}°C.`,
            };
          });
          setFenologiaList(mappedEspecies);
          setSelectedEspecieIndex(0);
          setCurrentEspecieForm(mappedEspecies[0]);
        }
      }

      setDbConnected(hasLiveItems);
    } catch {
      setDbConnected(false);
    } finally {
      setLoadingDb(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (isOpen) {
      void loadDatabaseEntities();
    }
  }, [isOpen, loadDatabaseEntities]);

  if (!isOpen) return null;

  // Actualizar QR text presets según el destino
  const handleDestinationChange = (dest: 'resena' | 'lote' | 'producto' | 'club' | 'custom') => {
    setQrDest(dest);
    if (dest === 'resena') {
      setQrTitle('CATA GUIADA & RESEÑA EN MESA');
      setQrSubtitle('Apunta la cámara para calificar el perfil botánico y activar tus beneficios.');
    } else if (dest === 'lote') {
      setQrTitle('PASAPORTE DE ORIGEN AUDITABLE');
      setQrSubtitle('Verifica la cuenca, coordenadas y análisis físico-químico de esta partida.');
    } else if (dest === 'producto') {
      setQrTitle('FICHA OFICIAL DE PRODUCTO');
      setQrSubtitle('Conoce los detalles de recolección y origen directo en tienda.');
    } else if (dest === 'club') {
      setQrTitle('CLUB LEGADO DEL BOSQUE');
      setQrSubtitle('Crea tu cuenta libre para programar reposición y acceder a microlotes.');
    } else {
      setQrTitle('ENLACE VERIFICADO');
      setQrSubtitle('Accede a la documentación directa de origen.');
    }
  };

  // 1. Inyección de Datos de Lote
  const handleInjectLote = () => {
    const lote = currentLoteForm;

    const metricsBlock: SlideBlock = {
      id: `b_lote_metrics_${Date.now()}`,
      type: 'metrics',
      items: [
        { label: 'HUMEDAD CERTIFICADA', value: `${lote.humedad} (Codex < 20%)` },
        { label: 'CONDUCTIVIDAD ELÉCTRICA', value: lote.conductividad },
        { label: 'ACIDEZ REAL & PH', value: `pH ${lote.ph} equilibrado` },
        { label: 'HMF EN EMBALAJE', value: `${lote.hmf} (Miel cruda viva)` },
        { label: 'MELISOPALINOLOGÍA', value: lote.polenPorcentaje },
      ],
    };

    const qrBlock: SlideBlock = {
      id: `b_lote_qr_${Date.now()}`,
      type: 'qr_code',
      destinationType: 'resena',
      url: `https://tienda.obrerayzangano.cl/resenas/nueva?lote=${encodeURIComponent(lote.codigo)}&origen=kit_editorial`,
      title: 'VALIDACIÓN SENSORIAL EN VIVO',
      subtitle: `Apunta la cámara para registrar tu cata del ${lote.codigo} en el Club Legado.`,
      batchCode: lote.codigo,
    };

    onInject(
      {
        kickerLeft: lote.especie.toUpperCase(),
        kickerRight: lote.codigo,
        badge: `DOCUMENTO DE LOTE // ${lote.cuenca.toUpperCase()}`,
        title: `Constantes analíticas de la partida ${lote.codigo}.`,
        subtitle: `Recolección botánica de ${lote.especie} (${lote.cientifico}) en ${lote.fechaRecoleccion}:`,
        footerLeft: `obrerayzangano.cl // ${lote.codigo}`,
        footerRight: 'LOTE CERTIFICADO',
      },
      [metricsBlock, qrBlock],
    );

    toast.success(`Datos del lote ${lote.codigo} inyectados en la lámina.`);
    onClose();
  };

  // 2. Inyección de Monografía Fenológica
  const handleInjectFenologia = () => {
    const esp = currentEspecieForm;

    const itemsBlock: SlideBlock = {
      id: `b_feno_items_${Date.now()}`,
      type: 'items',
      items: [
        {
          title: `FLORACIÓN: ${esp.floracionMeses.toUpperCase()}`,
          desc: `Ventana óptima de recolección según acumulación térmica estival en Chiloé.`,
        },
        {
          title: `GRADOS DÍA (GDD): ${esp.gddRequerido}°C ACUMULADOS`,
          desc: `Umbral fisiológico calculado a temperatura base Tbase=${esp.tbase}°C.`,
        },
        {
          title: 'ESTÁNDAR DE EXTRACCIÓN SOBERANA',
          desc: `${esp.secrecionNectar}. Conservación estricta de la reserva invernal.`,
        },
        {
          title: 'VÍNCULO CON LA CUENCA NATIVA',
          desc: esp.rolEcologico,
        },
      ],
    };

    onInject(
      {
        kickerLeft: 'REGISTRO FENOLÓGICO',
        kickerRight: esp.cientifico,
        badge: `BIOCLIMATOLOGÍA DE ORIGEN // TBASE ${esp.tbase}°C`,
        title: `Ciclo floral del ${esp.comun}: néctar del bosque maduro.`,
        subtitle: esp.descripcion,
        footerLeft: 'obrerayzangano.cl/fenologia',
        footerRight: 'FENOLOGÍA',
      },
      [itemsBlock],
    );

    toast.success(`Monografía fenológica de ${esp.comun} inyectada con éxito.`);
    onClose();
  };

  // 3. Inyección de Código QR Dinámico
  const handleInjectQR = () => {
    let resolvedUrl = qrCustomUrl;
    if (qrDest === 'resena') {
      resolvedUrl = `https://tienda.obrerayzangano.cl/resenas/nueva?lote=${encodeURIComponent(qrBatchCode)}&origen=kit_mesa`;
    } else if (qrDest === 'lote') {
      resolvedUrl = `https://tienda.obrerayzangano.cl/trazabilidad?lote=${encodeURIComponent(qrBatchCode)}`;
    } else if (qrDest === 'producto') {
      resolvedUrl = `https://tienda.obrerayzangano.cl/catalogo/${encodeURIComponent(qrProductSlug)}`;
    } else if (qrDest === 'club') {
      resolvedUrl = 'https://tienda.obrerayzangano.cl/club-legado-del-bosque?ref=kit_mesa';
    }

    const qrBlock: SlideBlock = {
      id: `b_qr_injected_${Date.now()}`,
      type: 'qr_code',
      destinationType: qrDest,
      url: resolvedUrl,
      title: qrTitle,
      subtitle: qrSubtitle,
      batchCode: qrDest === 'resena' || qrDest === 'lote' ? qrBatchCode : undefined,
    };

    onInject({}, [qrBlock]);
    toast.success('Bloque QR interactivo insertado en la lámina.');
    onClose();
  };

  // 4. Inyección de Perfil Sensorial (Barismo & Cafeterías)
  const handleInjectSensorial = () => {
    const sensorialBlock: SlideBlock = {
      id: `b_sensorial_${Date.now()}`,
      type: 'sensorial',
      sweetness: sensorialSweetness,
      acidity: sensorialAcidity,
      flora: sensorialFlora,
      body: sensorialBody,
      crystallization: sensorialTexture,
      pairingNote: sensorialPairing,
    };

    onInject(
      {
        badge: 'PERFIL SENSORIAL // MARIDAJE BARISTA',
        kickerLeft: 'ANÁLISIS DE CATA',
        kickerRight: 'BARISMO & ESPECIALIDAD',
        subtitle: 'Parámetros sensoriales y notas de armonización para café de especialidad:',
      },
      [sensorialBlock],
    );

    toast.success('Perfil sensorial de cata barista inyectado en la lámina.');
    onClose();
  };

  // 5. Inyección de Métricas de Biomasa & CO2
  const handleInjectBiomasa = () => {
    const metricsBlock: SlideBlock = {
      id: `b_biomasa_metrics_${Date.now()}`,
      type: 'metrics',
      items: [
        { label: 'SUPERFICIE BAJO CUIDADO', value: `${biomasaHectareas} ha protegidas` },
        { label: 'BALANCE DE CARBONO', value: `${biomasaCO2Evitado} evitado` },
        { label: 'CENSO DE DOSEL MADURO', value: biomasaArbolesCensados },
        { label: 'ESPECIES NECTARIAS', value: biomasaEspeciesClave },
      ],
    };

    onInject(
      {
        badge: 'BIOMASA ACTIVA // IMPACTO TERRITORIAL VERIFICADO',
        kickerLeft: 'CUENCA NATIVA',
        kickerRight: biomasaCuenca,
        title: 'Cada partida resguarda la biomasa viva del bosque.',
        subtitle: `En la ${biomasaCuenca}, la apicultura soberana protege ${biomasaHectareas} hectáreas de selva templada lluviosa.`,
        footerLeft: 'obrerayzangano.cl/regeneracion',
        footerRight: 'IMPACTO AUDITABLE',
      },
      [metricsBlock],
    );

    toast.success('Métricas de biomasa e impacto territorial inyectadas en la lámina.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[92vh] flex flex-col justify-between">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Database size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm sm:text-base text-foreground">
                  Inyector Dinámico de Datos & Herramientas Núcleo
                </h3>
                {loadingDb ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-sunken text-muted-foreground">
                    <RefreshCw size={10} className="animate-spin" /> Conectando
                  </span>
                ) : dbConnected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    Base de Datos Activa
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-sunken text-muted-foreground border border-border">
                    Modo Local / Personalizable
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                Conecta lotes reales, catálogo y perfiles sensoriales con edición libre de cada variable.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost h-8 w-8 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Pestañas de Ingesta */}
        <div className="flex items-center gap-1.5 border-b border-border/60 pb-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('lotes')}
            className={`btn btn-sm h-8 px-2.5 text-xs flex items-center gap-1.5 font-mono whitespace-nowrap rounded-lg ${
              activeTab === 'lotes' ? 'btn-primary shadow-sm' : 'btn-ghost text-muted-foreground hover:text-foreground'
            }`}
          >
            <FlaskConical size={14} /> Lotes de Producción ({lotesList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fenologia')}
            className={`btn btn-sm h-8 px-2.5 text-xs flex items-center gap-1.5 font-mono whitespace-nowrap rounded-lg ${
              activeTab === 'fenologia' ? 'btn-primary shadow-sm' : 'btn-ghost text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sprout size={14} /> Fenología ({fenologiaList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sensorial')}
            className={`btn btn-sm h-8 px-2.5 text-xs flex items-center gap-1.5 font-mono whitespace-nowrap rounded-lg ${
              activeTab === 'sensorial' ? 'btn-primary shadow-sm' : 'btn-ghost text-muted-foreground hover:text-foreground'
            }`}
          >
            <Coffee size={14} /> Perfil Sensorial Barista
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('biomasa')}
            className={`btn btn-sm h-8 px-2.5 text-xs flex items-center gap-1.5 font-mono whitespace-nowrap rounded-lg ${
              activeTab === 'biomasa' ? 'btn-primary shadow-sm' : 'btn-ghost text-muted-foreground hover:text-foreground'
            }`}
          >
            <Trees size={14} /> Biomasa & CO₂
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`btn btn-sm h-8 px-2.5 text-xs flex items-center gap-1.5 font-mono whitespace-nowrap rounded-lg ${
              activeTab === 'qr' ? 'btn-primary shadow-sm' : 'btn-ghost text-muted-foreground hover:text-foreground'
            }`}
          >
            <QrCode size={14} /> Códigos QR & Enlaces
          </button>
        </div>

        {/* Contenido Dinámico por Pestaña */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[300px]">
          {/* TAB 1: LOTES DE PRODUCCIÓN */}
          {activeTab === 'lotes' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Selecciona una partida registrada o pulsa editar para modificar cualquier constante analítica antes de inyectarla.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const newLote: EditableLoteData = {
                      codigo: `LOTE-${new Date().getFullYear()}-NUEVO-${String(lotesList.length + 1).padStart(2, '0')}`,
                      especie: 'Nueva Variedad Botánica',
                      cientifico: 'Especie nativa',
                      cuenca: 'Cuenca Río Chepu · Chiloé',
                      paralelo: "42°08'S · 73°59'W",
                      fechaRecoleccion: 'Temporada en curso',
                      polenPorcentaje: '85.0% polen nativo',
                      humedad: '17.0%',
                      ph: '3.9',
                      conductividad: '0.70 mS/cm',
                      hmf: '4.0 mg/kg',
                      textura: 'Cristalización fina cremada en frío',
                    };
                    setLotesList([newLote, ...lotesList]);
                    setSelectedLoteIndex(0);
                    setCurrentLoteForm(newLote);
                    setIsEditingLote(true);
                  }}
                  className="btn btn-outline btn-xs h-7 px-2 font-mono text-[11px] flex items-center gap-1 text-primary border-primary/30"
                >
                  <Plus size={12} />
                  <span>+ Crear Lote</span>
                </button>
              </div>

              {/* Selector de Lotes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {lotesList.map((l, idx) => (
                  <div
                    key={`${l.codigo}-${idx}`}
                    onClick={() => {
                      setSelectedLoteIndex(idx);
                      setCurrentLoteForm(l);
                      setQrBatchCode(l.codigo);
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      selectedLoteIndex === idx
                        ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40'
                        : 'border-border bg-surface-sunken/40 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] text-primary font-bold">{l.codigo}</span>
                      {selectedLoteIndex === idx && <CheckCircle2 size={13} className="text-primary" />}
                    </div>
                    <p className="text-xs font-semibold text-foreground truncate">{l.especie}</p>
                    <p className="text-[10px] text-muted-foreground italic truncate">{l.cuenca}</p>
                    <div className="mt-1.5 pt-1.5 border-t border-border/40 text-[9px] font-mono text-muted-foreground flex justify-between">
                      <span>Hum: {l.humedad}</span>
                      <span>pH: {l.ph}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Editor en Vivo de Parámetros del Lote Seleccionado */}
              <div className="p-3.5 rounded-xl border border-border bg-surface-sunken/60 space-y-3">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <Sliders size={14} className="text-primary" />
                    <span className="text-xs font-mono font-semibold text-primary">
                      {isEditingLote ? 'MODO EDICIÓN DE PARÁMETROS' : 'PARÁMETROS DEL LOTE'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingLote(!isEditingLote)}
                    className="btn btn-ghost btn-xs h-6 px-2 text-[11px] font-mono text-primary flex items-center gap-1"
                  >
                    <Edit3 size={11} />
                    <span>{isEditingLote ? 'Ocultar Editor' : 'Personalizar Valores'}</span>
                  </button>
                </div>

                {isEditingLote ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs font-mono">
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Código de Lote</label>
                      <input
                        type="text"
                        value={currentLoteForm.codigo}
                        onChange={(e) => setCurrentLoteForm({ ...currentLoteForm, codigo: e.target.value })}
                        className="input-field w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Variedad / Especie</label>
                      <input
                        type="text"
                        value={currentLoteForm.especie}
                        onChange={(e) => setCurrentLoteForm({ ...currentLoteForm, especie: e.target.value })}
                        className="input-field w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Nombre Científico</label>
                      <input
                        type="text"
                        value={currentLoteForm.cientifico}
                        onChange={(e) => setCurrentLoteForm({ ...currentLoteForm, cientifico: e.target.value })}
                        className="input-field w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Cuenca Geográfica</label>
                      <input
                        type="text"
                        value={currentLoteForm.cuenca}
                        onChange={(e) => setCurrentLoteForm({ ...currentLoteForm, cuenca: e.target.value })}
                        className="input-field w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Humedad</label>
                      <input
                        type="text"
                        value={currentLoteForm.humedad}
                        onChange={(e) => setCurrentLoteForm({ ...currentLoteForm, humedad: e.target.value })}
                        className="input-field w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">pH</label>
                      <input
                        type="text"
                        value={currentLoteForm.ph}
                        onChange={(e) => setCurrentLoteForm({ ...currentLoteForm, ph: e.target.value })}
                        className="input-field w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Conductividad</label>
                      <input
                        type="text"
                        value={currentLoteForm.conductividad}
                        onChange={(e) => setCurrentLoteForm({ ...currentLoteForm, conductividad: e.target.value })}
                        className="input-field w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">HMF</label>
                      <input
                        type="text"
                        value={currentLoteForm.hmf}
                        onChange={(e) => setCurrentLoteForm({ ...currentLoteForm, hmf: e.target.value })}
                        className="input-field w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Polen Dominante</label>
                      <input
                        type="text"
                        value={currentLoteForm.polenPorcentaje}
                        onChange={(e) => setCurrentLoteForm({ ...currentLoteForm, polenPorcentaje: e.target.value })}
                        className="input-field w-full text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-card border border-border/60">
                      <span className="text-[9px] text-muted-foreground block">Humedad</span>
                      <span className="font-semibold text-foreground">{currentLoteForm.humedad}</span>
                    </div>
                    <div className="p-2 rounded bg-card border border-border/60">
                      <span className="text-[9px] text-muted-foreground block">pH</span>
                      <span className="font-semibold text-foreground">{currentLoteForm.ph}</span>
                    </div>
                    <div className="p-2 rounded bg-card border border-border/60">
                      <span className="text-[9px] text-muted-foreground block">Conductividad</span>
                      <span className="font-semibold text-foreground">{currentLoteForm.conductividad}</span>
                    </div>
                    <div className="p-2 rounded bg-card border border-border/60">
                      <span className="text-[9px] text-muted-foreground block">HMF</span>
                      <span className="font-semibold text-foreground">{currentLoteForm.hmf}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FENOLOGÍA */}
          {activeTab === 'fenologia' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Biblioteca de acumulación térmica (GDD) y ventanas de floración botánica de la selva fría.
                </p>
                <button
                  type="button"
                  onClick={() => setIsEditingEspecie(!isEditingEspecie)}
                  className="btn btn-outline btn-xs h-7 px-2 font-mono text-[11px] flex items-center gap-1 text-primary border-primary/30"
                >
                  <Edit3 size={11} />
                  <span>{isEditingEspecie ? 'Ver Lista' : 'Personalizar Especie'}</span>
                </button>
              </div>

              {!isEditingEspecie ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {fenologiaList.map((esp, idx) => (
                    <div
                      key={`${esp.cientifico}-${idx}`}
                      onClick={() => {
                        setSelectedEspecieIndex(idx);
                        setCurrentEspecieForm(esp);
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedEspecieIndex === idx
                          ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40'
                          : 'border-border bg-surface-sunken/40 hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">{esp.comun}</span>
                        {selectedEspecieIndex === idx && <CheckCircle2 size={14} className="text-primary" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground italic">
                        {esp.cientifico} ({esp.familia})
                      </p>
                      <div className="mt-2 text-[10px] font-mono text-muted-foreground space-y-0.5">
                        <p className="text-primary font-semibold">Floración: {esp.floracionMeses}</p>
                        <p>GDD Requerido: {esp.gddRequerido}°C (Tbase: {esp.tbase}°C)</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-border bg-surface-sunken/60 space-y-2.5 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Nombre Común</label>
                      <input
                        type="text"
                        value={currentEspecieForm.comun}
                        onChange={(e) => setCurrentEspecieForm({ ...currentEspecieForm, comun: e.target.value })}
                        className="input-field w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Nombre Científico</label>
                      <input
                        type="text"
                        value={currentEspecieForm.cientifico}
                        onChange={(e) => setCurrentEspecieForm({ ...currentEspecieForm, cientifico: e.target.value })}
                        className="input-field w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Familia Botánica</label>
                      <input
                        type="text"
                        value={currentEspecieForm.familia}
                        onChange={(e) => setCurrentEspecieForm({ ...currentEspecieForm, familia: e.target.value })}
                        className="input-field w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Meses de Floración</label>
                      <input
                        type="text"
                        value={currentEspecieForm.floracionMeses}
                        onChange={(e) => setCurrentEspecieForm({ ...currentEspecieForm, floracionMeses: e.target.value })}
                        className="input-field w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">Temperatura Base (°C)</label>
                      <input
                        type="number"
                        value={currentEspecieForm.tbase}
                        onChange={(e) => setCurrentEspecieForm({ ...currentEspecieForm, tbase: Number(e.target.value) })}
                        className="input-field w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground block mb-0.5">GDD Acumulado (°C)</label>
                      <input
                        type="number"
                        value={currentEspecieForm.gddRequerido}
                        onChange={(e) => setCurrentEspecieForm({ ...currentEspecieForm, gddRequerido: Number(e.target.value) })}
                        className="input-field w-full text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Descripción / Característica</label>
                    <textarea
                      rows={2}
                      value={currentEspecieForm.descripcion}
                      onChange={(e) => setCurrentEspecieForm({ ...currentEspecieForm, descripcion: e.target.value })}
                      className="input-field w-full text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PERFIL SENSORIAL BARISTA (CAFETERÍAS) */}
          {activeTab === 'sensorial' && (
            <div className="space-y-3.5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Calibra la ficha organoléptica para cartas de cafeterías de especialidad, servicio de mesa y maridaje con orígenes de café.
              </p>

              <div className="p-3.5 rounded-xl border border-border bg-surface-sunken/50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  {/* Sliders de cata */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Dulzura Enzimática</span>
                      <span className="text-primary font-bold">{sensorialSweetness} / 5</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={sensorialSweetness}
                      onChange={(e) => setSensorialSweetness(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Acidez Floral Nativa</span>
                      <span className="text-primary font-bold">{sensorialAcidity} / 5</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={sensorialAcidity}
                      onChange={(e) => setSensorialAcidity(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Flora & Complejidad</span>
                      <span className="text-primary font-bold">{sensorialFlora} / 5</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={sensorialFlora}
                      onChange={(e) => setSensorialFlora(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Cuerpo & Densidad</span>
                      <span className="text-primary font-bold">{sensorialBody} / 5</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={sensorialBody}
                      onChange={(e) => setSensorialBody(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                      Textura & Cristalización
                    </label>
                    <input
                      type="text"
                      value={sensorialTexture}
                      onChange={(e) => setSensorialTexture(e.target.value)}
                      className="input-field w-full text-xs font-mono"
                      placeholder="ej. Microcristales sedosos y untuosos"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                      Nota de Maridaje con Café de Especialidad
                    </label>
                    <textarea
                      rows={2}
                      value={sensorialPairing}
                      onChange={(e) => setSensorialPairing(e.target.value)}
                      className="input-field w-full text-xs font-mono"
                      placeholder="Armoniza con tueste medio lavado de Etiopía o Geisha; servir a menos de 40°C."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BIOMASA & IMPACTO TERRITORIAL (AUDITADO) */}
          {activeTab === 'biomasa' && (
            <div className="space-y-3.5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Datos de biomasa viva, captura de carbono y hectáreas protegidas en el bosque templado lluvioso de Chiloé para respaldar láminas de origen auditable.
              </p>

              <div className="p-3.5 rounded-xl border border-border bg-surface-sunken/50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">
                      Hectáreas Bajo Protección Activa
                    </label>
                    <input
                      type="text"
                      value={biomasaHectareas}
                      onChange={(e) => setBiomasaHectareas(e.target.value)}
                      className="input-field w-full text-xs font-mono"
                      placeholder="142"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">
                      Cuenca / Territorio de Resguardo
                    </label>
                    <input
                      type="text"
                      value={biomasaCuenca}
                      onChange={(e) => setBiomasaCuenca(e.target.value)}
                      className="input-field w-full text-xs font-mono"
                      placeholder="Cuenca Río Chepu · Chiloé"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">
                      Ratio CO₂e Evitado (Metodología Chiloé)
                    </label>
                    <input
                      type="text"
                      value={biomasaCO2Evitado}
                      onChange={(e) => setBiomasaCO2Evitado(e.target.value)}
                      className="input-field w-full text-xs font-mono"
                      placeholder="2.4 kg CO₂e / kg miel"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">
                      Censo de Dosel Maduro (Árboles)
                    </label>
                    <input
                      type="text"
                      value={biomasaArbolesCensados}
                      onChange={(e) => setBiomasaArbolesCensados(e.target.value)}
                      className="input-field w-full text-xs font-mono"
                      placeholder="1,840 árboles nativos"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40">
                  <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                    Especies Nectarias Clave del Dosel
                  </label>
                  <input
                    type="text"
                    value={biomasaEspeciesClave}
                    onChange={(e) => setBiomasaEspeciesClave(e.target.value)}
                    className="input-field w-full text-xs font-mono"
                    placeholder="Ulmo, Tiaca, Melí, Canelo y Notro"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: QR SOBERANO & ENLACES INTELIGENTES */}
          {activeTab === 'qr' && (
            <div className="space-y-3.5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Genera bloques QR vectoriales enlazados a entidades reales de Núcleo (catálogo, pasaportes SAG o club).
              </p>

              <div className="space-y-3 p-3.5 rounded-xl border border-border bg-surface-sunken/40">
                {/* Destino */}
                <div>
                  <label className="text-xs font-mono text-muted-foreground block mb-1">
                    Tipo de Destino del Código QR
                  </label>
                  <select
                    value={qrDest}
                    onChange={(e) => handleDestinationChange(e.target.value as any)}
                    className="input-field w-full text-xs font-mono"
                  >
                    <option value="resena">Cata en Mesa & Reseña Directa (Cafeterías / Clientes)</option>
                    <option value="lote">Pasaporte de Trazabilidad SAG de Lote</option>
                    <option value="producto">Ficha de Producto del Catálogo Oficial</option>
                    <option value="club">Club Legado del Bosque (Membresía & Beneficios)</option>
                    <option value="custom">Enlace Personalizado / Externo</option>
                  </select>
                </div>

                {/* Parámetros según destino */}
                {(qrDest === 'resena' || qrDest === 'lote') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                        Lote Seleccionado (Base de Datos)
                      </label>
                      <select
                        value={qrBatchCode}
                        onChange={(e) => setQrBatchCode(e.target.value)}
                        className="input-field w-full text-xs font-mono"
                      >
                        {lotesList.map((l) => (
                          <option key={l.codigo} value={l.codigo}>
                            {l.codigo} · {l.especie}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                        Código Manual / Ajuste
                      </label>
                      <input
                        type="text"
                        value={qrBatchCode}
                        onChange={(e) => setQrBatchCode(e.target.value)}
                        className="input-field w-full text-xs font-mono"
                        placeholder="ej. LOTE-2026-ULMO-01"
                      />
                    </div>
                  </div>
                )}

                {qrDest === 'producto' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                        Producto del Catálogo
                      </label>
                      <select
                        value={qrProductSlug}
                        onChange={(e) => setQrProductSlug(e.target.value)}
                        className="input-field w-full text-xs font-mono"
                      >
                        {productosList.map((p) => (
                          <option key={p.id} value={p.slug || p.id}>
                            {p.nombre} ({p.formato || 'Catálogo'})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                        Slug en Tienda
                      </label>
                      <input
                        type="text"
                        value={qrProductSlug}
                        onChange={(e) => setQrProductSlug(e.target.value)}
                        className="input-field w-full text-xs font-mono"
                        placeholder="ej. miel-de-ulmo-500g"
                      />
                    </div>
                  </div>
                )}

                {qrDest === 'custom' && (
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                      URL Personalizada
                    </label>
                    <input
                      type="url"
                      value={qrCustomUrl}
                      onChange={(e) => setQrCustomUrl(e.target.value)}
                      className="input-field w-full text-xs font-mono"
                      placeholder="https://tienda.obrerayzangano.cl/..."
                    />
                  </div>
                )}

                {/* Textos editables del bloque */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/40">
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                      Título Superior del QR
                    </label>
                    <input
                      type="text"
                      value={qrTitle}
                      onChange={(e) => setQrTitle(e.target.value)}
                      className="input-field w-full text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                      Bajada / Instrucción
                    </label>
                    <input
                      type="text"
                      value={qrSubtitle}
                      onChange={(e) => setQrSubtitle(e.target.value)}
                      className="input-field w-full text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Acciones del Footer del Modal */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between shrink-0">
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm text-xs px-3 sm:px-4">
            Cancelar
          </button>

          {activeTab === 'lotes' && (
            <button
              type="button"
              onClick={handleInjectLote}
              className="btn btn-primary btn-sm text-xs px-3 sm:px-4 flex items-center gap-1.5 shadow-sm"
            >
              <FlaskConical size={14} />
              Inyectar Parámetros de Lote ({currentLoteForm.codigo})
            </button>
          )}

          {activeTab === 'fenologia' && (
            <button
              type="button"
              onClick={handleInjectFenologia}
              className="btn btn-primary btn-sm text-xs px-3 sm:px-4 flex items-center gap-1.5 shadow-sm"
            >
              <Sprout size={14} />
              Inyectar Monografía de {currentEspecieForm.comun}
            </button>
          )}

          {activeTab === 'sensorial' && (
            <button
              type="button"
              onClick={handleInjectSensorial}
              className="btn btn-primary btn-sm text-xs px-3 sm:px-4 flex items-center gap-1.5 shadow-sm"
            >
              <Coffee size={14} />
              Inyectar Perfil Sensorial Barista
            </button>
          )}

          {activeTab === 'biomasa' && (
            <button
              type="button"
              onClick={handleInjectBiomasa}
              className="btn btn-primary btn-sm text-xs px-3 sm:px-4 flex items-center gap-1.5 shadow-sm"
            >
              <Trees size={14} />
              Inyectar Métricas de Biomasa ({biomasaHectareas} ha)
            </button>
          )}

          {activeTab === 'qr' && (
            <button
              type="button"
              onClick={handleInjectQR}
              className="btn btn-primary btn-sm text-xs px-3 sm:px-4 flex items-center gap-1.5 shadow-sm"
            >
              <QrCode size={14} />
              Insertar Bloque QR en Lámina
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
