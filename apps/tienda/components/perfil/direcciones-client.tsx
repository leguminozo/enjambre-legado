'use client';

import React, { useState } from 'react';
import { toast, EmptyState, Button } from '@enjambre/ui';
import { MapPin, Star, Edit2, Trash2, Plus } from 'lucide-react';
import { DireccionForm } from './direccion-form';
import {
  type ClienteDireccion,
  type DireccionFormData,
} from '@/lib/shop/direcciones-schema';
import {
  createDireccion,
  updateDireccion,
  deleteDireccion,
  setDefaultDireccion,
} from '@/app/actions/direcciones';
import { useRouter } from 'next/navigation';

export function DireccionesClient({ initialData }: { initialData: ClienteDireccion[] }) {
  const [direcciones, setDirecciones] = useState<ClienteDireccion[]>(initialData);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async (data: DireccionFormData) => {
    const nueva = await createDireccion(data);
    setDirecciones((prev) => [nueva, ...prev.map((d) => (nueva.es_predeterminada ? { ...d, es_predeterminada: false } : d))]);
    setIsCreating(false);
    toast('Dirección añadida exitosamente', { type: 'success' });
    router.refresh();
  };

  const handleUpdate = async (id: string, data: DireccionFormData) => {
    const actualizada = await updateDireccion(id, data);
    setDirecciones((prev) => prev.map((d) => (d.id === id ? actualizada : d)));
    setIsEditing(null);
    toast('Dirección actualizada', { type: 'success' });
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;
    try {
      await deleteDireccion(id);
      setDirecciones((prev) => prev.filter((d) => d.id !== id));
      toast('Dirección eliminada', { type: 'success' });
      router.refresh();
    } catch (error) {
      toast('Error al eliminar', { type: 'error' });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultDireccion(id);
      setDirecciones((prev) =>
        prev.map((d) => ({
          ...d,
          es_predeterminada: d.id === id,
        })).sort((a, b) => (a.es_predeterminada === b.es_predeterminada ? 0 : a.es_predeterminada ? -1 : 1))
      );
      toast('Dirección predeterminada actualizada', { type: 'success' });
      router.refresh();
    } catch (error) {
      toast('Error al actualizar', { type: 'error' });
    }
  };

  if (isCreating) {
    return (
      <div className="bg-surface-raised rounded-2xl border border-border p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-xl font-display text-accent mb-6">Añadir Nueva Dirección</h2>
        <DireccionForm onSubmit={handleCreate} onCancel={() => setIsCreating(false)} />
      </div>
    );
  }

  const editData = isEditing ? direcciones.find((d) => d.id === isEditing) : null;

  if (isEditing && editData) {
    return (
      <div className="bg-surface-raised rounded-2xl border border-border p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-xl font-display text-accent mb-6">Editar Dirección</h2>
        <DireccionForm
          initialData={editData}
          onSubmit={(data) => handleUpdate(editData.id, data)}
          onCancel={() => setIsEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Administra tus direcciones de envío para compras más rápidas.
        </p>
        <Button
          type="button"
          variant="gold"
          onClick={() => setIsCreating(true)}
          className="self-start sm:self-auto min-h-11 text-xs uppercase tracking-[0.1em]"
        >
          <Plus className="w-4 h-4" />
          Añadir Dirección
        </Button>
      </div>

      {direcciones.length === 0 ? (
        <EmptyState
          icon={<MapPin className="w-8 h-8 opacity-50" />}
          title="Sin direcciones"
          description="Aún no tienes direcciones guardadas."
          action={
            <Button type="button" variant="outline" onClick={() => setIsCreating(true)} className="min-h-11">
              Añadir la primera
            </Button>
          }
          className="rounded-2xl border border-dashed border-border bg-surface-sunken"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {direcciones.map((dir) => (
            <div
              key={dir.id}
              className={`relative group rounded-2xl border p-5 md:p-6 transition-all duration-300 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 ${
                dir.es_predeterminada
                  ? 'bg-surface-raised border-accent/50 shadow-[0_0_15px_rgba(var(--accent),0.1)]'
                  : 'bg-secondary/20 border-border hover:border-accent/30 hover:bg-secondary/40'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${dir.es_predeterminada ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground'}`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-foreground">{dir.etiqueta}</h3>
                    {dir.es_predeterminada && (
                      <span className="text-[0.6rem] uppercase tracking-wider text-accent font-semibold inline-flex items-center gap-1">
                        <Star className="w-3 h-3 fill-accent" /> Predeterminada
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setIsEditing(dir.id)}
                    className="p-2 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(dir.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-1 mt-2 flex-grow">
                <p className="text-foreground">{dir.nombre}</p>
                <p>{dir.telefono}</p>
                <p>{dir.direccion}</p>
                <p>
                  {dir.comuna}, {dir.ciudad}
                </p>
                <p>{dir.region}</p>
                {dir.codigo_postal && <p>CP: {dir.codigo_postal}</p>}
                {dir.instrucciones && (
                  <p className="pt-2 mt-2 border-t border-border/50 italic text-xs">
                    "{dir.instrucciones}"
                  </p>
                )}
              </div>

              {!dir.es_predeterminada && (
                <button
                  onClick={() => handleSetDefault(dir.id)}
                  className="w-full mt-2 py-2 text-xs uppercase tracking-wider font-medium text-muted-foreground hover:text-accent border border-dashed border-border hover:border-accent rounded-lg transition-colors"
                >
                  Establecer como predeterminada
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
