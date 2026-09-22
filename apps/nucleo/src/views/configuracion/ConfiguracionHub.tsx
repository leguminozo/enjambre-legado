'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  User,
  Lock,
  Building2,
  Map,
  TreePine,
  Settings,
  SlidersHorizontal,
  AlertCircle,
} from 'lucide-react';
import { ViewLoading, cn } from '@enjambre/ui';
import { usePerfil } from '../perfil/use-perfil';
import { PreferenciasTab } from '../perfil/PreferenciasTab';
import { DatosPersonalesSection } from './DatosPersonalesSection';
import { SeguridadSection } from './SeguridadSection';
import { PushSection } from './PushSection';
import { EmpresasSection } from './EmpresasSection';
import { TerritorioSection } from './TerritorioSection';
import { GuardianSection } from './GuardianSection';
import { EnjambreConfigPanel } from '@/components/enjambre/EnjambreConfigPanel';
import { GuardianTiersConfigPanel } from '@/components/enjambre/GuardianTiersConfigPanel';
import { GuardianStampsAdminPanel } from '@/components/enjambre/GuardianStampsAdminPanel';
import { EnjambreColmenaPanel } from '@/components/enjambre/EnjambreColmenaPanel';
import { SistemaSection } from './SistemaSection';
import {
  ROLE_LABELS,
  getConfigSectionsForRole,
  SECTION_GROUPS,
  SECTION_DEFS,
  type Section,
} from './constants';
import { RedeemInviteForm } from '@/components/invitaciones/RedeemInviteForm';

const SECTION_ICONS: Record<Section, React.ComponentType<{ size?: number; className?: string }>> = {
  personal: User,
  seguridad: Lock,
  preferencias: SlidersHorizontal,
  territorio: Map,
  empresas: Building2,
  guardian: TreePine,
  sistema: Settings,
};

export function ConfiguracionHub() {
  const perfil = usePerfil();
  const [activeSection, setActiveSection] = useState<Section>('personal');

  const { profile, loading, message } = perfil;

  const allowedKeys = useMemo(
    () => getConfigSectionsForRole(profile?.role),
    [profile?.role],
  );

  const groupedSections = useMemo(() => {
    return SECTION_GROUPS.map((group) => {
      const items = Object.values(SECTION_DEFS).filter(
        (def) => def.groupId === group.id && allowedKeys.includes(def.key),
      );
      return { ...group, items };
    }).filter((g) => g.items.length > 0);
  }, [allowedKeys]);

  // Si el rol no puede ver el tab actual (p.ej. tras hidratar perfil), cae al primero permitido.
  useEffect(() => {
    if (!allowedKeys.includes(activeSection)) {
      const first = allowedKeys[0];
      if (first) setActiveSection(first);
    }
  }, [allowedKeys, activeSection]);

  if (loading) {
    return <ViewLoading variant="view" label="Configuración" hideLabel />;
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-2xl">
        No se encontró el perfil.
      </div>
    );
  }

  return (
    <div className="config-hub space-y-6">
      {message && (
        <div
          className={`animate-in p-4 rounded-xl border flex items-center gap-3 text-sm ${
            message.type === 'success'
              ? 'bg-primary/10 border-primary/20 text-primary'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          <AlertCircle size={16} />
          {message.text}
        </div>
      )}

      {/* Layout 2 columnas en Desktop / Stack en Móvil */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Columna Izquierda: Identidad y Menú de Secciones */}
        <aside className="space-y-5">
          {/* Tarjeta de Identidad */}
          <div className="p-4 rounded-2xl border border-border bg-card flex items-center gap-3.5 shadow-sm">
            <div
              className="relative h-12 w-12 rounded-full border border-border bg-cover bg-center shrink-0 flex items-center justify-center overflow-hidden"
              style={{
                backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : undefined,
                backgroundColor: profile.avatar_url ? undefined : 'hsl(var(--muted))',
              }}
            >
              {!profile.avatar_url && (
                <span className="font-display text-lg text-foreground">
                  {profile.full_name?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm text-foreground truncate">
                {profile.full_name || 'Sin nombre'}
              </h3>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
              <span className="mt-1 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                {ROLE_LABELS[profile.role] || profile.role}
              </span>
            </div>
          </div>

          {/* Menú de Navegación Vertical */}
          <nav className="p-3 rounded-2xl border border-border bg-card space-y-4 shadow-sm" aria-label="Secciones de configuración">
            {groupedSections.map((group) => (
              <div key={group.id} className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = SECTION_ICONS[item.key] ?? Settings;
                    const isActive = activeSection === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveSection(item.key)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer',
                          isActive
                            ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                        )}
                      >
                        <Icon size={16} className={cn(isActive ? 'text-accent-foreground' : 'text-muted-foreground')} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Columna Derecha: Contenido de la Sección Activa */}
        <main className="min-w-0 space-y-6">
          <div key={activeSection} className="animate-in fade-in duration-200">
            {activeSection === 'personal' && (
              <div className="space-y-6">
                <DatosPersonalesSection {...perfil} />
                <RedeemInviteForm compact />
              </div>
            )}
            {activeSection === 'seguridad' && (
              <div className="space-y-6">
                <SeguridadSection {...perfil} />
                <PushSection />
              </div>
            )}
            {activeSection === 'preferencias' && <PreferenciasTab />}
            {activeSection === 'territorio' && allowedKeys.includes('territorio') && (
              <TerritorioSection {...perfil} />
            )}
            {activeSection === 'empresas' && allowedKeys.includes('empresas') && (
              <EmpresasSection {...perfil} />
            )}
            {activeSection === 'guardian' && allowedKeys.includes('guardian') && (
              <GuardianSection {...perfil} />
            )}
            {activeSection === 'sistema' && allowedKeys.includes('sistema') && (
              <div className="space-y-6">
                <SistemaSection />
                <EnjambreConfigPanel />
                <GuardianTiersConfigPanel />
                <GuardianStampsAdminPanel />
                <EnjambreColmenaPanel />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

