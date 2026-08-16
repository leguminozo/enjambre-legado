'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, Upload } from 'lucide-react';
import {
  clampRangeValue,
  defaultFieldValue,
  isFieldVisible,
  parseSectionContent,
  resolveSelectControl,
  scanPublicCopyRisks,
  type FieldSchema,
  type PublicCopyRiskKind,
  type SectionSchema,
} from '@/lib/store-chrome';
import { useAutosaveEditor } from '@/components/tienda/save-status';
import { getUrlTienda } from '@/lib/publicUrls';

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
            className="w-full bg-surface-sunken border border-border rounded-lg p-3 text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-accent"
          />
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
      const current = typeof value === 'string' ? value : '';
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
                  current === o.value
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
            <option key={o.value} value={o.value}>
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
          {current.startsWith('http') ? (
            <img
              src={current}
              alt=""
              className="w-full h-32 object-cover rounded-lg border border-border bg-background"
            />
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex w-full justify-center items-center gap-2 px-3 py-3 rounded-lg text-xs font-medium bg-background border border-dashed border-accent/40 hover:border-accent transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {current.startsWith('http') ? 'Cambiar imagen' : 'Subir imagen'}
          </button>
        </div>
      );
    }

    case 'url': {
      const current = typeof value === 'string' ? value : '';
      return (
        <div className="flex gap-2">
          <input
            id={fieldId}
            name={fieldId}
            type="text"
            autoComplete="off"
            value={current}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 min-w-0 bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
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
      );
    }
  }
}

// ── SchemaFormFields: lista rotulada (bilingual + visible_if) ──────────────

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
  return (
    <div className="space-y-4">
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
          return (
            <div key={fieldKey} className="space-y-3">
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
              </SchemaFieldGroup>
              <SchemaFieldGroup
                label={`${field.label} (EN)`}
                htmlFor={`${idPrefix}-${fieldKey}_en`}
                onReset={reset}
              >
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
  const [local, setLocal] = useState<Record<string, unknown>>(() =>
    parseSectionContent(schema, content),
  );
  const { isDirty } = useAutosaveEditor(schema.id, local, (next) => onSave(next));

  // Solo re-sync cuando el servidor cambia y no hay pendientes (gate isDirty).
  useEffect(() => {
    if (isDirty) return;
    setLocal(parseSectionContent(schema, content));
  }, [content, isDirty, schema]);

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

  return (
    <div className="space-y-4">
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
