'use client';

import React, { useState, useTransition } from 'react';
import { toast } from '@enjambre/ui';
import { type DireccionFormData, direccionSchema } from '@/lib/shop/direcciones-schema';
import { ZodError } from 'zod';

interface DireccionFormProps {
  initialData?: DireccionFormData;
  onSubmit: (data: DireccionFormData) => Promise<void>;
  onCancel: () => void;
}

const defaultData: DireccionFormData = {
  etiqueta: 'Principal',
  nombre: '',
  telefono: '',
  direccion: '',
  comuna: '',
  ciudad: '',
  region: '',
  codigo_postal: '',
  instrucciones: '',
};

export function DireccionForm({ initialData, onSubmit, onCancel }: DireccionFormProps) {
  const [formData, setFormData] = useState<DireccionFormData>(initialData || defaultData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const parsed = direccionSchema.parse(formData);
      startTransition(async () => {
        try {
          await onSubmit(parsed);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al guardar';
          toast(message, { type: 'error' });
        }
      });
    } catch (err) {
      if (err instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        for (const issue of err.issues) {
          newErrors[issue.path[0] as string] = issue.message;
        }
        setErrors(newErrors);
        toast('Revisa los campos con error', { type: 'error' });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-1.5 md:col-span-2">
        <label htmlFor="etiqueta" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Etiqueta (Ej: Casa, Oficina) *
        </label>
        <input
          id="etiqueta"
          name="etiqueta"
          value={formData.etiqueta}
          onChange={handleChange}
          disabled={isPending}
          className={`w-full bg-secondary border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-all ${
            errors.etiqueta ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.etiqueta && <p className="text-xs text-destructive ml-1">{errors.etiqueta}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="nombre" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Nombre de quien recibe *
        </label>
        <input
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          disabled={isPending}
          className={`w-full bg-secondary border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-all ${
            errors.nombre ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.nombre && <p className="text-xs text-destructive ml-1">{errors.nombre}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="telefono" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Teléfono de contacto *
        </label>
        <input
          id="telefono"
          name="telefono"
          value={formData.telefono}
          onChange={handleChange}
          disabled={isPending}
          placeholder="+569"
          className={`w-full bg-secondary border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-all ${
            errors.telefono ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.telefono && <p className="text-xs text-destructive ml-1">{errors.telefono}</p>}
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <label htmlFor="direccion" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Dirección y Número *
        </label>
        <input
          id="direccion"
          name="direccion"
          value={formData.direccion}
          onChange={handleChange}
          disabled={isPending}
          className={`w-full bg-secondary border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-all ${
            errors.direccion ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.direccion && <p className="text-xs text-destructive ml-1">{errors.direccion}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="comuna" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Comuna *
        </label>
        <input
          id="comuna"
          name="comuna"
          value={formData.comuna}
          onChange={handleChange}
          disabled={isPending}
          className={`w-full bg-secondary border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-all ${
            errors.comuna ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.comuna && <p className="text-xs text-destructive ml-1">{errors.comuna}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="ciudad" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Ciudad *
        </label>
        <input
          id="ciudad"
          name="ciudad"
          value={formData.ciudad}
          onChange={handleChange}
          disabled={isPending}
          className={`w-full bg-secondary border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-all ${
            errors.ciudad ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.ciudad && <p className="text-xs text-destructive ml-1">{errors.ciudad}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="region" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Región *
        </label>
        <input
          id="region"
          name="region"
          value={formData.region}
          onChange={handleChange}
          disabled={isPending}
          className={`w-full bg-secondary border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-all ${
            errors.region ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.region && <p className="text-xs text-destructive ml-1">{errors.region}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="codigo_postal" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Código Postal (Opcional)
        </label>
        <input
          id="codigo_postal"
          name="codigo_postal"
          value={formData.codigo_postal || ''}
          onChange={handleChange}
          disabled={isPending}
          className={`w-full bg-secondary border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-all ${
            errors.codigo_postal ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.codigo_postal && <p className="text-xs text-destructive ml-1">{errors.codigo_postal}</p>}
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <label htmlFor="instrucciones" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
          Instrucciones adicionales para el envío (Opcional)
        </label>
        <textarea
          id="instrucciones"
          name="instrucciones"
          value={formData.instrucciones || ''}
          onChange={handleChange}
          disabled={isPending}
          rows={3}
          className={`w-full bg-secondary border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-all resize-none ${
            errors.instrucciones ? 'border-destructive' : 'border-border'
          }`}
        />
        {errors.instrucciones && <p className="text-xs text-destructive ml-1">{errors.instrucciones}</p>}
      </div>

      <div className="md:col-span-2 flex items-center justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-5 py-2.5 rounded-xl border border-border text-xs uppercase tracking-[0.1em] text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-accent text-accent-foreground text-xs uppercase tracking-[0.15em] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
