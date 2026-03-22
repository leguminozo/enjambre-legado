// ─── CORE DATA TYPES ──────────────────────────────────────────────────────────

export interface VarroaRecord { date: string; level: number; method: string; }
export interface PesoRecord { date: string; kg: number; note?: string; }
export interface ReinaRecord { generation: string; since: string; origin: string; status: 'activa' | 'inactiva' | 'ausente'; }
export interface InspeccionRecord {
    date: string; inspector: string; marcos_cria: number; marcos_miel: number;
    varroa: number; poblacion: 'alta' | 'media' | 'baja'; reina: boolean;
    enjambrazon_riesgo: 'bajo' | 'medio' | 'alto'; notes: string; foto?: string;
}
export interface CostoColmena {
    horas_anuales: number; costo_hora: number; amortizacion_cajon: number;
    insumos_anuales: number; produccion_kg: number;
}

export interface Colmena {
    id: string; name: string; location: string; lat: number; lng: number;
    health: 'optimal' | 'attention' | 'risk';
    queen: string; reinaHistory: ReinaRecord[];
    lastInspection: string; inspecciones: InspeccionRecord[];
    production: number;
    pesoHistory: PesoRecord[];
    varroaHistory: VarroaRecord[];
    floracion: string;
    treatments: string[];
    notes: string;
    costos: CostoColmena;
    blockchainHash: string;
    loteActivo: string;
    alzas: number;
    nucleosCandidatos: boolean;
}

export interface Product {
    id: string; name: string; description: string; price: number; format: string;
    impactTrees: number; emoji: string; stock: number; category: string;
}
export interface TimelineEvent { year: number; label: string; description: string; active?: boolean; }
export interface MapMarker {
    id: string; type: 'obrera' | 'zangano' | 'nectar' | 'tree' | 'feria';
    name: string; lat: number; lng: number; health?: 'optimal' | 'attention' | 'risk'; details?: string;
}

// Calendario cíclico mielero
export interface CalendarioTask {
    id: string; week: number; month: string; category: 'inspeccion' | 'cosecha' | 'tratamiento' | 'reforestacion' | 'transhumancia' | 'cera';
    title: string; colmena?: string; priority: 'alta' | 'media' | 'baja';
    done: boolean; notes?: string;
}

// Predicción flujo de néctar IA
export interface FlowPrediction {
    date: string; floracion: string; flujoIndex: number; // 0-100
    temperatura: number; humedad: number; prediccionKg: number;
    confianza: number; // %
}

// Árbol plantado para trazabilidad
export interface ArbolPlantado {
    id: string; especie: string; cantidad: number; fecha: string;
    sector: string; coordenadas: { lat: number; lng: number };
    co2_ton: number; lotesMiel: string[]; foto?: string; status: 'joven' | 'creciendo' | 'adulto';
}

