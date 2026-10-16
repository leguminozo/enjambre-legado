'use client';

import { usePathname } from 'next/navigation';

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
  ModuloGenericoSkeleton,
} from '@/components/shared/skeletons';

export default function NucleoLoading() {
  const pathname = usePathname() || '/';

  // 1. Dashboard ejecutivo / inicio / operaciones / reportes / pipeline
  if (
    pathname === '/' ||
    pathname === '/inicio' ||
    pathname === '/ejecutivo' ||
    pathname.startsWith('/reportes') ||
    pathname.startsWith('/operaciones') ||
    pathname.startsWith('/pipeline')
  ) {
    return <DashboardEjecutivoSkeleton />;
  }

  // 2. Catálogo / productos / taxonomías / descuentos
  if (pathname.startsWith('/catalogo') || pathname.startsWith('/descuentos')) {
    return <ProductListSkeleton />;
  }

  // 3. Producción / alambique / hidromiel / declaración SAG
  if (
    pathname.startsWith('/produccion') ||
    pathname.startsWith('/alambique') ||
    pathname.startsWith('/hidromiel') ||
    pathname.startsWith('/declaracion-sag')
  ) {
    return <ProduccionDashboardSkeleton />;
  }

  // 4. Contable / costeo / reembolsos / reglas de comisión
  if (
    pathname.startsWith('/contable') ||
    pathname.startsWith('/costeo') ||
    pathname.startsWith('/reembolsos') ||
    pathname.startsWith('/reglas-comision')
  ) {
    return <ContableDashboardSkeleton />;
  }

  // 5. CRM / clientes / creadores / invitaciones / planes / club legado
  if (
    pathname.startsWith('/crm') ||
    pathname.startsWith('/creadores') ||
    pathname.startsWith('/invitaciones') ||
    pathname.startsWith('/planes-suscripcion') ||
    pathname.startsWith('/mis-planes') ||
    pathname.startsWith('/club-legado')
  ) {
    return <CrmOverviewSkeleton />;
  }

  // 6. Colmenas / apiarios / cuaderno / fenología / salud
  if (
    pathname.startsWith('/colmenas') ||
    pathname.startsWith('/fenologia') ||
    pathname.startsWith('/salud')
  ) {
    return <ColmenasDashboardSkeleton />;
  }

  // 7. SII / fiscal / rcv / impuestos
  if (pathname.startsWith('/sii')) {
    return <FiscalSiiSkeleton />;
  }

  // 8. Despacho / envíos / centros / proveedores / operadores feria
  if (
    pathname.startsWith('/despacho') ||
    pathname.startsWith('/monitor-feria') ||
    pathname.startsWith('/operadores-feria')
  ) {
    return <DespachoEnviosSkeleton />;
  }

  // 9. Banco / conciliación / cuentas / pagos
  if (
    pathname.startsWith('/banco') ||
    pathname.startsWith('/conciliacion') ||
    pathname.startsWith('/cuentas') ||
    pathname.startsWith('/pagos')
  ) {
    return <BancoChileSkeleton />;
  }

  // 10. Módulos complementarios y de configuración (cero pantallas en blanco ni spinners de página)
  return <ModuloGenericoSkeleton />;
}
