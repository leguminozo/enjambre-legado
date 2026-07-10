'use client';

import type { ComponentType } from 'react';
import { lazyView } from './lazy-view';

function named(
  loader: () => Promise<Record<string, ComponentType<object>>>,
  exportName: string,
  label: string,
) {
  return lazyView(
    () => loader().then((m) => ({ default: m[exportName] })) as Promise<{ default: ComponentType<object> }>,
    label,
  );
}

export const LazyEcosistemaDashboard = named(
  () => import('@/components/enjambre/EcosistemaDashboard'),
  'EcosistemaDashboard',
  'Ecosistema',
);
export const LazyConfiguracionView = named(
  () => import('@/views/ConfiguracionView'),
  'ConfiguracionView',
  'Configuración',
);
export const LazySiiDteView = named(() => import('@/views/sii/SiiDteView'), 'SiiDteView', 'SII');
export const LazyCRMView = named(() => import('@/views/crm/CRMView'), 'CRMView', 'CRM');
export const LazyContableView = named(() => import('@/views/ContableView'), 'ContableView', 'Contable');
export const LazyBancoChileView = named(
  () => import('@/views/banco-chile/BancoChileView'),
  'BancoChileView',
  'Banco',
);
export const LazyConciliacionAutoView = named(
  () => import('@/views/banco-chile/ConciliacionAutoView'),
  'ConciliacionAutoView',
  'Conciliación',
);
export const LazyPipelineView = named(() => import('@/views/PipelineView'), 'PipelineView', 'Pipeline');
export const LazyCosteoView = named(() => import('@/views/costeo/CosteoView'), 'CosteoView', 'Costeo');
export const LazyProduccionView = named(
  () => import('@/views/produccion/ProduccionView'),
  'ProduccionView',
  'Producción',
);
export const LazyApicultorView = named(() => import('@/views/ApicultorView'), 'ApicultorView', 'Colmenas');
export const LazyLogisticaView = named(() => import('@/views/LogisticaView'), 'LogisticaView', 'Operaciones');
export const LazyRegeneracionView = named(
  () => import('@/views/RegeneracionView'),
  'RegeneracionView',
  'Bosque',
);
export const LazyMarketingView = named(() => import('@/views/MarketingView'), 'MarketingView', 'Comunidad');
export const LazySumUpView = named(() => import('@/views/sumup/SumUpView'), 'SumUpView', 'Pagos');
export const LazyPerfilView = named(() => import('@/views/PerfilView'), 'PerfilView', 'Perfil');
export const LazyDashboardEjecutivo = named(
  () => import('@/components/gerente/DashboardEjecutivo'),
  'DashboardEjecutivo',
  'Ejecutivo',
);
export const LazyOperadoresFeriaPanel = named(
  () => import('@/components/operadores-feria/OperadoresFeriaPanel'),
  'OperadoresFeriaPanel',
  'Operadores feria',
);

export const LazyCatalogoView = named(() => import('@/views/CatalogoView'), 'CatalogoView', 'Catálogo');
export const LazyProductosCatalogoView = named(
  () => import('@/views/ProductosCatalogoView'),
  'ProductosCatalogoView',
  'Productos',
);
export const LazyContableHubView = named(
  () => import('@/views/contable/ContableHubView'),
  'ContableHubView',
  'Contable',
);
export const LazyMapaView = named(() => import('@/views/MapaView'), 'MapaView', 'Mapa');
export const LazyEditorTiendaView = named(
  () => import('@/views/EditorTiendaView'),
  'EditorTiendaView',
  'Editor Tienda'
);
export const LazyPosFeriaView = named(
  () => import('@/views/PosFeriaView'),
  'PosFeriaView',
  'Punto de Venta'
);

export const LazyCreadoresAdminPanel = named(
  () => import('@/components/creadores/CreadoresAdminPanel'),
  'CreadoresAdminPanel',
  'Creadores',
);
export const LazyInvitacionesPanel = named(
  () => import('@/components/invitaciones/InvitacionesPanel'),
  'InvitacionesPanel',
  'Invitaciones',
);


export const LazyReglasComisionPanel = named(
  () => import('@/components/reglas-comision/ReglasComisionPanel'),
  'ReglasComisionPanel',
  'Reglas comisión',
);
export const LazyCalculosIAView = named(() => import('@/views/CalculosIAView'), 'CalculosIAView', 'Cálculos IA');
export const LazyReportesView = named(() => import('@/views/ReportesView'), 'ReportesView', 'Reportes');