// ─── COLMENAS (completo) ──────────────────────────────────────────────────────
export const colmenas: Colmena[] = [
    {
        id: 'c1', name: 'Colmena Ulmo Mayor', location: 'Apiario Pureo Norte',
        lat: -42.48, lng: -73.72, health: 'optimal',
        queen: 'Reina Dorada 2024 – 2ª generación',
        reinaHistory: [
            { generation: '1ª gen – Silvestre', since: '2021-10', origin: 'Captura bosque Pureo', status: 'inactiva' },
            { generation: '2ª gen – Dorada', since: '2024-02', origin: 'Cría interna Ulmo Mayor', status: 'activa' },
        ],
        lastInspection: '2026-02-25',
        inspecciones: [
            { date: '2026-02-25', inspector: 'Cristina', marcos_cria: 8, marcos_miel: 6, varroa: 1.2, poblacion: 'alta', reina: true, enjambrazon_riesgo: 'bajo', notes: 'Todo excelente. Listos para alza extra.' },
            { date: '2026-01-18', inspector: 'Cristina', marcos_cria: 7, marcos_miel: 4, varroa: 1.5, poblacion: 'alta', reina: true, enjambrazon_riesgo: 'bajo', notes: 'Floración ulmo comenzando.' },
            { date: '2025-12-10', inspector: 'Cristina', marcos_cria: 5, marcos_miel: 3, varroa: 2.1, poblacion: 'media', reina: true, enjambrazon_riesgo: 'bajo', notes: 'Pre-temporada. Tratamiento preventivo.' },
        ],
        production: 38, loteActivo: '2026-ULM-047', alzas: 2, nucleosCandidatos: true,
        pesoHistory: [
            { date: '2026-02-01', kg: 42.5, note: 'Inicio temporada' },
            { date: '2026-02-08', kg: 45.2 }, { date: '2026-02-15', kg: 48.8 },
            { date: '2026-02-22', kg: 51.3, note: 'Pico ulmo' }, { date: '2026-03-01', kg: 52.1 },
        ],
        varroaHistory: [
            { date: '2025-12-10', level: 2.1, method: 'Lavado alcohol 300 abejas' },
            { date: '2026-01-18', level: 1.5, method: 'Lavado alcohol' },
            { date: '2026-02-25', level: 1.2, method: 'Lavado alcohol' },
        ],
        floracion: 'Ulmo + Tepú',
        treatments: ['Ácido oxálico (dic 2025)'],
        notes: 'Colmena líder, excelente temperamento. Candidata producción de núcleos.',
        costos: { horas_anuales: 48, costo_hora: 3500, amortizacion_cajon: 12000, insumos_anuales: 8000, produccion_kg: 38 },
        blockchainHash: '0x7f4a2e1b9c3d5f0a8e2b4c6d',
    },
    {
        id: 'c2', name: 'Colmena Tepú del Río', location: 'Apiario Pureo Norte',
        lat: -42.482, lng: -73.718, health: 'optimal',
        queen: 'Reina Silvestre 2025',
        reinaHistory: [
            { generation: '1ª gen – Silvestre', since: '2025-01', origin: 'Captura enjambre espontáneo', status: 'activa' },
        ],
        lastInspection: '2026-02-25',
        inspecciones: [
            { date: '2026-02-25', inspector: 'Cristina', marcos_cria: 7, marcos_miel: 5, varroa: 1.8, poblacion: 'alta', reina: true, enjambrazon_riesgo: 'bajo', notes: 'Buena reserva invernal. Raza tranquila.' },
            { date: '2026-01-18', inspector: 'Cristina', marcos_cria: 6, marcos_miel: 3, varroa: 2.3, poblacion: 'media', reina: true, enjambrazon_riesgo: 'bajo', notes: 'Buen desarrollo.' },
        ],
        production: 32, loteActivo: '2026-TEP-031', alzas: 1, nucleosCandidatos: false,
        pesoHistory: [
            { date: '2026-02-01', kg: 38.2 }, { date: '2026-02-08', kg: 40.1 },
            { date: '2026-02-15', kg: 42.8 }, { date: '2026-02-22', kg: 44.5 }, { date: '2026-03-01', kg: 45.0 },
        ],
        varroaHistory: [
            { date: '2026-01-18', level: 2.3, method: 'Lavado alcohol' },
            { date: '2026-02-25', level: 1.8, method: 'Lavado alcohol' },
        ],
        floracion: 'Tepú + Tiaque', treatments: [], notes: 'Buena reserva invernal',
        costos: { horas_anuales: 40, costo_hora: 3500, amortizacion_cajon: 12000, insumos_anuales: 5000, produccion_kg: 32 },
        blockchainHash: '0x3a8f1c2b7e4d9a0f5c1b2e',
    },
    {
        id: 'c3', name: 'Colmena Avellano Sur', location: 'Apiario Yerba Loza',
        lat: -42.495, lng: -73.735, health: 'attention',
        queen: 'Reina Mixta 2024',
        reinaHistory: [
            { generation: '1ª gen – Mixta', since: '2024-03', origin: 'Núcleo externo', status: 'activa' },
        ],
        lastInspection: '2026-02-20',
        inspecciones: [
            { date: '2026-02-20', inspector: 'Cristina', marcos_cria: 5, marcos_miel: 3, varroa: 3.0, poblacion: 'media', reina: true, enjambrazon_riesgo: 'medio', notes: 'Varroa en nivel 3/10. Programar segundo timol antes 10 marzo.' },
            { date: '2026-01-10', inspector: 'Cristina', marcos_cria: 4, marcos_miel: 2, varroa: 2.8, poblacion: 'media', reina: true, enjambrazon_riesgo: 'bajo', notes: 'Primer tratamiento timol aplicado.' },
        ],
        production: 22, loteActivo: '2026-AVE-022', alzas: 1, nucleosCandidatos: false,
        pesoHistory: [
            { date: '2026-02-01', kg: 29.0 }, { date: '2026-02-08', kg: 30.2 },
            { date: '2026-02-15', kg: 31.1 }, { date: '2026-02-22', kg: 31.8 }, { date: '2026-03-01', kg: 32.0 },
        ],
        varroaHistory: [
            { date: '2026-01-10', level: 2.8, method: 'Lavado alcohol' },
            { date: '2026-02-20', level: 3.0, method: 'Lavado alcohol' },
        ],
        floracion: 'Avellano + Ulmo', treatments: ['Timol (ene 2026)'],
        notes: 'Varroa moderada, monitorear',
        costos: { horas_anuales: 52, costo_hora: 3500, amortizacion_cajon: 12000, insumos_anuales: 14000, produccion_kg: 22 },
        blockchainHash: '0x9c2d4e8a1f3b6c0d7e2a',
    },
    {
        id: 'c4', name: 'Colmena Quilineja Vieja', location: 'Apiario Yerba Loza',
        lat: -42.497, lng: -73.738, health: 'risk',
        queen: 'Sin reina – requeening pendiente',
        reinaHistory: [
            { generation: '1ª gen – Vieja', since: '2020-11', origin: 'Cría interna', status: 'inactiva' },
            { generation: 'Sin reina', since: '2026-02-18', origin: 'Falleció – pendiente reemplazo', status: 'ausente' },
        ],
        lastInspection: '2026-02-18',
        inspecciones: [
            { date: '2026-02-18', inspector: 'Cristina', marcos_cria: 1, marcos_miel: 2, varroa: 4.5, poblacion: 'baja', reina: false, enjambrazon_riesgo: 'bajo', notes: 'Sin reina confirmado. Requeen URGENTE o unión con Tepú del Río.' },
            { date: '2026-01-15', inspector: 'Cristina', marcos_cria: 3, marcos_miel: 2, varroa: 3.8, poblacion: 'baja', reina: true, enjambrazon_riesgo: 'bajo', notes: 'Reina debilitada. Posible fallo inminente.' },
        ],
        production: 8, loteActivo: '2026-QUI-008', alzas: 0, nucleosCandidatos: false,
        pesoHistory: [
            { date: '2026-02-01', kg: 18.5 }, { date: '2026-02-08', kg: 17.2 },
            { date: '2026-02-15', kg: 16.8 }, { date: '2026-02-22', kg: 15.9 }, { date: '2026-03-01', kg: 15.1 },
        ],
        varroaHistory: [
            { date: '2026-01-15', level: 3.8, method: 'Lavado alcohol' },
            { date: '2026-02-18', level: 4.5, method: 'Lavado alcohol' },
        ],
        floracion: 'Tiaque', treatments: ['Ácido fórmico (feb 2026)'],
        notes: 'Población baja, evaluar unión',
        costos: { horas_anuales: 60, costo_hora: 3500, amortizacion_cajon: 12000, insumos_anuales: 18000, produccion_kg: 8 },
        blockchainHash: '0x1e5b8f2c9d4a7e0b3c6f',
    },
    {
        id: 'c5', name: 'Colmena Canelo Ancestral', location: 'Apiario Pureo Norte',
        lat: -42.478, lng: -73.725, health: 'optimal',
        queen: 'Reina Dorada 2025 – hija de Ulmo Mayor',
        reinaHistory: [
            { generation: '1ª gen – Silvestre', since: '2019-09', origin: 'Captura natural', status: 'inactiva' },
            { generation: '2ª gen – Dorada hija', since: '2025-01', origin: 'Hija de Ulmo Mayor', status: 'activa' },
        ],
        lastInspection: '2026-02-26',
        inspecciones: [
            { date: '2026-02-26', inspector: 'Cristina', marcos_cria: 9, marcos_miel: 7, varroa: 0.8, poblacion: 'alta', reina: true, enjambrazon_riesgo: 'medio', notes: 'Rendimiento excepcional. Riesgo enjambrazón creciente – preparar alza.' },
        ],
        production: 41, loteActivo: '2026-CAN-041', alzas: 2, nucleosCandidatos: true,
        pesoHistory: [
            { date: '2026-02-01', kg: 44.0 }, { date: '2026-02-08', kg: 47.5 },
            { date: '2026-02-15', kg: 51.0 }, { date: '2026-02-22', kg: 54.2 }, { date: '2026-03-01', kg: 55.5 },
        ],
        varroaHistory: [
            { date: '2026-02-26', level: 0.8, method: 'Lavado alcohol' },
        ],
        floracion: 'Ulmo', treatments: [],
        notes: 'Rendimiento excepcional, candidata a núcleos',
        costos: { horas_anuales: 44, costo_hora: 3500, amortizacion_cajon: 12000, insumos_anuales: 6000, produccion_kg: 41 },
        blockchainHash: '0x4b7c9e2f1a8d3e6b0c5a',
    },
    {
        id: 'c6', name: 'Colmena Meli', location: 'Apiario Ancud Expansión',
        lat: -41.87, lng: -73.83, health: 'optimal',
        queen: 'Reina Joven 2026',
        reinaHistory: [
            { generation: '1ª gen – Joven', since: '2026-01', origin: 'Núcleo de Canelo Ancestral', status: 'activa' },
        ],
        lastInspection: '2026-02-27',
        inspecciones: [
            { date: '2026-02-27', inspector: 'Cristina', marcos_cria: 5, marcos_miel: 4, varroa: 0.5, poblacion: 'media', reina: true, enjambrazon_riesgo: 'bajo', notes: 'Nueva colmena muy prometedora. Zona Ancud con buena floración.' },
        ],
        production: 15, loteActivo: '2026-MEL-015', alzas: 1, nucleosCandidatos: false,
        pesoHistory: [
            { date: '2026-02-01', kg: 22.0 }, { date: '2026-02-08', kg: 24.1 },
            { date: '2026-02-15', kg: 26.5 }, { date: '2026-02-22', kg: 28.8 }, { date: '2026-03-01', kg: 30.2 },
        ],
        varroaHistory: [
            { date: '2026-02-27', level: 0.5, method: 'Lavado alcohol' },
        ],
        floracion: 'Ulmo + Tiaque', treatments: [],
        notes: 'Nueva colmena de expansión, muy prometedora',
        costos: { horas_anuales: 36, costo_hora: 3500, amortizacion_cajon: 12000, insumos_anuales: 4000, produccion_kg: 15 },
        blockchainHash: '0x6d1a3f8b2c5e9d0a4f7c',
    },
];

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────
export const products: Product[] = [
    { id: 'p1', name: 'Gotas de Néctar', description: 'Sachet individual 15g de miel virgen ulmo-tepú. Dosis perfecta de bosque nativo.', price: 1200, format: 'Sachet 15g', impactTrees: 0.3, emoji: '🍯', stock: 2400, category: 'Sachets' },
    { id: 'p2', name: 'Crema Ulmo-Tepú con Cacao Nibs', description: 'Miel cremada con cacao nibs premium. Sabor profundo del bosque patagónico.', price: 8500, format: 'Frasco 250g', impactTrees: 1.2, emoji: '🍫', stock: 180, category: 'Cremas' },
    { id: 'p3', name: 'Crema con Avellanas Tostadas', description: 'Avellanas de Chiloé tostadas en miel de ulmo. Textura y sabor ancestral.', price: 9200, format: 'Frasco 250g', impactTrees: 1.2, emoji: '🌰', stock: 120, category: 'Cremas' },
    { id: 'p4', name: 'Crema con Frambuesas del Sur', description: 'Frambuesas patagónicas en miel virginal. Frescura viva del territorio.', price: 8800, format: 'Frasco 250g', impactTrees: 1.2, emoji: '🫐', stock: 95, category: 'Cremas' },
    { id: 'p5', name: 'Miel Virgen de Ulmo', description: 'Miel pura, sin proceso, directa del panal. Cosecha de bosque ancestral.', price: 12000, format: 'Frasco 500g', impactTrees: 2, emoji: '✨', stock: 340, category: 'Miel Pura' },
    { id: 'p6', name: 'Panal Natural Completo', description: 'Sección de panal intacta con miel y cera. Experiencia gastronómica única.', price: 18000, format: 'Panal ~400g', impactTrees: 3, emoji: '🐝', stock: 45, category: 'Panal' },
    { id: 'p7', name: 'Cofre Legado del Bosque', description: 'Caja premium: miel + crema + sachets + hidrolato. Un bosque entero en tus manos.', price: 35000, format: 'Cofre completo', impactTrees: 5, emoji: '🎁', stock: 60, category: 'Cofres' },
    { id: 'p8', name: 'Miel con Polen + Linaza', description: 'Superalimento: miel de ulmo, polen multifloral y semillas de linaza activada.', price: 7500, format: 'Frasco 200g', impactTrees: 1, emoji: '🌻', stock: 200, category: 'Mezclas' },
];

