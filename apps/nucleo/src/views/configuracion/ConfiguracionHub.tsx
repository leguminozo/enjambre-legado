'use client';

import { useState } from 'react';
import {
  User, Lock, Building2, Map, TreePine, Settings, Camera, ChevronRight, AlertCircle,
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
    <div className="space-y-6">
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

      <ResponsiveTabBar
        className="perfil-nav-mobile"
        layoutId="configuracion-tabs"
        tabs={sections.map((s) => ({ id: s.key, label: s.label, icon: s.icon }))}
        activeId={activeSection}
        onChange={(id) => setActiveSection(id as Section)}
      />

      <div className="perfil-layout">
        {/* Left: Avatar + Nav */}
        <div className="flex flex-col gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <div
              className="w-24 h-24 rounded-full mx-auto mb-4 border-3 border-accent/30 relative cursor-pointer flex items-center justify-center bg-cover bg-center"
              style={{
                backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : 'none',
                backgroundBlendMode: 'overlay',
              }}
              onClick={() => perfil.fileInputRef.current?.click()}
            >
              {!profile.avatar_url && (
                <span className="text-4xl text-foreground font-display">
                  {profile.full_name?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
              <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-accent border-2 border-background flex items-center justify-center cursor-pointer">
                {perfil.avatarUploading ? <HexagonLoader size="sm" /> : <Camera size={12} className="text-accent-foreground" />}
              </div>
            </div>
            <input ref={perfil.fileInputRef} type="file" accept="image/*" onChange={perfil.handleAvatarUpload} className="hidden" />

            <h3 className="font-display text-lg font-semibold text-foreground mb-1">{profile.full_name || 'Sin nombre'}</h3>
            <p className="text-xs text-muted-foreground mb-3 font-mono">{profile.email}</p>
            <span className="badge badge-gold px-3 py-1 rounded-full text-xs font-semibold">
              {ROLE_LABELS[profile.role] || profile.role}
            </span>
          </div>

          {/* Section Nav — desktop */}
          <div className="perfil-nav-desktop bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
            {sections.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveSection(s.key)}
                className={`flex items-center gap-3 w-full min-h-11 px-5 py-3.5 text-sm transition-all border-b border-border/40 last:border-none text-left ${
                  activeSection === s.key
                    ? 'bg-secondary text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/20'
                }`}
              >
                <span className={activeSection === s.key ? 'text-accent' : 'text-muted-foreground'}>{s.icon}</span>
                {s.label}
                <ChevronRight
                  size={14}
                  className={`ml-auto transition-opacity ${activeSection === s.key ? 'opacity-100' : 'opacity-30'}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Content */}
        <div className="flex flex-col gap-6">
          {activeSection === 'personal' && <DatosPersonalesSection {...perfil} />}
          {activeSection === 'seguridad' && <SeguridadSection {...perfil} />}
          {activeSection === 'empresas' && <EmpresasSection {...perfil} />}
          {activeSection === 'territorio' && <TerritorioSection {...perfil} />}
          {activeSection === 'guardian' && <GuardianSection {...perfil} />}
          {activeSection === 'preferencias' && <PreferenciasTab />}
          {activeSection === 'sistema' && <SistemaSection />}
        </div>
      </div>
    </div>
  );
}
