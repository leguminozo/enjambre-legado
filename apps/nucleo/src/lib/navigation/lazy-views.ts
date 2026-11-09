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
  ClubLegadoSkeleton,
  CuadernoCampoSkeleton,
  EscenaHojaSkeleton,
  QRsProductosSkeleton,
  BovedaEtiquetasSkeleton,
  PortalImprentaSkeleton,
  SaludPlataformaSkeleton,
  ModuloGenericoSkeleton,
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
  () => createElement(ModuloGenericoSkeleton),
);
export const LazyCorreosView = named(
  () => import('@/views/configuracion/CorreosView'),
  'CorreosView',
  'Centro de Correos',
  () => createElement(ModuloGenericoSkeleton),
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
  () => createElement(BancoChileSkeleton),
);
export const LazyPipelineView = named(
  () => import('@/views/PipelineView'),
  'PipelineView',
  'Pipeline Ventas',
  () => createElement(DashboardEjecutivoSkeleton),
);
export const LazyCosteoView = named(
  () => import('@/views/costeo/CosteoView'),
  'CosteoView',
  'Costeo',
  () => createElement(ContableDashboardSkeleton),
);
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
  () => createElement(ProduccionDashboardSkeleton),
);
export const LazyInventarioView = named(
  () => import('@/views/produccion/InventarioView'),
  'InventarioView',
  'Inventario',
  () => createElement(ProduccionDashboardSkeleton),
);
export const LazyAlambiqueView = named(
  () => import('@/views/alambique/AlambiqueView'),
  'AlambiqueView',
  'Alambique',
  () => createElement(ProduccionDashboardSkeleton),
);
export const LazyHidromielView = named(
  () => import('@/views/hidromiel/HidromielView'),
  'HidromielView',
  'Hidromiel',
  () => createElement(ProduccionDashboardSkeleton),
);
export const LazyInfusionesView = named(
  () => import('@/views/produccion/InfusionesView'),
  'InfusionesView',
  'Infusiones',
  () => createElement(ProduccionDashboardSkeleton),
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
  () => createElement(CuadernoCampoSkeleton),
);
export const LazyEscenaHojaView = lazyView<{ id: string }>(
  () => import('@/views/apicultor/EscenaHojaView').then((m) => ({ default: m.EscenaHojaView })),
  'Hoja',
  () => createElement(EscenaHojaSkeleton),
);
export const LazyEnviosView = named(
  () => import('@/views/despacho/EnviosView'),
  'EnviosView',
  'Envíos',
  () => createElement(DespachoEnviosSkeleton),
);
export const LazyPedidosView = named(
  () => import('@/views/pedidos/PedidosView'),
  'PedidosView',
  'Pedidos',
  () => createElement(DespachoEnviosSkeleton),
);
export const LazyProveedoresView = named(
  () => import('@/views/despacho/ProveedoresView'),
  'ProveedoresView',
  'Proveedores',
  () => createElement(DespachoEnviosSkeleton),
);
export const LazyMapaEnviosView = named(
  () => import('@/views/despacho/MapaEnviosView'),
  'MapaEnviosView',
  'Mapa de envíos',
  () => createElement(DespachoEnviosSkeleton),
);
export const LazyCentrosStockView = named(
  () => import('@/views/despacho/CentrosStockView'),
  'CentrosStockView',
  'Centros de stock',
  () => createElement(DespachoEnviosSkeleton),
);
export const LazyRegeneracionView = named(
  () => import('@/views/RegeneracionView'),
  'RegeneracionView',
  'Bosque',
  () => createElement(ModuloGenericoSkeleton),
);
export const LazyMarketingView = named(
  () => import('@/views/MarketingView'),
  'MarketingView',
  'Comunidad',
  () => createElement(CrmOverviewSkeleton),
);
export const LazyEstudioRrssView = named(
  () => import('@/views/EstudioRrssView'),
  'EstudioRrssView',
  'Estudio Editorial',
  () => createElement(ModuloGenericoSkeleton),
);
export const LazyEstudioAudiovisualView = named(
  () => import('@/views/EstudioAudiovisualView'),
  'EstudioAudiovisualView',
  'Video de Identidad',
  () => createElement(ModuloGenericoSkeleton),
);
export const LazySumUpView = named(
  () => import('@/views/sumup/SumUpView'),
  'SumUpView',
  'Pagos',
  () => createElement(BancoChileSkeleton),
);
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
  () => createElement(ModuloGenericoSkeleton),
);
export const LazyInicioApicultorView = named(
  () => import('@/views/InicioApicultorView'),
  'InicioApicultorView',
  'Inicio Patio',
  () => createElement(ColmenasDashboardSkeleton),
);
export const LazyOperadoresFeriaPanel = named(
  () => import('@/components/operadores-feria/OperadoresFeriaPanel'),
  'OperadoresFeriaPanel',
  'Operadores Feria',
  () => createElement(DespachoEnviosSkeleton),
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
export const LazyMapaView = named(
  () => import('@/views/MapaView'),
  'MapaView',
  'Mapa del Legado',
  () => createElement(ModuloGenericoSkeleton),
);
export const LazyFeriaMonitorView = named(
  () => import('@/views/FeriaMonitorView'),
  'FeriaMonitorView',
  'Monitor de Feria',
  () => createElement(DespachoEnviosSkeleton),
);

export const LazyCreadoresAdminPanel = named(
  () => import('@/components/creadores/CreadoresAdminPanel'),
  'CreadoresAdminPanel',
  'Creadores',
  () => createElement(CrmOverviewSkeleton),
);
export const LazyInvitacionesPanel = named<{ defaultTab?: 'cuentas' | 'codigos' | 'canjes' }>(
  () => import('@/components/invitaciones/InvitacionesPanel'),
  'InvitacionesPanel',
  'Invitaciones',
  () => createElement(CrmOverviewSkeleton),
);

export const LazyReglasComisionPanel = named(
  () => import('@/components/reglas-comision/ReglasComisionPanel'),
  'ReglasComisionPanel',
  'Reglas comisión',
  () => createElement(ContableDashboardSkeleton),
);
export const LazyCalculosIAView = named(
  () => import('@/views/CalculosIAView'),
  'CalculosIAView',
  'Cálculos IA',
  () => createElement(ModuloGenericoSkeleton),
);
export const LazyReportesView = named(
  () => import('@/views/ReportesView'),
  'ReportesView',
  'Reportes',
  () => createElement(DashboardEjecutivoSkeleton),
);
export const LazyRegistroTerritorialView = named(
  () => import('@/views/RegistroTerritorialView'),
  'RegistroTerritorialView',
  'Registro Territorial',
  () => createElement(ModuloGenericoSkeleton),
);
export const LazyDeclaracionSagView = named(
  () => import('@/views/DeclaracionSagView'),
  'DeclaracionSagView',
  'Declaración SAG',
  () => createElement(ProduccionDashboardSkeleton),
);
export const LazyPlanesTerritorialesView = named(
  () => import('@/views/PlanesTerritorialesView'),
  'PlanesTerritorialesView',
  'Planes Territoriales',
  () => createElement(ModuloGenericoSkeleton),
);
export const LazyFenologiaView = named(
  () => import('@/views/fenologia/FenologiaView'),
  'FenologiaView',
  'Fenología',
  () => createElement(ColmenasDashboardSkeleton),
);
export const LazyMicrocanalesView = named(
  () => import('@/views/MicrocanalesView'),
  'MicrocanalesView',
  'Microcanales',
  () => createElement(CrmOverviewSkeleton),
);
export const LazyReembolsosView = named(
  () => import('@/views/ReembolsosView'),
  'ReembolsosView',
  'Reembolsos',
  () => createElement(ContableDashboardSkeleton),
);
export const LazyArcoAdminView = named(
  () => import('@/views/ArcoAdminView'),
  'ArcoAdminView',
  'Solicitudes ARCO',
  () => createElement(ModuloGenericoSkeleton),
);
export const LazySaludPlataformaView = named(
  () => import('@/views/SaludPlataformaView'),
  'SaludPlataformaView',
  'Salud',
  () => createElement(SaludPlataformaSkeleton),
);
export const LazyAnalisisCruzadoView = named(
  () => import('@/views/analisis/AnalisisCruzadoView'),
  'AnalisisCruzadoView',
  'Análisis Multicanal',
  () => createElement(DashboardEjecutivoSkeleton),
);
export const LazyDescuentosView = named(
  () => import('@/views/DescuentosView'),
  'DescuentosView',
  'Cupones & Descuentos',
  () => createElement(ProductListSkeleton),
);
export const LazySubscriptionPlansView = named(
  () => import('@/views/SubscriptionPlansView'),
  'SubscriptionPlansView',
  'Planes de Suscripción',
  () => createElement(CrmOverviewSkeleton),
);
export const LazyTaxonomiasView = named(
  () => import('@/views/catalogo/TaxonomiasView'),
  'TaxonomiasView',
  'Taxonomías',
  () => createElement(ProductListSkeleton),
);
export const LazyEditorTiendaView = named(
  () => import('@/views/EditorTiendaView'),
  'EditorTiendaView',
  'Editor Tienda',
  () => createElement(ModuloGenericoSkeleton),
);
export const LazyEspeciesNativasView = named(
  () => import('@/views/fenologia/EspeciesNativasView'),
  'EspeciesNativasView',
  'Especies Nativas',
  () => createElement(ColmenasDashboardSkeleton),
);
export const LazyResenasSensorialesView = named(
  () => import('@/views/crm/ResenasSensorialesView'),
  'ResenasSensorialesView',
  'Reseñas Sensoriales',
  () => createElement(CrmOverviewSkeleton),
);
export const LazyRcvView = named(
  () => import('@/views/sii/RcvView'),
  'RcvView',
  'Registro Compra Venta',
  () => createElement(FiscalSiiSkeleton),
);
export const LazyImpuestosView = named(
  () => import('@/views/sii/ImpuestosView'),
  'ImpuestosView',
  'Impuestos F29',
  () => createElement(FiscalSiiSkeleton),
);
export const LazyTerritorioHomeView = named<{ initialTab?: string }>(
  () => import('@/views/TerritorioHomeView'),
  'TerritorioHomeView',
  'Territorio',
  () => createElement(ModuloGenericoSkeleton),
);
export const LazyClubLegadoView = named(
  () => import('@/views/ClubLegadoView'),
  'ClubLegadoView',
  'Club Legado',
  () => createElement(ClubLegadoSkeleton),
);
export const LazyIntegracionesView = named(
  () => import('@/views/IntegracionesView'),
  'IntegracionesView',
  'Integraciones',
  () => createElement(ModuloGenericoSkeleton),
);

export const LazyHubPhygitalView = named(
  () => import('@/views/phygital/HubPhygitalView'),
  'HubPhygitalView',
  'QRs de Productos',
  () => createElement(QRsProductosSkeleton),
);

export const LazyBovedaEtiquetasView = named(
  () => import('@/views/phygital/BovedaEtiquetasView'),
  'BovedaEtiquetasView',
  'Bóveda de Etiquetas',
  () => createElement(BovedaEtiquetasSkeleton),
);

export const LazyPortalImprentaView = named(
  () => import('@/views/portal-imprenta/PortalImprentaView'),
  'PortalImprentaView',
  'Portal Imprenta & Diseño',
  () => createElement(PortalImprentaSkeleton),
);