// ─── CALENDARIO CÍCLICO MIELERO ───────────────────────────────────────────────
export const calendarioTasks: CalendarioTask[] = [
    // Semana 9 (Mar 2026)
    { id: 'k1', week: 9, month: 'Marzo', category: 'inspeccion', title: 'Inspección Apiario Pureo Norte', colmena: 'Colmena Ulmo Mayor', priority: 'alta', done: false },
    { id: 'k2', week: 9, month: 'Marzo', category: 'tratamiento', title: '2° Tratamiento Timol – Avellano Sur', colmena: 'Colmena Avellano Sur', priority: 'alta', done: false },
    { id: 'k3', week: 9, month: 'Marzo', category: 'inspeccion', title: 'Requeening urgente – Quilineja Vieja', colmena: 'Colmena Quilineja Vieja', priority: 'alta', done: false },
    { id: 'k4', week: 9, month: 'Marzo', category: 'cosecha', title: 'Cosecha parcial alza extra – Canelo Ancestral', colmena: 'Colmena Canelo Ancestral', priority: 'media', done: false },
    { id: 'k5', week: 10, month: 'Marzo', category: 'inspeccion', title: 'Control varroa post-tratamiento', colmena: 'Colmena Avellano Sur', priority: 'alta', done: false },
    { id: 'k6', week: 10, month: 'Marzo', category: 'reforestacion', title: 'Plantar 50 ulmos – sector sur Pureo', priority: 'media', done: false },
    { id: 'k7', week: 10, month: 'Marzo', category: 'cera', title: 'Renovar marcos cera – Pureo Norte', priority: 'baja', done: false },
    { id: 'k8', week: 11, month: 'Marzo', category: 'cosecha', title: 'Cosecha principal temporada ulmo', priority: 'alta', done: false },
    { id: 'k9', week: 11, month: 'Marzo', category: 'inspeccion', title: 'Inspección pre-otoño todos los apiarios', priority: 'alta', done: false },
    { id: 'k10', week: 12, month: 'Marzo', category: 'transhumancia', title: 'Evaluación transhumancia Ancud → Pureo', priority: 'media', done: false },
    // Abril
    { id: 'k11', week: 13, month: 'Abril', category: 'inspeccion', title: 'Reducción piqueras para invierno', priority: 'alta', done: false },
    { id: 'k12', week: 14, month: 'Abril', category: 'tratamiento', title: 'Ácido oxálico sublimado – todos los apiarios', priority: 'alta', done: false },
    { id: 'k13', week: 15, month: 'Abril', category: 'reforestacion', title: 'Plantar 100 tepús – bordos estero', priority: 'media', done: false },
    { id: 'k14', week: 16, month: 'Abril', category: 'cera', title: 'Derretir y filtrar cera temporada', priority: 'baja', done: false },
    // Mayo-Junio (reposo)
    { id: 'k15', week: 18, month: 'Mayo', category: 'inspeccion', title: 'Inspección rápida reservas invernales', priority: 'alta', done: false },
    { id: 'k16', week: 20, month: 'Mayo', category: 'reforestacion', title: 'Plantación canelos – quebrada central', priority: 'media', done: false },
    // Agosto-Septiembre (preparación temporada)
    { id: 'k17', week: 33, month: 'Agosto', category: 'inspeccion', title: 'Alzas listas para temporada', priority: 'alta', done: false },
    { id: 'k18', week: 35, month: 'Septiembre', category: 'inspeccion', title: 'Inspección apertura primavera', priority: 'alta', done: false },
    { id: 'k19', week: 36, month: 'Septiembre', category: 'transhumancia', title: 'Transhumancia Ancud → Pureo Norte', priority: 'alta', done: false },
];

