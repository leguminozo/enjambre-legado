import type { ComponentType } from 'react';

/**
 * Contextos donde un widget puede montarse. Cada vista host elige su conjunto
 * vía `widgetsPara(contexto)`; un widget puede vivir en varios contextos.
 */
export type WidgetContexto = 'apicultor' | 'inicio-admin' | 'inicio-territorial';

export interface WidgetDef {
  /** Clave única del widget (identificador del registro). */
  key: string;
  titulo: string;
  descripcion?: string;
  /** Componente autocontenido: se monta y consume sus propios datos. */
  Componente: ComponentType;
  contextos: WidgetContexto[];
  /** Roles con permiso para ver el widget (ej. ['admin']). Si se omite, visible para todos. */
  roles?: string[];
}
