import { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Shield, TreePine, Star, Camera,
  Save, Lock, Eye, EyeOff, Building2, ChevronRight,
  Edit3, Check, X, AlertCircle, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { roleLabels } from '../data/mockData';

interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  nivel_guardian: string;
  puntos_acumulados: number;
  arboles_personal: number;
  avatar_url: string;
  created_at: string;
}

interface EmpresaMember {
  empresa_id: string;
  razon_social: string;
  rut: string;
  rol: string;
}

const guardianLevels: Record<string, { label: string; description: string; icon: string }> = {
  brotes: { label: 'Brotes', description: 'Inicio del camino regenerativo', icon: '🌱' },
  raices: { label: 'Raíces', description: 'Profundizando en el territorio', icon: '🌿' },
  canopia: { label: 'Canopía', description: 'Guardián del bosque maduro', icon: '🌳' },
  legado: { label: 'Legado', description: 'Sembrador de futuros', icon: '🏆' },
};

type Section = 'personal' | 'seguridad' | 'empresas' | 'guardian';

export function PerfilView() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [empresas, setEmpresas] = useState<EmpresaMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('personal');
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profErr) throw profErr;
      setProfile(prof as ProfileData);
      setEditName(prof.full_name || '');
      setEditRole(prof.role || 'apicultor');

      const { data: ueData } = await supabase
        .from('usuarios_empresas')
        .select('empresa_id, rol, empresas(id, razon_social, rut)')
        .eq('user_id', session.user.id);

      if (ueData) {
        const mapped: EmpresaMember[] = ueData.map((ue: Record<string, unknown>) => ({
          empresa_id: ue.empresa_id as string,
          razon_social: (ue.empresas as Record<string, unknown>)?.razon_social as string ?? '—',
          rut: (ue.empresas as Record<string, unknown>)?.rut as string ?? '—',
          rol: ue.rol as string,
        }));
        setEmpresas(mapped);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error cargando perfil' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName, role: editRole })
        .eq('id', profile.id);
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, full_name: editName, role: editRole } : null);
      setEditMode(false);
      setMessage({ type: 'success', text: 'Perfil actualizado' });
    } catch {
      setMessage({ type: 'error', text: 'Error guardando perfil' });
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${profile.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);
      if (updateErr) throw updateErr;
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      setMessage({ type: 'success', text: 'Avatar actualizado' });
    } catch {
      setMessage({ type: 'error', text: 'Error subiendo avatar' });
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mínimo 6 caracteres' });
      return;
    }
    setPasswordSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Contraseña actualizada' });
    } catch {
      setMessage({ type: 'error', text: 'Error cambiando contraseña' });
    } finally {
      setPasswordSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} className="animate-bee" style={{ color: 'hsl(var(--accent))' }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'hsl(var(--muted-foreground))' }}>
        No se encontró el perfil.
      </div>
    );
  }

  const guardianInfo = guardianLevels[profile.nivel_guardian] || guardianLevels.brotes;

  const sections: { key: Section; icon: React.ReactNode; label: string }[] = [
    { key: 'personal', icon: <User size={18} />, label: 'Datos Personales' },
    { key: 'seguridad', icon: <Lock size={18} />, label: 'Seguridad' },
    { key: 'empresas', icon: <Building2 size={18} />, label: 'Empresas' },
    { key: 'guardian', icon: <TreePine size={18} />, label: 'Nivel Guardián' },
  ];

  return (
    <div className="space-y-8 animate-in">
      <div className="hero-banner">
        <h1 className="hero-title">Mi Perfil</h1>
        <p className="hero-subtitle">Gestiona tu identidad, seguridad y pertenencia al enjambre</p>
      </div>

      {message && (
        <div
          className="animate-in"
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderRadius: 'var(--radius-md)',
background: message.type === 'success'
          ? 'hsl(var(--success) / 0.12)'
          : 'hsl(var(--destructive) / 0.12)',
        border: `1px solid ${message.type === 'success' ? 'hsl(var(--success) / 0.3)' : 'hsl(var(--destructive) / 0.3)'}`,
        color: message.type === 'success' ? 'hsl(var(--success))' : 'hsl(var(--destructive))',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}
        >
          <AlertCircle size={16} />
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'var(--space-xl)', alignItems: 'start' }}>
        {/* Left: Avatar + Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Avatar Card */}
          <div
		style={{
			background: 'hsl(var(--card))',
			border: '1px solid hsl(var(--border))',
			borderRadius: 'var(--radius-lg)',
			padding: 'var(--space-xl)',
			textAlign: 'center',
		}}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                margin: '0 auto var(--space-md)',
                background: profile.avatar_url
                  ? `url(${profile.avatar_url}) center/cover`
                  : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: 'pointer',
                border: '3px solid hsl(var(--accent) / 0.3)',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {!profile.avatar_url && (
                <span style={{ fontSize: '2.2rem', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-existencial)' }}>
                  {profile.full_name?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
              <div
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
background: 'hsl(var(--accent))',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					border: '2px solid hsl(var(--background))',
                }}
              >
                {avatarUploading ? <Loader2 size={12} className="animate-bee" /> : <Camera size={12} style={{ color: 'hsl(var(--accent-foreground))' }} />}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />

            <h3 style={{ fontFamily: 'var(--font-existencial)', fontSize: '1.2rem', color: 'hsl(var(--foreground))', marginBottom: 4 }}>
              {profile.full_name || 'Sin nombre'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-sm)' }}>
              {profile.email}
            </p>
            <span className="badge badge-gold">{roleLabels[profile.role] || profile.role}</span>
          </div>

          {/* Section Nav */}
          <div
            style={{
	background: 'hsl(var(--card))',
			border: '1px solid hsl(var(--border))',
			borderRadius: 'var(--radius-lg)',
			overflow: 'hidden',
            }}
          >
            {sections.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  width: '100%',
                  padding: 'var(--space-md) var(--space-lg)',
background: activeSection === s.key ? 'hsl(var(--muted) / 0.5)' : 'transparent',
				border: 'none',
				borderBottom: '1px solid hsl(var(--border) / 0.5)',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: activeSection === s.key ? 600 : 400,
                  color: activeSection === s.key ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                  transition: 'all var(--transition-fast)',
                  textAlign: 'left',
                  fontFamily: 'var(--font-datos)',
                }}
              >
                <span style={{ color: activeSection === s.key ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))' }}>
                  {s.icon}
                </span>
                {s.label}
                <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: activeSection === s.key ? 1 : 0.3 }} />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {activeSection === 'personal' && (
            <div
              style={{
	background: 'hsl(var(--card))',
			border: '1px solid hsl(var(--border))',
			borderRadius: 'var(--radius-lg)',
			padding: 'var(--space-xl)',
		}}
		className="animate-in"
	>
		<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'hsl(var(--accent))' }}>
                  <User size={18} />
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                    Datos Personales
                  </h3>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    if (editMode) {
                      setEditName(profile.full_name || '');
                      setEditRole(profile.role || 'apicultor');
                    }
                    setEditMode(!editMode);
                  }}
                >
                  {editMode ? <X size={14} /> : <Edit3 size={14} />}
                  {editMode ? ' Cancelar' : ' Editar'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                <div>
<label style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', display: 'block', marginBottom: 'var(--space-sm)' }}>
					Nombre Completo
                  </label>
                  {editMode ? (
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.9rem',
                          fontFamily: 'var(--font-datos)',
                          background: 'hsl(var(--background))',
                          color: 'hsl(var(--foreground))',
                          outline: 'none',
                          transition: 'border-color var(--transition-fast)',
                        }}
onFocus={e => e.currentTarget.style.borderColor = 'hsl(var(--accent) / 0.5)'}
					onBlur={e => e.currentTarget.style.borderColor = 'hsl(var(--border))'}
                      />
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.95rem', color: 'hsl(var(--foreground))', fontWeight: 500 }}>{profile.full_name || '—'}</p>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', display: 'block', marginBottom: 'var(--space-sm)' }}>
                    Email
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <Mail size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
                    <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>{profile.email}</p>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', display: 'block', marginBottom: 'var(--space-sm)' }}>
                    Rol Principal
                  </label>
                  {editMode ? (
                    <div style={{ position: 'relative' }}>
                      <Shield size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', zIndex: 1 }} />
                      <select
                        value={editRole}
                        onChange={e => setEditRole(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.9rem',
                          fontFamily: 'var(--font-datos)',
                          background: 'hsl(var(--background))',
                          color: 'hsl(var(--foreground))',
                          outline: 'none',
                          appearance: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {Object.entries(roleLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <Shield size={16} style={{ color: 'hsl(var(--accent))' }} />
                      <span className="badge badge-gold">{roleLabels[profile.role] || profile.role}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', display: 'block', marginBottom: 'var(--space-sm)' }}>
                    Miembro desde
                  </label>
                  <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                    {new Date(profile.created_at).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {editMode && (
                <div style={{ marginTop: 'var(--space-xl)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-gold" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? <Loader2 size={16} className="animate-bee" /> : <Save size={16} />}
                    {saving ? ' Guardando...' : ' Guardar Cambios'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeSection === 'seguridad' && (
            <div
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-xl)',
              }}
              className="animate-in"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'hsl(var(--accent))', marginBottom: 'var(--space-xl)' }}>
                <Lock size={18} />
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                  Cambiar Contraseña
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: 480 }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', display: 'block', marginBottom: 'var(--space-sm)' }}>
                    Nueva Contraseña
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      style={{
                        width: '100%',
                        padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.9rem',
                        fontFamily: 'var(--font-datos)',
                        background: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: 4,
                      }}
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', display: 'block', marginBottom: 'var(--space-sm)' }}>
                    Confirmar Contraseña
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repetir contraseña"
                      style={{
                        width: '100%',
                        padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.9rem',
                        fontFamily: 'var(--font-datos)',
                        background: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: 4,
                      }}
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--destructive))', marginTop: 'var(--space-xs)' }}>
                      Las contraseñas no coinciden
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-gold"
                    onClick={handleChangePassword}
                    disabled={passwordSaving || !newPassword || newPassword !== confirmPassword}
                  >
                    {passwordSaving ? <Loader2 size={16} className="animate-bee" /> : <Check size={16} />}
                    {passwordSaving ? ' Actualizando...' : ' Actualizar Contraseña'}
                  </button>
                </div>
              </div>

              {/* Security Tips */}
              <div
                style={{
                  marginTop: 'var(--space-xl)',
                  padding: 'var(--space-lg)',
                  background: 'hsl(var(--info) / 0.08)',
                  border: '1px solid hsl(var(--info) / 0.2)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                  <AlertCircle size={16} style={{ color: 'hsl(var(--info))' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--info))' }}>Recomendaciones</span>
                </div>
                <ul style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', paddingLeft: '1.2rem', margin: 0, lineHeight: 1.8 }}>
                  <li>Usa al menos 8 caracteres con números y símbolos</li>
                  <li>No reutilices contraseñas de otros servicios</li>
                  <li>Cambia tu contraseña periódicamente</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'empresas' && (
            <div
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-xl)',
              }}
              className="animate-in"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'hsl(var(--accent))', marginBottom: 'var(--space-xl)' }}>
                <Building2 size={18} />
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                  Empresas Asociadas
                </h3>
              </div>

              {empresas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'hsl(var(--muted-foreground))', fontSize: '0.88rem' }}>
                  <Building2 size={32} style={{ opacity: 0.3, marginBottom: 'var(--space-md)', display: 'block', margin: '0 auto' }} />
                  No perteneces a ninguna empresa aún.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  {empresas.map(emp => (
                    <div
                      key={emp.empresa_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--space-lg)',
                        background: 'hsl(var(--muted) / 0.5)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid hsl(var(--border) / 0.5)',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 600, color: 'hsl(var(--foreground))', margin: 0, fontSize: '0.95rem' }}>
                          {emp.razon_social}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', margin: '4px 0 0' }}>
                          RUT: {emp.rut}
                        </p>
                      </div>
                      <span className={`badge ${emp.rol === 'owner' ? 'badge-gold' : 'badge-success'}`}>
                        {emp.rol === 'owner' ? 'Propietario' : emp.rol === 'contador' ? 'Contador' : emp.rol === 'operador' ? 'Operador' : 'Lectura'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'guardian' && (
            <div
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-xl)',
              }}
              className="animate-in"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'hsl(var(--accent))', marginBottom: 'var(--space-xl)' }}>
                <TreePine size={18} />
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                  Nivel Guardián
                </h3>
              </div>

              {/* Current Level */}
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-2xl)',
                  background: 'linear-gradient(135deg, hsl(var(--foreground)), hsl(var(--accent-foreground)))',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: 'var(--space-xl)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute', top: '-30%', right: '-15%',
                    width: 200, height: 200, borderRadius: '50%',
                    background: 'radial-gradient(circle, hsl(var(--accent) / 0.15) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />
                <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-sm)' }}>{guardianInfo.icon}</div>
                <h3 style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-existencial)', fontSize: '1.6rem', margin: 0 }}>
                  Nivel {guardianInfo.label}
                </h3>
                <p style={{ color: 'hsl(var(--card) / 0.6)', fontSize: '0.85rem', margin: 'var(--space-sm) 0 0' }}>
                  {guardianInfo.description}
                </p>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                <div
                  style={{
                    padding: 'var(--space-lg)',
                    background: 'hsl(var(--muted) / 0.5)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    border: '1px solid hsl(var(--border) / 0.5)',
                  }}
                >
                  <Star size={20} style={{ color: 'hsl(var(--accent))', marginBottom: 'var(--space-sm)' }} />
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'hsl(var(--foreground))', fontFamily: 'var(--font-existencial)' }}>
                    {profile.puntos_acumulados}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Puntos Acumulados
                  </div>
                </div>
                <div
                  style={{
                    padding: 'var(--space-lg)',
                    background: 'hsl(var(--muted) / 0.5)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    border: '1px solid hsl(var(--border) / 0.5)',
                  }}
                >
                  <TreePine size={20} style={{ color: 'hsl(var(--success))', marginBottom: 'var(--space-sm)' }} />
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'hsl(var(--foreground))', fontFamily: 'var(--font-existencial)' }}>
                    {profile.arboles_personal}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Árboles Plantados
                  </div>
                </div>
              </div>

              {/* Level Progress */}
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>
                  Progresión de Niveles
                </h4>
                <div style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center' }}>
                  {Object.entries(guardianLevels).map(([key, lvl]) => (
                    <div
                      key={key}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: 'var(--space-md)',
                        borderRadius: 'var(--radius-sm)',
                        background: profile.nivel_guardian === key
                          ? 'hsl(var(--accent) / 0.1)'
                          : Object.keys(guardianLevels).indexOf(key) <= Object.keys(guardianLevels).indexOf(profile.nivel_guardian)
                            ? 'hsl(var(--success) / 0.1)'
                            : 'hsl(var(--muted) / 0.5)',
                        border: `1px solid ${profile.nivel_guardian === key ? 'hsl(var(--accent) / 0.3)' : 'hsl(var(--border) / 0.5)'}`,
                        opacity: Object.keys(guardianLevels).indexOf(key) <= Object.keys(guardianLevels).indexOf(profile.nivel_guardian) ? 1 : 0.5,
                      }}
                    >
                      <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{lvl.icon}</div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{lvl.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile responsive: stack on small screens */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 280px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