// ─── PREDICCIÓN FLUJO DE NÉCTAR ───────────────────────────────────────────────
export const flowPredictions: FlowPrediction[] = [
    { date: '2026-03-02', floracion: 'Tepú + Ulmo', flujoIndex: 88, temperatura: 16, humedad: 72, prediccionKg: 4.2, confianza: 91 },
    { date: '2026-03-05', floracion: 'Tepú + Ulmo', flujoIndex: 85, temperatura: 16, humedad: 75, prediccionKg: 4.0, confianza: 89 },
    { date: '2026-03-08', floracion: 'Tepú + Ulmo', flujoIndex: 82, temperatura: 14, humedad: 80, prediccionKg: 3.5, confianza: 85 },
    { date: '2026-03-12', floracion: 'Tepú (bajando)', flujoIndex: 70, temperatura: 13, humedad: 82, prediccionKg: 2.8, confianza: 80 },
    { date: '2026-03-18', floracion: 'Tiaque (inicio)', flujoIndex: 45, temperatura: 12, humedad: 85, prediccionKg: 1.8, confianza: 74 },
    { date: '2026-03-25', floracion: 'Tiaque', flujoIndex: 55, temperatura: 13, humedad: 83, prediccionKg: 2.2, confianza: 78 },
    { date: '2026-04-05', floracion: 'Avellano / Tiaque', flujoIndex: 38, temperatura: 11, humedad: 88, prediccionKg: 1.2, confianza: 70 },
    { date: '2026-04-20', floracion: 'Fin temporada', flujoIndex: 15, temperatura: 10, humedad: 90, prediccionKg: 0.4, confianza: 65 },
];

