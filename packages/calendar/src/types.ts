export type CalendarioEventType =
  | 'feria'
  | 'apicultura'
  | 'marketing'
  | 'historico'
  | 'inspeccion'
  | 'personal'
  | 'reunion'
  | 'logistica'
  | 'otro';

/** Categorías de eventos creados por el usuario (tabla calendario_eventos) */
export type CalendarioUserCategory =
  | 'personal'
  | 'reunion'
  | 'feria'
  | 'apicultura'
  | 'marketing'
  | 'logistica'
  | 'otro';

export const USER_CATEGORIES: {
  value: CalendarioUserCategory;
  label: string;
  color: string;
}[] = [
  { value: 'personal', label: 'Personal', color: '#5AC8FA' },
  { value: 'reunion', label: 'Reunión', color: '#FF9500' },
  { value: 'feria', label: 'Feria', color: '#FFD60A' },
  { value: 'apicultura', label: 'Apicultura', color: '#30D158' },
  { value: 'marketing', label: 'Marketing', color: '#BF5AF2' },
  { value: 'logistica', label: 'Logística', color: '#FF375F' },
  { value: 'otro', label: 'Otro', color: '#8E8E93' },
];

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
      | 'inspecciones';
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
  otro: { href: '/calendario', label: 'Calendario' },
};

export function resolveEventToolLink(type: CalendarioEventType): {
  href: string;
  label: string;
} {
  return EVENT_TOOL_LINKS[type] ?? { href: '/calendario', label: 'Calendario' };
}

export function categoryToType(cat: string): CalendarioEventType {
  if (
    cat === 'feria' ||
    cat === 'apicultura' ||
    cat === 'marketing' ||
    cat === 'personal' ||
    cat === 'reunion' ||
    cat === 'logistica' ||
    cat === 'otro'
  ) {
    return cat;
  }
  return 'personal';
}
