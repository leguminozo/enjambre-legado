'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Copy, ExternalLink, Globe, Loader2, Plus, Sparkles, Trash2, Upload } from 'lucide-react';
import { toast } from '@enjambre/ui';
import {
  asStringList,
  clampRangeValue,
  defaultFieldValue,
  isFieldVisible,
  parseSectionContent,
  resolveSelectControl,
  selectDisplayValue,
  scanPublicCopyRisks,
  type FieldSchema,
  type PublicCopyRiskKind,
  type SectionSchema,
} from '@/lib/store-chrome';
import { useAutosaveEditor, useAutosaveState } from '@/components/tienda/save-status';
import { getUrlTienda } from '@/lib/publicUrls';

export const CANONICAL_STORE_ROUTES: readonly { label: string; path: string }[] = [
  { label: 'Degustaciones (Mieles de Chile)', path: '/experiencias/degustaciones' },
  { label: 'Territorio (Chiloé)', path: '/experiencias/territorio' },
  { label: 'Talleres', path: '/experiencias/talleres' },
  { label: 'Hub Experiencias', path: '/experiencias' },
  { label: 'Catálogo', path: '/catalogo' },
  { label: 'Origen', path: '/origen' },
  { label: 'Ciencia', path: '/ciencia' },
  { label: 'Club Legado', path: '/club-legado-del-bosque' },
  { label: 'Nosotros', path: '/nosotros' },
  { label: 'Contacto', path: '/contacto' },
  { label: 'Solicitud Privada', path: '#solicitud' },
];

// ── SchemaFieldEditor: control puro (sin label) ────────────────────────────