// ─── ÁRBOLES PLANTADOS ───────────────────────────────────────────────────────
export const arbolesPlantados: ArbolPlantado[] = [
    { id: 'a1', especie: 'Ulmo', cantidad: 2800, fecha: '2008–2024', sector: 'Ladera sur Pureo', coordenadas: { lat: -42.485, lng: -73.732 }, co2_ton: 140, lotesMiel: ['2024-ULM-*', '2025-ULM-*', '2026-ULM-*'], status: 'adulto' },
    { id: 'a2', especie: 'Tepú', cantidad: 800, fecha: '2012–2022', sector: 'Borde estero Pureo', coordenadas: { lat: -42.488, lng: -73.728 }, co2_ton: 40, lotesMiel: ['2024-TEP-*', '2025-TEP-*'], status: 'adulto' },
    { id: 'a3', especie: 'Tiaque', cantidad: 400, fecha: '2018–2023', sector: 'Sector norte Pureo', coordenadas: { lat: -42.476, lng: -73.722 }, co2_ton: 20, lotesMiel: ['2025-TIA-*'], status: 'creciendo' },
    { id: 'a4', especie: 'Avellano', cantidad: 300, fecha: '2020–2025', sector: 'Yerba Loza', coordenadas: { lat: -42.498, lng: -73.738 }, co2_ton: 15, lotesMiel: ['2025-AVE-*', '2026-AVE-*'], status: 'creciendo' },
    { id: 'a5', especie: 'Canelo', cantidad: 500, fecha: '2015–2024', sector: 'Quebrada central', coordenadas: { lat: -42.482, lng: -73.726 }, co2_ton: 25, lotesMiel: ['2024-CAN-*', '2025-CAN-*', '2026-CAN-*'], status: 'adulto' },
    { id: 'a6', especie: 'Ulmo', cantidad: 200, fecha: '2025–2026', sector: 'Expansión Ancud', coordenadas: { lat: -41.872, lng: -73.832 }, co2_ton: 10, lotesMiel: ['2026-MEL-*'], status: 'joven' },
];

