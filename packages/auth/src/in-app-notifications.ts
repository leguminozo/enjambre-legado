export type InAppBellNotification = {
  id: string | number;
  title: string;
  message: string;
  time?: string;
  type?: 'default' | 'success' | 'warning' | 'error' | 'gold';
  href?: string;
  read?: boolean;
};

export type InAppNotificationRow = {
  id: string;
  channel: string;
  created_at: string;
  created_by: string | null;
  recipient_user_id?: string | null;
  body: string | null;
  subject: string | null;
  recipient: string | null;
  status: string;
  provider_response: unknown;
};

export type InAppNotificationApp = 'tienda' | 'nucleo';

export type AlertSeverity = 'critical' | 'warning' | 'success';

export function inferNotificationSeverity(
  subject: string | null,
  providerResponse: unknown,
): AlertSeverity {
  const meta = providerResponse as Record<string, unknown> | null;
  const raw = meta?.severity;
  if (raw === 'critical' || raw === 'warning' || raw === 'success') return raw;

  const text = (subject ?? '').toLowerCase();
  if (text.includes('error') || text.includes('fallo') || text.includes('crític')) return 'critical';
  if (text.includes('pedido') || text.includes('despach') || text.includes('stock')) return 'warning';
  return 'success';
}

export type InAppHrefContext = {
  role?: string | null;
  category?: string | null;
  source?: string | null;
  entity?: string | null;
};

const ADMIN_ONLY_HREFS = new Set([
  '/operaciones',
  '/contable',
  '/sii',
  '/editor-tienda',
  '/banco',
  '/crm',
]);

/**
 * Destino de la campana. Una sola campana central: el destino se resuelve
 * por source/category/entity primero y por texto solo como respaldo.
 * Nunca manda a un rol sin guard a gerencia (assertHrefAllowedForRole).
 */
export function resolveInAppHref(
  subject: string | null,
  app: InAppNotificationApp,
  ctx: InAppHrefContext = {},
): string {
  const text = (subject ?? '').toLowerCase();
  const role = ctx.role ?? '';
  const category = ctx.category ?? '';
  const source = ctx.source ?? '';
  const entity = ctx.entity ?? '';

  if (app === 'tienda') {
    if (text.includes('floraci') || category === 'floracion') return '/perfil/alertas';
    if (text.includes('pedido') || text.includes('despach') || category === 'pedidos') {
      return '/perfil/pedidos';
    }
    return '/perfil/alertas';
  }

  // Centro único: stock crítico por entidad, antes que cualquier texto.
  if (source === 'stock_critico' || category === 'sistema' || source === 'sistema') {
    const isLote =
      entity === 'lote' ||
      source === 'lotes' ||
      category === 'lotes' ||
      text.includes('lote') ||
      text.includes('granel') ||
      text.includes('recolección') ||
      text.includes('recoleccion');
    const isProducto =
      entity === 'producto' ||
      entity === 'inventario_item' ||
      category === 'inventario' ||
      text.includes('quiebre') ||
      text.includes('stock') ||
      text.includes('reposición') ||
      text.includes('reposicion') ||
      text.includes('inventario');
    if (isLote && (role === 'admin' || role === 'gerente' || role === 'operador' || role === 'colaborador')) {
      return '/produccion/lotes';
    }
    if (isProducto && (role === 'admin' || role === 'gerente' || role === 'operador' || role === 'colaborador')) {
      return '/produccion/inventario';
    }
    // Otros roles no tienen guard de producción: caen a inicio (filtrado por categoría los oculta).
    if (isLote || isProducto) return '/inicio';
  }

  // Umbral POS (campo): solo quien opera feria lo acciona.
  if (source === 'pos_threshold') {
    if (role === 'admin' || role === 'gerente') return '/monitor-feria';
    return '/inicio';
  }

  if (role === 'territorial') {
    if (category === 'floracion' || text.includes('floraci')) return '/fenologia';
    if (source === 'trashumancia' || text.includes('trashuman')) {
      return '/territorio/trashumancia';
    }
    if (
      source === 'alerta_fitosanitaria' ||
      text.includes('fitosanit') ||
      (category === 'territorio' && text.includes('alerta'))
    ) {
      return '/territorio/alertas';
    }
    if (category === 'territorio' || source === 'censo' || source === 'registro_territorial') {
      return '/territorio';
    }
    return '/inicio';
  }

  if (role === 'apicultor') {
    if (text.includes('colmena') || text.includes('cuaderno')) return '/colmenas';
    if (category === 'floracion' || text.includes('floraci')) return '/calendario';
    return '/inicio';
  }

  if (role === 'admin' || role === 'gerente' || role === 'operador' || role === 'colaborador') {
    if (text.includes('pedido') || text.includes('despach') || category === 'pedidos') {
      return '/operaciones';
    }
    if (text.includes('colmena') || text.includes('floraci')) return '/colmenas';
    return '/inicio';
  }

  if (role === 'rep_ventas') {
    if (category === 'pedidos' || text.includes('pedido') || text.includes('comisi')) return '/inicio';
    return '/inicio';
  }

  if (text.includes('pedido') || text.includes('despach')) return '/inicio';
  if (text.includes('colmena') || text.includes('floraci')) return '/inicio';
  return '/inicio';
}

export function assertHrefAllowedForRole(href: string, role: string | null | undefined): string {
  if (role === 'admin' || role === 'gerente') return href;
  if (ADMIN_ONLY_HREFS.has(href) || href.startsWith('/operaciones')) return '/inicio';
  return href;
}

export function mapInAppNotificationRow(
  row: InAppNotificationRow,
  app: InAppNotificationApp,
  ctx: InAppHrefContext = {},
): InAppBellNotification {
  const meta = (row.provider_response ?? {}) as Record<string, unknown>;
  const category = typeof meta.category === 'string' ? meta.category : ctx.category;
  const source = typeof meta.source === 'string' ? meta.source : ctx.source;
  const entity = typeof meta.entity === 'string' ? meta.entity : ctx.entity;
  const href = assertHrefAllowedForRole(
    resolveInAppHref(row.subject, app, { ...ctx, category, source, entity }),
    ctx.role,
  );
  return {
    id: row.id,
    title: row.subject || 'Notificación',
    message: row.body || '',
    time: row.created_at
      ? new Date(row.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
      : undefined,
    type: row.channel === 'in_app' ? 'gold' : 'default',
    href,
  };
}

export function mapInAppNotificationToAlertItem(row: InAppNotificationRow): {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
} {
  return {
    id: row.id,
    severity: inferNotificationSeverity(row.subject, row.provider_response),
    title: row.subject || 'Notificación',
    message: row.body || '',
  };
}

export const IN_APP_READ_STORAGE_PREFIX = 'oyz-notif-read-';