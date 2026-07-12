export type CalendarioEventType =
  | 'feria'
  | 'apicultura'
  | 'marketing'
  | 'historico'
  | 'inspeccion';

export interface CalendarioEvent {
  id: string;
  type: CalendarioEventType;
  title: string;
  startDate: Date;
  endDate?: Date;
  allDay?: boolean;
  status?: string;
  color?: string;
  source: {
    table:
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
  /** Ruta en Núcleo hacia la herramienta de origen (bidireccional) */
  toolHref?: string;
  toolLabel?: string;
}

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
};

export function resolveEventToolLink(type: CalendarioEventType): {
  href: string;
  label: string;
} {
  return EVENT_TOOL_LINKS[type] ?? { href: '/calendario', label: 'Calendario' };
}
