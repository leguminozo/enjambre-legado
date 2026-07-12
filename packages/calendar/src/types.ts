export type OmniEventType = 'feria' | 'apicultura' | 'marketing' | 'historico' | 'inspeccion';

export interface OmniEvent {
  id: string;
  type: OmniEventType;
  title: string;
  startDate: Date;
  endDate?: Date;
  allDay?: boolean;
  status?: string;
  color?: string; // Optional hex or class
  source: {
    table: 'eventos' | 'calendario_tasks' | 'marketing_campaigns' | 'marketing_posts' | 'cosechas' | 'lotes' | 'inspecciones';
    originalId: string;
    rawData?: Record<string, unknown>;
  };
  editable: boolean;
}