// ─── REFLEXIONES DEL BOSQUE (historia existencial) ────────────────────────────
export const reflexiones: { fecha: string; colmena: string; foto?: string; texto: string }[] = [
    { fecha: '2026-02-26', colmena: 'Colmena Canelo Ancestral', texto: '"Las abejas de Canelo trabajan con una calma que solo da la abundancia. Cada marco lleno es un año más de legado. Cada árbol plantado es una promesa que el tiempo honra sin que nadie se lo pida."' },
    { fecha: '2026-02-20', colmena: 'Colmena Avellano Sur', texto: '"El bosque advierte a quien sabe escuchar. La varroa no es el enemigo: es el mensajero que me pide mirar más hondo. Cui­dar es también corregir, con paciencia y con timol."' },
    { fecha: '2026-02-10', colmena: 'Colmena Ulmo Mayor', texto: '"Abrir la colmena es siempre un acto de humildad. No soy yo quien decide el ritmo del panal. Soy la guardiana que llega, observa y se va sin interrumpir el legado."' },
];

// ─── TIMELINE + MAPA + ROLES (sin cambios) ────────────────────────────────────
export const timelineEvents: TimelineEvent[] = [
    { year: 2003, label: 'Inicio en Pureo', description: 'Primeras 3 colmenas en Pureo, Chiloé' },
    { year: 2008, label: 'Reforestación', description: 'Primeros 200 ulmos plantados' },
    { year: 2012, label: '1ª Tonelada', description: 'Primera tonelada de miel producida' },
    { year: 2016, label: 'Sachets', description: 'Lanzamiento Gotas de Néctar' },
    { year: 2020, label: 'Cremas Premium', description: 'Línea cremas con ingredientes del sur' },
    { year: 2023, label: '20 años', description: '2 toneladas, 4.000+ árboles plantados' },
    { year: 2025, label: 'Expansión', description: 'Apiarios en Ancud + Club Legado', active: true },
    { year: 2026, label: 'Enjambre Legado', description: 'Plataforma digital 4.0', active: true },
    { year: 2028, label: 'Meta 10 ton', description: 'Escalamiento regional' },
    { year: 2030, label: '20+ toneladas', description: 'Exportación Europa + caso de estudio mundial' },
];

