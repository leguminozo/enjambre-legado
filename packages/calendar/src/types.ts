export type CalendarioEventType = 'feria' | 'apicultura' | 'marketing' | 'historico' | 'inspeccion';

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
    table: 'eventos' | 'calendario_tasks' | 'marketing_campaigns' | 'marketing_posts' | 'cosechas' | 'lotes' | 'inspecciones';
    originalId: string;
    rawData?: Record<string, unknown>;
  };
  editable: boolean;
}
