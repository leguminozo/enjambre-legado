'use client';

import { useState } from 'react';
import { Building2, Pencil, Check, X, Plus, Loader2, MapPin, Briefcase } from 'lucide-react';
import { toast, Button, friendlyError } from '@enjambre/ui';
import { formatearRUT, validarRUT } from '@enjambre/contable';
import { supabase } from '@/lib/supabase';
import type { PerfilFragmentProps } from './constants';
import type { EmpresaMember } from '../perfil/use-perfil';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  contador: 'Contador',
  operador: 'Operador',
  lectura: 'Lectura',
};

export function EmpresasSection({ empresas, profile, refetchProfile }: PerfilFragmentProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState({
    razon_social: '',
    rut: '',
    giro: '',
    direccion: '',
  });

  const [isCreating, setIsCreating] = useState(false);
  const [creatingSaving, setCreatingSaving] = useState(false);
  const [newCompanyValues, setNewCompanyValues] = useState({
    razon_social: '',
    rut: '',
    giro: '',
    direccion: '',
  });

  const isPlatformAdmin = profile?.role === 'admin';

  function canEditEmpresa(emp: EmpresaMember) {
    if (isPlatformAdmin) return true;
    return emp.rol === 'owner' || emp.rol === 'operador' || emp.rol === 'contador';
  }

  function startEdit(emp: EmpresaMember) {
    setEditingId(emp.empresa_id);
    setFormValues({
      razon_social: emp.razon_social === '—' ? '' : emp.razon_social,
      rut: emp.rut === '—' ? '' : emp.rut,
      giro: emp.giro || '',
      direccion: emp.direccion || '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;

    const cleanRazonSocial = formValues.razon_social.trim();
    const cleanRut = formValues.rut.trim();

    if (!cleanRazonSocial) {
      toast.error('Ingresa la razón social de la empresa');
      return;
    }

    if (!cleanRut || !validarRUT(cleanRut)) {
      toast.error('Ingresa un RUT válido con dígito verificador (ej. 76.543.210-K)');
      return;
    }

    setSaving(true);
    try {
      const formattedRut = formatearRUT(cleanRut);
      const { error } = await supabase
        .from('empresas')
        .update({
          razon_social: cleanRazonSocial,
          rut: formattedRut,
          giro: formValues.giro.trim() || null,
          direccion: formValues.direccion.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (error) throw error;

      toast.success('Datos de la empresa actualizados correctamente');
      setEditingId(null);
      if (refetchProfile) {
        await refetchProfile();
      }
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateEmpresa(e: React.FormEvent) {
    e.preventDefault();
    const cleanRazonSocial = newCompanyValues.razon_social.trim();
    const cleanRut = newCompanyValues.rut.trim();

    if (!cleanRazonSocial) {
      toast.error('Ingresa la razón social de la nueva empresa');
      return;
    }

    if (!cleanRut || !validarRUT(cleanRut)) {
      toast.error('Ingresa un RUT válido con dígito verificador (ej. 76.543.210-K)');
      return;
    }

    setCreatingSaving(true);
    try {
      const formattedRut = formatearRUT(cleanRut);
      const { data: newEmp, error: empErr } = await supabase
        .from('empresas')
        .insert({
          razon_social: cleanRazonSocial,
          rut: formattedRut,
          giro: newCompanyValues.giro.trim() || null,
          direccion: newCompanyValues.direccion.trim() || null,
        })
        .select('id')
        .single();

      if (empErr) throw empErr;

      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user && newEmp) {
        const { error: linkErr } = await supabase.from('usuarios_empresas').insert({
          user_id: authData.user.id,
          empresa_id: newEmp.id,
          rol: 'owner',
        });
        if (linkErr) throw linkErr;
      }

      toast.success('Empresa registrada y vinculada exitosamente');
      setIsCreating(false);
      setNewCompanyValues({ razon_social: '', rut: '', giro: '', direccion: '' });
      if (refetchProfile) {
        await refetchProfile();
      }
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setCreatingSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors';

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-accent">
          <Building2 size={20} />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Empresas Asociadas
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gestión de razón social, RUT y datos tributarios oficiales
            </p>
          </div>
        </div>

        {isPlatformAdmin && !isCreating && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCreating(true)}
            className="gap-1.5 text-xs"
          >
            <Plus size={14} />
            <span>Nueva Empresa</span>
          </Button>
        )}
      </div>

      {/* Formulario de Registro de Nueva Empresa (si está activo) */}
      {isCreating && (
        <form
          onSubmit={(e) => void handleCreateEmpresa(e)}
          className="p-5 rounded-xl border border-primary/30 bg-surface-sunken space-y-4 animate-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Plus size={14} />
              Registrar Nueva Empresa
            </span>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-foreground">Razón Social *</span>
              <input
                required
                type="text"
                placeholder="Ej: Enjambre Legado SpA"
                value={newCompanyValues.razon_social}
                onChange={(e) =>
                  setNewCompanyValues((prev) => ({ ...prev, razon_social: e.target.value }))
                }
                className={inputClass}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-foreground">RUT Tributario *</span>
              <input
                required
                type="text"
                placeholder="Ej: 76.543.210-K"
                value={newCompanyValues.rut}
                onChange={(e) =>
                  setNewCompanyValues((prev) => ({ ...prev, rut: e.target.value }))
                }
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    setNewCompanyValues((prev) => ({ ...prev, rut: formatearRUT(e.target.value) }));
                  }
                }}
                className={inputClass}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-foreground">Giro Comercial</span>
              <input
                type="text"
                placeholder="Ej: Apicultura y comercialización de productos agrícolas"
                value={newCompanyValues.giro}
                onChange={(e) =>
                  setNewCompanyValues((prev) => ({ ...prev, giro: e.target.value }))
                }
                className={inputClass}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-foreground">Dirección Fiscal</span>
              <input
                type="text"
                placeholder="Ej: Camino a Huillinco Km 4, Chonchi"
                value={newCompanyValues.direccion}
                onChange={(e) =>
                  setNewCompanyValues((prev) => ({ ...prev, direccion: e.target.value }))
                }
                className={inputClass}
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(false)}
              disabled={creatingSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={creatingSaving} className="gap-1.5">
              {creatingSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Registrar Empresa</span>
            </Button>
          </div>
        </form>
      )}

      {/* Lista de Empresas */}
      {empresas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm bg-surface-sunken/40 rounded-xl border border-dashed border-border">
          <Building2 size={32} className="mx-auto opacity-30 mb-3 text-muted-foreground" />
          No perteneces a ninguna empresa aún.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {empresas.map((emp) => {
            const isEditing = editingId === emp.empresa_id;
            const canEdit = canEditEmpresa(emp);

            if (isEditing) {
              return (
                <form
                  key={emp.empresa_id}
                  onSubmit={(e) => void handleSaveEdit(e)}
                  className="p-5 rounded-xl border border-primary bg-surface-sunken space-y-4 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Pencil size={13} />
                      Editar Datos de la Empresa
                    </span>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-foreground">Razón Social *</span>
                      <input
                        required
                        type="text"
                        value={formValues.razon_social}
                        onChange={(e) =>
                          setFormValues((prev) => ({ ...prev, razon_social: e.target.value }))
                        }
                        className={inputClass}
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-foreground">RUT Tributario *</span>
                      <input
                        required
                        type="text"
                        value={formValues.rut}
                        onChange={(e) => setFormValues((prev) => ({ ...prev, rut: e.target.value }))}
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            setFormValues((prev) => ({ ...prev, rut: formatearRUT(e.target.value) }));
                          }
                        }}
                        className={inputClass}
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-foreground">Giro Comercial</span>
                      <input
                        type="text"
                        placeholder="Ej: Producción apícola de origen"
                        value={formValues.giro}
                        onChange={(e) =>
                          setFormValues((prev) => ({ ...prev, giro: e.target.value }))
                        }
                        className={inputClass}
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-foreground">Dirección Fiscal</span>
                      <input
                        type="text"
                        placeholder="Ej: Chiloé, Chile"
                        value={formValues.direccion}
                        onChange={(e) =>
                          setFormValues((prev) => ({ ...prev, direccion: e.target.value }))
                        }
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      <span>Guardar Cambios</span>
                    </Button>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={emp.empresa_id}
                className="p-4 bg-secondary/40 border border-border/60 rounded-xl space-y-3 transition-colors hover:border-border"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-sm truncate">
                        {emp.razon_social}
                      </p>
                      <span className="badge badge-gold px-2 py-0.5 rounded-md text-[11px] font-semibold border border-accent/20">
                        {ROLE_LABELS[emp.rol] || emp.rol}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      RUT: <strong className="text-foreground">{emp.rut}</strong>
                    </p>
                  </div>

                  {canEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(emp)}
                      className="gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <Pencil size={13} />
                      <span>Editar</span>
                    </Button>
                  )}
                </div>

                {(emp.giro || emp.direccion) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                    {emp.giro && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Briefcase size={13} className="shrink-0 text-muted-foreground/70" />
                        <span className="truncate">{emp.giro}</span>
                      </div>
                    )}
                    {emp.direccion && (
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin size={13} className="shrink-0 text-muted-foreground/70" />
                        <span className="truncate">{emp.direccion}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