export const mapMarkers: MapMarker[] = [
    { id: 'm1', type: 'obrera', name: 'Apiario Pureo Norte', lat: -42.48, lng: -73.72, health: 'optimal', details: '4 colmenas activas · 111 kg temporada' },
    { id: 'm2', type: 'obrera', name: 'Apiario Yerba Loza', lat: -42.495, lng: -73.735, health: 'attention', details: '2 colmenas · 30 kg · Monitoreo activo' },
    { id: 'm3', type: 'obrera', name: 'Apiario Ancud Expansión', lat: -41.87, lng: -73.83, health: 'optimal', details: '1 colmena nueva · Zona estratégica' },
    { id: 'm4', type: 'zangano', name: 'Feria Ancud 2026', lat: -41.868, lng: -73.825, details: 'Próxima: 15 marzo · Meta: $450.000' },
    { id: 'm5', type: 'zangano', name: 'Expansion Dalcahue', lat: -42.38, lng: -73.65, details: 'Evaluación terreno – Q3 2026' },
    { id: 'm6', type: 'nectar', name: 'Tienda Gourmet Castro', lat: -42.48, lng: -73.76, details: 'Reseller activo · 45 frascos/mes' },
    { id: 'm7', type: 'nectar', name: 'Mercado Puqueldón', lat: -42.62, lng: -73.67, details: 'Punto de venta quincenal' },
    { id: 'm8', type: 'tree', name: 'Bosque Regenerado Pureo', lat: -42.485, lng: -73.73, details: '4.200 ulmos plantados · 210 ton CO₂ secuestrado' },
    { id: 'm9', type: 'tree', name: 'Reforestación Yerba Loza', lat: -42.50, lng: -73.74, details: '800 nativos plantados · 40 ton CO₂' },
    { id: 'm10', type: 'feria', name: 'ExpoMundoRural Santiago', lat: -33.45, lng: -70.65, details: 'Anual · Ventas 2025: $1.800.000' },
];

