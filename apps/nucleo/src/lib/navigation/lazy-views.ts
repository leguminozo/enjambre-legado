'use client';

import type { ComponentType } from 'react';
import { lazyView } from './lazy-view';

function named<P extends object = object>(
  loader: () => Promise<Record<string, unknown>>,
  exportName: string,
  label: string,
) {
  return lazyView<P>(
    () => loader().then((m) => ({ default: (m as Record<string, ComponentType<P>>)[exportName] })),
    label,
  );
}

export const LazyConfiguracionView = named(
  () => import('@/views/configuracion/ConfiguracionView'),
  'ConfiguracionView',
  'Configuración',
);
export const LazyCorreosView = named(
  () => import('@/views/configuracion/CorreosView'),
  'CorreosView',
  'Centro de Correos',
);
export const LazySiiDteView = named(() => import('@/views/sii/SiiDteView'), 'SiiDteView', 'SII');
export const LazyCRMView = named(() => import('@/views/crm/CRMView'), 'CRMView', 'CRM Vendedores');
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
export const LazyPipelineView = named(() => import('@/views/PipelineView'), 'PipelineView', 'Pipeline Ventas');
export const LazyCosteoView = named(() => import('@/views/costeo/CosteoView'), 'CosteoView', 'Costeo');
export const LazyProduccionView = named(
  () => import('@/views/produccion/ProduccionView'),
  'ProduccionView',
  'Lotes',
);
export const LazyRecoleccionView = named(
  () => import('@/views/produccion/RecoleccionView'),
  'RecoleccionView',
  'Recolección',
);
export const LazyInventarioView = named(
  () => import('@/views/produccion/InventarioView'),
  'InventarioView',
  'Inventario',
);
export const LazyAlambiqueView = named(
  () => import('@/views/alambique/AlambiqueView'),
  'AlambiqueView',
  'Alambique',
);
export const LazyHidromielView = named(
  () => import('@/views/hidromiel/HidromielView'),
  'HidromielView',
  'Hidromiel',
);
export const LazyInfusionesView = named(
  () => import('@/views/produccion/InfusionesView'),
  'InfusionesView',
  'Infusiones',
);
export const LazyApicultorView = named(() => import('@/views/ApicultorView'), 'ApicultorView', 'Colmenas');
export const LazyCuadernoCampoView = named(
  () => import('@/views/apicultor/CuadernoCampoView'),
  'CuadernoCampoView',
  'Cuaderno Campo',
);
export const LazyEscenaHojaView = lazyView<{ id: string }>(
  () => import('@/views/apicultor/EscenaHojaView').then((m) => ({ default: m.EscenaHojaView })),
  'Hoja',
);
export const LazyEnviosView = named(
  () => import('@/views/despacho/EnviosView'),
  'EnviosView',
  'Envíos',
);
export const LazyProveedoresView = named(
  () => import('@/views/despacho/ProveedoresView'),
  'ProveedoresView',
  'Proveedores',
);
export const LazyMapaEnviosView = named(
  () => import('@/views/despacho/MapaEnviosView'),
  'MapaEnviosView',
  'Mapa de envíos',
);
export const LazyCentrosStockView = named(
  () => import('@/views/despacho/CentrosStockView'),
  'CentrosStockView',
  'Centros de stock',
);
export const LazyRegeneracionView = named(
  () => import('@/views/RegeneracionView'),
  'RegeneracionView',
  'Bosque',
);
export const LazyMarketingView = named(() => import('@/views/MarketingView'), 'MarketingView', 'Comunidad');
export const LazySumUpView = named(() => import('@/views/sumup/SumUpView'), 'SumUpView', 'Pagos');
export const LazyDashboardEjecutivo = named(
  () => import('@/components/gerente/DashboardEjecutivo'),
  'DashboardEjecutivo',
  'Inicio',
);
export const LazyHomeView = named(() => import('@/views/HomeView'), 'HomeView', 'Inicio');
export const LazyInicioTerritorialView = named(
  () => import('@/views/InicioTerritorialView'),
  'InicioTerritorialView',
  'Inicio Territorial',
);
export const LazyInicioApicultorView = named(
  () => import('@/views/InicioApicultorView'),
  'InicioApicultorView',
  'Inicio Patio',
);
export const LazyOperadoresFeriaPanel = named(
  () => import('@/components/operadores-feria/OperadoresFeriaPanel'),
  'OperadoresFeriaPanel',
  'Operadores Feria',
);

export const LazyCatalogoView = named(() => import('@/views/CatalogoView'), 'CatalogoView', 'Productos');
export const LazyContableHubView = named(
  () => import('@/views/contable/ContableHubView'),
  'ContableHubView',
  'Contable',
);
export const LazyMapaView = named(() => import('@/views/MapaView'), 'MapaView', 'Mapa del Legado');
export const LazyFeriaMonitorView = named(
  () => import('@/views/FeriaMonitorView'),
  'FeriaMonitorView',
  'Monitor de Feria'
);

export const LazyCreadoresAdminPanel = named(
  () => import('@/components/creadores/CreadoresAdminPanel'),
  'CreadoresAdminPanel',
  'Creadores',
);
export const LazyInvitacionesPanel = named<{ defaultTab?: 'cuentas' | 'codigos' | 'canjes' }>(
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
export const LazyRegistroTerritorialView = named(
  () => import('@/views/RegistroTerritorialView'),
  'RegistroTerritorialView',
  'Registro Territorial',
);
export const LazyDeclaracionSagView = named(
  () => import('@/views/DeclaracionSagView'),
  'DeclaracionSagView',
  'Declaración SAG',
);
export const LazyPlanesTerritorialesView = named(
  () => import('@/views/PlanesTerritorialesView'),
  'PlanesTerritorialesView',
  'Planes Territoriales',
);
export const LazyFenologiaView = named(() => import('@/views/fenologia/FenologiaView'), 'FenologiaView', 'Fenología');
export const LazyMicrocanalesView = named(
  () => import('@/views/MicrocanalesView'),
  'MicrocanalesView',
  'Microcanales',
);
export const LazyReembolsosView = named(
  () => import('@/views/ReembolsosView'),
  'ReembolsosView',
  'Reembolsos',
);
export const LazyArcoAdminView = named(
  () => import('@/views/ArcoAdminView'),
  'ArcoAdminView',
  'Solicitudes ARCO',
);
export const LazySaludPlataformaView = named(
  () => import('@/views/SaludPlataformaView'),
  'SaludPlataformaView',
  'Salud',
);
