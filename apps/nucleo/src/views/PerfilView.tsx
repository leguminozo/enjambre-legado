import React, { useState } from "react";
import { ViewShell } from "@/components/layout/ViewShell";
import { ResponsiveTabBar } from "@/components/layout/ResponsiveTabBar";
import {
  User,
  Mail,
  Shield,
  TreePine,
  Star,
  Camera,
  Save,
  Lock,
  Eye,
  EyeOff,
  Building2,
  ChevronRight,
  Edit3,
  Check,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
const roleLabels: Record<string, string> = {
  admin: "Administrador",
  cliente: "Cliente",
  creador: "Creador",
  rep_ventas: "Representante de Ventas",
};

import { usePerfil } from "./perfil/use-perfil";

const guardianLevels: Record<string, { label: string; description: string; icon: string }> = {
  brotes: { label: "Brotes", description: "Inicio del camino regenerativo", icon: "🌱" },
  raices: { label: "Raíces", description: "Profundizando en el territorio", icon: "🌿" },
  canopia: { label: "Canopía", description: "Guardián del bosque maduro", icon: "🌳" },
  legado: { label: "Legado", description: "Sembrador de futuros", icon: "🏆" },
};

type Section = "personal" | "seguridad" | "empresas" | "guardian";

export function PerfilView() {
  const {
    profile,
    empresas,
    loading,
    saving,
    editMode,
    setEditMode,
    cancelEdit,
    message,
    editName,
    setEditName,
    avatarUploading,
    fileInputRef,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrent,
    setShowCurrent,
    showNew,
    setShowNew,
    passwordSaving,
    handleSaveProfile,
    handleAvatarUpload,
    handleChangePassword,
  } = usePerfil();

  const [activeSection, setActiveSection] = useState<Section>("personal");

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-2xl">
        No se encontró el perfil.
      </div>
    );
  }

  const guardianInfo = guardianLevels[profile.nivel_guardian] || guardianLevels.brotes;

  const sections: { key: Section; icon: React.ReactNode; label: string }[] = [
    { key: "personal", icon: <User size={18} />, label: "Datos Personales" },
    { key: "seguridad", icon: <Lock size={18} />, label: "Seguridad" },
    { key: "empresas", icon: <Building2 size={18} />, label: "Empresas" },
    { key: "guardian", icon: <TreePine size={18} />, label: "Nivel Guardián" },
  ];

  return (
    <div className="space-y-8 animate-in">
      <ViewShell
        variant="compact"
        eyebrow="Identidad"
        title="Mi Perfil"
        subtitle="Gestiona tu identidad, seguridad y pertenencia al enjambre"
        icon={<User size={20} />}
      />

      {message && (
        <div
          className={`animate-in p-4 rounded-xl border flex items-center gap-3 text-sm ${
            message.type === "success"
              ? "bg-primary/10 border-primary/20 text-primary"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          <AlertCircle size={16} />
          {message.text}
        </div>
      )}

      <ResponsiveTabBar
        className="perfil-nav-mobile"
        layoutId="perfil-tabs"
        tabs={sections.map((s) => ({
          id: s.key,
          label: s.label,
          icon: s.icon,
        }))}
        activeId={activeSection}
        onChange={(id) => setActiveSection(id as Section)}
      />

      <div className="perfil-layout">
        {/* Left: Avatar + Nav */}
        <div className="flex flex-col gap-6">
          {/* Avatar Card */}
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <div
              className="w-24 h-24 rounded-full mx-auto mb-4 border-3 border-accent/30 relative cursor-pointer flex items-center justify-center bg-cover bg-center"
              style={{
                backgroundImage: profile.avatar_url ? `url(${profile.avatar_url})` : "none",
                backgroundBlendMode: "overlay",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {!profile.avatar_url && (
                <span className="text-4xl text-foreground font-display">
                  {profile.full_name?.charAt(0).toUpperCase() || "?"}
                </span>
              )}
              <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-accent border-2 border-background flex items-center justify-center cursor-pointer">
                {avatarUploading ? (
                  <Loader2 size={12} className="animate-spin text-accent-foreground" />
                ) : (
                  <Camera size={12} className="text-accent-foreground" />
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />

            <h3 className="font-display text-lg font-semibold text-foreground mb-1">
              {profile.full_name || "Sin nombre"}
            </h3>
            <p className="text-xs text-muted-foreground mb-3 font-mono">{profile.email}</p>
            <span className="badge badge-gold px-3 py-1 rounded-full text-xs font-semibold">
              {roleLabels[profile.role] || profile.role}
            </span>
          </div>

          {/* Section Nav — desktop */}
          <div className="perfil-nav-desktop bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex items-center gap-3 w-full px-5 py-3.5 text-sm transition-all border-b border-border/40 last:border-none text-left ${
                  activeSection === s.key
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                }`}
              >
                <span className={activeSection === s.key ? "text-accent" : "text-muted-foreground"}>
                  {s.icon}
                </span>
                {s.label}
                <ChevronRight
                  size={14}
                  className={`ml-auto transition-opacity ${activeSection === s.key ? "opacity-100" : "opacity-30"}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Content */}
        <div className="flex flex-col gap-6">
          {activeSection === "personal" && (
            <div className="bg-card border border-border rounded-2xl p-6 animate-in">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-accent">
                  <User size={18} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Datos Personales
                  </h3>
                </div>
                <button
                  className="btn btn-ghost btn-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                  onClick={() => {
                    if (editMode) {
                      cancelEdit();
                    } else {
                      setEditMode(true);
                    }
                  }}
                >
                  {editMode ? (
                    <>
                      <X size={14} /> Cancelar
                    </>
                  ) : (
                    <>
                      <Edit3 size={14} /> Editar
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-6 max-w-lg">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Nombre Completo
                  </label>
                  {editMode ? (
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-foreground">{profile.full_name || "—"}</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Email
                  </label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={16} className="text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Rol Principal
                  </label>
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-accent" />
                    <span className="badge badge-gold px-2.5 py-0.5 rounded-md text-xs font-semibold">
                      {roleLabels[profile.role] || profile.role}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Miembro desde
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(profile.created_at).toLocaleDateString("es-CL", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {editMode && (
                <div className="mt-6 flex justify-end">
                  <button
                    className="btn btn-gold flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Guardar Cambios
                  </button>
                </div>
              )}
            </div>
          )}

          {activeSection === "seguridad" && (
            <div className="bg-card border border-border rounded-2xl p-6 animate-in">
              <div className="flex items-center gap-2 text-accent mb-6">
                <Lock size={18} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Cambiar Contraseña
                </h3>
              </div>

              <div className="space-y-6 max-w-md">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-secondary border border-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repetir contraseña"
                      className="w-full bg-secondary border border-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive mt-1.5">Las contraseñas no coinciden</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    className="btn btn-gold flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                    onClick={handleChangePassword}
                    disabled={passwordSaving || !newPassword || newPassword !== confirmPassword}
                  >
                    {passwordSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Actualizar Contraseña
                  </button>
                </div>
              </div>

              {/* Security Tips */}
              <div className="mt-8 p-4 bg-info/10 border border-info/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-info">
                  <AlertCircle size={16} />
                  <span className="text-xs font-bold text-foreground">Recomendaciones</span>
                </div>
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                  <li>Usa al menos 8 caracteres con números y símbolos</li>
                  <li>No reutilices contraseñas de otros servicios</li>
                  <li>Cambia tu contraseña periódicamente</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === "empresas" && (
            <div className="bg-card border border-border rounded-2xl p-6 animate-in">
              <div className="flex items-center gap-2 text-accent mb-6">
                <Building2 size={18} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Empresas Asociadas
                </h3>
              </div>

              {empresas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <Building2 size={32} className="mx-auto opacity-30 mb-3 text-muted-foreground" />
                  No perteneces a ninguna empresa aún.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {empresas.map((emp) => (
                    <div
                      key={emp.empresa_id}
                      className="flex items-center justify-between p-4 bg-secondary/40 border border-border/50 rounded-xl"
                    >
                      <div>
                        <p className="font-semibold text-foreground text-sm">{emp.razon_social}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">RUT: {emp.rut}</p>
                      </div>
                      <span className="badge badge-gold px-2.5 py-0.5 rounded-md text-xs font-semibold border border-accent/20">
                        {emp.rol === "owner"
                          ? "Propietario"
                          : emp.rol === "contador"
                          ? "Contador"
                          : emp.rol === "operador"
                          ? "Operador"
                          : "Lectura"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === "guardian" && (
            <div className="bg-card border border-border rounded-2xl p-6 animate-in">
              <div className="flex items-center gap-2 text-accent mb-6">
                <TreePine size={18} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Nivel Guardián
                </h3>
              </div>

              {/* Current Level */}
              <div className="text-center p-8 bg-foreground text-background rounded-2xl mb-6 relative overflow-hidden">
                <div className="absolute top-[-30%] right-[-15%] w-48 h-48 rounded-full bg-radial-gradient from-accent/15 to-transparent pointer-events-none" />
                <div className="text-5xl mb-2">{guardianInfo.icon}</div>
                <h3 className="text-accent font-display text-2xl font-light">Nivel {guardianInfo.label}</h3>
                <p className="text-muted-foreground text-xs mt-2 max-w-sm mx-auto">{guardianInfo.description}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-secondary/30 border border-border/50 rounded-xl text-center">
                  <Star size={20} className="mx-auto text-accent mb-2" />
                  <div className="text-2xl font-bold font-display text-foreground font-mono">
                    {profile.puntos_acumulados}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                    Puntos Acumulados
                  </div>
                </div>
                <div className="p-4 bg-secondary/30 border border-border/50 rounded-xl text-center">
                  <TreePine size={20} className="mx-auto text-primary mb-2" />
                  <div className="text-2xl font-bold font-display text-foreground font-mono">
                    {profile.arboles_personal}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                    Árboles Plantados
                  </div>
                </div>
              </div>

              {/* Level Progress */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground">Progresión de Niveles</h4>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(guardianLevels).map(([key, lvl]) => {
                    const isActive = profile.nivel_guardian === key;
                    const isPassed =
                      Object.keys(guardianLevels).indexOf(key) <=
                      Object.keys(guardianLevels).indexOf(profile.nivel_guardian);
                    return (
                      <div
                        key={key}
                        className={`text-center p-3 rounded-lg border transition-all ${
                          isActive
                            ? "bg-accent/10 border-accent/40"
                            : isPassed
                            ? "bg-primary/10 border-primary/20 opacity-100"
                            : "bg-secondary/50 border-border/50 opacity-40"
                        }`}
                      >
                        <div className="text-lg mb-1">{lvl.icon}</div>
                        <div className="text-[10px] font-semibold text-foreground truncate">{lvl.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
