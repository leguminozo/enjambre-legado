'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useLegacyDevice } from '@enjambre/ui';
import cytoscape, { type Core, type ElementDefinition, type StylesheetCSS } from 'cytoscape';
import type { NodoRedCuaderno, AristaRedCuaderno } from '@/lib/bitacora-types';
import { cn } from '@/lib/cn';
import { tokenRgb, tokenRgbAlpha } from './token-color';

export type LayoutRed = 'radial' | 'cose' | 'grid';

interface LienzoSemanticoProps {
  nodos: NodoRedCuaderno[];
  aristas: AristaRedCuaderno[];
  layout: LayoutRed;
  resaltarColmenas?: Set<string>;
  nodoSeleccionadoId?: string | null;
  modoConectar?: boolean;
  onSelect?: (nodo: NodoRedCuaderno | null) => void;
  onMoveManual?: (id: string, x: number, y: number) => void;
  onConectarNodo?: (id: string) => void;
  className?: string;
}

/** Etiqueta visible en el lienzo por categoría. */
function etiquetaNodo(n: NodoRedCuaderno): string {
  if (n.kind === 'hoja') return `Hoja · ${n.fecha ?? ''}`;
  if (n.kind === 'varroa') return `Varroa ${n.label.replace('Varroa ', '')}`;
  return n.label;
}

/**
 * Posiciones radiales determinísticas: apiarios en fila, colmenas alrededor de
 * su apiario (arista `contiene`), hojas/sanidad alrededor de su colmena
 * (`registra`/`trata`/`monitorea`), muestras en la periferia del apiario y
 * nodos manuales en su posición persistida (x/y).
 */
function posicionesRadiales(
  nodos: NodoRedCuaderno[],
  aristas: AristaRedCuaderno[],
): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  const hijosDe = (id: string, relacion: string) =>
    aristas.filter((a) => a.source_id === id && a.relacion === relacion).map((a) => a.target_id);

  const esparcir = (ids: string[], centro: { x: number; y: number }, radio: number) => {
    const n = ids.length;
    ids.forEach((id, i) => {
      if (pos.has(id)) return;
      const ang = -Math.PI / 2 + (n === 1 ? 0 : (i / (n - 1) - 0.5) * 1.5);
      pos.set(id, { x: centro.x + Math.cos(ang) * radio, y: centro.y + Math.sin(ang) * radio });
    });
  };

  const apiarios = nodos.filter((n) => n.kind === 'apiario');
  apiarios.forEach((a, i) => pos.set(a.id, { x: (i - (apiarios.length - 1) / 2) * 300, y: 0 }));

  for (const a of apiarios) {
    const centro = pos.get(a.id) ?? { x: 0, y: 0 };
    esparcir(hijosDe(a.id, 'contiene'), centro, 180);
    esparcir(hijosDe(a.id, 'muestrea'), centro, 260);
  }
  esparcir(
    nodos.filter((n) => n.kind === 'colmena' && !pos.has(n.id)).map((n) => n.id),
    { x: 0, y: 0 },
    220,
  );

  for (const col of nodos.filter((n) => n.kind === 'colmena')) {
    const centro = pos.get(col.id) ?? { x: 0, y: 0 };
    esparcir(hijosDe(col.id, 'registra'), centro, 100);
    esparcir([...hijosDe(col.id, 'trata'), ...hijosDe(col.id, 'monitorea')], centro, 160);
  }

  for (const hoja of nodos.filter((n) => n.kind === 'hoja')) {
    const centro = pos.get(hoja.id) ?? { x: 0, y: 0 };
    esparcir(hijosDe(hoja.id, 'observa'), centro, 75);
  }

  for (const n of nodos) {
    if (n.kind !== 'manual' || pos.has(n.id)) continue;
    if (n.x !== null && n.x !== undefined && n.y !== null && n.y !== undefined) {
      pos.set(n.id, { x: n.x, y: n.y });
    } else if (n.colmena_id) {
      const c = pos.get(n.colmena_id) ?? { x: 0, y: 0 };
      pos.set(n.id, { x: c.x + 200, y: c.y - 80 });
    } else {
      pos.set(n.id, { x: 0, y: -320 });
    }
  }

  for (const n of nodos) {
    if (!pos.has(n.id)) pos.set(n.id, { x: 0, y: 0 });
  }
  return pos;
}

