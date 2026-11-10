export type CalendarioEventType =
  | 'feria'
  | 'apicultura'
  | 'marketing'
  | 'historico'
  | 'inspeccion'
  | 'personal'
  | 'reunion'
  | 'logistica'
  | 'tratamiento'
  | 'cosecha'
  | 'transhumancia'
  | 'reforestacion'
  | 'alerta'
  | 'otro';

/** Categorías de eventos creados por el usuario (tabla calendario_eventos) */
export type CalendarioUserCategory =
  | 'personal'
  | 'reunion'
  | 'feria'
  | 'apicultura'
  | 'marketing'
  | 'logistica'
  | 'inspeccion'
  | 'tratamiento'
  | 'cosecha'
  | 'transhumancia'
  | 'reforestacion'
  | 'otro';

export interface CategoryOption {
  value: CalendarioUserCategory;
  label: string;
  color: string;
  description?: string;
}

export const USER_CATEGORIES: CategoryOption[] = [
  { value: 'personal', label: 'Personal', color: '#5AC8FA' },
  { value: 'reunion', label: 'Reunión', color: '#FF9500' },
  { value: 'feria', label: 'Feria', color: '#FFD60A' },
  { value: 'apicultura', label: 'Apicultura', color: '#30D158' },
  { value: 'marketing', label: 'Marketing', color: '#BF5AF2' },
  { value: 'logistica', label: 'Logística', color: '#FF375F' },
  { value: 'inspeccion', label: 'Inspección', color: '#32ADE6' },
  { value: 'tratamiento', label: 'Tratamiento / Resguardo', color: '#FF453A' },
  { value: 'cosecha', label: 'Recolección', color: '#E5A93C' },
  { value: 'transhumancia', label: 'Trashumancia', color: '#64D2FF' },
  { value: 'reforestacion', label: 'Reforestación', color: '#34C759' },
  { value: 'otro', label: 'Otro', color: '#8E8E93' },
];

/** Categorías específicas y válidas para el rol territorial y apícola (sin polución comercial) */
export const TERRITORIAL_USER_CATEGORIES: CategoryOption[] = [
  { value: 'apicultura', label: 'Manejo Apícola', color: '#30D158', description: 'Revisión general, alimentación, postura o cambio de marcos' },
  { value: 'inspeccion', label: 'Inspección Sanitaria', color: '#32ADE6', description: 'Monitoreo de Varroa, cámara de cría, postura de reina' },
  { value: 'tratamiento', label: 'Tratamiento / Resguardo', color: '#FF453A', description: 'Tratamiento sanitario orgánico o resguardo preventivo por fumigación' },
  { value: 'cosecha', label: 'Recolección Estacional', color: '#E5A93C', description: 'Postura de alzas melarias, extracción y recolección de miel' },
  { value: 'transhumancia', label: 'Trashumancia / Traslado', color: '#64D2FF', description: 'Movimiento de apiarios o asentamiento en predio facilitador' },
  { value: 'reforestacion', label: 'Reforestación Melífera', color: '#34C759', description: 'Plantación y cuidado de especies nativas (Ulmo, Tiaca, Avellano)' },
  { value: 'reunion', label: 'Reunión / SAG', color: '#FF9500', description: 'Fiscalización, asamblea gremial territorial, acuerdo con predio' },
  { value: 'personal', label: 'Personal', color: '#5AC8FA', description: 'Actividad particular del productor o apicultor' },
  { value: 'otro', label: 'Otro', color: '#8E8E93', description: 'Otras actividades territoriales' },
];

/** Categorías para el canon macro de Núcleo (admin, gerencia, operaciones) */
export const MACRO_USER_CATEGORIES: CategoryOption[] = USER_CATEGORIES;

export interface CalendarioEvent {
  id: string;
  type: CalendarioEventType;
  title: string;
  startDate: Date;
  endDate?: Date;
  allDay?: boolean;
  status?: string;
  color?: string;
  notes?: string;
  location?: string;
  source: {
    table:
      | 'calendario_eventos'
      | 'eventos'
      | 'calendario_tasks'
      | 'marketing_campaigns'
      | 'marketing_posts'
      | 'cosechas'
      | 'lotes'
      | 'inspecciones'
      | 'alertas_fitosanitarias'
      | 'apiarios_externos';
    originalId: string;
    rawData?: Record<string, unknown>;
  };
  editable: boolean;
  toolHref?: string;
  toolLabel?: string;
}

export type CreateCalendarioEventInput = {
  title: string;
  notes?: string;
  location?: string;
  startsAt: Date;
  endsAt: Date;
  allDay?: boolean;
  category?: CalendarioUserCategory;
  color?: string;
  empresaId?: string | null;
  userId?: string | null;
};

export type UpdateCalendarioEventInput = Partial<CreateCalendarioEventInput> & {
  id: string;
};

/** Destinos canónicos en el sidebar de Núcleo */
export const EVENT_TOOL_LINKS: Record<
  CalendarioEventType,
  { href: string; label: string }
> = {
  feria: { href: '/crm?tab=ferias', label: 'CRM · Ferias' },
  apicultura: { href: '/colmenas', label: 'Colmenas' },
  marketing: { href: '/comunidad', label: 'Comunidad' },
  historico: { href: '/produccion', label: 'Producción' },
  inspeccion: { href: '/colmenas', label: 'Colmenas · Inspecciones' },
  personal: { href: '/calendario', label: 'Calendario' },
  reunion: { href: '/calendario', label: 'Calendario' },
  logistica: { href: '/operaciones', label: 'Operaciones' },
  tratamiento: { href: '/territorio/alertas', label: 'Alertas · Resguardos' },
  cosecha: { href: '/colmenas', label: 'Colmenas · Recolecciones' },
  transhumancia: { href: '/territorio/trashumancia', label: 'Trashumancia y Predios' },
  reforestacion: { href: '/fenologia', label: 'Bosque · Fenología' },
  alerta: { href: '/territorio/alertas', label: 'Alertas Fitosanitarias' },
  otro: { href: '/calendario', label: 'Calendario' },
};

export function resolveEventToolLink(type: CalendarioEventType): {
  href: string;
  label: string;
} {
  return EVENT_TOOL_LINKS[type] ?? { href: '/calendario', label: 'Calendario' };
}

export function categoryToType(cat: string): CalendarioEventType {
  const valid: CalendarioEventType[] = [
    'feria',
    'apicultura',
    'marketing',
    'historico',
    'inspeccion',
    'personal',
    'reunion',
    'logistica',
    'tratamiento',
    'cosecha',
    'transhumancia',
    'reforestacion',
    'alerta',
    'otro',
  ];
  if (valid.includes(cat as CalendarioEventType)) {
    return cat as CalendarioEventType;
  }
  return 'personal';
}
