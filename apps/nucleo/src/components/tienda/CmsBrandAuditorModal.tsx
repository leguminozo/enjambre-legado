'use client';

import React, { useMemo } from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';
import { ImmersiveModal } from '@enjambre/ui';
import type { CMSContentItem } from '@/hooks/use-cms-content';

export interface BrandAuditFinding {
  id: string;
  sectionKey: string;
  fieldKey: string;
  matchedText: string;
  severity: 'forbidden' | 'warning';
  ruleName: string;
  recommendation: string;
  snippet: string;
}

const BRAND_LAW_RULES: Array<{
  name: string;
  regex: RegExp;
  severity: 'forbidden' | 'warning';
  recommendation: string;
}> = [
  {
    name: 'Término Prohibido: Cosecha',
    regex: /\b(cosechas?|cosechad[oa]s?)\b/i,
    severity: 'forbidden',
    recommendation: 'Usar "recolección", "recolectado/a" o "Recolección Estacional".',
  },
  {
    name: 'Jerga Interna: Biocultural',
    regex: /\bbiocultural(es)?\b/i,
    severity: 'forbidden',
    recommendation: 'Es un principio operativo interno. En UI pública usar "territorial", "origen" o "bosque nativo".',
  },
  {
    name: 'Término Inadecuado: Custodia',
    regex: /\bcustodia(s)?\b/i,
    severity: 'warning',
    recommendation: 'Usar "trayectoria", "vínculo", "presencia" o "legado".',
  },
  {
    name: 'Término de Sacrificio: Oficio',
    regex: /\boficios?\b/i,
    severity: 'warning',
    recommendation: 'Usar "técnica apícola", "maestría" o "estándar de origen" para proyectar alta gama.',
  },
  {
    name: 'Fuga Técnica: Archivo o Comando',
    regex: /\b(\w+\.sql|pnpm|npm run|UUID|SHA-256|on-chain|testnet|magic link)\b/i,
    severity: 'forbidden',
    recommendation: 'Cero fugas técnicas en UI. Expresar el valor funcional para el usuario.',
  },
  {
    name: 'Promesa Médica o Sanitaria',
    regex: /\b(trata(r)? la diabetes|sustituye az[uú]car|s[ií]ndrome metab[oó]lico)\b/i,
    severity: 'forbidden',
    recommendation: 'Prohibidos claims terapéuticos bajo Ley 20.606. Centrarse en sabor, pureza botánica y origen.',
  },
];

export function auditCmsData(data: Record<string, CMSContentItem[]>): BrandAuditFinding[] {
  const findings: BrandAuditFinding[] = [];

  for (const [sectionKey, items] of Object.entries(data)) {
    for (const item of items) {
      const content = item.draft_content ?? item.content;
      if (!content || typeof content !== 'object') continue;

      const scanObject = (obj: Record<string, unknown>, prefix = '') => {
        for (const [key, val] of Object.entries(obj)) {
          const fieldPath = prefix ? `${prefix}.${key}` : key;
          if (typeof val === 'string' && val.trim().length > 0) {
            for (const rule of BRAND_LAW_RULES) {
              const match = rule.regex.exec(val);
              if (match) {
                const matchWord = match[0];
                const start = Math.max(0, match.index - 30);
                const end = Math.min(val.length, match.index + matchWord.length + 30);
                const snippet = `…${val.slice(start, end)}…`;

                findings.push({
                  id: `${sectionKey}-${item.id}-${fieldPath}-${rule.name}`,
                  sectionKey,
                  fieldKey: fieldPath,
                  matchedText: matchWord,
                  severity: rule.severity,
                  ruleName: rule.name,
                  recommendation: rule.recommendation,
                  snippet,
                });
              }
            }
          } else if (val && typeof val === 'object' && !Array.isArray(val)) {
            scanObject(val as Record<string, unknown>, fieldPath);
          }
        }
      };

      scanObject(content);
    }
  }

  return findings;
}

interface CmsBrandAuditorModalProps {
  open: boolean;
  onClose: () => void;
  data: Record<string, CMSContentItem[]>;
  onSelectSection: (sectionKey: string) => void;
}

export function CmsBrandAuditorModal({
  open,
  onClose,
  data,
  onSelectSection,
}: CmsBrandAuditorModalProps) {
  const findings = useMemo(() => auditCmsData(data), [data]);

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      eyebrow="Garantía de Marca y Voz Limpia"
      title="Auditoría de Lenguaje y Estándares"
      size="lg"
    >
      <div className="space-y-4">
        {findings.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 space-y-2">
            <ShieldCheck size={32} className="mx-auto text-emerald-500" />
            <p className="text-sm font-semibold text-foreground">
              ¡Contenido 100% Conforme!
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              No se detectaron fugas técnicas, menciones a cosechas, jerga de cooperativa ni claims sanitarios en los contenidos cargados del CMS.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-500 font-medium">
              <span className="flex items-center gap-1.5">
                <AlertTriangle size={14} />
                Se encontraron {findings.length} inconsistencia{findings.length !== 1 ? 's' : ''} de estilo antes de publicar.
              </span>
              <span className="text-[11px] opacity-80">
                Leyes de Marca y Poder Silencioso
              </span>
            </div>

            <div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1 scrollbar-none">
              {findings.map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 rounded-xl border border-border bg-background space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                          f.severity === 'forbidden'
                            ? 'bg-destructive/15 text-destructive border-destructive/30'
                            : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                        }`}
                      >
                        {f.ruleName}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {f.sectionKey} → {f.fieldKey}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectSection(f.sectionKey);
                        onClose();
                      }}
                      className="inline-flex min-h-8 items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-surface-raised hover:bg-surface hover:text-accent transition-colors text-foreground"
                    >
                      <span>Ir a editar</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>

                  <div className="p-2 rounded-lg bg-surface-sunken border border-border/40 font-mono text-xs text-foreground/80">
                    {f.snippet}
                  </div>

                  <p className="text-xs text-emerald-400 font-medium">
                    ✦ Recomendación: {f.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ImmersiveModal>
  );
}