function estilosLienzo(): StylesheetCSS[] {
  const borde = (token: string, ancho = 1.5) => ({
    'border-color': tokenRgb(token),
    'border-width': ancho,
  });
  return [
    {
      selector: 'node',
      css: {
        'background-color': tokenRgbAlpha('card', 0.9),
        label: 'data(label)',
        color: tokenRgb('foreground'),
        'font-size': 10,
        'text-valign': 'bottom',
        'text-margin-y': 4,
        'text-wrap': 'wrap',
        'text-max-width': '90px',
        'border-width': 1.5,
        'border-color': tokenRgb('muted'),
        'overlay-opacity': 0,
      },
    },
    { selector: 'node.nodo-apiario', css: { shape: 'round-rectangle', width: 120, height: 44, 'text-valign': 'center', 'font-size': 12, ...borde('primary', 2), 'background-color': tokenRgbAlpha('primary', 0.12) } },
    {
      selector: 'node.nodo-colmena',
      css: {
        shape: 'hexagon',
        width: 66,
        height: 66,
        'background-color': tokenRgbAlpha('card', 0.95),
        'border-width': 2.5,
      },
    },
    { selector: 'node.nodo-colmena.estado-optima', css: { 'border-color': tokenRgb('success') } },
    { selector: 'node.nodo-colmena.estado-atencion', css: { 'border-color': tokenRgb('warning') } },
    { selector: 'node.nodo-colmena.estado-riesgo', css: { 'border-color': tokenRgb('destructive'), 'background-color': tokenRgbAlpha('destructive', 0.08) } },
    { selector: 'node.nodo-hoja', css: { shape: 'diamond', width: 44, height: 44, 'text-valign': 'bottom', 'text-margin-y': 6 } },
    { selector: 'node.nodo-hoja.estado-nucleo', css: { 'border-color': tokenRgb('primary') } },
    { selector: 'node.nodo-hoja.estado-temporada', css: { 'border-color': tokenRgb('primary') } },
    { selector: 'node.nodo-hoja.estado-traspaso', css: { 'border-color': tokenRgb('warning') } },
    { selector: 'node.nodo-hoja.estado-cosecha', css: { 'border-color': tokenRgb('warning') } },
    { selector: 'node.nodo-hoja.estado-alza', css: { 'border-color': tokenRgb('success') } },
    { selector: 'node.nodo-hoja.estado-invernada', css: { 'border-color': tokenRgb('muted') } },
    { selector: 'node.nodo-cuadro', css: { shape: 'round-rectangle', width: 84, height: 26, 'text-valign': 'center', 'font-size': 8.5 } },
    { selector: 'node.nodo-tratamiento', css: { shape: 'round-rectangle', width: 96, height: 30, 'text-valign': 'center', 'font-size': 9.5 } },
    { selector: 'node.nodo-muestra', css: { shape: 'ellipse', width: 40, height: 40, 'text-valign': 'bottom', 'text-margin-y': 4 } },
    { selector: 'node.nodo-varroa', css: { shape: 'triangle', width: 34, height: 34, 'text-valign': 'top', 'text-margin-y': -4, 'background-color': tokenRgbAlpha('warning', 0.25) } },
    { selector: 'node.nodo-manual', css: { shape: 'star', width: 48, height: 48, 'text-valign': 'bottom', 'text-margin-y': 5 } },
    { selector: 'node.brecha', css: { 'border-width': 3.5, 'border-dash-pattern': [4, 3], 'overlay-color': tokenRgb('warning'), 'overlay-opacity': 0.18, 'overlay-padding': 10 } },
    { selector: 'node.seleccion', css: { 'border-width': 3.5, 'border-color': tokenRgb('foreground'), 'overlay-opacity': 0 } },
    {
      selector: 'edge',
      css: {
        width: 1.5,
        'line-color': tokenRgb('muted'),
        'curve-style': 'bezier',
        'target-arrow-shape': 'none',
        label: 'data(label)',
        'font-size': 8,
        color: tokenRgb('muted'),
        'text-background-color': tokenRgbAlpha('background', 0.8),
        'text-background-opacity': 1,
        'text-background-padding': '2px',
      },
    },
    { selector: 'edge.rel-registra', css: { 'line-color': tokenRgb('primary'), width: 2 } },
    { selector: 'edge.rel-trata', css: { 'line-color': tokenRgb('warning'), 'line-style': 'dashed' } },
    { selector: 'edge.rel-muestrea', css: { 'line-color': tokenRgb('primary'), 'line-style': 'dotted' } },
    { selector: 'edge.rel-monitorea', css: { 'line-color': tokenRgb('warning'), 'line-style': 'dotted' } },
    { selector: 'edge.rel-deriva_de', css: { 'line-color': tokenRgb('success'), 'line-style': 'dashed', width: 2.5, 'target-arrow-shape': 'triangle', 'target-arrow-color': tokenRgb('success') } },
    { selector: 'edge.rel-observa', css: { 'line-style': 'dotted', width: 1 } },
    { selector: 'edge.rel-tension', css: { 'line-color': tokenRgb('destructive'), 'line-style': 'dashed', width: 2 } },
    { selector: 'edge.rel-analogia', css: { 'line-color': tokenRgb('primary'), 'line-style': 'dotted', width: 1.5 } },
  ];
}

