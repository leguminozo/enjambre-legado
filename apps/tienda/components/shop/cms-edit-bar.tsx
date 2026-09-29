'use server';

import { Pencil, ExternalLink } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { resolveProfileRole } from '@/lib/shop/resolve-profile-role';
import { isNucleoStaffRole } from '@/lib/shop/staff-roles';
import { getNucleoAppUrl } from '@/lib/shop/nucleo-app-url';

interface CmsEditBarProps {
  /** section_key del CMS tal como aparece en editor-tienda-sections (ej. 'nosotros') */
  sectionKey: string;
  /** Etiqueta corta que identifica la sección en la barra (ej. 'Nosotros') */
  label: string;
  /** Workspace donde vive la sección en el editor (ej. 'pages', 'catalog', 'home') */
  workspace?: string;
}

/**
 * Barra de edición contextual para admins y staff. Se renderiza en el servidor;
 * no añade nada al bundle del cliente ni al árbol React del visitante normal.
 *
 * Coloca este componente AL FINAL del <main> de cada página editorial que
 * necesite edición directa desde la tienda.
 */
export async function CmsEditBar({ sectionKey, label, workspace }: CmsEditBarProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const role = await resolveProfileRole(supabase, user);
  if (!isNucleoStaffRole(role)) return null;

  const nucleo = getNucleoAppUrl();
  if (!nucleo) return null;

  const params = new URLSearchParams({ section: sectionKey });
  if (workspace) params.set('workspace', workspace);
  const editorUrl = `${nucleo}/editor-tienda?${params.toString()}`;

  return (
    <div
      aria-label={`Editar sección ${label} en Núcleo`}
      className="mt-16 flex items-center justify-center gap-3 border-t border-border/40 pt-8 pb-4"
    >
      <span className="text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground/50">
        Modo operador
      </span>
      <a
        href={editorUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground hover:border-accent/40 hover:text-accent-text transition-colors"
      >
        <Pencil size={12} strokeWidth={2} />
        <span>Editar · {label}</span>
        <ExternalLink size={11} strokeWidth={1.5} className="opacity-50" />
      </a>
    </div>
  );
}
