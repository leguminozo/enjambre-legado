import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

export interface ProfileData {
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

export interface EmpresaMember {
  empresa_id: string;
  razon_social: string;
  rut: string;
  rol: string;
}

export function usePerfil() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [empresas, setEmpresas] = useState<EmpresaMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editName, setEditName] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  async function fetchProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profErr) throw profErr;
      setProfile(prof as ProfileData);
      setEditName(prof.full_name || "");

      const { data: ueData } = await supabase
        .from("usuarios_empresas")
        .select("empresa_id, rol, empresas(id, razon_social, rut)")
        .eq("user_id", session.user.id);

      if (ueData) {
        const mapped: EmpresaMember[] = ueData.map((ue: Record<string, unknown>) => ({
          empresa_id: ue.empresa_id as string,
          razon_social: ((ue.empresas as Record<string, unknown>)?.razon_social as string) ?? "—",
          rut: ((ue.empresas as Record<string, unknown>)?.rut as string) ?? "—",
          rol: ue.rol as string,
        }));
        setEmpresas(mapped);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error cargando perfil" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  async function handleSaveProfile() {
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: editName })
        .eq("id", profile.id);
      if (error) throw error;
      setProfile((prev) => (prev ? { ...prev, full_name: editName } : null));
      setEditMode(false);
      setMessage({ type: "success", text: "Perfil actualizado" });
    } catch (error) {
      console.error("[perfil] save error:", error);
      setMessage({ type: "error", text: "Error guardando perfil" });
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxBytes = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Solo se permiten imágenes (JPEG, PNG, WEBP, GIF)" });
      return;
    }
    if (file.size > maxBytes) {
      setMessage({ type: "error", text: "El tamaño máximo permitido es 2MB" });
      return;
    }

    setAvatarUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${profile.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);
      if (updateErr) throw updateErr;
      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null));
      setMessage({ type: "success", text: "Avatar actualizado" });
    } catch (error) {
      console.error("[perfil] avatar upload error:", error);
      setMessage({ type: "error", text: "Error subiendo avatar" });
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Mínimo 6 caracteres" });
      return;
    }
    setPasswordSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "Contraseña actualizada" });
    } catch (error) {
      console.error("[perfil] password change error:", error);
      setMessage({ type: "error", text: "Error cambiando contraseña" });
    } finally {
      setPasswordSaving(false);
    }
  }

  const cancelEdit = () => {
    if (profile) {
      setEditName(profile.full_name || "");
    }
    setEditMode(false);
  };

  return {
    profile,
    empresas,
    loading,
    saving,
    editMode,
    setEditMode,
    cancelEdit,
    message,
    setMessage,
    editName,
    setEditName,
    avatarUploading,
    fileInputRef,
    currentPassword,
    setCurrentPassword,
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
  };
}