/**
 * Lienzo semántico del cuaderno (Cytoscape). La red es un espejo de los
 * registros (nodos derivados) + la capa manual. Los nodos manuales persisten
 * su posición al arrastrarlos.
 */
export function LienzoSemantico({
  nodos,
  aristas,
  layout,
  resaltarColmenas,
  nodoSeleccionadoId,
  modoConectar = false,
  onSelect,
  onMoveManual,
  onConectarNodo,
  className,
}: LienzoSemanticoProps) {
  const { legacy } = useLegacyDevice();
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);

  const nodosRef = useRef(nodos);
  nodosRef.current = nodos;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onMoveManualRef = useRef(onMoveManual);
  onMoveManualRef.current = onMoveManual;
  const onConectarNodoRef = useRef(onConectarNodo);
  onConectarNodoRef.current = onConectarNodo;

  const resaltarKey = useMemo(
    () => [...(resaltarColmenas ?? new Set<string>())].sort().join('|'),
    [resaltarColmenas],
  );

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;

    cyRef.current?.destroy();
    cyRef.current = null;

    const nodoIds = new Set(nodos.map((n) => n.id));
    const aristasValidas = aristas.filter((a) => nodoIds.has(a.source_id) && nodoIds.has(a.target_id));

    const posiciones = layout === 'radial' ? posicionesRadiales(nodos, aristasValidas) : new Map<string, { x: number; y: number }>();

    const elements: ElementDefinition[] = [
      ...nodos.map((n) => ({
        data: { id: n.id, label: etiquetaNodo(n) },
        classes: [
          `nodo-${n.kind}`,
          n.kind === 'colmena' && n.estado ? `estado-${n.estado}` : '',
          n.kind === 'hoja' && n.estado ? `estado-${String(n.estado)}` : '',
          resaltarColmenas?.has(n.id) ? 'brecha' : '',
          nodoSeleccionadoId === n.id ? 'seleccion' : '',
        ]
          .filter(Boolean)
          .join(' '),
        position: posiciones.get(n.id),
      })),
      ...aristasValidas.map((a) => ({
        data: { id: a.id, source: a.source_id, target: a.target_id, label: a.label ?? '' },
        classes: `rel-${a.relacion}`,
      })),
    ];

    const cy = cytoscape({
      container: contenedor,
      elements,
      style: estilosLienzo(),
      wheelSensitivity: 0.25,
      minZoom: 0.08,
      maxZoom: 3,
      autoungrabify: false,
    });
    cyRef.current = cy;

    cy.on('tap', 'node', (evt) => {
      const id = evt.target.id();
      if (modoConectar) {
        onConectarNodoRef.current?.(id);
        return;
      }
      const nodo = nodosRef.current.find((n) => n.id === id) ?? null;
      onSelectRef.current?.(nodo);
    });
    cy.on('tap', (evt) => {
      if (evt.target === cy) onSelectRef.current?.(null);
    });
    cy.on('dragfree', 'node', (evt) => {
      const el = evt.target;
      const nodo = nodosRef.current.find((n) => n.id === el.id());
      if (nodo?.kind === 'manual') {
        onMoveManualRef.current?.(el.id(), el.position().x, el.position().y);
      }
    });

    if (layout === 'radial') {
      cy.layout({ name: 'preset' }).run();
    } else {
      // 'cose' simula fuerzas físicas (caro con muchos nodos): en tier legacy
      // se degrada a 'grid' para no congelar la pestaña en 2GB de RAM.
      const effective = legacy && layout === 'cose' ? 'grid' : layout;
      cy.layout({ name: effective === 'cose' ? 'cose' : 'grid', padding: 60, animate: false }).run();
    }
    cy.fit(undefined, 60);

    const ro = new ResizeObserver(() => cy.resize());
    ro.observe(contenedor);
    return () => {
      ro.disconnect();
      cy.destroy();
      cyRef.current = null;
    };
  }, [nodos, aristas, layout, resaltarKey, nodoSeleccionadoId, modoConectar, legacy]);

  return <div ref={contenedorRef} className={cn('w-full h-full', className)} />;
}