export const roleLabels: Record<string, string> = {
    apicultor: 'Apicultor / Colmenero', vendedor: 'Vendedor / Comercial', gerente: 'Gerente / Dueño',
    logistica: 'Logística y Operaciones', marketing: 'Marketing y Comunidad', cliente: 'Cliente Final',
};

export const roleGreetings: Record<string, { greeting: string; title: string; subtitle: string }> = {
    apicultor: { greeting: 'Buenos días, Obrera del bosque 🐝', title: 'El ciclo del ulmo guía tu día', subtitle: 'Tus colmenas respiran salud. La floración de tepú alcanzará su pico en 12 días según la predicción climática.' },
    vendedor: { greeting: 'Hola, Embajador del Legado 🍯', title: 'Cada venta planta raíces nuevas', subtitle: 'Tienes 3 rutas planificadas esta semana y la Feria de Ancud se acerca. Tu catálogo vivo está listo.' },
    gerente: { greeting: 'Bienvenida, Visión del Enjambre 👑', title: 'El legado crece: cada decisión transforma el bosque', subtitle: 'Producción en 2.8 ton (+18% vs 2025). Margen por sachet: 72%. El simulador proyecta 5 ton para 2027.' },
    logistica: { greeting: 'Hola, Arquitecto de Flujos 📦', title: 'Del panal al consumidor, sin perder una gota', subtitle: '12 envíos pendientes. Stock en Castro óptimo. Ruta Chiloé→Santiago: camión sale jueves.' },
    marketing: { greeting: 'Hola, Narrador del Bosque 🌿', title: 'La historia de cada árbol merece ser contada', subtitle: 'Club Legado: 47 guardianes activos. Próxima campaña: "Regala un árbol con cada cofre" lanza el 8 de marzo.' },
    cliente: { greeting: '¡Bienvenido, Guardián del Legado! 🌳', title: 'Tu compra regenera bosque nativo', subtitle: 'Has ayudado a plantar 12 árboles y secuestrar 0.6 ton de CO₂. Gracias por ser parte del legado.' },
};