interface SchemaFieldEditorProps {
  field: FieldSchema;
  /** Key real en el content (id, o `${id}_en` si bilingual). */
  fieldKey: string;
  value: unknown;
  onChange: (value: unknown) => void;
  /** Upload a Storage; devuelve la URL pública. El onChange la persiste. */
  onImageUpload?: (file: File, fieldId: string) => Promise<string> | void;
  /** Se dispara tras persistir una URL subida (flush inmediato del card). */
  onImageUploaded?: (fieldId: string, url: string) => void;
  fieldId?: string;
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

/**
 * Pegar varias líneas en un campo de una línea las aplana en silencio (límite
 * del <input>). Se avisa para que los párrafos vayan a una Descripción.
 */
function warnSingleLinePaste(e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
  const pasted = e.clipboardData?.getData('text') ?? '';
  if (pasted.includes('\n')) {
    toast.warning('Campo de una línea: los saltos se pierden al pegar. Usa una Descripción para párrafos.');
  }
}

/** Aviso de copy público (paridad con el scan del editor heurístico). */
function FieldRiskWarnings({
  text,
  kinds,
}: {
  text: string;
  kinds?: readonly PublicCopyRiskKind[];
}) {
  if (!kinds) return null;
  const risks = scanPublicCopyRisks(text, kinds);
  if (risks.length === 0) return null;
  return (
    <p className="text-[11px] text-destructive">
      Riesgo en copy público: {risks.map((r) => r.label).join(', ')}.
    </p>
  );
}

function ListItemToolbar({
  index,
  total,
  min,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  index: number;
  total: number;
  min: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-surface-sunken disabled:opacity-30"
        disabled={index === 0}
        aria-label="Subir"
        onClick={onMoveUp}
      >
        <ChevronUp size={14} />
      </button>
      <button
        type="button"
        className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-surface-sunken disabled:opacity-30"
        disabled={index === total - 1}
        aria-label="Bajar"
        onClick={onMoveDown}
      >
        <ChevronDown size={14} />
      </button>
      <button
        type="button"
        className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-30"
        disabled={total <= min}
        aria-label="Quitar"
        onClick={onRemove}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

/** Puntos de foco 3x3 → object-position ("x% y%"). Default "50% 50%". */
const FOCAL_POINTS: readonly { label: string; value: string }[] = [
  { label: 'Superior izquierda', value: '0% 0%' },
  { label: 'Superior centro', value: '50% 0%' },
  { label: 'Superior derecha', value: '100% 0%' },
  { label: 'Medio izquierda', value: '0% 50%' },
  { label: 'Centro', value: '50% 50%' },
  { label: 'Medio derecha', value: '100% 50%' },
  { label: 'Inferior izquierda', value: '0% 100%' },
  { label: 'Inferior centro', value: '50% 100%' },
  { label: 'Inferior derecha', value: '100% 100%' },
];

function FocalPointPicker({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (focal: string) => void;
}) {
  const current = value ?? '50% 50%';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Foco de imagen
        </p>
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{current}</span>
      </div>
      <div className="grid grid-cols-3 gap-1 w-fit">
        {FOCAL_POINTS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            title={p.label}
            className={`h-7 w-7 rounded-md border flex items-center justify-center transition-colors ${
              current === p.value
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-surface-sunken border-border text-muted-foreground hover:border-accent/40'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function SchemaFieldEditor({
  field,
  fieldKey,
  value,
  onChange,
  onImageUpload,
  onImageUploaded,
  fieldId,
}: SchemaFieldEditorProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  switch (field.type) {
    case 'header':
    case 'paragraph':
      // Organizativos: los renderiza SchemaFormFields (no son controles).
      return null;

    case 'text': {
      const current = typeof value === 'string' ? value : '';
      return (
        <div className="space-y-1.5">
          <input
            id={fieldId}
            name={fieldId}
            type="text"
            autoComplete="off"
            maxLength={field.maxLength}
            value={current}
            onChange={(e) => onChange(e.target.value)}
            onPaste={warnSingleLinePaste}
            className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <FieldRiskWarnings text={current} kinds={field.riskScan} />
        </div>
      );
    }

    case 'textarea': {
      const current = typeof value === 'string' ? value : '';
      return (
        <div className="space-y-1.5">
          <textarea
            id={fieldId}
            name={fieldId}
            autoComplete="off"
            rows={field.rows ?? 4}
            maxLength={field.maxLength}
            value={current}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-surface-sunken border border-border rounded-lg p-3 text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-accent whitespace-pre-line"
          />
          <p className="text-[10px] text-muted-foreground">
            Enter crea un salto de línea · doble Enter crea un párrafo. La tienda lo muestra igual.
          </p>
          <FieldRiskWarnings text={current} kinds={field.riskScan} />
        </div>
      );
    }

    case 'number': {
      const num = typeof value === 'number' ? value : (field.default ?? 0);
      return (
        <div className="flex items-center gap-2">
          <input
            id={fieldId}
            name={fieldId}
            type="number"
            autoComplete="off"
            min={field.min}
            max={field.max}
            step={field.step}
            value={Number.isNaN(num) ? '' : String(num)}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 min-w-0 bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {field.unit ? (
            <span className="text-xs text-muted-foreground shrink-0">{field.unit}</span>
          ) : null}
        </div>
      );
    }

    case 'range': {
      const num = typeof value === 'number' ? value : field.default;
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs font-mono text-accent tabular-nums">
              {num}
              {field.unit ?? ''}
            </span>
          </div>
          <input
            id={fieldId}
            name={fieldId}
            type="range"
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            value={num}
            onChange={(e) => onChange(clampRangeValue(field, Number(e.target.value)))}
            className="w-full accent-[hsl(var(--accent))] h-2 cursor-pointer"
          />
        </div>
      );
    }

    case 'select': {
      const current = selectDisplayValue(value);
      if (resolveSelectControl(field) === 'segmented') {
        return (
          <div className="flex flex-wrap gap-1.5">
            {field.options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() =>
                  onChange(field.valueType === 'number' ? Number(o.value) : o.value)
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  current === String(o.value)
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'bg-surface-sunken border border-border text-muted-foreground hover:text-foreground hover:border-accent/40'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        );
      }
      return (
        <select
          id={fieldId}
          name={fieldId}
          value={current}
          onChange={(e) =>
            onChange(field.valueType === 'number' ? Number(e.target.value) : e.target.value)
          }
          className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {field.options.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }

    case 'checkbox': {
      const checked = value === true;
      return (
        <button
          type="button"
          onClick={() => onChange(!checked)}
          aria-pressed={checked}
          className={`w-10 h-6 rounded-full relative transition-colors shrink-0 ${
            checked ? 'bg-accent' : 'bg-surface-raised border border-border'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform ${
              checked ? 'left-4' : 'left-0.5'
            }`}
          />
        </button>
      );
    }

    case 'color': {
      const current = typeof value === 'string' ? value : '';
      return (
        <div className="space-y-2">
          {field.presets && field.presets.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {field.presets.map((p) => {
                const active = current.toLowerCase() === p.value.toLowerCase();
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => onChange(p.value)}
                    title={p.label}
                    aria-label={`${field.label}: ${p.label}`}
                    className={`h-7 px-2 rounded-md border text-[10px] font-medium flex items-center gap-1.5 transition-all ${
                      active ? 'ring-2 ring-accent border-accent' : 'border-border hover:border-accent/40'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: p.value }}
                    />
                    <span className="text-muted-foreground">{p.label}</span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={isHexColor(current) ? current : '#000000'}
              onChange={(e) => onChange(e.target.value)}
              aria-label={field.label}
              className="h-10 w-12 rounded-lg border border-border bg-background cursor-pointer shrink-0"
            />
            <input
              id={fieldId}
              name={fieldId}
              type="text"
              autoComplete="off"
              value={current}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#hex"
              className="flex-1 min-w-0 bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {current ? (
              <button
                type="button"
                onClick={() => onChange('')}
                title="Limpiar (vuelve al default)"
                className="px-2 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors shrink-0"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      );
    }

    case 'image': {
      const current = typeof value === 'string' ? value : '';
      const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        Promise.resolve(onImageUpload ? onImageUpload(file, fieldKey) : '')
          .then((url) => {
            if (!url) return;
            onChange(url);
            onImageUploaded?.(fieldKey, url);
          })
          .finally(() => {
            setUploading(false);
            e.target.value = '';
          });
      };
      return (
        <div className="space-y-2">
          {current.startsWith('http') || current.startsWith('/') ? (
            <div className="relative group">
              <img
                src={current}
                alt=""
                className="w-full h-36 object-cover rounded-lg border border-border bg-background"
              />
              <button
                type="button"
                onClick={() => onChange('')}
                title="Quitar imagen personalizada (restablecer por defecto)"
                className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 hover:bg-background text-muted-foreground hover:text-destructive border border-border/60 transition-colors shadow-sm"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 flex justify-center items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium bg-background border border-dashed border-accent/40 hover:border-accent transition-colors disabled:opacity-50 min-h-[40px]"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {current ? 'Cambiar archivo' : 'Subir foto desde tu equipo'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={current}
              placeholder="O escribe una URL / ruta ej: /assets/editorial/..."
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 min-w-0 bg-surface-sunken border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent font-mono"
            />
            {current ? (
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-[11px] text-muted-foreground hover:text-destructive whitespace-nowrap px-1 py-1"
              >
                Limpiar
              </button>
            ) : null}
          </div>
        </div>
      );
    }

    case 'url': {
      const current = typeof value === 'string' ? value : '';
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              id={fieldId}
              name={fieldId}
              type="text"
              autoComplete="off"
              value={current}
              placeholder="/ruta o #ancla"
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 min-w-0 bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent font-mono text-xs"
            />
            {field.internalOnly && current.startsWith('/') ? (
              <a
                href={`${getUrlTienda()}${current}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg border border-border hover:border-accent/50 text-muted-foreground hover:text-accent transition-colors bg-background flex items-center justify-center min-w-[40px]"
                title="Abrir en la tienda"
              >
                <ExternalLink size={14} />
              </a>
            ) : null}
          </div>
          {field.internalOnly && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Destinos sugeridos:
              </p>
              <div className="flex flex-wrap gap-1">
                {CANONICAL_STORE_ROUTES.map((r) => {
                  const active = current === r.path;
                  return (
                    <button
                      key={r.path}
                      type="button"
                      onClick={() => onChange(r.path)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                        active
                          ? 'border-accent bg-accent/20 text-accent font-semibold'
                          : 'border-border/60 bg-surface-sunken/60 text-muted-foreground hover:text-foreground hover:border-accent/40'
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    case 'string_list': {
      const rows = asStringList(value);
      const max = field.max ?? 12;
      const min = field.min ?? 0;
      const setRows = (next: string[]) => onChange(next);
      return (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={`${field.id}-${index}`}
              className="rounded-xl border border-border bg-background p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-foreground">
                  {field.itemLabel} {index + 1}
                </p>
                <ListItemToolbar
                  index={index}
                  total={rows.length}
                  min={min}
                  onMoveUp={() => {
                    const next = [...rows];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    setRows(next);
                  }}
                  onMoveDown={() => {
                    const next = [...rows];
                    [next[index + 1], next[index]] = [next[index], next[index + 1]];
                    setRows(next);
                  }}
                  onRemove={() => setRows(rows.filter((_, i) => i !== index))}
                />
              </div>
              <textarea
                value={row}
                rows={field.rows ?? 4}
                onChange={(e) => {
                  const next = [...rows];
                  next[index] = e.target.value;
                  setRows(next);
                }}
                className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent whitespace-pre-line"
              />
              <p className="text-[10px] text-muted-foreground">
                Enter crea un salto de línea · doble Enter crea un párrafo. La tienda lo muestra igual.
              </p>
            </div>
          ))}
          <button
            type="button"
            disabled={rows.length >= max}
            onClick={() => setRows([...rows, ''])}
            className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs font-medium text-accent hover:border-accent disabled:opacity-40"
          >
            <Plus size={14} />
            Añadir {field.itemLabel.toLowerCase()}
          </button>
        </div>
      );
    }

    case 'list': {
      const rows = Array.isArray(value)
        ? value.map((item) =>
            item && typeof item === 'object' && !Array.isArray(item)
              ? (item as Record<string, unknown>)
              : {},
          )
        : [];
      const max = field.max ?? 12;
      const min = field.min ?? 0;
      const blankItem = (): Record<string, unknown> => {
        const row: Record<string, unknown> = {};
        for (const itemField of field.itemFields) {
          if (itemField.type === 'string_list') {
            row[itemField.id] = [];
          } else {
            row[itemField.id] = itemField.default ?? '';
            if (itemField.bilingual) row[`${itemField.id}_en`] = '';
          }
        }
        return row;
      };
      const setRows = (next: Record<string, unknown>[]) => onChange(next);
      return (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={`${field.id}-${index}`}
              className="rounded-xl border border-border bg-background p-3 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-foreground">
                  {field.itemLabel} {index + 1}
                </p>
                <ListItemToolbar
                  index={index}
                  total={rows.length}
                  min={min}
                  onMoveUp={() => {
                    const next = [...rows];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    setRows(next);
                  }}
                  onMoveDown={() => {
                    const next = [...rows];
                    [next[index + 1], next[index]] = [next[index], next[index + 1]];
                    setRows(next);
                  }}
                  onRemove={() => setRows(rows.filter((_, i) => i !== index))}
                />
              </div>
              {field.itemFields.map((itemField) => {
                if (itemField.type === 'string_list') {
                  const lines = asStringList(row[itemField.id]).join('\n');
                  return (
                    <div key={itemField.id} className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {itemField.label}
                      </label>
                      <p className="text-[10px] text-muted-foreground -mt-1">Uno por línea</p>
                      <textarea
                        value={lines}
                        rows={itemField.rows ?? 4}
                        onChange={(e) => {
                          const next = rows.map((r, i) =>
                            i === index ? { ...r, [itemField.id]: e.target.value.split('\n') } : r,
                          );
                          setRows(next);
                        }}
                        className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  );
                }
                const esVal = typeof row[itemField.id] === 'string' ? (row[itemField.id] as string) : '';
                const enVal =
                  typeof row[`${itemField.id}_en`] === 'string'
                    ? (row[`${itemField.id}_en`] as string)
                    : '';
                const patch = (key: string, v: string) => {
                  const next = rows.map((r, i) => (i === index ? { ...r, [key]: v } : r));
                  setRows(next);
                };
                const Control = itemField.type === 'textarea' ? 'textarea' : 'input';
                return (
                  <div key={itemField.id} className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {itemField.label}
                      {itemField.bilingual ? ' (ES)' : ''}
                    </label>
                    <Control
                      value={esVal}
                      rows={itemField.type === 'textarea' ? itemField.rows ?? 3 : undefined}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                        patch(itemField.id, e.target.value)
                      }
                      onPaste={itemField.type === 'textarea' ? undefined : warnSingleLinePaste}
                      className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent whitespace-pre-line"
                    />
                    {itemField.type === 'textarea' ? (
                      <p className="text-[10px] text-muted-foreground">
                        Enter crea un salto de línea · doble Enter crea un párrafo. La tienda lo muestra igual.
                      </p>
                    ) : null}
                    {itemField.bilingual ? (
                      <>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {itemField.label} (EN)
                        </label>
                        <Control
                          value={enVal}
                          rows={itemField.type === 'textarea' ? itemField.rows ?? 3 : undefined}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                            patch(`${itemField.id}_en`, e.target.value)
                          }
                          onPaste={itemField.type === 'textarea' ? undefined : warnSingleLinePaste}
                          className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
          <button
            type="button"
            disabled={rows.length >= max}
            onClick={() => setRows([...rows, blankItem()])}
            className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs font-medium text-accent hover:border-accent disabled:opacity-40"
          >
            <Plus size={14} />
            Añadir {field.itemLabel.toLowerCase()}
          </button>
        </div>
      );
    }
  }
}

// ── SchemaFormFields: lista rotulada (bilingual + visible_if) ──────────────

/**
 * Cobertura EN de la sección: de los campos con texto en español, cuántos
 * tienen su traducción inglesa lista. Solo cuenta lo que se publica en ES.
 */
function bilingualCoverage(
  fields: readonly FieldSchema[],
  values: Record<string, unknown>,
): { filled: number; total: number } {
  let filled = 0;
  let total = 0;
  const countPair = (es: unknown, en: unknown) => {
    if (typeof es !== 'string' || !es.trim()) return;
    total += 1;
    if (typeof en === 'string' && en.trim()) filled += 1;
  };
  for (const field of fields) {
    if (field.type === 'list') {
      const rows = Array.isArray(values[field.id]) ? (values[field.id] as Record<string, unknown>[]) : [];
      for (const row of rows) {
        if (!row || typeof row !== 'object') continue;
        for (const itemField of field.itemFields) {
          if (!('bilingual' in itemField && itemField.bilingual)) continue;
          countPair(row[itemField.id], row[`${itemField.id}_en`]);
        }
      }
      continue;
    }
    if ('bilingual' in field && field.bilingual && 'id' in field) {
      countPair(values[field.id], values[`${field.id}_en`]);
    }
  }
  return { filled, total };
}

function SchemaFieldGroup({
  label,
  info,
  htmlFor,
  onReset,
  children,
}: {
  label: string;
  info?: string;
  htmlFor?: string;
  onReset?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        title="Alt+Click para restablecer"
        onClick={
          onReset
            ? (e) => {
                if (e.altKey) {
                  e.preventDefault();
                  onReset();
                }
              }
            : undefined
        }
        className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground cursor-default select-none"
      >
        {label}
      </label>
      {info ? <p className="text-[10px] text-muted-foreground -mt-1">{info}</p> : null}
      {children}
    </div>
  );
}

interface SchemaFormFieldsProps {
  fields: readonly FieldSchema[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onImageUpload?: (file: File, fieldId: string) => Promise<string> | void;
  onImageUploaded?: (fieldId: string, url: string) => void;
  idPrefix?: string;
}

export function SchemaFormFields({
  fields,
  values,
  onChange,
  onImageUpload,
  onImageUploaded,
  idPrefix = 'schema',
}: SchemaFormFieldsProps) {
  const hasBilingualFields = fields.some((f) => 'bilingual' in f && f.bilingual);
  const [localeView, setLocaleView] = useState<'es' | 'en' | 'both'>('es');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const coverage = bilingualCoverage(fields, values);

  const copyFromEs = (fieldKey: string) => {
    const esVal = values[fieldKey];
    if (esVal !== undefined) {
      onChange(`${fieldKey}_en`, esVal);
      setCopiedKey(fieldKey);
      setTimeout(() => setCopiedKey(null), 1500);
    }
  };

  return (
    <div className="space-y-4">
      {hasBilingualFields && (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border bg-surface-raised/40">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Globe size={13} className="text-accent" />
            <span className="font-semibold text-[11px] text-foreground">Idioma de edición:</span>
            {coverage.total > 0 ? (
              <span
                title="Campos con texto en español que ya tienen traducción inglesa"
                className={`text-[10px] font-semibold tabular-nums ${
                  coverage.filled === coverage.total ? 'text-emerald-500' : 'text-amber-500'
                }`}
              >
                EN · {coverage.filled}/{coverage.total}
              </span>
            ) : null}
          </div>
          <div className="inline-flex rounded-lg p-0.5 bg-surface-sunken border border-border">
            <button
              type="button"
              onClick={() => setLocaleView('es')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                localeView === 'es'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Español (ES)
            </button>
            <button
              type="button"
              onClick={() => setLocaleView('en')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                localeView === 'en'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              English (EN)
            </button>
            <button
              type="button"
              onClick={() => setLocaleView('both')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                localeView === 'both'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ambos
            </button>
          </div>
        </div>
      )}

      {fields.map((field, index) => {
        if (field.type === 'header') {
          return (
            <div key={`header-${index}`} className="pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                {field.content}
              </p>
              {field.info ? (
                <p className="text-[10px] text-muted-foreground mt-0.5">{field.info}</p>
              ) : null}
            </div>
          );
        }
        if (field.type === 'paragraph') {
          return (
            <p key={`paragraph-${index}`} className="text-[11px] text-muted-foreground">
              {field.content}
            </p>
          );
        }
        if (!isFieldVisible(field, values)) return null;
        const fieldKey = field.id;
        const reset = () => onChange(fieldKey, defaultFieldValue(field));

        if ('bilingual' in field && field.bilingual) {
          const hasEn = Boolean(values[`${fieldKey}_en`]);
          return (
            <div key={fieldKey} className="space-y-3">
              {(localeView === 'es' || localeView === 'both') && (
                <SchemaFieldGroup
                  label={`${field.label} (ES)`}
                  info={field.info}
                  htmlFor={`${idPrefix}-${fieldKey}`}
                  onReset={reset}
                >
                  <SchemaFieldEditor
                    field={field}
                    fieldKey={fieldKey}
                    value={values[fieldKey] ?? defaultFieldValue(field)}
                    onChange={(v) => onChange(fieldKey, v)}
                    onImageUpload={onImageUpload}
                    onImageUploaded={onImageUploaded}
                    fieldId={`${idPrefix}-${fieldKey}`}
                  />
                  {localeView === 'es' && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          hasEn ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {hasEn ? 'Traducción EN lista' : 'Pendiente traducción EN'}
                      </span>
                    </div>
                  )}
                </SchemaFieldGroup>
              )}
              {(localeView === 'en' || localeView === 'both') && (
                <SchemaFieldGroup
                  label={`${field.label} (EN)`}
                  htmlFor={`${idPrefix}-${fieldKey}_en`}
                  onReset={reset}
                >
                  {localeView === 'en' && (
                    <div className="flex justify-end -mt-5 mb-1">
                      <button
                        type="button"
                        onClick={() => copyFromEs(fieldKey)}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-accent hover:underline"
                        title="Copiar texto de la versión en español"
                      >
                        {copiedKey === fieldKey ? <Check size={11} /> : <Copy size={11} />}
                        {copiedKey === fieldKey ? 'Copiado' : 'Copiar desde ES'}
                      </button>
                    </div>
                  )}
                  <SchemaFieldEditor
                    field={field}
                    fieldKey={`${fieldKey}_en`}
                    value={values[`${fieldKey}_en`] ?? defaultFieldValue(field)}
                    onChange={(v) => onChange(`${fieldKey}_en`, v)}
                    onImageUpload={onImageUpload}
                    onImageUploaded={onImageUploaded}
                    fieldId={`${idPrefix}-${fieldKey}_en`}
                  />
                </SchemaFieldGroup>
              )}
            </div>
          );
        }

        return (
          <SchemaFieldGroup
            key={fieldKey}
            label={field.label}
            info={field.info}
            htmlFor={`${idPrefix}-${fieldKey}`}
            onReset={reset}
          >
            <SchemaFieldEditor
              field={field}
              fieldKey={fieldKey}
              value={values[fieldKey] ?? defaultFieldValue(field)}
              onChange={(v) => onChange(fieldKey, v)}
              onImageUpload={onImageUpload}
              onImageUploaded={onImageUploaded}
              fieldId={`${idPrefix}-${fieldKey}`}
            />
            {field.type === 'image' && field.focalPoint ? (
              <FocalPointPicker
                value={
                  typeof values[`${fieldKey}_focal`] === 'string'
                    ? (values[`${fieldKey}_focal`] as string)
                    : undefined
                }
                onChange={(focal) => onChange(`${fieldKey}_focal`, focal)}
              />
            ) : null}
          </SchemaFieldGroup>
        );
      })}
    </div>
  );
}

// ── SchemaSettingsPanel: singleton formato con autosave ────────────────────

interface SchemaSettingsPanelProps {
  schema: SectionSchema;
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
  onImageUpload?: (file: File, fieldId: string) => Promise<string> | void;
}

export function SchemaSettingsPanel({
  schema,
  content,
  onSave,
  onImageUpload,
}: SchemaSettingsPanelProps) {
  const parser = useCallback(
    (c: Record<string, unknown>) => parseSectionContent(schema, c) as Record<string, unknown>,
    [schema],
  );

  const { local, setLocal } = useAutosaveState(
    schema.id,
    content,
    parser,
    (next) => onSave(next),
  );

  const [syncedBadge, setSyncedBadge] = useState(false);

  const handleChange = (key: string, value: unknown) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const handleImage = (file: File, fieldId: string): Promise<string> => {
    if (!onImageUpload) return Promise.resolve('');
    return Promise.resolve(onImageUpload(file, fieldId)).then((url) => {
      if (url) setLocal((prev) => ({ ...prev, [fieldId]: url }));
      return url ?? '';
    });
  };

  const handleSyncExperienciasFlagship = () => {
    setLocal((prev) => ({
      ...prev,
      flagship_badge: 'Sesión Insignia',
      flagship_badge_en: 'Flagship Session',
      flagship_title: 'Degustaciones · Mieles de Chile',
      flagship_title_en: 'Tasting & Origin Analysis: Honeys of Chile',
      flagship_desc:
        'Análisis sensorial metódico de mieles recolectadas a lo largo de Chile, con el bosque nativo de Chiloé como estándar de referencia. Conducido por Cristina Miranda.',
      flagship_desc_en:
        'Methodical sensory analysis of honeys collected across Chile, with Chiloé native forest as the reference standard. Conducted by Cristina Miranda.',
      flagship_cta_label: 'Ver experiencia completa',
      flagship_cta_label_en: 'View complete experience',
      flagship_href: '/experiencias/degustaciones',
    }));
    setSyncedBadge(true);
    setTimeout(() => setSyncedBadge(false), 2500);
  };

  return (
    <div className="space-y-4">
      {schema.id === 'experiencias_settings' && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-accent/30 bg-accent/5">
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground">Sincronización de Sesión Insignia</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Rellena la tarjeta con los datos vigentes de Cata Floraciones.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSyncExperienciasFlagship}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-accent-foreground shadow-sm hover:opacity-90 transition-opacity shrink-0 min-h-8"
          >
            {syncedBadge ? <Check size={13} /> : <Sparkles size={13} />}
            {syncedBadge ? 'Sincronizado' : 'Sincronizar'}
          </button>
        </div>
      )}
      <SchemaFormFields
        fields={schema.fields}
        values={local}
        onChange={handleChange}
        onImageUpload={handleImage}
        idPrefix={`settings-${schema.id}`}
      />
    </div>
  );
}
