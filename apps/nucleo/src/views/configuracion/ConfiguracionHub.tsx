'use client';

import { useState } from 'react';
import {
  User, Lock, Building2, Map, TreePine, Settings, Camera, AlertCircle,
} from 'lucide-react';
import { HexagonLoader, ViewLoading } from '@enjambre/ui';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { usePerfil } from '../perfil/use-perfil';
import { PreferenciasTab } from '../perfil/PreferenciasTab';
import { DatosPersonalesSection } from './DatosPersonalesSection';
import { SeguridadSection } from './SeguridadSection';
import { EmpresasSection } from './EmpresasSection';
import { TerritorioSection } from './TerritorioSection';
import { GuardianSection } from './GuardianSection';
import { SistemaSection } from './SistemaSection';
import { ROLE_LABELS, type Section } from './constants';

export function ConfiguracionHub() {
  const perfil = usePerfil();
  const [activeSection, setActiveSection] = useState<Section>('personal');

  const { profile, loading, message } = perfil;

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

  const sections: { key: Section; icon: React.ReactNode; label: string }[] = [
    { key: 'personal', icon: <User size={18} />, label: 'Datos Personales' },
    { key: 'seguridad', icon: <Lock size={18} />, label: 'Seguridad' },
    { key: 'empresas', icon: <Building2 size={18} />, label: 'Empresas' },
    { key: 'territorio', icon: <Map size={18} />, label: 'Territorio y Privacidad' },
    { key: 'guardian', icon: <TreePine size={18} />, label: 'Nivel Guardián' },
    { key: 'preferencias', icon: <Settings size={18} />, label: 'Preferencias' },
    { key: 'sistema', icon: <Settings size={18} />, label: 'Sistema' },
  ];

  return (
    <div className="config-hub space-y-5 sm:space-y-6">
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

      {/* Identidad compacta: una sola franja (evita card + nav apretados) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <button
          type="button"
          className="relative mx-auto h-16 w-16 shrink-0 rounded-full border-2 border-accent/30 bg-cover bg-center sm:mx-0 sm:h-20 sm:w-20"
          style={{
            backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : undefined,
            backgroundColor: profile.avatar_url ? undefined : 'hsl(var(--muted))',
          }}
          onClick={() => perfil.fileInputRef.current?.click()}
          aria-label="Cambiar foto de perfil"
        >
          {!profile.avatar_url && (
            <span className="absolute inset-0 flex items-center justify-center font-display text-2xl text-foreground">
              {profile.full_name?.charAt(0).toUpperCase() || '?'}
            </span>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-accent">
            {perfil.avatarUploading ? (
              <HexagonLoader size="sm" />
            ) : (
              <Camera size={12} className="text-accent-foreground" />
            )}
          </span>
        </button>
        <input
          ref={perfil.fileInputRef}
          type="file"
          accept="image/*"
          onChange={perfil.handleAvatarUpload}
          className="hidden"
        />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h3 className="font-display text-lg font-semibold text-foreground sm:text-xl">
            {profile.full_name || 'Sin nombre'}
          </h3>
          <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground sm:text-sm">
            {profile.email}
          </p>
          <span className="mt-2 inline-block rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
            {ROLE_LABELS[profile.role] || profile.role}
          </span>
        </div>
      </div>

      {/* Una sola navegación de secciones (tabs) — sin duplicar lista lateral en modal */}
      <ResponsiveTabBar
        layoutId="configuracion-tabs"
        tabs={sections.map((s) => ({ id: s.key, label: s.label, icon: s.icon }))}
        activeId={activeSection}
        onChange={(id) => setActiveSection(id as Section)}
      />

      <div className="min-w-0 space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-6">
        {activeSection === 'personal' && <DatosPersonalesSection {...perfil} />}
        {activeSection === 'seguridad' && <SeguridadSection {...perfil} />}
        {activeSection === 'empresas' && <EmpresasSection {...perfil} />}
        {activeSection === 'territorio' && <TerritorioSection {...perfil} />}
        {activeSection === 'guardian' && <GuardianSection {...perfil} />}
        {activeSection === 'preferencias' && <PreferenciasTab />}
        {activeSection === 'sistema' && <SistemaSection />}
      </div>
    </div>
  );
}
