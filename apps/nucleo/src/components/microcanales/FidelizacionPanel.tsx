'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, DataTable, Button,
  Badge, Select, SkeletonTable, type ColumnDef,
} from '@enjambre/ui';
import { useMicrocanalResource } from './use-microcanales';
import {
  type FidProgramaRow, type FidMembresiaRow, type FidEventoRow, type FidCanjeRow,
  type FidValorRow, type RetribucionReglaRow, type RetribucionTierRow, type ChipCatalogoRow,
  type PuntoVentaRow,
} from '@/lib/microcanales-types';

interface FidData {
  programas: FidProgramaRow[]
  membresias: FidMembresiaRow[]
  eventos: FidEventoRow[]
  canjes: FidCanjeRow[]
}

interface ConfigData {
  valores: FidValorRow[]
  reglas: RetribucionReglaRow[]
  tiers: RetribucionTierRow[]
  chips: ChipCatalogoRow[]
}

export function FidelizacionPanel() {
  const apiFetch = useApiFetch();
  const { items: puntos } = useMicrocanalResource<PuntoVentaRow>('puntos-venta');
  const [puntoId, setPuntoId] = useState('');

  const fidQuery = useQuery<{ data: FidData }>({
    queryKey: ['microcanales', 'fidelizacion', puntoId],
    queryFn: async () => {
      const res = await apiFetch(`/api/b2b/fidelizacion?punto_id=${puntoId}`);
      if (!res.ok) throw new Error('Error al cargar fidelización');
      return res.json();
    },
    enabled: Boolean(puntoId),
  });

  const configQuery = useQuery<{ data: ConfigData }>({
    queryKey: ['microcanales', 'configuracion'],
    queryFn: async () => {
      const res = await apiFetch('/api/b2b/configuracion');
      if (!res.ok) throw new Error('Error al cargar configuración');
      return res.json();
    },
  });

  const fid = fidQuery.data?.data;
  const cfg = configQuery.data?.data;

  const programasColumns: ColumnDef<FidProgramaRow>[] = [
    { key: 'nombre', header: 'Programa', sortable: true, render: (p) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{p.nombre}</span>
        <span className="text-xs text-muted-foreground">{p.regla}</span>
      </div>), csvValue: (p) => p.nombre },
    { key: 'tipo', header: 'Tipo', sortable: true, render: (p) => <Badge variant="default">{p.tipo}</Badge>, csvValue: (p) => p.tipo },
    { key: 'umbral', header: 'Umbral', sortable: true, align: 'right', render: (p) => p.umbral, csvValue: (p) => String(p.umbral) },
    { key: 'recompensa', header: 'Recompensa', sortable: true, hideBelow: 560, render: (p) => p.recompensa, csvValue: (p) => p.recompensa },
    { key: 'activo', header: 'Activo', sortable: true, hideBelow: 700, render: (p) => (p.activo ? <Badge variant="success">Sí</Badge> : '—'), csvValue: (p) => (p.activo ? 'si' : '') },
  ];

  const membresiasColumns: ColumnDef<FidMembresiaRow>[] = [
    { key: 'cliente', header: 'Cliente', sortable: true, render: (m) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{m.cliente?.nombre ?? '—'}</span>
        <span className="text-xs text-muted-foreground font-mono">{m.cliente?.codigo_cliente ?? ''}</span>
      </div>), csvValue: (m) => m.cliente?.nombre ?? '' },
    { key: 'contacto', header: 'Contacto', sortable: true, hideBelow: 560, render: (m) => m.cliente?.email ?? m.cliente?.whatsapp ?? '—', csvValue: (m) => m.cliente?.email ?? m.cliente?.whatsapp ?? '' },
    { key: 'saldo_sellos', header: 'Sellos', sortable: true, align: 'right', render: (m) => m.saldo_sellos, csvValue: (m) => String(m.saldo_sellos) },
    { key: 'saldo_puntos', header: 'Puntos', sortable: true, align: 'right', render: (m) => m.saldo_puntos, csvValue: (m) => String(m.saldo_puntos) },
    { key: 'grupo_control', header: 'Holdout', sortable: true, hideBelow: 700, render: (m) => (m.grupo_control ? <Badge variant="warning">Control</Badge> : '—'), csvValue: (m) => (m.grupo_control ? 'control' : '') },
  ];

  const eventosColumns: ColumnDef<FidEventoRow>[] = [
    { key: 'created_at', header: 'Fecha', sortable: true, render: (e) => new Date(e.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }), csvValue: (e) => e.created_at },
    { key: 'tipo', header: 'Tipo', sortable: true, render: (e) => <Badge variant={e.tipo === 'compra' ? 'success' : 'warning'}>{e.tipo}</Badge>, csvValue: (e) => e.tipo },
    { key: 'cantidad', header: 'Cantidad', sortable: true, align: 'right', render: (e) => (e.cantidad > 0 ? `+${e.cantidad}` : e.cantidad), csvValue: (e) => String(e.cantidad) },
    { key: 'origen', header: 'Origen', sortable: true, hideBelow: 560, render: (e) => e.origen, csvValue: (e) => e.origen },
    { key: 'notas', header: 'Notas', hideBelow: 700, render: (e) => <span className="text-xs text-muted-foreground line-clamp-1">{e.notas ?? '—'}</span>, csvValue: (e) => e.notas ?? '' },
  ];

  const canjesColumns: ColumnDef<FidCanjeRow>[] = [
    { key: 'cliente', header: 'Cliente', sortable: true, render: (x) => x.cliente?.nombre ?? '—', csvValue: (x) => x.cliente?.nombre ?? '' },
    { key: 'recompensa', header: 'Recompensa', sortable: true, render: (x) => x.recompensa, csvValue: (x) => x.recompensa },
    { key: 'costo', header: 'Costo', sortable: true, align: 'right', render: (x) => x.costo, csvValue: (x) => String(x.costo) },
    { key: 'estado', header: 'Estado', sortable: true, render: (x) => <Badge variant={x.estado === 'aprobado' ? 'success' : 'default'}>{x.estado}</Badge>, csvValue: (x) => x.estado },
    { key: 'fecha', header: 'Fecha', sortable: true, hideBelow: 560, render: (x) => x.fecha, csvValue: (x) => x.fecha },
  ];

  const valoresColumns: ColumnDef<FidValorRow>[] = [
    { key: 'nombre', header: 'Valor', sortable: true, render: (v) => v.nombre, csvValue: (v) => v.nombre },
    { key: 'valor', header: 'Configurado', sortable: true, align: 'right', render: (v) => v.valor.toLocaleString('es-CL'), csvValue: (v) => String(v.valor) },
    { key: 'descripcion', header: 'Descripción', hideBelow: 700, render: (v) => <span className="text-xs text-muted-foreground line-clamp-1">{v.descripcion ?? '—'}</span>, csvValue: (v) => v.descripcion ?? '' },
  ];

  const reglasColumns: ColumnDef<RetribucionReglaRow>[] = [
    { key: 'nombre', header: 'Regla', sortable: true, render: (r) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{r.nombre}</span>
        <span className="text-xs text-muted-foreground">{r.tipo}</span>
      </div>), csvValue: (r) => r.nombre },
    { key: 'valor', header: 'Valor', sortable: true, align: 'right', render: (r) => r.valor, csvValue: (r) => String(r.valor) },
    { key: 'condiciones', header: 'Condiciones', hideBelow: 560, render: (r) => (
      <span className="text-xs text-muted-foreground">
        {r.umbral_min_clp != null ? `≥ ${r.umbral_min_clp.toLocaleString('es-CL')} CLP ` : ''}
        {r.dias_max != null ? `≤ ${r.dias_max} días ` : ''}
        {r.skus_min != null ? `≥ ${r.skus_min} SKUs` : ''}
      </span>), csvValue: (r) => `${r.umbral_min_clp ?? ''} ${r.dias_max ?? ''} ${r.skus_min ?? ''}` },
    { key: 'activo', header: 'Activo', sortable: true, hideBelow: 700, render: (r) => (r.activo ? <Badge variant="success">Sí</Badge> : '—'), csvValue: (r) => (r.activo ? 'si' : '') },
  ];

  const tiersColumns: ColumnDef<RetribucionTierRow>[] = [
    { key: 'nombre', header: 'Tier', sortable: true, render: (t) => <span className="font-medium text-foreground">{t.nombre}</span>, csvValue: (t) => t.nombre },
    { key: 'umbral_anual_clp', header: 'Umbral anual', sortable: true, align: 'right', render: (t) => t.umbral_anual_clp.toLocaleString('es-CL'), csvValue: (t) => String(t.umbral_anual_clp) },
    { key: 'beneficio', header: 'Beneficio', sortable: true, hideBelow: 560, render: (t) => t.beneficio, csvValue: (t) => t.beneficio },
  ];

  const chipsColumns: ColumnDef<ChipCatalogoRow>[] = [
    { key: 'bloque', header: 'Bloque', sortable: true, render: (ch) => <Badge variant="default">{ch.bloque}</Badge>, csvValue: (ch) => ch.bloque },
    { key: 'chip', header: 'Chip', sortable: true, render: (ch) => ch.chip, csvValue: (ch) => ch.chip },
    { key: 'activo', header: 'Activo', sortable: true, hideBelow: 560, render: (ch) => (ch.activo ? <Badge variant="success">Sí</Badge> : '—'), csvValue: (ch) => (ch.activo ? 'si' : '') },
  ];

  const totalPuntos = (fid?.membresias ?? []).reduce((a, m) => a + m.saldo_puntos, 0);
  const totalSellos = (fid?.membresias ?? []).reduce((a, m) => a + m.saldo_sellos, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Fidelización del punto de venta</CardTitle>
          <CardDescription>
            Programas (sellos o puntos, presets por escala de entorno), clientes con su tarjeta QR y el ledger de eventos.
            {puntoId && fid && <> · <span className="text-foreground">{fid.membresias.length} clientes · {totalSellos} sellos · {totalPuntos} puntos</span></>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-72">
            <SelectPunto puntos={puntos} value={puntoId} onChange={setPuntoId} />
          </div>
          {!puntoId && <p className="text-sm text-muted-foreground">Selecciona un punto de venta para ver su fidelización.</p>}
          {fidQuery.isLoading && puntoId && <SkeletonTable rows={4} columns={4} />}
          {fid && (
            <>
              <DataTable<FidProgramaRow> columns={programasColumns} rows={fid.programas} getId={(p) => p.id}
                storageKey="microcanales-programas" emptyState="Este local aún no tiene programas." />
              <DataTable<FidMembresiaRow> columns={membresiasColumns} rows={fid.membresias} getId={(m) => m.id}
                storageKey="microcanales-membresias" emptyState="Aún no hay clientes en este local." />
              <DataTable<FidEventoRow> columns={eventosColumns} rows={fid.eventos} getId={(e) => e.id}
                storageKey="microcanales-eventos" emptyState="Sin eventos aún." />
              <DataTable<FidCanjeRow> columns={canjesColumns} rows={fid.canjes} getId={(x) => x.id}
                storageKey="microcanales-canjes" emptyState="Sin canjes aún." />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración del sistema (ordena el caos)</CardTitle>
          <CardDescription>
            Valores de puntos, reglas de retribución al por mayor, tiers y catálogo de chips de percepción — editables desde aquí. Cada regla se explica en dos oraciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {configQuery.isLoading && <SkeletonTable rows={4} columns={4} />}
          {cfg && (
            <>
              <div>
                <h4 className="text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Valores centrales</h4>
                <DataTable<FidValorRow> columns={valoresColumns} rows={cfg.valores} getId={(v) => v.id}
                  storageKey="microcanales-valores" />
              </div>
              <div>
                <h4 className="text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Reglas de retribución al por mayor</h4>
                <DataTable<RetribucionReglaRow> columns={reglasColumns} rows={cfg.reglas} getId={(r) => r.id}
                  storageKey="microcanales-reglas" />
              </div>
              <div>
                <h4 className="text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Tiers de revendedor (ventana móvil 12 meses)</h4>
                <DataTable<RetribucionTierRow> columns={tiersColumns} rows={cfg.tiers} getId={(t) => t.id}
                  storageKey="microcanales-tiers" />
              </div>
              <div>
                <h4 className="text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Catálogo de chips (percepción — la elicitación local ajusta sin código)</h4>
                <DataTable<ChipCatalogoRow> columns={chipsColumns} rows={cfg.chips} getId={(c) => c.id}
                  storageKey="microcanales-chips" />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SelectPunto({ puntos, value, onChange }: {
  puntos: PuntoVentaRow[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}
      options={puntos.map((p) => ({ value: p.id, label: p.nombre }))}
      placeholder="Seleccionar punto de venta…" searchable />
  );
}
