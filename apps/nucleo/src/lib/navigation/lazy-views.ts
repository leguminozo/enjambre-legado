'use client';

import { createElement, type ComponentType, type ReactNode } from 'react';
import { lazyView } from './lazy-view';
import {
  DashboardEjecutivoSkeleton,
  ProductListSkeleton,
  ProduccionDashboardSkeleton,
  ContableDashboardSkeleton,
  CrmOverviewSkeleton,
  ColmenasDashboardSkeleton,
  FiscalSiiSkeleton,
  DespachoEnviosSkeleton,
  BancoChileSkeleton,
} from '@/components/shared/skeletons';

function named<P extends object = object>(
  loader: () => Promise<Record<string, unknown>>,
  exportName: string,
  label: string,
  fallback?: () => ReactNode,
) {
  return lazyView<P>(
    () => loader().then((m) => ({ default: (m as Record<string, ComponentType<P>>)[exportName] })),
    label,
    fallback,
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
export const LazySiiDteView = named(
  () => import('@/views/sii/SiiDteView'),
  'SiiDteView',
  'SII',
  () => createElement(FiscalSiiSkeleton),
);
export const LazyCRMView = named(
  () => import('@/views/crm/CRMView'),
  'CRMView',
  'CRM Vendedores',
  () => createElement(CrmOverviewSkeleton),
);
export const LazyBancoChileView = named(
  () => import('@/views/banco-chile/BancoChileView'),
  'BancoChileView',
  'Banco',
  () => createElement(BancoChileSkeleton),
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
  () => createElement(ProduccionDashboardSkeleton),
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
export const LazyApicultorView = named(
  () => import('@/views/ApicultorView'),
  'ApicultorView',
  'Colmenas',
  () => createElement(ColmenasDashboardSkeleton),
);
export const LazyCuadernoCampoView = named(
  () => import('@/views/apicultor/CuadernoCampoView'),
  'CuadernoCampoView',
  'Cuaderno Campo',
  () => createElement(ColmenasDashboardSkeleton),
);
export const LazyEscenaHojaView = lazyView<{ id: string }>(
  () => import('@/views/apicultor/EscenaHojaView').then((m) => ({ default: m.EscenaHojaView })),
  'Hoja',
);
export const LazyEnviosView = named(
  () => import('@/views/despacho/EnviosView'),
  'EnviosView',
  'Envíos',
  () => createElement(DespachoEnviosSkeleton),
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
export const LazyEstudioRrssView = named(
  () => import('@/views/EstudioRrssView'),
  'EstudioRrssView',
  'Estudio Editorial',
);
export const LazyEstudioAudiovisualView = named(
  () => import('@/views/EstudioAudiovisualView'),
  'EstudioAudiovisualView',
  'Video de Identidad',
);
export const LazySumUpView = named(() => import('@/views/sumup/SumUpView'), 'SumUpView', 'Pagos');
export const LazyDashboardEjecutivo = named(
  () => import('@/components/gerente/DashboardEjecutivo'),
  'DashboardEjecutivo',
  'Inicio',
  () => createElement(DashboardEjecutivoSkeleton),
);
export const LazyHomeView = named(
  () => import('@/views/HomeView'),
  'HomeView',
  'Inicio',
  () => createElement(DashboardEjecutivoSkeleton),
);
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

export const LazyCatalogoView = named(
  () => import('@/views/CatalogoView'),
  'CatalogoView',
  'Productos',
  () => createElement(ProductListSkeleton),
);
export const LazyContableHubView = named(
  () => import('@/views/contable/ContableHubView'),
  'ContableHubView',
  'Contable',
  () => createElement(ContableDashboardSkeleton),
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
export const LazyAnalisisCruzadoView = named(
  () => import('@/views/analisis/AnalisisCruzadoView'),
  'AnalisisCruzadoView',
  'Análisis Multicanal',
);
export const LazyDescuentosView = named(
  () => import('@/views/DescuentosView'),
  'DescuentosView',
  'Cupones & Descuentos',
);
export const LazySubscriptionPlansView = named(
  () => import('@/views/SubscriptionPlansView'),
  'SubscriptionPlansView',
  'Planes de Suscripción',
);
export const LazyTaxonomiasView = named(
  () => import('@/views/catalogo/TaxonomiasView'),
  'TaxonomiasView',
  'Taxonomías',
);
export const LazyEditorTiendaView = named(
  () => import('@/views/EditorTiendaView'),
  'EditorTiendaView',
  'Editor Tienda',
);
export const LazyEspeciesNativasView = named(
  () => import('@/views/fenologia/EspeciesNativasView'),
  'EspeciesNativasView',
  'Especies Nativas',
);
export const LazyResenasSensorialesView = named(
  () => import('@/views/crm/ResenasSensorialesView'),
  'ResenasSensorialesView',
  'Reseñas Sensoriales',
);
export const LazyRcvView = named(
  () => import('@/views/sii/RcvView'),
  'RcvView',
  'Registro Compra Venta',
);
export const LazyImpuestosView = named(
  () => import('@/views/sii/ImpuestosView'),
  'ImpuestosView',
  'Impuestos F29',
);
export const LazyTerritorioHomeView = named<{ initialTab?: string }>(
  () => import('@/views/TerritorioHomeView'),
  'TerritorioHomeView',
  'Territorio',
);
export const LazyClubLegadoView = named(
  () => import('@/views/ClubLegadoView'),
  'ClubLegadoView',
  'Club Legado',
);
export const LazyIntegracionesView = named(
  () => import('@/views/IntegracionesView'),
  'IntegracionesView',
  'Integraciones',
);

export const LazyHubPhygitalView = named(
  () => import('@/views/phygital/HubPhygitalView'),
  'HubPhygitalView',
  'Hub Phygital & Etiquetas',
);

export const LazyPortalImprentaView = named(
  () => import('@/views/portal-imprenta/PortalImprentaView'),
  'PortalImprentaView',
  'Portal Imprenta & Diseño',
);


